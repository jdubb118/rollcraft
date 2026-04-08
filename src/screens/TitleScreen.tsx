import { useNavigate } from 'react-router-dom';
import { hasExistingPlayer } from '../state/saveLoad';

export default function TitleScreen() {
  const navigate = useNavigate();
  const hasSave = hasExistingPlayer();

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
          ROLLCRAFT
        </h1>
        <p style={{ fontSize: 'var(--fs-md)', color: '#888', letterSpacing: 2 }}>
          BJJ BATTLE SYSTEM
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
      </div>

      {/* Footer */}
      <p style={{ fontSize: 'var(--fs-xs)', color: '#444', position: 'absolute', bottom: 20 }}>
        PRESS START
      </p>
    </div>
  );
}
