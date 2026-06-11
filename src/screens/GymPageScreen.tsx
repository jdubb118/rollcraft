/**
 * The gym page — what an invite link opens. Roster, record, join button,
 * share link, team photo. The recruitment surface of the Identity Engine.
 * Route: /#/gym?id=<slug>  (captured from grapplequest.com/g/<slug>)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadPlayer } from '../state/saveLoad';
import { fetchGym, joinGym, getMyGym, gymUrl, clearPendingGym, type GymInfo, type GymMember } from '../engine/gyms';
import { renderTeamPhoto, shareCanvas } from '../engine/shareCard';
import { track } from '../engine/analytics';
import type { Belt } from '../engine/types';

const BELT_COLORS: Record<Belt, string> = {
  white: '#ffffff', blue: '#4488ff', purple: '#aa55ff', brown: '#cc8844', black: '#888888',
};

export default function GymPageScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const gymId = params.get('id') || '';
  const player = loadPlayer();

  const [gym, setGym] = useState<GymInfo | null>(null);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'join' | 'photo' | null>(null);
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState(false);

  const myGym = getMyGym();
  const isMember = joined || myGym?.gymId === gymId;

  useEffect(() => {
    if (!gymId) { setError('No gym specified'); return; }
    fetchGym(gymId)
      .then(d => { setGym(d.gym); setMembers(d.members); })
      .catch(e => setError(e.message || 'Could not load gym'));
  }, [gymId]);

  async function handleJoin() {
    if (!player) {
      // No fighter yet — the create flow opens inside this gym
      navigate('/create');
      return;
    }
    setBusy('join');
    try {
      await joinGym(gymId, player);
      player.gymName = gym?.name || player.gymName;
      const { savePlayer } = await import('../state/saveLoad');
      savePlayer(player);
      setJoined(true);
      const d = await fetchGym(gymId);
      setGym(d.gym); setMembers(d.members);
    } catch (e: any) {
      setError(e.message || 'Join failed');
    } finally {
      setBusy(null);
    }
  }

  async function handleShareLink() {
    const url = gymUrl(gymId);
    const text = `Train with us at ${gym?.name} in Grapple Quest 🥋 ${url}`;
    track('share-clicked', 'gym-link');
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
    } catch { /* sheet closed */ }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* ignore */ }
  }

  async function handleTeamPhoto() {
    if (!gym) return;
    setBusy('photo');
    try {
      const canvas = await renderTeamPhoto(gym.name, gym.id, gym.wins, members);
      await shareCanvas(canvas, `${gym.id}-team.png`, `${gym.name} — Grapple Quest team 🥋 ${gymUrl(gym.id)}`);
      track('team-photo');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="game-shell no-scrollbar" style={{ overflow: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', background: '#0d0d1a', borderBottom: '2px solid #222',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button onClick={() => { clearPendingGym(); navigate(player ? '/overworld' : '/'); }} style={{
          padding: '6px 12px', background: '#1a1a2e', color: '#888',
          fontSize: 'var(--fs-sm)', border: '1px solid #444',
        }}>BACK</button>
        <span style={{ fontSize: 'var(--fs-md)', color: '#ffd700' }}>GYM</span>
        <span style={{ width: 50 }} />
      </div>

      {error && (
        <div style={{ padding: 30, textAlign: 'center', fontSize: 'var(--fs-sm)', color: '#ef4444' }}>{error}</div>
      )}

      {!gym && !error && (
        <div style={{ padding: 30, textAlign: 'center', fontSize: 'var(--fs-sm)', color: '#555' }} className="blink">LOADING...</div>
      )}

      {gym && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Gym banner */}
          <div style={{
            padding: '18px 16px', textAlign: 'center',
            background: '#111', border: `3px solid ${gym.palette?.mat || '#22c55e'}`,
          }}>
            <div style={{ fontSize: 'var(--fs-xl)', color: '#fff', marginBottom: 8 }}>
              {gym.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: '#888' }}>
              {gym.member_count} FIGHTER{gym.member_count === 1 ? '' : 'S'} · {gym.wins} TEAM WINS
            </div>
          </div>

          {/* Actions */}
          {!isMember ? (
            <button
              onClick={handleJoin}
              disabled={busy === 'join'}
              style={{
                padding: '16px', background: '#1a2a1a', color: '#22c55e',
                fontSize: 'var(--fs-md)', border: '2px solid #22c55e',
              }}
            >
              {busy === 'join' ? 'JOINING...' : player ? 'JOIN THIS GYM' : 'CREATE A FIGHTER & JOIN'}
            </button>
          ) : (
            <div style={{
              padding: '10px', textAlign: 'center', fontSize: 'var(--fs-sm)',
              color: '#22c55e', border: '1px solid #22c55e', background: '#0e1a0e',
            }}>
              ✓ YOUR GYM
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleShareLink} style={{
              flex: 1, padding: '10px', background: '#0e1420', color: '#3498db',
              fontSize: 'var(--fs-xs)', border: '1px solid #3498db',
            }}>
              {copied ? '✓ LINK COPIED' : 'SHARE INVITE LINK'}
            </button>
            {members.length > 0 && (
              <button onClick={handleTeamPhoto} disabled={busy === 'photo'} style={{
                flex: 1, padding: '10px', background: '#1a1a0e', color: '#ffd700',
                fontSize: 'var(--fs-xs)', border: '1px solid #8b7500',
              }}>
                {busy === 'photo' ? 'BUILDING...' : '📸 TEAM PHOTO'}
              </button>
            )}
          </div>

          {/* Roster */}
          <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
            <div style={{ fontSize: 'var(--fs-sm)', color: '#ffd700', marginBottom: 8 }}>ROSTER</div>
            {members.length === 0 && (
              <div style={{ fontSize: 'var(--fs-xs)', color: '#555', textAlign: 'center', padding: 12 }}>
                No fighters yet. Be the first on the mat.
              </div>
            )}
            {members.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 4px', borderBottom: '1px solid #1a1a1a',
              }}>
                {m.sprite ? (
                  <img
                    src={`data:image/png;base64,${m.sprite}`}
                    alt="" width={28} height={28}
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <img
                    src={`/sprites/belt-${m.belt}.png`}
                    alt="" width={28} height={28}
                    style={{ imageRendering: 'pixelated' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 'var(--fs-xs)', color: '#ddd' }}>{m.name.toUpperCase()}</span>
                  <span style={{
                    fontSize: 7, marginLeft: 8, padding: '1px 5px',
                    color: BELT_COLORS[m.belt] || '#888',
                    border: `1px solid ${BELT_COLORS[m.belt] || '#888'}66`,
                  }}>
                    {m.belt.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: 'var(--fs-xs)', color: '#22c55e' }}>{m.wins}W</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
