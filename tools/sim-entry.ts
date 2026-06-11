/**
 * Headless balance simulator — AI vs AI round-robin across the 8 archetypes,
 * using the real BattleEngine. Both sides pick moves with a clone of the
 * engine's AI heuristic. Prints a JSON balance report.
 *
 * Bundle: npx rolldown tools/sim-entry.ts --file /tmp/gq-sim.mjs --format esm
 * Run:    node /tmp/gq-sim.mjs [matchesPerPair]
 */
import { createBattleState, executeTurn, getLegalMoves, STALL_MOVE } from '../src/battle/BattleEngine';
import type { BattleState } from '../src/engine/types';
import { POSITIONS, getRole } from '../src/data/positions';
import { getMove } from '../src/data/moves';
import { ARCHETYPES, ARCHETYPE_FRAMES } from '../src/data/archetypes';
import { rollIVs } from '../src/engine/random';
import type { Belt, Grappler, Move } from '../src/engine/types';

const BELT: Belt = 'blue';
const BELT_XP = 2500;
const EV_BUDGET = 120;

// Counterfactual movesets: what each archetype COULD run with 9 slots —
// every set has a standing option, a bottom game, and a top game.
const RICH_SETS: Record<string, string[]> = {
  'pressure-machine': ['double-leg', 'knee-cut', 'smash-pass', 'over-under', 'americana', 'arm-triangle', 'posture-up', 'shrimp-escape', 'kob-transition'],
  'guard-wizard': ['pull-guard', 'scissor-sweep', 'hip-bump', 'triangle', 'armbar-guard', 'omoplata', 'guard-recovery', 'butterfly-sweep', 'elbow-escape'],
  'takedown-artist': ['double-leg', 'single-leg', 'snap-down', 'high-crotch', 'russian-tie', 'suplex', 'bridge-escape', 'turtle-standup', 'underhook-escape'],
  'leg-reaper': ['leg-entry', 'imanari-roll', 'heel-hook', 'ankle-lock', 'kneebar', 'toe-hold', 'leg-reposition', 'leg-escape-stand', 'single-leg'],
  'flow-roller': ['pull-guard', 'dlr-sweep', 'berimbolo-sweep', 'reverse-dlr', 'seatbelt-back-take', 'rnc', 'granby-roll', 'back-take-transition', 'long-step'],
  'judo-heavy': ['clinch-entry', 'osoto-gari', 'seoi-nage', 'ouchi-gari', 'foot-sweep', 'knee-cut', 'americana', 'bridge-escape', 'kob-transition'],
  'finish-hunter': ['guillotine', 'darce', 'anaconda', 'kimura', 'pull-guard', 'triangle', 'armbar-mount', 'front-headlock', 'snap-down'],
  'chess-player': ['snap-down', 'clinch-entry', 'kob-transition', 'ns-transition', 'mount-transition', 'americana', 'cross-collar-mount', 'ezekiel', 'shrimp-escape'],
};
const RICH = process.argv[3] === 'rich';

function makeGrappler(archIdx: number, tag: string): Grappler {
  const arch = ARCHETYPES[archIdx];
  const evs = { str: 0, tec: 0, tgh: 0, flx: 0, spd: 0, end: 0 };
  const keys = Object.keys(evs) as (keyof typeof evs)[];
  const sorted = [...keys].sort((a, b) => (arch.baseStats as any)[b] - (arch.baseStats as any)[a]);
  let remaining = EV_BUDGET;
  for (let i = 0; i < sorted.length && remaining > 0; i++) {
    const alloc = Math.min(remaining, Math.floor(EV_BUDGET * (i === 0 ? 0.35 : i === 1 ? 0.25 : 0.1)));
    evs[sorted[i]] = alloc; remaining -= alloc;
  }
  return {
    id: `sim-${tag}`, name: `${arch.name}-${tag}`, style: arch.style, belt: BELT, xp: BELT_XP,
    baseStats: { ...arch.baseStats }, ivs: rollIVs(), evs,
    moves: RICH ? RICH_SETS[arch.id] : arch.startingMoves.slice(0, 9), // live AI = 4 moves
    learnedMoves: [...arch.startingMoves], moveXp: {},
    frame: ARCHETYPE_FRAMES[arch.id] || 'medium',
  };
}

// Clone of the engine's pickAIMove heuristic, applied to the PLAYER side.
function pickMove(state: BattleState, who: 'player' | 'opponent'): Move {
  const legal = getLegalMoves(state, who);
  const me = who === 'player' ? state.player : state.opponent;
  const myPts = who === 'player' ? state.playerPoints : state.opponentPoints;
  const theirPts = who === 'player' ? state.opponentPoints : state.playerPoints;
  const nonStall = legal.filter(m => m.id !== '__stall__');
  const candidates = nonStall.length > 0 ? nonStall : legal;
  const affordable = candidates.filter(m => me.currentStamina >= m.staminaCost);
  if (affordable.length === 0) return STALL_MOVE;

  const posData = POSITIONS[state.position];
  const role = getRole(state.position, state.topFighter, who);
  const turnsLeft = state.maxTurns - state.turn;
  const isAhead = myPts - theirPts > 0;

  const scored = affordable.map(move => {
    let score = move.power + move.accuracy * 0.3;
    if (move.category === 'submission') {
      score += (role === 'top' && (posData.advantage === 'dominant-top' || posData.advantage === 'top')) ? 40 : 15;
      if (isAhead && turnsLeft <= 4) score -= 20;
    }
    if (move.category === 'escape' && role === 'bottom') {
      score += posData.advantage === 'dominant-top' ? 50 : posData.advantage === 'top' ? 35 : 15;
    }
    if (move.category === 'setup') score += 25;
    if (!isAhead && turnsLeft <= 4 && (move.category === 'takedown' || move.category === 'sweep' || move.category === 'pass')) score += 25;
    const last = me.lastMoveId ? getMove(me.lastMoveId) : undefined;
    if (last && last.chainPotential.includes(move.id)) score += 20;
    if (move.id === me.lastMoveId) score -= 12 * (me.repeatCount + 1);
    if (me.currentStamina < me.maxStamina * 0.3) score -= move.staminaCost * 2;
    score += (Math.random() - 0.5) * 30;
    return { move, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}

// ── Round robin ──
const N = parseInt(process.argv[2] || '120', 10);
const wins: Record<string, number> = {};
const games: Record<string, number> = {};
const methods: Record<string, number> = {};
const posVisits: Record<string, number> = {};
let totalTurns = 0, totalMatches = 0;
let playerStalls = 0, playerSpazzes = 0, playerRealMoves = 0;
let zeroLegalTurns = 0, totalChoiceTurns = 0, totalLegalOptions = 0;
const subAttempts = { attempts: 0, taps: 0 };
const styleWins: Record<string, number> = {};
const styleGames: Record<string, number> = {};

for (let a = 0; a < ARCHETYPES.length; a++) {
  for (let b = 0; b < ARCHETYPES.length; b++) {
    if (a === b) continue;
    for (let n = 0; n < N; n++) {
      const p = makeGrappler(a, 'P');
      const o = makeGrappler(b, 'O');
      let state = createBattleState(p, o);
      let guard = 0;
      while (state.phase !== 'battle-over' && guard++ < 60) {
        posVisits[state.position] = (posVisits[state.position] || 0) + 1;
        const legal = getLegalMoves(state, 'player');
        const real = legal.filter(m => m.id !== '__stall__' && m.id !== '__spaz__');
        totalChoiceTurns++;
        totalLegalOptions += real.length;
        if (real.length === 0) zeroLegalTurns++;
        const mv = pickMove(state, 'player');
        if (mv.id === '__stall__') playerStalls++;
        else if (mv.id === '__spaz__') playerSpazzes++;
        else playerRealMoves++;
        if (mv.category === 'submission') subAttempts.attempts++;
        state = executeTurn(state, mv.id);
      }
      const aName = ARCHETYPES[a].id, bName = ARCHETYPES[b].id;
      games[aName] = (games[aName] || 0) + 1;
      games[bName] = (games[bName] || 0) + 1;
      styleGames[ARCHETYPES[a].style] = (styleGames[ARCHETYPES[a].style] || 0) + 1;
      styleGames[ARCHETYPES[b].style] = (styleGames[ARCHETYPES[b].style] || 0) + 1;
      if (state.winner === 'player') { wins[aName] = (wins[aName] || 0) + 1; styleWins[ARCHETYPES[a].style] = (styleWins[ARCHETYPES[a].style] || 0) + 1; }
      else if (state.winner === 'opponent') { wins[bName] = (wins[bName] || 0) + 1; styleWins[ARCHETYPES[b].style] = (styleWins[ARCHETYPES[b].style] || 0) + 1; }
      const method = state.winMethod || 'timeout-draw';
      methods[method] = (methods[method] || 0) + 1;
      if (method === 'submission') subAttempts.taps++;
      totalTurns += state.turn;
      totalMatches++;
    }
  }
}

const report = {
  matches: totalMatches,
  avgTurns: +(totalTurns / totalMatches).toFixed(1),
  finishMethods: Object.fromEntries(Object.entries(methods).map(([k, v]) => [k, +(100 * v / totalMatches).toFixed(1) + '%'])),
  archetypeWinRates: Object.fromEntries(
    Object.entries(games).map(([k, g]) => [k, +(100 * (wins[k] || 0) / g).toFixed(1) + '%'])
  ),
  playerMoveMix: {
    real: +(100 * playerRealMoves / (playerRealMoves + playerStalls + playerSpazzes)).toFixed(1) + '%',
    stall: +(100 * playerStalls / (playerRealMoves + playerStalls + playerSpazzes)).toFixed(1) + '%',
    spaz: +(100 * playerSpazzes / (playerRealMoves + playerStalls + playerSpazzes)).toFixed(1) + '%',
  },
  turnsWithZeroRealMoves: +(100 * zeroLegalTurns / totalChoiceTurns).toFixed(1) + '%',
  avgRealOptionsPerTurn: +(totalLegalOptions / totalChoiceTurns).toFixed(2),
  positionVisitShare: Object.fromEntries(
    Object.entries(posVisits).sort((x, y) => y[1] - x[1]).map(([k, v]) => [k, +(100 * v / totalChoiceTurns).toFixed(1) + '%'])
  ),
  submissionAttemptsPerMatch: +(subAttempts.attempts / totalMatches).toFixed(2),
};
console.log(JSON.stringify(report, null, 2));
