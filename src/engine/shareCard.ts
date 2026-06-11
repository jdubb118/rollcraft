/**
 * Share card renderer — turns a moment (promotion, victory) into a
 * 1080×1080 image built from the player's actual sprite + identity.
 * Exports via the native share sheet when available, download otherwise.
 */
import type { Belt, Grappler } from './types';
import { getBeltSprite, getCustomSprite } from '../render/BeltSprites';
import { track } from './analytics';

const SIZE = 1080;

const BELT_COLORS: Record<Belt, string> = {
  white: '#f0f0f0', blue: '#2563eb', purple: '#7c3aed', brown: '#8b4513', black: '#1a1a1a',
};
const BELT_TRIM: Record<Belt, string> = {
  white: '#999', blue: '#1d4ed8', purple: '#5b21b6', brown: '#5c2d0c', black: '#444',
};

export interface ShareCardOptions {
  kind: 'promotion' | 'victory' | 'champion';
  player: Grappler;
  record: { wins: number; losses: number };
  // victory extras
  opponentName?: string;
  method?: string;
}

async function ensureFont(): Promise<void> {
  try {
    await document.fonts.load('16px "Press Start 2P"');
    await document.fonts.ready;
  } catch { /* fall back to monospace */ }
}

function px(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center') {
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function loadSprite(player: Grappler): HTMLImageElement | null {
  if (player.customSprite) {
    const img = getCustomSprite(player.customSprite);
    if (img) return img;
  }
  return getBeltSprite(player.belt);
}

// Sprites load async through the render-loop caches; give them a beat.
async function waitForSprite(player: Grappler, tries = 20): Promise<HTMLImageElement | null> {
  for (let i = 0; i < tries; i++) {
    const img = loadSprite(player);
    if (img) return img;
    await new Promise(r => setTimeout(r, 150));
  }
  return null;
}

export async function renderShareCard(opts: ShareCardOptions): Promise<HTMLCanvasElement> {
  await ensureFont();
  const sprite = await waitForSprite(opts.player);

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const beltColor = BELT_COLORS[opts.player.belt];

  // ── Background: deep navy with a subtle mat-line grid ──
  const grad = ctx.createLinearGradient(0, 0, 0, SIZE);
  grad.addColorStop(0, '#0d0d1f');
  grad.addColorStop(1, '#06060e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= SIZE; i += 72) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(SIZE, i); ctx.stroke();
  }

  // Center mat circle (like the battle mat)
  ctx.strokeStyle = 'rgba(255,215,0,0.08)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(SIZE / 2, 520, 300, 0, Math.PI * 2);
  ctx.stroke();

  // ── Frame border in belt color ──
  ctx.strokeStyle = beltColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(28, 28, SIZE - 56, SIZE - 56);
  ctx.strokeStyle = BELT_TRIM[opts.player.belt];
  ctx.lineWidth = 3;
  ctx.strokeRect(44, 44, SIZE - 88, SIZE - 88);

  // ── Header ──
  px(ctx, 'GRAPPLE QUEST', SIZE / 2, 110, 42, '#ffd700');
  px(ctx, 'THE BJJ JOURNEY', SIZE / 2, 160, 16, '#666');

  // ── Headline by kind ──
  const headline =
    opts.kind === 'promotion' ? `${opts.player.belt.toUpperCase()} BELT` :
    opts.kind === 'champion' ? 'WORLD CHAMPION' : 'VICTORY';
  const headColor = opts.kind === 'victory' ? '#22c55e' : opts.kind === 'champion' ? '#ffd700' : beltColor;
  px(ctx, headline, SIZE / 2, 250, 56, headColor);
  if (opts.kind === 'promotion') {
    px(ctx, 'PROMOTED', SIZE / 2, 200, 20, '#aaa');
  } else if (opts.kind === 'victory' && opts.opponentName) {
    px(ctx, `def. ${opts.opponentName.toUpperCase()}${opts.method ? ` BY ${opts.method.toUpperCase()}` : ''}`, SIZE / 2, 305, 18, '#aaa');
  }

  // ── Sprite, point-upscaled huge ──
  const spriteSize = 384;
  const sx = (SIZE - spriteSize) / 2;
  const sy = 360;
  // Glow pad behind the sprite
  const glow = ctx.createRadialGradient(SIZE / 2, sy + spriteSize / 2, 40, SIZE / 2, sy + spriteSize / 2, 280);
  glow.addColorStop(0, 'rgba(255,215,0,0.10)');
  glow.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - 120, sy - 80, spriteSize + 240, spriteSize + 160);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(SIZE / 2, sy + spriteSize - 6, 150, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  if (sprite) {
    ctx.drawImage(sprite, sx, sy, spriteSize, spriteSize);
  } else {
    // Fallback silhouette block so the card still works
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(sx + 96, sy + 48, 192, 288);
  }

  // ── Belt band ──
  const bandY = 800;
  ctx.fillStyle = beltColor;
  ctx.fillRect(SIZE / 2 - 260, bandY, 520, 26);
  ctx.fillStyle = BELT_TRIM[opts.player.belt];
  ctx.fillRect(SIZE / 2 - 24, bandY - 4, 48, 34);

  // ── Identity ──
  px(ctx, opts.player.name.toUpperCase(), SIZE / 2, 870, 36, '#fff');
  if (opts.player.gymName) {
    px(ctx, opts.player.gymName.toUpperCase(), SIZE / 2, 915, 18, '#888');
  }
  px(ctx, `${opts.record.wins}W - ${opts.record.losses}L`, SIZE / 2, 955, 18, '#ffd700');

  // ── Footer ──
  px(ctx, 'PLAY FREE — GRAPPLEQUEST.COM', SIZE / 2, 1012, 16, '#555');

  return canvas;
}

/** Share via the native sheet when possible, otherwise download. Returns how it shipped. */
export async function shareCard(opts: ShareCardOptions): Promise<'shared' | 'downloaded' | 'failed'> {
  try {
    const canvas = await renderShareCard(opts);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return 'failed';

    const file = new File([blob], `grapple-quest-${opts.kind}.png`, { type: 'image/png' });
    const shareText = opts.kind === 'promotion'
      ? `Just got promoted to ${opts.player.belt} belt in Grapple Quest 🥋 grapplequest.com`
      : opts.kind === 'champion'
        ? `WORLD CHAMPION in Grapple Quest 🥋🏆 grapplequest.com`
        : `Got the W in Grapple Quest 🥋 grapplequest.com`;

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: shareText });
      track('share-clicked', `${opts.kind}-native`);
      return 'shared';
    }

    // Download fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    track('share-clicked', `${opts.kind}-download`);
    return 'downloaded';
  } catch (err) {
    // AbortError = user closed the share sheet; not a failure worth surfacing
    if ((err as Error).name === 'AbortError') return 'shared';
    console.warn('[shareCard] failed:', err);
    return 'failed';
  }
}
