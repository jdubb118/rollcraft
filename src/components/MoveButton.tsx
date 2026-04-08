import type { Move } from '../engine/types';
import { STYLE_COLORS } from '../engine/constants';

const CATEGORY_ICONS: Record<string, string> = {
  takedown: '⬇', sweep: '🔄', pass: '➡', submission: '🔒',
  escape: '🛡', transition: '↗', setup: '🤝',
};

interface MoveButtonProps {
  move: Move;
  onSelect: (moveId: string) => void;
  disabled?: boolean;
  canAfford: boolean;
}

export default function MoveButton({ move, onSelect, disabled, canAfford }: MoveButtonProps) {
  const isStall = move.id === '__stall__';
  const color = isStall ? '#666' : STYLE_COLORS[move.style];
  const catIcon = CATEGORY_ICONS[move.category] || '•';

  return (
    <button
      onClick={() => !disabled && canAfford && onSelect(move.id)}
      disabled={disabled || !canAfford}
      style={{
        width: '100%',
        minHeight: 48,
        padding: '6px 8px 6px 12px',
        background: isStall
          ? 'linear-gradient(135deg, #33333388, #22222244)'
          : `linear-gradient(135deg, ${color}22, ${color}08)`,
        border: `2px solid ${color}44`,
        borderLeft: `4px solid ${color}`,
        color: isStall ? '#ffd700' : '#fff',
        fontSize: 'var(--fs-sm)',
        lineHeight: 1.3,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <span style={{ fontSize: 'var(--fs-sm)' }}>
        {isStall ? '⏸ STALL' : move.name}
      </span>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 'var(--fs-xs)', color: '#888',
      }}>
        <span>{isStall ? 'RECOVER' : `${catIcon} ${move.category.toUpperCase()}`}</span>
        {!isStall && (
          <span style={{ color: !canAfford ? '#ef4444' : '#666' }}>
            ⚡{move.staminaCost}
          </span>
        )}
      </div>
    </button>
  );
}
