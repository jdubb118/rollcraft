import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPlayer } from '../state/saveLoad';

interface GymEntry { name: string; wins: number }

const MEDALS = ['🥇', '🥈', '🥉'];

export default function GymsScreen() {
  const navigate = useNavigate();
  const player = loadPlayer();
  const [gyms, setGyms] = useState<GymEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => setGyms(Array.isArray(data.gyms) ? data.gyms : []))
      .catch(() => setError(true));
  }, []);

  const myGym = player?.gymName?.trim().toLowerCase();

  return (
    <div className="game-shell no-scrollbar" style={{ overflow: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', background: '#0d0d1a',
        borderBottom: '2px solid #222', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '6px 12px', background: '#1a1a2e', color: '#888',
            fontSize: 'var(--fs-sm)', border: '1px solid #444',
          }}
        >
          BACK
        </button>
        <span style={{ fontSize: 'var(--fs-md)', color: '#ffd700' }}>TOP GYMS</span>
        <span style={{ width: 50 }} />
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: '#888', textAlign: 'center', lineHeight: 1.8 }}>
          Every win you take counts for your gym.<br />Rep your academy.
        </div>

        {!gyms && !error && (
          <div style={{ fontSize: 'var(--fs-sm)', color: '#555', textAlign: 'center', padding: 30 }} className="blink">
            LOADING...
          </div>
        )}

        {error && (
          <div style={{ fontSize: 'var(--fs-xs)', color: '#ef4444', textAlign: 'center', padding: 30 }}>
            Couldn't reach the leaderboard. Try again later.
          </div>
        )}

        {gyms && gyms.length === 0 && (
          <div style={{ fontSize: 'var(--fs-xs)', color: '#555', textAlign: 'center', padding: 30, lineHeight: 1.8 }}>
            No gyms on the board yet.<br />Win a match and put yours up first.
          </div>
        )}

        {gyms && gyms.map((gym, i) => {
          const isMine = myGym && gym.name.trim().toLowerCase() === myGym;
          return (
            <div key={`${gym.name}-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              background: isMine ? '#1a1a0e' : '#111',
              border: `1px solid ${isMine ? '#ffd700' : '#222'}`,
            }}>
              <span style={{ fontSize: 'var(--fs-sm)', width: 30, color: '#888' }}>
                {MEDALS[i] || `${i + 1}.`}
              </span>
              <span style={{
                flex: 1, fontSize: 'var(--fs-xs)',
                color: isMine ? '#ffd700' : '#ddd',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {gym.name.toUpperCase()}{isMine ? ' ★' : ''}
              </span>
              <span style={{ fontSize: 'var(--fs-xs)', color: '#22c55e' }}>
                {gym.wins}W
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
