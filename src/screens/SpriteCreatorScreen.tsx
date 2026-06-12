/**
 * The Character Forge (re-roll surface) — identity creation lives in
 * onboarding; this screen re-forges your fighter from a new photo.
 * Generation runs in the background; the reveal fires on the overworld.
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPlayer } from '../state/saveLoad';
import { fileToSquarePng, startCharacterForge, getPendingCharacterJob } from '../engine/characters';

export default function SpriteCreatorScreen() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<'idle' | 'working' | 'started' | 'error'>(
    getPendingCharacterJob() ? 'started' : 'idle'
  );
  const [error, setError] = useState('');
  const playerData = loadPlayer();
  if (!playerData) { navigate('/'); return null; }
  const player = playerData;

  async function handlePhoto(file: File) {
    setPhase('working');
    setError('');
    try {
      const b64 = await fileToSquarePng(file, 512);
      const r = await startCharacterForge(b64, player.giColor);
      if (!r.ok) { setError(r.error); setPhase('error'); return; }
      setPhase('started');
    } catch {
      setError('Could not read that photo. Try another.');
      setPhase('error');
    }
  }

  return (
    <div className="game-shell" style={{
      justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24,
    }}>
      <div style={{ fontSize: 'var(--fs-lg)', color: '#ffd700', textAlign: 'center' }}>
        THE CHARACTER FORGE
      </div>

      {/* Current fighter */}
      {player.customSprites?.south && phase === 'idle' && (
        <img
          src={`data:image/png;base64,${player.customSprites.south}`}
          alt="current fighter"
          style={{ width: 96, height: 96, imageRendering: 'pixelated', border: '2px solid #333' }}
        />
      )}

      {(phase === 'idle' || phase === 'error') && (
        <>
          <div style={{ fontSize: 'var(--fs-xs)', color: '#888', textAlign: 'center', lineHeight: 1.8, maxWidth: 300 }}>
            {player.customSprites
              ? 'Re-forge your fighter from a new photo. The old one is replaced.'
              : 'Upload a photo and we forge a pixel fighter of YOU — full body, your gi, all four directions.'}
          </div>

          <input
            ref={fileRef}
            type="file" accept="image/*"
            // no `capture` attr — iOS would force the camera and hide the gallery
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhoto(file);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              padding: '14px 30px', background: '#1a2a1a',
              color: '#22c55e', fontSize: 'var(--fs-md)', border: '2px solid #22c55e',
              width: '100%', maxWidth: 280,
            }}
          >
            📷 TAKE / UPLOAD PHOTO
          </button>
          {error && (
            <div style={{ fontSize: 'var(--fs-xs)', color: '#ef4444', textAlign: 'center', maxWidth: 280 }}>{error}</div>
          )}
        </>
      )}

      {phase === 'working' && (
        <div style={{ fontSize: 'var(--fs-md)', color: '#ffd700' }} className="blink">READING PHOTO...</div>
      )}

      {phase === 'started' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--fs-md)', color: '#ffd700', marginBottom: 12 }} className="blink">
            ⚒ FORGING YOUR FIGHTER
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: '#888', lineHeight: 1.9 }}>
            Takes a couple of minutes. Keep training —<br />
            we'll reveal it on the mats when it's ready.
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/overworld')}
        style={{
          padding: '10px 24px', background: '#111', color: '#888',
          fontSize: 'var(--fs-sm)', border: '1px solid #444',
        }}
      >
        {phase === 'started' ? 'BACK TO TRAINING' : 'BACK'}
      </button>
    </div>
  );
}
