import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, saveSettings } from '../engine/settings';
import { refreshAudio } from '../engine/audio';
import { subscribeAuth, sendMagicLink, signOut, deleteAccount, isSupabaseConfigured } from '../engine/auth';
import type { AuthState } from '../engine/auth';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const [s, setS] = useState(getSettings());
  const [auth, setAuth] = useState<AuthState>({ user: null, session: null, slug: null, displayName: null });
  const [email, setEmail] = useState('');
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => subscribeAuth(setAuth), []);

  const update = (patch: Partial<typeof s>) => {
    const next = saveSettings(patch);
    setS(next);
    refreshAudio();
  };

  const onSendLink = async () => {
    if (!email.includes('@')) { setAuthMsg('Enter a valid email.'); return; }
    setSending(true); setAuthMsg(null);
    const r = await sendMagicLink(email);
    setSending(false);
    setAuthMsg(r.ok ? 'Magic link sent. Check your email.' : `Error: ${r.error}`);
  };

  const onSignOut = async () => { await signOut(); setAuthMsg('Signed out.'); };
  const onDelete = async () => {
    if (!confirm('Delete your account? Cloud save will be permanently removed. Local save stays until you wipe it.')) return;
    const r = await deleteAccount();
    setAuthMsg(r.ok ? 'Account deleted.' : `Error: ${r.error}`);
  };

  const label = { color: '#ffd700', fontSize: 'var(--fs-xs)', marginBottom: 4 } as const;
  const row   = { display: 'flex', flexDirection: 'column' as const, gap: 6, padding: '10px 0', borderBottom: '1px solid #222' };

  return (
    <div className="game-shell" style={{ overflow: 'auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ color: '#ffd700', fontSize: 'var(--fs-md)' }}>SETTINGS</div>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '6px 10px', background: '#1a1a2e', color: '#ccc', border: '1px solid #444', fontSize: 'var(--fs-xs)' }}
        >
          BACK
        </button>
      </div>

      <div style={row}>
        <div style={label}>MUTE</div>
        <button
          onClick={() => update({ muted: !s.muted })}
          style={{
            padding: '8px 12px', textAlign: 'left',
            background: s.muted ? '#3a1a1a' : '#1a2a1a',
            border: `1px solid ${s.muted ? '#ef4444' : '#22c55e'}`,
            color: s.muted ? '#ef4444' : '#22c55e', fontSize: 'var(--fs-xs)',
          }}
        >
          {s.muted ? '► MUTED — click to unmute' : '► SOUND ON — click to mute'}
        </button>
      </div>

      <div style={row}>
        <div style={label}>MASTER VOLUME — {Math.round(s.masterVolume * 100)}%</div>
        <input
          type="range" min={0} max={100} step={5}
          value={Math.round(s.masterVolume * 100)}
          onChange={(e) => update({ masterVolume: Number(e.target.value) / 100 })}
          style={{ width: '100%' }}
        />
      </div>

      <div style={row}>
        <div style={label}>SFX VOLUME — {Math.round(s.sfxVolume * 100)}%</div>
        <input
          type="range" min={0} max={100} step={5}
          value={Math.round(s.sfxVolume * 100)}
          onChange={(e) => update({ sfxVolume: Number(e.target.value) / 100 })}
          style={{ width: '100%' }}
        />
      </div>

      <div style={row}>
        <div style={label}>MUSIC VOLUME — {Math.round(s.bgmVolume * 100)}%</div>
        <input
          type="range" min={0} max={100} step={5}
          value={Math.round(s.bgmVolume * 100)}
          onChange={(e) => update({ bgmVolume: Number(e.target.value) / 100 })}
          style={{ width: '100%' }}
        />
      </div>

      <div style={row}>
        <div style={label}>MODERN VISUALS</div>
        <button
          onClick={() => update({ modernVisuals: !s.modernVisuals })}
          style={{
            padding: '8px 12px', textAlign: 'left',
            background: s.modernVisuals ? '#1a2a1a' : '#1a1a2a',
            border: `1px solid ${s.modernVisuals ? '#22c55e' : '#888'}`,
            color: s.modernVisuals ? '#22c55e' : '#ccc', fontSize: 'var(--fs-xs)',
          }}
        >
          {s.modernVisuals ? '► ON — ambient life, shake, tint, particles' : '► OFF — classic Gameboy style'}
        </button>
      </div>

      <div style={row}>
        <div style={label}>ACCOUNT</div>
        {!isSupabaseConfigured() ? (
          <div style={{ color: '#888', fontSize: 'var(--fs-xs)' }}>Cloud sync not configured.</div>
        ) : auth.user ? (
          <>
            <div style={{ color: '#22c55e', fontSize: 'var(--fs-xs)' }}>
              ✓ Signed in as <b>{auth.user.email}</b>
              {auth.slug ? <> — <span style={{ color: '#ffd700' }}>/f/{auth.slug}</span></> : null}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button
                onClick={onSignOut}
                style={{ padding: '6px 10px', background: '#1a1a2e', color: '#ccc', border: '1px solid #444', fontSize: 'var(--fs-xs)' }}
              >SIGN OUT</button>
              <button
                onClick={onDelete}
                style={{ padding: '6px 10px', background: '#3a1a1a', color: '#ef4444', border: '1px solid #ef4444', fontSize: 'var(--fs-xs)' }}
              >DELETE ACCOUNT</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ color: '#aaa', fontSize: 'var(--fs-xs)', marginBottom: 6 }}>
              Save your progress to the cloud. We'll email you a magic link.
            </div>
            <input
              type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '8px 10px', background: '#0a0a14', color: '#fff', border: '1px solid #444', fontSize: 'var(--fs-xs)', width: '100%' }}
            />
            <button
              onClick={onSendLink} disabled={sending}
              style={{ marginTop: 6, padding: '8px 12px', background: sending ? '#222' : '#1a2a1a', color: sending ? '#666' : '#22c55e', border: '1px solid #22c55e', fontSize: 'var(--fs-xs)', cursor: sending ? 'wait' : 'pointer' }}
            >{sending ? 'SENDING…' : '► EMAIL ME A SIGN-IN LINK'}</button>
          </>
        )}
        {authMsg ? <div style={{ marginTop: 6, color: '#ffd700', fontSize: 'var(--fs-xs)' }}>{authMsg}</div> : null}
      </div>

      <div style={{ marginTop: 20, color: '#666', fontSize: 'var(--fs-xs)', lineHeight: 1.6 }}>
        Regional music is wired but tracks aren't shipped yet — drop OGG files at <code>public/audio/bgm/[region].ogg</code> to hear them.
      </div>
    </div>
  );
}
