import type { WorldRegion } from '../engine/types';

export const REGIONS: WorldRegion[] = [
  {
    id: 'home', name: 'Home Gym', description: 'Where it all began. Your coach, your mats, your fundamentals.',
    styleSpecialty: null, unlockRequirements: [], stampId: null, stampName: null,
    color: '#ffd700',
  },
  {
    id: 'scramble-valley', name: 'Scramble Valley',
    description: 'An open-air warehouse gym. Fast-paced, inversion-heavy rolling. The berimbolo capital.',
    styleSpecialty: 'berimbolo', stampId: 'scramble', stampName: 'Scramble Stamp',
    unlockRequirements: [{ type: 'npc-wins', value: 2, label: 'Beat 2 training partners at home' }],
    color: '#00bcd4',
  },
  {
    id: 'old-town', name: 'Old Town',
    description: 'A traditional academy in a historic building. Gi-only. Positional mastery. Deep respect culture.',
    styleSpecialty: 'controller', stampId: 'tradition', stampName: 'Tradition Stamp',
    unlockRequirements: [
      { type: 'belt', value: 'blue', label: 'Blue belt required' },
    ],
    color: '#3498db',
  },
  {
    id: 'steel-mountain', name: 'Steel Mountain',
    description: 'A wrestling room in a sports complex. Hard mats, no AC. Pure grind culture.',
    styleSpecialty: 'wrestler', stampId: 'iron', stampName: 'Iron Stamp',
    unlockRequirements: [
      { type: 'belt', value: 'blue', label: 'Blue belt required' },
      { type: 'tournament-win', value: 'old-town-classic', label: 'Win Old Town Classic' },
    ],
    color: '#e74c3c',
  },
  {
    id: 'coral-bay', name: 'Coral Bay',
    description: 'Beach-side academy with ocean views. Relaxed culture, deadly guard players.',
    styleSpecialty: 'guard-player', stampId: 'wave', stampName: 'Wave Stamp',
    unlockRequirements: [
      { type: 'belt', value: 'purple', label: 'Purple belt required' },
    ],
    color: '#2ecc71',
  },
  {
    id: 'sambo-district', name: 'Sambo District',
    description: 'Underground fight gym. Dim lighting, combat sambo posters. Cross-discipline intensity.',
    styleSpecialty: 'judoka', stampId: 'combat', stampName: 'Combat Stamp',
    unlockRequirements: [
      { type: 'belt', value: 'purple', label: 'Purple belt required' },
      { type: 'stamp-count', value: 3, label: '3 stamps collected' },
    ],
    color: '#f39c12',
  },
  {
    id: 'nova-camp', name: 'Nova Camp',
    description: 'Cutting-edge training facility. Video analysis, sports science. Where world champions are made.',
    styleSpecialty: 'sub-hunter', stampId: 'precision', stampName: 'Precision Stamp',
    unlockRequirements: [
      { type: 'belt', value: 'brown', label: 'Brown belt required' },
    ],
    color: '#e91e63',
  },
  {
    id: 'iron-coast', name: 'Iron Coast',
    description: 'Massive competition training center on a cliff. The final academy before the endgame.',
    styleSpecialty: 'pressure-passer', stampId: 'champion', stampName: 'Champion Stamp',
    unlockRequirements: [
      { type: 'belt', value: 'brown', label: 'Brown belt required' },
      { type: 'stamp-count', value: 5, label: '5 stamps collected' },
    ],
    color: '#8e44ad',
  },
  {
    id: 'summit-city', name: 'Summit City',
    description: 'The grand coliseum. World Championship venue. Banners of past champions line the halls.',
    styleSpecialty: null, stampId: null, stampName: null,
    unlockRequirements: [
      { type: 'belt', value: 'black', label: 'Black belt required' },
      { type: 'stamp-count', value: 8, label: 'All 8 stamps collected' },
    ],
    color: '#ffd700',
  },
];

export function getRegion(id: string): WorldRegion | undefined {
  return REGIONS.find(r => r.id === id);
}

export function isRegionUnlocked(
  regionId: string,
  playerBelt: string,
  stamps: string[],
  tournamentWins: string[],
  npcWins: number,
): boolean {
  const region = getRegion(regionId);
  if (!region) return false;

  for (const req of region.unlockRequirements) {
    switch (req.type) {
      case 'belt': {
        const beltOrder = ['white', 'blue', 'purple', 'brown', 'black'];
        if (beltOrder.indexOf(playerBelt) < beltOrder.indexOf(req.value as string)) return false;
        break;
      }
      case 'stamp-count':
        if (stamps.length < (req.value as number)) return false;
        break;
      case 'tournament-win':
        if (!tournamentWins.includes(req.value as string)) return false;
        break;
      case 'npc-wins':
        if (npcWins < (req.value as number)) return false;
        break;
    }
  }
  return true;
}
