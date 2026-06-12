import { getSupabase, isSupabaseConfigured } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  slug: string | null;
  displayName: string | null;
}

let _state: AuthState = { user: null, session: null, slug: null, displayName: null };
const _listeners = new Set<(s: AuthState) => void>();

function emit() {
  for (const fn of _listeners) fn(_state);
}

export function subscribeAuth(fn: (s: AuthState) => void): () => void {
  _listeners.add(fn);
  fn(_state);
  return () => { _listeners.delete(fn); };
}

export function getAuthState(): AuthState {
  return _state;
}

async function loadProfile(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const { data } = await sb.from('profiles').select('slug, display_name').eq('id', userId).maybeSingle();
  // Session may have changed while this fetch was in flight (anonymous boot →
  // email upgrade) — never let a stale fetch overwrite the current user.
  if (_state.user?.id !== userId) return;
  _state.slug = data?.slug ?? null;
  _state.displayName = data?.display_name ?? null;
  emit();
}

export async function initAuth(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  let { data: { session } } = await sb.auth.getSession();

  // Anonymous-first: every player gets a real account from second one, so
  // cloud save works with zero UI. Upgrading to email later (updateUser)
  // keeps the same user id — nothing is ever lost.
  if (!session) {
    const { data, error } = await sb.auth.signInAnonymously();
    if (!error) session = data.session;
  }

  _state.session = session;
  _state.user = session?.user ?? null;
  emit();
  if (_state.user) loadProfile(_state.user.id);

  sb.auth.onAuthStateChange((_event, session) => {
    _state.session = session;
    _state.user = session?.user ?? null;
    if (_state.user) loadProfile(_state.user.id);
    else { _state.slug = null; _state.displayName = null; }
    emit();
  });
}

export async function sendMagicLink(email: string, displayName?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Cloud sync not configured' };
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: displayName ? { display_name: displayName } : undefined,
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function isAnonymousUser(): boolean {
  return !!_state.user && !_state.user.email;
}

/**
 * Upgrade an anonymous account with an email — SAME user id, so the cloud
 * save and gym membership carry over. Supabase emails a confirmation link.
 */
export async function upgradeEmail(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Cloud sync not configured' };
  const { error } = await sb.auth.updateUser({ email });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function deleteAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  // Account deletion requires service-role key; route through a Netlify function.
  const sb = getSupabase();
  if (!sb || !_state.session) return { ok: false, error: 'Not signed in' };
  try {
    const res = await fetch('/.netlify/functions/delete-account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${_state.session.access_token}` },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    await sb.auth.signOut();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export { isSupabaseConfigured };
