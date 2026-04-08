import type { BattleGrappler, Move, Position } from '../engine/types';
import { POSITIONS } from '../data/positions';
import { randInt } from '../engine/random';

export interface SubmissionResult {
  escaped: boolean;
  tapped: boolean;
  advancePhase: boolean;
  attackerStaminaCost: number;
  defenderStaminaCost: number;
  message: string;
}

function tensionBar(threshold: number): string {
  // threshold: negative = defender winning, positive = attacker winning
  // Map -30..+40 to 0..10 blocks
  const fill = Math.max(0, Math.min(10, Math.floor((threshold + 10) / 5)));
  const filled = '█'.repeat(fill);
  const empty = '░'.repeat(10 - fill);
  return `[${filled}${empty}]`;
}

function tensionLabel(threshold: number): string {
  if (threshold > 30) return 'LOCKED IN!';
  if (threshold > 20) return 'VERY TIGHT!';
  if (threshold > 10) return 'TIGHT';
  if (threshold > 0) return 'FIGHTING...';
  if (threshold > -10) return 'SLIPPING...';
  return 'DEFENDED';
}

export function resolveSubmissionPhase(
  attacker: BattleGrappler,
  defender: BattleGrappler,
  move: Move,
  phase: number,
  position: Position,
  isChained: boolean,
): SubmissionResult {
  let attackRoll = Math.floor(attacker.stats.tec * 0.6 + attacker.stats.str * 0.4) + randInt(0, 20);
  const defendRoll = Math.floor(defender.stats.flx * 0.5 + defender.stats.tgh * 0.3 + defender.stats.end * 0.2) + randInt(0, 20);

  // Position bonus — works for BOTH top and bottom submissions
  // Dominant top (mount/back) = big bonus for top attacker
  // Bottom advantage (closed guard) = bonus for bottom attacker (armbars, triangles)
  const posData = POSITIONS[position];
  let posBonus = 0;
  if (posData.advantage === 'dominant-top') posBonus = 15;
  else if (posData.advantage === 'top') posBonus = 10;
  else if (posData.advantage === 'slight-top') posBonus = 5;
  else if (posData.advantage === 'slight-bottom') posBonus = 8; // closed guard = strong sub position
  else if (posData.advantage === 'neutral') posBonus = 3; // leg entanglement, clinch
  attackRoll += posBonus;

  // Chain bonus (phase 1 only)
  const chainBonus = (isChained && phase === 1) ? 10 : 0;
  attackRoll += chainBonus;

  // Gassed defender penalty
  const gassedNote = defender.isGassed ? ' (opponent gassed!)' : '';

  const threshold = attackRoll - defendRoll;
  const attackerStaminaCost = 8;
  const defenderStaminaCost = 12;

  // Build the visual feedback
  const bar = tensionBar(threshold);
  const label = tensionLabel(threshold);
  const statsLine = `Your TEC+STR vs their FLX+TGH+END`;
  const bonusLine = (posBonus > 0 || chainBonus > 0)
    ? ` (${posBonus > 0 ? `position +${posBonus}` : ''}${posBonus > 0 && chainBonus > 0 ? ', ' : ''}${chainBonus > 0 ? `chain +${chainBonus}` : ''})`
    : '';

  const phaseHeader = `Phase ${phase}/3 — ${statsLine}${bonusLine}${gassedNote}`;

  if (threshold > 30) {
    return {
      escaped: false, tapped: true, advancePhase: false,
      attackerStaminaCost, defenderStaminaCost,
      message: `${phaseHeader}\n${bar} ${label}\n${move.name} locked in tight! TAP!`,
    };
  } else if (threshold >= 16) {
    if (phase >= 3) {
      return {
        escaped: false, tapped: true, advancePhase: false,
        attackerStaminaCost, defenderStaminaCost,
        message: `${phaseHeader}\n${bar} ${label}\n${move.name} fully locked! TAP!`,
      };
    }
    return {
      escaped: false, tapped: false, advancePhase: true,
      attackerStaminaCost, defenderStaminaCost,
      message: `${phaseHeader}\n${bar} ${label}\n${move.name} tightening...`,
    };
  } else if (threshold >= 0) {
    if (phase >= 3) {
      return {
        escaped: true, tapped: false, advancePhase: false,
        attackerStaminaCost, defenderStaminaCost,
        message: `${phaseHeader}\n${bar} ${label}\nALMOST HAD IT! Barely escaped the ${move.name}!`,
      };
    }
    return {
      escaped: false, tapped: false, advancePhase: true,
      attackerStaminaCost, defenderStaminaCost,
      message: `${phaseHeader}\n${bar} ${label}\nFighting the ${move.name}...`,
    };
  } else {
    const almostNote = threshold > -5 ? ' CLOSE — try again while they\'re tired!' : '';
    return {
      escaped: true, tapped: false, advancePhase: false,
      attackerStaminaCost, defenderStaminaCost,
      message: `${phaseHeader}\n${bar} ${label}\nEscaped the ${move.name}!${almostNote}`,
    };
  }
}
