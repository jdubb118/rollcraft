import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../engine/supabase';

// Supabase magic-link redirects here. supabase-js auto-detects the session in the URL
// (we set detectSessionInUrl: true), so we just wait for the session to settle.
export default function AuthCallbackScreen() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setMsg('Cloud sync not configured.'); return; }

    let done = false;
    const finish = (path: string) => {
      if (done) return;
      done = true;
      setTimeout(() => navigate(path), 500);
    };

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) { setMsg('Signed in! Loading your save…'); finish('/'); }
    });

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        setMsg('Signed in! Loading your save…');
        finish('/');
      }
    });

    const timeout = setTimeout(() => {
      if (!done) { setMsg('Sign-in took too long. Try again from Settings.'); finish('/settings'); }
    }, 8000);

    return () => { sub.subscription.unsubscribe(); clearTimeout(timeout); };
  }, [navigate]);

  return (
    <div className="game-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ color: '#ffd700', fontSize: 'var(--fs-md)' }}>GRAPPLE QUEST</div>
      <div style={{ color: '#ccc', fontSize: 'var(--fs-xs)' }}>{msg}</div>
    </div>
  );
}
