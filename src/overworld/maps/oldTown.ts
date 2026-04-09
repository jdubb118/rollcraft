import type { NPCDef } from '../overworldTypes';

// Old Town — traditional academy, positional BJJ, gi-only feel
export const OLD_TOWN_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,6,3,3,3,1,2,2,2,2,2,2,2,2,1,3,3,3,6,1],
  [1,3,3,3,3,1,2,2,2,2,2,2,2,2,1,3,3,3,3,1],
  [1,3,5,3,3,1,2,2,2,2,2,2,2,2,1,3,3,5,3,1],
  [1,3,3,3,3,1,2,2,2,2,2,2,2,2,1,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,1,2,2,2,2,2,2,2,2,1,3,3,3,3,1],
  [1,4,4,3,3,1,2,2,2,2,2,2,2,2,1,3,3,4,4,1],
  [1,4,4,3,3,1,2,2,2,2,2,2,2,2,1,3,3,4,4,1],
  [1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0],
];

export const OLD_TOWN_SPAWN = { col: 9, row: 13 };

export const OLD_TOWN_NPCS: NPCDef[] = [
  {
    id: 'ot-tanaka', name: 'Master Tanaka', role: 'instructor',
    style: 'controller', belt: 'black',
    moves: ['collar-grip', 'cross-collar-mount', 'americana', 'kimura', 'kob-transition', 'mount-transition'],
    teachableMoves: ['collar-grip', 'cross-collar-mount', 'kob-transition'],
    teachCost: 200,
    dialogue: {
      greeting: "Tradition is not a limitation. It is a foundation. Show me your fundamentals.",
      teach: "Position before submission. Always.",
      defeat: "Clean technique. Your coach taught you well. Take the Tradition Stamp.",
    },
    position: { col: 2, row: 2 }, wanders: false,
    baseStats: { hp: 80, str: 70, tec: 90, tgh: 80, flx: 60, spd: 60, end: 95 },
    evSpread: { str: 40, tec: 120, tgh: 60, flx: 30, spd: 30, end: 120 },
    frame: 'medium',
  },
  {
    id: 'ot-tourney', name: 'Tournament Desk', role: 'tournament-desk',
    style: 'controller', belt: 'black', moves: [],
    dialogue: { greeting: "Old Town Classic. 8-person bracket. Tradition meets competition. Entry: $100." },
    position: { col: 17, row: 2 }, wanders: false,
    tournamentId: 'old-town-classic',
  },
  {
    id: 'ot-marco', name: 'Marco', role: 'training-partner',
    style: 'controller', belt: 'blue',
    moves: ['collar-grip', 'snap-down', 'cross-collar-mount', 'americana', 'knee-cut', 'mount-transition'],
    dialogue: { greeting: "I've trained here since I was a kid. This gym is my life.", challenge: "Let's see your game.", defeat: "Solid. Master Tanaka would be impressed." },
    position: { col: 8, row: 4 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 13, minRow: 2, maxRow: 9 },
    baseStats: { hp: 78, str: 68, tec: 85, tgh: 72, flx: 58, spd: 62, end: 82 },
    evSpread: { str: 15, tec: 45, tgh: 20, flx: 10, spd: 10, end: 30 },
    frame: 'medium',
  },
  {
    id: 'ot-lucia', name: 'Lucia', role: 'training-partner',
    style: 'guard-player', belt: 'blue',
    moves: ['pull-guard', 'sleeve-control', 'triangle', 'armbar-guard', 'scissor-sweep', 'omoplata'],
    dialogue: { greeting: "They say Old Town is all top game. They're wrong.", challenge: "Pull guard on me. I dare you.", defeat: "You broke my guard? Nobody does that here." },
    position: { col: 11, row: 6 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 13, minRow: 2, maxRow: 9 },
    baseStats: { hp: 68, str: 52, tec: 88, tgh: 60, flx: 85, spd: 72, end: 65 },
    evSpread: { str: 0, tec: 40, tgh: 10, flx: 35, spd: 20, end: 15 },
    frame: 'light',
  },
  {
    id: 'ot-bruno', name: 'Bruno', role: 'training-partner',
    style: 'pressure-passer', belt: 'purple',
    moves: ['double-leg', 'smash-pass', 'over-under', 'body-lock-pass', 'americana', 'darce', 'underhook'],
    dialogue: { greeting: "Purple belt. 8 years of training. You ready for real pressure?", challenge: "I'm going to flatten you.", defeat: "...respect. That was a fight." },
    position: { col: 9, row: 8 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 13, minRow: 2, maxRow: 9 },
    baseStats: { hp: 88, str: 90, tec: 70, tgh: 85, flx: 48, spd: 55, end: 82 },
    evSpread: { str: 80, tec: 30, tgh: 50, flx: 0, spd: 10, end: 50 },
    frame: 'heavy',
  },
];
