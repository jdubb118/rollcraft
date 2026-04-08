import type { BattleState, BattleGrappler, Move, Grappler } from '../engine/types';
import { POSITIONS, getRole, getCategories, getPositionDisplayName } from '../data/positions';
import { getMove } from '../data/moves';
import { calculateDamage, getEffectivenessText } from './DamageCalc';
import { deductStamina, recoverStamina } from './StaminaSystem';
import { resolveSubmissionPhase } from './SubmissionMinigame';
import { createBattleGrappler } from './stats';

// The "Stall" move — always available, costs 0, recovers stamina
export const STALL_MOVE: Move = {
  id: '__stall__', name: 'Stall', category: 'escape', style: 'controller',
  posReq: [], // special — always available
  resultPosition: null, resultRole: null,
  power: 0, accuracy: 100, staminaCost: 0,
  statAttack: 'end', statDefense: 'end',
  chainPotential: [], description: 'Catch your breath. Recover stamina.',
};

export function createBattleState(playerGrappler: Grappler, opponentGrappler: Grappler): BattleState {
  const state: BattleState = {
    turn: 1,
    player: createBattleGrappler(playerGrappler),
    opponent: createBattleGrappler(opponentGrappler),
    position: 'standing',
    topFighter: null, // standing is symmetric
    phase: 'select-move',
    log: ['The match begins!'],
    winner: null,
    submissionPhase: 0,
    activeSubmission: null,
    submissionAttacker: null,
    firstActor: 'player',
    firstActorDone: false,
  };
  state.firstActor = computeFirstActor(state);
  return state;
}

// ── Determine who acts first based on speed + position ──
function computeFirstActor(state: BattleState): 'player' | 'opponent' {
  const posData = POSITIONS[state.position];
  const playerRole = getRole(state.position, state.topFighter, 'player');
  const opponentRole = getRole(state.position, state.topFighter, 'opponent');

  const playerMod = playerRole === 'top' ? posData.atbModTop
    : playerRole === 'bottom' ? posData.atbModBottom : 1.0;
  const opponentMod = opponentRole === 'top' ? posData.atbModTop
    : opponentRole === 'bottom' ? posData.atbModBottom : 1.0;

  const playerATB = state.player.stats.spd * playerMod;
  const opponentATB = state.opponent.stats.spd * opponentMod;

  if (playerATB === opponentATB) return Math.random() > 0.5 ? 'player' : 'opponent';
  return playerATB >= opponentATB ? 'player' : 'opponent';
}

// ── Get legal moves for a fighter ──
export function getLegalMoves(state: BattleState, who: 'player' | 'opponent'): Move[] {
  const fighter = who === 'player' ? state.player : state.opponent;
  const role = getRole(state.position, state.topFighter, who);
  const allowedCategories = getCategories(state.position, role);

  const allMoves = fighter.grappler.moves
    .map(id => getMove(id))
    .filter((m): m is Move => m !== undefined);

  const legal = allMoves.filter(m => {
    // Check if this move works from current position + role
    const posMatch = m.posReq.some(req =>
      req.position === state.position && (req.role === role || req.role === 'neutral' && role === 'neutral')
    );
    if (!posMatch) return false;

    // Check category is allowed in this role
    return allowedCategories.includes(m.category);
  });

  // White belt reality: no moves for this position = stall only
  if (legal.length === 0) return [STALL_MOVE];

  const affordable = legal.filter(m => fighter.currentStamina >= m.staminaCost);
  if (affordable.length === 0) return [STALL_MOVE, ...legal];

  return legal;
}

// Convenience for BattleScreen
export function getPlayerMoves(state: BattleState): Move[] {
  return getLegalMoves(state, 'player');
}

// ── Check if a move is chained from previous ──
function isChained(lastMoveId: string | null, currentMove: Move): boolean {
  if (!lastMoveId) return false;
  const lastMove = getMove(lastMoveId);
  if (!lastMove) return false;
  return lastMove.chainPotential.includes(currentMove.id);
}

// ── Execute a single move ──
function executeMove(
  state: BattleState,
  attacker: BattleGrappler,
  defender: BattleGrappler,
  move: Move,
  attackerIs: 'player' | 'opponent',
): void {
  const attackerName = attacker.grappler.name;
  const attackerRole = getRole(state.position, state.topFighter, attackerIs);

  // Handle Stall move
  if (move.id === '__stall__') {
    const recovery = 15 + Math.floor(attacker.stats.end / 10);
    attacker.currentStamina = Math.min(attacker.maxStamina, attacker.currentStamina + recovery);
    if (attacker.currentStamina > attacker.maxStamina * 0.2) attacker.isGassed = false;
    attacker.lastMoveId = null;
    state.log.push(`${attackerName} stalls and recovers stamina (+${recovery})`);
    return;
  }

  // Validate move is still legal (position may have changed if opponent went first)
  const posMatch = move.posReq.some(req =>
    req.position === state.position && (req.role === attackerRole || req.role === 'neutral' && attackerRole === 'neutral')
  );
  if (!posMatch) {
    state.log.push(`${attackerName}'s ${move.name} is no longer valid!`);
    // Auto-stall instead
    const recovery = 10 + Math.floor(attacker.stats.end / 15);
    attacker.currentStamina = Math.min(attacker.maxStamina, attacker.currentStamina + recovery);
    attacker.lastMoveId = null;
    return;
  }

  // Stamina cost (with chain discount)
  let cost = move.staminaCost;
  if (isChained(attacker.lastMoveId, move)) cost = Math.max(1, cost - 3);
  deductStamina(attacker, cost);

  state.log.push(`${attackerName} attempts ${move.name}!`);

  // Accuracy check
  let accuracy = move.accuracy;
  if (isChained(attacker.lastMoveId, move)) accuracy += 10;
  if (attacker.isGassed) accuracy -= 30;

  if (Math.random() * 100 > accuracy) {
    state.log.push(`${move.name} missed!`);
    attacker.lastMoveId = move.id;
    return;
  }

  // Handle submission
  if (move.category === 'submission') {
    const chained = isChained(attacker.lastMoveId, move);
    for (let phase = 1; phase <= 3; phase++) {
      const result = resolveSubmissionPhase(attacker, defender, move, phase, state.position, chained);
      deductStamina(attacker, result.attackerStaminaCost);
      deductStamina(defender, result.defenderStaminaCost);
      state.log.push(result.message);

      if (result.tapped) {
        defender.currentHp = 0;
        state.winner = attackerIs;
        state.phase = 'battle-over';
        state.log.push(`${defender.grappler.name} taps out!`);
        attacker.lastMoveId = move.id;
        return;
      }
      if (result.escaped) break;
    }
    // Escaped — deal partial damage
    const damage = Math.floor(calculateDamage(attacker, defender, move, state.position, attackerRole) * 0.3);
    if (damage > 0) defender.currentHp = Math.max(0, defender.currentHp - damage);
    attacker.lastMoveId = move.id;
    checkKO(state, defender, attackerIs);
    return;
  }

  // Calculate damage
  const damage = calculateDamage(attacker, defender, move, state.position, attackerRole);
  if (damage > 0) {
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    state.log.push(`${move.name} deals ${damage} damage!`);
    const effText = getEffectivenessText(defender, move);
    if (effText) state.log.push(effText);
  }

  // Position change
  if (move.resultPosition) {
    state.position = move.resultPosition;
    if (move.resultRole === 'top') {
      state.topFighter = attackerIs;
    } else if (move.resultRole === 'bottom') {
      state.topFighter = attackerIs === 'player' ? 'opponent' : 'player';
    } else if (move.resultRole === 'neutral') {
      state.topFighter = null;
    }
    // resultRole null = no change to topFighter

    const newRole = getRole(state.position, state.topFighter, attackerIs);
    state.log.push(`Position: ${getPositionDisplayName(state.position, newRole)}`);
  }

  attacker.lastMoveId = move.id;
  checkKO(state, defender, attackerIs);
}

function checkKO(state: BattleState, defender: BattleGrappler, attackerIs: 'player' | 'opponent'): void {
  if (defender.currentHp <= 0) {
    state.winner = attackerIs;
    state.phase = 'battle-over';
    state.log.push(`${defender.grappler.name} can't continue! Referee stoppage!`);
  }
}

// ── AI move selection ──
function pickAIMove(state: BattleState): Move {
  const legal = getLegalMoves(state, 'opponent');
  if (legal.length === 1) return legal[0]; // only stall

  const affordable = legal.filter(m => state.opponent.currentStamina >= m.staminaCost);
  if (affordable.length === 0) return STALL_MOVE;

  const posData = POSITIONS[state.position];
  const role = getRole(state.position, state.topFighter, 'opponent');

  const scored = affordable.map(move => {
    let score = move.power + move.accuracy * 0.3;

    if (move.category === 'submission') {
      if (role === 'top' && (posData.advantage === 'dominant-top' || posData.advantage === 'top')) score += 40;
      else score += 15;
    }
    if (move.category === 'escape' && role === 'bottom') {
      if (posData.advantage === 'dominant-top') score += 50;
      else if (posData.advantage === 'top') score += 35;
    }
    if (isChained(state.opponent.lastMoveId, move)) score += 20;
    if (state.opponent.currentStamina < state.opponent.maxStamina * 0.3) score -= move.staminaCost * 2;
    score += (Math.random() - 0.5) * 30;
    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}

// ── Main turn execution — SEQUENTIAL, not simultaneous ──
// First actor resolves fully, THEN second actor picks from new reality
export function executeTurn(state: BattleState, playerMoveId: string): BattleState {
  const s = { ...state, log: [...state.log] };
  const playerMove = playerMoveId === '__stall__' ? STALL_MOVE : getMove(playerMoveId);
  if (!playerMove) return s;

  s.log.push(`--- Turn ${s.turn} ---`);
  s.firstActor = computeFirstActor(s);

  if (s.firstActor === 'player') {
    // Player acts first from current position
    executeMove(s, s.player, s.opponent, playerMove, 'player');
    if (s.phase === 'battle-over') return finishTurn(s);

    // Opponent reacts to NEW position
    const aiMove = pickAIMove(s);
    executeMove(s, s.opponent, s.player, aiMove, 'opponent');
  } else {
    // Opponent acts first — AI picks from current position
    const aiMove = pickAIMove(s);
    executeMove(s, s.opponent, s.player, aiMove, 'opponent');
    if (s.phase === 'battle-over') return finishTurn(s);

    // Player reacts — BUT player already committed a move!
    // Validate it's still legal, otherwise auto-stall
    executeMove(s, s.player, s.opponent, playerMove, 'player');
  }

  return finishTurn(s);
}

function finishTurn(state: BattleState): BattleState {
  if (state.phase !== 'battle-over') {
    const playerRole = getRole(state.position, state.topFighter, 'player');
    const opponentRole = getRole(state.position, state.topFighter, 'opponent');
    recoverStamina(state.player, state.position, playerRole === 'top');
    recoverStamina(state.opponent, state.position, opponentRole === 'top');
    state.turn++;
    state.phase = 'select-move';
    state.firstActor = computeFirstActor(state);
  }
  return state;
}
