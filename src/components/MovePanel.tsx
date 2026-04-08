import type { Move } from '../engine/types';
import MoveButton from './MoveButton';

interface MovePanelProps {
  moves: Move[];
  onSelect: (moveId: string) => void;
  disabled: boolean;
  currentStamina: number;
}

export default function MovePanel({ moves, onSelect, disabled, currentStamina }: MovePanelProps) {
  // Pad to 4 slots if fewer moves available
  const slots = [...moves];
  while (slots.length < 4) slots.push(null as any);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 6,
      padding: '0 8px',
      width: '100%',
      maxWidth: 400,
      margin: '0 auto',
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
          <div key={i} style={{
            minHeight: 52, background: '#111', border: '2px solid #333',
            opacity: 0.3,
          }} />
        )
      )}
    </div>
  );
}
