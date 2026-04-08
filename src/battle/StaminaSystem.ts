import type { BattleGrappler, Position } from '../engine/types';
import { POSITIONS } from '../data/positions';

export function getMaxStamina(endStat: number, level: number): number {
  return Math.floor(endStat * 1.5 + level * 0.5 + 50);
}

export function getStaminaRecovery(position: Position, endStat: number, isTop: boolean): number {
  const posData = POSITIONS[position];
  let baseRecovery: number;

  switch (posData.advantage) {
    case 'dominant-top': baseRecovery = isTop ? 8 : 1; break;
    case 'top': baseRecovery = isTop ? 6 : 2; break;
    case 'slight-top': baseRecovery = isTop ? 4 : 3; break;
    case 'slight-bottom': baseRecovery = isTop ? 3 : 4; break;
    default: baseRecovery = 3; break;
  }

  return baseRecovery + Math.floor(endStat / 30);
}

export function deductStamina(fighter: BattleGrappler, cost: number): void {
  fighter.currentStamina = Math.max(0, fighter.currentStamina - cost);
  fighter.isGassed = fighter.currentStamina === 0;
}

export function recoverStamina(fighter: BattleGrappler, position: Position, isTop: boolean): void {
  const recovery = getStaminaRecovery(position, fighter.stats.end, isTop);
  fighter.currentStamina = Math.min(fighter.maxStamina, fighter.currentStamina + recovery);
  if (fighter.currentStamina > fighter.maxStamina * 0.2) {
    fighter.isGassed = false;
  }
}
