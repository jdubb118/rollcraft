import type { Move, BattleGrappler, Stats, StatKey, Position, PositionRole } from '../engine/types';
import { getStyleEffectiveness } from '../data/styles';
import { POSITIONS } from '../data/positions';
import { getLevel } from './stats';
import { damageRandom } from '../engine/random';

function getStat(stats: Stats, key: StatKey): number {
  return stats[key];
}

// ── Critical hit system (Pokemon Gen 1 inspired) ──
// Base rate from speed, position bonus, high-crit moves get 3x rate
const HIGH_CRIT_MOVES = new Set([
  'rnc', 'heel-hook', 'outside-heel-hook', 'armbar-mount', 'cross-collar-mount',
  'bow-arrow', 'mounted-triangle', 'flying-armbar', 'flying-triangle', 'twister',
  'suplex', 'kata-guruma', 'o-goshi',
]);

export function calculateCritChance(
  attacker: BattleGrappler,
  move: Move,
  position: Position,
  attackerRole: PositionRole,
  isChained: boolean,
): number {
  const posData = POSITIONS[position];

  // Base crit from speed: ~4-32% at speed 10-80
  let baseCrit = attacker.stats.spd / 250;

  // Position bonus (dominant position = cleaner shots)
  if (attackerRole === 'top') {
    if (posData.advantage === 'dominant-top') baseCrit += 0.12;
    else if (posData.advantage === 'top') baseCrit += 0.08;
    else if (posData.advantage === 'slight-top') baseCrit += 0.04;
  }

  // High-crit moves get 3x rate
  const moveMultiplier = HIGH_CRIT_MOVES.has(move.id) ? 3.0 : 1.0;

  // Chain bonus: +12% crit when chaining
  const chainBonus = isChained ? 0.12 : 0;

  return Math.min(0.50, (baseCrit * moveMultiplier) + chainBonus);
}

export function calculateDamage(
  attacker: BattleGrappler,
  defender: BattleGrappler,
  move: Move,
  position: Position,
  attackerRole: PositionRole,
  isChained: boolean = false,
  momentum: number = 0,
): { damage: number; isCrit: boolean } {
  if (move.power === 0) return { damage: 0, isCrit: false };

  const level = getLevel(attacker.grappler);
  const A = getStat(attacker.stats, move.statAttack);
  const D = Math.max(1, getStat(defender.stats, move.statDefense));

  let damage = ((2 * level / 5 + 2) * move.power * (A / D)) / 50 + 2;

  // STAB (Same Type Attack Bonus)
  if (move.style === attacker.grappler.style) damage *= 1.5;

  // Type effectiveness
  damage *= getStyleEffectiveness(move.style, defender.grappler.style);

  // Position modifier
  const posData = POSITIONS[position];
  const damageMod = attackerRole === 'top' ? posData.damageModTop
    : attackerRole === 'bottom' ? posData.damageModBottom : 1.0;
  damage *= damageMod;

  // Gassed penalties
  if (attacker.isGassed) damage *= 0.6;
  if (defender.isGassed) damage *= 1.2; // gassed defender takes 20% more

  // Momentum bonus (flow state)
  if (momentum >= 2) damage *= (1 + momentum * 0.05); // 2→1.10x, 3→1.15x

  // Setup bonus (grip/control)
  if (attacker.setupBonus) damage *= (1 + attacker.setupBonus.damageMod);

  // Critical hit check
  let critBonus = 0;
  if (momentum >= 3) critBonus += 0.05;
  if (attacker.setupBonus) critBonus += attacker.setupBonus.critMod;
  const critChance = calculateCritChance(attacker, move, position, attackerRole, isChained) + critBonus;
  const isCrit = Math.random() < critChance;
  if (isCrit) damage *= 1.5;

  // Random variance (0.85-1.0)
  damage *= damageRandom();

  return { damage: Math.max(1, Math.floor(damage)), isCrit };
}

export function getEffectivenessText(defender: BattleGrappler, move: Move): string {
  const eff = getStyleEffectiveness(move.style, defender.grappler.style);
  if (eff >= 2.0) return "It's super effective!";
  if (eff >= 1.5) return "It's effective!";
  // Don't show "not very effective" — it's noise that clutters the log
  return '';
}
