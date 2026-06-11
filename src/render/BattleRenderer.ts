import type { BattleState } from '../engine/types';
import { getGrapplerSprite, getPlayerSprite } from './SpriteData';
import { getBeltSprite, getCustomSprite } from './BeltSprites';

// Battle background images per region. v2 paths are tried first, then v1 (for graceful rollout).
const BG_URLS: Record<string, { v2: string; v1: string }> = {
  home:             { v2: '/sprites/backgrounds/bg-home-v2.png',     v1: '/sprites/backgrounds/bg-home.png' },
  'scramble-valley':{ v2: '/sprites/backgrounds/bg-scramble-v2.png', v1: '/sprites/backgrounds/bg-scramble.png' },
  'old-town':       { v2: '/sprites/backgrounds/bg-oldtown-v2.png',  v1: '/sprites/backgrounds/bg-oldtown.png' },
  'steel-mountain': { v2: '/sprites/backgrounds/bg-steel-v2.png',    v1: '/sprites/backgrounds/bg-steel.png' },
  'coral-bay':      { v2: '/sprites/backgrounds/bg-coral-v2.png',    v1: '/sprites/backgrounds/bg-coral.png' },
  'sambo-district': { v2: '/sprites/backgrounds/bg-sambo-v2.png',    v1: '/sprites/backgrounds/bg-sambo.png' },
  'nova-camp':      { v2: '/sprites/backgrounds/bg-nova-v2.png',     v1: '/sprites/backgrounds/bg-nova.png' },
  'iron-coast':     { v2: '/sprites/backgrounds/bg-iron-v2.png',     v1: '/sprites/backgrounds/bg-iron.png' },
  'summit-city':    { v2: '/sprites/backgrounds/bg-summit-v2.png',   v1: '/sprites/backgrounds/bg-summit.png' },
};

const bgCache: Record<string, HTMLImageElement | 'failed'> = {};
function loadBg(url: string): HTMLImageElement | null {
  const c = bgCache[url];
  if (c === 'failed') return null;
  if (c) return c;
  const img = new Image();
  img.onload = () => { bgCache[url] = img; };
  img.onerror = () => { bgCache[url] = 'failed'; };
  img.src = url;
  return null;
}

function getBattleBg(regionId: string): HTMLImageElement | null {
  const urls = BG_URLS[regionId];
  if (!urls) return null;
  // Try v2 first; if it's already marked failed, fall back to v1
  const v2Status = bgCache[urls.v2];
  if (v2Status === 'failed') return loadBg(urls.v1);
  return loadBg(urls.v2) ?? loadBg(urls.v1);
}
import { getRole, getPositionDisplayName } from '../data/positions';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/constants';
import { getLevel } from '../battle/stats';
import { getRegionAtmosphere } from '../data/world';
import { getNPCSprite } from './NPCSprites';
import { getArchetypeSprite } from './ArchetypeSprites';

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
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textBaseline = 'top';
  // 1px black outline — canvas text was unreadable on light backgrounds
  // (gold position text on gold tatami, names over bright mats)
  ctx.fillStyle = '#000';
  ctx.fillText(text, x - 1, y);
  ctx.fillText(text, x + 1, y);
  ctx.fillText(text, x, y - 1);
  ctx.fillText(text, x, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// Subtle 2px vertical breath for idle battle sprites at full scale. Phase offset keeps player + opponent out of sync.
function idleBreath(phase: number): number {
  return Math.round(Math.sin(Date.now() / 480 + phase) * 2);
}

export interface BattleEffects {
  shakeX?: number;
  shakeY?: number;
  flashColor?: string; // rgba string
  flashAlpha?: number; // 0-1
}

// ── Position-driven fighter composition ──
// Each mat position maps to two poses (sprite CENTERS in canvas space).
// rot is radians; a supine fighter is rotated ±90°. flipX mirrors the sprite.
interface FighterPose { x: number; y: number; rot: number; flipX: boolean }
interface BattleLayout { player: FighterPose; opponent: FighterPose; drawPlayerFirst: boolean }

const HALF_PI = Math.PI / 2;

// Poses keyed by role for asymmetric positions. Stage is roughly x 80-240, y 85-150
// (clear of the HUD bars top-left and bottom-right).
const GROUND_LAYOUTS: Record<string, { top: Omit<FighterPose, 'flipX'>; bottom: Omit<FighterPose, 'flipX'>; topBehind?: boolean }> = {
  'closed-guard':   { top: { x: 188, y: 112, rot: 0 },          bottom: { x: 142, y: 138, rot: -HALF_PI } },
  'open-guard':     { top: { x: 200, y: 110, rot: 0 },          bottom: { x: 136, y: 138, rot: -HALF_PI } },
  'half-guard':     { top: { x: 180, y: 116, rot: 0.18 },       bottom: { x: 146, y: 138, rot: -HALF_PI } },
  'side-control':   { top: { x: 152, y: 116, rot: -HALF_PI + 0.5 }, bottom: { x: 160, y: 140, rot: -HALF_PI } },
  'mount':          { top: { x: 160, y: 103, rot: 0 },          bottom: { x: 160, y: 140, rot: -HALF_PI } },
  'back-control':   { top: { x: 146, y: 110, rot: 0.12 },       bottom: { x: 168, y: 120, rot: 0.35 }, topBehind: true },
  'turtle':         { top: { x: 166, y: 106, rot: 0.25 },       bottom: { x: 152, y: 142, rot: -HALF_PI } },
  'knee-on-belly':  { top: { x: 178, y: 108, rot: 0 },          bottom: { x: 148, y: 140, rot: -HALF_PI } },
  'north-south':    { top: { x: 160, y: 112, rot: HALF_PI },    bottom: { x: 160, y: 142, rot: -HALF_PI } },
};

function getPositionLayout(state: BattleState): BattleLayout {
  // Battle over → winner stands over the beaten opponent
  if (state.phase === 'battle-over' && state.winner) {
    const winnerPose: FighterPose = { x: 160, y: 104, rot: 0, flipX: state.winner === 'opponent' };
    const loserPose: FighterPose = { x: 160, y: 142, rot: -HALF_PI, flipX: state.winner === 'player' };
    return state.winner === 'player'
      ? { player: winnerPose, opponent: loserPose, drawPlayerFirst: false }
      : { player: loserPose, opponent: winnerPose, drawPlayerFirst: true };
  }

  // Symmetric positions — squared-up neutral stances
  if (state.position === 'standing') {
    return {
      player:   { x: 95,  y: 122, rot: 0, flipX: false },
      opponent: { x: 225, y: 102, rot: 0, flipX: true },
      drawPlayerFirst: false,
    };
  }
  if (state.position === 'clinch') {
    return {
      player:   { x: 134, y: 116, rot: 0, flipX: false },
      opponent: { x: 186, y: 108, rot: 0, flipX: true },
      drawPlayerFirst: false,
    };
  }
  if (state.position === 'leg-entanglement') {
    return {
      player:   { x: 116, y: 134, rot: HALF_PI, flipX: false },
      opponent: { x: 204, y: 134, rot: -HALF_PI, flipX: true },
      drawPlayerFirst: false,
    };
  }

  // Asymmetric ground positions
  const ground = GROUND_LAYOUTS[state.position];
  if (!ground || !state.topFighter) {
    // Unknown — fall back to the standing arrangement
    return {
      player:   { x: 95,  y: 122, rot: 0, flipX: false },
      opponent: { x: 225, y: 102, rot: 0, flipX: true },
      drawPlayerFirst: false,
    };
  }

  const playerIsTop = state.topFighter === 'player';
  const playerPose: FighterPose = { ...(playerIsTop ? ground.top : ground.bottom), flipX: false };
  const opponentPose: FighterPose = { ...(playerIsTop ? ground.bottom : ground.top), flipX: true };
  // Bottom fighter draws first (underneath) — unless topBehind flips it
  const topDrawsLast = !ground.topBehind;
  const drawPlayerFirst = topDrawsLast ? !playerIsTop : playerIsTop;
  return { player: playerPose, opponent: opponentPose, drawPlayerFirst };
}

/** Live particle/FX anchors that follow the position layout. */
export function getBattleAnchors(state: BattleState): { playerCenter: { x: number; y: number }; opponentCenter: { x: number; y: number }; midpoint: { x: number; y: number } } {
  const layout = getPositionLayout(state);
  const playerCenter = { x: layout.player.x, y: layout.player.y };
  const opponentCenter = { x: layout.opponent.x, y: layout.opponent.y };
  return {
    playerCenter,
    opponentCenter,
    midpoint: { x: (playerCenter.x + opponentCenter.x) / 2, y: (playerCenter.y + opponentCenter.y) / 2 },
  };
}

export function renderBattle(ctx: CanvasRenderingContext2D, state: BattleState, animFrame: number, regionId?: string, effects?: BattleEffects) {
  ctx.save();
  const sx = effects?.shakeX ?? 0;
  const sy = effects?.shakeY ?? 0;
  if (sx || sy) ctx.translate(sx, sy);

  ctx.clearRect(-8, -8, CANVAS_WIDTH + 16, CANVAS_HEIGHT + 16);

  // Draw AI background if available, otherwise fallback to drawn mat
  const bg = regionId ? getBattleBg(regionId) : null;
  if (bg) {
    ctx.drawImage(bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    drawMat(ctx);
  }

  // Regional tint overlay on the background (before sprites, so it washes the scene not the characters)
  const tint = regionId ? getRegionAtmosphere(regionId).tint : undefined;
  if (tint) {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  const scale = 4;
  const idle = animFrame === 0;

  // ── Resolve sprites ──
  // Opponent priority: named NPC sprite → archetype (style × belt) → programmatic
  const oppId = state.opponent.grappler.id;
  const isNamedNPC = oppId && !oppId.startsWith('random-') && !oppId.startsWith('challenge-');
  const opponentSprite: HTMLCanvasElement | HTMLImageElement =
    (isNamedNPC ? getNPCSprite(oppId!, 'down') : null) ??
    getArchetypeSprite(state.opponent.grappler.style, state.opponent.grappler.belt) ??
    getGrapplerSprite(state.opponent.grappler.style, scale, state.opponent.grappler.belt);

  // Player priority: custom sprite → belt evolution sprite → programmatic
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

  // ── Position-driven composition ──
  // The mat position decides where the two fighters are and how they lie.
  // Bottom fighter in ground positions is drawn rotated (supine); the top
  // fighter stays upright or leans over them. The fight is WATCHED now,
  // not just read off the log.
  const layout = getPositionLayout(state);
  const plBreath = idle ? idleBreath(0) : 0;
  const opBreath = idle ? idleBreath(1.5) : 0;
  const attackJitter = animFrame > 0 && animFrame < 4 ? Math.sin(animFrame * 5) * 3 : 0;

  const drawOrder: ('player' | 'opponent')[] = layout.drawPlayerFirst
    ? ['player', 'opponent'] : ['opponent', 'player'];

  for (const who of drawOrder) {
    const pose = who === 'player' ? layout.player : layout.opponent;
    const sprite = who === 'player' ? playerSprite : opponentSprite;
    const breath = who === 'player' ? plBreath : opBreath;
    const jitter = who === 'opponent' ? attackJitter : 0;

    // Ground shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.beginPath();
    const shadowY = pose.rot !== 0 ? pose.y + 20 : pose.y + 28;
    ctx.ellipse(pose.x, shadowY, pose.rot !== 0 ? 30 : 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(pose.x + jitter, pose.y + breath);
    if (pose.rot !== 0) ctx.rotate(pose.rot);
    if (pose.flipX) ctx.scale(-1, 1);
    ctx.drawImage(sprite, -32, -32, 64, 64);
    ctx.restore();
  }

  // Hit flash — event-typed colour takes precedence, fallback to plain white during attack anim
  const flashColor = effects?.flashColor;
  const flashAlpha = effects?.flashAlpha ?? 0;
  if (flashColor && flashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = flashColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  } else if (animFrame > 0 && animFrame < 3) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // ── Opponent HUD — stamina is the hero bar (it decides BJJ matches), HP is secondary ──
  drawPixelText(ctx, state.opponent.grappler.name.substring(0, 12).toUpperCase(), 10, 6, 8, '#fff');
  drawPixelText(ctx, `Lv${getLevel(state.opponent.grappler)}`, CANVAS_WIDTH - 50, 6, 7, '#aaa');
  const opHpColor = getHpColor(state.opponent.currentHp, state.opponent.stats.maxHp);
  const opStaColor = getStaminaColor(state.opponent.currentStamina, state.opponent.maxStamina);
  drawBar(ctx, 10, 20, 140, 10, state.opponent.currentStamina, state.opponent.maxStamina, opStaColor, '#222', 'STA');
  drawBar(ctx, 10, 33, 140, 5, state.opponent.currentHp, state.opponent.stats.maxHp, opHpColor, '#222');
  if (state.opponent.isGassed) drawPixelText(ctx, 'GASSED!', 155, 21, 7, '#ef4444');

  // Momentum indicator for opponent
  if (state.opponent.momentum > 0 && !state.opponent.isGassed) {
    const momText = '🔥'.repeat(state.opponent.momentum);
    drawPixelText(ctx, momText, 155, 20, 7, '#ff9800');
  }

  // ── Player HUD — stamina hero bar ──
  drawPixelText(ctx, state.player.grappler.name.substring(0, 12).toUpperCase(), CANVAS_WIDTH - 155, CANVAS_HEIGHT - 48, 8, '#fff');
  drawPixelText(ctx, `Lv${getLevel(state.player.grappler)}`, CANVAS_WIDTH - 50, CANVAS_HEIGHT - 48, 7, '#aaa');
  const plHpColor = getHpColor(state.player.currentHp, state.player.stats.maxHp);
  const plStaColor = getStaminaColor(state.player.currentStamina, state.player.maxStamina);
  drawBar(ctx, CANVAS_WIDTH - 155, CANVAS_HEIGHT - 33, 140, 10, state.player.currentStamina, state.player.maxStamina, plStaColor, '#222', 'STA');
  drawBar(ctx, CANVAS_WIDTH - 155, CANVAS_HEIGHT - 20, 140, 5, state.player.currentHp, state.player.stats.maxHp, plHpColor, '#222');
  if (state.player.isGassed) drawPixelText(ctx, 'GASSED!', CANVAS_WIDTH - 155, CANVAS_HEIGHT - 42, 7, '#ef4444');

  // Momentum indicator for player
  if (state.player.momentum > 0) {
    const momText = '🔥'.repeat(state.player.momentum);
    drawPixelText(ctx, momText, CANVAS_WIDTH - 175, CANVAS_HEIGHT - 33, 7, '#ff9800');
  }

  // ── Position indicator ──
  const playerRole = getRole(state.position, state.topFighter, 'player');
  const posDisplay = getPositionDisplayName(state.position, playerRole);
  ctx.textAlign = 'center';
  drawPixelText(ctx, posDisplay.toUpperCase(), CANVAS_WIDTH / 2 - posDisplay.length * 3, CANVAS_HEIGHT / 2 + 58, 7, '#ffd700');
  ctx.textAlign = 'start';

  // ── Positional pressure pips — who's settling in on top ──
  if (state.control.by && state.control.turns >= 1) {
    const pips = '▰'.repeat(Math.min(4, state.control.turns));
    const isPlayerControl = state.control.by === 'player';
    const px2 = isPlayerControl ? CANVAS_WIDTH - 155 : 10;
    const py2 = isPlayerControl ? CANVAS_HEIGHT - 56 : 44;
    drawPixelText(ctx, `PRESSURE ${pips}`, px2, py2, 6, '#ff9800');
  }

  ctx.restore();
}

// Static fallback anchors — prefer getBattleAnchors(state), which follows
// the live position layout.
export const BATTLE_ANCHORS = {
  opponentCenter: { x: 225, y: 102 },
  playerCenter:   { x: 95,  y: 122 },
  midpoint:       { x: 160, y: 120 },
};
