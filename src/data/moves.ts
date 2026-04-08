import type { Move } from '../engine/types';

export const MOVES: Move[] = [
  // ═══ TAKEDOWNS ═══
  {
    id: 'double-leg', name: 'Double Leg', category: 'takedown', style: 'wrestler',
    positionRequired: ['standing'], positionResult: 'half-guard-top',
    power: 55, accuracy: 85, staminaCost: 18, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['knee-cut', 'leg-drag'], description: 'Blast double leg takedown.',
  },
  {
    id: 'single-leg', name: 'Single Leg', category: 'takedown', style: 'wrestler',
    positionRequired: ['standing'], positionResult: 'open-guard-top',
    power: 40, accuracy: 90, staminaCost: 14, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['knee-cut'], description: 'Single leg takedown.',
  },
  {
    id: 'osoto-gari', name: 'Osoto Gari', category: 'takedown', style: 'judoka',
    positionRequired: ['clinch'], positionResult: 'side-control',
    power: 65, accuracy: 75, staminaCost: 20, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['americana', 'kob-transition'], description: 'Major outer reap. Land in side control.',
  },
  {
    id: 'seoi-nage', name: 'Seoi Nage', category: 'takedown', style: 'judoka',
    positionRequired: ['clinch'], positionResult: 'side-control',
    power: 70, accuracy: 70, staminaCost: 22, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['ns-transition'], description: 'Shoulder throw. High risk, high reward.',
  },
  {
    id: 'snap-down', name: 'Snap Down', category: 'takedown', style: 'controller',
    positionRequired: ['standing', 'clinch'], positionResult: 'turtle-top',
    power: 35, accuracy: 90, staminaCost: 10, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['seatbelt-back-take'], description: 'Snap head down to turtle.',
  },

  // ═══ SWEEPS ═══
  {
    id: 'hip-bump', name: 'Hip Bump Sweep', category: 'sweep', style: 'guard-player',
    positionRequired: ['closed-guard-bottom'], positionResult: 'mount',
    power: 45, accuracy: 80, staminaCost: 14, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['cross-collar-mount', 'armbar-mount'], description: 'Explosive hip bump to mount.',
  },
  {
    id: 'scissor-sweep', name: 'Scissor Sweep', category: 'sweep', style: 'guard-player',
    positionRequired: ['closed-guard-bottom', 'open-guard-bottom'], positionResult: 'mount',
    power: 40, accuracy: 85, staminaCost: 12, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['armbar-mount'], description: 'Classic scissor sweep.',
  },
  {
    id: 'berimbolo-sweep', name: 'Berimbolo', category: 'sweep', style: 'berimbolo',
    positionRequired: ['open-guard-bottom', 'half-guard-bottom'], positionResult: 'back-control',
    power: 50, accuracy: 65, staminaCost: 22, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['rnc', 'armbar-back'], description: 'Invert and take the back.',
  },
  {
    id: 'butterfly-sweep', name: 'Butterfly Sweep', category: 'sweep', style: 'guard-player',
    positionRequired: ['open-guard-bottom'], positionResult: 'open-guard-top',
    power: 40, accuracy: 82, staminaCost: 14, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['knee-cut', 'leg-drag'], description: 'Elevate and sweep from butterfly.',
  },
  {
    id: 'deep-half-sweep', name: 'Deep Half Sweep', category: 'sweep', style: 'guard-player',
    positionRequired: ['half-guard-bottom'], positionResult: 'open-guard-top',
    power: 35, accuracy: 82, staminaCost: 12, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['knee-cut'], description: 'Dive under to deep half and come out on top.',
  },
  {
    id: 'x-guard-sweep', name: 'X-Guard Sweep', category: 'sweep', style: 'guard-player',
    positionRequired: ['open-guard-bottom'], positionResult: 'open-guard-top',
    power: 40, accuracy: 80, staminaCost: 14, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['leg-drag'], description: 'Off-balance from X-guard.',
  },
  {
    id: 'flower-sweep', name: 'Flower Sweep', category: 'sweep', style: 'guard-player',
    positionRequired: ['closed-guard-bottom'], positionResult: 'mount',
    power: 35, accuracy: 88, staminaCost: 10, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['cross-collar-mount'], description: 'Pendulum sweep using grips.',
  },

  // ═══ PASSES ═══
  {
    id: 'knee-cut', name: 'Knee Cut Pass', category: 'pass', style: 'pressure-passer',
    positionRequired: ['open-guard-top', 'half-guard-top'], positionResult: 'side-control',
    power: 45, accuracy: 80, staminaCost: 16, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['americana', 'ns-transition'], description: 'Slice through with a knee cut.',
  },
  {
    id: 'leg-drag', name: 'Leg Drag', category: 'pass', style: 'pressure-passer',
    positionRequired: ['open-guard-top'], positionResult: 'side-control',
    power: 40, accuracy: 82, staminaCost: 14, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['back-take-transition'], description: 'Drag legs across and pass.',
  },
  {
    id: 'toreando', name: 'Toreando Pass', category: 'pass', style: 'pressure-passer',
    positionRequired: ['open-guard-top'], positionResult: 'side-control',
    power: 50, accuracy: 75, staminaCost: 18, statAttack: 'spd', statDefense: 'flx',
    chainPotential: ['kob-transition'], description: 'Bullfighter pass. Quick and decisive.',
  },
  {
    id: 'smash-pass', name: 'Smash Pass', category: 'pass', style: 'pressure-passer',
    positionRequired: ['half-guard-top', 'closed-guard-top'], positionResult: 'side-control',
    power: 55, accuracy: 72, staminaCost: 20, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['americana'], description: 'Heavy cross-face pressure pass.',
  },
  {
    id: 'stack-pass', name: 'Stack Pass', category: 'pass', style: 'pressure-passer',
    positionRequired: ['closed-guard-top'], positionResult: 'side-control',
    power: 50, accuracy: 75, staminaCost: 18, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['ns-transition'], description: 'Stack the hips and drive through.',
  },
  {
    id: 'long-step', name: 'Long Step Pass', category: 'pass', style: 'berimbolo',
    positionRequired: ['open-guard-top'], positionResult: 'knee-on-belly',
    power: 40, accuracy: 78, staminaCost: 14, statAttack: 'spd', statDefense: 'flx',
    chainPotential: ['armbar-mount'], description: 'Backstep around the guard.',
  },

  // ═══ SUBMISSIONS ═══
  {
    id: 'armbar-guard', name: 'Armbar from Guard', category: 'submission', style: 'sub-hunter',
    positionRequired: ['closed-guard-bottom'], positionResult: null,
    power: 75, accuracy: 70, staminaCost: 20, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['triangle', 'omoplata'], description: 'Classic armbar from closed guard.',
  },
  {
    id: 'triangle', name: 'Triangle Choke', category: 'submission', style: 'sub-hunter',
    positionRequired: ['closed-guard-bottom', 'open-guard-bottom'], positionResult: null,
    power: 80, accuracy: 65, staminaCost: 22, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['armbar-guard', 'omoplata'], description: 'Lock up the triangle. Tight squeeze.',
  },
  {
    id: 'omoplata', name: 'Omoplata', category: 'submission', style: 'guard-player',
    positionRequired: ['closed-guard-bottom', 'open-guard-bottom'], positionResult: null,
    power: 60, accuracy: 72, staminaCost: 18, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['triangle'], description: 'Shoulder lock with the legs.',
  },
  {
    id: 'guillotine', name: 'Guillotine', category: 'submission', style: 'sub-hunter',
    positionRequired: ['clinch', 'closed-guard-bottom', 'open-guard-bottom'], positionResult: null,
    power: 70, accuracy: 72, staminaCost: 18, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['anaconda', 'darce'], description: 'Wrap the neck and squeeze.',
  },
  {
    id: 'darce', name: "D'Arce Choke", category: 'submission', style: 'sub-hunter',
    positionRequired: ['half-guard-top', 'side-control', 'turtle-top'], positionResult: null,
    power: 75, accuracy: 68, staminaCost: 20, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['anaconda'], description: "Thread the arm for a D'Arce.",
  },
  {
    id: 'anaconda', name: 'Anaconda Choke', category: 'submission', style: 'sub-hunter',
    positionRequired: ['turtle-top', 'side-control'], positionResult: null,
    power: 70, accuracy: 70, staminaCost: 18, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['darce'], description: 'Head and arm choke. Roll and squeeze.',
  },
  {
    id: 'americana', name: 'Americana', category: 'submission', style: 'controller',
    positionRequired: ['side-control', 'mount', 'knee-on-belly'], positionResult: null,
    power: 55, accuracy: 80, staminaCost: 14, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['kimura', 'cross-collar-mount'], description: 'Keylock from top. Reliable.',
  },
  {
    id: 'kimura', name: 'Kimura', category: 'submission', style: 'controller',
    positionRequired: ['side-control', 'north-south', 'closed-guard-bottom', 'half-guard-bottom'], positionResult: null,
    power: 70, accuracy: 75, staminaCost: 18, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['armbar-guard', 'back-take-transition'], description: 'Double wrist lock. Works everywhere.',
  },
  {
    id: 'cross-collar-mount', name: 'Cross Collar Choke', category: 'submission', style: 'controller',
    positionRequired: ['mount'], positionResult: null,
    power: 85, accuracy: 68, staminaCost: 20, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['armbar-mount'], description: 'Cross collar from mount. Forces a reaction.',
  },
  {
    id: 'armbar-mount', name: 'Armbar from Mount', category: 'submission', style: 'sub-hunter',
    positionRequired: ['mount'], positionResult: null,
    power: 85, accuracy: 72, staminaCost: 20, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['triangle', 'cross-collar-mount'], description: 'Armbar from mount.',
  },
  {
    id: 'rnc', name: 'Rear Naked Choke', category: 'submission', style: 'sub-hunter',
    positionRequired: ['back-control'], positionResult: null,
    power: 100, accuracy: 70, staminaCost: 24, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['armbar-back'], description: 'The king of submissions.',
  },
  {
    id: 'armbar-back', name: 'Armbar from Back', category: 'submission', style: 'sub-hunter',
    positionRequired: ['back-control'], positionResult: null,
    power: 80, accuracy: 72, staminaCost: 20, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['rnc'], description: 'Transition to armbar when they defend the choke.',
  },
  {
    id: 'heel-hook', name: 'Heel Hook', category: 'submission', style: 'leg-locker',
    positionRequired: ['leg-entanglement'], positionResult: null,
    power: 90, accuracy: 65, staminaCost: 22, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['kneebar', 'toe-hold'], description: 'Inside heel hook. Devastating.',
  },
  {
    id: 'kneebar', name: 'Kneebar', category: 'submission', style: 'leg-locker',
    positionRequired: ['leg-entanglement', 'half-guard-top'], positionResult: null,
    power: 70, accuracy: 72, staminaCost: 18, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['heel-hook', 'toe-hold'], description: 'Hyperextend the knee.',
  },
  {
    id: 'toe-hold', name: 'Toe Hold', category: 'submission', style: 'leg-locker',
    positionRequired: ['leg-entanglement', 'open-guard-top', 'half-guard-top'], positionResult: null,
    power: 55, accuracy: 78, staminaCost: 14, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['heel-hook', 'kneebar'], description: 'Figure-four on the foot.',
  },
  {
    id: 'ankle-lock', name: 'Ankle Lock', category: 'submission', style: 'leg-locker',
    positionRequired: ['leg-entanglement', 'open-guard-top'], positionResult: null,
    power: 45, accuracy: 85, staminaCost: 12, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['heel-hook'], description: 'Straight ankle lock. Entry to leg game.',
  },

  // ═══ ESCAPES ═══
  {
    id: 'bridge-escape', name: 'Bridge & Roll', category: 'escape', style: 'wrestler',
    positionRequired: ['mount-bottom', 'side-control-bottom'], positionResult: 'closed-guard-bottom',
    power: 30, accuracy: 70, staminaCost: 18, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['armbar-guard', 'triangle'], description: 'Explosive bridge to recover guard.',
  },
  {
    id: 'shrimp-escape', name: 'Shrimp to Guard', category: 'escape', style: 'guard-player',
    positionRequired: ['side-control-bottom', 'mount-bottom'], positionResult: 'half-guard-bottom',
    power: 10, accuracy: 82, staminaCost: 12, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['deep-half-sweep'], description: 'Hip escape to half guard.',
  },
  {
    id: 'back-escape', name: 'Escape to Guard', category: 'escape', style: 'guard-player',
    positionRequired: ['back-control-bottom'], positionResult: 'closed-guard-bottom',
    power: 10, accuracy: 60, staminaCost: 22, statAttack: 'flx', statDefense: 'str',
    chainPotential: [], description: 'Fight hands, clear hooks, turn to guard.',
  },
  {
    id: 'turtle-standup', name: 'Standup', category: 'escape', style: 'wrestler',
    positionRequired: ['turtle-bottom'], positionResult: 'standing',
    power: 15, accuracy: 75, staminaCost: 14, statAttack: 'str', statDefense: 'str',
    chainPotential: ['double-leg', 'single-leg'], description: 'Post and stand up from turtle.',
  },

  // ═══ TRANSITIONS ═══
  {
    id: 'pull-guard', name: 'Pull Guard', category: 'transition', style: 'guard-player',
    positionRequired: ['standing'], positionResult: 'closed-guard-bottom',
    power: 0, accuracy: 100, staminaCost: 5, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['armbar-guard', 'triangle', 'hip-bump'], description: 'Pull into closed guard.',
  },
  {
    id: 'leg-entry', name: 'Leg Entry', category: 'transition', style: 'leg-locker',
    positionRequired: ['open-guard-bottom', 'open-guard-top', 'half-guard-bottom'], positionResult: 'leg-entanglement',
    power: 0, accuracy: 80, staminaCost: 10, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['heel-hook', 'kneebar', 'toe-hold'], description: 'Dive on the legs.',
  },
  {
    id: 'seatbelt-back-take', name: 'Back Take', category: 'transition', style: 'berimbolo',
    positionRequired: ['turtle-top', 'side-control'], positionResult: 'back-control',
    power: 0, accuracy: 78, staminaCost: 14, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['rnc', 'armbar-back'], description: 'Secure the seatbelt and take the back.',
  },
  {
    id: 'kob-transition', name: 'Knee on Belly', category: 'transition', style: 'controller',
    positionRequired: ['side-control'], positionResult: 'knee-on-belly',
    power: 30, accuracy: 90, staminaCost: 8, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['armbar-mount', 'cross-collar-mount'], description: 'Drive knee across.',
  },
  {
    id: 'ns-transition', name: 'North-South', category: 'transition', style: 'controller',
    positionRequired: ['side-control'], positionResult: 'north-south',
    power: 0, accuracy: 92, staminaCost: 6, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['kimura'], description: 'Spin to north-south.',
  },
  {
    id: 'mount-transition', name: 'Advance to Mount', category: 'transition', style: 'controller',
    positionRequired: ['side-control', 'knee-on-belly'], positionResult: 'mount',
    power: 0, accuracy: 80, staminaCost: 10, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['cross-collar-mount', 'armbar-mount'], description: 'Step over to full mount.',
  },
  {
    id: 'back-take-transition', name: 'Take the Back', category: 'transition', style: 'berimbolo',
    positionRequired: ['side-control', 'knee-on-belly'], positionResult: 'back-control',
    power: 0, accuracy: 72, staminaCost: 14, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['rnc'], description: 'Spin behind to take the back.',
  },
];

// Index for quick lookup
const moveIndex = new Map<string, Move>();
for (const m of MOVES) moveIndex.set(m.id, m);

export function getMove(id: string): Move | undefined {
  return moveIndex.get(id);
}

export function getMovesForPosition(position: string, moveIds: string[]): Move[] {
  return moveIds
    .map(id => moveIndex.get(id))
    .filter((m): m is Move => m !== undefined && m.positionRequired.includes(position as any));
}
