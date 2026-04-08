import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPlayer, savePlayer } from '../state/saveLoad';
import type { Belt } from '../engine/types';
import { BELT_MOVE_SLOTS } from '../engine/types';
import { COACH_DIALOGUE } from '../data/storyArc';

const BELTS: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];
const BELT_COLORS: Record<Belt, string> = {
  white: '#ffffff', blue: '#2563eb', purple: '#7c3aed', brown: '#8b4513', black: '#1a1a1a',
};
const BELT_GLOW: Record<Belt, string> = {
  white: '#ffffff44', blue: '#2563eb66', purple: '#7c3aed66', brown: '#8b451366', black: '#88888866',
};

function getPromotionText(belt: Belt, coachName: string): string[] {
  const coach = coachName || 'Prof. Helio';
  const storyLines = COACH_DIALOGUE.beltPromotions[belt as keyof typeof COACH_DIALOGUE.beltPromotions];
  if (!storyLines || storyLines.length === 0) return [];

  // Build cinematic scene with story dialogue
  const scene: string[] = ["The academy falls silent.", `${coach} steps onto the mat.`, ""];
  for (const dl of storyLines) {
    scene.push(dl.line.replace('Prof. Helio', coach));
  }
  scene.push("", `The ${belt} belt is tied around your waist.`);
  return scene.filter(l => l !== "");
}

export default function PromotionScreen() {
  const [lineIndex, setLineIndex] = useState(0);
  const [phase, setPhase] = useState<'narrative' | 'reveal' | 'done'>('narrative');
  const [player] = useState(loadPlayer());
  const navigate = useNavigate();

  if (!player) { navigate('/'); return null; }

  const currentBeltIdx = BELTS.indexOf(player.belt);
  const nextBelt = currentBeltIdx < BELTS.length - 1 ? BELTS[currentBeltIdx + 1] : null;

  if (!nextBelt) { navigate('/overworld'); return null; }

  const lines = getPromotionText(nextBelt, player.coachName || 'Your coach');

  // Auto-advance text
  useEffect(() => {
    if (phase !== 'narrative') return;
    if (lineIndex >= lines.length) {
      setPhase('reveal');
      return;
    }
    const delay = lines[lineIndex].length < 20 ? 1500 : 2200;
    const timer = setTimeout(() => setLineIndex(i => i + 1), delay);
    return () => clearTimeout(timer);
  }, [phase, lineIndex, lines]);

  const handleTap = () => {
    if (phase === 'narrative') {
      // Skip to reveal
      setLineIndex(lines.length);
      setPhase('reveal');
    } else if (phase === 'reveal') {
      setPhase('done');
    } else {
      // Apply promotion
      player.belt = nextBelt;
      savePlayer(player);
      navigate('/overworld');
    }
  };

  const beltColor = BELT_COLORS[nextBelt];
  const glow = BELT_GLOW[nextBelt];

  return (
    <div
      onClick={handleTap}
      className="game-shell"
      style={{
        justifyContent: 'center', alignItems: 'center',
        padding: 24, gap: 20,
      }}
    >
      {/* Narrative phase */}
      {phase === 'narrative' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 14, maxWidth: 320,
        }}>
          {lines.slice(0, lineIndex).map((line, i) => (
            <div key={i} style={{
              fontSize: '0.42rem',
              color: line.startsWith('"') ? '#ffd700' : '#c0c0c0',
              textAlign: 'center', lineHeight: 1.8,
              fontStyle: line.startsWith('"') ? 'italic' : 'normal',
              opacity: i === lineIndex - 1 ? 1 : 0.5,
              animation: 'slideUp 0.5s ease',
            }}>
              {line}
            </div>
          ))}
          <div style={{ fontSize: '0.3rem', color: '#444', marginTop: 20 }} className="blink">
            TAP TO CONTINUE
          </div>
        </div>
      )}

      {/* Belt reveal */}
      {phase === 'reveal' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
          animation: 'slideUp 0.8s ease',
        }}>
          {/* Belt visual */}
          <div style={{
            width: 200, height: 24, background: beltColor,
            border: `3px solid ${beltColor}`,
            boxShadow: `0 0 40px ${glow}, 0 0 80px ${glow}`,
            position: 'relative',
          }}>
            {/* Knot detail */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
              width: 16, height: 16, background: beltColor,
              border: `2px solid ${nextBelt === 'black' ? '#444' : '#00000033'}`,
              borderRadius: 2,
            }} />
          </div>

          <div style={{
            fontSize: '0.8rem', color: beltColor,
            textShadow: `0 0 20px ${glow}`,
            letterSpacing: 4,
          }}>
            {nextBelt.toUpperCase()} BELT
          </div>

          <div style={{ fontSize: '0.35rem', color: '#888', textAlign: 'center', lineHeight: 2 }}>
            Move slots: {BELT_MOVE_SLOTS[nextBelt]}<br />
            New techniques available
          </div>

          <div style={{ fontSize: '0.3rem', color: '#444' }} className="blink">
            TAP TO CONTINUE
          </div>
        </div>
      )}

      {/* Done - confirmation */}
      {phase === 'done' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          animation: 'slideUp 0.5s ease',
        }}>
          <div style={{ fontSize: '0.6rem', color: '#ffd700' }}>
            PROMOTED!
          </div>
          <div style={{
            fontSize: '0.4rem', color: '#ccc', textAlign: 'center', lineHeight: 1.8,
          }}>
            {player.name} is now a {nextBelt} belt.
          </div>
          <div style={{ fontSize: '0.3rem', color: '#444' }} className="blink">
            TAP TO RETURN TO GYM
          </div>
        </div>
      )}
    </div>
  );
}
