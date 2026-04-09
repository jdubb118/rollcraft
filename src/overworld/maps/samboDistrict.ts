import type { NPCDef } from '../overworldTypes';

// Sambo District — underground fight gym, judo/sambo, dim lights
export const SAMBO_DISTRICT_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,3,3,3,1,2,2,2,2,2,2,2,2,1,3,3,3,3,1],
  [1,3,6,3,3,1,2,2,2,2,2,2,2,2,1,3,3,6,3,1],
  [1,3,3,5,3,1,2,2,2,2,2,2,2,2,1,3,5,3,3,1],
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

export const SAMBO_DISTRICT_SPAWN = { col: 9, row: 13 };

export const SAMBO_DISTRICT_NPCS: NPCDef[] = [
  {
    id: 'sd-viktor', name: 'Viktor', role: 'instructor',
    style: 'judoka', belt: 'black',
    moves: ['osoto-gari', 'seoi-nage', 'harai-goshi', 'o-goshi', 'kata-guruma', 'suplex'],
    teachableMoves: ['kata-guruma', 'harai-goshi'],
    teachCost: 350,
    dialogue: {
      greeting: "In Russia, grappling is not a hobby. It is survival. Show me you understand.",
      teach: "Throw with your whole body. Not just your arms.",
      defeat: "You fight like you've been hungry before. Combat Stamp. Don't waste it.",
    },
    position: { col: 2, row: 2 }, wanders: false,
    baseStats: { hp: 90, str: 92, tec: 78, tgh: 90, flx: 42, spd: 60, end: 85 },
    evSpread: { str: 130, tec: 60, tgh: 80, flx: 10, spd: 40, end: 80 },
    frame: 'heavy',
  },
  {
    id: 'sd-tourney', name: 'Tournament Desk', role: 'tournament-desk',
    style: 'controller', belt: 'black', moves: [],
    dialogue: { greeting: "Sambo District Cup. 16-person bracket. Brown and Black only. Entry: $250." },
    position: { col: 17, row: 2 }, wanders: false,
    tournamentId: 'sambo-cup',
  },
  {
    id: 'sd-nikolai', name: 'Nikolai', role: 'training-partner',
    style: 'judoka', belt: 'purple',
    moves: ['osoto-gari', 'seoi-nage', 'collar-grip', 'harai-goshi', 'knee-cut', 'americana'],
    dialogue: { greeting: "Sambo and judo. Two sides of same coin.", challenge: "Stand with me.", defeat: "Strong clinch work. Viktor would approve." },
    position: { col: 8, row: 5 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 13, minRow: 2, maxRow: 9 },
    baseStats: { hp: 85, str: 88, tec: 72, tgh: 82, flx: 45, spd: 62, end: 78 },
    evSpread: { str: 60, tec: 40, tgh: 40, flx: 5, spd: 20, end: 35 },
    frame: 'heavy',
  },
  {
    id: 'sd-yuki', name: 'Yuki', role: 'training-partner',
    style: 'sub-hunter', belt: 'brown',
    moves: ['guillotine', 'darce', 'anaconda', 'kimura', 'snap-down', 'front-headlock'],
    dialogue: { greeting: "Brown belt. 12 years. I finish from everywhere.", challenge: "Try not to give me your neck.", defeat: "...clean escape. You've been training your defense." },
    position: { col: 11, row: 7 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 13, minRow: 2, maxRow: 9 },
    baseStats: { hp: 68, str: 72, tec: 92, tgh: 60, flx: 75, spd: 72, end: 72 },
    evSpread: { str: 30, tec: 100, tgh: 20, flx: 50, spd: 40, end: 40 },
    frame: 'medium',
  },
  {
    id: 'sd-ivan', name: 'Ivan', role: 'training-partner',
    style: 'wrestler', belt: 'brown',
    moves: ['double-leg', 'suplex', 'single-leg', 'underhook', 'pummeling', 'snap-down', 'smash-pass', 'body-lock-pass'],
    dialogue: { greeting: "Wrestling since age 5. BJJ since last year. Still enough.", challenge: "I wrestle. You try to survive.", defeat: "You have good hips. That's rare." },
    position: { col: 9, row: 9 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 13, minRow: 2, maxRow: 9 },
    baseStats: { hp: 92, str: 95, tec: 60, tgh: 90, flx: 40, spd: 72, end: 88 },
    evSpread: { str: 100, tec: 20, tgh: 70, flx: 0, spd: 40, end: 70 },
    frame: 'heavy',
  },
];
