import { useNavigate } from 'react-router-dom';
import { loadBattleResult, loadPlayer, savePlayer, recordWin, recordLoss, addMoney } from '../state/saveLoad';
import { STYLE_NAMES } from '../engine/constants';
import { BELT_XP_THRESHOLDS } from '../engine/types';
import type { Belt, StatKey } from '../engine/types';

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

export default function ResultScreen() {
  const navigate = useNavigate();
  const result = loadBattleResult();
  const player = loadPlayer();

  if (!result || !player) {
    navigate('/');
    return null;
  }

  const isWin = result.winner === 'player';
  const isDraw = result.winner === 'draw';

  // Calculate EV gains
  const evGains = calculateEVGains(result.method, isWin, result.turns);

  // Check if promotion is available (but don't apply it)
  const newXp = player.xp + result.xpGained;
  const nextBelt = getNextBelt(player.belt);
  const nextBeltXp = nextBelt ? BELT_XP_THRESHOLDS[nextBelt] : Infinity;
  const promotionReady = newXp >= nextBeltXp && nextBelt;

  const moneyEarned = isWin ? 25 + Math.floor(result.turns * 2) : isDraw ? 15 : 10;

  const handleContinue = () => {
    // Apply XP
    player.xp = newXp;

    // Apply EV gains (capped at 252 per stat)
    for (const [stat, amount] of Object.entries(evGains)) {
      const key = stat as StatKey;
      player.evs[key] = Math.min(EV_CAP, player.evs[key] + (amount || 0));
    }

    // Do NOT auto-promote — player must visit coach
    savePlayer(player);

    if (isWin) recordWin(result.opponentName);
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

      {/* XP + Belt progress */}
      <div style={{
        padding: '12px 20px', background: '#111', border: '2px solid #ffd700',
        textAlign: 'center', width: '100%', maxWidth: 280,
      }}>
        <div style={{ fontSize: 'var(--fs-lg)', color: '#ffd700', marginBottom: 8 }}>
          +{result.xpGained} XP
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
      </div>
    </div>
  );
}
