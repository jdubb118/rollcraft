/**
 * Character forge client — photo → full directional game character.
 * Generation runs in the background while the player keeps playing;
 * the pending job survives reloads via localStorage.
 */
import { getDeviceId, syncGymMember } from './gyms';
import { savePlayer, loadPlayer } from '../state/saveLoad';
import { track } from './analytics';

const JOB_KEY = 'rollcraft-char-job';

// ── Rotation trimming ──
// PixelLab returns each rotation on a padded canvas (e.g. 60×60 with a ~28px
// character floating in transparency). Untrimmed, the overworld's 20px player
// box renders you as a speck. Trim all four frames to a SHARED square around
// the character (consistent size across directions), feet bottom-anchored.

function loadDataImg(b64: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `data:image/png;base64,${b64}`;
  });
}

function alphaBBox(img: HTMLImageElement): { x: number; y: number; w: number; h: number } | null {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export async function trimRotations(rot: CharacterRotations): Promise<CharacterRotations> {
  const dirs = ['south', 'north', 'east', 'west'] as const;
  const imgs = await Promise.all(dirs.map(d => loadDataImg(rot[d])));
  const boxes = imgs.map(img => (img ? alphaBBox(img) : null));
  if (imgs.some(i => !i) || boxes.some(b => !b)) return rot; // can't trim — ship as-is

  const side = Math.max(...boxes.map(b => Math.max(b!.w, b!.h))) + 2;
  const out = {} as CharacterRotations;
  for (let i = 0; i < dirs.length; i++) {
    const img = imgs[i]!;
    const b = boxes[i]!;
    const c = document.createElement('canvas');
    c.width = side; c.height = side;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    // center horizontally on the character, feet anchored to the bottom edge
    const dx = Math.round(side / 2 - (b.x + b.w / 2));
    const dy = side - 1 - (b.y + b.h - 1);
    ctx.drawImage(img, dx, dy);
    out[dirs[i]] = c.toDataURL('image/png').split(',')[1];
  }
  return out;
}

/** One-time migration: players who forged before trimming shipped get their
 * saved rotations trimmed in place (fixes the "tiny blip" overworld render). */
export async function migrateTrimSprites(): Promise<void> {
  const player = loadPlayer();
  if (!player?.customSprites || player.spritesTrimmed) return;
  try {
    const south = await loadDataImg(player.customSprites.south);
    const box = south ? alphaBBox(south) : null;
    // Only migrate if there's real padding to remove
    if (south && box && (box.w < south.width * 0.8 || box.h < south.height * 0.8)) {
      player.customSprites = await trimRotations(player.customSprites);
      player.customSprite = player.customSprites.south;
    }
    player.spritesTrimmed = true;
    savePlayer(player);
    syncGymMember(player);
  } catch { /* never block boot on this */ }
}

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
    const trimmed = await trimRotations(data.rotations as CharacterRotations);
    equipCharacter(trimmed); // persist FIRST
    clearPendingCharacterJob();
    track('character-forge', 'completed');
    return trimmed;
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
  player.spritesTrimmed = true;
  savePlayer(player);
  syncGymMember(player);
}
