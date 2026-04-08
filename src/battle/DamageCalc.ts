import type { Move, BattleGrappler, Stats, StatKey } from '../engine/types';
import { getLevel } from './stats';
import { getStyleEffectiveness } from '../data/styles';
import { POSITIONS } from '../data/positions';
import type { Position } from '../engine/types';
import { damageRandom } from '../engine/random';

function getStat(stats: Stats, key: StatKey): number {
  return stats[key];
}

export function calculateDamage(
  attacker: BattleGrappler,
  defender: BattleGrappler,
  move: Move,
  attackerPosition: Position,
): number {
  if (move.power === 0) return 0;

  const level = getLevel(attacker.grappler);

  const A = getStat(attacker.stats, move.statAttack);
  const D = Math.max(1, getStat(defender.stats, move.statDefense));

  // Base damage (Pokemon Gen 1 formula)
  let damage = ((2 * level / 5 + 2) * move.power * (A / D)) / 50 + 2;

  // STAB: 1.5x if move style matches grappler style
  if (move.style === attacker.grappler.style) {
    damage *= 1.5;
  }

  // Type effectiveness
  const effectiveness = getStyleEffectiveness(move.style, defender.grappler.style);
  damage *= effectiveness;

  // Position modifier
  const posData = POSITIONS[attackerPosition];
  if (posData) {
    damage *= posData.damageMod;
  }

  // Gassed penalty
  if (attacker.isGassed) {
    damage *= 0.6;
  }

  // Random variance (0.85 to 1.0)
  damage *= damageRandom();

  return Math.max(1, Math.floor(damage));
}

export function getEffectivenessText(_attacker: BattleGrappler, defender: BattleGrappler, move: Move): string {
  const eff = getStyleEffectiveness(move.style, defender.grappler.style);
  if (eff >= 2.0) return "It's super effective!";
  if (eff >= 1.5) return "It's effective!";
  if (eff <= 0.5) return "Not very effective...";
  return '';
}
