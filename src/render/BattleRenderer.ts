import type { BattleState } from '../engine/types';
import { getGrapplerSprite, getPlayerSprite, SPRITE_W, SPRITE_H } from './SpriteData';
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

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  current: number, max: number, fillColor: string, bgColor: string,
) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, Math.max(0, (current / max) * w), h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

function drawPixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

export function renderBattle(ctx: CanvasRenderingContext2D, state: BattleState, animFrame: number) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawMat(ctx);

  const scale = 4;

  // Draw opponent (top-right, facing left)
  const opponentSprite = getGrapplerSprite(state.opponent.grappler.style, scale, state.opponent.grappler.belt);
  const opX = CANVAS_WIDTH - 80 - SPRITE_W * scale;
  const opY = 60;
  ctx.save();
  ctx.translate(opX + SPRITE_W * scale, opY);
  ctx.scale(-1, 1);
  ctx.drawImage(opponentSprite, 0, 0);
  ctx.restore();

  // Draw player (bottom-left, facing right)
  const playerGi = state.player.grappler.giColor;
  const playerSprite = playerGi
    ? getPlayerSprite(playerGi, scale, state.player.grappler.belt)
    : getGrapplerSprite(state.player.grappler.style, scale, state.player.grappler.belt);
  const plX = 80;
  const plY = CANVAS_HEIGHT - 60 - SPRITE_H * scale;
  ctx.drawImage(playerSprite, plX, plY);

  // Hit flash
  if (animFrame > 0 && animFrame < 4) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // Opponent HUD
  drawPixelText(ctx, state.opponent.grappler.name.substring(0, 12).toUpperCase(), 10, 8, 8, '#fff');
  drawPixelText(ctx, `Lv${getLevel(state.opponent.grappler)}`, CANVAS_WIDTH - 50, 8, 7, '#aaa');
  drawBar(ctx, 10, 22, 140, 8, state.opponent.currentHp, state.opponent.stats.maxHp, '#22c55e', '#333');
  drawBar(ctx, 10, 33, 140, 6, state.opponent.currentStamina, state.opponent.maxStamina, '#3b82f6', '#333');

  // Player HUD
  drawPixelText(ctx, state.player.grappler.name.substring(0, 12).toUpperCase(), CANVAS_WIDTH - 155, CANVAS_HEIGHT - 45, 8, '#fff');
  drawPixelText(ctx, `Lv${getLevel(state.player.grappler)}`, CANVAS_WIDTH - 50, CANVAS_HEIGHT - 45, 7, '#aaa');
  drawBar(ctx, CANVAS_WIDTH - 155, CANVAS_HEIGHT - 30, 140, 8, state.player.currentHp, state.player.stats.maxHp, '#22c55e', '#333');
  drawBar(ctx, CANVAS_WIDTH - 155, CANVAS_HEIGHT - 19, 140, 6, state.player.currentStamina, state.player.maxStamina, '#3b82f6', '#333');

  // Position indicator
  const playerRole = getRole(state.position, state.topFighter, 'player');
  const posDisplay = getPositionDisplayName(state.position, playerRole);
  drawPixelText(ctx, posDisplay.toUpperCase(), CANVAS_WIDTH / 2 - posDisplay.length * 3, CANVAS_HEIGHT / 2 + 50, 7, '#ffd700');
}
