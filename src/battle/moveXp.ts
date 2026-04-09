/**
 * Move XP System — techniques improve with use.
 * Every time you USE a move in battle, it gains XP.
 * As it levels up: accuracy improves, stamina cost decreases, power increases.
 * Your go-to guillotine becomes YOUR guillotine.
 */

// XP thresholds for move levels
const MOVE_LEVEL_THRESHOLDS = [0, 5, 15, 30, 50, 80, 120, 170, 230, 300];

export function getMoveLevel(xp: number): number {
  for (let i = MOVE_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= MOVE_LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

export function getMaxMoveLevel(): number {
  return MOVE_LEVEL_THRESHOLDS.length - 1;
}

/**
 * Bonuses per move level:
 * - Accuracy: +1 per level (max +9)
 * - Power: +2 per level (max +18)
 * - Stamina cost: -0.5 per level (max -4.5, rounded)
 */
export function getMoveBonus(xp: number): {
  accuracyBonus: number;
  powerBonus: number;
  staminaReduction: number;
  level: number;
} {
  const level = getMoveLevel(xp);
  return {
    level,
    accuracyBonus: level * 1,
    powerBonus: level * 2,
    staminaReduction: Math.floor(level * 0.5),
  };
}

/**
 * XP gained per use of a move in battle.
 * Successful hits give more than misses.
 */
export function getMoveXpGain(hit: boolean): number {
  return hit ? 3 : 1;
}

/**
 * Get display text for a move's mastery level
 */
export function getMasteryLabel(level: number): string {
  const labels = ['New', 'Familiar', 'Practiced', 'Trained', 'Polished',
                  'Sharp', 'Refined', 'Expert', 'Elite', 'Mastered'];
  return labels[Math.min(level, labels.length - 1)];
}
