import type { NPCDef } from '../overworldTypes';

// Nova Camp — high-tech training facility, submission specialists
export const NOVA_CAMP_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,6,3,3,3,2,2,2,2,2,2,2,2,3,3,3,6,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,5,3,3,2,2,2,2,2,2,2,2,3,3,5,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0],
];

export const NOVA_CAMP_SPAWN = { col: 9, row: 13 };

export const NOVA_CAMP_NPCS: NPCDef[] = [
  {
    id: 'nc-yun', name: 'Dr. Yun', role: 'instructor',
    style: 'sub-hunter', belt: 'black',
    moves: ['guillotine', 'darce', 'anaconda', 'rnc', 'armbar-mount', 'mounted-triangle'],
    teachableMoves: ['darce', 'anaconda', 'mounted-triangle'],
    teachCost: 400,
    dialogue: {
      greeting: "I've watched your footage. Your A-game is strong. Your B-game is not. Let's see how you adapt when Plan A fails.",
      teach: "Every submission is a system. Entry, control, finish.",
      defeat: "Fascinating. You adapted mid-round. Precision Stamp. You've earned the data.",
    },
    position: { col: 3, row: 2 }, wanders: false,
    baseStats: { hp: 65, str: 68, tec: 98, tgh: 58, flx: 78, spd: 75, end: 72 },
    evSpread: { str: 30, tec: 150, tgh: 20, flx: 60, spd: 60, end: 80 },
    frame: 'medium',
  },
  {
    id: 'nc-tourney', name: 'Tournament Desk', role: 'tournament-desk',
    style: 'controller', belt: 'black', moves: [],
    dialogue: { greeting: "Nova Pro Championship. 32-person bracket. Brown and Black. Entry: $400." },
    position: { col: 16, row: 2 }, wanders: false,
    tournamentId: 'nova-pro',
  },
  {
    id: 'nc-elena', name: 'Elena', role: 'training-partner',
    style: 'leg-locker', belt: 'brown',
    moves: ['leg-entry', 'heel-hook', 'outside-heel-hook', 'kneebar', 'toe-hold', 'ankle-lock', 'single-leg'],
    dialogue: { greeting: "I specialize in heel hooks. Dr. Yun calls me the Reaper.", challenge: "Watch your knees.", defeat: "You defended every entry. Impressive awareness." },
    position: { col: 8, row: 5 }, wanders: true,
    wanderArea: { minCol: 5, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 62, str: 60, tec: 92, tgh: 55, flx: 90, spd: 80, end: 70 },
    evSpread: { str: 15, tec: 90, tgh: 15, flx: 85, spd: 50, end: 25 },
    frame: 'light',
  },
  {
    id: 'nc-dante', name: 'Dante', role: 'training-partner',
    style: 'controller', belt: 'brown',
    moves: ['collar-grip', 'underhook', 'cross-collar-mount', 'mount-transition', 'kob-transition', 'americana', 'kimura', 'snap-down'],
    dialogue: { greeting: "Positional control wins matches. Submissions win highlights. I prefer winning.", challenge: "Show me your passing.", defeat: "You controlled the pace. That's rare at brown belt." },
    position: { col: 12, row: 7 }, wanders: true,
    wanderArea: { minCol: 5, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 80, str: 72, tec: 85, tgh: 78, flx: 60, spd: 65, end: 92 },
    evSpread: { str: 40, tec: 80, tgh: 50, flx: 20, spd: 30, end: 80 },
    frame: 'medium',
  },
  {
    id: 'nc-phoenix', name: 'Phoenix', role: 'training-partner',
    style: 'berimbolo', belt: 'brown',
    moves: ['pull-guard', 'berimbolo-sweep', 'seatbelt-back-take', 'rnc', 'leg-entry', 'heel-hook', 'x-guard-sweep'],
    dialogue: { greeting: "I trained at Scramble Valley, Coral Bay, and now here. My game is everything.", challenge: "You won't know what's coming.", defeat: "That was a chess match. Well played." },
    position: { col: 9, row: 9 }, wanders: true,
    wanderArea: { minCol: 5, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 60, str: 50, tec: 90, tgh: 55, flx: 92, spd: 88, end: 68 },
    evSpread: { str: 10, tec: 80, tgh: 15, flx: 80, spd: 60, end: 35 },
    frame: 'light',
  },
];
