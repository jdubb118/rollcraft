import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STARTER_PATHS, GI_COLORS, type GiColor, type StarterPath } from '../data/starters';
import { STYLE_NAMES } from '../engine/constants';
import { rollIVs } from '../engine/random';
import { savePlayer, saveOpponent } from '../state/saveLoad';
import type { Grappler, Frame, Style } from '../engine/types';
import { ARCHETYPES } from '../data/archetypes';
import { RIVAL_NAME, RIVAL_STYLE_MAP } from '../data/storyArc';

function makeId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// One smooth cinematic: setup → gym → style → train → rival → go
type Phase =
  | 'name' | 'gym' | 'gi'             // setup
  | 'cinematic'                         // walking into the gym + coach greeting
  | 'choice'                            // pick your training group
  | 'training'                          // instructor teaches you
  | 'moves-unlocked'                    // NEW MOVES UNLOCKED screen
  | 'rival-intro'                       // Kenzo approaches
  | 'rival-battle'                      // fight Kenzo (navigates to /battle)
  | 'rival-aftermath';                  // Kenzo storms out, coach reacts

const STYLE_FRAME: Record<Style, Frame> = {
  'wrestler': 'heavy', 'judoka': 'heavy', 'pressure-passer': 'heavy',
  'guard-player': 'light', 'leg-locker': 'light', 'berimbolo': 'light',
  'sub-hunter': 'medium', 'controller': 'medium',
};

function createPlayerGrappler(path: StarterPath, name: string, giColor: string, gymName: string, coachName: string): Grappler {
  return {
    id: makeId(), name, style: path.style, belt: 'white', xp: 0,
    baseStats: path.baseStats, ivs: rollIVs(),
    evs: { str: 0, tec: 0, tgh: 0, flx: 0, spd: 0, end: 0 },
    moves: path.moves, learnedMoves: [...path.moves],
    frame: STYLE_FRAME[path.style], giColor, gymName, coachName,
  };
}

function createKenzo(playerStyle: Style): Grappler {
  const kenzoStyle = RIVAL_STYLE_MAP[playerStyle] || 'pressure-passer';
  const arch = ARCHETYPES.find(a => a.style === kenzoStyle) || ARCHETYPES[0];
  return {
    id: 'kenzo', name: RIVAL_NAME, style: kenzoStyle, belt: 'white', xp: 0,
    baseStats: { ...arch.baseStats, str: Math.max(40, arch.baseStats.str - 15), tec: Math.max(40, arch.baseStats.tec - 10) },
    ivs: { str: 5, tec: 5, tgh: 5, flx: 5, spd: 5, end: 5 }, // weaker IVs — player should win
    evs: { str: 0, tec: 0, tgh: 0, flx: 0, spd: 0, end: 0 },
    moves: arch.startingMoves.slice(0, 3), // fewer moves
    learnedMoves: [...arch.startingMoves.slice(0, 3)],
    frame: STYLE_FRAME[kenzoStyle],
  };
}

export default function CreateScreen() {
  const [phase, setPhase] = useState<Phase>('name');
  const [name, setName] = useState('');
  const [gymName, setGymName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [giColor, setGiColor] = useState<GiColor>('white');
  const [selectedPath, setSelectedPath] = useState<number | null>(null);
  const [textLine, setTextLine] = useState(0);
  const navigate = useNavigate();

  const coach = coachName.trim() || 'Prof. Helio';
  const gym = gymName.trim() || 'the academy';

  // Check if returning from onboarding battle
  useEffect(() => {
    const showAftermath = localStorage.getItem('rollcraft-show-aftermath');
    if (showAftermath) {
      localStorage.removeItem('rollcraft-show-aftermath');
      setTextLine(0);
      setPhase('rival-aftermath');
    }
  }, []);

  // ── Cinematic text (one smooth scene) ──
  const cinematicLines = [
    `You push open the door to ${gym}.`,
    "The mats are warm. Music is playing.",
    "Class is already underway.",
    "",
    `A voice from the front: "${coach}."`,
    `"Hey — first day? Welcome."`,
    `"Don't overthink it. Don't get frustrated."`,
    `"Make yourself at home."`,
    "",
    "You look around the room...",
    "Three groups are drilling.",
    "Who do you partner with?",
  ];

  // Auto-advance cinematic
  useEffect(() => {
    if (phase !== 'cinematic') return;
    if (textLine >= cinematicLines.length) { setPhase('choice'); return; }
    const line = cinematicLines[textLine];
    const delay = line === "" ? 800 : line.length < 25 ? 1500 : 2000;
    const timer = setTimeout(() => setTextLine(i => i + 1), delay);
    return () => clearTimeout(timer);
  }, [phase, textLine]);

  // Training narrative auto-advance
  useEffect(() => {
    if (phase !== 'training' || selectedPath === null) return;
    const path = STARTER_PATHS[selectedPath];
    if (textLine >= path.narrative.length) { setPhase('moves-unlocked'); return; }
    const timer = setTimeout(() => setTextLine(i => i + 1), 2000);
    return () => clearTimeout(timer);
  }, [phase, textLine, selectedPath]);

  // Rival intro auto-advance
  const rivalIntroLines = [
    "After class, a guy your age walks up.",
    `"${RIVAL_NAME}." He doesn't shake your hand.`,
    `"I started today too. Heard you looked decent."`,
    `"Let's roll. I want to see what you've got."`,
  ];

  useEffect(() => {
    if (phase !== 'rival-intro') return;
    if (textLine >= rivalIntroLines.length) return; // wait for player to accept
    const timer = setTimeout(() => setTextLine(i => i + 1), 2000);
    return () => clearTimeout(timer);
  }, [phase, textLine]);

  // Rival aftermath auto-advance
  const aftermathLines = [
    `${RIVAL_NAME} stands up. His face is red.`,
    `"Whatever. You got lucky."`,
    `"This place is beneath me."`,
    `${RIVAL_NAME} grabs his bag and storms out.`,
    "",
    `${coach} watches him leave.`,
    `"Hmm. That one has talent."`,
    `"But talent without humility..."`,
    `"Keep training. You'll see him again."`,
  ];

  useEffect(() => {
    if (phase !== 'rival-aftermath') return;
    if (textLine >= aftermathLines.length) {
      // Save player and enter the game
      if (selectedPath !== null) {
        const path = STARTER_PATHS[selectedPath];
        const player = createPlayerGrappler(path, name.trim(), GI_COLORS[giColor].primary, gymName.trim(), coachName.trim());
        savePlayer(player);
        // Mark story flag
        localStorage.setItem('rollcraft-story-rival-origin', 'true');
        navigate('/overworld');
      }
      return;
    }
    const line = aftermathLines[textLine];
    const delay = line === "" ? 1000 : 2000;
    const timer = setTimeout(() => setTextLine(i => i + 1), delay);
    return () => clearTimeout(timer);
  }, [phase, textLine]);

  // ── Handlers ──
  const handleTap = () => {
    if (phase === 'cinematic') { setTextLine(cinematicLines.length); setPhase('choice'); }
    else if (phase === 'training' && selectedPath !== null) {
      setTextLine(STARTER_PATHS[selectedPath].narrative.length); setPhase('moves-unlocked');
    }
    else if (phase === 'rival-aftermath') {
      if (selectedPath !== null) {
        const path = STARTER_PATHS[selectedPath];
        const player = createPlayerGrappler(path, name.trim(), GI_COLORS[giColor].primary, gymName.trim(), coachName.trim());
        savePlayer(player);
        localStorage.setItem('rollcraft-story-rival-origin', 'true');
        navigate('/overworld');
      }
    }
  };

  const isCinematic = ['cinematic', 'training', 'rival-intro', 'rival-aftermath'].includes(phase);

  // Force clean repaint on phase change by using key
  return (
    <div
      key={phase}
      onClick={isCinematic ? handleTap : undefined}
      className="game-shell"
      style={{ justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}
    >

      {/* ═══ NAME ═══ */}
      {phase === 'name' && (
        <>
          <div style={{ fontSize: 'var(--fs-lg)', color: '#ffd700', textAlign: 'center', lineHeight: 2 }}>
            WHAT'S YOUR NAME,<br />FIGHTER?
          </div>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && setPhase('gym')}
            placeholder="ENTER NAME" maxLength={12} autoFocus
            style={{ width: '100%', maxWidth: 280, padding: '12px 16px', background: '#111',
              border: '2px solid #ffd700', color: '#fff', fontFamily: "'Press Start 2P', monospace",
              fontSize: 'var(--fs-md)', textAlign: 'center' }} />
          <button onClick={() => name.trim() && setPhase('gym')} disabled={!name.trim()}
            style={{ padding: '12px 40px', background: name.trim() ? '#ffd700' : '#333',
              color: name.trim() ? '#000' : '#666', fontSize: 'var(--fs-md)', minWidth: 200 }}>
            CONTINUE
          </button>
        </>
      )}

      {/* ═══ GYM + COACH ═══ */}
      {phase === 'gym' && (
        <>
          <div style={{ fontSize: 'var(--fs-md)', color: '#ffd700', textAlign: 'center' }}>YOUR HOME GYM</div>
          <input type="text" value={gymName} onChange={e => setGymName(e.target.value)}
            placeholder="GYM NAME (optional)" maxLength={20} autoFocus
            style={{ width: '100%', maxWidth: 280, padding: '10px 16px', background: '#111',
              border: '2px solid #333', color: '#fff', fontFamily: "'Press Start 2P', monospace",
              fontSize: 'var(--fs-sm)', textAlign: 'center' }} />
          <div style={{ fontSize: 'var(--fs-md)', color: '#ffd700', textAlign: 'center', marginTop: 8 }}>YOUR COACH</div>
          <input type="text" value={coachName} onChange={e => setCoachName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setPhase('gi')}
            placeholder="COACH NAME (optional)" maxLength={16}
            style={{ width: '100%', maxWidth: 280, padding: '10px 16px', background: '#111',
              border: '2px solid #333', color: '#fff', fontFamily: "'Press Start 2P', monospace",
              fontSize: 'var(--fs-sm)', textAlign: 'center' }} />
          <button onClick={() => setPhase('gi')}
            style={{ marginTop: 8, padding: '12px 40px', background: '#ffd700',
              color: '#000', fontSize: 'var(--fs-md)', minWidth: 200 }}>
            CONTINUE
          </button>
        </>
      )}

      {/* ═══ GI COLOR ═══ */}
      {phase === 'gi' && (
        <>
          <div style={{ fontSize: 'var(--fs-md)', color: '#ffd700', textAlign: 'center' }}>PICK YOUR GI</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {(Object.keys(GI_COLORS) as GiColor[]).map(color => {
              const gc = GI_COLORS[color];
              return (
                <button key={color} onClick={() => { setGiColor(color); setTextLine(0); setPhase('cinematic'); }}
                  style={{ width: 80, height: 100, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#111', border: '2px solid #444' }}>
                  <div style={{ width: 36, height: 44, background: gc.primary,
                    border: `2px solid ${gc.accent}`, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '45%', left: 0, right: 0, height: 4, background: '#fff' }} />
                  </div>
                  <span style={{ fontSize: 'var(--fs-xs)', color: '#aaa' }}>{gc.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ CINEMATIC — walk in, coach greets, look around ═══ */}
      {phase === 'cinematic' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, maxWidth: 320 }}>
          {cinematicLines.slice(0, textLine).map((line, i) => {
            if (line === "") return <div key={i} style={{ height: 12 }} />;
            const isCoach = line.includes('"');
            return (
              <div key={i} style={{
                fontSize: 'var(--fs-sm)',
                color: isCoach ? '#ffd700' : i === textLine - 1 ? '#e0e0e0' : '#bbb',
                textAlign: 'center', lineHeight: 1.8,
              }} className="fade-in">
                {line}
              </div>
            );
          })}
          <div style={{ fontSize: 'var(--fs-xs)', color: '#555', marginTop: 12 }} className="blink">TAP TO SKIP</div>
        </div>
      )}

      {/* ═══ CHOICE — pick your group ═══ */}
      {phase === 'choice' && (
        <>
          <div style={{ fontSize: 'var(--fs-md)', color: '#ffd700', textAlign: 'center', marginBottom: 4 }}>
            WHO DO YOU PARTNER WITH?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
            {STARTER_PATHS.map((path, i) => (
              <button key={path.id}
                onClick={() => { setSelectedPath(i); setTextLine(0); setPhase('training'); }}
                style={{ padding: '14px 16px', background: '#111', border: '2px solid #333',
                  color: '#fff', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 'var(--fs-sm)', color: '#ffd700' }}>{path.title}</span>
                <span style={{ fontSize: 'var(--fs-xs)', color: '#999', lineHeight: 1.6 }}>{path.scene}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ═══ TRAINING — instructor teaches you ═══ */}
      {phase === 'training' && selectedPath !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 320 }}>
          {STARTER_PATHS[selectedPath].narrative.slice(0, textLine).map((line, i) => (
            <div key={i} style={{
              fontSize: 'var(--fs-sm)',
              color: line.startsWith('"') ? '#ffd700' : '#e0e0e0',
              textAlign: 'center', lineHeight: 1.8,
              fontStyle: line.startsWith('"') ? 'italic' : 'normal',
            }} className="fade-in">
              {line}
            </div>
          ))}
          <div style={{ fontSize: 'var(--fs-xs)', color: '#555', marginTop: 12 }} className="blink">TAP TO SKIP</div>
        </div>
      )}

      {/* ═══ MOVES UNLOCKED ═══ */}
      {phase === 'moves-unlocked' && selectedPath !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 'var(--fs-lg)', color: '#ffd700' }}>NEW MOVES UNLOCKED!</div>
          <div style={{ fontSize: 'var(--fs-sm)', color: '#888' }}>
            {STYLE_NAMES[STARTER_PATHS[selectedPath].style]} — {STARTER_PATHS[selectedPath].moves.length} techniques
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 280 }}>
            {STARTER_PATHS[selectedPath].moves.map(moveId => (
              <div key={moveId} style={{
                padding: '6px 12px', background: '#111', border: '1px solid #333',
                fontSize: 'var(--fs-xs)', color: '#ccc', textTransform: 'uppercase',
              }}>
                {moveId.replace(/-/g, ' ')}
              </div>
            ))}
          </div>
          <button onClick={() => { setTextLine(0); setPhase('rival-intro'); }}
            style={{ marginTop: 12, padding: '12px 30px', background: '#1a1a2e',
              color: '#ffd700', fontSize: 'var(--fs-md)', border: '2px solid #ffd700' }}>
            CONTINUE
          </button>
        </div>
      )}

      {/* ═══ RIVAL INTRO — Kenzo approaches ═══ */}
      {phase === 'rival-intro' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, maxWidth: 320 }}>
          {rivalIntroLines.slice(0, textLine).map((line, i) => {
            const isKenzo = line.includes(RIVAL_NAME);
            return (
              <div key={i} style={{
                fontSize: 'var(--fs-sm)',
                color: isKenzo ? '#ef4444' : '#ccc',
                textAlign: 'center', lineHeight: 1.8,
              }} className="fade-in">
                {line}
              </div>
            );
          })}
          {textLine >= rivalIntroLines.length && (
            <button onClick={() => {
              // Create Kenzo as opponent and go to battle
              if (selectedPath !== null) {
                const path = STARTER_PATHS[selectedPath];
                const player = createPlayerGrappler(path, name.trim(), GI_COLORS[giColor].primary, gymName.trim(), coachName.trim());
                savePlayer(player);
                const kenzo = createKenzo(path.style);
                saveOpponent(kenzo);
                localStorage.setItem('rollcraft-onboarding-battle', 'true');
                navigate('/battle');
              }
            }}
              style={{ marginTop: 12, padding: '14px 40px', background: '#ef4444',
                color: '#fff', fontSize: 'var(--fs-md)', border: '2px solid #ef4444' }}>
              LET'S ROLL
            </button>
          )}
        </div>
      )}

      {/* ═══ RIVAL AFTERMATH — shown when returning from battle ═══ */}
      {phase === 'rival-aftermath' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, maxWidth: 320 }}>
          {aftermathLines.slice(0, textLine).map((line, i) => {
            if (line === "") return <div key={i} style={{ height: 10 }} />;
            const isKenzo = line.includes(RIVAL_NAME) && !line.includes(coach);
            const isCoach = line.includes(coach);
            return (
              <div key={i} style={{
                fontSize: 'var(--fs-sm)',
                color: isKenzo ? '#ef4444' : isCoach ? '#ffd700' : '#ccc',
                textAlign: 'center', lineHeight: 1.8,
              }} className="fade-in">
                {line}
              </div>
            );
          })}
          <div style={{ fontSize: 'var(--fs-xs)', color: '#555', marginTop: 12 }} className="blink">TAP TO CONTINUE</div>
        </div>
      )}

    </div>
  );
}
