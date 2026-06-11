import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPlayer } from '../state/saveLoad';
import { fetchTopGyms, createGym, joinGym, getMyGym, type GymInfo } from '../engine/gyms';

interface LegacyGym { name: string; wins: number }

const MEDALS = ['🥇', '🥈', '🥉'];
const MAT_COLORS = ['#2da44e', '#2563eb', '#0d9488', '#dc2626', '#7c3aed', '#1a1a2e'];

export default function GymsScreen() {
  const navigate = useNavigate();
  const player = loadPlayer();
  const myGym = getMyGym();

  const [founded, setFounded] = useState<GymInfo[] | null>(null);
  const [legacy, setLegacy] = useState<LegacyGym[] | null>(null);
  const [error, setError] = useState(false);

  // Founder form
  const [founding, setFounding] = useState(false);
  const [foundName, setFoundName] = useState(player?.gymName || '');
  const [foundColor, setFoundColor] = useState(MAT_COLORS[0]);
  const [foundBusy, setFoundBusy] = useState(false);
  const [foundError, setFoundError] = useState('');

  useEffect(() => {
    fetchTopGyms().then(setFounded).catch(() => setFounded([]));
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => setLegacy(Array.isArray(data.gyms) ? data.gyms : []))
      .catch(() => setError(true));
  }, []);

  async function handleFound() {
    if (foundBusy || foundName.trim().length < 3) return;
    setFoundBusy(true);
    setFoundError('');
    try {
      const gym = await createGym(foundName.trim(), foundColor);
      if (player) await joinGym(gym.id, player).catch(() => {});
      navigate(`/gym?id=${gym.id}`);
    } catch (e: any) {
      setFoundError(e.message || 'Could not found gym');
    } finally {
      setFoundBusy(false);
    }
  }

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

        {/* My gym shortcut */}
        {myGym && (
          <button
            onClick={() => navigate(`/gym?id=${myGym.gymId}`)}
            style={{
              padding: '10px 12px', background: '#1a1a0e', border: '1px solid #ffd700',
              color: '#ffd700', fontSize: 'var(--fs-xs)', textAlign: 'center',
            }}
          >
            ★ {myGym.gymName.toUpperCase()} — VIEW YOUR GYM
          </button>
        )}

        {/* Found a gym */}
        {!myGym && !founding && (
          <button
            onClick={() => setFounding(true)}
            style={{
              padding: '12px', background: '#1a2a1a', border: '2px solid #22c55e',
              color: '#22c55e', fontSize: 'var(--fs-sm)',
            }}
          >
            + FOUND YOUR GYM
          </button>
        )}
        {founding && (
          <div style={{ background: '#111', padding: '12px', border: '2px solid #22c55e', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 'var(--fs-xs)', color: '#22c55e', textAlign: 'center' }}>FOUND YOUR GYM</div>
            <input
              type="text" value={foundName} onChange={e => setFoundName(e.target.value)}
              placeholder="GYM NAME" maxLength={28}
              style={{
                padding: '10px 12px', background: '#0a0a14', border: '1px solid #333',
                color: '#fff', fontFamily: "'Press Start 2P', monospace",
                fontSize: 'var(--fs-xs)', textAlign: 'center',
              }}
            />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {MAT_COLORS.map(c => (
                <button key={c} onClick={() => setFoundColor(c)} style={{
                  width: 28, height: 28, background: c,
                  border: foundColor === c ? '3px solid #fff' : '1px solid #333',
                }} aria-label={`mat color ${c}`} />
              ))}
            </div>
            <div style={{ fontSize: 7, color: '#666', textAlign: 'center' }}>YOUR MAT COLOR</div>
            {foundError && <div style={{ fontSize: 'var(--fs-xs)', color: '#ef4444', textAlign: 'center' }}>{foundError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setFounding(false)} style={{
                flex: 1, padding: '8px', background: '#111', color: '#666',
                fontSize: 'var(--fs-xs)', border: '1px solid #333',
              }}>CANCEL</button>
              <button onClick={handleFound} disabled={foundBusy || foundName.trim().length < 3} style={{
                flex: 2, padding: '8px', background: '#1a2a1a',
                color: foundName.trim().length >= 3 ? '#22c55e' : '#555',
                fontSize: 'var(--fs-xs)', border: '1px solid #22c55e',
              }}>
                {foundBusy ? 'FOUNDING...' : 'FOUND IT'}
              </button>
            </div>
          </div>
        )}

        {/* Founded gyms (the real entities) */}
        {founded && founded.length > 0 && (
          <>
            <div style={{ fontSize: 'var(--fs-xs)', color: '#ffd700', marginTop: 4 }}>FOUNDED GYMS</div>
            {founded.map((g, i) => {
              const isMine = myGym?.gymId === g.id;
              return (
                <button key={g.id} onClick={() => navigate(`/gym?id=${g.id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', textAlign: 'left',
                  background: isMine ? '#1a1a0e' : '#111',
                  border: `1px solid ${isMine ? '#ffd700' : (g.palette?.mat || '#22c55e') + '55'}`,
                  borderLeft: `4px solid ${g.palette?.mat || '#22c55e'}`,
                }}>
                  <span style={{ fontSize: 'var(--fs-sm)', width: 30, color: '#888' }}>
                    {MEDALS[i] || `${i + 1}.`}
                  </span>
                  <span style={{
                    flex: 1, fontSize: 'var(--fs-xs)',
                    color: isMine ? '#ffd700' : '#ddd',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {g.name.toUpperCase()}{isMine ? ' ★' : ''}
                  </span>
                  <span style={{ fontSize: 7, color: '#888' }}>{g.member_count}👤</span>
                  <span style={{ fontSize: 'var(--fs-xs)', color: '#22c55e' }}>{g.wins}W</span>
                </button>
              );
            })}
          </>
        )}

        {/* Legacy string-keyed board (unaffiliated players) */}
        {legacy && legacy.length > 0 && (
          <>
            <div style={{ fontSize: 'var(--fs-xs)', color: '#666', marginTop: 4 }}>UNAFFILIATED</div>
            {legacy.map((gym, i) => (
              <div key={`${gym.name}-${i}`} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', background: '#0d0d14', border: '1px solid #1a1a1a',
              }}>
                <span style={{ fontSize: 'var(--fs-xs)', width: 30, color: '#555' }}>{i + 1}.</span>
                <span style={{
                  flex: 1, fontSize: 'var(--fs-xs)', color: '#999',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {gym.name.toUpperCase()}
                </span>
                <span style={{ fontSize: 'var(--fs-xs)', color: '#22c55e88' }}>{gym.wins}W</span>
              </div>
            ))}
          </>
        )}

        {error && !founded?.length && (
          <div style={{ fontSize: 'var(--fs-xs)', color: '#ef4444', textAlign: 'center', padding: 20 }}>
            Couldn't reach the leaderboard. Try again later.
          </div>
        )}
        {founded && founded.length === 0 && legacy && legacy.length === 0 && !error && (
          <div style={{ fontSize: 'var(--fs-xs)', color: '#555', textAlign: 'center', padding: 20, lineHeight: 1.8 }}>
            No gyms on the board yet.<br />Found yours and put it up first.
          </div>
        )}
      </div>
    </div>
  );
}
