import { useNavigate } from 'react-router-dom';
import { loadPlayer } from '../state/saveLoad';
import { getLevel, computeStats } from '../battle/stats';
import { STYLE_NAMES, STYLE_COLORS } from '../engine/constants';
import { BELT_XP_THRESHOLDS, BELT_MOVE_SLOTS } from '../engine/types';
import type { Belt } from '../engine/types';
import { getMove } from '../data/moves';

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
  const player = loadPlayer();

  if (!player) { navigate('/'); return null; }

  const level = getLevel(player);
  const stats = computeStats(player);
  const nextBelt = getNextBelt(player.belt);
  const currentThreshold = BELT_XP_THRESHOLDS[player.belt];
  const nextThreshold = nextBelt ? BELT_XP_THRESHOLDS[nextBelt] : currentThreshold + 5000;
  const xpProgress = ((player.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  const styleColor = STYLE_COLORS[player.style];
  const moveSlots = BELT_MOVE_SLOTS[player.belt];

  return (
    <div style={{
      width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#0a0a14', overflow: 'auto',
    }} className="no-scrollbar">
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
            fontSize: '0.4rem', border: '1px solid #444',
          }}
        >
          BACK
        </button>
        <span style={{ fontSize: '0.5rem', color: '#ffd700' }}>FIGHTER PROFILE</span>
        <div style={{ width: 50 }} />
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Name + Belt */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#fff', marginBottom: 4 }}>
            {player.name.toUpperCase()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
            <span style={{
              fontSize: '0.45rem', color: BELT_COLORS[player.belt],
              border: `1px solid ${BELT_COLORS[player.belt]}`,
              padding: '2px 8px',
            }}>
              {player.belt.toUpperCase()} BELT
            </span>
            <span style={{ fontSize: '0.45rem', color: '#aaa' }}>
              LV {level}
            </span>
            <span style={{ fontSize: '0.4rem', color: styleColor }}>
              {STYLE_NAMES[player.style]}
            </span>
          </div>
        </div>

        {/* XP Progress */}
        <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '0.35rem', color: '#888', marginBottom: 6,
          }}>
            <span>{player.xp} XP</span>
            <span>{nextBelt ? `${nextThreshold} for ${nextBelt.toUpperCase()}` : 'MAX RANK'}</span>
          </div>
          <div style={{ width: '100%', height: 10, background: '#222', border: '1px solid #333' }}>
            <div style={{
              width: `${Math.min(100, xpProgress)}%`, height: '100%',
              background: nextBelt ? BELT_COLORS[nextBelt] : '#ffd700',
              transition: 'width 0.5s',
            }} />
          </div>
          {nextBelt && player.xp >= nextThreshold && (
            <div style={{
              fontSize: '0.35rem', color: '#ffd700', marginTop: 6, textAlign: 'center',
            }} className="blink">
              READY FOR PROMOTION! VISIT YOUR COACH
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
          <div style={{ fontSize: '0.4rem', color: '#ffd700', marginBottom: 8 }}>STATS</div>
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
              <span style={{ fontSize: '0.35rem', color: '#888', width: 28 }}>{label}</span>
              <div style={{ flex: 1, height: 8, background: '#222' }}>
                <div style={{
                  width: `${Math.min(100, (value / 50) * 100)}%`,
                  height: '100%', background: color,
                }} />
              </div>
              <span style={{ fontSize: '0.35rem', color: '#aaa', width: 20, textAlign: 'right' }}>
                {value}
              </span>
            </div>
          ))}
          <div style={{ fontSize: '0.3rem', color: '#555', marginTop: 4 }}>
            HP: {stats.maxHp}
          </div>
        </div>

        {/* Moves */}
        <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
          <div style={{
            fontSize: '0.4rem', color: '#ffd700', marginBottom: 8,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>MOVES</span>
            <span style={{ color: '#666' }}>{player.moves.length}/{moveSlots} SLOTS</span>
          </div>
          {player.moves.map(moveId => {
            const move = getMove(moveId);
            if (!move) return null;
            const mColor = STYLE_COLORS[move.style];
            return (
              <div key={moveId} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 0', borderBottom: '1px solid #1a1a1a',
              }}>
                <div>
                  <span style={{ fontSize: '0.38rem', color: '#ddd' }}>{move.name}</span>
                  <span style={{ fontSize: '0.28rem', color: mColor, marginLeft: 6 }}>
                    {move.category.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.28rem', color: '#888' }}>
                  PWR:{move.power} ACC:{move.accuracy} STA:{move.staminaCost}
                </div>
              </div>
            );
          })}
        </div>

        {/* Belt progression */}
        <div style={{ background: '#111', padding: '10px 12px', border: '1px solid #222' }}>
          <div style={{ fontSize: '0.4rem', color: '#ffd700', marginBottom: 8 }}>BELT PROGRESSION</div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {BELTS.map(belt => {
              const isCurrentOrPast = BELTS.indexOf(belt) <= BELTS.indexOf(player.belt);
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
          <div style={{ fontSize: '0.3rem', color: '#666', textAlign: 'center', marginTop: 6 }}>
            Move slots: {moveSlots} | Next unlock: {nextBelt ? BELT_MOVE_SLOTS[nextBelt] : 'MAX'}
          </div>
        </div>
      </div>
    </div>
  );
}
