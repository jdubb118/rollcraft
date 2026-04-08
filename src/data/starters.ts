import type { Style, BaseStats } from '../engine/types';

export type GiColor = 'white' | 'blue' | 'black';

export const GI_COLORS: Record<GiColor, { primary: string; accent: string; label: string }> = {
  white: { primary: '#e8e8e0', accent: '#d0d0c8', label: 'White' },
  blue: { primary: '#2563eb', accent: '#1d4ed8', label: 'Blue' },
  black: { primary: '#1a1a2e', accent: '#16213e', label: 'Black' },
};

export interface StarterPath {
  id: string;
  style: Style;
  title: string;
  scene: string;        // what you see when you walk over
  narrative: string[];   // text crawl lines
  moves: string[];
  baseStats: BaseStats;
  instructorName: string;
  instructorQuote: string;
}

export const STARTER_PATHS: StarterPath[] = [
  {
    id: 'wrestlers',
    style: 'wrestler',
    title: 'The Wrestlers',
    scene: 'Two fighters explode off their feet — a blast double, a sprawl, a scramble for control.',
    narrative: [
      'You walk toward the wrestlers.',
      'The coach grabs you by the collar.',
      '"You want to learn to fight? It starts on your feet."',
      '"Take someone down, and you control the fight."',
    ],
    moves: ['double-leg', 'single-leg', 'snap-down', 'bridge-escape', 'posture-up'],
    baseStats: { hp: 80, str: 90, tec: 60, tgh: 80, flx: 50, spd: 70, end: 75 },
    instructorName: 'Coach Dan',
    instructorQuote: "Control the takedown, control the match. Let's go.",
  },
  {
    id: 'guard-players',
    style: 'guard-player',
    title: 'The Guard Players',
    scene: 'Someone pulls guard and immediately attacks — triangle attempt, armbar, sweep to mount.',
    narrative: [
      'You walk toward the guard players.',
      'A purple belt waves you over.',
      '"Down here is where the magic happens."',
      '"Your back is not a bad place. It\'s a weapon."',
    ],
    moves: ['pull-guard', 'scissor-sweep', 'triangle', 'armbar-guard', 'posture-up'],
    baseStats: { hp: 70, str: 55, tec: 95, tgh: 60, flx: 90, spd: 70, end: 65 },
    instructorName: 'Professor Silva',
    instructorQuote: "The guard is the great equalizer. Trust the process.",
  },
  {
    id: 'leg-lockers',
    style: 'leg-locker',
    title: 'The Leg Lockers',
    scene: 'Legs tangled like a puzzle — one fighter cranks a heel hook. Tap. Reset. Again.',
    narrative: [
      'You walk toward the leg lockers.',
      'A calm voice from the corner.',
      '"Everyone defends the neck. Nobody thinks about their knees."',
      '"Enter the legs. Control the hips. Finish."',
    ],
    moves: ['leg-entry', 'heel-hook', 'ankle-lock', 'single-leg', 'posture-up'],
    baseStats: { hp: 65, str: 60, tec: 90, tgh: 55, flx: 85, spd: 80, end: 70 },
    instructorName: 'Coach Craig',
    instructorQuote: "The legs. Always the legs.",
  },
];
