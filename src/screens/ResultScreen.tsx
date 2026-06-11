import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadBattleResult, loadPlayer, savePlayer, recordWin, recordLoss, addMoney, loadProgression,
  recordCaughtBy, getCaughtCount, clearCaughtCount,
} from '../state/saveLoad';
import { STYLE_NAMES } from '../engine/constants';
import { BELT_XP_THRESHOLDS, BELT_MOVE_SLOTS } from '../engine/types';
import type { Belt, StatKey } from '../engine/types';
import { getMoveXpGain, getMoveBonus, getMasteryLabel } from '../battle/moveXp';
import { getMove } from '../data/moves';
import { shareCard } from '../engine/shareCard';
import { createChallengeUrl } from '../engine/challenge';
import { track, trackGymWin } from '../engine/analytics';
import { getDailyRollState, recordDailyResult } from '../engine/daily';
import { recordGymWinV2 } from '../engine/gyms';

const BELTS: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];

function getNextBelt(belt: Belt): Belt | null {
  const idx = BELTS.indexOf(belt);
  return idx < BELTS.length - 1 ? BELTS[idx + 1] : null;
}

// EV gain per match — based on what happened
// Winning = bigger gains. Style-based distribution.
function calculateEVGains(
  method: string,
  isWin: boolean,
  turns: number,
): Partial<Record<StatKey, number>> {
  const base = isWin ? 4 : 2; // wins earn more
  const gains: Partial<Record<StatKey, number>> = {};

  // Everyone gets END from mat time
  gains.end = base + Math.min(4, Math.floor(turns / 3));

  if (method === 'submission') {
    // Sub wins = TEC heavy
    gains.tec = base + 2;
    gains.str = base;
  } else if (method === 'points') {
    // Points wins = balanced
    gains.str = base;
    gains.tec = base;
    gains.spd = base;
  } else if (method === 'advantages') {
    // Advantage wins = speed + technique
    gains.spd = base + 1;
    gains.tec = base + 1;
  } else {
    // Draw = toughness
    gains.tgh = base + 2;
  }

  // Long matches build toughness
  if (turns >= 8) gains.tgh = (gains.tgh || 0) + 2;

  // Losers still train — build toughness and flexibility
  if (!isWin) {
    gains.tgh = (gains.tgh || 0) + 2;
    gains.flx = (gains.flx || 0) + 2;
  }

  return gains;
}

const STAT_LABELS: Record<StatKey, string> = {
  str: 'STR', tec: 'TEC', tgh: 'TGH', flx: 'FLX', spd: 'SPD', end: 'END',
};
const STAT_COLORS: Record<StatKey, string> = {
  str: '#e74c3c', tec: '#3498db', tgh: '#8b4513', flx: '#2ecc71', spd: '#f39c12', end: '#9b59b6',
};
const EV_CAP = 252; // per stat

const PROCESSED_KEY = 'rollcraft-result-processed';

export default function ResultScreen() {
  const navigate = useNavigate();
  const result = loadBattleResult();
  const player = loadPlayer();
  const [shareState, setShareState] = useState<'idle' | 'working' | 'done' | 'copied'>('idle');
  const [caughtLearned, setCaughtLearned] = useState(false);
  const [, setEffectsTick] = useState(0); // re-render after one-shot effects write localStorage

  const isWin = result?.winner === 'player';
  const isDraw = result?.winner === 'draw';
  const isDaily = !!result?.opponentId?.startsWith('daily-');

  // One-shot side effects per battle (guarded by result.ts so StrictMode /
  // remounts can't double-count): daily streak, caught-by, analytics.
  useEffect(() => {
    if (!result || !result.ts) return;
    if (localStorage.getItem(PROCESSED_KEY) === String(result.ts)) return;
    localStorage.setItem(PROCESSED_KEY, String(result.ts));

    if (isDaily) {
      // The day the roll was started lives in the opponent id (daily-YYYY-MM-DD)
      const forDate = result.opponentId!.replace('daily-', '');
      const streak = recordDailyResult(isWin, forDate);
      track('daily-roll', isWin ? `win-streak-${Math.min(streak, 30)}` : 'loss');
      if (isWin) addMoney(100); // daily bonus purse
    }
    if (!isWin && !isDraw && result.method === 'submission' && result.finishingMoveId
        && !result.finishingMoveId.startsWith('fund-') && getMove(result.finishingMoveId)) {
      recordCaughtBy(result.finishingMoveId);
    }
    setEffectsTick(t => t + 1); // caughtCount / streak read localStorage — re-render with fresh values
  }, [result?.ts]);

  if (!result || !player) {
    navigate('/');
    return null;
  }

  // Learn-by-getting-caught: tapped by the same real technique twice → you've
  // felt it from the inside. Losses literally teach.
  const caughtMove = !isWin && result.finishingMoveId && !result.finishingMoveId.startsWith('fund-')
    ? getMove(result.finishingMoveId) : undefined;
  const caughtCount = caughtMove ? getCaughtCount(caughtMove.id) : 0;
  const canLearnCaught = !!caughtMove && caughtCount >= 2
    && !(player.learnedMoves || []).includes(caughtMove.id) && !caughtLearned;

  // Calculate EV gains
  const evGains = calculateEVGains(result.method, isWin, result.turns);

  // Check if promotion is available (but don't apply it)
  const newXp = player.xp + result.xpGained;
  const nextBelt = getNextBelt(player.belt);
  const nextBeltXp = nextBelt ? BELT_XP_THRESHOLDS[nextBelt] : Infinity;
  const promotionReady = newXp >= nextBeltXp && nextBelt;

  const moneyEarned = isWin ? 35 + Math.floor(result.turns * 2) : isDraw ? 20 : 10;

  const handleContinue = () => {
    // Apply XP
    player.xp = newXp;

    // Apply EV gains (capped at 252 per stat)
    for (const [stat, amount] of Object.entries(evGains)) {
      const key = stat as StatKey;
      player.evs[key] = Math.min(EV_CAP, player.evs[key] + (amount || 0));
    }

    // Apply move XP from this battle
    if (!player.moveXp) player.moveXp = {};
    if (result.moveUsage) {
      for (const [moveId, usage] of Object.entries(result.moveUsage)) {
        const xpGain = usage.hits * getMoveXpGain(true) + (usage.uses - usage.hits) * getMoveXpGain(false);
        player.moveXp[moveId] = (player.moveXp[moveId] || 0) + xpGain;
      }
    }

    // Do NOT auto-promote — player must visit coach
    savePlayer(player);

    if (isWin) {
      // Challenge opponents are untrusted URL builds — count the win, but
      // don't let crafted names inflate npcDefeated (it gates region unlocks)
      const isChallenge = result.opponentId?.startsWith('challenge-');
      recordWin(isChallenge ? undefined : result.opponentName);
      trackGymWin(player.gymName); // legacy string-keyed board
      recordGymWinV2();            // id-keyed gym membership (no-op if unaffiliated)
    }
    else if (!isDraw) recordLoss();
    addMoney(moneyEarned);

    // If in a tournament, return to tournament bracket
    if (result.tournamentId) {
      navigate(`/tournament?id=${result.tournamentId}`);
    } else {
      navigate('/overworld');
    }
  };

  const currentXp = player.xp;
  const xpToNext = nextBelt ? BELT_XP_THRESHOLDS[nextBelt] - BELT_XP_THRESHOLDS[player.belt] : 1;
  const xpProgress = nextBelt ? ((currentXp - BELT_XP_THRESHOLDS[player.belt]) / xpToNext) * 100 : 100;

  return (
    <div className="game-shell" style={{
      justifyContent: 'center', alignItems: 'center', gap: 16,
      padding: '24px 20px', overflow: 'auto',
    }}>
      {/* Result */}
      <div style={{
        fontSize: 'var(--fs-xxl)',
        color: isWin ? '#22c55e' : isDraw ? '#888' : '#ef4444',
        textShadow: `0 0 20px ${isWin ? '#22c55e' : isDraw ? '#888' : '#ef4444'}44`,
      }}>
        {isWin ? 'VICTORY!' : isDraw ? 'DRAW' : 'DEFEAT'}
      </div>

      {/* Match info */}
      <div style={{ textAlign: 'center', fontSize: 'var(--fs-xs)', color: '#888', lineHeight: 2 }}>
        <div>vs {result.opponentName} ({STYLE_NAMES[result.opponentStyle]})</div>
        <div>Method: {result.method.toUpperCase()}</div>
        {(result.playerPoints !== undefined) && (
          <div>Score: {result.playerPoints} - {result.opponentPoints}</div>
        )}
        <div>Turns: {result.turns} | +${moneyEarned}</div>
      </div>

      {/* Daily Roll streak */}
      {isDaily && (
        <div style={{
          padding: '10px 16px', textAlign: 'center', width: '100%', maxWidth: 280,
          background: isWin ? '#1a1a0e' : '#1a0e0e',
          border: `2px solid ${isWin ? '#ffd700' : '#ef4444'}`,
        }}>
          <div style={{ fontSize: 'var(--fs-sm)', color: isWin ? '#ffd700' : '#ef4444' }}>
            {isWin
              ? `DAILY ROLL ✓ — STREAK: ${getDailyRollState().streak}`
              : 'DAILY ROLL FAILED — STREAK RESET'}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: '#888', marginTop: 4 }}>
            {isWin ? '+$100 bonus. Same time tomorrow.' : 'A new challenger lands tomorrow.'}
          </div>
        </div>
      )}

      {/* XP + Belt progress */}
      <div style={{
        padding: '12px 20px', background: '#111', border: '2px solid #ffd700',
        textAlign: 'center', width: '100%', maxWidth: 280,
      }}>
        <div style={{ fontSize: 'var(--fs-lg)', color: '#ffd700', marginBottom: 8 }}>
          +{result.xpGained} XP
          {result.freshLegs && (
            <span style={{
              fontSize: 'var(--fs-xs)', color: '#22c55e', marginLeft: 8,
              border: '1px solid #22c55e', padding: '2px 6px',
            }}>
              FRESH LEGS 2×
            </span>
          )}
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: '#888', marginBottom: 4 }}>
          {player.belt.toUpperCase()} BELT {nextBelt ? `→ ${nextBelt.toUpperCase()}` : '(MAX)'}
        </div>
        <div style={{ width: '100%', height: 10, background: '#222', border: '1px solid #333' }}>
          <div style={{
            width: `${Math.min(100, xpProgress + (result.xpGained / xpToNext) * 100)}%`,
            height: '100%', background: '#ffd700',
            transition: 'width 1s ease',
          }} />
        </div>
      </div>

      {/* Stat gains (EVs) */}
      <div style={{
        padding: '10px 16px', background: '#111', border: '1px solid #222',
        width: '100%', maxWidth: 280,
      }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: '#888', marginBottom: 8, textAlign: 'center' }}>
          TRAINING GAINS
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {Object.entries(evGains).map(([stat, amount]) => {
            const key = stat as StatKey;
            return (
              <div key={stat} style={{
                padding: '4px 8px', background: `${STAT_COLORS[key]}22`,
                border: `1px solid ${STAT_COLORS[key]}66`,
                fontSize: 'var(--fs-xs)', color: STAT_COLORS[key],
              }}>
                {STAT_LABELS[key]} +{amount}
              </div>
            );
          })}
        </div>
      </div>

      {/* Move mastery gains */}
      {result.moveUsage && Object.keys(result.moveUsage).length > 0 && (
        <div style={{
          padding: '8px 16px', background: '#111', border: '1px solid #222',
          width: '100%', maxWidth: 280,
        }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: '#888', marginBottom: 6, textAlign: 'center' }}>
            TECHNIQUE GROWTH
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Object.entries(result.moveUsage).map(([moveId, usage]) => {
              const xpGain = usage.hits * getMoveXpGain(true) + (usage.uses - usage.hits) * getMoveXpGain(false);
              const totalXp = (player.moveXp?.[moveId] || 0);
              const bonus = getMoveBonus(totalXp);
              return (
                <div key={moveId} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 'var(--fs-xs)',
                }}>
                  <span style={{ color: '#ccc' }}>{moveId.replace(/-/g, ' ')}</span>
                  <span style={{ color: '#22c55e' }}>+{xpGain}xp ({getMasteryLabel(bonus.level)})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Learn by getting caught */}
      {canLearnCaught && caughtMove && (
        <div style={{
          padding: '12px 16px', background: '#0e1420', border: '2px solid #3498db',
          width: '100%', maxWidth: 280, textAlign: 'center',
        }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: '#3498db', lineHeight: 1.8, marginBottom: 8 }}>
            You've felt the {caughtMove.name} from the inside {caughtCount} times now.
            You know how it works.
          </div>
          <button
            onClick={() => {
              if (!player.learnedMoves) player.learnedMoves = [...player.moves];
              if (!player.learnedMoves.includes(caughtMove.id)) player.learnedMoves.push(caughtMove.id);
              if (player.moves.length < BELT_MOVE_SLOTS[player.belt] && !player.moves.includes(caughtMove.id)) {
                player.moves.push(caughtMove.id);
              }
              savePlayer(player);
              clearCaughtCount(caughtMove.id);
              setCaughtLearned(true);
              track('caught-learn', caughtMove.id);
            }}
            style={{
              padding: '10px 20px', background: '#1a2a3a', color: '#3498db',
              fontSize: 'var(--fs-sm)', border: '2px solid #3498db',
            }}
          >
            LEARN {caughtMove.name.toUpperCase()}
          </button>
        </div>
      )}
      {caughtLearned && caughtMove && (
        <div style={{
          fontSize: 'var(--fs-sm)', color: '#22c55e', textAlign: 'center',
          padding: '8px 16px', border: '1px solid #22c55e', background: '#0e1a0e',
          width: '100%', maxWidth: 280,
        }}>
          {caughtMove.name.toUpperCase()} LEARNED — pain is a teacher.
        </div>
      )}

      {/* Promotion hint */}
      {promotionReady && (
        <div style={{
          fontSize: 'var(--fs-sm)', color: '#ffd700',
          textAlign: 'center', padding: '8px 16px',
          border: '1px solid #ffd700', background: '#1a1a0e',
          width: '100%', maxWidth: 280,
        }} className="blink">
          Your coach wants to see you at the gym...
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
        <button
          onClick={handleContinue}
          style={{
            padding: '12px', background: '#1a1a2e', color: '#22c55e',
            fontSize: 'var(--fs-md)', border: '2px solid #22c55e',
          }}
        >
          BACK TO GYM
        </button>

        {isWin && (
          <button
            onClick={async () => {
              if (shareState === 'working') return;
              setShareState('working');
              const prog = loadProgression();
              await shareCard({
                kind: 'victory',
                player,
                record: { wins: prog.totalWins + 1, losses: prog.totalLosses },
                opponentName: result.opponentName,
                method: result.method,
              });
              setShareState('done');
            }}
            style={{
              padding: '10px', background: '#1a1a0e', color: '#ffd700',
              fontSize: 'var(--fs-sm)', border: '2px solid #8b7500',
            }}
          >
            {shareState === 'working' ? 'BUILDING CARD...' : shareState === 'done' ? '✓ CARD READY' : '📸 SHARE VICTORY CARD'}
          </button>
        )}

        <button
          onClick={async () => {
            const prog = loadProgression();
            const url = createChallengeUrl(player, {
              wins: prog.totalWins + (isWin ? 1 : 0),
              losses: prog.totalLosses + (!isWin && !isDraw ? 1 : 0),
            });
            track('challenge-created');
            const text = `Think you can beat my fighter? ${url}`;
            try {
              if (navigator.share) { await navigator.share({ text }); setShareState('done'); return; }
            } catch { /* user closed the sheet */ }
            try { await navigator.clipboard.writeText(url); setShareState('copied'); } catch { /* ignore */ }
          }}
          style={{
            padding: '8px', background: '#111', color: '#3498db',
            fontSize: 'var(--fs-xs)', border: '1px solid #3498db',
          }}
        >
          {shareState === 'copied' ? '✓ LINK COPIED' : '⚔ CHALLENGE A FRIEND'}
        </button>
      </div>
    </div>
  );
}
