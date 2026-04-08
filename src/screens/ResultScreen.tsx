import { useNavigate } from 'react-router-dom';
import { loadBattleResult, loadPlayer, savePlayer, recordWin, recordLoss, addMoney } from '../state/saveLoad';
import { STYLE_NAMES } from '../engine/constants';
import { BELT_XP_THRESHOLDS } from '../engine/types';
import type { Belt } from '../engine/types';

const BELTS: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];

function getNextBelt(belt: Belt): Belt | null {
  const idx = BELTS.indexOf(belt);
  return idx < BELTS.length - 1 ? BELTS[idx + 1] : null;
}

export default function ResultScreen() {
  const navigate = useNavigate();
  const result = loadBattleResult();
  const player = loadPlayer();

  if (!result || !player) {
    navigate('/');
    return null;
  }

  const isWin = result.winner === 'player';

  // Apply XP
  const newXp = player.xp + result.xpGained;
  const nextBelt = getNextBelt(player.belt);
  const nextBeltXp = nextBelt ? BELT_XP_THRESHOLDS[nextBelt] : Infinity;
  const promoted = newXp >= nextBeltXp && nextBelt;

  // Money earned from the match
  const moneyEarned = isWin ? 25 + Math.floor(result.turns * 2) : 10;

  const handleContinue = () => {
    player.xp = newXp;
    if (promoted && nextBelt) {
      player.belt = nextBelt;
    }
    savePlayer(player);
    // Record progression
    if (isWin) recordWin();
    else recordLoss();
    addMoney(moneyEarned);
    navigate('/overworld');
  };

  const handleMenu = () => {
    player.xp = newXp;
    if (promoted && nextBelt) {
      player.belt = nextBelt;
    }
    savePlayer(player);
    navigate('/');
  };

  const currentXp = player.xp;
  const xpToNext = nextBelt ? BELT_XP_THRESHOLDS[nextBelt] - BELT_XP_THRESHOLDS[player.belt] : 1;
  const xpProgress = nextBelt ? ((currentXp - BELT_XP_THRESHOLDS[player.belt]) / xpToNext) * 100 : 100;

  return (
    <div style={{
      width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', gap: 24,
      background: '#0a0a14', padding: 24,
    }}>
      {/* Result */}
      <div style={{
        fontSize: '1.2rem',
        color: isWin ? '#22c55e' : '#ef4444',
        textShadow: `0 0 20px ${isWin ? '#22c55e' : '#ef4444'}44`,
      }}>
        {isWin ? 'VICTORY!' : 'DEFEAT'}
      </div>

      {/* Match info */}
      <div style={{ textAlign: 'center', fontSize: '0.4rem', color: '#888', lineHeight: 2 }}>
        <div>vs {result.opponentName} ({STYLE_NAMES[result.opponentStyle]})</div>
        <div>Method: {result.method.toUpperCase()}</div>
        <div>Turns: {result.turns}</div>
      </div>

      {/* XP gained */}
      <div style={{
        padding: '12px 24px', background: '#111', border: '2px solid #ffd700',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '0.5rem', color: '#ffd700', marginBottom: 8 }}>
          +{result.xpGained} XP
        </div>
        {/* Belt progress bar */}
        <div style={{ width: 200 }}>
          <div style={{ fontSize: '0.35rem', color: '#888', marginBottom: 4 }}>
            {player.belt.toUpperCase()} BELT {nextBelt ? `→ ${nextBelt.toUpperCase()}` : '(MAX)'}
          </div>
          <div style={{ width: '100%', height: 8, background: '#222', border: '1px solid #444' }}>
            <div style={{
              width: `${Math.min(100, xpProgress + (result.xpGained / xpToNext) * 100)}%`,
              height: '100%', background: '#ffd700',
              transition: 'width 1s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Promotion */}
      {promoted && (
        <div style={{
          fontSize: '0.6rem', color: '#ffd700',
          animation: 'pulse 1s infinite', textAlign: 'center',
        }}>
          PROMOTED TO {nextBelt?.toUpperCase()} BELT!
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 250 }}>
        <button
          onClick={handleContinue}
          style={{
            padding: '12px', background: '#1a1a2e', color: '#22c55e',
            fontSize: '0.55rem', border: '2px solid #22c55e',
          }}
        >
          BACK TO GYM
        </button>
        <button
          onClick={handleMenu}
          style={{
            padding: '12px', background: '#1a1a2e', color: '#888',
            fontSize: '0.55rem', border: '2px solid #444',
          }}
        >
          MENU
        </button>
      </div>
    </div>
  );
}
