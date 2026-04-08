import type { BattleState, BattleGrappler, Move, Grappler, Belt, Position } from '../engine/types';
import { POSITIONS, getRole, getCategories, getPositionDisplayName } from '../data/positions';
import { getMove } from '../data/moves';
import { calculateDamage, getEffectivenessText } from './DamageCalc';
import { deductStamina, recoverStamina } from './StaminaSystem';
import { resolveSubmissionPhase } from './SubmissionMinigame';
import { createBattleGrappler } from './stats';

// Match time limits by belt (in turns — roughly 1 turn = 30 seconds)
const MATCH_TURNS: Record<Belt, number> = {
  white: 10,   // 5 min
  blue: 12,    // 6 min
  purple: 14,  // 7 min
  brown: 16,   // 8 min
  black: 20,   // 10 min
};

// IBJJF point values
const POINTS = {
  takedown: 2,
  sweep: 2,
  kneeOnBelly: 2,
  guardPass: 3,
  mount: 4,
  backControl: 4,
} as const;

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
  // Use the lower belt's time limit
  const belts: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];
  const playerIdx = belts.indexOf(playerGrappler.belt);
  const opponentIdx = belts.indexOf(opponentGrappler.belt);
  const matchBelt = belts[Math.min(playerIdx, opponentIdx)];

  const state: BattleState = {
    turn: 1,
    maxTurns: MATCH_TURNS[matchBelt],
    player: createBattleGrappler(playerGrappler),
    opponent: createBattleGrappler(opponentGrappler),
    position: 'standing',
    topFighter: null,
    phase: 'select-move',
    log: ['The match begins! OSS!'],
    winner: null,
    winMethod: null,
    submissionPhase: 0,
    activeSubmission: null,
    submissionAttacker: null,
    firstActor: 'player',
    firstActorDone: false,
    // Scoring
    playerPoints: 0,
    opponentPoints: 0,
    playerAdvantages: 0,
    opponentAdvantages: 0,
    ruleSet: 'points',
    lastPositionChange: null,
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

  const playerGasPenalty = state.player.isGassed ? 0.6 : 1.0;
  const opponentGasPenalty = state.opponent.isGassed ? 0.6 : 1.0;

  const playerATB = state.player.stats.spd * playerMod * playerGasPenalty;
  const opponentATB = state.opponent.stats.spd * opponentMod * opponentGasPenalty;

  if (playerATB === opponentATB) return Math.random() > 0.5 ? 'player' : 'opponent';
  return playerATB >= opponentATB ? 'player' : 'opponent';
}

// ── Award points for position changes (IBJJF rules) ──
function awardPositionPoints(
  state: BattleState,
  move: Move,
  attackerIs: 'player' | 'opponent',
  oldPosition: Position,
): void {
  if (!move.resultPosition) return;
  const newPos = move.resultPosition;

  let pts = 0;
  let reason = '';

  // Takedowns (standing → any ground position where attacker is top)
  if (oldPosition === 'standing' || oldPosition === 'clinch') {
    if (move.category === 'takedown' && move.resultRole === 'top') {
      pts = POINTS.takedown;
      reason = 'TAKEDOWN';
    }
  }

  // Sweeps (bottom → top)
  if (move.category === 'sweep') {
    pts = POINTS.sweep;
    reason = 'SWEEP';
  }

  // Guard pass
  if (move.category === 'pass') {
    pts = POINTS.guardPass;
    reason = 'GUARD PASS';
  }

  // Mount achieved
  if (newPos === 'mount' && move.resultRole === 'top') {
    pts = POINTS.mount;
    reason = 'MOUNT';
  }

  // Back control achieved
  if (newPos === 'back-control' && move.resultRole === 'top') {
    pts = POINTS.backControl;
    reason = 'BACK CONTROL';
  }

  // Knee on belly
  if (newPos === 'knee-on-belly' && move.resultRole === 'top') {
    pts = POINTS.kneeOnBelly;
    reason = 'KNEE ON BELLY';
  }

  if (pts > 0) {
    if (attackerIs === 'player') {
      state.playerPoints += pts;
      state.log.push(`⚡ ${reason}! +${pts} points (You: ${state.playerPoints} - Opp: ${state.opponentPoints})`);
    } else {
      state.opponentPoints += pts;
      state.log.push(`⚡ ${reason}! +${pts} points (You: ${state.playerPoints} - Opp: ${state.opponentPoints})`);
    }
  }
}

// ── Award advantage for near-misses ──
function awardAdvantage(state: BattleState, attackerIs: 'player' | 'opponent', reason: string): void {
  if (attackerIs === 'player') {
    state.playerAdvantages++;
    state.log.push(`△ Advantage — ${reason}`);
  } else {
    state.opponentAdvantages++;
    state.log.push(`△ Advantage — ${reason}`);
  }
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
    const posMatch = m.posReq.some(req =>
      req.position === state.position && (req.role === role || req.role === 'neutral' && role === 'neutral')
    );
    if (!posMatch) return false;
    return allowedCategories.includes(m.category);
  });

  // Always include STALL as an option
  const affordable = legal.filter(m => fighter.currentStamina >= m.staminaCost);
  if (affordable.length === 0) return [STALL_MOVE];

  // Add stall to the end so player always has the option
  return [...legal, STALL_MOVE];
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
    state.log.push(`${attackerName}'s ${move.name} is no longer valid — forced to stall!`);
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
    // Near-miss on submission = advantage
    if (move.category === 'submission') {
      awardAdvantage(state, attackerIs, `near-submission (${move.name})`);
    }
    attacker.lastMoveId = move.id;
    return;
  }

  const oldPosition = state.position;

  // Handle submission
  if (move.category === 'submission') {
    const chained = isChained(attacker.lastMoveId, move);
    let deepestPhase = 0;
    for (let phase = 1; phase <= 3; phase++) {
      const result = resolveSubmissionPhase(attacker, defender, move, phase, state.position, chained);
      deductStamina(attacker, result.attackerStaminaCost);
      deductStamina(defender, result.defenderStaminaCost);
      state.log.push(result.message);
      deepestPhase = phase;

      if (result.tapped) {
        state.winner = attackerIs;
        state.winMethod = 'submission';
        state.phase = 'battle-over';
        state.log.push(`${defender.grappler.name} taps out! SUBMISSION!`);
        attacker.lastMoveId = move.id;
        return;
      }
      if (result.escaped) break;
    }
    // Escaped but got deep = advantage
    if (deepestPhase >= 2) {
      awardAdvantage(state, attackerIs, `deep submission attempt (${move.name})`);
    }
    // Escaped — deal some stamina damage to defender (energy spent defending)
    attacker.lastMoveId = move.id;
    return;
  }

  // Calculate damage (stamina drain — not HP knockout)
  const chained2 = isChained(attacker.lastMoveId, move);
  const { damage, isCrit } = calculateDamage(attacker, defender, move, state.position, attackerRole, chained2);
  if (damage > 0) {
    // Damage = stamina drain on defender (pressure, grinding, control)
    const staminaDrain = Math.floor(damage * 0.4);
    deductStamina(defender, staminaDrain);
    // Also reduce HP (representing accumulated damage/exhaustion)
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    const critText = isCrit ? ' CRITICAL!' : '';
    state.log.push(`${move.name} connects!${critText}`);
    const effText = getEffectivenessText(defender, move);
    if (effText) state.log.push(effText);
  }

  // Position change + point scoring
  if (move.resultPosition) {
    state.position = move.resultPosition;
    if (move.resultRole === 'top') {
      state.topFighter = attackerIs;
    } else if (move.resultRole === 'bottom') {
      state.topFighter = attackerIs === 'player' ? 'opponent' : 'player';
    } else if (move.resultRole === 'neutral') {
      state.topFighter = null;
    }

    const newRole = getRole(state.position, state.topFighter, attackerIs);
    state.log.push(`Position: ${getPositionDisplayName(state.position, newRole)}`);

    // Award points for the position change
    awardPositionPoints(state, move, attackerIs, oldPosition);
  }

  attacker.lastMoveId = move.id;

  // Check referee stoppage (HP = 0 means fighter is completely exhausted)
  if (defender.currentHp <= 0) {
    state.winner = attackerIs;
    state.winMethod = 'submission'; // ref stoppage counts as sub
    state.phase = 'battle-over';
    state.log.push(`${defender.grappler.name} can't continue! Referee stoppage!`);
  }
}

// ── AI move selection ──
function pickAIMove(state: BattleState): Move {
  const legal = getLegalMoves(state, 'opponent');
  // Filter out stall from AI options unless it's the only choice
  const nonStall = legal.filter(m => m.id !== '__stall__');
  const candidates = nonStall.length > 0 ? nonStall : legal;

  const affordable = candidates.filter(m => state.opponent.currentStamina >= m.staminaCost);
  if (affordable.length === 0) return STALL_MOVE;

  const posData = POSITIONS[state.position];
  const role = getRole(state.position, state.topFighter, 'opponent');

  // Factor in score — if ahead on points near end, play conservative
  const turnsLeft = state.maxTurns - state.turn;
  const scoreDiff = state.opponentPoints - state.playerPoints;
  const isAhead = scoreDiff > 0;

  const scored = affordable.map(move => {
    let score = move.power + move.accuracy * 0.3;

    if (move.category === 'submission') {
      if (role === 'top' && (posData.advantage === 'dominant-top' || posData.advantage === 'top')) score += 40;
      else score += 15;
      // If ahead on points near end, less aggressive with risky subs
      if (isAhead && turnsLeft <= 4) score -= 20;
    }
    if (move.category === 'escape' && role === 'bottom') {
      if (posData.advantage === 'dominant-top') score += 50;
      else if (posData.advantage === 'top') score += 35;
    }
    // If behind, prioritize scoring moves
    if (!isAhead && turnsLeft <= 4) {
      if (move.category === 'takedown' || move.category === 'sweep' || move.category === 'pass') score += 25;
    }
    if (isChained(state.opponent.lastMoveId, move)) score += 20;
    if (state.opponent.currentStamina < state.opponent.maxStamina * 0.3) score -= move.staminaCost * 2;
    score += (Math.random() - 0.5) * 30;
    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}

// ── Resolve match at time expiry ──
function resolveByPoints(state: BattleState): void {
  state.phase = 'battle-over';
  state.log.push(`⏱ TIME! Match over.`);
  state.log.push(`Score: You ${state.playerPoints} - ${state.opponentPoints} Opponent`);
  state.log.push(`Advantages: You ${state.playerAdvantages} - ${state.opponentAdvantages} Opponent`);

  if (state.playerPoints > state.opponentPoints) {
    state.winner = 'player';
    state.winMethod = 'points';
    state.log.push(`You win on POINTS!`);
  } else if (state.opponentPoints > state.playerPoints) {
    state.winner = 'opponent';
    state.winMethod = 'points';
    state.log.push(`${state.opponent.grappler.name} wins on POINTS!`);
  } else if (state.playerAdvantages > state.opponentAdvantages) {
    state.winner = 'player';
    state.winMethod = 'advantages';
    state.log.push(`You win on ADVANTAGES!`);
  } else if (state.opponentAdvantages > state.playerAdvantages) {
    state.winner = 'opponent';
    state.winMethod = 'advantages';
    state.log.push(`${state.opponent.grappler.name} wins on ADVANTAGES!`);
  } else {
    // True draw
    state.winner = null;
    state.winMethod = 'draw';
    state.log.push(`DRAW! No winner.`);
  }
}

// ── Main turn execution — SEQUENTIAL, not simultaneous ──
export function executeTurn(state: BattleState, playerMoveId: string): BattleState {
  const s = { ...state, log: [...state.log] };
  const playerMove = playerMoveId === '__stall__' ? STALL_MOVE : getMove(playerMoveId);
  if (!playerMove) return s;

  const turnsRemaining = s.maxTurns - s.turn + 1;
  s.log.push(`--- Turn ${s.turn} (${turnsRemaining} remaining) ---`);
  s.firstActor = computeFirstActor(s);

  if (s.firstActor === 'opponent') {
    s.log.push(`${s.opponent.grappler.name} has initiative!`);
  }

  if (s.firstActor === 'player') {
    executeMove(s, s.player, s.opponent, playerMove, 'player');
    if (s.phase === 'battle-over') return finishTurn(s);

    const aiMove = pickAIMove(s);
    executeMove(s, s.opponent, s.player, aiMove, 'opponent');
  } else {
    const aiMove = pickAIMove(s);
    executeMove(s, s.opponent, s.player, aiMove, 'opponent');
    if (s.phase === 'battle-over') return finishTurn(s);

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

    // Check if match time is up
    if (state.turn > state.maxTurns) {
      resolveByPoints(state);
      return state;
    }

    state.phase = 'select-move';
    state.firstActor = computeFirstActor(state);
  }
  return state;
}
