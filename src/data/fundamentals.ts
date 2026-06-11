/**
 * The Fundamentals Kit — "everyone knows the basics."
 *
 * Every grappler always has access to a weak-but-legal fundamental move for
 * every position+role. Equipped moves are your SPECIALIZATION — strictly
 * better versions and signature attacks. Fundamentals exist so no position
 * is ever a dead end (pre-kit, 53% of sim turns had zero real moves and
 * Spaz Out was 47% of the game).
 *
 * Design rules:
 * - Strictly worse than every comparable real move (power/accuracy).
 * - No flashy submissions — only the finish positions (mount/back) get a
 *   weak squeeze so a fight can end there without a specialist sub.
 * - Not shown in the Move Dex, never equipped, can't be learned.
 */
import type { Move, Position, PositionRole } from '../engine/types';

const top = (p: string) => ({ position: p as Position, role: 'top' as const });
const bot = (p: string) => ({ position: p as Position, role: 'bottom' as const });
const neu = (p: string) => ({ position: p as Position, role: 'neutral' as const });

export const FUNDAMENTALS: Move[] = [
  // ── Standing / clinch ──
  {
    id: 'fund-takedown', name: 'Basic Takedown', category: 'takedown', style: 'wrestler',
    posReq: [neu('standing'), neu('clinch')], resultPosition: 'half-guard', resultRole: 'top',
    power: 28, accuracy: 70, staminaCost: 14, statAttack: 'str', statDefense: 'tgh',
    chainPotential: [], description: 'A simple shot. Everyone drills these day one.',
  },
  {
    id: 'fund-tie-up', name: 'Tie Up', category: 'transition', style: 'wrestler',
    posReq: [neu('standing')], resultPosition: 'clinch', resultRole: 'neutral',
    power: 0, accuracy: 85, staminaCost: 6, statAttack: 'str', statDefense: 'str',
    chainPotential: ['fund-takedown'], description: 'Close the distance and grab hold.',
  },
  {
    id: 'fund-break-away', name: 'Break Away', category: 'transition', style: 'wrestler',
    posReq: [neu('clinch')], resultPosition: 'standing', resultRole: 'neutral',
    power: 0, accuracy: 85, staminaCost: 6, statAttack: 'str', statDefense: 'str',
    chainPotential: [], description: 'Frame off and create space.',
  },

  // ── Closed guard ──
  {
    id: 'fund-guard-open', name: 'Basic Guard Open', category: 'transition', style: 'pressure-passer',
    posReq: [top('closed-guard')], resultPosition: 'open-guard', resultRole: 'top',
    power: 8, accuracy: 75, staminaCost: 10, statAttack: 'str', statDefense: 'flx',
    chainPotential: ['fund-pass'], description: 'Posture and pry the guard open.',
  },
  {
    id: 'fund-sweep', name: 'Basic Sweep', category: 'sweep', style: 'guard-player',
    posReq: [bot('closed-guard'), bot('open-guard'), bot('half-guard')],
    resultPosition: 'open-guard', resultRole: 'top',
    power: 25, accuracy: 68, staminaCost: 12, statAttack: 'tec', statDefense: 'str',
    chainPotential: [], description: 'Off-balance them and come up on top.',
  },

  // ── Open guard / half guard ──
  {
    id: 'fund-pass', name: 'Basic Pass', category: 'pass', style: 'pressure-passer',
    posReq: [top('open-guard'), top('half-guard')], resultPosition: 'side-control', resultRole: 'top',
    power: 28, accuracy: 68, staminaCost: 14, statAttack: 'str', statDefense: 'flx',
    chainPotential: [], description: 'Work past the legs, one grip at a time.',
  },
  {
    id: 'fund-stand-up', name: 'Stand Back Up', category: 'escape', style: 'wrestler',
    posReq: [bot('open-guard'), bot('half-guard')], resultPosition: 'standing', resultRole: 'neutral',
    power: 5, accuracy: 72, staminaCost: 10, statAttack: 'str', statDefense: 'str',
    chainPotential: [], description: 'Technical stand-up. Wrestling 101.',
  },
  {
    id: 'fund-half-recover', name: 'Recover Guard', category: 'escape', style: 'guard-player',
    posReq: [bot('half-guard')], resultPosition: 'closed-guard', resultRole: 'bottom',
    power: 5, accuracy: 70, staminaCost: 10, statAttack: 'flx', statDefense: 'str',
    chainPotential: [], description: 'Work the knee through and close the guard.',
  },

  // ── Side control ──
  {
    id: 'fund-mount-up', name: 'Basic Mount', category: 'transition', style: 'controller',
    posReq: [top('side-control')], resultPosition: 'mount', resultRole: 'top',
    power: 0, accuracy: 62, staminaCost: 10, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['fund-squeeze'], description: 'Step over to the mount.',
  },
  {
    id: 'fund-side-escape', name: 'Basic Re-Guard', category: 'escape', style: 'guard-player',
    posReq: [bot('side-control'), bot('north-south'), bot('knee-on-belly')],
    resultPosition: 'open-guard', resultRole: 'bottom',
    power: 5, accuracy: 65, staminaCost: 12, statAttack: 'flx', statDefense: 'str',
    chainPotential: [], description: 'Frame, shrimp, get your legs back in the way.',
  },

  // ── Mount / back — the weak finish so these positions can end a match ──
  {
    id: 'fund-squeeze', name: 'Basic Collar Squeeze', category: 'submission', style: 'controller',
    posReq: [top('mount')], resultPosition: null, resultRole: null,
    power: 38, accuracy: 65, staminaCost: 14, statAttack: 'str', statDefense: 'tgh',
    chainPotential: [], description: 'Grind out a choke with raw grips.',
  },
  {
    id: 'fund-neck-squeeze', name: 'Basic Neck Squeeze', category: 'submission', style: 'controller',
    posReq: [top('back-control')], resultPosition: null, resultRole: null,
    power: 42, accuracy: 65, staminaCost: 14, statAttack: 'str', statDefense: 'tgh',
    chainPotential: [], description: 'Hunt the neck the ugly way.',
  },
  {
    id: 'fund-mount-escape', name: 'Basic Mount Escape', category: 'escape', style: 'wrestler',
    posReq: [bot('mount')], resultPosition: 'half-guard', resultRole: 'bottom',
    power: 5, accuracy: 62, staminaCost: 14, statAttack: 'flx', statDefense: 'str',
    chainPotential: [], description: 'Bridge, frame, drag a leg through.',
  },
  {
    id: 'fund-back-escape', name: 'Basic Back Escape', category: 'escape', style: 'wrestler',
    posReq: [bot('back-control')], resultPosition: 'turtle', resultRole: 'bottom',
    power: 5, accuracy: 60, staminaCost: 14, statAttack: 'str', statDefense: 'str',
    chainPotential: [], description: 'Fight the hands, slide down, turtle up.',
  },

  // ── Turtle ──
  {
    id: 'fund-breakdown', name: 'Basic Breakdown', category: 'transition', style: 'wrestler',
    posReq: [top('turtle')], resultPosition: 'side-control', resultRole: 'top',
    power: 20, accuracy: 70, staminaCost: 12, statAttack: 'str', statDefense: 'tgh',
    chainPotential: [], description: 'Flatten them out of the turtle.',
  },
  {
    id: 'fund-turtle-up', name: 'Basic Turtle Escape', category: 'escape', style: 'wrestler',
    posReq: [bot('turtle')], resultPosition: 'standing', resultRole: 'neutral',
    power: 5, accuracy: 68, staminaCost: 12, statAttack: 'str', statDefense: 'str',
    chainPotential: [], description: 'Build your base and stand.',
  },

  // ── Knee on belly / north-south tops ──
  {
    id: 'fund-settle', name: 'Settle to Side', category: 'transition', style: 'controller',
    posReq: [top('knee-on-belly'), top('north-south')], resultPosition: 'side-control', resultRole: 'top',
    power: 0, accuracy: 88, staminaCost: 5, statAttack: 'spd', statDefense: 'spd',
    chainPotential: ['fund-mount-up'], description: 'Drop back to solid side control.',
  },

  // ── Leg entanglement ──
  {
    id: 'fund-untangle', name: 'Untangle', category: 'escape', style: 'wrestler',
    posReq: [neu('leg-entanglement')], resultPosition: 'standing', resultRole: 'neutral',
    power: 5, accuracy: 68, staminaCost: 12, statAttack: 'str', statDefense: 'tec',
    chainPotential: [], description: 'Clear the knee line and pull free.',
  },
];

const FUND_BY_ID = new Map(FUNDAMENTALS.map(m => [m.id, m]));

export function getFundamental(id: string): Move | undefined {
  return FUND_BY_ID.get(id);
}

export function isFundamental(id: string): boolean {
  return FUND_BY_ID.has(id);
}

/** Fundamentals legal for the given position+role. */
export function getLegalFundamentals(position: Position, role: PositionRole): Move[] {
  return FUNDAMENTALS.filter(m =>
    m.posReq.some(req =>
      req.position === position && (req.role === role || (req.role === 'neutral' && role === 'neutral'))
    )
  );
}
