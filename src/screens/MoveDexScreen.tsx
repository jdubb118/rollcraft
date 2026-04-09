import { useNavigate } from 'react-router-dom';
import { loadPlayer } from '../state/saveLoad';
import { MOVES } from '../data/moves';
import { STYLE_COLORS, STYLE_NAMES } from '../engine/constants';
import type { MoveCategory } from '../engine/types';
import { getMoveBonus, getMasteryLabel } from '../battle/moveXp';

const CATEGORY_ORDER: MoveCategory[] = ['takedown', 'sweep', 'pass', 'submission', 'escape', 'transition', 'setup'];
const CATEGORY_ICONS: Record<string, string> = {
  takedown: '⬇', sweep: '🔄', pass: '➡', submission: '🔒',
  escape: '🛡', transition: '↗', setup: '🤝',
};

export default function MoveDexScreen() {
  const navigate = useNavigate();
  const player = loadPlayer();
  if (!player) { navigate('/'); return null; }

  // All moves the player has learned or seen
  const learnedSet = new Set(player.learnedMoves || []);
  const equippedSet = new Set(player.moves || []);

  // Count stats
  const totalMoves = MOVES.length;
  const learnedCount = learnedSet.size;
  const pct = Math.floor((learnedCount / totalMoves) * 100);

  // Group by category
  const byCategory: Record<string, typeof MOVES> = {};
  for (const cat of CATEGORY_ORDER) {
    byCategory[cat] = MOVES.filter(m => m.category === cat);
  }

  return (
    <div className="game-shell" style={{ overflow: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', background: '#0d0d1a', borderBottom: '2px solid #222',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button onClick={() => navigate('/overworld')} style={{
          padding: '6px 12px', background: '#1a1a2e', color: '#888',
          fontSize: 'var(--fs-xs)', border: '1px solid #444',
        }}>BACK</button>
        <span style={{ fontSize: 'var(--fs-md)', color: '#ffd700' }}>MOVE DEX</span>
        <span style={{ fontSize: 'var(--fs-xs)', color: '#22c55e' }}>
          {learnedCount}/{totalMoves} ({pct}%)
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '8px 14px' }}>
        <div style={{ width: '100%', height: 8, background: '#222', border: '1px solid #333' }}>
          <div style={{
            width: `${pct}%`, height: '100%', background: '#22c55e',
            transition: 'width 0.5s',
          }} />
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding: '4px 14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }} className="no-scrollbar">
        {CATEGORY_ORDER.map(cat => {
          const moves = byCategory[cat];
          if (!moves || moves.length === 0) return null;
          const catLearned = moves.filter(m => learnedSet.has(m.id)).length;
          const icon = CATEGORY_ICONS[cat] || '•';

          return (
            <div key={cat}>
              <div style={{
                fontSize: 'var(--fs-sm)', color: '#ffd700', marginBottom: 6,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{icon} {cat.toUpperCase()}</span>
                <span style={{ color: '#666' }}>{catLearned}/{moves.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {moves.map(move => {
                  const known = learnedSet.has(move.id);
                  const equipped = equippedSet.has(move.id);
                  return (
                    <div key={move.id} style={{
                      padding: '4px 8px', background: '#111',
                      borderLeft: `3px solid ${known ? STYLE_COLORS[move.style] : '#222'}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      opacity: known ? 1 : 0.35,
                    }}>
                      <div>
                        <span style={{ fontSize: 'var(--fs-xs)', color: known ? '#ddd' : '#555' }}>
                          {known ? move.name : '???'}
                        </span>
                        {known && (
                          <span style={{ fontSize: 7, color: STYLE_COLORS[move.style], marginLeft: 6 }}>
                            {STYLE_NAMES[move.style]}
                          </span>
                        )}
                      </div>
                      {known && (() => {
                        const xp = player.moveXp?.[move.id] || 0;
                        const bonus = getMoveBonus(xp);
                        return (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 7, color: equipped ? '#22c55e' : '#555' }}>
                              {equipped ? 'EQUIPPED' : 'LEARNED'}
                            </div>
                            {xp > 0 && (
                              <div style={{ fontSize: 6, color: '#f59e0b' }}>
                                {getMasteryLabel(bonus.level)} (Lv{bonus.level})
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
