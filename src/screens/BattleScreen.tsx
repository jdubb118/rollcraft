import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BattleState } from '../engine/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/constants';
import { createBattleState, getPlayerMoves, executeTurn } from '../battle/BattleEngine';
import { renderBattle } from '../render/BattleRenderer';
import { getRole, getPositionDisplayName } from '../data/positions';
import MovePanel from '../components/MovePanel';
import { loadPlayer, loadOpponent, saveBattleResult, isScouted, markScouted, getInventory, useItem } from '../state/saveLoad';
import ScoutPanel from '../components/ScoutPanel';
import { sfxHit, sfxCritical, sfxMiss, sfxSubmissionLock, sfxTap, sfxPointsScored, sfxTimeUp, sfxStunned, sfxEscape, sfxMenuSelect, initAudio } from '../engine/sound';

function playSoundsForLines(lines: string[]) {
  const text = lines.join('\n');
  if (text.includes('taps out') || text.includes('SUBMISSION')) sfxTap();
  else if (text.includes('CRITICAL')) sfxCritical();
  else if (text.includes('connects')) sfxHit();
  else if (text.includes('missed') || text.includes('goes nowhere')) sfxMiss();
  if (text.includes('tightening') || text.includes('VERY TIGHT') || text.includes('LOCKED IN')) sfxSubmissionLock();
  if (text.includes('⚡') && text.includes('points')) sfxPointsScored();
  if (text.includes('⏱ TIME')) sfxTimeUp();
  if (text.includes('STUNNED')) sfxStunned();
  if (text.includes('Escaped') || text.includes('retained') || text.includes('Scrambled')) sfxEscape();
}

export default function BattleScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showScout, setShowScout] = useState(false);
  const [state, setState] = useState<BattleState | null>(null);
  const [animFrame, setAnimFrame] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Initialize battle
  useEffect(() => {
    const player = loadPlayer();
    const opponent = loadOpponent();
    if (!player || !opponent) {
      navigate('/create');
      return;
    }
    const battleState = createBattleState(player, opponent);

    // Apply consumable items from inventory
    const inv = getInventory();
    if (inv['athletic-tape']) { useItem('athletic-tape'); battleState.player.currentHp = Math.min(battleState.player.stats.maxHp, battleState.player.currentHp + Math.floor(battleState.player.stats.maxHp * 0.3)); battleState.log.push('Athletic Tape applied — HP +30%'); }
    if (inv['acai-bowl']) { useItem('acai-bowl'); battleState.player.currentHp = battleState.player.stats.maxHp; battleState.log.push('Acai Bowl — full HP restore!'); }
    if (inv['electrolytes']) { useItem('electrolytes'); battleState.player.currentStamina = battleState.player.maxStamina; battleState.log.push('Electrolytes — full stamina!'); }
    if (inv['energy-gel']) { useItem('energy-gel'); battleState.player.currentStamina = Math.min(battleState.player.maxStamina, battleState.player.currentStamina + Math.floor(battleState.player.maxStamina * 0.3)); battleState.log.push('Energy Gel — stamina +30%'); }

    setState(battleState);
  }, [navigate]);

  // Render canvas
  useEffect(() => {
    if (!state || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    renderBattle(ctx, state, animFrame);
  }, [state, animFrame]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state?.log.length]);

  // Handle move selection — with pacing between moves
  const handleMoveSelect = useCallback((moveId: string) => {
    if (!state || state.phase !== 'select-move') return;
    initAudio();
    sfxMenuSelect();

    // Execute the full turn
    const newState = executeTurn(state, moveId);
    const oldLogLen = state.log.length;
    const newLines = newState.log.slice(oldLogLen);

    // Drip-feed log lines with delays for readable pacing
    // Find the split between first actor and second actor
    let splitIdx = 0;
    for (let i = 1; i < newLines.length; i++) {
      if (newLines[i].includes('attempts') || newLines[i].includes('SPAZ') || newLines[i].includes('stalls') || newLines[i].includes('is stunned')) {
        splitIdx = i;
        break;
      }
    }
    if (splitIdx === 0) splitIdx = newLines.length;

    // Phase 1: first actor's moves (immediate)
    const phase1 = { ...newState, log: [...state.log, ...newLines.slice(0, splitIdx)], phase: 'animating' as const };
    setState(phase1);
    setAnimFrame(1);
    setTimeout(() => setAnimFrame(0), 250);

    // Play sounds for first actor's lines
    playSoundsForLines(newLines.slice(0, splitIdx));

    // Phase 2: second actor's moves (after delay)
    const delay = Math.min(1200, 400 + splitIdx * 150);
    setTimeout(() => {
      setState(newState);
      setAnimFrame(2);
      setTimeout(() => setAnimFrame(0), 250);
      // Play sounds for second actor's lines
      playSoundsForLines(newLines.slice(splitIdx));
    }, delay);

    if (newState.phase === 'battle-over') {
      const isWin = newState.winner === 'player';
      const isDraw = newState.winner === null;
      // XP scales by opponent belt level — harder fights reward more
      const beltMultiplier: Record<string, number> = { white: 1, blue: 1.5, purple: 2, brown: 2.5, black: 3 };
      const mult = beltMultiplier[newState.opponent.grappler.belt] || 1;
      const baseXp = isWin ? 100 + Math.floor(newState.turn * 2) : isDraw ? 50 : Math.floor(30 + newState.turn);
      const xpGained = Math.floor(baseXp * mult);

      // Mark opponent as scouted (now you know their tendencies)
      markScouted(newState.opponent.grappler.name);

      // Check if this is a tournament match
      const activeTourneyId = localStorage.getItem('rollcraft-active-tourney-id');
      if (activeTourneyId) localStorage.removeItem('rollcraft-active-tourney-id');

      saveBattleResult({
        winner: newState.winner ?? 'draw',
        method: newState.winMethod ?? 'points',
        xpGained,
        turns: newState.turn,
        playerName: newState.player.grappler.name,
        opponentName: newState.opponent.grappler.name,
        opponentStyle: newState.opponent.grappler.style,
        playerPoints: newState.playerPoints,
        opponentPoints: newState.opponentPoints,
        tournamentId: activeTourneyId || undefined,
        moveUsage: newState.moveUsage,
      });
    }
  }, [state, navigate]);

  if (!state) return <div style={{ color: '#fff', padding: 20 }}>Loading...</div>;

  const playerMoves = getPlayerMoves(state);
  const playerRole = getRole(state.position, state.topFighter, 'player');
  const posName = getPositionDisplayName(state.position, playerRole);
  const isOver = state.phase === 'battle-over';
  const turnsLeft = Math.max(0, state.maxTurns - state.turn + 1);

  // Color-code log lines
  const playerName = state.player.grappler.name;
  const opponentName = state.opponent.grappler.name;

  function getLogColor(line: string): string {
    if (line.startsWith('---')) return '#555';
    if (line.startsWith(playerName)) return '#22c55e';
    if (line.startsWith(opponentName)) return '#ef4444';
    if (line.includes('⚡')) return '#ffd700';
    if (line.includes('△')) return '#aaa';
    if (line.includes('super effective') || line.includes('effective!')) return '#ffd700';
    if (line.includes('Not very')) return '#888';
    if (line.includes('TAP') || line.includes('taps out') || line.includes("can't continue") || line.includes('SUBMISSION')) return '#ff6b6b';
    if (line.includes('Position:')) return '#ffd700';
    if (line.includes('connects')) return '#ccc';
    if (line.includes('missed')) return '#666';
    if (line.includes('Escaped') || line.includes('escaped')) return '#3b82f6';
    if (line.includes('⏱') || line.includes('TIME')) return '#ff9800';
    if (line.includes('POINTS') || line.includes('ADVANTAGES')) return '#ffd700';
    if (line.includes('DRAW')) return '#888';
    if (line.includes('initiative')) return '#ef4444';
    if (line.includes('no longer valid')) return '#ef4444';
    if (line.includes('LOCKED IN') || line.includes('VERY TIGHT')) return '#ff6b6b';
    if (line.includes('TIGHT') || line.includes('tightening')) return '#ff9800';
    if (line.includes('SLIPPING') || line.includes('DEFENDED')) return '#3b82f6';
    if (line.includes('ALMOST HAD IT')) return '#ff9800';
    if (line.includes('Phase ') && line.includes('/3')) return '#888';
    if (line.includes('[█') || line.includes('[░')) return '#aaa';
    if (line.includes('try again')) return '#ffd700';
    return '#aaa';
  }

  // Who has initiative indicator
  const initiativeText = state.firstActor === 'opponent'
    ? `${opponentName} has initiative` : 'You have initiative';
  const initiativeColor = state.firstActor === 'opponent' ? '#ef4444' : '#22c55e';

  return (
    <div className="game-shell">
      {/* Scoreboard */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', background: '#0d0d1a', borderBottom: '1px solid #222',
        fontSize: 'var(--fs-sm)',
      }}>
        <div style={{ color: '#22c55e', textAlign: 'left', minWidth: 80 }}>
          <div>{playerName}</div>
          <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 'bold' }}>{state.playerPoints}</div>
          <div style={{ color: '#666', fontSize: 'var(--fs-xs)' }}>adv: {state.playerAdvantages}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: 'var(--fs-xs)' }}>TURNS LEFT</div>
          <div style={{
            color: turnsLeft <= 3 ? '#ef4444' : '#ffd700',
            fontSize: 'var(--fs-xxl)',
            animation: turnsLeft <= 3 ? 'pulse 0.5s infinite' : 'none',
          }}>
            {turnsLeft}
          </div>
          <div style={{ color: initiativeColor, fontSize: 'var(--fs-xs)' }}>{initiativeText}</div>
        </div>
        <div style={{ color: '#ef4444', textAlign: 'right', minWidth: 80 }}>
          <div>{opponentName}</div>
          <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 'bold' }}>{state.opponentPoints}</div>
          <div style={{ color: '#666', fontSize: 'var(--fs-xs)' }}>adv: {state.opponentAdvantages}</div>
          <button
            onClick={() => setShowScout(true)}
            style={{
              marginTop: 2, padding: '2px 6px', background: '#1a1a2e',
              color: '#3498db', fontSize: 7, border: '1px solid #3498db',
            }}
          >
            SCOUT
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div style={{
        flex: '1 1 40%', display: 'flex', justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden', minHeight: 0,
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            width: '100%', height: '100%',
            imageRendering: 'pixelated',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* UI area */}
      <div style={{
        flex: '0 0 auto', padding: '4px 0 8px', display: 'flex', flexDirection: 'column',
        gap: 4, maxHeight: '55%',
      }}
      className="safe-bottom"
      >
        {/* Battle log */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const text = state.log.join('\n');
              const btn = e.currentTarget;
              try {
                // Try clipboard API first
                navigator.clipboard.writeText(text).then(() => {
                  btn.textContent = '✓ copied';
                  setTimeout(() => { btn.textContent = '📋'; }, 1500);
                }).catch(() => {
                  // Fallback: textarea select+copy
                  const ta = document.createElement('textarea');
                  ta.value = text;
                  ta.style.position = 'fixed';
                  ta.style.opacity = '0';
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                  btn.textContent = '✓ copied';
                  setTimeout(() => { btn.textContent = '📋'; }, 1500);
                });
              } catch {
                // Final fallback
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                btn.textContent = '✓ copied';
                setTimeout(() => { btn.textContent = '📋'; }, 1500);
              }
            }}
            style={{
              position: 'absolute', top: 2, right: 6, zIndex: 10,
              background: '#1a1a2e', border: '1px solid #333', color: '#888',
              fontSize: 'var(--fs-xs)', cursor: 'pointer', padding: '2px 6px',
              borderRadius: 3,
            }}
          >📋</button>
        <div
          ref={logRef}
          className="no-scrollbar"
          style={{
            fontSize: 'var(--fs-sm)', padding: '4px 12px',
            maxHeight: isOver ? 250 : 130, overflowY: 'auto', lineHeight: 1.6,
            wordBreak: 'break-word',
            background: '#0d0d1a', borderTop: '1px solid #222', borderBottom: '1px solid #222',
          }}
        >
          {(isOver ? state.log : state.log.slice(-8)).flatMap((line, i) =>
            line.split('\n').map((subline, j) => (
              <div key={`${i}-${j}`} style={{ color: getLogColor(subline) }}>
                {subline}
              </div>
            ))
          )}
        </div>
        </div>

        {/* Position indicator */}
        <div style={{
          textAlign: 'center', fontSize: 'var(--fs-md)', color: '#ffd700',
          padding: '4px 0',
        }}>
          {posName.toUpperCase()}
        </div>

        {/* Move panel */}
        {!isOver && (
          <MovePanel
            moves={playerMoves}
            onSelect={handleMoveSelect}
            disabled={state.phase !== 'select-move'}
            currentStamina={state.player.currentStamina}
          />
        )}

        {isOver && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <div style={{
              fontSize: 'var(--fs-xxl)',
              color: state.winner === 'player' ? '#22c55e' : state.winner === null ? '#888' : '#ef4444',
              animation: 'pulse 1s infinite',
            }}>
              {state.winner === 'player' ? 'YOU WIN!' : state.winner === null ? 'DRAW' : 'YOU LOSE!'}
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: '#888', marginTop: 4 }}>
              {state.winMethod === 'submission' ? 'by SUBMISSION' :
               state.winMethod === 'points' ? 'by POINTS' :
               state.winMethod === 'advantages' ? 'by ADVANTAGES' : ''}
            </div>
            <button
              onClick={() => {
                const isOnboarding = localStorage.getItem('rollcraft-onboarding-battle');
                if (isOnboarding) {
                  localStorage.removeItem('rollcraft-onboarding-battle');
                  // Go back to create screen for rival aftermath
                  localStorage.setItem('rollcraft-show-aftermath', 'true');
                  navigate('/create');
                } else {
                  navigate('/results');
                }
              }}
              style={{
                marginTop: 12, padding: '10px 24px', background: '#1a1a2e',
                color: '#ffd700', fontSize: 'var(--fs-sm)', border: '2px solid #ffd700',
              }}
            >
              CONTINUE
            </button>
          </div>
        )}
      </div>

      {/* Scout panel overlay — full screen over the game shell */}
      {showScout && (
        <ScoutPanel
          opponent={state.opponent}
          player={state.player}
          isKnown={isScouted(state.opponent.grappler.name)}
          onClose={() => setShowScout(false)}
        />
      )}
    </div>
  );
}
