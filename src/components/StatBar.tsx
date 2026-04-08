interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  showNumbers?: boolean;
}

export default function StatBar({ label, current, max, color, showNumbers = false }: StatBarProps) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
      <span style={{ fontSize: '0.5rem', color: '#888', minWidth: 24 }}>{label}</span>
      <div style={{
        flex: 1, height: 10, background: '#222', border: '1px solid #444',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color,
          transition: 'width 0.3s ease',
        }} />
      </div>
      {showNumbers && (
        <span style={{ fontSize: '0.45rem', color: '#aaa', minWidth: 40, textAlign: 'right' }}>
          {current}/{max}
        </span>
      )}
    </div>
  );
}
