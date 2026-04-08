import type { Move, BattleGrappler, Stats, StatKey, Position, PositionRole } from '../engine/types';
import { getStyleEffectiveness } from '../data/styles';
import { POSITIONS } from '../data/positions';
import { getLevel } from './stats';
import { damageRandom } from '../engine/random';

function getStat(stats: Stats, key: StatKey): number {
  return stats[key];
}

export function calculateDamage(
  attacker: BattleGrappler,
  defender: BattleGrappler,
  move: Move,
  position: Position,
  attackerRole: PositionRole,
): number {
  if (move.power === 0) return 0;

  const level = getLevel(attacker.grappler);
  const A = getStat(attacker.stats, move.statAttack);
  const D = Math.max(1, getStat(defender.stats, move.statDefense));

  let damage = ((2 * level / 5 + 2) * move.power * (A / D)) / 50 + 2;

  // STAB
  if (move.style === attacker.grappler.style) damage *= 1.5;

  // Type effectiveness
  damage *= getStyleEffectiveness(move.style, defender.grappler.style);

  // Position modifier based on role
  const posData = POSITIONS[position];
  const damageMod = attackerRole === 'top' ? posData.damageModTop
    : attackerRole === 'bottom' ? posData.damageModBottom : 1.0;
  damage *= damageMod;

  // Gassed penalty
  if (attacker.isGassed) damage *= 0.6;

  // Random variance
  damage *= damageRandom();

  return Math.max(1, Math.floor(damage));
}

export function getEffectivenessText(defender: BattleGrappler, move: Move): string {
  const eff = getStyleEffectiveness(move.style, defender.grappler.style);
  if (eff >= 2.0) return "It's super effective!";
  if (eff >= 1.5) return "It's effective!";
  if (eff <= 0.5) return "Not very effective...";
  return '';
}
