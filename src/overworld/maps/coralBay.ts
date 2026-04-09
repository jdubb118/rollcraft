import type { NPCDef } from '../overworldTypes';

// Coral Bay — beach-side academy, guard player paradise
export const CORAL_BAY_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,3,6,3,3,2,2,2,2,2,2,2,2,3,3,6,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,5,3,3,2,2,2,2,2,2,2,2,3,3,5,3,3,1],
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

export const CORAL_BAY_SPAWN = { col: 9, row: 13 };

export const CORAL_BAY_NPCS: NPCDef[] = [
  {
    id: 'cb-marina', name: 'Marina', role: 'instructor',
    style: 'guard-player', belt: 'black',
    moves: ['pull-guard', 'sleeve-control', 'triangle', 'armbar-guard', 'omoplata', 'berimbolo-sweep'],
    teachableMoves: ['omoplata', 'sleeve-control'],
    teachCost: 300,
    dialogue: {
      greeting: "Relax. Feel the flow. The guard is like water. Now drown in it.",
      teach: "The guard is not a position. It is a world.",
      defeat: "Beautiful. You passed my guard. Not many can say that. Wave Stamp is yours.",
    },
    position: { col: 3, row: 2 }, wanders: false,
    baseStats: { hp: 68, str: 52, tec: 98, tgh: 58, flx: 95, spd: 72, end: 68 },
    evSpread: { str: 10, tec: 140, tgh: 20, flx: 130, spd: 50, end: 50 },
    frame: 'light',
  },
  {
    id: 'cb-tourney', name: 'Tournament Desk', role: 'tournament-desk',
    style: 'controller', belt: 'black', moves: [],
    dialogue: { greeting: "Coral Bay Pro. 16-person bracket. Purple to Black. Entry: $250." },
    position: { col: 16, row: 4 }, wanders: false,
    tournamentId: 'coral-bay-pro',
  },
  {
    id: 'cb-kai', name: 'Kai', role: 'training-partner',
    style: 'guard-player', belt: 'purple',
    moves: ['pull-guard', 'sleeve-control', 'triangle', 'armbar-guard', 'x-guard-sweep', 'butterfly-sweep', 'omoplata'],
    dialogue: { greeting: "The ocean teaches patience. So does closed guard.", challenge: "Try to pass. I dare you.", defeat: "The wave crashes but the shore remains... wait, you won?" },
    position: { col: 8, row: 5 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 68, str: 55, tec: 90, tgh: 62, flx: 88, spd: 70, end: 68 },
    evSpread: { str: 0, tec: 80, tgh: 15, flx: 70, spd: 30, end: 25 },
    frame: 'light',
  },
  {
    id: 'cb-ray', name: 'Ray', role: 'training-partner',
    style: 'leg-locker', belt: 'purple',
    moves: ['leg-entry', 'heel-hook', 'outside-heel-hook', 'kneebar', 'toe-hold', 'ankle-lock', 'single-leg'],
    dialogue: { greeting: "Coral Bay's secret weapon — leg locks from everywhere.", challenge: "Watch your knees.", defeat: "You survived my leg game. Impressive." },
    position: { col: 12, row: 7 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 65, str: 62, tec: 90, tgh: 55, flx: 88, spd: 78, end: 70 },
    evSpread: { str: 10, tec: 70, tgh: 10, flx: 65, spd: 40, end: 25 },
    frame: 'light',
  },
  {
    id: 'cb-ana', name: 'Ana', role: 'training-partner',
    style: 'berimbolo', belt: 'purple',
    moves: ['pull-guard', 'berimbolo-sweep', 'seatbelt-back-take', 'rnc', 'leg-entry', 'x-guard-sweep'],
    dialogue: { greeting: "I learned from Miyao in Scramble Valley. Now I teach here.", challenge: "Can you keep up?", defeat: "Fast hands. You've grown since Scramble Valley." },
    position: { col: 9, row: 9 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 60, str: 48, tec: 88, tgh: 52, flx: 92, spd: 88, end: 65 },
    evSpread: { str: 5, tec: 60, tgh: 10, flx: 70, spd: 55, end: 20 },
    frame: 'light',
  },
];
