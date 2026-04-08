import type { NPCDef } from '../overworldTypes';

// 20 cols x 15 rows — open-air warehouse gym, berimbolo/inversions
// More open mat space, industrial feel
export const SCRAMBLE_VALLEY_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,3,6,3,3,2,2,2,2,2,2,2,2,3,3,3,6,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,5,3,3,2,2,2,2,2,2,2,2,3,3,5,3,3,1],
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

export const SCRAMBLE_VALLEY_SPAWN = { col: 9, row: 13 };

export const SCRAMBLE_VALLEY_NPCS: NPCDef[] = [
  // Head Instructor — Prof. Miyao (berimbolo master, gym leader equivalent)
  {
    id: 'sv-miyao', name: 'Prof. Miyao', role: 'instructor',
    style: 'berimbolo', belt: 'black',
    moves: ['berimbolo-sweep', 'pull-guard', 'seatbelt-back-take', 'rnc', 'leg-entry', 'heel-hook'],
    teachableMoves: ['berimbolo-sweep', 'seatbelt-back-take'],
    teachCost: 200,
    dialogue: {
      greeting: "Welcome to Scramble Valley. Here, we never stop moving.",
      teach: "The berimbolo is not a trick. It is a philosophy.",
      defeat: "You've earned the Scramble Stamp. Wear it well.",
    },
    position: { col: 3, row: 2 }, wanders: false,
    baseStats: { hp: 60, str: 50, tec: 95, tgh: 55, flx: 95, spd: 90, end: 70 },
    evSpread: { str: 20, tec: 120, tgh: 30, flx: 130, spd: 80, end: 20 },
    frame: 'light',
  },
  // Visiting Instructor — Leg lock teacher
  {
    id: 'sv-lachlan', name: 'Lachlan', role: 'instructor',
    style: 'leg-locker', belt: 'black',
    moves: ['leg-entry', 'heel-hook', 'kneebar', 'toe-hold', 'ankle-lock', 'outside-heel-hook'],
    teachableMoves: ['outside-heel-hook', 'toe-hold'],
    teachCost: 250,
    dialogue: {
      greeting: "G'day. I'm visiting for the week. Fancy learning some leg locks?",
      teach: "The 50/50 is a home. Once you're there, the finish is inevitable.",
    },
    position: { col: 16, row: 2 }, wanders: false,
    baseStats: { hp: 65, str: 60, tec: 92, tgh: 55, flx: 88, spd: 75, end: 68 },
    evSpread: { str: 15, tec: 130, tgh: 20, flx: 120, spd: 60, end: 55 },
    frame: 'light',
  },
  // Tournament desk
  {
    id: 'sv-tourney', name: 'Tournament Desk', role: 'tournament-desk',
    style: 'controller', belt: 'black',
    moves: [],
    dialogue: {
      greeting: "Welcome to the Scramble Valley Open! 4-person bracket, all belts welcome. Entry fee: $50.",
    },
    position: { col: 16, row: 4 }, wanders: false,
    tournamentId: 'scramble-open',
  },
  // Training partners — scaling difficulty
  {
    id: 'sv-paulo', name: 'Paulo', role: 'training-partner',
    style: 'berimbolo', belt: 'white',
    moves: ['pull-guard', 'berimbolo-sweep', 'scissor-sweep', 'bridge-escape'],
    dialogue: {
      greeting: "I just started training inversions. Still kinda dizzy.",
      challenge: "Let's flow!",
      defeat: "Whoa, nice. Teach me that later?",
    },
    position: { col: 8, row: 4 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 60, str: 50, tec: 75, tgh: 55, flx: 80, spd: 78, end: 65 },
    evSpread: { str: 5, tec: 20, tgh: 5, flx: 25, spd: 15, end: 5 },
    frame: 'light',
  },
  {
    id: 'sv-jade', name: 'Jade', role: 'training-partner',
    style: 'guard-player', belt: 'white',
    moves: ['pull-guard', 'triangle', 'armbar-guard', 'shrimp-escape'],
    dialogue: {
      greeting: "I came here from Coral Bay to work on my inversions.",
      challenge: "Ready when you are.",
      defeat: "Good match. Your passing is getting sharp.",
    },
    position: { col: 11, row: 6 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 65, str: 50, tec: 82, tgh: 58, flx: 85, spd: 72, end: 62 },
    evSpread: { str: 0, tec: 25, tgh: 10, flx: 20, spd: 10, end: 10 },
    frame: 'light',
  },
  {
    id: 'sv-diego', name: 'Diego', role: 'training-partner',
    style: 'berimbolo', belt: 'blue',
    moves: ['pull-guard', 'berimbolo-sweep', 'seatbelt-back-take', 'rnc', 'leg-entry', 'x-guard-sweep'],
    dialogue: {
      greeting: "I've been training under Miyao for two years. My back takes are nasty.",
      challenge: "You want the smoke? Let's go.",
      defeat: "Damn. Respect. You earned that one.",
    },
    position: { col: 9, row: 8 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 62, str: 55, tec: 88, tgh: 55, flx: 90, spd: 85, end: 68 },
    evSpread: { str: 5, tec: 45, tgh: 10, flx: 40, spd: 30, end: 10 },
    frame: 'light',
  },
  {
    id: 'sv-tank', name: 'Tank', role: 'training-partner',
    style: 'wrestler', belt: 'blue',
    moves: ['double-leg', 'single-leg', 'suplex', 'smash-pass', 'americana', 'snap-down'],
    dialogue: {
      greeting: "I'm the only wrestler at this gym. Everyone else pulls guard. Makes me easy pickings for them... or them for me.",
      challenge: "Let's see if your fancy guard survives my pressure.",
      defeat: "Alright, alright. You got me. But I'll be back.",
    },
    position: { col: 7, row: 10 }, wanders: true,
    wanderArea: { minCol: 6, maxCol: 14, minRow: 2, maxRow: 10 },
    baseStats: { hp: 85, str: 88, tec: 58, tgh: 80, flx: 45, spd: 68, end: 75 },
    evSpread: { str: 40, tec: 5, tgh: 30, flx: 0, spd: 15, end: 20 },
    frame: 'heavy',
  },
];
