/**
 * Grapple Quest Item System
 * Items can be bought at gyms and used before/during matches.
 */

export interface Item {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'consumable' | 'training' | 'technique';
  effect: ItemEffect;
}

export type ItemEffect =
  | { type: 'heal-hp'; amount: number }
  | { type: 'heal-stamina'; amount: number }
  | { type: 'boost-ev'; stat: string; amount: number }
  | { type: 'teach-move'; moveId: string };

export const ITEMS: Item[] = [
  // Consumables — heal between matches
  {
    id: 'athletic-tape', name: 'Athletic Tape',
    description: 'Wrap up those sore joints. Restores 30% HP before next match.',
    cost: 30, category: 'consumable',
    effect: { type: 'heal-hp', amount: 30 },
  },
  {
    id: 'acai-bowl', name: 'Acai Bowl',
    description: 'The official fuel of BJJ. Restores 50% HP.',
    cost: 60, category: 'consumable',
    effect: { type: 'heal-hp', amount: 50 },
  },
  {
    id: 'electrolytes', name: 'Electrolytes',
    description: 'Stay hydrated. Start next match with full stamina.',
    cost: 40, category: 'consumable',
    effect: { type: 'heal-stamina', amount: 100 },
  },
  {
    id: 'energy-gel', name: 'Competition Energy Gel',
    description: 'Quick burst. Restores 30% stamina before next match.',
    cost: 25, category: 'consumable',
    effect: { type: 'heal-stamina', amount: 30 },
  },

  // Training items — EV boosters
  {
    id: 'protein-powder', name: 'Protein Powder',
    description: 'Build strength. +8 STR training points.',
    cost: 80, category: 'training',
    effect: { type: 'boost-ev', stat: 'str', amount: 8 },
  },
  {
    id: 'yoga-pass', name: 'Yoga Studio Pass',
    description: 'Improve flexibility. +8 FLX training points.',
    cost: 80, category: 'training',
    effect: { type: 'boost-ev', stat: 'flx', amount: 8 },
  },
  {
    id: 'sprint-intervals', name: 'Sprint Interval Program',
    description: 'Get faster. +8 SPD training points.',
    cost: 80, category: 'training',
    effect: { type: 'boost-ev', stat: 'spd', amount: 8 },
  },
  {
    id: 'cardio-program', name: 'Cardio Program',
    description: 'Build endurance. +8 END training points.',
    cost: 80, category: 'training',
    effect: { type: 'boost-ev', stat: 'end', amount: 8 },
  },
];

export function getItem(id: string): Item | undefined {
  return ITEMS.find(i => i.id === id);
}

export function getShopItems(): Item[] {
  return ITEMS.filter(i => i.category === 'consumable' || i.category === 'training');
}
