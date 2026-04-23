import type { OverworldState, NPCState, Direction } from './overworldTypes';
import { isSolid } from './tiles';

const MOVE_SPEED = 5.0; // tiles per second

const DIR_OFFSETS: Record<Direction, { dc: number; dr: number }> = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
};

export function createOverworldState(
  playerCol: number,
  playerRow: number,
  npcDefs: import('./overworldTypes').NPCDef[],
): OverworldState {
  return {
    player: {
      col: playerCol, row: playerRow, dir: 'up',
      isMoving: false, moveProgress: 0,
      targetCol: playerCol, targetRow: playerRow,
    },
    npcs: npcDefs.map(def => ({
      def,
      col: def.position.col, row: def.position.row,
      dir: 'down' as Direction,
      isMoving: false, moveProgress: 0,
      targetCol: def.position.col, targetRow: def.position.row,
      wanderTimer: 2 + Math.random() * 3,
      defeated: false,
    })),
    interactingNPC: null,
    dialogueText: null,
    menuOptions: null,
    animationFrame: 0,
  };
}

function isTileBlocked(tileMap: number[][], col: number, row: number, npcs: NPCState[], excludeId?: string): boolean {
  if (row < 0 || row >= tileMap.length || col < 0 || col >= tileMap[0].length) return true;
  if (isSolid(tileMap[row][col])) return true;
  // Check NPC collision
  for (const npc of npcs) {
    if (excludeId && npc.def.id === excludeId) continue;
    if (npc.col === col && npc.row === row) return true;
    if (npc.isMoving && npc.targetCol === col && npc.targetRow === row) return true;
  }
  return false;
}

export function updateOverworld(
  state: OverworldState,
  tileMap: number[][],
  input: { up: boolean; down: boolean; left: boolean; right: boolean },
  dt: number,
): void {
  state.animationFrame += dt * 60; // ~60 "frames" per second for tile anim math

  // Don't move while interacting
  if (state.interactingNPC) return;

  const player = state.player;

  // Update player movement
  if (player.isMoving) {
    player.moveProgress += dt * MOVE_SPEED;
    if (player.moveProgress >= 1) {
      player.col = player.targetCol;
      player.row = player.targetRow;
      player.isMoving = false;
      player.moveProgress = 0;
    }
  } else {
    // Check input for new movement
    let dir: Direction | null = null;
    if (input.up) dir = 'up';
    else if (input.down) dir = 'down';
    else if (input.left) dir = 'left';
    else if (input.right) dir = 'right';

    if (dir) {
      player.dir = dir;
      const { dc, dr } = DIR_OFFSETS[dir];
      const tc = player.col + dc;
      const tr = player.row + dr;

      // Check if player is blocked by NPC (but allow walking toward them for interaction)
      if (!isTileBlocked(tileMap, tc, tr, state.npcs)) {
        player.targetCol = tc;
        player.targetRow = tr;
        player.isMoving = true;
        player.moveProgress = 0;
      }
    }
  }

  // Update NPC wandering
  for (const npc of state.npcs) {
    if (!npc.def.wanders) continue;

    if (npc.isMoving) {
      npc.moveProgress += dt * (MOVE_SPEED * 0.5); // NPCs move slower
      if (npc.moveProgress >= 1) {
        npc.col = npc.targetCol;
        npc.row = npc.targetRow;
        npc.isMoving = false;
        npc.moveProgress = 0;
        npc.wanderTimer = 2 + Math.random() * 4;
      }
    } else {
      npc.wanderTimer -= dt;
      if (npc.wanderTimer <= 0) {
        // Pick random direction
        const dirs: Direction[] = ['up', 'down', 'left', 'right'];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const { dc, dr } = DIR_OFFSETS[dir];
        const tc = npc.col + dc;
        const tr = npc.row + dr;

        // Check bounds + wander area
        const area = npc.def.wanderArea;
        if (
          !isTileBlocked(tileMap, tc, tr, state.npcs, npc.def.id) &&
          !(tc === player.col && tr === player.row) &&
          (!area || (tc >= area.minCol && tc <= area.maxCol && tr >= area.minRow && tr <= area.maxRow))
        ) {
          npc.dir = dir;
          npc.targetCol = tc;
          npc.targetRow = tr;
          npc.isMoving = true;
          npc.moveProgress = 0;
        } else {
          npc.wanderTimer = 1 + Math.random() * 2;
        }
      }
    }
  }
}

// Get the NPC the player is facing (adjacent tile in facing direction)
export function getFacingNPC(state: OverworldState): NPCState | null {
  if (state.player.isMoving) return null;
  const { col, row, dir } = state.player;
  const { dc, dr } = DIR_OFFSETS[dir];
  const tc = col + dc;
  const tr = row + dr;

  for (const npc of state.npcs) {
    if (npc.col === tc && npc.row === tr) return npc;
  }
  return null;
}

// Get the tile the player is facing
export function getFacingTile(state: OverworldState, tileMap: number[][]): { tile: number; col: number; row: number } | null {
  if (state.player.isMoving) return null;
  const { col, row, dir } = state.player;
  const { dc, dr } = DIR_OFFSETS[dir];
  const tc = col + dc;
  const tr = row + dr;
  if (tr < 0 || tr >= tileMap.length || tc < 0 || tc >= tileMap[0].length) return null;
  return { tile: tileMap[tr][tc], col: tc, row: tr };
}
