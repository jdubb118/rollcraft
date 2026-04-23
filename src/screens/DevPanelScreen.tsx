import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadPlayer, savePlayer, loadProgression, saveProgression, addMoney, clearAll,
} from '../state/saveLoad';
import type { Belt } from '../engine/types';
import { BELT_XP_THRESHOLDS } from '../engine/types';
import { REGIONS } from '../data/world';

const BELTS: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];

export default function DevPanelScreen() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const player = loadPlayer();
  const prog = loadProgression();

  const setBelt = (belt: Belt) => {
    if (!player) return;
    player.belt = belt;
    player.xp = Math.max(player.xp, BELT_XP_THRESHOLDS[belt]);
    savePlayer(player);
    refresh();
  };

  const addMoneyDev = (n: number) => { addMoney(n); refresh(); };

  const unlockAllRegions = () => {
    for (const r of REGIONS) {
      if (r.stampId && !prog.stamps.includes(r.stampId)) prog.stamps.push(r.stampId);
    }
    saveProgression(prog);
    refresh();
  };

  const teleport = (regionId: string) => {
    prog.currentRegionId = regionId;
    saveProgression(prog);
    navigate('/overworld');
  };

  const wipeSave = () => {
    if (!confirm('Wipe ALL local save data? Cloud save (if signed in) will re-sync next push.')) return;
    clearAll();
    navigate('/');
  };

  const row = { display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 6 };
  const btn = (active = false, danger = false) => ({
    padding: '6px 10px',
    background: danger ? '#3a1a1a' : active ? '#2a3a1a' : '#1a1a2e',
    color: danger ? '#ef4444' : active ? '#22c55e' : '#ccc',
    border: `1px solid ${danger ? '#ef4444' : active ? '#22c55e' : '#444'}`,
    fontSize: 'var(--fs-xs)',
    cursor: 'pointer',
  });
  const section = { padding: '10px 0', borderBottom: '1px solid #222' };
  const label = { color: '#ffd700', fontSize: 'var(--fs-xs)', marginBottom: 4 };

  return (
    <div className="game-shell" style={{ overflow: 'auto', padding: 16 }} data-tick={tick}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ color: '#ff6b6b', fontSize: 'var(--fs-md)' }}>DEV PANEL</div>
        <button onClick={() => navigate(-1)} style={btn()}>BACK</button>
      </div>
      <div style={{ color: '#888', fontSize: 'var(--fs-xs)', marginBottom: 12 }}>
        Test cheats. Not exposed in normal nav — visit /dev directly.
      </div>

      {!player ? (
        <div style={{ color: '#aaa', fontSize: 'var(--fs-xs)', padding: 12, background: '#1a1a2e', border: '1px solid #444' }}>
          No save yet. Create a fighter first → <button onClick={() => navigate('/create')} style={btn()}>CREATE</button>
        </div>
      ) : (
        <>
          <div style={section}>
            <div style={label}>FIGHTER — {player.name} ({player.style}, {player.belt}, xp {player.xp})</div>
          </div>

          <div style={section}>
            <div style={label}>SET BELT</div>
            <div style={row}>
              {BELTS.map((b) => (
                <button key={b} onClick={() => setBelt(b)} style={btn(player.belt === b)}>{b.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <div style={section}>
            <div style={label}>MAT BUCKS — {prog.money}</div>
            <div style={row}>
              <button onClick={() => addMoneyDev(100)} style={btn()}>+100</button>
              <button onClick={() => addMoneyDev(1000)} style={btn()}>+1,000</button>
              <button onClick={() => addMoneyDev(10000)} style={btn()}>+10,000</button>
            </div>
          </div>

          <div style={section}>
            <div style={label}>REGIONS</div>
            <div style={row}>
              <button onClick={unlockAllRegions} style={btn()}>UNLOCK ALL STAMPS</button>
            </div>
            <div style={{ ...row, marginTop: 8 }}>
              {REGIONS.map((r) => (
                <button key={r.id} onClick={() => teleport(r.id)} style={btn(prog.currentRegionId === r.id)}>
                  ↪ {r.name}
                </button>
              ))}
            </div>
          </div>

          <div style={section}>
            <div style={label}>RECORD — {prog.totalWins}W / {prog.totalLosses}L</div>
            <div style={row}>
              <button onClick={() => { prog.totalWins += 5; saveProgression(prog); refresh(); }} style={btn()}>+5 WINS</button>
              <button onClick={() => { prog.totalLosses += 1; saveProgression(prog); refresh(); }} style={btn()}>+1 LOSS</button>
            </div>
          </div>

          <div style={section}>
            <div style={label}>DANGER ZONE</div>
            <div style={row}>
              <button onClick={wipeSave} style={btn(false, true)}>WIPE LOCAL SAVE</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
