import type { Position, PositionData, MoveCategory } from '../engine/types';

export const POSITIONS: Record<Position, PositionData> = {
  'standing': {
    id: 'standing', name: 'Standing', advantage: 'neutral',
    atbModTop: 1.0, atbModBottom: 1.0, damageMod: 1.0,
    pair: 'standing',
    availableCategories: ['takedown', 'transition'],
  },
  'clinch': {
    id: 'clinch', name: 'Clinch', advantage: 'neutral',
    atbModTop: 1.0, atbModBottom: 1.0, damageMod: 1.0,
    pair: 'clinch',
    availableCategories: ['takedown', 'submission', 'transition'],
  },
  'closed-guard-top': {
    id: 'closed-guard-top', name: 'Closed Guard (Top)', advantage: 'slight-bottom',
    atbModTop: 0.9, atbModBottom: 1.1, damageMod: 0.9,
    pair: 'closed-guard-bottom',
    availableCategories: ['pass', 'transition'],
  },
  'closed-guard-bottom': {
    id: 'closed-guard-bottom', name: 'Closed Guard (Bottom)', advantage: 'slight-bottom',
    atbModTop: 0.9, atbModBottom: 1.1, damageMod: 1.1,
    pair: 'closed-guard-top',
    availableCategories: ['sweep', 'submission', 'transition'],
  },
  'open-guard-top': {
    id: 'open-guard-top', name: 'Open Guard (Top)', advantage: 'neutral',
    atbModTop: 1.0, atbModBottom: 1.0, damageMod: 1.0,
    pair: 'open-guard-bottom',
    availableCategories: ['pass', 'transition'],
  },
  'open-guard-bottom': {
    id: 'open-guard-bottom', name: 'Open Guard (Bottom)', advantage: 'neutral',
    atbModTop: 1.0, atbModBottom: 1.0, damageMod: 1.0,
    pair: 'open-guard-top',
    availableCategories: ['sweep', 'submission', 'transition'],
  },
  'half-guard-top': {
    id: 'half-guard-top', name: 'Half Guard (Top)', advantage: 'slight-top',
    atbModTop: 1.05, atbModBottom: 0.95, damageMod: 1.05,
    pair: 'half-guard-bottom',
    availableCategories: ['pass', 'submission', 'transition'],
  },
  'half-guard-bottom': {
    id: 'half-guard-bottom', name: 'Half Guard (Bottom)', advantage: 'slight-top',
    atbModTop: 1.05, atbModBottom: 0.95, damageMod: 0.95,
    pair: 'half-guard-top',
    availableCategories: ['sweep', 'escape', 'transition'],
  },
  'side-control': {
    id: 'side-control', name: 'Side Control', advantage: 'top',
    atbModTop: 1.15, atbModBottom: 0.85, damageMod: 1.2,
    pair: 'side-control-bottom',
    availableCategories: ['submission', 'transition'],
  },
  'side-control-bottom': {
    id: 'side-control-bottom', name: 'Side Control (Bottom)', advantage: 'top',
    atbModTop: 1.15, atbModBottom: 0.85, damageMod: 0.7,
    pair: 'side-control',
    availableCategories: ['escape', 'transition'],
  },
  'mount': {
    id: 'mount', name: 'Mount', advantage: 'dominant-top',
    atbModTop: 1.25, atbModBottom: 0.75, damageMod: 1.4,
    pair: 'mount-bottom',
    availableCategories: ['submission', 'transition'],
  },
  'mount-bottom': {
    id: 'mount-bottom', name: 'Mount (Bottom)', advantage: 'dominant-top',
    atbModTop: 1.25, atbModBottom: 0.75, damageMod: 0.5,
    pair: 'mount',
    availableCategories: ['escape'],
  },
  'back-control': {
    id: 'back-control', name: 'Back Control', advantage: 'dominant-top',
    atbModTop: 1.3, atbModBottom: 0.7, damageMod: 1.5,
    pair: 'back-control-bottom',
    availableCategories: ['submission', 'transition'],
  },
  'back-control-bottom': {
    id: 'back-control-bottom', name: 'Back Control (Bottom)', advantage: 'dominant-top',
    atbModTop: 1.3, atbModBottom: 0.7, damageMod: 0.4,
    pair: 'back-control',
    availableCategories: ['escape'],
  },
  'turtle-top': {
    id: 'turtle-top', name: 'Turtle (Top)', advantage: 'top',
    atbModTop: 1.15, atbModBottom: 0.85, damageMod: 1.2,
    pair: 'turtle-bottom',
    availableCategories: ['submission', 'transition'],
  },
  'turtle-bottom': {
    id: 'turtle-bottom', name: 'Turtle', advantage: 'top',
    atbModTop: 1.15, atbModBottom: 0.85, damageMod: 0.6,
    pair: 'turtle-top',
    availableCategories: ['escape', 'transition'],
  },
  'knee-on-belly': {
    id: 'knee-on-belly', name: 'Knee on Belly', advantage: 'top',
    atbModTop: 1.2, atbModBottom: 0.8, damageMod: 1.3,
    pair: 'side-control-bottom',
    availableCategories: ['submission', 'transition'],
  },
  'north-south': {
    id: 'north-south', name: 'North-South', advantage: 'top',
    atbModTop: 1.15, atbModBottom: 0.85, damageMod: 1.15,
    pair: 'side-control-bottom',
    availableCategories: ['submission', 'transition'],
  },
  'leg-entanglement': {
    id: 'leg-entanglement', name: 'Leg Entanglement', advantage: 'neutral',
    atbModTop: 1.0, atbModBottom: 1.0, damageMod: 1.0,
    pair: 'leg-entanglement',
    availableCategories: ['submission', 'sweep', 'escape', 'transition'],
  },
};

// Is the player "on top" in this position?
export function isTopPosition(pos: Position): boolean {
  return !pos.includes('bottom') && pos !== 'standing' && pos !== 'clinch' && pos !== 'leg-entanglement';
}

// Get the paired position for the opponent
export function getPairedPosition(pos: Position): Position {
  return POSITIONS[pos].pair;
}

// Get available move categories for a position
export function getAvailableCategories(pos: Position): MoveCategory[] {
  return POSITIONS[pos].availableCategories;
}
