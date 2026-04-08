// ── Styles (like Pokemon types) ──
export type Style =
  | 'wrestler' | 'judoka' | 'guard-player' | 'pressure-passer'
  | 'leg-locker' | 'berimbolo' | 'sub-hunter' | 'controller';

// ── Positions (state machine nodes) ──
export type Position =
  | 'standing' | 'clinch'
  | 'closed-guard-top' | 'closed-guard-bottom'
  | 'open-guard-top' | 'open-guard-bottom'
  | 'half-guard-top' | 'half-guard-bottom'
  | 'side-control' | 'side-control-bottom'
  | 'mount' | 'mount-bottom'
  | 'back-control' | 'back-control-bottom'
  | 'turtle-top' | 'turtle-bottom'
  | 'knee-on-belly'
  | 'north-south'
  | 'leg-entanglement';

// ── Move categories ──
export type MoveCategory = 'takedown' | 'sweep' | 'pass' | 'submission' | 'escape' | 'transition';

// ── Stat keys ──
export type StatKey = 'str' | 'tec' | 'tgh' | 'flx' | 'spd' | 'end';

// ── Belt ranks ──
export type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black';

export const BELT_LEVELS: Record<Belt, number> = {
  white: 10,
  blue: 25,
  purple: 40,
  brown: 55,
  black: 70,
};

export const BELT_XP_THRESHOLDS: Record<Belt, number> = {
  white: 0,
  blue: 500,
  purple: 2000,
  brown: 5000,
  black: 12000,
};

export const BELT_MOVE_SLOTS: Record<Belt, number> = {
  white: 4,
  blue: 6,
  purple: 8,
  brown: 10,
  black: 12,
};

// ── IVs (rolled at creation, 0-15) ──
export interface IVs {
  str: number;
  tec: number;
  tgh: number;
  flx: number;
  spd: number;
  end: number;
}

// ── EVs (earned, 0-252 each, 510 total cap) ──
export interface EVs {
  str: number;
  tec: number;
  tgh: number;
  flx: number;
  spd: number;
  end: number;
}

// ── Base stats ──
export interface BaseStats {
  hp: number;
  str: number;
  tec: number;
  tgh: number;
  flx: number;
  spd: number;
  end: number;
}

// ── Computed stats ──
export interface Stats {
  maxHp: number;
  str: number;
  tec: number;
  tgh: number;
  flx: number;
  spd: number;
  end: number;
}

// ── Move definition ──
export interface Move {
  id: string;
  name: string;
  category: MoveCategory;
  style: Style;
  positionRequired: Position[];
  positionResult: Position | null; // null = no position change (submissions stay in place or end fight)
  power: number;
  accuracy: number;
  staminaCost: number;
  statAttack: StatKey;
  statDefense: StatKey;
  chainPotential: string[];
  description: string;
}

// ── Grappler (the "Pokemon") ──
export interface Grappler {
  id: string;
  name: string;
  style: Style;
  belt: Belt;
  xp: number;
  baseStats: BaseStats;
  ivs: IVs;
  evs: EVs;
  moves: string[]; // move IDs
}

// ── Battle-time grappler ──
export interface BattleGrappler {
  grappler: Grappler;
  stats: Stats;
  currentHp: number;
  currentStamina: number;
  maxStamina: number;
  isGassed: boolean;
  lastMoveId: string | null;
}

// ── Position data ──
export interface PositionData {
  id: Position;
  name: string;
  advantage: 'dominant-top' | 'top' | 'slight-top' | 'neutral' | 'slight-bottom';
  atbModTop: number;
  atbModBottom: number;
  damageMod: number;
  pair: Position; // the other fighter's position
  availableCategories: MoveCategory[];
}

// ── Battle state ──
export interface BattleState {
  turn: number;
  player: BattleGrappler;
  opponent: BattleGrappler;
  playerPosition: Position;
  opponentPosition: Position;
  phase: 'select-move' | 'animating' | 'submission' | 'battle-over';
  log: string[];
  winner: 'player' | 'opponent' | null;
  submissionPhase: number; // 0 = not in submission
  activeSubmission: Move | null;
  submissionAttacker: 'player' | 'opponent' | null;
}

// ── Archetype (starter template) ──
export interface Archetype {
  id: string;
  name: string;
  style: Style;
  description: string;
  baseStats: BaseStats;
  startingMoves: string[];
  color: string;
}

// ── Battle result ──
export interface BattleResult {
  winner: 'player' | 'opponent';
  method: 'submission' | 'ko' | 'points';
  xpGained: number;
  turns: number;
  playerName: string;
  opponentName: string;
  opponentStyle: Style;
}
