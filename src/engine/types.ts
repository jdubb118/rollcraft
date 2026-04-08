// ── Styles (like Pokemon types) ──
export type Style =
  | 'wrestler' | 'judoka' | 'guard-player' | 'pressure-passer'
  | 'leg-locker' | 'berimbolo' | 'sub-hunter' | 'controller';

// ── Shared position (the mat state — ONE state, not two) ──
export type Position =
  | 'standing' | 'clinch'
  | 'closed-guard' | 'open-guard' | 'half-guard'
  | 'side-control' | 'mount' | 'back-control' | 'turtle'
  | 'knee-on-belly' | 'north-south'
  | 'leg-entanglement';

// ── Role within the shared position ──
export type PositionRole = 'top' | 'bottom' | 'neutral';

// ── Move categories ──
export type MoveCategory = 'takedown' | 'sweep' | 'pass' | 'submission' | 'escape' | 'transition' | 'setup';

// ── Frame (weight class) ──
export type Frame = 'light' | 'medium' | 'heavy';

// ── Stat keys ──
export type StatKey = 'str' | 'tec' | 'tgh' | 'flx' | 'spd' | 'end';

// ── Belt ranks ──
export type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black';

export const BELT_LEVELS: Record<Belt, number> = {
  white: 1, blue: 15, purple: 30, brown: 45, black: 60,
};

export const BELT_XP_THRESHOLDS: Record<Belt, number> = {
  white: 0, blue: 1500, purple: 5000, brown: 12000, black: 25000,
};

export const BELT_MOVE_SLOTS: Record<Belt, number> = {
  white: 4, blue: 6, purple: 8, brown: 10, black: 12,
};

// ── IVs (rolled at creation, 0-15) ──
export interface IVs {
  str: number; tec: number; tgh: number; flx: number; spd: number; end: number;
}

// ── EVs (earned, 0-252 each, 510 total cap) ──
export interface EVs {
  str: number; tec: number; tgh: number; flx: number; spd: number; end: number;
}

// ── Base stats ──
export interface BaseStats {
  hp: number; str: number; tec: number; tgh: number; flx: number; spd: number; end: number;
}

// ── Computed stats ──
export interface Stats {
  maxHp: number; str: number; tec: number; tgh: number; flx: number; spd: number; end: number;
}

// ── Position requirement for a move ──
export interface PosReq {
  position: Position;
  role: PositionRole; // 'top', 'bottom', or 'neutral' (for standing/clinch/legs)
}

// ── Move definition ──
export interface Move {
  id: string;
  name: string;
  category: MoveCategory;
  style: Style;
  posReq: PosReq[];                        // which position+role combinations allow this move
  resultPosition: Position | null;          // new shared position after success (null = no change)
  resultRole: 'top' | 'bottom' | 'neutral' | null; // attacker's role in new position (null = no change)
  power: number;
  accuracy: number;
  staminaCost: number;
  statAttack: StatKey;
  statDefense: StatKey;
  chainPotential: string[];
  description: string;
  impact?: { flinchChance: number; recoil: number };
  setupBonus?: { accuracyMod: number; damageMod: number; critMod: number; duration: number };
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
  moves: string[];         // equipped move IDs (limited by belt slots)
  learnedMoves: string[];  // all moves ever learned (full pool)
  frame: Frame;
  giColor?: string;
  gymName?: string;
  coachName?: string;
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
  momentum: number;          // 0-3, builds on consecutive successful moves
  flinched: boolean;         // forced to stall next turn (from impact move)
  setupBonus: {              // active buff from a grip/setup move
    turnsRemaining: number;
    accuracyMod: number;
    damageMod: number;
    critMod: number;
  } | null;
}

// ── Shared position data ──
export interface PositionData {
  id: Position;
  name: string;
  symmetric: boolean; // true for standing, clinch, leg-entanglement
  advantage: 'dominant-top' | 'top' | 'slight-top' | 'neutral' | 'slight-bottom';
  atbModTop: number;
  atbModBottom: number;
  damageModTop: number;
  damageModBottom: number;
  topCategories: MoveCategory[];
  bottomCategories: MoveCategory[];
}

// ── Match rules ──
export type RuleSet = 'points' | 'submission-only' | 'adcc';

// ── Battle state — SINGLE shared position ──
export interface BattleState {
  turn: number;
  maxTurns: number;                  // match timer (turns = ~30s each)
  player: BattleGrappler;
  opponent: BattleGrappler;
  position: Position;               // ONE shared position
  topFighter: 'player' | 'opponent' | null; // who is top (null = symmetric)
  phase: 'select-move' | 'opponent-acting' | 'animating' | 'submission' | 'battle-over';
  log: string[];
  winner: 'player' | 'opponent' | null;
  winMethod: 'submission' | 'points' | 'advantages' | 'draw' | null;
  submissionPhase: number;
  activeSubmission: Move | null;
  submissionAttacker: 'player' | 'opponent' | null;
  firstActor: 'player' | 'opponent'; // who acts first this turn (speed-based)
  firstActorDone: boolean;           // has first actor acted?
  // Scoring
  playerPoints: number;
  opponentPoints: number;
  playerAdvantages: number;
  opponentAdvantages: number;
  ruleSet: RuleSet;
  // Position hold tracking (need 3s / ~1 turn to score)
  lastPositionChange: { position: Position; who: 'player' | 'opponent'; turn: number } | null;
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
  winner: 'player' | 'opponent' | 'draw';
  method: 'submission' | 'points' | 'advantages' | 'draw';
  xpGained: number;
  turns: number;
  playerName: string;
  opponentName: string;
  opponentStyle: Style;
  playerPoints?: number;
  opponentPoints?: number;
  tournamentId?: string;
}

// ── World / Region system ──
export interface WorldRegion {
  id: string;
  name: string;
  description: string;
  styleSpecialty: Style | null;
  unlockRequirements: UnlockRequirement[];
  stampId: string | null;
  stampName: string | null;
  color: string; // for world map display
}

export interface UnlockRequirement {
  type: 'belt' | 'stamp-count' | 'tournament-win' | 'npc-wins';
  value: string | number;
  label: string; // human-readable description
}

export interface Tournament {
  id: string;
  name: string;
  regionId: string;
  bracketSize: 4 | 8 | 16 | 32 | 64;
  beltMin: Belt;
  beltMax: Belt;
  entryFee: number;
  prizePool: { gold: number; silver: number; bronze: number };
  ruleSet: 'points' | 'submission-only' | 'adcc';
}

export interface TournamentResult {
  tournamentId: string;
  placement: 'gold' | 'silver' | 'bronze' | 'out';
  prizeMoney: number;
  timestamp: number;
}

export interface PlayerProgression {
  stamps: string[];
  tournamentResults: TournamentResult[];
  money: number;
  sponsorships: { name: string; income: number }[];
  specialization: string | null;
  currentRegionId: string;
  storyFlags: Record<string, boolean>;
  npcDefeated: Record<string, boolean>;
  npcScouted: Record<string, boolean>;
  trainingSessions: number;
  totalWins: number;
  totalLosses: number;
}
