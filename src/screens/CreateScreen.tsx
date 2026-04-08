import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STARTER_PATHS, GI_COLORS, type GiColor, type StarterPath } from '../data/starters';
import { STYLE_NAMES } from '../engine/constants';
import { rollIVs } from '../engine/random';
import { savePlayer, saveOpponent } from '../state/saveLoad';
import type { Grappler } from '../engine/types';
import { ARCHETYPES } from '../data/archetypes';

function makeId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

type Phase = 'name' | 'gym' | 'gi' | 'intro' | 'choice' | 'narrative' | 'ready';

function createPlayerGrappler(path: StarterPath, name: string, giColor: string, gymName: string, coachName: string): Grappler {
  return {
    id: makeId(),
    name,
    style: path.style,
    belt: 'white',
    xp: 0,
    baseStats: path.baseStats,
    ivs: rollIVs(),
    evs: { str: 0, tec: 0, tgh: 0, flx: 0, spd: 0, end: 0 },
    moves: path.moves,
    learnedMoves: [...path.moves],
    giColor,
    gymName,
    coachName,
  };
}

function createRandomOpponent(): Grappler {
  const arch = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
  const names = ['Renzo', 'Rickson', 'Marcelo', 'Keenan', 'Gordon', 'Lachlan', 'Mikey', 'Nicky'];
  return {
    id: makeId(),
    name: names[Math.floor(Math.random() * names.length)],
    style: arch.style,
    belt: 'white',
    xp: 0,
    baseStats: arch.baseStats,
    ivs: rollIVs(),
    evs: { str: 0, tec: 0, tgh: 0, flx: 0, spd: 0, end: 0 },
    moves: arch.startingMoves,
    learnedMoves: [...arch.startingMoves],
  };
}

export default function CreateScreen() {
  const [phase, setPhase] = useState<Phase>('name');
  const [name, setName] = useState('');
  const [gymName, setGymName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [giColor, setGiColor] = useState<GiColor>('white');
  const [selectedPath, setSelectedPath] = useState<number | null>(null);
  const [narrativeLine, setNarrativeLine] = useState(0);
  const [introLine, setIntroLine] = useState(0);
  const navigate = useNavigate();

  const academyName = gymName.trim() || 'the academy';
  const introText = [
    `You push open the door to ${academyName}.`,
    "The mats are warm. Music is playing.",
    "Training is already underway...",
    "You see three groups drilling:",
  ];

  // Auto-advance intro text
  useEffect(() => {
    if (phase !== 'intro') return;
    if (introLine >= introText.length) {
      setPhase('choice');
      return;
    }
    const timer = setTimeout(() => setIntroLine(i => i + 1), 1800);
    return () => clearTimeout(timer);
  }, [phase, introLine]);

  // Auto-advance narrative text
  useEffect(() => {
    if (phase !== 'narrative' || selectedPath === null) return;
    const path = STARTER_PATHS[selectedPath];
    if (narrativeLine >= path.narrative.length) {
      setPhase('ready');
      return;
    }
    const timer = setTimeout(() => setNarrativeLine(n => n + 1), 2000);
    return () => clearTimeout(timer);
  }, [phase, narrativeLine, selectedPath]);

  const handleNameSubmit = () => {
    if (name.trim().length === 0) return;
    setPhase('gym');
  };

  const handleGymSubmit = () => {
    setPhase('gi');
  };

  const handleGiSelect = (color: GiColor) => {
    setGiColor(color);
    setPhase('intro');
  };

  const handlePathSelect = (index: number) => {
    setSelectedPath(index);
    setNarrativeLine(0);
    setPhase('narrative');
  };

  const handleStart = () => {
    if (selectedPath === null) return;
    const path = STARTER_PATHS[selectedPath];
    const giHex = GI_COLORS[giColor].primary;
    const player = createPlayerGrappler(path, name.trim(), giHex, gymName.trim(), coachName.trim());
    const opponent = createRandomOpponent();
    savePlayer(player);
    saveOpponent(opponent);
    navigate('/overworld');
  };

  // Skip ahead on tap during intro/narrative
  const handleTap = () => {
    if (phase === 'intro' && introLine < introText.length) {
      setIntroLine(introText.length);
      setPhase('choice');
    } else if (phase === 'narrative' && selectedPath !== null) {
      const path = STARTER_PATHS[selectedPath];
      if (narrativeLine < path.narrative.length) {
        setNarrativeLine(path.narrative.length);
        setPhase('ready');
      }
    }
  };

  return (
    <div
      onClick={phase === 'intro' || phase === 'narrative' ? handleTap : undefined}
      style={{
        width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        background: '#0a0a14', padding: 24, gap: 20, overflow: 'hidden',
      }}
    >
      {/* ═══ NAME PHASE ═══ */}
      {phase === 'name' && (
        <>
          <div style={{ fontSize: '0.6rem', color: '#ffd700', textAlign: 'center', lineHeight: 2 }}>
            WHAT'S YOUR NAME,<br />FIGHTER?
          </div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
            placeholder="ENTER NAME"
            maxLength={12}
            autoFocus
            style={{
              width: '100%', maxWidth: 280, padding: '12px 16px', background: '#111',
              border: '2px solid #ffd700', color: '#fff',
              fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem',
              textAlign: 'center',
            }}
          />
          <button
            onClick={handleNameSubmit}
            disabled={name.trim().length === 0}
            style={{
              padding: '12px 40px', background: name.trim() ? '#ffd700' : '#333',
              color: name.trim() ? '#000' : '#666',
              fontSize: '0.55rem', minWidth: 200,
            }}
          >
            CONTINUE
          </button>
        </>
      )}

      {/* ═══ GYM + COACH PHASE ═══ */}
      {phase === 'gym' && (
        <>
          <div style={{ fontSize: '0.5rem', color: '#ffd700', textAlign: 'center', lineHeight: 2 }}>
            YOUR HOME GYM
          </div>
          <input
            type="text"
            value={gymName}
            onChange={e => setGymName(e.target.value)}
            placeholder="GYM NAME"
            maxLength={20}
            autoFocus
            style={{
              width: '100%', maxWidth: 280, padding: '10px 16px', background: '#111',
              border: '2px solid #333', color: '#fff',
              fontFamily: "'Press Start 2P', monospace", fontSize: '0.45rem',
              textAlign: 'center',
            }}
          />
          <div style={{ fontSize: '0.5rem', color: '#ffd700', textAlign: 'center', lineHeight: 2, marginTop: 8 }}>
            YOUR COACH
          </div>
          <input
            type="text"
            value={coachName}
            onChange={e => setCoachName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGymSubmit()}
            placeholder="COACH NAME"
            maxLength={16}
            style={{
              width: '100%', maxWidth: 280, padding: '10px 16px', background: '#111',
              border: '2px solid #333', color: '#fff',
              fontFamily: "'Press Start 2P', monospace", fontSize: '0.45rem',
              textAlign: 'center',
            }}
          />
          <button
            onClick={handleGymSubmit}
            style={{
              marginTop: 8, padding: '12px 40px', background: '#ffd700',
              color: '#000', fontSize: '0.55rem', minWidth: 200,
            }}
          >
            CONTINUE
          </button>
          <div style={{ fontSize: '0.28rem', color: '#555', textAlign: 'center', marginTop: 4 }}>
            (optional — leave blank for defaults)
          </div>
        </>
      )}

      {/* ═══ GI COLOR PHASE ═══ */}
      {phase === 'gi' && (
        <>
          <div style={{ fontSize: '0.55rem', color: '#ffd700', textAlign: 'center', lineHeight: 2 }}>
            PICK YOUR GI
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {(Object.keys(GI_COLORS) as GiColor[]).map(color => {
              const gc = GI_COLORS[color];
              return (
                <button
                  key={color}
                  onClick={() => handleGiSelect(color)}
                  style={{
                    width: 80, height: 100, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#111', border: '2px solid #444',
                  }}
                >
                  {/* Mini gi preview */}
                  <div style={{
                    width: 36, height: 44, background: gc.primary,
                    border: `2px solid ${gc.accent}`, position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', top: '45%', left: 0, right: 0,
                      height: 4, background: '#fff',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.35rem', color: '#aaa' }}>{gc.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ INTRO TEXT CRAWL ═══ */}
      {phase === 'intro' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 16, maxWidth: 320,
        }}>
          {introText.slice(0, introLine).map((line, i) => (
            <div key={i} style={{
              fontSize: '0.45rem', color: i === introLine - 1 ? '#e0e0e0' : '#666',
              textAlign: 'center', lineHeight: 1.8,
              animation: 'slideUp 0.5s ease',
            }}>
              {line}
            </div>
          ))}
          <div style={{ fontSize: '0.3rem', color: '#444', marginTop: 20 }} className="blink">
            TAP TO SKIP
          </div>
        </div>
      )}

      {/* ═══ CHOICE PHASE — The 3 Groups ═══ */}
      {phase === 'choice' && (
        <>
          <div style={{ fontSize: '0.5rem', color: '#ffd700', textAlign: 'center', marginBottom: 8 }}>
            WHO DO YOU WALK TOWARD?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
            {STARTER_PATHS.map((path, i) => (
              <button
                key={path.id}
                onClick={() => handlePathSelect(i)}
                style={{
                  padding: '14px 16px', background: '#111',
                  border: '2px solid #333', color: '#fff',
                  textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6,
                }}
              >
                <span style={{ fontSize: '0.55rem', color: '#ffd700' }}>
                  {path.title}
                </span>
                <span style={{ fontSize: '0.35rem', color: '#999', lineHeight: 1.6 }}>
                  {path.scene}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ═══ NARRATIVE PHASE ═══ */}
      {phase === 'narrative' && selectedPath !== null && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 16, maxWidth: 320,
        }}>
          {STARTER_PATHS[selectedPath].narrative.slice(0, narrativeLine).map((line, i) => (
            <div key={i} style={{
              fontSize: '0.45rem',
              color: line.startsWith('"') ? '#ffd700' : '#e0e0e0',
              textAlign: 'center', lineHeight: 1.8,
              fontStyle: line.startsWith('"') ? 'italic' : 'normal',
              animation: 'slideUp 0.5s ease',
            }}>
              {line}
            </div>
          ))}
          <div style={{ fontSize: '0.3rem', color: '#444', marginTop: 20 }} className="blink">
            TAP TO SKIP
          </div>
        </div>
      )}

      {/* ═══ READY PHASE ═══ */}
      {phase === 'ready' && selectedPath !== null && (
        <>
          <div style={{ fontSize: '0.5rem', color: '#ffd700', textAlign: 'center', lineHeight: 2 }}>
            {STARTER_PATHS[selectedPath].instructorName.toUpperCase()}
          </div>
          <div style={{
            fontSize: '0.4rem', color: '#ccc', textAlign: 'center',
            fontStyle: 'italic', lineHeight: 1.8, maxWidth: 300,
          }}>
            "{STARTER_PATHS[selectedPath].instructorQuote}"
          </div>
          <div style={{
            marginTop: 8, padding: '10px 16px', background: '#111',
            border: '1px solid #333', fontSize: '0.35rem', color: '#888',
            textAlign: 'center', lineHeight: 1.8,
          }}>
            Style: {STYLE_NAMES[STARTER_PATHS[selectedPath].style]}<br />
            Moves: {STARTER_PATHS[selectedPath].moves.length} starting techniques
          </div>
          <button
            onClick={handleStart}
            style={{
              marginTop: 12, padding: '14px 40px', background: '#ffd700',
              color: '#000', fontSize: '0.6rem', minWidth: 240,
            }}
          >
            YOUR FIRST ROLL
          </button>
          <button
            onClick={() => { setPhase('choice'); setSelectedPath(null); }}
            style={{
              padding: '8px 20px', background: 'transparent',
              color: '#666', fontSize: '0.4rem', border: '1px solid #333',
            }}
          >
            GO BACK
          </button>
        </>
      )}
    </div>
  );
}
