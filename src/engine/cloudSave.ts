import { getSupabase } from './supabase';
import { getAuthState, subscribeAuth } from './auth';
import { loadPlayer, loadOpponent, loadProgression, savePlayer, saveOpponent, saveProgression } from '../state/saveLoad';

// Debounced cloud-sync: every meaningful save call also schedules a push.
// Push payload = current localStorage snapshot. Server stores the latest.
// Last-write-wins between devices, with `device_updated_at` informing pull-on-startup.

let _debounceHandle: number | null = null;
let _pushing = false;
let _pendingAfterPush = false;

function schedulePush() {
  if (_debounceHandle !== null) clearTimeout(_debounceHandle);
  _debounceHandle = window.setTimeout(() => { _debounceHandle = null; pushNow(); }, 1500);
}

async function pushNow() {
  const sb = getSupabase();
  const { user } = getAuthState();
  if (!sb || !user) return;
  if (_pushing) { _pendingAfterPush = true; return; }
  _pushing = true;

  const player = loadPlayer();
  const opponent = loadOpponent();
  const progression = loadProgression();

  const { error } = await sb.from('saves').upsert({
    user_id: user.id,
    player,
    opponent,
    progression,
    custom_sprite_url: player?.customSprite ?? null,
    photo_hash: null,
    device_updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  _pushing = false;
  if (error) console.warn('[cloudSave] push failed:', error.message);

  if (_pendingAfterPush) { _pendingAfterPush = false; pushNow(); }
}

// Pulls cloud save and writes to localStorage if newer (or if local has nothing).
// Returns true if it pulled and overwrote local state.
export async function pullOnStartup(): Promise<boolean> {
  const sb = getSupabase();
  const { user } = getAuthState();
  if (!sb || !user) return false;

  const { data, error } = await sb.from('saves').select('*').eq('user_id', user.id).maybeSingle();
  if (error) { console.warn('[cloudSave] pull failed:', error.message); return false; }
  if (!data || !data.player) return false;

  // If local has no player, always take cloud. If both exist, prefer cloud only when newer.
  const localPlayer = loadPlayer();
  if (!localPlayer) {
    if (data.player) savePlayer(data.player);
    if (data.opponent) saveOpponent(data.opponent);
    if (data.progression) saveProgression(data.progression);
    return true;
  }

  // Both exist — for now, prefer cloud if device_updated_at exists and is newer than 5min ago.
  // (TODO: track local updated_at to make this real LWW.)
  if (data.device_updated_at) {
    const cloudTime = new Date(data.device_updated_at).getTime();
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    if (cloudTime > fiveMinAgo) {
      if (data.player) savePlayer(data.player);
      if (data.opponent) saveOpponent(data.opponent);
      if (data.progression) saveProgression(data.progression);
      return true;
    }
  }
  return false;
}

// Hook the local saveLoad calls. Anything that mutates progression/player
// schedules a debounced cloud push.
export function notifyLocalSave(): void {
  schedulePush();
}

// Wire up: on auth change, if user signed in, pull-on-startup. Then any save schedules push.
let _wired = false;
export function wireCloudSave(): void {
  if (_wired) return;
  _wired = true;
  let lastUserId: string | null = null;
  subscribeAuth(async (state) => {
    const newUserId = state.user?.id ?? null;
    if (newUserId && newUserId !== lastUserId) {
      await pullOnStartup();
    }
    lastUserId = newUserId;
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('rollcraft-save', () => { notifyLocalSave(); });
  }
}
