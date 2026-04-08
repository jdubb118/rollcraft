import type { Direction } from '../overworld/overworldTypes';

interface DPadProps {
  onDirection: (dir: Direction | null) => void;
  onAction: () => void;
}

const btnBase: React.CSSProperties = {
  width: 44, height: 44, background: '#222', border: '2px solid #444',
  color: '#888', fontSize: '1rem', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  touchAction: 'none', userSelect: 'none',
};

export default function DPad({ onDirection, onAction }: DPadProps) {
  const press = (dir: Direction) => onDirection(dir);
  const release = () => onDirection(null);

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      padding: '0 20px', pointerEvents: 'none', zIndex: 100,
    }}>
      {/* D-pad */}
      <div style={{
        display: 'grid', gridTemplateColumns: '44px 44px 44px', gridTemplateRows: '44px 44px 44px',
        gap: 2, pointerEvents: 'auto',
      }}>
        <div />
        <button
          style={btnBase}
          onPointerDown={() => press('up')}
          onPointerUp={release}
          onPointerLeave={release}
        >
          ▲
        </button>
        <div />
        <button
          style={btnBase}
          onPointerDown={() => press('left')}
          onPointerUp={release}
          onPointerLeave={release}
        >
          ◀
        </button>
        <div style={{ ...btnBase, background: '#1a1a1a', border: '2px solid #333' }} />
        <button
          style={btnBase}
          onPointerDown={() => press('right')}
          onPointerUp={release}
          onPointerLeave={release}
        >
          ▶
        </button>
        <div />
        <button
          style={btnBase}
          onPointerDown={() => press('down')}
          onPointerUp={release}
          onPointerLeave={release}
        >
          ▼
        </button>
        <div />
      </div>

      {/* A button */}
      <button
        style={{
          ...btnBase,
          width: 56, height: 56, borderRadius: '50%',
          background: '#ffd700', color: '#000', fontSize: '0.6rem',
          fontFamily: "'Press Start 2P', monospace", border: '3px solid #b8960f',
          pointerEvents: 'auto',
        }}
        onPointerDown={onAction}
      >
        A
      </button>
    </div>
  );
}
