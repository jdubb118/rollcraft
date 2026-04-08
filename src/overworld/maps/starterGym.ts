import type { NPCDef } from '../overworldTypes';

// 20 cols x 15 rows = 320x240 at 16px tiles
// Legend: 0=void, 1=wall, 2=mat, 3=floor, 4=locker, 5=desk, 6=board, 7=door
export const STARTER_GYM: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,6,3,3,1,2,2,2,2,2,2,2,2,1,3,3,3,3,1],
  [1,3,3,3,3,1,2,2,2,2,2,2,2,2,1,3,3,3,3,1],
  [1,3,3,3,3,1,2,2,2,2,2,2,2,2,1,3,3,5,3,1],
  [1,3,3,3,3,1,2,2,2,2,2,2,2,2,1,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,1,2,2,2,2,2,2,2,2,1,3,3,3,3,1],
  [1,4,4,3,3,1,2,2,2,2,2,2,2,2,1,3,3,3,3,1],
  [1,4,4,3,3,1,2,2,2,2,2,2,2,2,1,3,3,3,3,1],
  [1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0],
];

export const PLAYER_SPAWN = { col: 9, row: 13 };

export const STARTER_GYM_NPCS: NPCDef[] = [
  // ── Professor / Coach — belt promotions ──
  {
    id: 'prof-helio', name: 'Prof. Helio', role: 'professor',
    style: 'controller', belt: 'black',
    moves: ['snap-down', 'kob-transition', 'americana', 'mount-transition', 'cross-collar-mount', 'kimura'],
    dialogue: {
      greeting: "Welcome to the academy. Train hard, tap often.",
      promotion: "You've earned your next belt. Wear it with pride.",
    },
    position: { col: 16, row: 2 }, wanders: false,
    baseStats: { hp: 80, str: 70, tec: 80, tgh: 75, flx: 60, spd: 65, end: 90 },
    evSpread: { str: 40, tec: 100, tgh: 60, flx: 40, spd: 40, end: 120 },
    frame: 'medium',
  },
  // ── Instructor — Guard Master ──
  {
    id: 'instr-marcelo', name: 'Marcelo', role: 'instructor',
    style: 'guard-player', belt: 'black',
    moves: ['pull-guard', 'guillotine', 'x-guard-sweep', 'butterfly-sweep', 'armbar-guard', 'triangle'],
    teachableMoves: ['guillotine', 'butterfly-sweep', 'x-guard-sweep'],
    teachCost: 150,
    dialogue: {
      greeting: "The guard is where the magic happens, my friend.",
      teach: "Let me show you something beautiful...",
    },
    position: { col: 2, row: 7 }, wanders: false,
    baseStats: { hp: 70, str: 55, tec: 95, tgh: 60, flx: 90, spd: 70, end: 65 },
    evSpread: { str: 20, tec: 130, tgh: 30, flx: 120, spd: 50, end: 50 },
    frame: 'light',
  },
  // ── Instructor — Leg Lock Specialist ──
  {
    id: 'instr-craig', name: 'Craig', role: 'instructor',
    style: 'leg-locker', belt: 'black',
    moves: ['leg-entry', 'heel-hook', 'kneebar', 'toe-hold', 'ankle-lock', 'single-leg'],
    teachableMoves: ['heel-hook', 'kneebar', 'leg-entry'],
    teachCost: 200,
    requiredBelt: 'blue',
    dialogue: {
      greeting: "The legs. Everyone forgets about the legs.",
      teach: "Enter the legs. Control the hips. Finish.",
    },
    position: { col: 17, row: 7 }, wanders: false,
    baseStats: { hp: 65, str: 60, tec: 90, tgh: 55, flx: 85, spd: 80, end: 70 },
    evSpread: { str: 20, tec: 120, tgh: 30, flx: 130, spd: 60, end: 40 },
    frame: 'light',
  },
  // ── Training partners ──
  {
    id: 'tp-renzo', name: 'Renzo', role: 'training-partner',
    style: 'wrestler', belt: 'white',
    moves: ['double-leg', 'single-leg', 'snap-down', 'bridge-escape'],
    dialogue: {
      greeting: "Hey! You look like you need some mat time.",
      challenge: "Let's roll!",
      defeat: "Good round. You're getting better.",
    },
    position: { col: 8, row: 5 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 13, minRow: 2, maxRow: 9 },
    baseStats: { hp: 80, str: 85, tec: 55, tgh: 75, flx: 45, spd: 70, end: 70 },
    evSpread: { str: 30, tec: 0, tgh: 20, flx: 0, spd: 10, end: 10 },
    frame: 'heavy',
  },
  {
    id: 'tp-rickson', name: 'Rickson', role: 'training-partner',
    style: 'pressure-passer', belt: 'white',
    moves: ['double-leg', 'smash-pass', 'americana', 'knee-cut'],
    dialogue: {
      greeting: "Flow with the go, bro.",
      challenge: "Ready to roll?",
      defeat: "Oss. Good training.",
    },
    position: { col: 11, row: 7 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 13, minRow: 2, maxRow: 9 },
    baseStats: { hp: 85, str: 80, tec: 60, tgh: 80, flx: 50, spd: 55, end: 75 },
    evSpread: { str: 25, tec: 5, tgh: 20, flx: 0, spd: 5, end: 15 },
    frame: 'heavy',
  },
  {
    id: 'tp-keenan', name: 'Keenan', role: 'training-partner',
    style: 'guard-player', belt: 'blue',
    moves: ['pull-guard', 'scissor-sweep', 'triangle', 'omoplata', 'berimbolo-sweep', 'armbar-guard'],
    dialogue: {
      greeting: "You train lapel guard? No? You should.",
      challenge: "Let's go. I'll pull guard.",
      defeat: "Nice. You passed my guard. Respect.",
    },
    position: { col: 9, row: 3 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 13, minRow: 2, maxRow: 9 },
    baseStats: { hp: 70, str: 55, tec: 90, tgh: 60, flx: 85, spd: 70, end: 65 },
    evSpread: { str: 0, tec: 40, tgh: 10, flx: 35, spd: 20, end: 15 },
    frame: 'light',
  },
  {
    id: 'tp-gordon', name: 'Gordon', role: 'training-partner',
    style: 'sub-hunter', belt: 'blue',
    moves: ['guillotine', 'darce', 'kimura', 'pull-guard', 'rnc', 'seatbelt-back-take'],
    dialogue: {
      greeting: "I'm going to submit you. Just letting you know.",
      challenge: "You and me. Let's go.",
      defeat: "...I'll get you next time.",
    },
    position: { col: 7, row: 8 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 13, minRow: 2, maxRow: 9 },
    baseStats: { hp: 65, str: 70, tec: 92, tgh: 58, flx: 75, spd: 72, end: 68 },
    evSpread: { str: 10, tec: 50, tgh: 5, flx: 20, spd: 15, end: 20 },
    frame: 'medium',
  },
];
