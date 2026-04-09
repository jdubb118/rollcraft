import type { NPCDef } from '../overworldTypes';

// Steel Mountain — wrestling room, no AC, pure grind
export const STEEL_MOUNTAIN_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,6,3,3,2,2,2,2,2,2,2,2,2,2,3,3,6,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0],
];

export const STEEL_MOUNTAIN_SPAWN = { col: 9, row: 13 };

export const STEEL_MOUNTAIN_NPCS: NPCDef[] = [
  {
    id: 'sm-mike', name: 'Iron Mike', role: 'instructor',
    style: 'wrestler', belt: 'black',
    moves: ['double-leg', 'single-leg', 'suplex', 'snap-down', 'underhook', 'pummeling'],
    teachableMoves: ['suplex', 'underhook', 'pummeling'],
    teachCost: 250,
    dialogue: {
      greeting: "You don't look like a wrestler. Good. I love proving people wrong... about what wrestlers can do to them.",
      teach: "Hips low. Level change. Explode. Again.",
      defeat: "Tough kid. Take the Iron Stamp. And eat something. You look skinny.",
    },
    position: { col: 2, row: 2 }, wanders: false,
    baseStats: { hp: 90, str: 95, tec: 65, tgh: 90, flx: 40, spd: 70, end: 85 },
    evSpread: { str: 140, tec: 30, tgh: 80, flx: 10, spd: 60, end: 80 },
    frame: 'heavy',
  },
  {
    id: 'sm-tourney', name: 'Tournament Desk', role: 'tournament-desk',
    style: 'controller', belt: 'black', moves: [],
    dialogue: { greeting: "Steel Mountain Invitational. 8-person bracket. Blue to Brown. Entry: $150." },
    position: { col: 17, row: 2 }, wanders: false,
    tournamentId: 'steel-invitational',
  },
  {
    id: 'sm-tyler', name: 'Tyler', role: 'training-partner',
    style: 'wrestler', belt: 'blue',
    moves: ['double-leg', 'single-leg', 'snap-down', 'underhook', 'smash-pass', 'bridge-escape'],
    dialogue: { greeting: "Division 1 wrestler. Picked up BJJ last year.", challenge: "Try to take me down.", defeat: "OK you got hands. Respect." },
    position: { col: 8, row: 4 }, wanders: true,
    wanderArea: { minCol: 5, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 82, str: 88, tec: 58, tgh: 78, flx: 45, spd: 75, end: 72 },
    evSpread: { str: 40, tec: 10, tgh: 25, flx: 0, spd: 25, end: 20 },
    frame: 'heavy',
  },
  {
    id: 'sm-sarah', name: 'Sarah', role: 'training-partner',
    style: 'judoka', belt: 'blue',
    moves: ['osoto-gari', 'seoi-nage', 'harai-goshi', 'collar-grip', 'knee-cut', 'americana'],
    dialogue: { greeting: "Judo black belt. Learning the ground game.", challenge: "Let's start standing.", defeat: "Nice ground game. I need to work on that." },
    position: { col: 11, row: 7 }, wanders: true,
    wanderArea: { minCol: 5, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 75, str: 82, tec: 72, tgh: 75, flx: 48, spd: 65, end: 70 },
    evSpread: { str: 35, tec: 30, tgh: 20, flx: 5, spd: 15, end: 15 },
    frame: 'medium',
  },
  {
    id: 'sm-beast', name: 'Beast', role: 'training-partner',
    style: 'wrestler', belt: 'purple',
    moves: ['double-leg', 'suplex', 'single-leg', 'snap-down', 'underhook', 'pummeling', 'smash-pass', 'americana'],
    dialogue: { greeting: "They call me Beast. Not because I'm big. Because I don't stop.", challenge: "Ready for a war?", defeat: "...you stopped the Beast." },
    position: { col: 9, row: 9 }, wanders: true,
    wanderArea: { minCol: 5, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 92, str: 95, tec: 62, tgh: 88, flx: 42, spd: 68, end: 85 },
    evSpread: { str: 90, tec: 20, tgh: 60, flx: 0, spd: 30, end: 50 },
    frame: 'heavy',
  },
];
