import type { BattleState, BattleGrappler, Move, Grappler, Belt, Position } from '../engine/types';
import { POSITIONS, getRole, getCategories, getPositionDisplayName } from '../data/positions';
import { getMove } from '../data/moves';
import { calculateDamage, getEffectivenessText } from './DamageCalc';
import { deductStamina, recoverStamina, getFatiguePhase, getFatigueModifiers } from './StaminaSystem';
import { resolveSubmissionPhase } from './SubmissionMinigame';
import { createBattleGrappler } from './stats';
import { randInt } from '../engine/random';
import { getMoveBonus } from './moveXp';

// Match time limits by belt (in turns — roughly 1 turn = 30 seconds)
const MATCH_TURNS: Record<Belt, number> = {
  white: 12, blue: 14, purple: 16, brown: 18, black: 22,
};

// IBJJF point values
const POINTS = {
  takedown: 2, sweep: 2, kneeOnBelly: 2, guardPass: 3, mount: 4, backControl: 4,
} as const;

// The "Stall" move — always available, costs 0, recovers stamina
export const STALL_MOVE: Move = {
  id: '__stall__', name: 'Stall', category: 'escape', style: 'controller',
  posReq: [], resultPosition: null, resultRole: null,
  power: 0, accuracy: 100, staminaCost: 0,
  statAttack: 'end', statDefense: 'end',
  chainPotential: [], description: 'Catch your breath. Recover stamina.',
};

// SPAZ — universal escape, works from ANY position. Low accuracy, high
// stamina cost, but always available. Every white belt knows how to spaz.
export const SPAZ_MOVE: Move = {
  id: '__spaz__', name: 'Spaz Out', category: 'escape', style: 'wrestler',
  posReq: [], resultPosition: null, resultRole: null, // resolved dynamically
  power: 15, accuracy: 55, staminaCost: 14,
  statAttack: 'spd', statDefense: 'tec',
  chainPotential: [], description: 'Explosive scramble. No technique, pure survival.',
};

export function createBattleState(playerGrappler: Grappler, opponentGrappler: Grappler): BattleState {
  const belts: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];
  const matchBelt = belts[Math.min(belts.indexOf(playerGrappler.belt), belts.indexOf(opponentGrappler.belt))];

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
    playerPoints: 0, opponentPoints: 0,
    playerAdvantages: 0, opponentAdvantages: 0,
    ruleSet: 'points',
    lastPositionChange: null,
    moveUsage: {},
  };
  state.firstActor = computeFirstActor(state);
  return state;
}

// ── Determine who acts first ──
function computeFirstActor(state: BattleState): 'player' | 'opponent' {
  const posData = POSITIONS[state.position];
  const playerRole = getRole(state.position, state.topFighter, 'player');
  const opponentRole = getRole(state.position, state.topFighter, 'opponent');

  const playerMod = playerRole === 'top' ? posData.atbModTop : playerRole === 'bottom' ? posData.atbModBottom : 1.0;
  const opponentMod = opponentRole === 'top' ? posData.atbModTop : opponentRole === 'bottom' ? posData.atbModBottom : 1.0;

  const playerATB = state.player.stats.spd * playerMod * (state.player.isGassed ? 0.6 : 1.0);
  const opponentATB = state.opponent.stats.spd * opponentMod * (state.opponent.isGassed ? 0.6 : 1.0);

  if (playerATB === opponentATB) return Math.random() > 0.5 ? 'player' : 'opponent';
  return playerATB >= opponentATB ? 'player' : 'opponent';
}

// ── Award IBJJF points — only the HIGHEST scoring event per move ──
// In IBJJF, positions require 3-second stabilization. We approximate by
// awarding only the most valuable achievement per move (not stacking).
function awardPositionPoints(state: BattleState, move: Move, attackerIs: 'player' | 'opponent', oldPosition: Position): void {
  if (!move.resultPosition) return;
  const newPos = move.resultPosition;
  let pts = 0, reason = '';

  // Check events from highest value to lowest — only one fires
  if (newPos === 'mount' && move.resultRole === 'top') {
    pts = POINTS.mount; reason = 'MOUNT';
  } else if (newPos === 'back-control' && move.resultRole === 'top') {
    pts = POINTS.backControl; reason = 'BACK CONTROL';
  } else if (move.category === 'pass' && newPos !== 'open-guard' && newPos !== 'half-guard') {
    // Only score pass when landing in a dominant position (not open/half guard)
    pts = POINTS.guardPass; reason = 'GUARD PASS';
  } else if (newPos === 'knee-on-belly' && move.resultRole === 'top') {
    pts = POINTS.kneeOnBelly; reason = 'KNEE ON BELLY';
  } else if ((oldPosition === 'standing' || oldPosition === 'clinch') && move.category === 'takedown' && move.resultRole === 'top') {
    pts = POINTS.takedown; reason = 'TAKEDOWN';
  } else if (move.category === 'sweep') {
    pts = POINTS.sweep; reason = 'SWEEP';
  }

  if (pts > 0) {
    if (attackerIs === 'player') state.playerPoints += pts;
    else state.opponentPoints += pts;
    state.log.push(`⚡ ${reason}! +${pts} points (You: ${state.playerPoints} - Opp: ${state.opponentPoints})`);
  }
}

function awardAdvantage(state: BattleState, attackerIs: 'player' | 'opponent', reason: string): void {
  if (attackerIs === 'player') state.playerAdvantages++;
  else state.opponentAdvantages++;
  state.log.push(`△ Advantage — ${reason}`);
}

// ── Guard retention roll (defender tries to retain guard vs pass) ──
function rollGuardRetention(
  attacker: BattleGrappler, defender: BattleGrappler, move: Move,
): 'clean-pass' | 'partial-pass' | 'stuffed' {
  const retention = Math.floor(defender.stats.flx * 0.5 + defender.stats.tec * 0.3 + defender.stats.spd * 0.2) + randInt(0, 15);
  const passForce = Math.floor(move.power * 0.6 + attacker.stats.str * 0.3) + randInt(0, 15);
  const diff = passForce - retention;
  if (diff < 0) return 'stuffed';
  if (diff < 15) return 'partial-pass';
  return 'clean-pass';
}

// ── Get legal moves ──
export function getLegalMoves(state: BattleState, who: 'player' | 'opponent'): Move[] {
  const fighter = who === 'player' ? state.player : state.opponent;
  const role = getRole(state.position, state.topFighter, who);
  const allowedCategories = getCategories(state.position, role);

  const allMoves = fighter.grappler.moves
    .map(id => getMove(id))
    .filter((m): m is Move => m !== undefined);

  const legal = allMoves.filter(m => {
    const posMatch = m.posReq.some(req =>
      req.position === state.position && (req.role === role || (req.role === 'neutral' && role === 'neutral'))
    );
    if (!posMatch) return false;
    return allowedCategories.includes(m.category);
  });

  const affordable = legal.filter(m => fighter.currentStamina >= m.staminaCost);
  if (affordable.length === 0) return [SPAZ_MOVE, STALL_MOVE];

  // If the only real moves available are few, always offer SPAZ as a scramble option
  if (legal.length <= 1) return [...legal, SPAZ_MOVE, STALL_MOVE];
  return [...legal, STALL_MOVE];
}

export function getPlayerMoves(state: BattleState): Move[] {
  return getLegalMoves(state, 'player');
}

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
  _depth: number = 0,
): void {
  const attackerName = attacker.grappler.name;
  const defenderName = defender.grappler.name;
  const attackerRole = getRole(state.position, state.topFighter, attackerIs);

  // ── FLINCH CHECK (from previous turn's impact) ──
  if (attacker.flinched) {
    attacker.flinched = false;
    attacker.momentum = 0;
    state.log.push(`${attackerName} is stunned from the impact! Forced to recover.`);
    const recovery = 8 + Math.floor(attacker.stats.end / 15);
    attacker.currentStamina = Math.min(attacker.maxStamina, attacker.currentStamina + recovery);
    attacker.lastMoveId = null;
    return;
  }

  // ── SPAZ (universal scramble) ──
  if (move.id === '__spaz__') {
    const cost = Math.ceil(14 * getFatigueModifiers(getFatiguePhase(state.turn, attacker.stats.end)).costMod);
    deductStamina(attacker, cost);
    state.log.push(`${attackerName} SPAZZES OUT! Explosive scramble!`);

    // Accuracy check — SPD vs TEC. Higher in leg entanglement (survival instinct)
    const baseAcc = state.position === 'leg-entanglement' ? 70 : 55;
    const acc = baseAcc + (attacker.isGassed ? -20 : 0);
    if (Math.random() * 100 > acc) {
      state.log.push(`Wild scramble goes nowhere!`);
      if (attacker.momentum > 0) { attacker.momentum = 0; }
      attacker.lastMoveId = null;
      return;
    }

    // Success — scramble to a better position
    const attackerRole = getRole(state.position, state.topFighter, attackerIs);
    if (attackerRole === 'bottom') {
      // Bottom: scramble to guard or standing
      const outcomes = ['closed-guard', 'open-guard', 'half-guard', 'standing'] as const;
      const newPos = outcomes[Math.floor(Math.random() * outcomes.length)];
      state.position = newPos;
      if (newPos === 'standing') {
        state.topFighter = null;
        state.log.push(`Scrambled back to feet!`);
      } else {
        state.topFighter = attackerIs === 'player' ? 'opponent' : 'player';
        state.log.push(`Scrambled to ${getPositionDisplayName(newPos, 'bottom')}!`);
      }
    } else if (attackerRole === 'top') {
      // Top: scramble to advance or return to standing
      state.position = 'standing';
      state.topFighter = null;
      state.log.push(`Scrambled back to feet!`);
    } else {
      // Neutral: scramble stays neutral but resets position
      state.position = 'standing';
      state.topFighter = null;
      state.log.push(`Reset to standing!`);
    }
    attacker.lastMoveId = null;
    return;
  }

  // ── STALL ──
  if (move.id === '__stall__') {
    // Consecutive stall penalty — ref awards advantage to opponent
    if (attacker.lastMoveId === null) {
      const opponentIs = attackerIs === 'player' ? 'opponent' : 'player';
      awardAdvantage(state, opponentIs, `stalling penalty (${attackerName})`);
      state.log.push(`⚠ Ref warning: ${attackerName} penalized for stalling!`);
    }
    const recovery = 15 + Math.floor(attacker.stats.end / 10);
    attacker.currentStamina = Math.min(attacker.maxStamina, attacker.currentStamina + recovery);
    if (attacker.currentStamina > attacker.maxStamina * 0.2) attacker.isGassed = false;
    attacker.lastMoveId = null;
    state.log.push(`${attackerName} stalls and recovers stamina (+${recovery})`);
    if (attacker.momentum > 0) {
      attacker.momentum = 0;
    }
    return;
  }

  // ── POSITION VALIDATION ──
  const posMatch = move.posReq.some(req =>
    req.position === state.position && (req.role === attackerRole || (req.role === 'neutral' && attackerRole === 'neutral'))
  );
  if (!posMatch) {
    // Position changed — try to auto-pick a legal move instead of just stalling
    const legalMoves = getLegalMoves(state, attackerIs).filter(m => m.id !== '__stall__');
    if (legalMoves.length > 0 && _depth < 2) {
      const best = legalMoves.sort((a, b) => {
        if (attackerRole === 'bottom') {
          if (a.category === 'escape' && b.category !== 'escape') return -1;
          if (b.category === 'escape' && a.category !== 'escape') return 1;
        }
        return b.power - a.power;
      })[0];
      state.log.push(`${attackerName}'s ${move.name} is no longer valid — adapts with ${best.name}!`);
      executeMove(state, attacker, defender, best, attackerIs, _depth + 1);
      return;
    }
    // No legal moves — stall
    state.log.push(`${attackerName}'s ${move.name} is no longer valid — forced to stall!`);
    attacker.currentStamina = Math.min(attacker.maxStamina, attacker.currentStamina + 10);
    attacker.lastMoveId = null;
    if (attacker.momentum > 0) { attacker.momentum = 0; state.log.push(`Momentum reset!`); }
    return;
  }

  // ── MOVE MASTERY (XP-based bonuses) ──
  const moveXpAmount = attacker.grappler.moveXp?.[move.id] || 0;
  const mastery = getMoveBonus(moveXpAmount);

  // ── FATIGUE-ADJUSTED STAMINA COST ──
  const fatigue = getFatiguePhase(state.turn, attacker.stats.end);
  const fatigueMods = getFatigueModifiers(fatigue);
  let cost = Math.max(1, move.staminaCost - mastery.staminaReduction);
  if (isChained(attacker.lastMoveId, move)) cost = Math.max(1, cost - 3);
  cost = Math.ceil(cost * fatigueMods.costMod);
  deductStamina(attacker, cost);

  state.log.push(`${attackerName} attempts ${move.name}!`);

  // ── SETUP MOVE (grips/control) ──
  if (move.category === 'setup' && move.setupBonus) {
    attacker.setupBonus = {
      turnsRemaining: move.setupBonus.duration,
      accuracyMod: move.setupBonus.accuracyMod,
      damageMod: move.setupBonus.damageMod,
      critMod: move.setupBonus.critMod,
    };
    attacker.momentum = Math.min(3, attacker.momentum + 1);
    state.log.push(`${attackerName} establishes ${move.name}! Next ${move.setupBonus.duration} moves boosted.`);
    attacker.lastMoveId = move.id;
    if (attacker.momentum > 0) state.log.push(`Momentum: ${attacker.momentum}`);
    return;
  }

  // ── ACCURACY CHECK ──
  let accuracy = move.accuracy + mastery.accuracyBonus;
  if (isChained(attacker.lastMoveId, move)) accuracy += 10;
  if (attacker.isGassed) accuracy -= 30;
  if (attacker.momentum >= 1) accuracy += attacker.momentum * 5;
  if (attacker.setupBonus) accuracy += attacker.setupBonus.accuracyMod;

  // Track move usage for XP (player only)
  if (attackerIs === 'player' && move.id !== '__stall__' && move.id !== '__spaz__') {
    if (!state.moveUsage[move.id]) state.moveUsage[move.id] = { uses: 0, hits: 0 };
    state.moveUsage[move.id].uses++;
  }

  if (Math.random() * 100 > accuracy) {
    state.log.push(`${move.name} missed!`);
    if (move.category === 'submission') awardAdvantage(state, attackerIs, `near-submission (${move.name})`);
    attacker.lastMoveId = move.id;
    // Miss resets momentum
    if (attacker.momentum > 0) { attacker.momentum = 0; state.log.push(`Momentum reset!`); }
    return;
  }

  // Mark hit for move XP
  if (attackerIs === 'player' && state.moveUsage[move.id]) state.moveUsage[move.id].hits++;

  const oldPosition = state.position;
  const chained = isChained(attacker.lastMoveId, move);

  // ── SUBMISSION ──
  if (move.category === 'submission') {
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
        state.log.push(`${defenderName} taps out! SUBMISSION!`);
        attacker.lastMoveId = move.id;
        attacker.momentum = Math.min(3, attacker.momentum + 1);
        return;
      }
      if (result.escaped) break;
    }
    if (deepestPhase >= 2) awardAdvantage(state, attackerIs, `deep submission attempt (${move.name})`);
    attacker.lastMoveId = move.id;
    attacker.momentum = Math.min(3, attacker.momentum + 1);
    if (attacker.momentum > 0) state.log.push(`Momentum: ${attacker.momentum}`);
    return;
  }

  // ── GUARD RETENTION CHECK (for pass moves) ──
  if (move.category === 'pass') {
    const retention = rollGuardRetention(attacker, defender, move);
    if (retention === 'stuffed') {
      state.log.push(`${defenderName} retains guard! Pass stuffed!`);
      awardAdvantage(state, attackerIs, `near-pass (${move.name})`);
      attacker.lastMoveId = move.id;
      if (attacker.momentum > 0) { attacker.momentum = 0; state.log.push(`Momentum reset!`); }
      return;
    }
    if (retention === 'partial-pass') {
      state.log.push(`Partial pass — caught in half guard!`);
      // Override to half-guard instead of the move's intended position
      state.position = 'half-guard';
      state.topFighter = attackerIs;
      const newRole = getRole(state.position, state.topFighter, attackerIs);
      state.log.push(`Position: ${getPositionDisplayName(state.position, newRole)}`);
      // Still award pass points (you did advance)
      awardPositionPoints(state, { ...move, resultPosition: 'half-guard' }, attackerIs, oldPosition);
      attacker.lastMoveId = move.id;
      attacker.momentum = Math.min(3, attacker.momentum + 1);
      if (attacker.momentum > 0) state.log.push(`Momentum: ${attacker.momentum}`);
      // Apply stamina drain
      const { damage } = calculateDamage(attacker, defender, move, state.position, attackerRole, chained, attacker.momentum);
      if (damage > 0) deductStamina(defender, Math.floor(damage * 0.3));
      return;
    }
    // clean-pass: fall through to normal resolution
  }

  // ── CALCULATE DAMAGE ──
  const { damage, isCrit } = calculateDamage(attacker, defender, move, state.position, attackerRole, chained, attacker.momentum);
  if (damage > 0) {
    const staminaDrain = Math.floor(damage * 0.5);
    deductStamina(defender, staminaDrain);

    // Non-submission moves do minimal HP damage (positional, not harmful)
    const hpDamage = Math.floor(damage * 0.15);
    defender.currentHp = Math.max(0, defender.currentHp - hpDamage);

    const critText = isCrit ? ' CRITICAL!' : '';
    state.log.push(`${move.name} connects!${critText}`);
    const effText = getEffectivenessText(defender, move);
    if (effText) state.log.push(effText);
  }

  // ── POSITION CHANGE + POINTS ──
  if (move.resultPosition) {
    state.position = move.resultPosition;
    if (move.resultRole === 'top') state.topFighter = attackerIs;
    else if (move.resultRole === 'bottom') state.topFighter = attackerIs === 'player' ? 'opponent' : 'player';
    else if (move.resultRole === 'neutral') state.topFighter = null;

    const newRole = getRole(state.position, state.topFighter, attackerIs);
    state.log.push(`Position: ${getPositionDisplayName(state.position, newRole)}`);
    awardPositionPoints(state, move, attackerIs, oldPosition);
  }

  // ── IMPACT (flinch + recoil) ──
  if (move.impact && move.resultPosition) {
    // Recoil: extra stamina cost to attacker
    if (move.impact.recoil > 0) deductStamina(attacker, move.impact.recoil);
    // Flinch chance
    if (Math.random() < move.impact.flinchChance) {
      defender.flinched = true;
      state.log.push(`${defenderName} is STUNNED from the impact!`);
    }
  }

  // ── MOMENTUM UPDATE ──
  attacker.momentum = Math.min(3, attacker.momentum + 1);
  attacker.lastMoveId = move.id;
  if (attacker.momentum >= 2) state.log.push(`Momentum: ${attacker.momentum}${attacker.momentum === 3 ? ' — IN THE ZONE!' : ''}`);

  // ── REF STOPPAGE ──
  if (defender.currentHp <= 0) {
    state.winner = attackerIs;
    state.winMethod = 'submission';
    state.phase = 'battle-over';
    state.log.push(`${defenderName} can't continue! Referee stoppage!`);
  }
}

// ── AI move selection ──
function pickAIMove(state: BattleState): Move {
  const legal = getLegalMoves(state, 'opponent');
  const nonStall = legal.filter(m => m.id !== '__stall__');
  const candidates = nonStall.length > 0 ? nonStall : legal;
  const affordable = candidates.filter(m => state.opponent.currentStamina >= m.staminaCost);
  if (affordable.length === 0) return STALL_MOVE;

  const posData = POSITIONS[state.position];
  const role = getRole(state.position, state.topFighter, 'opponent');
  const turnsLeft = state.maxTurns - state.turn;
  const scoreDiff = state.opponentPoints - state.playerPoints;
  const isAhead = scoreDiff > 0;

  const scored = affordable.map(move => {
    let score = move.power + move.accuracy * 0.3;
    if (move.category === 'submission') {
      score += (role === 'top' && (posData.advantage === 'dominant-top' || posData.advantage === 'top')) ? 40 : 15;
      if (isAhead && turnsLeft <= 4) score -= 20;
    }
    if (move.category === 'escape' && role === 'bottom') {
      score += posData.advantage === 'dominant-top' ? 50 : posData.advantage === 'top' ? 35 : 15;
    }
    if (move.category === 'setup') score += 25; // AI values setup moves
    if (!isAhead && turnsLeft <= 4 && (move.category === 'takedown' || move.category === 'sweep' || move.category === 'pass')) score += 25;
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

  if (state.playerPoints > state.opponentPoints) { state.winner = 'player'; state.winMethod = 'points'; state.log.push('You win on POINTS!'); }
  else if (state.opponentPoints > state.playerPoints) { state.winner = 'opponent'; state.winMethod = 'points'; state.log.push(`${state.opponent.grappler.name} wins on POINTS!`); }
  else if (state.playerAdvantages > state.opponentAdvantages) { state.winner = 'player'; state.winMethod = 'advantages'; state.log.push('You win on ADVANTAGES!'); }
  else if (state.opponentAdvantages > state.playerAdvantages) { state.winner = 'opponent'; state.winMethod = 'advantages'; state.log.push(`${state.opponent.grappler.name} wins on ADVANTAGES!`); }
  else { state.winner = null; state.winMethod = 'draw'; state.log.push('DRAW! No winner.'); }
}

// ── Main turn execution ──
export function executeTurn(state: BattleState, playerMoveId: string): BattleState {
  const s = { ...state, log: [...state.log] };
  const playerMove = playerMoveId === '__stall__' ? STALL_MOVE
    : playerMoveId === '__spaz__' ? SPAZ_MOVE
    : getMove(playerMoveId);
  if (!playerMove) return s;

  // Fatigue phase announcement (on phase change)
  const fatigue = getFatiguePhase(s.turn, s.player.stats.end);
  if (s.turn === 4) s.log.push(`⚡ BURN PHASE — stamina costs increasing!`);
  if (s.turn === 7 || (s.player.stats.end > 35 && s.turn === 6)) s.log.push(`💨 SECOND WIND!`);
  if (s.turn === 10) s.log.push(`⚡ GRIND — deep waters now.`);

  const turnsRemaining = s.maxTurns - s.turn + 1;
  s.log.push(`--- Turn ${s.turn} (${turnsRemaining} remaining) [${fatigue}] ---`);
  s.firstActor = computeFirstActor(s);

  if (s.firstActor === 'opponent') s.log.push(`${s.opponent.grappler.name} has initiative!`);

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

    // Fatigue-adjusted recovery
    const fatigue = getFatiguePhase(state.turn, state.player.stats.end);
    const fatigueMods = getFatigueModifiers(fatigue);

    recoverStamina(state.player, state.position, playerRole === 'top', fatigueMods.recoveryMod);
    recoverStamina(state.opponent, state.position, opponentRole === 'top', fatigueMods.recoveryMod);

    // Decrement setup bonuses
    if (state.player.setupBonus) {
      state.player.setupBonus.turnsRemaining--;
      if (state.player.setupBonus.turnsRemaining <= 0) { state.player.setupBonus = null; }
    }
    if (state.opponent.setupBonus) {
      state.opponent.setupBonus.turnsRemaining--;
      if (state.opponent.setupBonus.turnsRemaining <= 0) { state.opponent.setupBonus = null; }
    }

    state.turn++;
    if (state.turn > state.maxTurns) { resolveByPoints(state); return state; }

    state.phase = 'select-move';
    state.firstActor = computeFirstActor(state);
  }
  return state;
}
