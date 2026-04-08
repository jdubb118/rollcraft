import type { Archetype } from '../engine/types';

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
