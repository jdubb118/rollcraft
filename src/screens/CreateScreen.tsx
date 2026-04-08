import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ARCHETYPES } from '../data/archetypes';
import { STYLE_NAMES } from '../engine/constants';
import { rollIVs } from '../engine/random';
import { savePlayer, saveOpponent } from '../state/saveLoad';
import type { Grappler, Archetype } from '../engine/types';

function makeId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function createGrappler(archetype: Archetype, name: string): Grappler {
  return {
    id: makeId(),
    name: name || archetype.name,
    style: archetype.style,
    belt: 'white',
    xp: 0,
    baseStats: archetype.baseStats,
    ivs: rollIVs(),
    evs: { str: 0, tec: 0, tgh: 0, flx: 0, spd: 0, end: 0 },
    moves: archetype.startingMoves,
  };
}

function createRandomOpponent(): Grappler {
  const arch = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
  const names = ['Renzo', 'Rickson', 'Marcelo', 'Keenan', 'Gordon', 'Lachlan', 'Mikey', 'Nicky'];
  const name = names[Math.floor(Math.random() * names.length)];
  return createGrappler(arch, name);
}

export default function CreateScreen() {
  const [selected, setSelected] = useState<number>(0);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleStart = () => {
    try {
      const arch = ARCHETYPES[selected];
      const player = createGrappler(arch, name);
      const opponent = createRandomOpponent();
      savePlayer(player);
      saveOpponent(opponent);
      console.log('Saved player:', player.name, 'opponent:', opponent.name);
      navigate('/battle');
    } catch (err) {
      console.error('Start match error:', err);
      alert('Error: ' + (err as Error).message);
    }
  };

  return (
    <div style={{
      width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#0a0a14', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 12px 8px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '0.7rem', color: '#ffd700', marginBottom: 4 }}>CHOOSE YOUR STYLE</h2>
        <p style={{ fontSize: '0.35rem', color: '#666' }}>Each style has unique strengths and moves</p>
      </div>

      {/* Name input */}
      <div style={{ padding: '4px 16px 8px' }}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="FIGHTER NAME"
          maxLength={12}
          style={{
            width: '100%', padding: '8px 12px', background: '#111',
            border: '2px solid #333', color: '#fff',
            fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem',
            textAlign: 'center',
          }}
        />
      </div>

      {/* Archetype grid */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '0 8px 8px',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 6, alignContent: 'start',
      }}
      className="no-scrollbar"
      >
        {ARCHETYPES.map((arch, i) => {
          const isSelected = i === selected;
          const color = arch.color;
          return (
            <button
              key={arch.id}
              onClick={() => setSelected(i)}
              style={{
                padding: '10px 8px',
                background: isSelected ? `${color}33` : '#111',
                border: `2px solid ${isSelected ? color : '#333'}`,
                color: '#fff',
                textAlign: 'left',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <span style={{ fontSize: '0.5rem', color }}>{arch.name.toUpperCase()}</span>
              <span style={{ fontSize: '0.3rem', color: '#888', lineHeight: 1.5 }}>
                {STYLE_NAMES[arch.style]}
              </span>
              <span style={{ fontSize: '0.28rem', color: '#666', lineHeight: 1.4 }}>
                {arch.description}
              </span>
              {isSelected && (
                <div style={{ fontSize: '0.25rem', color: '#aaa', marginTop: 4 }}>
                  STR:{arch.baseStats.str} TEC:{arch.baseStats.tec} TGH:{arch.baseStats.tgh}
                  {' '}FLX:{arch.baseStats.flx} SPD:{arch.baseStats.spd} END:{arch.baseStats.end}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Start button */}
      <div style={{ padding: '8px 16px 16px' }} className="safe-bottom">
        <button
          onClick={handleStart}
          style={{
            width: '100%', padding: '14px',
            background: '#ffd700', color: '#000',
            fontSize: '0.65rem', border: 'none',
          }}
        >
          START MATCH
        </button>
      </div>
    </div>
  );
}
