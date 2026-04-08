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
    impact: { flinchChance: 0.15, recoil: 4 },
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
    impact: { flinchChance: 0.20, recoil: 4 },
  },
  {
    id: 'seoi-nage', name: 'Seoi Nage', category: 'takedown', style: 'judoka',
    posReq: [neu('clinch')], resultPosition: 'side-control', resultRole: 'top',
    power: 70, accuracy: 70, staminaCost: 22, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['ns-transition'], description: 'Shoulder throw.',
    impact: { flinchChance: 0.20, recoil: 5 },
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

  // ═══════════════════════════════════════════════
  // EXPANSION: 75 NEW MOVES (total ~142)
  // ═══════════════════════════════════════════════

  // ── JUDO (10 new) ──
  {
    id: 'uchi-mata', name: 'Uchi Mata', category: 'takedown', style: 'judoka',
    posReq: [neu('clinch')], resultPosition: 'side-control', resultRole: 'top',
    power: 72, accuracy: 68, staminaCost: 22, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['kob-transition', 'americana'], description: 'Inner thigh throw. High amplitude.',
  },
  {
    id: 'harai-goshi', name: 'Harai Goshi', category: 'takedown', style: 'judoka',
    posReq: [neu('clinch')], resultPosition: 'side-control', resultRole: 'top',
    power: 68, accuracy: 70, staminaCost: 20, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['ns-transition'], description: 'Sweeping hip throw.',
    impact: { flinchChance: 0.20, recoil: 5 },
  },
  {
    id: 'o-goshi', name: 'O Goshi', category: 'takedown', style: 'judoka',
    posReq: [neu('clinch')], resultPosition: 'mount', resultRole: 'top',
    power: 60, accuracy: 72, staminaCost: 20, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['cross-collar-mount', 'armbar-mount'], description: 'Major hip throw. Land in mount.',
    impact: { flinchChance: 0.25, recoil: 6 },
  },
  {
    id: 'tomoe-nage', name: 'Tomoe Nage', category: 'takedown', style: 'judoka',
    posReq: [neu('clinch'), neu('standing')], resultPosition: 'mount', resultRole: 'top',
    power: 55, accuracy: 62, staminaCost: 18, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['armbar-mount'], description: 'Sacrifice throw. Roll and end on top.',
  },
  {
    id: 'tani-otoshi', name: 'Tani Otoshi', category: 'takedown', style: 'judoka',
    posReq: [neu('clinch')], resultPosition: 'side-control', resultRole: 'top',
    power: 50, accuracy: 78, staminaCost: 16, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['americana'], description: 'Valley drop. Low-risk sacrifice throw.',
  },
  {
    id: 'kouchi-gari', name: 'Kouchi Gari', category: 'takedown', style: 'judoka',
    posReq: [neu('clinch'), neu('standing')], resultPosition: 'open-guard', resultRole: 'top',
    power: 35, accuracy: 85, staminaCost: 10, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['knee-cut', 'leg-drag'], description: 'Small inner reap. Quick trip.',
  },
  {
    id: 'ouchi-gari', name: 'Ouchi Gari', category: 'takedown', style: 'judoka',
    posReq: [neu('clinch')], resultPosition: 'half-guard', resultRole: 'top',
    power: 40, accuracy: 82, staminaCost: 12, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['knee-cut', 'smash-pass'], description: 'Major inner reap. Land in half guard.',
  },
  {
    id: 'kata-guruma', name: 'Kata Guruma', category: 'takedown', style: 'judoka',
    posReq: [neu('clinch')], resultPosition: 'side-control', resultRole: 'top',
    power: 75, accuracy: 58, staminaCost: 24, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['americana', 'kob-transition'], description: 'Shoulder wheel. Massive throw.',
    impact: { flinchChance: 0.25, recoil: 8 },
  },
  {
    id: 'sumi-gaeshi', name: 'Sumi Gaeshi', category: 'takedown', style: 'judoka',
    posReq: [neu('clinch')], resultPosition: 'mount', resultRole: 'top',
    power: 50, accuracy: 68, staminaCost: 16, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['cross-collar-mount'], description: 'Corner reversal. Sacrifice to mount.',
  },
  {
    id: 'foot-sweep', name: 'Foot Sweep', category: 'takedown', style: 'judoka',
    posReq: [neu('standing'), neu('clinch')], resultPosition: 'open-guard', resultRole: 'top',
    power: 30, accuracy: 88, staminaCost: 8, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['knee-cut'], description: 'De Ashi Barai. Catch the step.',
  },

  // ── WRESTLING (8 new) ──
  {
    id: 'high-crotch', name: 'High Crotch', category: 'takedown', style: 'wrestler',
    posReq: [neu('standing')], resultPosition: 'side-control', resultRole: 'top',
    power: 55, accuracy: 80, staminaCost: 18, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['americana', 'kob-transition'], description: 'High crotch lift to side control.',
  },
  {
    id: 'firemans-carry', name: "Fireman's Carry", category: 'takedown', style: 'wrestler',
    posReq: [neu('clinch'), neu('standing')], resultPosition: 'side-control', resultRole: 'top',
    power: 65, accuracy: 70, staminaCost: 20, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['americana', 'ns-transition'], description: 'Scoop and dump. Classic wrestling.',
  },
  {
    id: 'arm-drag-back', name: 'Arm Drag to Back', category: 'takedown', style: 'wrestler',
    posReq: [neu('standing'), neu('clinch')], resultPosition: 'back-control', resultRole: 'top',
    power: 40, accuracy: 75, staminaCost: 14, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['rnc', 'armbar-back'], description: 'Arm drag to take the back standing.',
  },
  {
    id: 'duck-under', name: 'Duck Under', category: 'takedown', style: 'wrestler',
    posReq: [neu('clinch')], resultPosition: 'back-control', resultRole: 'top',
    power: 35, accuracy: 80, staminaCost: 12, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['rnc'], description: 'Duck under the arm to take the back.',
  },
  {
    id: 'ankle-pick', name: 'Ankle Pick', category: 'takedown', style: 'wrestler',
    posReq: [neu('standing')], resultPosition: 'open-guard', resultRole: 'top',
    power: 35, accuracy: 85, staminaCost: 10, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['knee-cut', 'toreando'], description: 'Snatch the ankle. Quick and clean.',
  },
  {
    id: 'russian-tie', name: 'Russian Tie', category: 'transition', style: 'wrestler',
    posReq: [neu('standing')], resultPosition: 'clinch', resultRole: 'neutral',
    power: 15, accuracy: 90, staminaCost: 8, statAttack: 'str', statDefense: 'str',
    chainPotential: ['snap-down', 'arm-drag-back', 'duck-under'], description: 'Control the wrist and elbow.',
  },
  {
    id: 'front-headlock', name: 'Front Headlock', category: 'transition', style: 'wrestler',
    posReq: [neu('clinch'), top('turtle')], resultPosition: 'turtle', resultRole: 'top',
    power: 20, accuracy: 85, staminaCost: 10, statAttack: 'str', statDefense: 'str',
    chainPotential: ['guillotine', 'darce', 'anaconda'], description: 'Control the head. Set up chokes.',
  },
  {
    id: 'suplex', name: 'Suplex', category: 'takedown', style: 'wrestler',
    posReq: [neu('clinch')], resultPosition: 'side-control', resultRole: 'top',
    power: 80, accuracy: 55, staminaCost: 26, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['americana', 'kob-transition'], description: 'Explosive overhead throw. Max damage.',
    impact: { flinchChance: 0.30, recoil: 8 },
  },

  // ── ADVANCED LEG LOCKS (10 new) ──
  {
    id: 'calf-slicer', name: 'Calf Slicer', category: 'submission', style: 'leg-locker',
    posReq: [neu('leg-entanglement'), top('half-guard')], resultPosition: null, resultRole: null,
    power: 60, accuracy: 72, staminaCost: 16, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['kneebar'], description: 'Crush the calf. Compression lock.',
  },
  {
    id: 'outside-heel-hook', name: 'Outside Heel Hook', category: 'submission', style: 'leg-locker',
    posReq: [neu('leg-entanglement')], resultPosition: null, resultRole: null,
    power: 85, accuracy: 68, staminaCost: 20, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['heel-hook', 'kneebar'], description: 'Outside heel hook. Different angle, same devastation.',
  },
  {
    id: 'saddle-entry', name: 'Saddle Entry', category: 'transition', style: 'leg-locker',
    posReq: [bot('open-guard'), bot('half-guard'), top('half-guard')],
    resultPosition: 'leg-entanglement', resultRole: 'neutral',
    power: 0, accuracy: 75, staminaCost: 12, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['heel-hook', 'outside-heel-hook', 'kneebar'], description: 'Enter the honey hole. Inside position.',
  },
  {
    id: 'fifty-fifty-sweep', name: '50/50 Sweep', category: 'sweep', style: 'leg-locker',
    posReq: [neu('leg-entanglement')], resultPosition: 'open-guard', resultRole: 'top',
    power: 35, accuracy: 78, staminaCost: 14, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['knee-cut'], description: 'Sweep from 50/50 to gain top position.',
  },
  {
    id: 'estima-lock', name: 'Estima Lock', category: 'submission', style: 'leg-locker',
    posReq: [top('open-guard'), top('half-guard')], resultPosition: null, resultRole: null,
    power: 55, accuracy: 75, staminaCost: 14, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['ankle-lock'], description: 'Foot lock while passing. Catches people off guard.',
  },
  {
    id: 'electric-chair', name: 'Electric Chair', category: 'submission', style: 'leg-locker',
    posReq: [bot('half-guard')], resultPosition: null, resultRole: null,
    power: 65, accuracy: 65, staminaCost: 18, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['deep-half-sweep'], description: 'Lockdown to electric chair. Splits the legs.',
  },
  {
    id: 'imanari-roll', name: 'Imanari Roll', category: 'transition', style: 'leg-locker',
    posReq: [neu('standing')], resultPosition: 'leg-entanglement', resultRole: 'neutral',
    power: 0, accuracy: 60, staminaCost: 16, statAttack: 'flx', statDefense: 'spd',
    chainPotential: ['heel-hook', 'outside-heel-hook'], description: 'Roll into leg entanglement from standing. Flashy.',
  },
  {
    id: 'rolling-kneebar', name: 'Rolling Kneebar', category: 'submission', style: 'leg-locker',
    posReq: [top('turtle'), top('open-guard')], resultPosition: null, resultRole: null,
    power: 70, accuracy: 62, staminaCost: 20, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['heel-hook'], description: 'Rolling entry into kneebar. Unexpected.',
  },
  {
    id: 'kneebar-top', name: 'Kneebar from Top', category: 'submission', style: 'leg-locker',
    posReq: [top('half-guard'), top('open-guard')], resultPosition: null, resultRole: null,
    power: 65, accuracy: 70, staminaCost: 18, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['heel-hook', 'calf-slicer'], description: 'Catch kneebar while passing.',
  },
  {
    id: 'twister', name: 'Twister', category: 'submission', style: 'leg-locker',
    posReq: [top('back-control'), top('turtle')], resultPosition: null, resultRole: null,
    power: 85, accuracy: 55, staminaCost: 22, statAttack: 'tec', statDefense: 'flx',
    chainPotential: [], description: 'Spine lock from back. The Eddie Bravo special.',
  },

  // ── ADVANCED GUARD (10 new) ──
  {
    id: 'spider-sweep', name: 'Spider Guard Sweep', category: 'sweep', style: 'guard-player',
    posReq: [bot('open-guard')], resultPosition: 'mount', resultRole: 'top',
    power: 40, accuracy: 78, staminaCost: 14, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['armbar-mount', 'cross-collar-mount'], description: 'Sweep from spider guard grips.',
  },
  {
    id: 'lasso-sweep', name: 'Lasso Sweep', category: 'sweep', style: 'guard-player',
    posReq: [bot('open-guard')], resultPosition: 'mount', resultRole: 'top',
    power: 38, accuracy: 80, staminaCost: 14, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['armbar-mount'], description: 'Lasso the arm, sweep over.',
  },
  {
    id: 'dlr-sweep', name: 'DLR Sweep', category: 'sweep', style: 'berimbolo',
    posReq: [bot('open-guard')], resultPosition: 'open-guard', resultRole: 'top',
    power: 35, accuracy: 80, staminaCost: 12, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['leg-drag', 'berimbolo-sweep'], description: 'De La Riva hook sweep.',
  },
  {
    id: 'reverse-dlr', name: 'Reverse DLR Sweep', category: 'sweep', style: 'berimbolo',
    posReq: [bot('open-guard')], resultPosition: 'back-control', resultRole: 'top',
    power: 40, accuracy: 68, staminaCost: 16, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['rnc', 'berimbolo-sweep'], description: 'RDLR inversion to the back. Kiss of the Dragon.',
  },
  {
    id: 'worm-guard', name: 'Worm Guard Entry', category: 'transition', style: 'guard-player',
    posReq: [bot('open-guard'), bot('closed-guard')], resultPosition: null, resultRole: null,
    power: 0, accuracy: 80, staminaCost: 10, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['spider-sweep', 'omoplata', 'berimbolo-sweep'], description: 'Wrap the lapel. Keenan style.',
  },
  {
    id: 'tornado-sweep', name: 'Tornado Sweep', category: 'sweep', style: 'berimbolo',
    posReq: [bot('half-guard')], resultPosition: 'mount', resultRole: 'top',
    power: 45, accuracy: 60, staminaCost: 18, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['armbar-mount'], description: 'Invert under half guard and sweep to mount. Flashy.',
  },
  {
    id: 'sit-up-sweep', name: 'Sit-Up Guard Sweep', category: 'sweep', style: 'guard-player',
    posReq: [bot('open-guard')], resultPosition: 'open-guard', resultRole: 'top',
    power: 30, accuracy: 85, staminaCost: 10, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['knee-cut'], description: 'Sit up, underhook, sweep. Fundamental.',
  },
  {
    id: 'collar-sleeve', name: 'Collar Sleeve Guard', category: 'transition', style: 'guard-player',
    posReq: [bot('open-guard')], resultPosition: null, resultRole: null,
    power: 0, accuracy: 85, staminaCost: 8, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['triangle', 'omoplata', 'spider-sweep'], description: 'Control collar and sleeve. Set up attacks.',
  },
  {
    id: 'dlr-to-back', name: 'DLR to Back Take', category: 'sweep', style: 'berimbolo',
    posReq: [bot('open-guard')], resultPosition: 'back-control', resultRole: 'top',
    power: 35, accuracy: 65, staminaCost: 18, statAttack: 'tec', statDefense: 'spd',
    chainPotential: ['rnc', 'armbar-back'], description: 'DLR hook, invert, take the back.',
  },
  {
    id: 'x-guard-standup', name: 'X-Guard to Standup', category: 'sweep', style: 'guard-player',
    posReq: [bot('open-guard')], resultPosition: 'standing', resultRole: 'neutral',
    power: 30, accuracy: 82, staminaCost: 12, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['double-leg', 'single-leg'], description: 'Technical standup from X-guard.',
  },

  // ── ADVANCED SUBMISSIONS (12 new) ──
  {
    id: 'arm-triangle', name: 'Arm Triangle', category: 'submission', style: 'sub-hunter',
    posReq: [top('side-control'), top('mount'), top('half-guard')], resultPosition: null, resultRole: null,
    power: 80, accuracy: 72, staminaCost: 20, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['americana', 'darce'], description: 'Head and arm choke from top. Relentless pressure.',
  },
  {
    id: 'mounted-triangle', name: 'Mounted Triangle', category: 'submission', style: 'sub-hunter',
    posReq: [top('mount')], resultPosition: null, resultRole: null,
    power: 90, accuracy: 60, staminaCost: 22, statAttack: 'tec', statDefense: 'flx',
    chainPotential: ['armbar-mount'], description: 'Lock triangle from mount. Nearly inescapable.',
  },
  {
    id: 'ezekiel', name: 'Ezekiel Choke', category: 'submission', style: 'controller',
    posReq: [top('mount'), top('side-control'), bot('closed-guard')], resultPosition: null, resultRole: null,
    power: 60, accuracy: 75, staminaCost: 14, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['cross-collar-mount'], description: 'Sleeve choke. Works from anywhere.',
  },
  {
    id: 'loop-choke', name: 'Loop Choke', category: 'submission', style: 'sub-hunter',
    posReq: [bot('open-guard'), bot('half-guard'), neu('clinch')], resultPosition: null, resultRole: null,
    power: 65, accuracy: 70, staminaCost: 16, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['guillotine'], description: 'Collar loop choke. Catches passers.',
  },
  {
    id: 'crucifix', name: 'Crucifix', category: 'submission', style: 'controller',
    posReq: [top('turtle'), top('back-control')], resultPosition: null, resultRole: null,
    power: 70, accuracy: 68, staminaCost: 18, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['rnc'], description: 'Trap the arms. Complete control.',
  },
  {
    id: 'gogoplata', name: 'Gogoplata', category: 'submission', style: 'berimbolo',
    posReq: [bot('closed-guard'), top('mount')], resultPosition: null, resultRole: null,
    power: 75, accuracy: 50, staminaCost: 22, statAttack: 'flx', statDefense: 'tgh',
    chainPotential: ['omoplata'], description: 'Shin across the throat. Requires extreme flexibility.',
  },
  {
    id: 'bow-arrow', name: 'Bow and Arrow Choke', category: 'submission', style: 'sub-hunter',
    posReq: [top('back-control')], resultPosition: null, resultRole: null,
    power: 95, accuracy: 68, staminaCost: 22, statAttack: 'str', statDefense: 'tgh',
    chainPotential: ['rnc'], description: 'Collar and pant grip choke from back. Maximum leverage.',
  },
  {
    id: 'paper-cutter', name: 'Paper Cutter Choke', category: 'submission', style: 'controller',
    posReq: [top('side-control'), top('north-south')], resultPosition: null, resultRole: null,
    power: 65, accuracy: 74, staminaCost: 16, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['ns-transition'], description: 'Cross collar choke from top. Sneaky.',
  },
  {
    id: 'clock-choke', name: 'Clock Choke', category: 'submission', style: 'controller',
    posReq: [top('turtle')], resultPosition: null, resultRole: null,
    power: 70, accuracy: 72, staminaCost: 16, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: ['seatbelt-back-take'], description: 'Walk around for the clock choke on turtle.',
  },
  {
    id: 'baseball-choke', name: 'Baseball Bat Choke', category: 'submission', style: 'sub-hunter',
    posReq: [top('knee-on-belly'), bot('half-guard'), top('side-control')], resultPosition: null, resultRole: null,
    power: 72, accuracy: 65, staminaCost: 18, statAttack: 'tec', statDefense: 'tgh',
    chainPotential: [], description: 'Cross grip choke. Roll through for the finish.',
  },
  {
    id: 'flying-armbar', name: 'Flying Armbar', category: 'submission', style: 'sub-hunter',
    posReq: [neu('standing'), neu('clinch')], resultPosition: null, resultRole: null,
    power: 85, accuracy: 45, staminaCost: 24, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['triangle'], description: 'Jump and lock the arm mid-air. Maximum risk, maximum reward.',
  },
  {
    id: 'flying-triangle', name: 'Flying Triangle', category: 'submission', style: 'sub-hunter',
    posReq: [neu('standing'), neu('clinch')], resultPosition: null, resultRole: null,
    power: 88, accuracy: 42, staminaCost: 26, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['armbar-guard'], description: 'Jump to triangle from standing. The highlight reel.',
  },

  // ── ADVANCED PASSES (6 new) ──
  {
    id: 'over-under', name: 'Over-Under Pass', category: 'pass', style: 'pressure-passer',
    posReq: [top('closed-guard'), top('half-guard')], resultPosition: 'side-control', resultRole: 'top',
    power: 50, accuracy: 78, staminaCost: 18, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['americana', 'darce'], description: 'Bernardo Faria special. Heavy pressure pass.',
  },
  {
    id: 'body-lock-pass', name: 'Body Lock Pass', category: 'pass', style: 'pressure-passer',
    posReq: [top('closed-guard'), top('half-guard'), top('open-guard')],
    resultPosition: 'side-control', resultRole: 'top',
    power: 45, accuracy: 80, staminaCost: 16, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['kob-transition', 'ns-transition'], description: 'Gordon Ryan system. Body lock and slide.',
  },
  {
    id: 'cartwheel-pass', name: 'Cartwheel Pass', category: 'pass', style: 'berimbolo',
    posReq: [top('open-guard')], resultPosition: 'side-control', resultRole: 'top',
    power: 35, accuracy: 68, staminaCost: 16, statAttack: 'flx', statDefense: 'flx',
    chainPotential: ['back-take-transition'], description: 'Cartwheel over the guard. Acrobatic.',
  },
  {
    id: 'x-pass', name: 'X-Pass', category: 'pass', style: 'pressure-passer',
    posReq: [top('open-guard')], resultPosition: 'side-control', resultRole: 'top',
    power: 40, accuracy: 82, staminaCost: 14, statAttack: 'spd', statDefense: 'flx',
    chainPotential: ['kob-transition'], description: 'Quick lateral pass. Speed over pressure.',
  },
  {
    id: 'leg-weave', name: 'Leg Weave Pass', category: 'pass', style: 'pressure-passer',
    posReq: [top('open-guard'), top('half-guard')], resultPosition: 'side-control', resultRole: 'top',
    power: 42, accuracy: 78, staminaCost: 16, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['americana'], description: 'Thread through the legs. Methodical.',
  },
  {
    id: 'float-pass', name: 'Float Pass', category: 'pass', style: 'berimbolo',
    posReq: [top('open-guard')], resultPosition: 'knee-on-belly', resultRole: 'top',
    power: 30, accuracy: 80, staminaCost: 12, statAttack: 'spd', statDefense: 'flx',
    chainPotential: ['kob-armbar', 'mount-transition'], description: 'Float over the legs. Light and fast.',
  },

  // ── MISSING ESCAPES (8 new) ──
  {
    id: 'kob-escape', name: 'KOB Escape', category: 'escape', style: 'guard-player',
    posReq: [bot('knee-on-belly')], resultPosition: 'half-guard', resultRole: 'bottom',
    power: 10, accuracy: 75, staminaCost: 14, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['deep-half-sweep', 'lockdown'], description: 'Frame and recover half guard.',
  },
  {
    id: 'ns-escape', name: 'North-South Escape', category: 'escape', style: 'wrestler',
    posReq: [bot('north-south')], resultPosition: 'open-guard', resultRole: 'bottom',
    power: 10, accuracy: 70, staminaCost: 16, statAttack: 'str', statDefense: 'str',
    chainPotential: ['scissor-sweep'], description: 'Frame and turn into guard.',
  },
  {
    id: 'half-guard-underhook', name: 'Underhook from Half', category: 'escape', style: 'wrestler',
    posReq: [bot('half-guard')], resultPosition: 'half-guard', resultRole: 'bottom',
    power: 15, accuracy: 80, staminaCost: 10, statAttack: 'str', statDefense: 'str',
    chainPotential: ['deep-half-sweep', 'underhook-escape'], description: 'Fight for the underhook. The half guard battle.',
  },
  {
    id: 'back-shoulder-roll', name: 'Shoulder Roll Escape', category: 'escape', style: 'berimbolo',
    posReq: [bot('back-control')], resultPosition: 'open-guard', resultRole: 'bottom',
    power: 15, accuracy: 58, staminaCost: 18, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['leg-entry'], description: 'Roll through the back take. High-level escape.',
  },
  {
    id: 'leg-lock-defense', name: 'Leg Lock Defense', category: 'escape', style: 'leg-locker',
    posReq: [neu('leg-entanglement')], resultPosition: 'open-guard', resultRole: 'top',
    power: 5, accuracy: 72, staminaCost: 14, statAttack: 'tec', statDefense: 'tec',
    chainPotential: ['knee-cut', 'toreando'], description: 'Clear the legs and come on top. Knowledge is defense.',
  },
  {
    id: 'matrix-escape', name: 'Matrix Escape', category: 'escape', style: 'berimbolo',
    posReq: [bot('side-control'), bot('mount'), bot('knee-on-belly')],
    resultPosition: 'open-guard', resultRole: 'bottom',
    power: 20, accuracy: 50, staminaCost: 20, statAttack: 'flx', statDefense: 'str',
    chainPotential: ['leg-entry', 'berimbolo-sweep'], description: 'Invert out of danger. The matrix. Incredibly flashy.',
  },
  {
    id: 'turtle-roll', name: 'Turtle Roll', category: 'escape', style: 'wrestler',
    posReq: [bot('turtle')], resultPosition: 'half-guard', resultRole: 'bottom',
    power: 15, accuracy: 72, staminaCost: 14, statAttack: 'str', statDefense: 'str',
    chainPotential: ['deep-half-sweep'], description: 'Roll from turtle to half guard.',
  },
  {
    id: 'mount-arm-frame', name: 'Mount Arm Frame', category: 'escape', style: 'controller',
    posReq: [bot('mount')], resultPosition: 'half-guard', resultRole: 'bottom',
    power: 5, accuracy: 80, staminaCost: 10, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['lockdown', 'deep-half-sweep'], description: 'Frame with the arms. Systematic escape.',
  },
  // ── SETUP MOVES (grips / control) ──
  {
    id: 'collar-grip', name: 'Collar Grip', category: 'setup', style: 'judoka',
    posReq: [neu('standing'), neu('clinch'), top('closed-guard'), bot('closed-guard')],
    resultPosition: null, resultRole: null,
    power: 0, accuracy: 92, staminaCost: 6, statAttack: 'str', statDefense: 'str',
    chainPotential: ['osoto-gari', 'seoi-nage', 'cross-collar-mount'],
    description: 'Establish a strong collar grip. Control the posture.',
    setupBonus: { accuracyMod: 12, damageMod: 0.15, critMod: 0.05, duration: 2 },
  },
  {
    id: 'underhook', name: 'Underhook', category: 'setup', style: 'wrestler',
    posReq: [neu('standing'), neu('clinch'), top('half-guard'), bot('half-guard')],
    resultPosition: null, resultRole: null,
    power: 0, accuracy: 90, staminaCost: 7, statAttack: 'str', statDefense: 'str',
    chainPotential: ['double-leg', 'single-leg', 'snap-down'],
    description: 'Fight for the underhook. Whoever has it controls the exchange.',
    setupBonus: { accuracyMod: 10, damageMod: 0.12, critMod: 0.03, duration: 2 },
  },
  {
    id: 'pummeling', name: 'Pummeling', category: 'setup', style: 'wrestler',
    posReq: [neu('clinch')],
    resultPosition: null, resultRole: null,
    power: 0, accuracy: 95, staminaCost: 5, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['double-leg', 'single-leg', 'suplex', 'osoto-gari'],
    description: 'Hand fight and pummel for dominant grip position.',
    setupBonus: { accuracyMod: 15, damageMod: 0.10, critMod: 0.02, duration: 2 },
  },
  {
    id: 'sleeve-control', name: 'Sleeve Control', category: 'setup', style: 'guard-player',
    posReq: [bot('closed-guard'), bot('open-guard'), bot('half-guard')],
    resultPosition: null, resultRole: null,
    power: 0, accuracy: 92, staminaCost: 5, statAttack: 'tec', statDefense: 'str',
    chainPotential: ['scissor-sweep', 'triangle', 'armbar-guard', 'omoplata'],
    description: 'Control the sleeve. Break their posture. Set up sweeps and subs.',
    setupBonus: { accuracyMod: 12, damageMod: 0.10, critMod: 0.05, duration: 2 },
  },
];

// Index for quick lookup
const moveIndex = new Map<string, Move>();
for (const m of MOVES) moveIndex.set(m.id, m);

export function getMove(id: string): Move | undefined {
  return moveIndex.get(id);
}
