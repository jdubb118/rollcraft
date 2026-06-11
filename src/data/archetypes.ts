import type { Archetype, Belt, Frame } from '../engine/types';

// Frame mapping per archetype
export const ARCHETYPE_FRAMES: Record<string, Frame> = {
  'pressure-machine': 'heavy',
  'guard-wizard': 'light',
  'takedown-artist': 'heavy',
  'leg-reaper': 'light',
  'flow-roller': 'light',
  'judo-heavy': 'heavy',
  'finish-hunter': 'medium',
  'chess-player': 'medium',
};

export const ARCHETYPES: Archetype[] = [
  {
    id: 'pressure-machine', name: 'Pressure Machine', style: 'pressure-passer',
    description: 'Smash through guards with relentless top pressure.',
    color: '#8e44ad',
    baseStats: { hp: 85, str: 90, tec: 65, tgh: 85, flx: 50, spd: 55, end: 80 },
    startingMoves: ['double-leg', 'smash-pass', 'americana', 'knee-cut'],
  },
  {
    id: 'guard-wizard', name: 'Guard Wizard', style: 'guard-player',
    description: 'Control the fight from your back with sweeps and subs.',
    color: '#2ecc71',
    baseStats: { hp: 70, str: 55, tec: 95, tgh: 60, flx: 90, spd: 70, end: 65 },
    startingMoves: ['pull-guard', 'scissor-sweep', 'triangle', 'armbar-guard'],
  },
  {
    id: 'takedown-artist', name: 'Takedown Artist', style: 'wrestler',
    description: 'Put them on their back and keep them there.',
    color: '#e74c3c',
    baseStats: { hp: 80, str: 95, tec: 60, tgh: 80, flx: 45, spd: 75, end: 75 },
    startingMoves: ['double-leg', 'single-leg', 'snap-down', 'bridge-escape'],
  },
  {
    id: 'leg-reaper', name: 'Leg Reaper', style: 'leg-locker',
    description: 'Hunt the legs. Heel hooks, kneebars, toe holds.',
    color: '#e67e22',
    baseStats: { hp: 65, str: 60, tec: 90, tgh: 55, flx: 85, spd: 80, end: 70 },
    startingMoves: ['leg-entry', 'heel-hook', 'ankle-lock', 'single-leg'],
  },
  {
    id: 'flow-roller', name: 'Flow Roller', style: 'berimbolo',
    description: 'Invert, spin, and take the back before they know what happened.',
    color: '#00bcd4',
    baseStats: { hp: 60, str: 45, tec: 85, tgh: 50, flx: 95, spd: 90, end: 65 },
    startingMoves: ['pull-guard', 'berimbolo-sweep', 'seatbelt-back-take', 'rnc'],
  },
  {
    id: 'judo-heavy', name: 'Judo Heavy', style: 'judoka',
    description: 'Explosive throws into crushing top control.',
    color: '#f39c12',
    baseStats: { hp: 90, str: 85, tec: 75, tgh: 85, flx: 40, spd: 55, end: 80 },
    startingMoves: ['osoto-gari', 'seoi-nage', 'knee-cut', 'americana'],
  },
  {
    id: 'finish-hunter', name: 'Finish Hunter', style: 'sub-hunter',
    description: 'Always hunting the tap. Chains attacks relentlessly.',
    color: '#e91e63',
    baseStats: { hp: 65, str: 70, tec: 95, tgh: 55, flx: 75, spd: 70, end: 70 },
    startingMoves: ['guillotine', 'darce', 'kimura', 'pull-guard'],
  },
  {
    id: 'chess-player', name: 'Chess Player', style: 'controller',
    description: 'Methodical positional control. Always three steps ahead.',
    color: '#3498db',
    baseStats: { hp: 80, str: 70, tec: 80, tgh: 75, flx: 60, spd: 65, end: 90 },
    startingMoves: ['snap-down', 'kob-transition', 'americana', 'mount-transition'],
  },
];

export function getArchetype(id: string): Archetype | undefined {
  return ARCHETYPES.find(a => a.id === id);
}

// ── Belt-scaled move pools ──
// Generated opponents draw from a 13-move pool sliced by belt, so a black-belt
// Worlds finalist fights like one instead of with a white belt's 4 moves.
// Pool order matters: the first 4 must be a functional white-belt kit
// (standing entry + core game). Fundamentals fill any remaining gaps in battle.
export const ARCHETYPE_MOVE_POOLS: Record<string, string[]> = {
  'pressure-machine': ['double-leg', 'knee-cut', 'americana', 'smash-pass', 'posture-up', 'over-under', 'arm-triangle', 'shrimp-escape', 'kob-transition', 'body-lock-pass', 'ezekiel', 'guard-slam', 'darce'],
  'guard-wizard': ['pull-guard', 'scissor-sweep', 'triangle', 'armbar-guard', 'guard-recovery', 'hip-bump', 'butterfly-sweep', 'omoplata', 'elbow-escape', 'flower-sweep', 'x-guard-sweep', 'spider-sweep', 'gogoplata'],
  'takedown-artist': ['double-leg', 'single-leg', 'snap-down', 'bridge-escape', 'high-crotch', 'front-headlock', 'turtle-standup', 'underhook-escape', 'russian-tie', 'ankle-pick', 'firemans-carry', 'suplex', 'arm-drag-back'],
  'leg-reaper': ['leg-entry', 'heel-hook', 'ankle-lock', 'single-leg', 'toe-hold', 'kneebar', 'leg-reposition', 'saddle-entry', 'estima-lock', 'imanari-roll', 'outside-heel-hook', 'calf-slicer', 'fifty-fifty-sweep'],
  'flow-roller': ['pull-guard', 'berimbolo-sweep', 'seatbelt-back-take', 'rnc', 'dlr-sweep', 'granby-roll', 'back-take-transition', 'reverse-dlr', 'long-step', 'armbar-back', 'dlr-to-back', 'mount-to-back', 'sit-up-sweep'],
  // clinch-entry FIRST — judoka throws need the clinch; without an entry this
  // archetype could not play the game at all (0.8% sim win rate).
  'judo-heavy': ['clinch-entry', 'osoto-gari', 'knee-cut', 'americana', 'seoi-nage', 'ouchi-gari', 'foot-sweep', 'bridge-escape', 'kob-transition', 'harai-goshi', 'uchi-mata', 'tani-otoshi', 'kata-guruma'],
  'finish-hunter': ['guillotine', 'kimura', 'pull-guard', 'darce', 'snap-down', 'triangle', 'anaconda', 'front-headlock', 'armbar-mount', 'arm-triangle', 'loop-choke', 'ezekiel', 'mounted-triangle'],
  'chess-player': ['snap-down', 'kob-transition', 'americana', 'mount-transition', 'clinch-entry', 'ns-transition', 'shrimp-escape', 'cross-collar-mount', 'ezekiel', 'kimura', 'paper-cutter', 'gift-wrap', 'ns-choke'],
};

const BELT_POOL_SIZE: Record<Belt, number> = {
  white: 4, blue: 6, purple: 8, brown: 10, black: 12,
};

/** The moveset a generated opponent of this archetype gets at this belt. */
export function getArchetypeMoves(archetypeId: string, belt: Belt): string[] {
  const pool = ARCHETYPE_MOVE_POOLS[archetypeId];
  if (!pool) return getArchetype(archetypeId)?.startingMoves ?? [];
  return pool.slice(0, BELT_POOL_SIZE[belt]);
}
