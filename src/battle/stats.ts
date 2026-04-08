import type { Grappler, Stats, Belt } from '../engine/types';
import { BELT_LEVELS, BELT_XP_THRESHOLDS } from '../engine/types';
import { getMaxStamina } from './StaminaSystem';

// Get effective level based on belt + XP progress within belt
export function getLevel(grappler: Grappler): number {
  const beltBase = BELT_LEVELS[grappler.belt];
  const belts: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];
  const beltIdx = belts.indexOf(grappler.belt);
  const nextBelt = beltIdx < belts.length - 1 ? belts[beltIdx + 1] : null;

  const currentThreshold = BELT_XP_THRESHOLDS[grappler.belt];
  const nextThreshold = nextBelt ? BELT_XP_THRESHOLDS[nextBelt] : currentThreshold + 5000;
  const nextBeltLevel = nextBelt ? BELT_LEVELS[nextBelt] : beltBase + 15;

  // Interpolate level within belt based on XP progress
  const xpInBelt = grappler.xp - currentThreshold;
  const xpRange = nextThreshold - currentThreshold;
  const levelRange = nextBeltLevel - beltBase;
  const progress = Math.min(1, Math.max(0, xpInBelt / xpRange));

  return Math.max(1, beltBase + Math.floor(progress * levelRange));
}

function calcStat(base: number, iv: number, ev: number, level: number): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5);
}

function calcHp(base: number, iv: number, ev: number, level: number): number {
  // Boosted HP formula — BJJ matches should rarely end by ref stoppage
  // Even level 1 gets a substantial pool (~80+ HP)
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10) + 60;
}

export function computeStats(grappler: Grappler): Stats {
  const level = getLevel(grappler);
  const { baseStats, ivs, evs } = grappler;

  return {
    maxHp: calcHp(baseStats.hp, ivs.str, evs.str, level),
    str: calcStat(baseStats.str, ivs.str, evs.str, level),
    tec: calcStat(baseStats.tec, ivs.tec, evs.tec, level),
    tgh: calcStat(baseStats.tgh, ivs.tgh, evs.tgh, level),
    flx: calcStat(baseStats.flx, ivs.flx, evs.flx, level),
    spd: calcStat(baseStats.spd, ivs.spd, evs.spd, level),
    end: calcStat(baseStats.end, ivs.end, evs.end, level),
  };
}

export function createBattleGrappler(grappler: Grappler) {
  const stats = computeStats(grappler);
  const level = getLevel(grappler);
  const maxStamina = getMaxStamina(stats.end, level);

  return {
    grappler,
    stats,
    currentHp: stats.maxHp,
    currentStamina: maxStamina,
    maxStamina,
    isGassed: false,
    lastMoveId: null as string | null,
  };
}
