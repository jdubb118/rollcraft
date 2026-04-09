import type { NPCDef } from '../overworldTypes';

// Summit City — World Championship coliseum, banners of champions
export const SUMMIT_CITY_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,6,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,6,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,5,3,3,2,2,2,2,2,2,2,2,3,3,5,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,6,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,6,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,2,2,2,2,2,2,2,2,2,2,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,3,3,3,3,3,2,2,2,2,2,2,2,2,3,3,3,3,3,1],
  [1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0],
];

export const SUMMIT_CITY_SPAWN = { col: 9, row: 13 };

export const SUMMIT_CITY_NPCS: NPCDef[] = [
  // World Championship desk
  {
    id: 'sc-tourney', name: 'World Championship', role: 'tournament-desk',
    style: 'controller', belt: 'black', moves: [],
    dialogue: { greeting: "Welcome to the World Championships. 32 of the best grapplers on the planet. Entry: $1,000." },
    position: { col: 9, row: 3 }, wanders: false,
    tournamentId: 'world-championship',
  },
  // The Ghost — legendary semifinal opponent (also wandering here)
  {
    id: 'sc-ghost', name: 'The Ghost', role: 'training-partner',
    style: 'controller', belt: 'black',
    moves: ['collar-grip', 'underhook', 'snap-down', 'cross-collar-mount', 'mount-transition', 'kob-transition', 'americana', 'kimura', 'rnc', 'seatbelt-back-take'],
    dialogue: {
      greeting: "I've won this tournament three times. You remind me of myself at your age.",
      challenge: "Let's see if you're ready.",
      defeat: "The throne is yours to take. One more match. Don't hold back.",
    },
    position: { col: 5, row: 7 }, wanders: true,
    wanderArea: { minCol: 3, maxCol: 16, minRow: 4, maxRow: 10 },
    baseStats: { hp: 85, str: 78, tec: 95, tgh: 82, flx: 68, spd: 70, end: 95 },
    evSpread: { str: 60, tec: 140, tgh: 50, flx: 40, spd: 40, end: 70 },
    frame: 'medium',
  },
  // Champion-level sparring partners
  {
    id: 'sc-legend1', name: 'Grandmaster Leo', role: 'training-partner',
    style: 'sub-hunter', belt: 'black',
    moves: ['guillotine', 'darce', 'anaconda', 'rnc', 'armbar-mount', 'mounted-triangle', 'seatbelt-back-take', 'front-headlock'],
    dialogue: { greeting: "Retired champion. I just come here to stay sharp.", challenge: "One more roll for old times sake.", defeat: "The next generation is here." },
    position: { col: 13, row: 6 }, wanders: true,
    wanderArea: { minCol: 3, maxCol: 16, minRow: 4, maxRow: 10 },
    baseStats: { hp: 70, str: 75, tec: 98, tgh: 65, flx: 80, spd: 72, end: 75 },
    evSpread: { str: 30, tec: 150, tgh: 20, flx: 70, spd: 50, end: 60 },
    frame: 'medium',
  },
  {
    id: 'sc-legend2', name: 'Queen Gabi', role: 'training-partner',
    style: 'pressure-passer', belt: 'black',
    moves: ['double-leg', 'body-lock-pass', 'smash-pass', 'over-under', 'americana', 'mount-transition', 'cross-collar-mount', 'underhook'],
    dialogue: { greeting: "Five-time champion. I own this mat.", challenge: "You want to test yourself? Come.", defeat: "You might actually win Worlds." },
    position: { col: 8, row: 9 }, wanders: true,
    wanderArea: { minCol: 3, maxCol: 16, minRow: 4, maxRow: 10 },
    baseStats: { hp: 92, str: 95, tec: 80, tgh: 92, flx: 50, spd: 58, end: 90 },
    evSpread: { str: 130, tec: 70, tgh: 80, flx: 10, spd: 20, end: 90 },
    frame: 'heavy',
  },
];
