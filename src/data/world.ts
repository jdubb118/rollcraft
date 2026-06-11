import type { WorldRegion, AmbientParticleKind } from '../engine/types';

export const REGIONS: WorldRegion[] = [
  {
    id: 'home', name: 'Home Gym', description: 'Where it all began. Your coach, your mats, your fundamentals.',
    styleSpecialty: null, unlockRequirements: [], stampId: null, stampName: null,
    color: '#ffd700',
    tintColor: 'rgba(255,180,80,0.10)', ambientParticle: 'dust',
  },
  {
    id: 'scramble-valley', name: 'Scramble Valley',
    description: 'An open-air warehouse gym. Fast-paced, inversion-heavy rolling. The berimbolo capital.',
    styleSpecialty: 'berimbolo', stampId: 'scramble', stampName: 'Scramble Stamp',
    unlockRequirements: [{ type: 'npc-wins', value: 2, label: 'Beat 2 training partners at home' }],
    color: '#00bcd4',
    tintColor: 'rgba(100,200,220,0.12)', ambientParticle: 'leaves',
  },
  {
    id: 'old-town', name: 'Old Town',
    description: 'A traditional academy in a historic building. Gi-only. Positional mastery. Deep respect culture.',
    styleSpecialty: 'controller', stampId: 'tradition', stampName: 'Tradition Stamp',
    unlockRequirements: [
      { type: 'belt', value: 'blue', label: 'Blue belt required' },
    ],
    color: '#3498db',
    tintColor: 'rgba(180,140,90,0.16)', ambientParticle: 'dust',
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
    tintColor: 'rgba(120,130,150,0.22)', ambientParticle: 'snow',
  },
  {
    id: 'coral-bay', name: 'Coral Bay',
    description: 'Beach-side academy with ocean views. Relaxed culture, deadly guard players.',
    styleSpecialty: 'guard-player', stampId: 'wave', stampName: 'Wave Stamp',
    unlockRequirements: [
      { type: 'belt', value: 'purple', label: 'Purple belt required' },
    ],
    color: '#2ecc71',
    tintColor: 'rgba(255,140,100,0.18)', ambientParticle: 'wavemist',
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
    tintColor: 'rgba(70,50,90,0.28)', ambientParticle: 'embers',
  },
  {
    id: 'nova-camp', name: 'Nova Camp',
    description: 'Cutting-edge training facility. Video analysis, sports science. Where world champions are made.',
    styleSpecialty: 'sub-hunter', stampId: 'precision', stampName: 'Precision Stamp',
    unlockRequirements: [
      { type: 'belt', value: 'brown', label: 'Brown belt required' },
    ],
    color: '#e91e63',
    tintColor: 'rgba(180,160,210,0.12)', ambientParticle: null,
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
    // Brightened from rgba(90,110,160,0.20) — the near-black painted surfaces
    // plus a dark tint made the region unreadable. Lift, don't darken.
    tintColor: 'rgba(170,190,225,0.10)', ambientParticle: 'wavemist',
  },
  {
    id: 'summit-city', name: 'Summit City',
    description: 'The grand coliseum. World Championship venue. Banners of past champions line the halls.',
    styleSpecialty: null, stampId: null, stampName: null,
    unlockRequirements: [
      { type: 'belt', value: 'black', label: 'Black belt required' },
      { type: 'stamp-count', value: 7, label: 'All 7 stamps collected' },
    ],
    color: '#ffd700',
    tintColor: 'rgba(255,200,120,0.14)', ambientParticle: 'embers',
  },
];

export function getRegionAtmosphere(regionId: string): { tint?: string; particle?: AmbientParticleKind | null } {
  const r = REGIONS.find(x => x.id === regionId);
  return { tint: r?.tintColor, particle: r?.ambientParticle ?? null };
}

export function getRegion(id: string): WorldRegion | undefined {
  return REGIONS.find(r => r.id === id);
}

// ── Next objective — the "what do I do now?" breadcrumb ──
// Walks the region list in order and describes the first unmet gate with
// live progress numbers. Promotion-readiness is handled by the caller
// (it outranks region unlocks).
export interface NextObjective {
  title: string;
  detail: string;
}

export function getNextObjective(
  playerBelt: string,
  stamps: string[],
  tournamentWins: string[],
  npcWins: number,
): NextObjective | null {
  const beltOrder = ['white', 'blue', 'purple', 'brown', 'black'];

  for (const region of REGIONS) {
    if (isRegionUnlocked(region.id, playerBelt, stamps, tournamentWins, npcWins)) continue;

    const parts: string[] = [];
    for (const req of region.unlockRequirements) {
      switch (req.type) {
        case 'belt': {
          if (beltOrder.indexOf(playerBelt) < beltOrder.indexOf(req.value as string)) {
            parts.push(`reach ${(req.value as string).toUpperCase()} belt`);
          }
          break;
        }
        case 'npc-wins': {
          if (npcWins < (req.value as number)) {
            parts.push(`beat training partners (${npcWins}/${req.value})`);
          }
          break;
        }
        case 'stamp-count': {
          if (stamps.length < (req.value as number)) {
            parts.push(`collect stamps (${stamps.length}/${req.value})`);
          }
          break;
        }
        case 'tournament-win': {
          if (!tournamentWins.includes(req.value as string)) {
            const names: Record<string, string> = {
              'old-town-classic': 'win the Old Town Classic',
              'scramble-open': 'win the Scramble Valley Open',
            };
            parts.push(names[req.value as string] || `win ${req.value}`);
          }
          break;
        }
      }
    }
    if (parts.length === 0) continue; // shouldn't happen, but don't show an empty goal
    return { title: `UNLOCK ${region.name.toUpperCase()}`, detail: parts.join(' + ') };
  }

  // Everything unlocked — the endgame
  if (!tournamentWins.includes('world-championship')) {
    return { title: 'THE FINAL TEST', detail: 'Win the World Championship at Summit City' };
  }
  return { title: 'WORLD CHAMPION', detail: 'You did it. Run it back — or help a white belt.' };
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
