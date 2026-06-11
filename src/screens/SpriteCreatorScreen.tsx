import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPlayer, savePlayer } from '../state/saveLoad';
import { track } from '../engine/analytics';

type CreatorPhase = 'upload' | 'generating' | 'preview' | 'error';

// Per-device generation budget — AI sprite gens cost real money, so each
// device gets a handful. The server enforces a global monthly cap on top.
const GEN_COUNT_KEY = 'rollcraft-sprite-gens-used';
const DEVICE_GEN_CAP = 5;

function getGensUsed(): number {
  return parseInt(localStorage.getItem(GEN_COUNT_KEY) || '0', 10) || 0;
}

export default function SpriteCreatorScreen() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<CreatorPhase>('upload');
  const [gensUsed, setGensUsed] = useState(getGensUsed());
  const [preview, setPreview] = useState<string | null>(null);
  const [spriteData, setSpriteData] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const playerData = loadPlayer();
  if (!playerData) { navigate('/'); return null; }
  const player = playerData;

  function consumeGen() {
    const used = getGensUsed() + 1;
    localStorage.setItem(GEN_COUNT_KEY, String(used));
    setGensUsed(used);
    track('sprite-gen');
  }

  async function handlePhotoUpload(file: File) {
    if (getGensUsed() >= DEVICE_GEN_CAP) {
      setError(`You've used all ${DEVICE_GEN_CAP} sprite generations on this device.`);
      setPhase('error');
      return;
    }
    setPhase('generating');
    setError('');

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // strip data:image/...;base64, prefix
        };
        reader.readAsDataURL(file);
      });

      // Show uploaded photo as preview
      setPreview(`data:image/png;base64,${base64}`);

      // Call our Netlify function
      const res = await fetch('/api/create-sprite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo: base64,
          description: `${player.name} BJJ fighter in ${player.giColor === '#e8e8e0' ? 'white' : player.giColor === '#2563eb' ? 'blue' : 'black'} gi, ${player.belt} belt, standing fighting stance, front facing, full body, pixel art game character sprite`,
          size: 32,
        }),
      });

      const data = await res.json();
      if (data.image) {
        consumeGen();
        setSpriteData(data.image);
        setPhase('preview');
      } else {
        setError(data.error || 'Failed to generate sprite');
        setPhase('error');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      setPhase('error');
    }
  }

  async function handleGenerateFromDescription() {
    if (getGensUsed() >= DEVICE_GEN_CAP) {
      setError(`You've used all ${DEVICE_GEN_CAP} sprite generations on this device.`);
      setPhase('error');
      return;
    }
    setPhase('generating');
    setError('');

    try {
      const res = await fetch('/api/create-sprite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          belt: player.belt,
          size: 32,
        }),
      });

      const data = await res.json();
      if (data.image) {
        consumeGen();
        setSpriteData(data.image);
        setPhase('preview');
      } else {
        setError(data.error || 'Failed to generate sprite');
        setPhase('error');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      setPhase('error');
    }
  }

  function handleSaveSprite() {
    if (!spriteData || !player) return;
    // Store custom sprite on player
    player.customSprite = spriteData;
    savePlayer(player);
    navigate('/overworld');
  }

  return (
    <div className="game-shell" style={{
      justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24,
    }}>
      {/* Header */}
      <div style={{ fontSize: 'var(--fs-lg)', color: '#ffd700', textAlign: 'center' }}>
        CREATE YOUR SPRITE
      </div>

      {/* Upload phase */}
      {phase === 'upload' && (
        <>
          <div style={{ fontSize: 'var(--fs-xs)', color: '#888', textAlign: 'center', lineHeight: 1.8 }}>
            Upload a photo of yourself to create<br/>a custom pixel art fighter!
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: '#555' }}>
            {Math.max(0, DEVICE_GEN_CAP - gensUsed)}/{DEVICE_GEN_CAP} generations left
          </div>

          {/* Photo upload */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
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
            UPLOAD PHOTO
          </button>

          {/* Or generate from belt level */}
          <div style={{ fontSize: 'var(--fs-xs)', color: '#555', marginTop: 8 }}>— or —</div>
          <button
            onClick={handleGenerateFromDescription}
            style={{
              padding: '12px 24px', background: '#1a1a2e',
              color: '#ffd700', fontSize: 'var(--fs-sm)', border: '2px solid #ffd700',
              width: '100%', maxWidth: 280,
            }}
          >
            GENERATE {player.belt.toUpperCase()} BELT SPRITE
          </button>

          <button
            onClick={() => navigate('/overworld')}
            style={{
              padding: '8px 20px', background: '#111', color: '#666',
              fontSize: 'var(--fs-xs)', border: '1px solid #333',
            }}
          >
            BACK
          </button>
        </>
      )}

      {/* Generating */}
      {phase === 'generating' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--fs-md)', color: '#ffd700', marginBottom: 16 }} className="blink">
            GENERATING SPRITE...
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: '#888' }}>
            AI is creating your pixel art fighter.<br/>
            This may take 30-90 seconds.
          </div>
          {preview && (
            <img src={preview} alt="Your photo" style={{
              width: 64, height: 64, borderRadius: 8, marginTop: 16,
              objectFit: 'cover', border: '2px solid #333',
            }} />
          )}
        </div>
      )}

      {/* Preview */}
      {phase === 'preview' && spriteData && (
        <>
          <div style={{ fontSize: 'var(--fs-sm)', color: '#22c55e', marginBottom: 8 }}>
            YOUR CUSTOM SPRITE
          </div>

          {/* Sprite display — scaled up for visibility */}
          <div style={{
            width: 128, height: 128, border: '3px solid #ffd700',
            background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center',
            imageRendering: 'pixelated',
          }}>
            <img
              src={`data:image/png;base64,${spriteData}`}
              alt="Your sprite"
              style={{ width: 128, height: 128, imageRendering: 'pixelated' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, width: '100%', maxWidth: 280, flexDirection: 'column' }}>
            <button
              onClick={handleSaveSprite}
              style={{
                padding: '14px', background: '#1a2a1a',
                color: '#22c55e', fontSize: 'var(--fs-md)', border: '2px solid #22c55e',
              }}
            >
              USE THIS SPRITE
            </button>
            <button
              onClick={() => setPhase('upload')}
              style={{
                padding: '10px', background: '#1a1a2e',
                color: '#888', fontSize: 'var(--fs-xs)', border: '1px solid #444',
              }}
            >
              TRY AGAIN
            </button>
          </div>
        </>
      )}

      {/* Error */}
      {phase === 'error' && (
        <>
          <div style={{ fontSize: 'var(--fs-sm)', color: '#ef4444', textAlign: 'center' }}>
            {error || 'Something went wrong'}
          </div>
          <button
            onClick={() => setPhase('upload')}
            style={{
              padding: '12px 24px', background: '#1a1a2e',
              color: '#888', fontSize: 'var(--fs-sm)', border: '1px solid #444',
            }}
          >
            TRY AGAIN
          </button>
        </>
      )}
    </div>
  );
}
