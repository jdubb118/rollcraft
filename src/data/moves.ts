import type { Move } from '../engine/types';

// Helper to make position requirements more readable
const top = (p: string) => ({ position: p as any, role: 'top' as const });
const bot = (p: string) => ({ position: p as any, role: 'bottom' as const });
const neu = (p: string) => ({ position: p as any, role: 'neutral' as const });

export const MOVES: Move[] = [
  // ═══ TAKEDOWNS (from standing/clinch → attacker gets top) ═══
  {
    id: 'double-leg', name: 'Double Leg', category: 'takedown', style: 'wrestler',
    posReq: [neu('standing')], resultPosition: 'half-guard', resultRole: 'top',
    power: 55, accuracy: 85, staminaCost: 18, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['knee-cut', 'leg-drag'], description: 'Blast double leg takedown.',
  },
  {
    id: 'single-leg', name: 'Single Leg', category: 'takedown', style: 'wrestler',
    posReq: [neu('standing')], resultPosition: 'open-guard', resultRole: 'top',
    power: 40, accuracy: 90, staminaCost: 14, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['knee-cut'], description: 'Single leg takedown.',
  },
  {
    id: 'osoto-gari', name: 'Osoto Gari', category: 'takedown', style: 'judoka',
    posReq: [neu('clinch')], resultPosition: 'side-control', resultRole: 'top',
    power: 65, accuracy: 75, staminaCost: 20, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['americana', 'kob-transition'], description: 'Major outer reap. Land in side control.',
  },
  {
    id: 'seoi-nage', name: 'Seoi Nage', category: 'takedown', style: 'judoka',
    posReq: [neu('clinch')], resultPosition: 'side-control', resultRole: 'top',
    power: 70, accuracy: 70, staminaCost: 22, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['ns-transition'], description: 'Shoulder throw.',
  },
  {
    id: 'snap-down', name: 'Snap Down', category: 'takedown', style: 'controller',
    posReq: [neu('standing'), neu('clinch')], resultPosition: 'turtle', resultRole: 'top',
    power: 35, accuracy: 90, staminaCost: 10, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['seatbelt-back-take'], description: 'Snap head down to turtle.',
  },

  // ═══ SWEEPS (from guard bottom → attacker gets top) ═══
  {
    id: 'hip-bump', name: 'Hip Bump Sweep', category: 'sweep', style: 'guard-player',
    posReq: [bot('closed-guard')], resultPosition: 'mount', resultRole: 'top',
    power: 45, accuracy: 80, staminaCost: 14, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['cross-collar-mount', 'armbar-mount'], description: 'Explosive hip bump to mount.',
  },
  {
    id: 'scissor-sweep', name: 'Scissor Sweep', category: 'sweep', style: 'guard-player',
    posReq: [bot('closed-guard'), bot('open-guard')], resultPosition: 'mount', resultRole: 'top',
    power: 40, accuracy: 85, staminaCost: 12, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['armbar-mount'], description: 'Classic scissor sweep.',
  },
  {
    id: 'berimbolo-sweep', name: 'Berimbolo', category: 'sweep', style: 'berimbolo',
    posReq: [bot('open-guard'), bot('half-guard')], resultPosition: 'back-control', resultRole: 'top',
    power: 50, accuracy: 65, staminaCost: 22, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['rnc', 'armbar-back'], description: 'Invert and take the back.',
  },
  {
    id: 'butterfly-sweep', name: 'Butterfly Sweep', category: 'sweep', style: 'guard-player',
    posReq: [bot('open-guard')], resultPosition: 'open-guard', resultRole: 'top',
    power: 40, accuracy: 82, staminaCost: 14, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['knee-cut', 'leg-drag'], description: 'Elevate and sweep from butterfly.',
  },
  {
    id: 'deep-half-sweep', name: 'Deep Half Sweep', category: 'sweep', style: 'guard-player',
    posReq: [bot('half-guard')], resultPosition: 'open-guard', resultRole: 'top',
    power: 35, accuracy: 82, staminaCost: 12, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['knee-cut'], description: 'Dive under to deep half and come out on top.',
  },
  {
    id: 'x-guard-sweep', name: 'X-Guard Sweep', category: 'sweep', style: 'guard-player',
    posReq: [bot('open-guard')], resultPosition: 'open-guard', resultRole: 'top',
    power: 40, accuracy: 80, staminaCost: 14, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['leg-drag'], description: 'Off-balance from X-guard.',
  },
  {
    id: 'flower-sweep', name: 'Flower Sweep', category: 'sweep', style: 'guard-player',
    posReq: [bot('closed-guard')], resultPosition: 'mount', resultRole: 'top',
    power: 35, accuracy: 88, staminaCost: 10, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['cross-collar-mount'], description: 'Pendulum sweep using grips.',
  },

  // ═══ PASSES (from guard top → attacker advances position) ═══
  {
    id: 'knee-cut', name: 'Knee Cut Pass', category: 'pass', style: 'pressure-passer',
    posReq: [top('open-guard'), top('half-guard')], resultPosition: 'side-control', resultRole: 'top',
    power: 45, accuracy: 80, staminaCost: 16, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['americana', 'ns-transition'], description: 'Slice through with a knee cut.',
  },
  {
    id: 'leg-drag', name: 'Leg Drag', category: 'pass', style: 'pressure-passer',
    posReq: [top('open-guard')], resultPosition: 'side-control', resultRole: 'top',
    power: 40, accuracy: 82, staminaCost: 14, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['back-take-transition'], description: 'Drag legs across and pass.',
  },
  {
    id: 'toreando', name: 'Toreando Pass', category: 'pass', style: 'pressure-passer',
    posReq: [top('open-guard')], resultPosition: 'side-control', resultRole: 'top',
    power: 50, accuracy: 75, staminaCost: 18, statAttack: 'spd', statDefense: 'flx',
    chainPotential: ['kob-transition'], description: 'Bullfighter pass.',
  },
  {
    id: 'smash-pass', name: 'Smash Pass', category: 'pass', style: 'pressure-passer',
    posReq: [top('half-guard'), top('closed-guard')], resultPosition: 'side-control', resultRole: 'top',
    power: 55, accuracy: 72, staminaCost: 20, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['americana'], description: 'Heavy cross-face pressure pass.',
  },
  {
    id: 'stack-pass', name: 'Stack Pass', category: 'pass', style: 'pressure-passer',
    posReq: [top('closed-guard')], resultPosition: 'side-control', resultRole: 'top',
    power: 50, accuracy: 75, staminaCost: 18, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['ns-transition'], description: 'Stack the hips and drive through.',
  },
  {
    id: 'long-step', name: 'Long Step Pass', category: 'pass', style: 'berimbolo',
    posReq: [top('open-guard')], resultPosition: 'knee-on-belly', resultRole: 'top',
    power: 40, accuracy: 78, staminaCost: 14, statAttack: 'spd', statDefense: 'flx',
    chainPotential: ['armbar-mount'], description: 'Backstep around the guard.',
  },

  // ═══ SUBMISSIONS (no position change — submission mini-game) ═══
  {
    id: 'armbar-guard', name: 'Armbar from Guard', category: 'submission', style: 'sub-hunter',
    posReq: [bot('closed-guard')], resultPosition: null, resultRole: null,
    power: 75, accuracy: 70, staminaCost: 20, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['triangle', 'omoplata'], description: 'Classic armbar from closed guard.',
  },
  {
    id: 'triangle', name: 'Triangle Choke', category: 'submission', style: 'sub-hunter',
    posReq: [bot('closed-guard'), bot('open-guard')], resultPosition: null, resultRole: null,
    power: 80, accuracy: 65, staminaCost: 22, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['armbar-guard', 'omoplata'], description: 'Lock up the triangle.',
  },
  {
    id: 'omoplata', name: 'Omoplata', category: 'submission', style: 'guard-player',
    posReq: [bot('closed-guard'), bot('open-guard')], resultPosition: null, resultRole: null,
    power: 60, accuracy: 72, staminaCost: 18, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['triangle'], description: 'Shoulder lock with the legs.',
  },
  {
    id: 'guillotine', name: 'Guillotine', category: 'submission', style: 'sub-hunter',
    posReq: [neu('clinch'), bot('closed-guard'), bot('open-guard')], resultPosition: null, resultRole: null,
    power: 70, accuracy: 72, staminaCost: 18, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['anaconda', 'darce'], description: 'Wrap the neck and squeeze.',
  },
  {
    id: 'darce', name: "D'Arce Choke", category: 'submission', style: 'sub-hunter',
    posReq: [top('half-guard'), top('side-control'), top('turtle')], resultPosition: null, resultRole: null,
    power: 75, accuracy: 68, staminaCost: 20, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['anaconda'], description: "Thread the arm for a D'Arce.",
  },
  {
    id: 'anaconda', name: 'Anaconda Choke', category: 'submission', style: 'sub-hunter',
    posReq: [top('turtle'), top('side-control')], resultPosition: null, resultRole: null,
    power: 70, accuracy: 70, staminaCost: 18, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['darce'], description: 'Head and arm choke.',
  },
  {
    id: 'americana', name: 'Americana', category: 'submission', style: 'controller',
    posReq: [top('side-control'), top('mount'), top('knee-on-belly')], resultPosition: null, resultRole: null,
    power: 55, accuracy: 80, staminaCost: 14, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['kimura', 'cross-collar-mount'], description: 'Keylock from top.',
  },
  {
    id: 'kimura', name: 'Kimura', category: 'submission', style: 'controller',
    posReq: [top('side-control'), top('north-south'), bot('closed-guard'), bot('half-guard')],
    resultPosition: null, resultRole: null,
    power: 70, accuracy: 75, staminaCost: 18, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['armbar-guard', 'back-take-transition'], description: 'Double wrist lock. Works everywhere.',
  },
  {
    id: 'cross-collar-mount', name: 'Cross Collar Choke', category: 'submission', style: 'controller',
    posReq: [top('mount')], resultPosition: null, resultRole: null,
    power: 85, accuracy: 68, staminaCost: 20, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['armbar-mount'], description: 'Cross collar from mount. Forces a reaction.',
  },
  {
    id: 'armbar-mount', name: 'Armbar from Mount', category: 'submission', style: 'sub-hunter',
    posReq: [top('mount')], resultPosition: null, resultRole: null,
    power: 85, accuracy: 72, staminaCost: 20, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['triangle', 'cross-collar-mount'], description: 'Armbar from mount.',
  },
  {
    id: 'rnc', name: 'Rear Naked Choke', category: 'submission', style: 'sub-hunter',
    posReq: [top('back-control')], resultPosition: null, resultRole: null,
    power: 100, accuracy: 70, staminaCost: 24, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['armbar-back'], description: 'The king of submissions.',
  },
  {
    id: 'armbar-back', name: 'Armbar from Back', category: 'submission', style: 'sub-hunter',
    posReq: [top('back-control')], resultPosition: null, resultRole: null,
    power: 80, accuracy: 72, staminaCost: 20, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['rnc'], description: 'Transition to armbar when they defend the choke.',
  },
  {
    id: 'heel-hook', name: 'Heel Hook', category: 'submission', style: 'leg-locker',
    posReq: [neu('leg-entanglement')], resultPosition: null, resultRole: null,
    power: 90, accuracy: 65, staminaCost: 22, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['kneebar', 'toe-hold'], description: 'Inside heel hook. Devastating.',
  },
  {
    id: 'kneebar', name: 'Kneebar', category: 'submission', style: 'leg-locker',
    posReq: [neu('leg-entanglement'), top('half-guard')], resultPosition: null, resultRole: null,
    power: 70, accuracy: 72, staminaCost: 18, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['heel-hook', 'toe-hold'], description: 'Hyperextend the knee.',
  },
  {
    id: 'toe-hold', name: 'Toe Hold', category: 'submission', style: 'leg-locker',
    posReq: [neu('leg-entanglement'), top('open-guard'), top('half-guard')], resultPosition: null, resultRole: null,
    power: 55, accuracy: 78, staminaCost: 14, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['heel-hook', 'kneebar'], description: 'Figure-four on the foot.',
  },
  {
    id: 'ankle-lock', name: 'Ankle Lock', category: 'submission', style: 'leg-locker',
    posReq: [neu('leg-entanglement'), top('open-guard')], resultPosition: null, resultRole: null,
    power: 45, accuracy: 85, staminaCost: 12, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['heel-hook'], description: 'Straight ankle lock.',
  },

  // ═══ ESCAPES (from bad position → attacker recovers) ═══
  {
    id: 'bridge-escape', name: 'Bridge & Roll', category: 'escape', style: 'wrestler',
    posReq: [bot('mount'), bot('side-control')], resultPosition: 'closed-guard', resultRole: 'bottom',
    power: 30, accuracy: 70, staminaCost: 18, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['armbar-guard', 'triangle'], description: 'Explosive bridge to recover guard.',
  },
  {
    id: 'shrimp-escape', name: 'Shrimp to Guard', category: 'escape', style: 'guard-player',
    posReq: [bot('side-control'), bot('mount')], resultPosition: 'half-guard', resultRole: 'bottom',
    power: 10, accuracy: 82, staminaCost: 12, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['deep-half-sweep'], description: 'Hip escape to half guard.',
  },
  {
    id: 'back-escape', name: 'Escape to Guard', category: 'escape', style: 'guard-player',
    posReq: [bot('back-control')], resultPosition: 'closed-guard', resultRole: 'bottom',
    power: 10, accuracy: 60, staminaCost: 22, statAttack: 'flx', statDefense: 'str',
    chainPotential: [], description: 'Fight hands, clear hooks, turn to guard.',
  },
  {
    id: 'turtle-standup', name: 'Standup', category: 'escape', style: 'wrestler',
    posReq: [bot('turtle')], resultPosition: 'standing', resultRole: 'neutral',
    power: 15, accuracy: 75, staminaCost: 14, statAttack: 'str', statDefense: 'str',
    chainPotential: ['double-leg', 'single-leg'], description: 'Post and stand up from turtle.',
  },

  // ═══ TRANSITIONS ═══
  {
    id: 'pull-guard', name: 'Pull Guard', category: 'transition', style: 'guard-player',
    posReq: [neu('standing')], resultPosition: 'closed-guard', resultRole: 'bottom',
    power: 0, accuracy: 100, staminaCost: 5, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['armbar-guard', 'triangle', 'hip-bump'], description: 'Pull into closed guard.',
  },
  {
    id: 'leg-entry', name: 'Leg Entry', category: 'transition', style: 'leg-locker',
    posReq: [bot('open-guard'), top('open-guard'), bot('half-guard')],
    resultPosition: 'leg-entanglement', resultRole: 'neutral',
    power: 0, accuracy: 80, staminaCost: 10, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['heel-hook', 'kneebar', 'toe-hold'], description: 'Dive on the legs.',
  },
  {
    id: 'seatbelt-back-take', name: 'Back Take', category: 'transition', style: 'berimbolo',
    posReq: [top('turtle'), top('side-control')], resultPosition: 'back-control', resultRole: 'top',
    power: 0, accuracy: 78, staminaCost: 14, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['rnc', 'armbar-back'], description: 'Secure the seatbelt and take the back.',
  },
  {
    id: 'kob-transition', name: 'Knee on Belly', category: 'transition', style: 'controller',
    posReq: [top('side-control')], resultPosition: 'knee-on-belly', resultRole: 'top',
    power: 30, accuracy: 90, staminaCost: 8, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['armbar-mount', 'cross-collar-mount'], description: 'Drive knee across.',
  },
  {
    id: 'ns-transition', name: 'North-South', category: 'transition', style: 'controller',
    posReq: [top('side-control')], resultPosition: 'north-south', resultRole: 'top',
    power: 0, accuracy: 92, staminaCost: 6, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['kimura'], description: 'Spin to north-south.',
  },
  {
    id: 'mount-transition', name: 'Advance to Mount', category: 'transition', style: 'controller',
    posReq: [top('side-control'), top('knee-on-belly')], resultPosition: 'mount', resultRole: 'top',
    power: 0, accuracy: 80, staminaCost: 10, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['cross-collar-mount', 'armbar-mount'], description: 'Step over to full mount.',
  },
  {
    id: 'back-take-transition', name: 'Take the Back', category: 'transition', style: 'berimbolo',
    posReq: [top('side-control'), top('knee-on-belly')], resultPosition: 'back-control', resultRole: 'top',
    power: 0, accuracy: 72, staminaCost: 14, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['rnc'], description: 'Spin behind to take the back.',
  },

  // ═══ GAP FILLERS ═══
  {
    id: 'ns-choke', name: 'North-South Choke', category: 'submission', style: 'controller',
    posReq: [top('north-south')], resultPosition: null, resultRole: null,
    power: 70, accuracy: 72, staminaCost: 18, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['kimura'], description: 'Chest pressure choke from north-south.',
  },
  {
    id: 'ns-to-side', name: 'Spin to Side Control', category: 'transition', style: 'controller',
    posReq: [top('north-south')], resultPosition: 'side-control', resultRole: 'top',
    power: 0, accuracy: 90, staminaCost: 6, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['americana', 'darce'], description: 'Rotate back to side control.',
  },
  {
    id: 'ns-to-mount', name: 'Advance to Mount', category: 'transition', style: 'controller',
    posReq: [top('north-south')], resultPosition: 'mount', resultRole: 'top',
    power: 0, accuracy: 75, staminaCost: 12, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['cross-collar-mount', 'armbar-mount'], description: 'Step over to mount from north-south.',
  },
  {
    id: 'hand-fight', name: 'Hand Fighting', category: 'escape', style: 'controller',
    posReq: [bot('back-control')], resultPosition: null, resultRole: null,
    power: 0, accuracy: 90, staminaCost: 8, statAttack: 'tec', statDefense: 'tec',
    chainPotential: ['back-escape'], description: 'Fight the grips. Buy time.',
  },
  {
    id: 'back-escape-turtle', name: 'Escape to Turtle', category: 'escape', style: 'wrestler',
    posReq: [bot('back-control')], resultPosition: 'turtle', resultRole: 'bottom',
    power: 10, accuracy: 72, staminaCost: 14, statAttack: 'str', statDefense: 'str',
    chainPotential: ['turtle-standup'], description: 'Clear hooks and turtle up.',
  },
  {
    id: 'granby-roll', name: 'Granby Roll', category: 'escape', style: 'berimbolo',
    posReq: [bot('turtle')], resultPosition: 'open-guard', resultRole: 'bottom',
    power: 20, accuracy: 65, staminaCost: 16, statAttack: 'flx', statDefense: 'spd',
    chainPotential: ['leg-entry', 'scissor-sweep'], description: 'Invert and recover guard.',
  },
  {
    id: 'sit-out', name: 'Sit Out', category: 'escape', style: 'wrestler',
    posReq: [bot('turtle')], resultPosition: 'standing', resultRole: 'neutral',
    power: 25, accuracy: 70, staminaCost: 14, statAttack: 'spd', statDefense: 'str',
    chainPotential: ['double-leg', 'snap-down'], description: 'Explosive sit out to standing.',
  },
  {
    id: 'elbow-escape', name: 'Elbow Escape', category: 'escape', style: 'guard-player',
    posReq: [bot('mount')], resultPosition: 'half-guard', resultRole: 'bottom',
    power: 5, accuracy: 78, staminaCost: 14, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['deep-half-sweep'], description: 'Frame and shrimp to half guard.',
  },
  {
    id: 'trap-roll', name: 'Trap & Roll', category: 'escape', style: 'wrestler',
    posReq: [bot('mount')], resultPosition: 'closed-guard', resultRole: 'bottom',
    power: 30, accuracy: 65, staminaCost: 20, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['armbar-guard', 'triangle'], description: 'Trap arm, bridge hard, reverse.',
  },
  {
    id: 'underhook-escape', name: 'Underhook Escape', category: 'escape', style: 'wrestler',
    posReq: [bot('side-control')], resultPosition: 'open-guard', resultRole: 'bottom',
    power: 20, accuracy: 70, staminaCost: 16, statAttack: 'str', statDefense: 'str',
    chainPotential: ['butterfly-sweep', 'x-guard-sweep'], description: 'Fight for underhook, come to knees.',
  },
  {
    id: 'guard-recovery', name: 'Guard Recovery', category: 'escape', style: 'guard-player',
    posReq: [bot('side-control')], resultPosition: 'open-guard', resultRole: 'bottom',
    power: 5, accuracy: 75, staminaCost: 12, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['scissor-sweep', 'leg-entry'], description: 'Frame, create space, re-guard.',
  },
  {
    id: 'mount-to-back', name: 'Take Back from Mount', category: 'transition', style: 'berimbolo',
    posReq: [top('mount')], resultPosition: 'back-control', resultRole: 'top',
    power: 0, accuracy: 78, staminaCost: 10, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['rnc', 'armbar-back'], description: 'Opponent turns, you take the back.',
  },
  {
    id: 'gift-wrap', name: 'Gift Wrap Control', category: 'submission', style: 'controller',
    posReq: [top('mount')], resultPosition: null, resultRole: null,
    power: 50, accuracy: 82, staminaCost: 12, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['mount-to-back', 'armbar-mount'], description: 'Trap the arm and control.',
  },
  {
    id: 'back-to-mount', name: 'Transition to Mount', category: 'transition', style: 'controller',
    posReq: [top('back-control')], resultPosition: 'mount', resultRole: 'top',
    power: 0, accuracy: 80, staminaCost: 8, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['cross-collar-mount', 'armbar-mount'], description: 'Release hooks, establish mount.',
  },
  {
    id: 'posture-up', name: 'Posture Up', category: 'transition', style: 'pressure-passer',
    posReq: [top('closed-guard')], resultPosition: 'open-guard', resultRole: 'top',
    power: 10, accuracy: 85, staminaCost: 10, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['toreando', 'leg-drag', 'knee-cut'], description: 'Break posture and open the guard.',
  },
  {
    id: 'guard-slam', name: 'Guard Break', category: 'pass', style: 'wrestler',
    posReq: [top('closed-guard')], resultPosition: 'open-guard', resultRole: 'top',
    power: 35, accuracy: 78, staminaCost: 16, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['knee-cut', 'toreando'], description: 'Force the guard open with pressure.',
  },
  {
    id: 'kob-armbar', name: 'Armbar from KOB', category: 'submission', style: 'sub-hunter',
    posReq: [top('knee-on-belly')], resultPosition: null, resultRole: null,
    power: 75, accuracy: 70, staminaCost: 20, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['americana'], description: 'Step over for armbar from knee on belly.',
  },
  {
    id: 'kob-to-side', name: 'Drop to Side Control', category: 'transition', style: 'controller',
    posReq: [top('knee-on-belly')], resultPosition: 'side-control', resultRole: 'top',
    power: 0, accuracy: 95, staminaCost: 4, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['darce', 'americana'], description: 'Settle back to side control.',
  },
  {
    id: 'leg-escape-stand', name: 'Stand from Legs', category: 'escape', style: 'wrestler',
    posReq: [neu('leg-entanglement')], resultPosition: 'standing', resultRole: 'neutral',
    power: 10, accuracy: 70, staminaCost: 16, statAttack: 'str', statDefense: 'tec',
    chainPotential: ['double-leg'], description: 'Disengage legs and stand up.',
  },
  {
    id: 'leg-reposition', name: 'Reposition Legs', category: 'transition', style: 'leg-locker',
    posReq: [neu('leg-entanglement')], resultPosition: null, resultRole: null,
    power: 0, accuracy: 88, staminaCost: 6, statAttack: 'tec', statDefense: 'tec',
    chainPotential: ['heel-hook', 'kneebar', 'toe-hold'], description: 'Improve leg lock position.',
  },
  {
    id: 'lockdown', name: 'Lockdown', category: 'transition', style: 'guard-player',
    posReq: [bot('half-guard')], resultPosition: null, resultRole: null,
    power: 15, accuracy: 85, staminaCost: 8, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['deep-half-sweep', 'berimbolo-sweep'], description: 'Lock down the leg.',
  },
  {
    id: 'clinch-entry', name: 'Clinch Up', category: 'transition', style: 'judoka',
    posReq: [neu('standing')], resultPosition: 'clinch', resultRole: 'neutral',
    power: 0, accuracy: 88, staminaCost: 8, statAttack: 'str', statDefense: 'str',
    chainPotential: ['osoto-gari', 'seoi-nage', 'guillotine'], description: 'Engage the clinch.',
  },
];

// Index for quick lookup
const moveIndex = new Map<string, Move>();
for (const m of MOVES) moveIndex.set(m.id, m);

export function getMove(id: string): Move | undefined {
  return moveIndex.get(id);
}
