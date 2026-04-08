import type { OverworldState } from './overworldTypes';
import { TILE_SIZE, TILE_COLORS, Tile } from './tiles';
import { getGrapplerSprite, getPlayerSprite } from '../render/SpriteData';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/constants';
import type { Belt } from '../engine/types';

const SPRITE_SCALE = 1; // 1:1 with tile size (12x16 sprite in 16x16 tile)

function lerpPos(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function renderOverworld(
  ctx: CanvasRenderingContext2D,
  state: OverworldState,
  tileMap: number[][],
  playerGiColor: string | undefined,
  playerBelt: Belt,
  coachName?: string,
) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const rows = tileMap.length;
  const cols = tileMap[0].length;

  // Draw tiles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = tileMap[r][c];
      ctx.fillStyle = TILE_COLORS[tile] || '#000';
      ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);

      // Mat details
      if (tile === Tile.MAT) {
        ctx.strokeStyle = '#2a6a3a';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }

      // Board indicator
      if (tile === Tile.BOARD) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(c * TILE_SIZE + 4, r * TILE_SIZE + 2, 8, 2);
        ctx.fillRect(c * TILE_SIZE + 4, r * TILE_SIZE + 6, 8, 2);
        ctx.fillRect(c * TILE_SIZE + 4, r * TILE_SIZE + 10, 8, 2);
      }

      // Desk indicator
      if (tile === Tile.DESK) {
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(c * TILE_SIZE + 2, r * TILE_SIZE + 2, 12, 12);
      }

      // Door indicator
      if (tile === Tile.DOOR) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(c * TILE_SIZE + 6, r * TILE_SIZE + 4, 4, 8);
      }
    }
  }

  // Draw mat center circle
  const matCenterX = 10 * TILE_SIZE; // center of mat area
  const matCenterY = 6 * TILE_SIZE;
  ctx.strokeStyle = '#2a6a3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(matCenterX, matCenterY, 24, 0, Math.PI * 2);
  ctx.stroke();

  // Collect all sprites to draw sorted by row (depth sorting)
  const sprites: { x: number; y: number; canvas: HTMLCanvasElement; row: number }[] = [];

  // NPCs
  for (const npc of state.npcs) {
    const nx = npc.isMoving
      ? lerpPos(npc.col, npc.targetCol, npc.moveProgress) * TILE_SIZE
      : npc.col * TILE_SIZE;
    const ny = npc.isMoving
      ? lerpPos(npc.row, npc.targetRow, npc.moveProgress) * TILE_SIZE
      : npc.row * TILE_SIZE;

    const sprite = getGrapplerSprite(npc.def.style, SPRITE_SCALE, npc.def.belt);
    sprites.push({ x: nx + 2, y: ny - 2, canvas: sprite, row: npc.row });
  }

  // Player
  const p = state.player;
  const px = p.isMoving
    ? lerpPos(p.col, p.targetCol, p.moveProgress) * TILE_SIZE
    : p.col * TILE_SIZE;
  const py = p.isMoving
    ? lerpPos(p.row, p.targetRow, p.moveProgress) * TILE_SIZE
    : p.row * TILE_SIZE;

  const playerSprite = playerGiColor
    ? getPlayerSprite(playerGiColor, SPRITE_SCALE, playerBelt)
    : getGrapplerSprite('controller', SPRITE_SCALE, playerBelt);
  sprites.push({ x: px + 2, y: py - 2, canvas: playerSprite, row: p.row });

  // Sort by row for depth
  sprites.sort((a, b) => a.row - b.row);

  // Draw all sprites
  for (const s of sprites) {
    ctx.drawImage(s.canvas, s.x, s.y);
  }

  // NPC labels + interaction prompts
  const BELT_LABEL_COLORS: Record<string, string> = {
    white: '#ffffff', blue: '#4488ff', purple: '#aa55ff', brown: '#cc8844', black: '#888888',
  };

  for (const npc of state.npcs) {
    const nx = npc.col * TILE_SIZE + 8;
    const ny = npc.row * TILE_SIZE;

    // Always show name + belt above NPC
    ctx.textAlign = 'center';
    ctx.font = '6px "Press Start 2P", monospace';
    const beltColor = BELT_LABEL_COLORS[npc.def.belt] || '#888';

    // Display name — use coach name for professor
    const displayName = (npc.def.role === 'professor' && coachName)
      ? coachName : npc.def.name;

    // Belt indicator dot
    ctx.fillStyle = beltColor;
    ctx.fillRect(nx - 3, ny - 14, 6, 6);

    // Name
    ctx.fillStyle = '#ccc';
    ctx.fillText(displayName.substring(0, 10), nx, ny - 16);

    // Role icon for training partners
    if (npc.def.role === 'training-partner') {
      // Show if defeated
      if (npc.defeated) {
        ctx.fillStyle = '#22c55e44';
        ctx.fillText('✓', nx + 20, ny - 10);
      }
    }

    // "!" prompt when adjacent
    const dist = Math.abs(npc.col - p.col) + Math.abs(npc.row - p.row);
    if (dist === 1 && state.interactingNPC === null) {
      ctx.fillStyle = '#ffd700';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('!', nx, ny - 18);
    }
  }
}
