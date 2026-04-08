import type { Position, PositionData, PositionRole } from '../engine/types';

export const POSITIONS: Record<Position, PositionData> = {
  'standing': {
    id: 'standing', name: 'Standing', symmetric: true,
    advantage: 'neutral', atbModTop: 1.0, atbModBottom: 1.0,
    damageModTop: 1.0, damageModBottom: 1.0,
    topCategories: ['takedown', 'transition'],
    bottomCategories: ['takedown', 'transition'],
  },
  'clinch': {
    id: 'clinch', name: 'Clinch', symmetric: true,
    advantage: 'neutral', atbModTop: 1.0, atbModBottom: 1.0,
    damageModTop: 1.0, damageModBottom: 1.0,
    topCategories: ['takedown', 'submission', 'transition'],
    bottomCategories: ['takedown', 'submission', 'transition'],
  },
  'closed-guard': {
    id: 'closed-guard', name: 'Closed Guard', symmetric: false,
    advantage: 'slight-bottom', atbModTop: 0.9, atbModBottom: 1.1,
    damageModTop: 0.9, damageModBottom: 1.1,
    topCategories: ['pass', 'transition'],
    bottomCategories: ['sweep', 'submission', 'transition'],
  },
  'open-guard': {
    id: 'open-guard', name: 'Open Guard', symmetric: false,
    advantage: 'neutral', atbModTop: 1.0, atbModBottom: 1.0,
    damageModTop: 1.0, damageModBottom: 1.0,
    topCategories: ['pass', 'transition'],
    bottomCategories: ['sweep', 'submission', 'transition'],
  },
  'half-guard': {
    id: 'half-guard', name: 'Half Guard', symmetric: false,
    advantage: 'slight-top', atbModTop: 1.05, atbModBottom: 0.95,
    damageModTop: 1.05, damageModBottom: 0.95,
    topCategories: ['pass', 'submission', 'transition'],
    bottomCategories: ['sweep', 'escape', 'transition'],
  },
  'side-control': {
    id: 'side-control', name: 'Side Control', symmetric: false,
    advantage: 'top', atbModTop: 1.15, atbModBottom: 0.85,
    damageModTop: 1.2, damageModBottom: 0.7,
    topCategories: ['submission', 'transition'],
    bottomCategories: ['escape', 'transition'],
  },
  'mount': {
    id: 'mount', name: 'Mount', symmetric: false,
    advantage: 'dominant-top', atbModTop: 1.25, atbModBottom: 0.75,
    damageModTop: 1.4, damageModBottom: 0.5,
    topCategories: ['submission', 'transition'],
    bottomCategories: ['escape'],
  },
  'back-control': {
    id: 'back-control', name: 'Back Control', symmetric: false,
    advantage: 'dominant-top', atbModTop: 1.3, atbModBottom: 0.7,
    damageModTop: 1.5, damageModBottom: 0.4,
    topCategories: ['submission', 'transition'],
    bottomCategories: ['escape'],
  },
  'turtle': {
    id: 'turtle', name: 'Turtle', symmetric: false,
    advantage: 'top', atbModTop: 1.15, atbModBottom: 0.85,
    damageModTop: 1.2, damageModBottom: 0.6,
    topCategories: ['submission', 'transition'],
    bottomCategories: ['escape', 'transition'],
  },
  'knee-on-belly': {
    id: 'knee-on-belly', name: 'Knee on Belly', symmetric: false,
    advantage: 'top', atbModTop: 1.2, atbModBottom: 0.8,
    damageModTop: 1.3, damageModBottom: 0.6,
    topCategories: ['submission', 'transition'],
    bottomCategories: ['escape'],
  },
  'north-south': {
    id: 'north-south', name: 'North-South', symmetric: false,
    advantage: 'top', atbModTop: 1.15, atbModBottom: 0.85,
    damageModTop: 1.15, damageModBottom: 0.7,
    topCategories: ['submission', 'transition'],
    bottomCategories: ['escape'],
  },
  'leg-entanglement': {
    id: 'leg-entanglement', name: 'Leg Entanglement', symmetric: true,
    advantage: 'neutral', atbModTop: 1.0, atbModBottom: 1.0,
    damageModTop: 1.0, damageModBottom: 1.0,
    topCategories: ['submission', 'sweep', 'escape', 'transition'],
    bottomCategories: ['submission', 'sweep', 'escape', 'transition'],
  },
};

// Get a fighter's role in the current position
export function getRole(_position: Position, topFighter: 'player' | 'opponent' | null, who: 'player' | 'opponent'): PositionRole {
  if (topFighter === null) return 'neutral'; // symmetric position
  return topFighter === who ? 'top' : 'bottom';
}

// Get available categories for a fighter based on their role
export function getCategories(position: Position, role: PositionRole): string[] {
  const data = POSITIONS[position];
  if (role === 'neutral') return data.topCategories; // symmetric — both get same options
  return role === 'top' ? data.topCategories : data.bottomCategories;
}

// Get display name with role context
export function getPositionDisplayName(position: Position, role: PositionRole): string {
  const data = POSITIONS[position];
  if (data.symmetric) return data.name;
  return role === 'top' ? `${data.name} (Top)` : `${data.name} (Bottom)`;
}
