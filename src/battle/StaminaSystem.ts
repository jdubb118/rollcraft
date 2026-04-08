import type { BattleGrappler, Position } from '../engine/types';
import { POSITIONS } from '../data/positions';

// ── Fatigue curve — models real BJJ match pacing ──
export type FatiguePhase = 'fresh' | 'burn' | 'second-wind' | 'grind';

export function getFatiguePhase(turn: number, endStat: number): FatiguePhase {
  // High END (>35 computed) shortens Burn, extends Second Wind
  const highEnd = endStat > 35;
  if (turn <= 3) return 'fresh';
  if (turn <= (highEnd ? 5 : 6)) return 'burn';
  if (turn <= 9) return 'second-wind';
  return 'grind';
}

export function getFatigueModifiers(phase: FatiguePhase): {
  statMod: number;
  costMod: number;
  recoveryMod: number;
} {
  switch (phase) {
    case 'fresh': return { statMod: 1.05, costMod: 1.0, recoveryMod: 1.0 };
    case 'burn': return { statMod: 1.0, costMod: 1.25, recoveryMod: 0.70 };
    case 'second-wind': return { statMod: 1.0, costMod: 1.0, recoveryMod: 1.0 };
    case 'grind': return { statMod: 1.0, costMod: 1.10, recoveryMod: 0.85 };
  }
}

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

export function recoverStamina(fighter: BattleGrappler, position: Position, isTop: boolean, recoveryMod: number = 1.0): void {
  const baseRecovery = getStaminaRecovery(position, fighter.stats.end, isTop);
  const recovery = Math.max(1, Math.floor(baseRecovery * recoveryMod));
  fighter.currentStamina = Math.min(fighter.maxStamina, fighter.currentStamina + recovery);
  if (fighter.currentStamina > fighter.maxStamina * 0.2) {
    fighter.isGassed = false;
  }
}
