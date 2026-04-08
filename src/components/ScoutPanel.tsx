import type { BattleGrappler, StatKey } from '../engine/types';
import { STYLE_NAMES, STYLE_COLORS } from '../engine/constants';
import { getLevel } from '../battle/stats';

interface ScoutPanelProps {
  opponent: BattleGrappler;
  player: BattleGrappler;
  isKnown: boolean;
  onClose: () => void;
}

const STAT_LABELS: Record<StatKey, string> = {
  str: 'STR', tec: 'TEC', tgh: 'TGH', flx: 'FLX', spd: 'SPD', end: 'END',
};
const STAT_COLORS: Record<StatKey, string> = {
  str: '#e74c3c', tec: '#3498db', tgh: '#8b4513', flx: '#2ecc71', spd: '#f39c12', end: '#9b59b6',
};

const FRAME_LABELS = { light: 'Light', medium: 'Medium', heavy: 'Heavy' };

function getDifficulty(playerLevel: number, opponentLevel: number): { label: string; color: string } {
  const diff = opponentLevel - playerLevel;
  if (diff <= -5) return { label: 'EASY', color: '#22c55e' };
  if (diff <= 2) return { label: 'MEDIUM', color: '#ffd700' };
  if (diff <= 8) return { label: 'HARD', color: '#ef4444' };
  return { label: 'IMPOSSIBLE', color: '#ff0000' };
}

export default function ScoutPanel({ opponent, player, isKnown, onClose }: ScoutPanelProps) {
  const oppLevel = getLevel(opponent.grappler);
  const playerLevel = getLevel(player.grappler);
  const diff = getDifficulty(playerLevel, oppLevel);

  if (!isKnown) {
    return (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', zIndex: 60,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: 20, gap: 16,
      }}>
        <div style={{ fontSize: 'var(--fs-lg)', color: '#888' }}>UNKNOWN OPPONENT</div>
        <div style={{ fontSize: 'var(--fs-sm)', color: '#555' }}>
          {opponent.grappler.name} — {opponent.grappler.belt.toUpperCase()} BELT
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: '#444', textAlign: 'center' }}>
          Fight them once to learn their tendencies.
        </div>
        <button onClick={onClose} style={{
          padding: '8px 20px', background: '#1a1a2e', color: '#888',
          fontSize: 'var(--fs-xs)', border: '1px solid #444',
        }}>CLOSE</button>
      </div>
    );
  }

  const opp = opponent.grappler;
  const styleColor = STYLE_COLORS[opp.style];

  // Fuzzy stat display (±10% noise)
  const fuzzyStat = (actual: number) => {
    const noise = Math.floor(actual * (0.9 + Math.random() * 0.2));
    return noise;
  };

  // Count move categories
  const moveCounts: Record<string, number> = {};
  for (const moveId of opp.moves) {
    // We don't import getMove to keep this light — just show count
    moveCounts[moveId] = 1;
  }

  const stats: StatKey[] = ['str', 'tec', 'tgh', 'flx', 'spd', 'end'];

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.90)', zIndex: 60,
      display: 'flex', flexDirection: 'column',
      padding: 16, gap: 10, overflow: 'auto',
    }} className="no-scrollbar">
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--fs-lg)', color: '#fff' }}>{opp.name}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 4 }}>
          <span style={{ fontSize: 'var(--fs-xs)', color: styleColor }}>{STYLE_NAMES[opp.style]}</span>
          <span style={{ fontSize: 'var(--fs-xs)', color: '#888' }}>{opp.belt.toUpperCase()} BELT</span>
          <span style={{ fontSize: 'var(--fs-xs)', color: '#666' }}>{FRAME_LABELS[opp.frame || 'medium']}</span>
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', color: diff.color, marginTop: 6 }}>{diff.label}</div>
      </div>

      {/* Stat comparison */}
      <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: '#888', marginBottom: 8, textAlign: 'center' }}>
          STAT COMPARISON (estimated)
        </div>
        {stats.map(stat => {
          const playerVal = player.stats[stat];
          const oppVal = fuzzyStat(opponent.stats[stat]);
          const maxVal = Math.max(playerVal, oppVal, 30);
          return (
            <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 7, color: '#666', width: 24 }}>{STAT_LABELS[stat]}</span>
              <div style={{ flex: 1, display: 'flex', gap: 2 }}>
                {/* Player bar */}
                <div style={{ flex: 1, height: 6, background: '#222', position: 'relative' }}>
                  <div style={{
                    width: `${(playerVal / maxVal) * 100}%`, height: '100%',
                    background: '#22c55e',
                  }} />
                </div>
                {/* Opponent bar */}
                <div style={{ flex: 1, height: 6, background: '#222', position: 'relative' }}>
                  <div style={{
                    width: `${(oppVal / maxVal) * 100}%`, height: '100%',
                    background: STAT_COLORS[stat],
                  }} />
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#555', marginTop: 4 }}>
          <span>You (green)</span>
          <span>Opponent (colored)</span>
        </div>
      </div>

      {/* Move count */}
      <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: '#888', marginBottom: 4, textAlign: 'center' }}>
          KNOWN TECHNIQUES: {opp.moves.length}
        </div>
      </div>

      <button onClick={onClose} style={{
        padding: '10px 20px', background: '#1a1a2e', color: '#ffd700',
        fontSize: 'var(--fs-xs)', border: '1px solid #ffd700', alignSelf: 'center',
      }}>CLOSE</button>
    </div>
  );
}

export { getDifficulty };
