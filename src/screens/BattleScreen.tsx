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
      // Save result and navigate after delay
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
      }, 2000);
    }
  }, [state, navigate]);

  if (!state) return <div style={{ color: '#fff', padding: 20 }}>Loading...</div>;

  const playerMoves = getPlayerMoves(state);
  const posName = POSITIONS[state.playerPosition].name;
  const isOver = state.phase === 'battle-over';

  return (
    <div style={{
      width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#0a0a14', overflow: 'hidden',
    }}>
      {/* Canvas area */}
      <div style={{
        flex: '1 1 55%', display: 'flex', justifyContent: 'center', alignItems: 'center',
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
        gap: 6, maxHeight: '45%',
      }}
      className="safe-bottom"
      >
        {/* Position indicator */}
        <div style={{
          textAlign: 'center', fontSize: '0.55rem', color: '#ffd700',
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

        {/* Battle log */}
        <div
          ref={logRef}
          className="no-scrollbar"
          style={{
            fontSize: '0.4rem', color: '#888', padding: '0 12px',
            maxHeight: 48, overflowY: 'auto', lineHeight: 1.6,
          }}
        >
          {state.log.slice(-4).map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
