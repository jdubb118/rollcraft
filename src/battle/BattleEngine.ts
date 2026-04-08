import type { BattleState, BattleGrappler, Move, Grappler } from '../engine/types';
import { POSITIONS, getPairedPosition, isTopPosition } from '../data/positions';
import { getMove } from '../data/moves';
import { calculateDamage, getEffectivenessText } from './DamageCalc';
import { deductStamina, recoverStamina } from './StaminaSystem';
import { resolveSubmissionPhase } from './SubmissionMinigame';
import { createBattleGrappler } from './stats';

export function createBattleState(playerGrappler: Grappler, opponentGrappler: Grappler): BattleState {
  return {
    turn: 1,
    player: createBattleGrappler(playerGrappler),
    opponent: createBattleGrappler(opponentGrappler),
    playerPosition: 'standing',
    opponentPosition: 'standing',
    phase: 'select-move',
    log: ['The match begins!'],
    winner: null,
    submissionPhase: 0,
    activeSubmission: null,
    submissionAttacker: null,
  };
}

// The "Stall" move — always available, costs 0, recovers stamina
export const STALL_MOVE: Move = {
  id: '__stall__',
  name: 'Stall',
  category: 'escape',
  style: 'controller',
  positionRequired: [], // special — always available
  positionResult: null,
  power: 0,
  accuracy: 100,
  staminaCost: 0,
  statAttack: 'end',
  statDefense: 'end',
  chainPotential: [],
  description: 'Catch your breath. Recover stamina but give up initiative.',
};

// Get legal moves for the player based on current position
export function getPlayerMoves(state: BattleState): Move[] {
  const pos = state.playerPosition;
  const posData = POSITIONS[pos];
  const allMoves = state.player.grappler.moves
    .map(id => getMove(id))
    .filter((m): m is Move => m !== undefined);

  const legalMoves = allMoves.filter(m =>
    m.positionRequired.includes(pos) &&
    posData.availableCategories.includes(m.category)
  );

  // If no moves are affordable, always offer Stall
  const canAffordAny = legalMoves.some(m => state.player.currentStamina >= m.staminaCost);
  if (!canAffordAny || legalMoves.length === 0) {
    return [STALL_MOVE, ...legalMoves];
  }

  return legalMoves;
}

// Check if a move is chained from the previous move
function isChained(lastMoveId: string | null, currentMove: Move): boolean {
  if (!lastMoveId) return false;
  const lastMove = getMove(lastMoveId);
  if (!lastMove) return false;
  return lastMove.chainPotential.includes(currentMove.id);
}

// Execute a move for a fighter
function executeMove(
  state: BattleState,
  attacker: BattleGrappler,
  defender: BattleGrappler,
  move: Move,
  attackerIsPlayer: boolean,
): void {
  const attackerName = attacker.grappler.name;
  const attackerPos = attackerIsPlayer ? state.playerPosition : state.opponentPosition;

  // Handle Stall move — recover stamina, break chain, skip turn
  if (move.id === '__stall__') {
    const recovery = 15 + Math.floor(attacker.stats.end / 10);
    attacker.currentStamina = Math.min(attacker.maxStamina, attacker.currentStamina + recovery);
    if (attacker.currentStamina > attacker.maxStamina * 0.2) {
      attacker.isGassed = false;
    }
    attacker.lastMoveId = null; // break chain
    state.log.push(`${attackerName} stalls and recovers stamina! (+${recovery})`);
    return;
  }

  // Check accuracy (with chain bonus and gassed penalty)
  let accuracy = move.accuracy;
  if (isChained(attacker.lastMoveId, move)) {
    accuracy += 10;
  }
  if (attacker.isGassed) {
    accuracy -= 30;
  }

  // Stamina cost (with chain discount)
  let cost = move.staminaCost;
  if (isChained(attacker.lastMoveId, move)) {
    cost = Math.max(1, cost - 3);
  }

  deductStamina(attacker, cost);
  state.log.push(`${attackerName} attempts ${move.name}!`);

  // Accuracy roll
  const roll = Math.random() * 100;
  if (roll > accuracy) {
    state.log.push(`${move.name} missed!`);
    attacker.lastMoveId = move.id;
    return;
  }

  // Handle submission moves
  if (move.category === 'submission') {
    state.phase = 'submission';
    state.activeSubmission = move;
    state.submissionPhase = 1;
    state.submissionAttacker = attackerIsPlayer ? 'player' : 'opponent';

    // Auto-resolve all 3 phases immediately for MVP
    const chained = isChained(attacker.lastMoveId, move);
    for (let phase = 1; phase <= 3; phase++) {
      const result = resolveSubmissionPhase(attacker, defender, move, phase, attackerPos, chained);
      deductStamina(attacker, result.attackerStaminaCost);
      deductStamina(defender, result.defenderStaminaCost);
      state.log.push(result.message);

      if (result.tapped) {
        defender.currentHp = 0;
        state.winner = attackerIsPlayer ? 'player' : 'opponent';
        state.phase = 'battle-over';
        state.log.push(`${defender.grappler.name} taps out!`);
        attacker.lastMoveId = move.id;
        return;
      }
      if (result.escaped) {
        break;
      }
    }

    // If we get here, submission was escaped
    state.phase = 'select-move';
    state.activeSubmission = null;
    state.submissionPhase = 0;
    state.submissionAttacker = null;

    // Also deal some damage even if escaped
    const damage = Math.floor(calculateDamage(attacker, defender, move, attackerPos) * 0.3);
    if (damage > 0) {
      defender.currentHp = Math.max(0, defender.currentHp - damage);
    }

    attacker.lastMoveId = move.id;
    checkKO(state, defender, attackerIsPlayer);
    return;
  }

  // Calculate and apply damage
  const damage = calculateDamage(attacker, defender, move, attackerPos);
  if (damage > 0) {
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    state.log.push(`${move.name} deals ${damage} damage!`);

    const effText = getEffectivenessText(attacker, defender, move);
    if (effText) state.log.push(effText);
  }

  // Handle position change
  if (move.positionResult) {
    const newAttackerPos = move.positionResult;
    const newDefenderPos = getPairedPosition(newAttackerPos);

    if (attackerIsPlayer) {
      state.playerPosition = newAttackerPos;
      state.opponentPosition = newDefenderPos;
    } else {
      state.opponentPosition = newAttackerPos;
      state.playerPosition = newDefenderPos;
    }

    const posName = POSITIONS[newAttackerPos].name;
    state.log.push(`Position: ${posName}`);
  }

  attacker.lastMoveId = move.id;
  checkKO(state, defender, attackerIsPlayer);
}

function checkKO(state: BattleState, defender: BattleGrappler, attackerIsPlayer: boolean): void {
  if (defender.currentHp <= 0) {
    state.winner = attackerIsPlayer ? 'player' : 'opponent';
    state.phase = 'battle-over';
    state.log.push(`${defender.grappler.name} can't continue! Referee stoppage!`);
  }
}

// Determine who goes first based on speed
function getFirstActor(state: BattleState): 'player' | 'opponent' {
  const playerSpd = state.player.stats.spd;
  const opponentSpd = state.opponent.stats.spd;

  // Position ATB modifiers
  const playerPosData = POSITIONS[state.playerPosition];
  const opponentPosData = POSITIONS[state.opponentPosition];

  const playerIsTop = isTopPosition(state.playerPosition);
  const opponentIsTop = isTopPosition(state.opponentPosition);

  const playerATB = playerSpd * (playerIsTop ? playerPosData.atbModTop : playerPosData.atbModBottom);
  const opponentATB = opponentSpd * (opponentIsTop ? opponentPosData.atbModTop : opponentPosData.atbModBottom);

  if (playerATB === opponentATB) {
    return Math.random() > 0.5 ? 'player' : 'opponent';
  }
  return playerATB >= opponentATB ? 'player' : 'opponent';
}

// Execute a full turn: player move + opponent response
export function executeTurn(state: BattleState, playerMoveId: string): BattleState {
  const newState = { ...state, log: [...state.log] };
  const playerMove = playerMoveId === '__stall__' ? STALL_MOVE : getMove(playerMoveId);
  if (!playerMove) return newState;

  newState.log.push(`--- Turn ${newState.turn} ---`);

  const first = getFirstActor(newState);

  if (first === 'player') {
    // Player goes first
    executeMove(newState, newState.player, newState.opponent, playerMove, true);
    if (newState.phase === 'battle-over') return finishTurn(newState);

    // Opponent responds
    const opponentMove = pickAIMove(newState);
    if (opponentMove) {
      executeMove(newState, newState.opponent, newState.player, opponentMove, false);
    }
  } else {
    // Opponent goes first
    const opponentMove = pickAIMove(newState);
    if (opponentMove) {
      executeMove(newState, newState.opponent, newState.player, opponentMove, false);
      if (newState.phase === 'battle-over') return finishTurn(newState);
    }

    // Player responds
    executeMove(newState, newState.player, newState.opponent, playerMove, true);
  }

  return finishTurn(newState);
}

function finishTurn(state: BattleState): BattleState {
  if (state.phase !== 'battle-over') {
    // Stamina recovery
    const playerIsTop = isTopPosition(state.playerPosition);
    recoverStamina(state.player, state.playerPosition, playerIsTop);
    recoverStamina(state.opponent, state.opponentPosition, !playerIsTop);
    state.turn++;
    state.phase = 'select-move';
  }
  return state;
}

// ═══ Simple AI ═══
function pickAIMove(state: BattleState): Move | null {
  const pos = state.opponentPosition;
  const posData = POSITIONS[pos];
  const allMoves = state.opponent.grappler.moves
    .map(id => getMove(id))
    .filter((m): m is Move => m !== undefined);

  const legalMoves = allMoves.filter(m =>
    m.positionRequired.includes(pos) &&
    posData.availableCategories.includes(m.category)
  );

  if (legalMoves.length === 0) return STALL_MOVE;

  // If can't afford any move, stall
  const affordableMoves = legalMoves.filter(m => state.opponent.currentStamina >= m.staminaCost);
  if (affordableMoves.length === 0) return STALL_MOVE;

  // Score each affordable move
  const scored = affordableMoves.map(move => {
    let score = move.power + move.accuracy * 0.3;

    // Prioritize submissions from dominant positions
    if (move.category === 'submission') {
      if (posData.advantage === 'dominant-top') score += 40;
      else if (posData.advantage === 'top') score += 25;
    }

    // Prioritize escapes when in bad position
    if (move.category === 'escape') {
      if (posData.advantage === 'dominant-top' && !isTopPosition(pos)) score += 50;
      else if (posData.advantage === 'top' && !isTopPosition(pos)) score += 35;
    }

    // Chain bonus
    if (isChained(state.opponent.lastMoveId, move)) score += 20;

    // Penalize high stamina cost when low
    if (state.opponent.currentStamina < state.opponent.maxStamina * 0.3) {
      score -= move.staminaCost * 2;
    }

    // Random noise
    score += (Math.random() - 0.5) * 30;

    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}
