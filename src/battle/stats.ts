import type { Grappler, Stats } from '../engine/types';
import { BELT_LEVELS } from '../engine/types';
import { getMaxStamina } from './StaminaSystem';

function calcStat(base: number, iv: number, ev: number, level: number): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5);
}

function calcHp(base: number, iv: number, ev: number, level: number): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10);
}

export function computeStats(grappler: Grappler): Stats {
  const level = BELT_LEVELS[grappler.belt];
  const { baseStats, ivs, evs } = grappler;

  return {
    maxHp: calcHp(baseStats.hp, ivs.str, evs.str, level), // use str IV/EV for HP
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
  const level = BELT_LEVELS[grappler.belt];
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
