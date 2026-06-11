import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPlayer, savePlayer } from '../state/saveLoad';
import { getLevel, computeStats } from '../battle/stats';
import { STYLE_NAMES, STYLE_COLORS } from '../engine/constants';
import { BELT_XP_THRESHOLDS, BELT_MOVE_SLOTS } from '../engine/types';
import type { Belt } from '../engine/types';
import { getMove } from '../data/moves';
import { loadProgression, useItem, savePlayer as saveP } from '../state/saveLoad';
import { getItem } from '../data/items';
import type { StatKey } from '../engine/types';
import { createChallengeUrl } from '../engine/challenge';
import { track } from '../engine/analytics';

const BELTS: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];
const BELT_COLORS: Record<Belt, string> = {
  white: '#ffffff', blue: '#4488ff', purple: '#aa55ff', brown: '#cc8844', black: '#888888',
};

function getNextBelt(belt: Belt): Belt | null {
  const idx = BELTS.indexOf(belt);
  return idx < BELTS.length - 1 ? BELTS[idx + 1] : null;
}

export default function StatsScreen() {
  const navigate = useNavigate();
  const [player, setPlayer] = useState(() => loadPlayer());
  const [tab, setTab] = useState<'stats' | 'moves' | 'items'>('stats');
  const [challengeCopied, setChallengeCopied] = useState(false);

  if (!player) { navigate('/'); return null; }
  const p = player; // non-null after guard

  const level = getLevel(p);
  const stats = computeStats(p);
  const nextBelt = getNextBelt(p.belt);
  const currentThreshold = BELT_XP_THRESHOLDS[p.belt];
  const nextThreshold = nextBelt ? BELT_XP_THRESHOLDS[nextBelt] : currentThreshold + 5000;
  const xpProgress = ((p.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  const styleColor = STYLE_COLORS[p.style];
  const moveSlots = BELT_MOVE_SLOTS[p.belt];
  const prog = loadProgression();

  // Ensure learnedMoves exists (backward compat)
  if (!p.learnedMoves) p.learnedMoves = [...p.moves];

  const equippedSet = new Set(p.moves);
  const poolMoves = p.learnedMoves.filter(id => !equippedSet.has(id));

  function equipMove(moveId: string) {
    if (p.moves.length >= moveSlots) return;
    if (p.moves.includes(moveId)) return;
    p.moves.push(moveId);
    savePlayer(p);
    setPlayer({ ...p });
  }

  function unequipMove(moveId: string) {
    if (p.moves.length <= 1) return; // must keep at least 1
    p.moves = p.moves.filter(id => id !== moveId);
    savePlayer(p);
    setPlayer({ ...p });
  }

  return (
    <div style={{
      overflow: 'auto',
    }} className="game-shell no-scrollbar">
      {/* Header */}
      <div style={{
        padding: '12px 16px', background: '#0d0d1a',
        borderBottom: '2px solid #222', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button
          onClick={() => navigate('/overworld')}
          style={{
            padding: '6px 12px', background: '#1a1a2e', color: '#888',
            fontSize: 'var(--fs-sm)', border: '1px solid #444',
          }}
        >
          BACK
        </button>
        <span style={{ fontSize: 'var(--fs-md)', color: '#ffd700' }}>FIGHTER PROFILE</span>
        <button
          onClick={() => navigate('/sprite-creator')}
          style={{
            padding: '4px 8px', background: '#1a1a2e', color: '#e91e63',
            fontSize: 'var(--fs-xs)', border: '1px solid #e91e63',
          }}
        >
          SPRITE
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #222' }}>
        {(['stats', 'moves', 'items'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px', background: tab === t ? '#1a1a2e' : '#0a0a14',
            color: tab === t ? '#ffd700' : '#555', fontSize: 'var(--fs-sm)',
            border: 'none', borderBottom: tab === t ? '2px solid #ffd700' : '2px solid transparent',
          }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {tab === 'stats' && (
          <>
            {/* Name + Belt */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--fs-xl)', color: '#fff', marginBottom: 4 }}>
                {p.name.toUpperCase()}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
                <span style={{
                  fontSize: 'var(--fs-sm)', color: BELT_COLORS[p.belt],
                  border: `1px solid ${BELT_COLORS[p.belt]}`,
                  padding: '2px 8px',
                }}>
                  {p.belt.toUpperCase()} BELT
                </span>
                <span style={{ fontSize: 'var(--fs-sm)', color: '#aaa' }}>LV {level}</span>
                <span style={{ fontSize: 'var(--fs-sm)', color: styleColor }}>
                  {STYLE_NAMES[p.style]}
                </span>
              </div>
            </div>

            {/* XP Progress */}
            <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 'var(--fs-xs)', color: '#888', marginBottom: 6,
              }}>
                <span>{p.xp} XP</span>
                <span>{nextBelt ? `${nextThreshold} for ${nextBelt.toUpperCase()}` : 'MAX RANK'}</span>
              </div>
              <div style={{ width: '100%', height: 10, background: '#222', border: '1px solid #333' }}>
                <div style={{
                  width: `${Math.min(100, xpProgress)}%`, height: '100%',
                  background: nextBelt ? BELT_COLORS[nextBelt] : '#ffd700',
                  transition: 'width 0.5s',
                }} />
              </div>
              {nextBelt && p.xp >= nextThreshold && (
                <div style={{
                  fontSize: 'var(--fs-xs)', color: '#ffd700', marginTop: 6, textAlign: 'center',
                }} className="blink">
                  READY FOR PROMOTION! VISIT YOUR COACH
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
              <div style={{ fontSize: 'var(--fs-sm)', color: '#ffd700', marginBottom: 8 }}>STATS</div>
              {([
                ['STR', stats.str, '#e74c3c'],
                ['TEC', stats.tec, '#3498db'],
                ['TGH', stats.tgh, '#8b4513'],
                ['FLX', stats.flx, '#2ecc71'],
                ['SPD', stats.spd, '#f39c12'],
                ['END', stats.end, '#9b59b6'],
              ] as [string, number, string][]).map(([label, value, color]) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                }}>
                  <span style={{ fontSize: 'var(--fs-xs)', color: '#888', width: 28 }}>{label}</span>
                  <div style={{ flex: 1, height: 8, background: '#222' }}>
                    <div style={{
                      width: `${Math.min(100, (value / 50) * 100)}%`,
                      height: '100%', background: color,
                    }} />
                  </div>
                  <span style={{ fontSize: 'var(--fs-xs)', color: '#aaa', width: 20, textAlign: 'right' }}>
                    {value}
                  </span>
                </div>
              ))}
              <div style={{ fontSize: 'var(--fs-xs)', color: '#555', marginTop: 4 }}>
                HP: {stats.maxHp}
              </div>
            </div>

            {/* Belt progression */}
            <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
              <div style={{ fontSize: 'var(--fs-sm)', color: '#ffd700', marginBottom: 8 }}>BELT PROGRESSION</div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                {BELTS.map(belt => {
                  const isCurrentOrPast = BELTS.indexOf(belt) <= BELTS.indexOf(p.belt);
                  return (
                    <div key={belt} style={{
                      width: 40, height: 10,
                      background: isCurrentOrPast ? BELT_COLORS[belt] : '#222',
                      border: `1px solid ${isCurrentOrPast ? BELT_COLORS[belt] : '#333'}`,
                      opacity: isCurrentOrPast ? 1 : 0.4,
                    }} />
                  );
                })}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: '#666', textAlign: 'center', marginTop: 6 }}>
                Move slots: {moveSlots} | Next unlock: {nextBelt ? BELT_MOVE_SLOTS[nextBelt] : 'MAX'}
              </div>
            </div>

            {/* Record */}
            <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
              <div style={{ fontSize: 'var(--fs-sm)', color: '#ffd700', marginBottom: 8 }}>RECORD</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: '#aaa', display: 'flex', justifyContent: 'space-around' }}>
                <span>Wins: {prog.totalWins}</span>
                <span>Losses: {prog.totalLosses}</span>
                <span>Mat Bucks: ${prog.money}</span>
              </div>
            </div>

            {/* Challenge a friend */}
            <button
              onClick={async () => {
                const url = createChallengeUrl(p, { wins: prog.totalWins, losses: prog.totalLosses });
                track('challenge-created');
                const text = `Think you can beat my fighter? ${url}`;
                try {
                  if (navigator.share) { await navigator.share({ text }); return; }
                } catch { /* sheet closed */ }
                try {
                  await navigator.clipboard.writeText(url);
                  setChallengeCopied(true);
                  setTimeout(() => setChallengeCopied(false), 2500);
                } catch { /* ignore */ }
              }}
              style={{
                padding: '10px', background: '#0e1420', color: '#3498db',
                fontSize: 'var(--fs-sm)', border: '2px solid #3498db',
              }}
            >
              {challengeCopied ? '✓ LINK COPIED — SEND IT' : '⚔ CHALLENGE A FRIEND'}
            </button>
          </>
        )}

        {tab === 'moves' && (
          <>
            {/* Equipped moves */}
            <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
              <div style={{
                fontSize: 'var(--fs-sm)', color: '#ffd700', marginBottom: 8,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>EQUIPPED</span>
                <span style={{ color: p.moves.length >= moveSlots ? '#ef4444' : '#22c55e' }}>
                  {p.moves.length}/{moveSlots} SLOTS
                </span>
              </div>
              {p.moves.map(moveId => {
                const move = getMove(moveId);
                if (!move) return null;
                const mColor = STYLE_COLORS[move.style];
                return (
                  <div key={moveId} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 4px', borderBottom: '1px solid #1a1a1a',
                  }}>
                    <div>
                      <span style={{ fontSize: 'var(--fs-xs)', color: '#ddd' }}>{move.name}</span>
                      <span style={{ fontSize: 7, color: mColor, marginLeft: 6 }}>
                        {move.category.toUpperCase()}
                      </span>
                      <div style={{ fontSize: 7, color: '#666', marginTop: 2 }}>
                        PWR:{move.power} ACC:{move.accuracy} STA:{move.staminaCost}
                      </div>
                    </div>
                    <button
                      onClick={() => unequipMove(moveId)}
                      disabled={p.moves.length <= 1}
                      style={{
                        padding: '4px 8px', background: '#2a1a1a',
                        border: '1px solid #ef4444', color: '#ef4444',
                        fontSize: 7, opacity: p.moves.length <= 1 ? 0.3 : 1,
                      }}
                    >
                      REMOVE
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Move pool (learned but not equipped) */}
            {poolMoves.length > 0 && (
              <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
                <div style={{ fontSize: 'var(--fs-sm)', color: '#888', marginBottom: 8 }}>
                  LEARNED (NOT EQUIPPED)
                </div>
                {poolMoves.map(moveId => {
                  const move = getMove(moveId);
                  if (!move) return null;
                  const mColor = STYLE_COLORS[move.style];
                  const canEquip = p.moves.length < moveSlots;
                  return (
                    <div key={moveId} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 4px', borderBottom: '1px solid #1a1a1a',
                    }}>
                      <div>
                        <span style={{ fontSize: 'var(--fs-xs)', color: '#999' }}>{move.name}</span>
                        <span style={{ fontSize: 7, color: mColor, marginLeft: 6 }}>
                          {move.category.toUpperCase()}
                        </span>
                        <div style={{ fontSize: 7, color: '#555', marginTop: 2 }}>
                          PWR:{move.power} ACC:{move.accuracy} STA:{move.staminaCost}
                        </div>
                      </div>
                      <button
                        onClick={() => equipMove(moveId)}
                        disabled={!canEquip}
                        style={{
                          padding: '4px 8px', background: '#1a2a1a',
                          border: `1px solid ${canEquip ? '#22c55e' : '#333'}`,
                          color: canEquip ? '#22c55e' : '#555',
                          fontSize: 7,
                        }}
                      >
                        {canEquip ? 'EQUIP' : 'FULL'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Belt slot progression */}
            <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: '#666', textAlign: 'center' }}>
                Belt upgrades unlock more slots:<br/>
                {BELTS.map(b => `${b.charAt(0).toUpperCase() + b.slice(1)}: ${BELT_MOVE_SLOTS[b]}`).join(' → ')}
              </div>
            </div>
          </>
        )}

        {tab === 'items' && (
          <>
            <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
              <div style={{ fontSize: 'var(--fs-sm)', color: '#ffd700', marginBottom: 8 }}>INVENTORY</div>
              {Object.keys(prog.inventory || {}).length === 0 && (
                <div style={{ fontSize: 'var(--fs-xs)', color: '#555', textAlign: 'center', padding: 12 }}>
                  No items. Visit a gym shop to buy supplies.
                </div>
              )}
              {Object.entries(prog.inventory || {}).map(([itemId, qty]) => {
                const item = getItem(itemId);
                if (!item || qty <= 0) return null;
                return (
                  <div key={itemId} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 4px', borderBottom: '1px solid #1a1a1a',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--fs-xs)', color: '#ddd' }}>{item.name} x{qty}</div>
                      <div style={{ fontSize: 7, color: '#888', marginTop: 2 }}>{item.description}</div>
                    </div>
                    <button
                      onClick={() => {
                        const used = useItem(itemId);
                        if (!used) return;
                        // Apply effect
                        if (item.effect.type === 'boost-ev') {
                          const stat = item.effect.stat as StatKey;
                          p.evs[stat] = Math.min(252, p.evs[stat] + item.effect.amount);
                          saveP(p);
                          setPlayer({ ...p });
                        }
                        // HP/stamina effects apply at battle start — just show confirmation
                        // Force re-render by updating player
                        setPlayer({ ...p });
                      }}
                      style={{
                        padding: '6px 10px', background: '#1a2a1a',
                        border: '1px solid #22c55e', color: '#22c55e',
                        fontSize: 7,
                      }}
                    >
                      USE
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
