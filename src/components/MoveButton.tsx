import type { Move } from '../engine/types';
import { STYLE_COLORS } from '../engine/constants';

interface MoveButtonProps {
  move: Move;
  onSelect: (moveId: string) => void;
  disabled?: boolean;
  canAfford: boolean;
}

export default function MoveButton({ move, onSelect, disabled, canAfford }: MoveButtonProps) {
  const isStall = move.id === '__stall__';
  const color = isStall ? '#666' : STYLE_COLORS[move.style];
  const opacity = canAfford ? 1 : 0.4;

  return (
    <button
      onClick={() => !disabled && canAfford && onSelect(move.id)}
      disabled={disabled || !canAfford}
      style={{
        width: '100%',
        minHeight: 52,
        padding: '6px 8px',
        background: isStall
          ? 'linear-gradient(135deg, #33333388, #22222244)'
          : `linear-gradient(135deg, ${color}33, ${color}11)`,
        border: `2px solid ${color}`,
        color: isStall ? '#ffd700' : '#fff',
        fontSize: 'var(--fs-sm)',
        lineHeight: 1.4,
        textAlign: 'left',
        opacity,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      <span style={{ fontSize: 'var(--fs-sm)' }}>{isStall ? 'STALL' : move.name}</span>
      <span style={{ fontSize: 'var(--fs-xs)', color: '#aaa' }}>
        {isStall ? 'RECOVER STAMINA' : `${move.category.toUpperCase()} | ${move.staminaCost} STA`}
      </span>
    </button>
  );
}
