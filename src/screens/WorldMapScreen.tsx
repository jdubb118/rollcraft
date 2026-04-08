import { useNavigate } from 'react-router-dom';
import { REGIONS } from '../data/world';
import { isRegionUnlocked } from '../data/world';
import { loadPlayer, loadProgression, updateProgression, spendMoney } from '../state/saveLoad';
import { STYLE_NAMES } from '../engine/constants';
import { getRegionMap } from '../overworld/maps/registry';

// Region positions on the visual map (percentage-based)
const REGION_POSITIONS: Record<string, { x: number; y: number }> = {
  'home':             { x: 50, y: 88 },
  'scramble-valley':  { x: 50, y: 74 },
  'old-town':         { x: 50, y: 58 },
  'steel-mountain':   { x: 70, y: 44 },
  'coral-bay':        { x: 30, y: 44 },
  'sambo-district':   { x: 70, y: 30 },
  'nova-camp':        { x: 30, y: 30 },
  'iron-coast':       { x: 50, y: 18 },
  'summit-city':      { x: 50, y: 5 },
};

// Connections between regions (for drawing lines)
const CONNECTIONS = [
  ['home', 'scramble-valley'],
  ['scramble-valley', 'old-town'],
  ['old-town', 'steel-mountain'],
  ['old-town', 'coral-bay'],
  ['steel-mountain', 'sambo-district'],
  ['coral-bay', 'nova-camp'],
  ['sambo-district', 'iron-coast'],
  ['nova-camp', 'iron-coast'],
  ['iron-coast', 'summit-city'],
];

export default function WorldMapScreen() {
  const navigate = useNavigate();
  const player = loadPlayer();
  const progression = loadProgression();

  if (!player) { navigate('/'); return null; }

  const npcWinCount = Object.keys(progression.npcDefeated).length;
  const tournamentWins = progression.tournamentResults
    .filter(r => r.placement === 'gold')
    .map(r => r.tournamentId);

  const handleRegionClick = (regionId: string) => {
    const unlocked = isRegionUnlocked(regionId, player.belt, progression.stamps, tournamentWins, npcWinCount);
    if (!unlocked) return;

    // Check if region has a map
    const regionMap = getRegionMap(regionId);
    if (!regionMap) return; // region not built yet

    // Pay drop-in fee if visiting (not home gym)
    if (regionMap.dropInFee > 0 && regionId !== progression.currentRegionId) {
      if (progression.money < regionMap.dropInFee) {
        alert(`Drop-in fee: $${regionMap.dropInFee} Mat Bucks. You have $${progression.money}.`);
        return;
      }
      spendMoney(regionMap.dropInFee);
    }

    // Save current region and navigate
    updateProgression({ currentRegionId: regionId });
    navigate('/overworld');
  };

  return (
    <div className="game-shell">
      {/* Header */}
      <div style={{
        padding: '8px 12px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', background: '#0d0d1a', borderBottom: '1px solid #222',
      }}>
        <button
          onClick={() => navigate('/overworld')}
          style={{
            padding: '6px 12px', background: '#1a1a2e', color: '#888',
            fontSize: 'var(--fs-xs)', border: '1px solid #444',
          }}
        >
          BACK
        </button>
        <span style={{ fontSize: 'var(--fs-md)', color: '#ffd700' }}>WORLD MAP</span>
        <span style={{ fontSize: 'var(--fs-xs)', color: '#888' }}>
          {progression.stamps.length}/8 STAMPS | ${progression.money}
        </span>
      </div>

      {/* Map area */}
      <div style={{
        flex: 1, position: 'relative', padding: 16, overflow: 'hidden',
      }}>
        {/* Draw connections */}
        <svg style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          pointerEvents: 'none',
        }}>
          {CONNECTIONS.map(([from, to]) => {
            const fromPos = REGION_POSITIONS[from];
            const toPos = REGION_POSITIONS[to];
            const fromUnlocked = isRegionUnlocked(from, player.belt, progression.stamps, tournamentWins, npcWinCount);
            const toUnlocked = isRegionUnlocked(to, player.belt, progression.stamps, tournamentWins, npcWinCount);
            const lineColor = fromUnlocked && toUnlocked ? '#444' : '#1a1a1a';
            return (
              <line
                key={`${from}-${to}`}
                x1={`${fromPos.x}%`} y1={`${fromPos.y}%`}
                x2={`${toPos.x}%`} y2={`${toPos.y}%`}
                stroke={lineColor} strokeWidth="2" strokeDasharray={toUnlocked ? 'none' : '4,4'}
              />
            );
          })}
        </svg>

        {/* Region nodes */}
        {REGIONS.map(region => {
          const pos = REGION_POSITIONS[region.id];
          if (!pos) return null;

          const unlocked = isRegionUnlocked(region.id, player.belt, progression.stamps, tournamentWins, npcWinCount);
          const hasStamp = region.stampId && progression.stamps.includes(region.stampId);
          const isCurrent = progression.currentRegionId === region.id;

          return (
            <button
              key={region.id}
              onClick={() => handleRegionClick(region.id)}
              disabled={!unlocked}
              style={{
                position: 'absolute',
                left: `${pos.x}%`, top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 60, minHeight: 40,
                padding: '4px 6px',
                background: unlocked ? `${region.color}22` : '#111',
                border: `2px solid ${unlocked ? region.color : '#333'}`,
                color: unlocked ? '#fff' : '#555',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 2,
                opacity: unlocked ? 1 : 0.5,
              }}
            >
              {/* Stamp indicator */}
              {hasStamp && (
                <div style={{
                  position: 'absolute', top: -8, right: -8,
                  width: 14, height: 14, borderRadius: '50%',
                  background: region.color, border: '2px solid #000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.2rem', color: '#000',
                }}>
                  ✓
                </div>
              )}

              {/* Current location indicator */}
              {isCurrent && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  fontSize: '0.2rem', color: '#ffd700',
                }} className="blink">
                  ▼ YOU
                </div>
              )}

              <span style={{ fontSize: 7, fontWeight: 'bold', textAlign: 'center', lineHeight: 1.3 }}>
                {region.name.toUpperCase()}
              </span>
              {region.styleSpecialty && unlocked && (
                <span style={{ fontSize: 6, color: region.color }}>
                  {STYLE_NAMES[region.styleSpecialty]}
                </span>
              )}
              {!unlocked && (
                <span style={{ fontSize: 6, color: '#666' }}>LOCKED</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom info */}
      <div style={{
        padding: '8px 12px', background: '#0d0d1a', borderTop: '1px solid #222',
        fontSize: '0.3rem', color: '#666', textAlign: 'center',
      }}>
        TAP A REGION TO TRAVEL
      </div>
    </div>
  );
}
