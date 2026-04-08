import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BattleState } from '../engine/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/constants';
import { createBattleState, getPlayerMoves, executeTurn } from '../battle/BattleEngine';
import { renderBattle } from '../render/BattleRenderer';
import { getRole, getPositionDisplayName } from '../data/positions';
import MovePanel from '../components/MovePanel';
import { loadPlayer, loadOpponent, saveBattleResult } from '../state/saveLoad';

export default function BattleScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    setState(createBattleState(player, opponent));
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

  // Handle move selection
  const handleMoveSelect = useCallback((moveId: string) => {
    if (!state || state.phase !== 'select-move') return;

    setAnimFrame(1);
    setTimeout(() => setAnimFrame(0), 200);

    const newState = executeTurn(state, moveId);
    setState(newState);

    if (newState.phase === 'battle-over') {
      const isWin = newState.winner === 'player';
      const isDraw = newState.winner === null;
      const xpGained = isWin
        ? 100 + Math.floor(newState.turn * 2)
        : isDraw ? 50 : Math.floor(30 + newState.turn);

      setTimeout(() => {
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
        });
        navigate('/results');
      }, 2500);
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
    <div style={{
      width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#0a0a14', overflow: 'hidden',
    }}>
      {/* Scoreboard */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '4px 10px', background: '#0d0d1a', borderBottom: '1px solid #222',
        fontSize: '0.35rem',
      }}>
        <div style={{ color: '#22c55e', textAlign: 'left' }}>
          <div>{playerName}</div>
          <div style={{ fontSize: '0.5rem', fontWeight: 'bold' }}>{state.playerPoints}</div>
          <div style={{ color: '#666' }}>adv: {state.playerAdvantages}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '0.3rem' }}>TURNS LEFT</div>
          <div style={{
            color: turnsLeft <= 3 ? '#ef4444' : '#ffd700',
            fontSize: '0.6rem',
            animation: turnsLeft <= 3 ? 'pulse 0.5s infinite' : 'none',
          }}>
            {turnsLeft}
          </div>
          <div style={{ color: initiativeColor, fontSize: '0.25rem' }}>{initiativeText}</div>
        </div>
        <div style={{ color: '#ef4444', textAlign: 'right' }}>
          <div>{opponentName}</div>
          <div style={{ fontSize: '0.5rem', fontWeight: 'bold' }}>{state.opponentPoints}</div>
          <div style={{ color: '#666' }}>adv: {state.opponentAdvantages}</div>
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
        <div
          ref={logRef}
          className="no-scrollbar"
          style={{
            fontSize: '0.38rem', padding: '2px 10px',
            maxHeight: 100, overflowY: 'auto', lineHeight: 1.7,
            background: '#0d0d1a', borderTop: '1px solid #222', borderBottom: '1px solid #222',
          }}
        >
          {state.log.slice(-8).flatMap((line, i) =>
            line.split('\n').map((subline, j) => (
              <div key={`${i}-${j}`} style={{ color: getLogColor(subline) }}>
                {subline}
              </div>
            ))
          )}
        </div>

        {/* Position indicator */}
        <div style={{
          textAlign: 'center', fontSize: '0.5rem', color: '#ffd700',
          padding: '2px 0',
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
          <div style={{
            textAlign: 'center', padding: 16, fontSize: '0.7rem',
            color: state.winner === 'player' ? '#22c55e' : state.winner === null ? '#888' : '#ef4444',
            animation: 'pulse 1s infinite',
          }}>
            {state.winner === 'player' ? 'YOU WIN!' : state.winner === null ? 'DRAW' : 'YOU LOSE!'}
            <div style={{ fontSize: '0.4rem', color: '#888', marginTop: 8 }}>
              {state.winMethod === 'submission' ? 'by SUBMISSION' :
               state.winMethod === 'points' ? 'by POINTS' :
               state.winMethod === 'advantages' ? 'by ADVANTAGES' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
