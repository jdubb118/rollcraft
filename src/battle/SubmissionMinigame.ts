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

export function resolveSubmissionPhase(
  attacker: BattleGrappler,
  defender: BattleGrappler,
  move: Move,
  phase: number,
  attackerPosition: Position,
  isChained: boolean,
): SubmissionResult {
  // Attacker roll: TEC*0.6 + STR*0.4 + random(0,20)
  let attackRoll = Math.floor(attacker.stats.tec * 0.6 + attacker.stats.str * 0.4) + randInt(0, 20);

  // Defender roll: FLX*0.5 + TGH*0.3 + END*0.2 + random(0,20)
  const defendRoll = Math.floor(defender.stats.flx * 0.5 + defender.stats.tgh * 0.3 + defender.stats.end * 0.2) + randInt(0, 20);

  // Position bonus for attacker
  const posData = POSITIONS[attackerPosition];
  if (posData.advantage === 'dominant-top') attackRoll += 15;
  else if (posData.advantage === 'top') attackRoll += 10;

  // Chain bonus (phase 1 only)
  if (isChained && phase === 1) {
    attackRoll += 10;
  }

  const threshold = attackRoll - defendRoll;

  const attackerStaminaCost = 8;
  const defenderStaminaCost = 12;

  if (threshold > 30) {
    return {
      escaped: false, tapped: true, advancePhase: false,
      attackerStaminaCost, defenderStaminaCost,
      message: `${move.name} locked in tight! TAP!`,
    };
  } else if (threshold >= 16) {
    if (phase >= 3) {
      return {
        escaped: false, tapped: true, advancePhase: false,
        attackerStaminaCost, defenderStaminaCost,
        message: `${move.name} fully locked! TAP!`,
      };
    }
    return {
      escaped: false, tapped: false, advancePhase: true,
      attackerStaminaCost, defenderStaminaCost,
      message: `${move.name} tightening... Phase ${phase + 1}!`,
    };
  } else if (threshold >= 0) {
    if (phase >= 3) {
      return {
        escaped: true, tapped: false, advancePhase: false,
        attackerStaminaCost, defenderStaminaCost,
        message: `Barely escaped the ${move.name}!`,
      };
    }
    return {
      escaped: false, tapped: false, advancePhase: true,
      attackerStaminaCost, defenderStaminaCost,
      message: `Fighting the ${move.name}... Phase ${phase + 1}!`,
    };
  } else {
    return {
      escaped: true, tapped: false, advancePhase: false,
      attackerStaminaCost, defenderStaminaCost,
      message: `Escaped the ${move.name}!`,
    };
  }
}
