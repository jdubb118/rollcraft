/**
 * Character forge client — photo → full directional game character.
 * Generation runs in the background while the player keeps playing;
 * the pending job survives reloads via localStorage.
 */
import { getDeviceId, syncGymMember } from './gyms';
import { savePlayer, loadPlayer } from '../state/saveLoad';
import { track } from './analytics';

const JOB_KEY = 'rollcraft-char-job';

/** Center-crop (face-biased) + resize any image file to a square PNG base64. */
export async function fileToSquarePng(file: File, size = 512): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = Math.max(0, (img.height - side) / 4); // bias toward faces
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/png').split(',')[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface CharacterRotations {
  south: string; north: string; east: string; west: string; // base64 pngs
}

interface PendingJob { jobId: string; characterId: string; startedAt: number }

export function getPendingCharacterJob(): PendingJob | null {
  try {
    const j = JSON.parse(localStorage.getItem(JOB_KEY) || 'null');
    if (!j) return null;
    // Stale jobs (>30 min) are dead — PixelLab jobs finish in minutes
    if (Date.now() - j.startedAt > 30 * 60 * 1000) { localStorage.removeItem(JOB_KEY); return null; }
    return j;
  } catch { return null; }
}

export function clearPendingCharacterJob(): void {
  localStorage.removeItem(JOB_KEY);
}

/** Kick off generation. Returns true if the job started. */
export async function startCharacterForge(photoB64: string, giColorHex: string | undefined): Promise<{ ok: true } | { ok: false; error: string }> {
  // Map the stored gi hex back to a color name for the prompt
  const giColor = giColorHex === '#2563eb' ? 'blue' : giColorHex === '#1a1a2e' ? 'black' : 'white';
  try {
    const res = await fetch('/api/create-character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: photoB64, giColor, deviceId: getDeviceId() }),
    });
    const data = await res.json();
    if (!res.ok || !data.jobId) return { ok: false, error: data.error || 'Could not start' };
    localStorage.setItem(JOB_KEY, JSON.stringify({ jobId: data.jobId, characterId: data.characterId, startedAt: Date.now() }));
    track('character-forge', 'started');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || 'Network error' };
  }
}

/**
 * Poll once. Returns rotations when ready, null while processing.
 * On completion the fighter is EQUIPPED AND SAVED IMMEDIATELY — a reload
 * between completion and the reveal can't lose a 20-generation character.
 * The reveal overlay is presentation only.
 */
export async function pollCharacterForge(): Promise<CharacterRotations | null> {
  const job = getPendingCharacterJob();
  if (!job) return null;
  const res = await fetch(`/api/create-character?job=${job.jobId}&character=${job.characterId}`);
  const data = await res.json();
  if (data.status === 'completed' && data.rotations) {
    equipCharacter(data.rotations as CharacterRotations); // persist FIRST
    clearPendingCharacterJob();
    track('character-forge', 'completed');
    return data.rotations as CharacterRotations;
  }
  if (data.status === 'failed') {
    clearPendingCharacterJob();
    track('character-forge', 'failed');
    throw new Error(data.error || 'Generation failed');
  }
  return null;
}

/** Equip the forged character on the saved player + sync the gym roster. */
export function equipCharacter(rotations: CharacterRotations): void {
  const player = loadPlayer();
  if (!player) return;
  player.customSprites = rotations;
  player.customSprite = rotations.south; // back-compat: cards/roster/battle use south
  savePlayer(player);
  syncGymMember(player);
}
