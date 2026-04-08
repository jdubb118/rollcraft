import type { Move } from '../engine/types';
import MoveButton from './MoveButton';

interface MovePanelProps {
  moves: Move[];
  onSelect: (moveId: string) => void;
  disabled: boolean;
  currentStamina: number;
}

export default function MovePanel({ moves, onSelect, disabled, currentStamina }: MovePanelProps) {
  // Separate stall from regular moves
  const regularMoves = moves.filter(m => m.id !== '__stall__');
  const hasStall = moves.some(m => m.id === '__stall__');
  const stallMove = moves.find(m => m.id === '__stall__');

  // Pad regular moves to fill 2x2 grid if needed
  const slots = [...regularMoves];
  while (slots.length < 3 && slots.length > 0) slots.push(null as any);

  return (
    <div style={{ padding: '0 8px', width: '100%', maxWidth: 400, margin: '0 auto' }}>
      {/* Regular moves — 2-column grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
        marginBottom: hasStall ? 6 : 0,
      }}>
        {slots.slice(0, 4).map((move, i) =>
          move ? (
            <MoveButton
              key={move.id}
              move={move}
              onSelect={onSelect}
              disabled={disabled}
              canAfford={currentStamina >= move.staminaCost}
            />
          ) : (
            <div key={`empty-${i}`} style={{
              minHeight: 52, background: '#111', border: '2px solid #333',
              opacity: 0.3,
            }} />
          )
        )}
      </div>

      {/* Stall button — always visible, full width, distinct style */}
      {hasStall && stallMove && (
        <button
          onClick={() => onSelect('__stall__')}
          disabled={disabled}
          style={{
            width: '100%', padding: '8px', marginTop: 2,
            background: '#1a1a0e', border: '2px solid #8b7500',
            color: '#ffd700', fontSize: 'var(--fs-xs)',
            opacity: disabled ? 0.5 : 0.8,
          }}
        >
          STALL / RECOVER STAMINA
        </button>
      )}
    </div>
  );
}
