import type { BattleState } from '../engine/types';
import { getGrapplerSprite, getPlayerSprite, SPRITE_W, SPRITE_H } from './SpriteData';
import { getBeltSprite, getCustomSprite } from './BeltSprites';

// Battle background images per region
const BG_URLS: Record<string, string> = {
  home: '/sprites/backgrounds/bg-home.png',
  'scramble-valley': '/sprites/backgrounds/bg-scramble.png',
  'old-town': '/sprites/backgrounds/bg-oldtown.png',
  'steel-mountain': '/sprites/backgrounds/bg-steel.png',
  'coral-bay': '/sprites/backgrounds/bg-coral.png',
  'sambo-district': '/sprites/backgrounds/bg-sambo.png',
  'nova-camp': '/sprites/backgrounds/bg-nova.png',
  'iron-coast': '/sprites/backgrounds/bg-iron.png',
  'summit-city': '/sprites/backgrounds/bg-summit.png',
};

const bgCache: Record<string, HTMLImageElement> = {};
function getBattleBg(regionId: string): HTMLImageElement | null {
  const url = BG_URLS[regionId];
  if (!url) return null;
  if (bgCache[url]) return bgCache[url];
  const img = new Image();
  img.onload = () => { bgCache[url] = img; };
  img.src = url;
  return null;
}
import { getRole, getPositionDisplayName } from '../data/positions';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/constants';
import { getLevel } from '../battle/stats';

const MAT_COLOR = '#1a4a2a';
const MAT_BORDER = '#0d2e18';
const MAT_LINE = '#2a6a3a';

function drawMat(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = MAT_COLOR;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = MAT_BORDER;
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40);
  ctx.strokeStyle = MAT_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2, 20);
  ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  ctx.stroke();
}

// Stamina bar color based on percentage
function getStaminaColor(current: number, max: number): string {
  const pct = current / max;
  if (pct > 0.5) return '#3b82f6';  // blue — healthy
  if (pct > 0.25) return '#f59e0b'; // amber — caution
  return '#ef4444';                  // red — danger
}

// HP bar color
function getHpColor(current: number, max: number): string {
  const pct = current / max;
  if (pct > 0.5) return '#22c55e';
  if (pct > 0.25) return '#f59e0b';
  return '#ef4444';
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  current: number, max: number, fillColor: string, bgColor: string,
  label?: string,
) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, w, h);
  const fillW = Math.max(0, (current / max) * w);
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, fillW, h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  // Label
  if (label) {
    ctx.fillStyle = '#fff';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(label, x + 2, y + 1);
  }
}

function drawPixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

export function renderBattle(ctx: CanvasRenderingContext2D, state: BattleState, animFrame: number, regionId?: string) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw AI background if available, otherwise fallback to drawn mat
  const bg = regionId ? getBattleBg(regionId) : null;
  if (bg) {
    ctx.drawImage(bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    drawMat(ctx);
  }

  const scale = 4;

  // Draw opponent (top-right, facing left)
  const opponentSprite = getGrapplerSprite(state.opponent.grappler.style, scale, state.opponent.grappler.belt);
  const opX = CANVAS_WIDTH - 80 - SPRITE_W * scale;
  const opY = 60;
  ctx.save();
  ctx.translate(opX + SPRITE_W * scale, opY);
  ctx.scale(-1, 1);
  // Shake opponent on hit
  if (animFrame > 0 && animFrame < 4) {
    ctx.translate(Math.sin(animFrame * 5) * 3, 0);
  }
  ctx.drawImage(opponentSprite, 0, 0);
  ctx.restore();

  // Draw player (bottom-left, facing right)
  // Priority: custom sprite > belt evolution sprite > programmatic sprite
  const customSpriteData = state.player.grappler.customSprite;
  const beltImg = customSpriteData
    ? getCustomSprite(customSpriteData)
    : getBeltSprite(state.player.grappler.belt);

  let playerSprite: HTMLCanvasElement | HTMLImageElement;
  if (beltImg) {
    playerSprite = beltImg;
  } else {
    const playerGi = state.player.grappler.giColor;
    playerSprite = playerGi
      ? getPlayerSprite(playerGi, scale, state.player.grappler.belt)
      : getGrapplerSprite(state.player.grappler.style, scale, state.player.grappler.belt);
  }
  const plX = 80;
  if (beltImg) {
    // AI sprite is 32x32, draw at 2x to match canvas scale (~64px)
    const aiScale = 2;
    const plY = CANVAS_HEIGHT - 60 - 32 * aiScale;
    ctx.drawImage(playerSprite, plX, plY, 32 * aiScale, 32 * aiScale);
  } else {
    const plY = CANVAS_HEIGHT - 60 - SPRITE_H * scale;
    ctx.drawImage(playerSprite, plX, plY);
  }

  // Hit flash (subtler)
  if (animFrame > 0 && animFrame < 3) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // ── Opponent HUD ──
  drawPixelText(ctx, state.opponent.grappler.name.substring(0, 12).toUpperCase(), 10, 6, 8, '#fff');
  drawPixelText(ctx, `Lv${getLevel(state.opponent.grappler)}`, CANVAS_WIDTH - 50, 6, 7, '#aaa');
  const opHpColor = getHpColor(state.opponent.currentHp, state.opponent.stats.maxHp);
  const opStaColor = getStaminaColor(state.opponent.currentStamina, state.opponent.maxStamina);
  drawBar(ctx, 10, 20, 140, 9, state.opponent.currentHp, state.opponent.stats.maxHp, opHpColor, '#222', 'HP');
  drawBar(ctx, 10, 32, 140, 7, state.opponent.currentStamina, state.opponent.maxStamina, opStaColor, '#222', 'STA');

  // Momentum indicator for opponent
  if (state.opponent.momentum > 0) {
    const momText = '🔥'.repeat(state.opponent.momentum);
    drawPixelText(ctx, momText, 155, 20, 7, '#ff9800');
  }

  // ── Player HUD ──
  drawPixelText(ctx, state.player.grappler.name.substring(0, 12).toUpperCase(), CANVAS_WIDTH - 155, CANVAS_HEIGHT - 48, 8, '#fff');
  drawPixelText(ctx, `Lv${getLevel(state.player.grappler)}`, CANVAS_WIDTH - 50, CANVAS_HEIGHT - 48, 7, '#aaa');
  const plHpColor = getHpColor(state.player.currentHp, state.player.stats.maxHp);
  const plStaColor = getStaminaColor(state.player.currentStamina, state.player.maxStamina);
  drawBar(ctx, CANVAS_WIDTH - 155, CANVAS_HEIGHT - 33, 140, 9, state.player.currentHp, state.player.stats.maxHp, plHpColor, '#222', 'HP');
  drawBar(ctx, CANVAS_WIDTH - 155, CANVAS_HEIGHT - 21, 140, 7, state.player.currentStamina, state.player.maxStamina, plStaColor, '#222', 'STA');

  // Momentum indicator for player
  if (state.player.momentum > 0) {
    const momText = '🔥'.repeat(state.player.momentum);
    drawPixelText(ctx, momText, CANVAS_WIDTH - 175, CANVAS_HEIGHT - 33, 7, '#ff9800');
  }

  // ── Position indicator ──
  const playerRole = getRole(state.position, state.topFighter, 'player');
  const posDisplay = getPositionDisplayName(state.position, playerRole);
  ctx.textAlign = 'center';
  drawPixelText(ctx, posDisplay.toUpperCase(), CANVAS_WIDTH / 2 - posDisplay.length * 3, CANVAS_HEIGHT / 2 + 50, 7, '#ffd700');
  ctx.textAlign = 'start';
}
