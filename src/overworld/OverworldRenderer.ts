import type { OverworldState } from './overworldTypes';
import { TILE_SIZE, TILE_COLORS, Tile } from './tiles';
import { getGrapplerSprite, getPlayerSprite } from '../render/SpriteData';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/constants';
import type { Belt } from '../engine/types';
import { getBeltSpriteDir } from '../render/BeltSprites';
import { getRegionAtmosphere } from '../data/world';
import { getNPCSprite } from '../render/NPCSprites';
import { getTileTexture } from '../render/Tileset';
import { getRegionSurfaces } from '../render/SceneSurfaces';

const SPRITE_SCALE = 1;

function lerpPos(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

// Subtle 1px vertical breath for idle sprites. phase offset keeps NPCs out of sync.
function idleBreath(phase: number): number {
  return Math.round(Math.sin(Date.now() / 500 + phase) * 1);
}

// 1px bob synced to step — peaks mid-stride, zero at start/end.
function walkBob(moveProgress: number): number {
  return -Math.round(Math.sin(moveProgress * Math.PI) * 1);
}

// Stable hash of a string to a radian-ish phase offset.
function phaseOf(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return (h % 628) / 100;
}

// ── AAA helpers ─────────────────────────────────────────────────────────────

// Soft drop shadow — dark ellipse under sprites and props. Single biggest
// "feels AAA" upgrade per pixel. Renders to the main canvas with low alpha.
function drawShadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, alpha = 0.35) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Sample a 16×16 crop from a painted surface, with edge-clamping so tiles
// requesting source coords outside the painted area get the nearest edge
// (prevents black tears at door openings / voids beyond the painted region).
function drawTileFromSurface(
  ctx: CanvasRenderingContext2D,
  surface: HTMLImageElement,
  surfaceOriginCol: number,  // which column in the tile grid the surface starts at
  surfaceOriginRow: number,  // which row in the tile grid the surface starts at
  c: number, r: number,      // destination tile coords
) {
  const rawSx = (c - surfaceOriginCol) * TILE_SIZE;
  const rawSy = (r - surfaceOriginRow) * TILE_SIZE;
  const sx = Math.max(0, Math.min(surface.width  - TILE_SIZE, rawSx));
  const sy = Math.max(0, Math.min(surface.height - TILE_SIZE, rawSy));
  ctx.drawImage(surface, sx, sy, TILE_SIZE, TILE_SIZE, c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

// Per-region surface origin tile coords. Matches each region's map layout.
// Notched-mat regions (scramble, coral, nova, iron, summit, steel) use a wider
// mat surface (160×192 starting col 5) because the mat extends to cols 5-14 in
// rows 5-9. The wall tiles overwrite the mat paint in rows 1-4/10-12 cols 5&14.
const SURFACE_ORIGINS: Record<string, { mat: [number, number]; floor: [number, number] }> = {
  home:             { mat: [6, 1], floor: [1, 1] },
  'old-town':       { mat: [6, 1], floor: [1, 1] },
  'sambo-district': { mat: [6, 1], floor: [1, 1] },
  'scramble-valley':{ mat: [5, 1], floor: [1, 1] },
  'coral-bay':      { mat: [5, 1], floor: [1, 1] },
  'nova-camp':      { mat: [5, 1], floor: [1, 1] },
  'iron-coast':     { mat: [5, 1], floor: [1, 1] },
  'summit-city':    { mat: [5, 1], floor: [1, 1] },
  'steel-mountain': { mat: [5, 1], floor: [1, 1] },
};

// Prop placements — where each prop sprite origin lands (top-left of the sprite
// in tile coords). 32×32 props extend down-right from their origin.
type PropPlacement = { prop: 'lockers' | 'desk' | 'board'; col: number; row: number };
const PROP_PLACEMENTS: Record<string, PropPlacement[]> = {
  home: [
    { prop: 'lockers', col: 1,  row: 11 },
    { prop: 'desk',    col: 17, row: 3  },
    { prop: 'board',   col: 2,  row: 1  },
  ],
  'scramble-valley': [
    { prop: 'lockers', col: 1,  row: 11 },
    { prop: 'lockers', col: 17, row: 11 },
    { prop: 'desk',    col: 3,  row: 4  },
    { prop: 'desk',    col: 16, row: 4  },
    { prop: 'board',   col: 3,  row: 1  },
    { prop: 'board',   col: 17, row: 1  },
  ],
  'old-town': [
    { prop: 'lockers', col: 1,  row: 11 },
    { prop: 'lockers', col: 17, row: 11 },
    { prop: 'desk',    col: 2,  row: 3  },
    { prop: 'desk',    col: 17, row: 3  },
    { prop: 'board',   col: 1,  row: 1  },
    { prop: 'board',   col: 18, row: 1  },
  ],
  'steel-mountain': [
    { prop: 'board',   col: 2,  row: 1  },
    { prop: 'board',   col: 17, row: 1  },
  ],
  'coral-bay': [
    { prop: 'desk',    col: 3,  row: 4  },
    { prop: 'desk',    col: 16, row: 4  },
    { prop: 'board',   col: 3,  row: 1  },
    { prop: 'board',   col: 16, row: 1  },
  ],
  'sambo-district': [
    { prop: 'lockers', col: 1,  row: 11 },
    { prop: 'lockers', col: 17, row: 11 },
    { prop: 'desk',    col: 3,  row: 3  },
    { prop: 'desk',    col: 16, row: 3  },
    { prop: 'board',   col: 2,  row: 2  },
    { prop: 'board',   col: 17, row: 2  },
  ],
  'nova-camp': [
    { prop: 'desk',    col: 3,  row: 3  },
    { prop: 'desk',    col: 16, row: 3  },
    { prop: 'board',   col: 2,  row: 1  },
    { prop: 'board',   col: 17, row: 1  },
  ],
  'iron-coast': [
    { prop: 'lockers', col: 1,  row: 11 },
    { prop: 'lockers', col: 17, row: 11 },
    { prop: 'desk',    col: 2,  row: 3  },
    { prop: 'desk',    col: 17, row: 3  },
    { prop: 'board',   col: 1,  row: 1  },
    { prop: 'board',   col: 18, row: 1  },
  ],
  'summit-city': [
    { prop: 'desk',    col: 3,  row: 4  },
    { prop: 'desk',    col: 16, row: 4  },
    { prop: 'board',   col: 1,  row: 1  },
    { prop: 'board',   col: 18, row: 1  },
    { prop: 'board',   col: 1,  row: 6  },
    { prop: 'board',   col: 18, row: 6  },
  ],
};

// Lighting overlay — warm radial glow in the center, subtle vignette in
// corners. Drawn after NPCs so it tints the whole scene.
function drawLighting(ctx: CanvasRenderingContext2D) {
  const cx = CANVAS_WIDTH / 2, cy = CANVAS_HEIGHT / 2;
  // Warm center glow — additive
  const warm = ctx.createRadialGradient(cx, cy, 10, cx, cy, 160);
  warm.addColorStop(0, 'rgba(255,220,150,0.15)');
  warm.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();

  // Corner vignette — multiplicative darkening
  const vign = ctx.createRadialGradient(cx, cy, 80, cx, cy, 210);
  vign.addColorStop(0, 'rgba(0,0,0,0)');
  vign.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// ── Main render ─────────────────────────────────────────────────────────────

// ── Gym wall trophies — your career, rendered where you train ──
// Gold pennants for tournament golds, colored shields for region stamps.
// Investment that isn't displayed doesn't retain.
function drawGymWall(ctx: CanvasRenderingContext2D, golds: number, stampColors: string[]) {
  const wallY = 6;
  // Tournament gold pennants along the top wall
  for (let i = 0; i < Math.min(golds, 8); i++) {
    const x = 86 + i * 13;
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(x, wallY, 9, 2);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + 1, wallY + 2, 7, 5);
    ctx.beginPath();
    ctx.moveTo(x + 1, wallY + 7);
    ctx.lineTo(x + 4.5, wallY + 11);
    ctx.lineTo(x + 8, wallY + 7);
    ctx.closePath();
    ctx.fill();
  }
  // Stamp shields on the right side of the top wall
  for (let i = 0; i < Math.min(stampColors.length, 7); i++) {
    const x = 206 + i * 10;
    ctx.fillStyle = '#222';
    ctx.fillRect(x, wallY + 2, 8, 8);
    ctx.fillStyle = stampColors[i];
    ctx.fillRect(x + 1, wallY + 3, 6, 6);
  }
}

export function renderOverworld(
  ctx: CanvasRenderingContext2D,
  state: OverworldState,
  tileMap: number[][],
  playerGiColor: string | undefined,
  playerBelt: Belt,
  coachName?: string,
  regionId?: string,
  trophies?: { golds: number; stampColors: string[] },
) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const rows = tileMap.length;
  const cols = tileMap[0].length;

  // Prefer the composited painted-scene pipeline when surfaces exist for this
  // region; otherwise fall back to per-tile textures (old Path C) or flat
  // colour. This lets us paint regions one at a time without breaking others.
  const surfaces = regionId ? getRegionSurfaces(regionId) : null;
  const origins  = regionId ? SURFACE_ORIGINS[regionId] : undefined;
  const paintedMode = !!(surfaces?.floor && surfaces?.mat && surfaces?.wall && origins);

  // ── Layer 1: base surfaces ─────────────────────────────────────────────────
  if (paintedMode && surfaces && origins) {
    // Whole-surface blit eliminates per-tile seams within the floor + mat.
    // Floor underlay goes edge-to-edge across its bounding box (cols 1-18,
    // rows 1-12 for home). Mat overlays on top in the mat region. Any FLOOR
    // tile that falls outside the floor surface (door opening at rows 13-14)
    // gets per-tile sampling with edge clamp.
    const fox = origins.floor[0] * TILE_SIZE, foy = origins.floor[1] * TILE_SIZE;
    ctx.drawImage(surfaces.floor!, fox, foy);

    const mox = origins.mat[0] * TILE_SIZE, moy = origins.mat[1] * TILE_SIZE;
    ctx.drawImage(surfaces.mat!, mox, moy);

    // Per-tile pass for walls + floor tiles outside the whole-surface region.
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = tileMap[r][c];
        const x = c * TILE_SIZE, y = r * TILE_SIZE;

        if (tile === Tile.WALL) {
          // Wall overwrites whatever painted surface sat under it.
          ctx.drawImage(surfaces.wall!, x, y, TILE_SIZE, TILE_SIZE);
          continue;
        }

        // FLOOR tile outside the painted floor rectangle? Sample + clamp.
        const floorRight  = fox + surfaces.floor!.width;
        const floorBottom = foy + surfaces.floor!.height;
        const outsideFloor = x < fox || y < foy || x + TILE_SIZE > floorRight || y + TILE_SIZE > floorBottom;
        const needsFloor = tile === Tile.FLOOR || tile === Tile.LOCKER || tile === Tile.DESK ||
                           tile === Tile.BOARD || tile === Tile.DOOR;
        if (needsFloor && outsideFloor) {
          drawTileFromSurface(ctx, surfaces.floor!, origins.floor[0], origins.floor[1], c, r);
        }
      }
    }
  } else {
    // ── Fallback: Path C per-tile textures or flat colour ─────────────────
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = tileMap[r][c];
        const x = c * TILE_SIZE, y = r * TILE_SIZE;

        if (tile === Tile.LOCKER || tile === Tile.DESK || tile === Tile.BOARD || tile === Tile.DOOR) {
          const floorTex = regionId ? getTileTexture(regionId, Tile.FLOOR) : null;
          if (floorTex) ctx.drawImage(floorTex, x, y, TILE_SIZE, TILE_SIZE);
          else { ctx.fillStyle = TILE_COLORS[Tile.FLOOR]; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }
        }
        const tex = regionId ? getTileTexture(regionId, tile) : null;
        if (tex) {
          ctx.drawImage(tex, x, y, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.fillStyle = TILE_COLORS[tile] || '#000';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          if (tile === Tile.MAT) {
            ctx.strokeStyle = '#2a6a3a';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }

  // ── Layer 2: prop sprites (drawn in painted mode only; fallback mode shows
  //    props via tile textures above) ─────────────────────────────────────────
  if (paintedMode && regionId && PROP_PLACEMENTS[regionId]) {
    for (const p of PROP_PLACEMENTS[regionId]) {
      const img = p.prop === 'lockers' ? surfaces!.propLockers
                : p.prop === 'desk'    ? surfaces!.propDesk
                : p.prop === 'board'   ? surfaces!.propBoard
                : null;
      if (!img) continue;

      // Soft shadow beneath the prop for depth
      const sx = p.col * TILE_SIZE + 16;
      const sy = p.row * TILE_SIZE + 24;
      drawShadow(ctx, sx, sy, 10, 3, 0.3);

      // 32×32 props centered over their tile (extend up-left for HD-2D feel)
      ctx.drawImage(img, p.col * TILE_SIZE, p.row * TILE_SIZE, 32, 32);
    }
  }

  // ── Layer 3: affordance overlays — gold hints on interactables ────────────
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = tileMap[r][c];
      if (tile === Tile.BOARD) {
        ctx.fillStyle = 'rgba(255,215,0,0.85)';
        ctx.fillRect(c * TILE_SIZE + 4, r * TILE_SIZE + 2, 8, 2);
        ctx.fillRect(c * TILE_SIZE + 4, r * TILE_SIZE + 6, 8, 2);
        ctx.fillRect(c * TILE_SIZE + 4, r * TILE_SIZE + 10, 8, 2);
      } else if (tile === Tile.DOOR) {
        ctx.fillStyle = 'rgba(255,215,0,0.7)';
        ctx.fillRect(c * TILE_SIZE + 6, r * TILE_SIZE + 12, 4, 2);
        ctx.fillRect(c * TILE_SIZE + 5, r * TILE_SIZE + 10, 6, 2);
        ctx.fillRect(c * TILE_SIZE + 4, r * TILE_SIZE + 8, 8, 2);
      }
    }
  }

  // ── Layer 4: NPC + player shadows ─────────────────────────────────────────
  for (const npc of state.npcs) {
    const nx = npc.isMoving
      ? lerpPos(npc.col, npc.targetCol, npc.moveProgress) * TILE_SIZE
      : npc.col * TILE_SIZE;
    const ny = npc.isMoving
      ? lerpPos(npc.row, npc.targetRow, npc.moveProgress) * TILE_SIZE
      : npc.row * TILE_SIZE;
    drawShadow(ctx, nx + 8, ny + 14, 6, 2, 0.4);
  }
  {
    const p = state.player;
    const px = p.isMoving ? lerpPos(p.col, p.targetCol, p.moveProgress) * TILE_SIZE : p.col * TILE_SIZE;
    const py = p.isMoving ? lerpPos(p.row, p.targetRow, p.moveProgress) * TILE_SIZE : p.row * TILE_SIZE;
    drawShadow(ctx, px + 8, py + 14, 6, 2, 0.4);
  }

  // ── Layer 5: sprites (NPCs + player) with row depth sort ──────────────────
  const sprites: { x: number; y: number; canvas: HTMLCanvasElement | HTMLImageElement; row: number; w?: number; h?: number }[] = [];

  for (const npc of state.npcs) {
    const nx = npc.isMoving
      ? lerpPos(npc.col, npc.targetCol, npc.moveProgress) * TILE_SIZE
      : npc.col * TILE_SIZE;
    const ny = npc.isMoving
      ? lerpPos(npc.row, npc.targetRow, npc.moveProgress) * TILE_SIZE
      : npc.row * TILE_SIZE;
    const bob = npc.isMoving ? walkBob(npc.moveProgress) : idleBreath(phaseOf(npc.def.id));

    const aiNpc = getNPCSprite(npc.def.id, npc.dir);
    if (aiNpc) {
      sprites.push({ x: nx - 4, y: ny - 8 + bob, canvas: aiNpc, row: npc.row, w: 24, h: 24 });
    } else {
      const sprite = getGrapplerSprite(npc.def.style, SPRITE_SCALE, npc.def.belt);
      sprites.push({ x: nx + 2, y: ny - 2 + bob, canvas: sprite, row: npc.row });
    }
  }

  const p = state.player;
  const px = p.isMoving ? lerpPos(p.col, p.targetCol, p.moveProgress) * TILE_SIZE : p.col * TILE_SIZE;
  const py = p.isMoving ? lerpPos(p.row, p.targetRow, p.moveProgress) * TILE_SIZE : p.row * TILE_SIZE;
  const playerBob = p.isMoving ? walkBob(p.moveProgress) : idleBreath(0);

  const aiSprite = getBeltSpriteDir(playerBelt, p.dir);
  if (aiSprite) {
    sprites.push({ x: px - 2, y: py - 6 + playerBob, canvas: aiSprite as any, row: p.row, w: 20, h: 20 });
  } else {
    const playerSprite = playerGiColor
      ? getPlayerSprite(playerGiColor, SPRITE_SCALE, playerBelt)
      : getGrapplerSprite('controller', SPRITE_SCALE, playerBelt);
    sprites.push({ x: px + 2, y: py - 2 + playerBob, canvas: playerSprite, row: p.row });
  }

  sprites.sort((a, b) => a.row - b.row);
  for (const s of sprites) {
    if (s.w && s.h) ctx.drawImage(s.canvas, s.x, s.y, s.w, s.h);
    else ctx.drawImage(s.canvas, s.x, s.y);
  }

  // ── Layer 5.5: gym wall trophies (home gym only) ──────────────────────────
  if (regionId === 'home' && trophies && (trophies.golds > 0 || trophies.stampColors.length > 0)) {
    drawGymWall(ctx, trophies.golds, trophies.stampColors);
  }

  // ── Layer 6: NPC labels + interaction prompts ─────────────────────────────
  const BELT_LABEL_COLORS: Record<string, string> = {
    white: '#ffffff', blue: '#4488ff', purple: '#aa55ff', brown: '#cc8844', black: '#888888',
  };

  for (const npc of state.npcs) {
    const nx = npc.col * TILE_SIZE + 8;
    const ny = npc.row * TILE_SIZE;

    ctx.textAlign = 'center';
    ctx.font = '6px "Press Start 2P", monospace';
    const beltColor = BELT_LABEL_COLORS[npc.def.belt] || '#888';

    const displayName = (npc.def.role === 'professor' && coachName)
      ? coachName : npc.def.name;

    const nameText = displayName.substring(0, 10);
    const nameW = Math.max(nameText.length * 5, 28);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(nx - nameW / 2 - 1, ny - 20, nameW + 2, 8);

    ctx.fillStyle = beltColor;
    ctx.fillRect(nx - 3, ny - 14, 6, 6);

    ctx.fillStyle = '#fff';
    ctx.fillText(nameText, nx, ny - 16);

    if (npc.def.role === 'training-partner' && npc.defeated) {
      ctx.fillStyle = '#22c55e88';
      ctx.fillText('✓', nx + 20, ny - 10);
    }

    const dist = Math.abs(npc.col - p.col) + Math.abs(npc.row - p.row);
    if (dist === 1 && state.interactingNPC === null) {
      ctx.fillStyle = '#ffd700';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('!', nx, ny - 18);
    }
  }

  // ── Layer 7: AAA lighting pass (warm center glow + corner vignette) ──────
  if (paintedMode) drawLighting(ctx);

  // ── Layer 8: regional tint (unchanged) ───────────────────────────────────
  const tint = regionId ? getRegionAtmosphere(regionId).tint : undefined;
  if (tint) {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
}
