import { useNavigate } from 'react-router-dom';
import { hasExistingPlayer, saveOpponent } from '../state/saveLoad';
import { getPendingChallenge, clearPendingChallenge } from '../engine/challenge';
import { getDailyRollState } from '../engine/daily';

export default function TitleScreen() {
  const navigate = useNavigate();
  const hasSave = hasExistingPlayer();
  const challenge = getPendingChallenge();
  const daily = hasSave ? getDailyRollState() : null;

  return (
    <div className="game-shell" style={{
      justifyContent: 'center', alignItems: 'center', gap: 40,
    }}>
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 32, color: '#ffd700', textShadow: '3px 3px 0 #8b6914',
          letterSpacing: 4, marginBottom: 8,
        }}>
          GRAPPLE QUEST
        </h1>
        <p style={{ fontSize: 'var(--fs-md)', color: '#888', letterSpacing: 2 }}>
          THE BJJ JOURNEY
        </p>
      </div>

      {/* Belt decoration */}
      <div style={{
        width: 120, height: 8, background: '#222',
        border: '1px solid #444', position: 'relative',
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(90deg, #fff, #e0e0e0, #fff)',
        }} />
      </div>

      {/* Incoming challenge */}
      {challenge && (
        <div style={{
          padding: '12px 16px', maxWidth: 300, textAlign: 'center',
          background: '#1a0e0e', border: '2px solid #ef4444',
        }}>
          <div style={{ fontSize: 'var(--fs-sm)', color: '#ef4444', lineHeight: 1.8, marginBottom: 10 }}>
            ⚔ {challenge.opponent.name.toUpperCase()}
            {challenge.gym ? ` FROM ${challenge.gym.toUpperCase()}` : ''} CHALLENGES YOU
            {challenge.record ? ` (${challenge.record})` : ''}
          </div>
          {hasSave ? (
            <button
              onClick={() => {
                saveOpponent(challenge.opponent);
                clearPendingChallenge();
                navigate('/battle');
              }}
              style={{
                padding: '10px 24px', background: '#ef4444', color: '#fff',
                fontSize: 'var(--fs-sm)', border: 'none',
              }}
            >
              ACCEPT
            </button>
          ) : (
            <div style={{ fontSize: 'var(--fs-xs)', color: '#888', lineHeight: 1.7 }}>
              Create your fighter first — the challenge will be waiting.
            </div>
          )}
        </div>
      )}

      {/* Menu buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button
          onClick={() => navigate('/create')}
          style={{
            padding: '14px 40px', background: '#1a1a2e', color: '#ffd700',
            fontSize: 'var(--fs-md)', border: '2px solid #ffd700',
            minWidth: 200,
          }}
        >
          NEW GAME
        </button>
        {hasSave && (
          <button
            onClick={() => navigate('/overworld')}
            style={{
              padding: '14px 40px', background: '#1a1a2e', color: '#3498db',
              fontSize: 'var(--fs-md)', border: '2px solid #3498db',
              minWidth: 200,
            }}
          >
            CONTINUE
          </button>
        )}
        {daily && !daily.attempted && (
          <div style={{ fontSize: 'var(--fs-xs)', color: '#ff9800', textAlign: 'center', letterSpacing: 1 }} className="blink">
            🎲 DAILY ROLL WAITING{daily.streak > 0 ? ` — ${daily.streak} DAY STREAK ON THE LINE` : ''}
          </div>
        )}
        {daily && daily.attempted && daily.won && (
          <div style={{ fontSize: 'var(--fs-xs)', color: '#555', textAlign: 'center', letterSpacing: 1 }}>
            DAILY ✓ — STREAK: {daily.streak}
          </div>
        )}
      </div>

      {/* Footer */}
      <p style={{ fontSize: 'var(--fs-xs)', color: '#444', position: 'absolute', bottom: 20 }}>
        PRESS START
      </p>
    </div>
  );
}
