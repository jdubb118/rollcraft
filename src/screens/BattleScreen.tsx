import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BattleState } from '../engine/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/constants';
import { createBattleState, getPlayerMoves, executeTurn } from '../battle/BattleEngine';
import { renderBattle } from '../render/BattleRenderer';
import { POSITIONS } from '../data/positions';
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

    // Flash animation
    setAnimFrame(1);
    setTimeout(() => setAnimFrame(0), 200);

    const newState = executeTurn(state, moveId);
    setState(newState);

    if (newState.phase === 'battle-over' && newState.winner) {
      const xpGained = newState.winner === 'player'
        ? 100 + Math.floor(newState.turn * 2)
        : Math.floor(30 + newState.turn);

      setTimeout(() => {
        saveBattleResult({
          winner: newState.winner!,
          method: newState.log.some(l => l.includes('taps out')) ? 'submission' : 'ko',
          xpGained,
          turns: newState.turn,
          playerName: newState.player.grappler.name,
          opponentName: newState.opponent.grappler.name,
          opponentStyle: newState.opponent.grappler.style,
        });
        navigate('/results');
      }, 2500);
    }
  }, [state, navigate]);

  if (!state) return <div style={{ color: '#fff', padding: 20 }}>Loading...</div>;

  const playerMoves = getPlayerMoves(state);
  const posName = POSITIONS[state.playerPosition].name;
  const isOver = state.phase === 'battle-over';

  // Color-code log lines
  const playerName = state.player.grappler.name;
  const opponentName = state.opponent.grappler.name;

  function getLogColor(line: string): string {
    if (line.startsWith('---')) return '#555';
    if (line.startsWith(playerName)) return '#22c55e';
    if (line.startsWith(opponentName)) return '#ef4444';
    if (line.includes('super effective') || line.includes('effective!')) return '#ffd700';
    if (line.includes('Not very')) return '#888';
    if (line.includes('TAP') || line.includes('taps out') || line.includes("can't continue")) return '#ff6b6b';
    if (line.includes('Position:')) return '#ffd700';
    if (line.includes('deals')) return '#ccc';
    if (line.includes('missed')) return '#666';
    if (line.includes('Escaped') || line.includes('escaped')) return '#3b82f6';
    return '#aaa';
  }

  return (
    <div style={{
      width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#0a0a14', overflow: 'hidden',
    }}>
      {/* Canvas area */}
      <div style={{
        flex: '1 1 45%', display: 'flex', justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden', minHeight: 0,
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            width: '100%', maxWidth: 480, height: 'auto',
            imageRendering: 'pixelated',
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
        {/* Battle log — above moves, scrollable */}
        <div
          ref={logRef}
          className="no-scrollbar"
          style={{
            fontSize: '0.38rem', padding: '2px 10px',
            maxHeight: 72, overflowY: 'auto', lineHeight: 1.7,
            background: '#0d0d1a', borderTop: '1px solid #222', borderBottom: '1px solid #222',
          }}
        >
          {state.log.slice(-8).map((line, i) => (
            <div key={i} style={{ color: getLogColor(line) }}>
              {line}
            </div>
          ))}
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
            color: state.winner === 'player' ? '#22c55e' : '#ef4444',
            animation: 'pulse 1s infinite',
          }}>
            {state.winner === 'player' ? 'YOU WIN!' : 'YOU LOSE!'}
          </div>
        )}
      </div>
    </div>
  );
}
