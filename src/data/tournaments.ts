import type { Tournament, Grappler, Belt, Style } from '../engine/types';
import { rollIVs } from '../engine/random';
import { ARCHETYPES } from './archetypes';

// ── Tournament definitions ──
export const TOURNAMENTS: Tournament[] = [
  {
    id: 'scramble-open', name: 'Scramble Valley Open',
    regionId: 'scramble-valley', bracketSize: 4,
    beltMin: 'white', beltMax: 'blue',
    entryFee: 50, prizePool: { gold: 300, silver: 100, bronze: 50 },
    ruleSet: 'points',
  },
  {
    id: 'old-town-classic', name: 'Old Town Classic',
    regionId: 'old-town', bracketSize: 8,
    beltMin: 'white', beltMax: 'purple',
    entryFee: 100, prizePool: { gold: 750, silver: 300, bronze: 150 },
    ruleSet: 'points',
  },
  {
    id: 'steel-invitational', name: 'Steel Mountain Invitational',
    regionId: 'steel-mountain', bracketSize: 8,
    beltMin: 'blue', beltMax: 'brown',
    entryFee: 150, prizePool: { gold: 1200, silver: 500, bronze: 250 },
    ruleSet: 'points',
  },
  {
    id: 'coral-bay-pro', name: 'Coral Bay Pro',
    regionId: 'coral-bay', bracketSize: 16,
    beltMin: 'purple', beltMax: 'black',
    entryFee: 250, prizePool: { gold: 2500, silver: 1000, bronze: 500 },
    ruleSet: 'points',
  },
  {
    id: 'sambo-cup', name: 'Sambo District Cup',
    regionId: 'sambo-district', bracketSize: 16,
    beltMin: 'brown', beltMax: 'black',
    entryFee: 250, prizePool: { gold: 3000, silver: 1200, bronze: 600 },
    ruleSet: 'points',
  },
  {
    id: 'nova-pro', name: 'Nova Pro Championship',
    regionId: 'nova-camp', bracketSize: 32,
    beltMin: 'brown', beltMax: 'black',
    entryFee: 400, prizePool: { gold: 5000, silver: 2000, bronze: 1000 },
    ruleSet: 'submission-only',
  },
  {
    id: 'iron-grand-prix', name: 'Iron Coast Grand Prix',
    regionId: 'iron-coast', bracketSize: 32,
    beltMin: 'black', beltMax: 'black',
    entryFee: 500, prizePool: { gold: 10000, silver: 4000, bronze: 2000 },
    ruleSet: 'points',
  },
  {
    id: 'world-championship', name: 'World Championship',
    regionId: 'summit-city', bracketSize: 32,
    beltMin: 'black', beltMax: 'black',
    entryFee: 1000, prizePool: { gold: 25000, silver: 10000, bronze: 5000 },
    ruleSet: 'points',
  },
];

export function getTournament(id: string): Tournament | undefined {
  return TOURNAMENTS.find(t => t.id === id);
}

export function getTournamentsByRegion(regionId: string): Tournament[] {
  return TOURNAMENTS.filter(t => t.regionId === regionId);
}

// ── Generate tournament opponents ──
const OPPONENT_NAMES = [
  'Matheus', 'Caio', 'Bia', 'Luna', 'Thiago', 'Yuki', 'Omar', 'Chen',
  'Viktor', 'Nadia', 'Felipe', 'Saki', 'Dante', 'Aria', 'Kai', 'Rio',
  'Liam', 'Sofia', 'Hugo', 'Petra', 'Andre', 'Mina', 'Ryu', 'Zara',
  'Marco', 'Leila', 'Bjorn', 'Ines', 'Ajax', 'Nyla', 'Elio', 'Ava',
];

type Frame = 'light' | 'medium' | 'heavy';
const STYLE_FRAME: Record<Style, Frame> = {
  'wrestler': 'heavy', 'judoka': 'heavy', 'pressure-passer': 'heavy',
  'guard-player': 'light', 'leg-locker': 'light', 'berimbolo': 'light',
  'sub-hunter': 'medium', 'controller': 'medium',
};

const BELT_EV_BUDGET: Record<Belt, number> = {
  white: 60, blue: 120, purple: 200, brown: 300, black: 400,
};

const BELT_XP_MID: Record<Belt, number> = {
  white: 600, blue: 2500, purple: 7000, brown: 15000, black: 30000,
};

export function generateBracket(tournament: Tournament, playerName: string): Grappler[] {
  const opponents: Grappler[] = [];
  const usedNames = new Set([playerName]);
  const belts: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];
  const minIdx = belts.indexOf(tournament.beltMin);
  const maxIdx = belts.indexOf(tournament.beltMax);

  for (let i = 0; i < tournament.bracketSize - 1; i++) {
    // Pick random archetype
    const arch = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];

    // Pick a name (with safety valve to prevent infinite loop)
    let name: string;
    let attempts = 0;
    do {
      name = OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
      attempts++;
      if (attempts > 50) { name = `Fighter ${i + 1}`; break; }
    } while (usedNames.has(name));
    usedNames.add(name);

    // Pick belt within tournament range
    const beltIdx = minIdx + Math.floor(Math.random() * (maxIdx - minIdx + 1));
    const belt = belts[beltIdx];

    // Scale stats slightly per round (later opponents are stronger)
    const roundScale = 1 + (i / (tournament.bracketSize - 1)) * 0.15;

    // Generate EVs — distribute budget among the archetype's strong stats
    const evBudget = Math.floor(BELT_EV_BUDGET[belt] * roundScale);
    const evs = { str: 0, tec: 0, tgh: 0, flx: 0, spd: 0, end: 0 };
    // Weight EVs toward the archetype's strongest stats
    const statKeys = Object.keys(arch.baseStats).filter(k => k !== 'hp') as (keyof typeof evs)[];
    const sorted = [...statKeys].sort((a, b) => (arch.baseStats as any)[b] - (arch.baseStats as any)[a]);
    let remaining = evBudget;
    for (let j = 0; j < sorted.length && remaining > 0; j++) {
      const alloc = Math.min(remaining, Math.floor(evBudget * (j === 0 ? 0.35 : j === 1 ? 0.25 : 0.10)));
      evs[sorted[j]] = Math.min(252, alloc);
      remaining -= alloc;
    }

    opponents.push({
      id: `tourney-${tournament.id}-${i}`,
      name,
      style: arch.style,
      belt,
      xp: BELT_XP_MID[belt],
      baseStats: { ...arch.baseStats },
      ivs: rollIVs(),
      evs,
      moves: arch.startingMoves.slice(0, 4 + beltIdx),
      learnedMoves: [...arch.startingMoves],
      frame: STYLE_FRAME[arch.style],
    });
  }

  return opponents;
}
