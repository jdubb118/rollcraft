import type { NPCDef } from '../overworldTypes';

// Iron Coast — cliffside mega-gym, champion banners, final stop before Worlds
export const IRON_COAST_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,6,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,6,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,5,3,3,3,2,2,2,2,2,2,2,2,3,3,3,5,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,4,4,3,3,3,2,2,2,2,2,2,2,2,3,3,3,4,4,1],
  [1,4,4,3,3,3,2,2,2,2,2,2,2,2,3,3,3,4,4,1],
  [1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0],
];

export const IRON_COAST_SPAWN = { col: 9, row: 13 };

export const IRON_COAST_NPCS: NPCDef[] = [
  {
    id: 'ic-professor', name: 'The Professor', role: 'instructor',
    style: 'pressure-passer', belt: 'black',
    moves: ['body-lock-pass', 'smash-pass', 'over-under', 'mount-transition', 'cross-collar-mount', 'armbar-mount'],
    teachableMoves: ['body-lock-pass', 'over-under'],
    teachCost: 500,
    dialogue: {
      greeting: "You want the Champion Stamp? Everyone who stands here thinks they're ready. Prove it.",
      teach: "Passing is not about speed. It's about inevitability.",
      defeat: "You're ready for Worlds. Champion Stamp. Last one. Now go.",
    },
    position: { col: 2, row: 2 }, wanders: false,
    baseStats: { hp: 88, str: 92, tec: 85, tgh: 88, flx: 52, spd: 58, end: 90 },
    evSpread: { str: 120, tec: 90, tgh: 70, flx: 20, spd: 30, end: 70 },
    frame: 'heavy',
  },
  {
    id: 'ic-tourney', name: 'Tournament Desk', role: 'tournament-desk',
    style: 'controller', belt: 'black', moves: [],
    dialogue: { greeting: "Iron Coast Grand Prix. 32-person bracket. Black belts only. Entry: $500." },
    position: { col: 17, row: 2 }, wanders: false,
    tournamentId: 'iron-grand-prix',
  },
  {
    id: 'ic-atlas', name: 'Atlas', role: 'training-partner',
    style: 'pressure-passer', belt: 'black',
    moves: ['double-leg', 'body-lock-pass', 'smash-pass', 'over-under', 'underhook', 'americana', 'darce', 'mount-transition'],
    dialogue: { greeting: "Black belt. 15 years. I've forgotten more than most people know.", challenge: "I'll go easy. Just kidding.", defeat: "OK. You're the real deal." },
    position: { col: 8, row: 5 }, wanders: true,
    wanderArea: { minCol: 5, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 90, str: 92, tec: 78, tgh: 88, flx: 48, spd: 55, end: 88 },
    evSpread: { str: 110, tec: 60, tgh: 70, flx: 10, spd: 20, end: 80 },
    frame: 'heavy',
  },
  {
    id: 'ic-nova', name: 'Nova', role: 'training-partner',
    style: 'guard-player', belt: 'black',
    moves: ['pull-guard', 'sleeve-control', 'triangle', 'armbar-guard', 'omoplata', 'berimbolo-sweep', 'x-guard-sweep', 'butterfly-sweep'],
    dialogue: { greeting: "Guard player. World Championship silver medalist. Twice.", challenge: "Try to pass. Nobody has this week.", defeat: "...three times was the charm. Respect." },
    position: { col: 12, row: 7 }, wanders: true,
    wanderArea: { minCol: 5, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 68, str: 55, tec: 95, tgh: 62, flx: 95, spd: 75, end: 72 },
    evSpread: { str: 10, tec: 130, tgh: 20, flx: 120, spd: 50, end: 50 },
    frame: 'light',
  },
  {
    id: 'ic-steel', name: 'Steel', role: 'training-partner',
    style: 'controller', belt: 'black',
    moves: ['collar-grip', 'underhook', 'snap-down', 'cross-collar-mount', 'mount-transition', 'kob-transition', 'americana', 'kimura'],
    dialogue: { greeting: "Methodical. Patient. Inevitable. That's my game.", challenge: "You'll run out of ideas before I run out of patience.", defeat: "You outpaced my control. That takes real skill." },
    position: { col: 9, row: 9 }, wanders: true,
    wanderArea: { minCol: 5, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 82, str: 72, tec: 88, tgh: 80, flx: 62, spd: 65, end: 95 },
    evSpread: { str: 40, tec: 100, tgh: 60, flx: 30, spd: 30, end: 120 },
    frame: 'medium',
  },
];
