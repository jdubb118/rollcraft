import type { Style, Belt, BaseStats, EVs, Frame } from '../engine/types';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PlayerOverworld {
  col: number;
  row: number;
  dir: Direction;
  isMoving: boolean;
  moveProgress: number; // 0-1 lerp between tiles
  targetCol: number;
  targetRow: number;
}

export type NPCRole = 'instructor' | 'training-partner' | 'professor';

export interface NPCDef {
  id: string;
  name: string;
  role: NPCRole;
  style: Style;
  belt: Belt;
  moves: string[];
  teachableMoves?: string[];
  teachCost?: number;
  requiredBelt?: Belt;
  dialogue: {
    greeting: string;
    challenge?: string;
    teach?: string;
    defeat?: string;
    promotion?: string;
  };
  position: { col: number; row: number };
  wanders: boolean;
  wanderArea?: { minCol: number; maxCol: number; minRow: number; maxRow: number };
  baseStats?: BaseStats;
  evSpread?: EVs;
  frame?: Frame;
}

export interface NPCState {
  def: NPCDef;
  col: number;
  row: number;
  dir: Direction;
  isMoving: boolean;
  moveProgress: number;
  targetCol: number;
  targetRow: number;
  wanderTimer: number;
  defeated: boolean;
}

export interface OverworldState {
  player: PlayerOverworld;
  npcs: NPCState[];
  interactingNPC: string | null; // NPC id
  dialogueText: string | null;
  menuOptions: MenuOption[] | null;
}

export interface MenuOption {
  label: string;
  action: string; // 'roll' | 'learn' | 'talk' | 'cancel' | 'exam' | 'manage-moves'
  disabled?: boolean;
}
