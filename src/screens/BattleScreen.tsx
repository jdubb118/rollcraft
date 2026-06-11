import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BattleState } from '../engine/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/constants';
import { createBattleState, getPlayerMoves, executeTurn } from '../battle/BattleEngine';
import { renderBattle, getBattleAnchors } from '../render/BattleRenderer';
import { track } from '../engine/analytics';
import type { BattleEffects } from '../render/BattleRenderer';
import { getRole, getPositionDisplayName } from '../data/positions';
import MovePanel from '../components/MovePanel';
import { loadPlayer, loadOpponent, saveBattleResult, isScouted, markScouted, getInventory, useItem } from '../state/saveLoad';
import ScoutPanel from '../components/ScoutPanel';
import { sfxHit, sfxCritical, sfxMiss, sfxSubmissionLock, sfxTap, sfxPointsScored, sfxTimeUp, sfxStunned, sfxEscape, sfxMenuSelect, initAudio } from '../engine/sound';
import { createParticleSystem, type ParticleSystem } from '../engine/particles';
import { consumeFreshLegsWin, FRESH_LEGS_XP_MULT } from '../engine/daily';

interface ShakeState { amount: number; endsAt: number; }
interface FlashState { color: string; until: number; strength: number; }

function processBattleBeat(
  lines: string[],
  target: { x: number; y: number },
  particles: ParticleSystem,
  shakeRef: { current: ShakeState },
  flashRef: { current: FlashState },
) {
  const text = lines.join('\n');
  const now = Date.now();
  const setShake = (amount: number, ms: number) => {
    shakeRef.current = { amount, endsAt: now + ms };
  };
  const setFlash = (color: string, ms: number, strength = 0.35) => {
    flashRef.current = { color, until: now + ms, strength };
  };

  if (text.includes('taps out') || text.includes('SUBMISSION')) {
    sfxTap();
    particles.spawn({ x: target.x, y: target.y, kind: 'ring', color: '#ff6b6b', maxLife: 0.9, size: 4 });
    setShake(4, 420);
    setFlash('rgba(255,107,107,0.4)', 150, 0.4);
  } else if (text.includes('CRITICAL')) {
    sfxCritical();
    particles.spawnBurst('spark', target.x, target.y, 8, { color: '#ffd700', maxLife: 0.45, size: 2 });
    setShake(5, 280);
    setFlash('rgba(255,80,80,0.45)', 100, 0.45);
  } else if (text.includes('connects')) {
    sfxHit();
    particles.spawnBurst('dust', target.x, target.y + 4, 5, { color: '#d4a574', maxLife: 0.5, size: 2, gravity: 60 });
    setShake(2, 160);
    setFlash('rgba(255,255,255,0.3)', 80, 0.3);
  } else if (text.includes('missed') || text.includes('goes nowhere')) {
    sfxMiss();
    for (let i = 0; i < 3; i++) {
      particles.spawn({
        x: target.x + (Math.random() - 0.5) * 10, y: target.y,
        vx: (Math.random() - 0.5) * 100, vy: -20 + (Math.random() - 0.5) * 20,
        kind: 'streak', color: '#aaa', maxLife: 0.22, size: 1,
      });
    }
  }
  if (text.includes('tightening') || text.includes('VERY TIGHT') || text.includes('LOCKED IN')) {
    sfxSubmissionLock();
    particles.spawn({ x: target.x, y: target.y, kind: 'ring', color: '#ef4444', maxLife: 0.7, size: 3 });
    setShake(3, 260);
  }
  if (text.includes('⚡') && text.includes('points')) {
    sfxPointsScored();
    const m = text.match(/\+(\d+)\s*(?:⚡\s*)?points?/);
    const label = m ? `+${m[1]}` : '+2';
    particles.spawn({
      x: target.x, y: target.y - 8,
      vx: 0, vy: -30,
      kind: 'float', text: label, color: '#ffd700', maxLife: 0.9, size: 8,
    });
    setFlash('rgba(255,215,0,0.3)', 100, 0.3);
  }
  if (text.includes('⏱ TIME')) sfxTimeUp();
  if (text.includes('STUNNED')) {
    sfxStunned();
    setShake(3, 250);
  }
  if (text.includes('Escaped') || text.includes('retained') || text.includes('Scrambled')) sfxEscape();

  // ── Key-moment splashes — the big beats shouldn't live only in the log ──
  const splash = (label: string, color: string, size = 13) => {
    particles.spawn({
      x: 160, y: 96, vx: 0, vy: -14,
      kind: 'float', text: label, color, maxLife: 1.3, size,
    });
  };
  if (text.includes('⚡ TAKEDOWN!')) splash('TAKEDOWN!', '#ffd700');
  else if (text.includes('⚡ SWEEP!')) splash('SWEEP!', '#ffd700');
  else if (text.includes('⚡ GUARD PASS!')) splash('GUARD PASSED!', '#ffd700');
  else if (text.includes('⚡ MOUNT!')) splash('MOUNT!', '#ff9800');
  else if (text.includes('⚡ BACK CONTROL!')) splash('BACK TAKE!', '#ff9800');
  else if (text.includes('⚡ KNEE ON BELLY!')) splash('KNEE ON BELLY!', '#ffd700');
  if (text.includes('Phase 1/3')) splash('SUBMISSION!', '#ef4444', 11);
  if (text.includes('taps out')) splash('TAP!!', '#ff6b6b', 16);
}

const TUTORIAL_KEY = 'rollcraft-battle-tutorial-seen';

const TUTORIAL_STEPS = [
  {
    title: 'ONE MAT, ONE POSITION',
    body: 'You and your opponent share a single position — watch the gold label. Your available moves change with it. Mount and back control are where you want to be.',
  },
  {
    title: 'STAMINA IS LIFE',
    body: 'Every move burns stamina (the big bar). Gas out and everything starts failing. STALL to recover — but the ref penalizes stalling, so pick your moments.',
  },
  {
    title: 'WIN BY TAP OR POINTS',
    body: 'Submissions end it instantly. Otherwise score: takedown +2, sweep +2, pass +3, mount/back +4. When the turns run out, points decide it.',
  },
];

export default function BattleScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectsCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showScout, setShowScout] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<number>(() =>
    localStorage.getItem(TUTORIAL_KEY) ? -1 : 0
  );
  const [state, setState] = useState<BattleState | null>(null);
  const [animFrame, setAnimFrame] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const shakeRef = useRef<ShakeState>({ amount: 0, endsAt: 0 });
  const flashRef = useRef<FlashState>({ color: '', until: 0, strength: 0 });
  const particlesRef = useRef<ParticleSystem>(createParticleSystem(60));

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

  // Render canvas — RAF loop drives idle breath, shake decay, particle animation
  useEffect(() => {
    if (!state || !canvasRef.current || !effectsCanvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const fxCanvas = effectsCanvasRef.current;
    const fxCtx = fxCanvas.getContext('2d')!;
    fxCtx.imageSmoothingEnabled = false;
    // Get current region for battle background
    const regionId = localStorage.getItem('rollcraft-progression')
      ? (JSON.parse(localStorage.getItem('rollcraft-progression') || '{}').currentRegionId || 'home')
      : 'home';

    let rafId = 0;
    let stopped = false;
    let lastTime = 0;
    const frame = (time: number) => {
      if (stopped) return;
      const dt = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Compute shake offset (decays to 0 by endsAt)
      const now = Date.now();
      const shake = shakeRef.current;
      const remaining = Math.max(0, shake.endsAt - now);
      const shakeT = shake.endsAt > 0 ? remaining / Math.max(1, shake.endsAt - (shake.endsAt - 400)) : 0;
      const mag = shake.amount * shakeT;
      const shakeX = mag > 0 ? (Math.random() - 0.5) * 2 * mag : 0;
      const shakeY = mag > 0 ? (Math.random() - 0.5) * 2 * mag : 0;

      // Flash
      const flash = flashRef.current;
      const flashRemaining = Math.max(0, flash.until - now);
      const flashTotal = 160; // assume ~max flash duration for normalization
      const flashAlpha = flash.color
        ? Math.min(flash.strength, flash.strength * (flashRemaining / flashTotal))
        : 0;
      const effects: BattleEffects = {
        shakeX, shakeY,
        flashColor: flashAlpha > 0 ? flash.color : undefined,
        flashAlpha: flashAlpha > 0 ? flashAlpha : undefined,
      };

      renderBattle(ctx, state, animFrame, regionId, effects);

      // Update + render particles
      particlesRef.current.update(dt, { w: CANVAS_WIDTH, h: CANVAS_HEIGHT });
      fxCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      particlesRef.current.render(fxCtx);

      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
    return () => { stopped = true; cancelAnimationFrame(rafId); };
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

    // firstActor attacks → target the defender. In phase 1 the defender is the opposite of firstActor.
    // Anchors follow the live position layout so particles land on the actual fighters.
    const anchors = getBattleAnchors(newState);
    const phase1Target = newState.firstActor === 'opponent' ? anchors.playerCenter : anchors.opponentCenter;
    const phase2Target = newState.firstActor === 'opponent' ? anchors.opponentCenter : anchors.playerCenter;

    // Phase 1: first actor's moves (immediate)
    const phase1 = { ...newState, log: [...state.log, ...newLines.slice(0, splitIdx)], phase: 'animating' as const };
    setState(phase1);
    setAnimFrame(1);
    setTimeout(() => setAnimFrame(0), 250);

    processBattleBeat(newLines.slice(0, splitIdx), phase1Target, particlesRef.current, shakeRef, flashRef);

    // Phase 2: second actor's moves (after delay)
    const delay = Math.min(1200, 400 + splitIdx * 150);
    setTimeout(() => {
      setState(newState);
      setAnimFrame(2);
      setTimeout(() => setAnimFrame(0), 250);
      processBattleBeat(newLines.slice(splitIdx), phase2Target, particlesRef.current, shakeRef, flashRef);
    }, delay);

    if (newState.phase === 'battle-over') {
      const isWin = newState.winner === 'player';
      const isDraw = newState.winner === null;
      // XP scales by opponent belt level — harder fights reward more
      const beltMultiplier: Record<string, number> = { white: 1, blue: 1.5, purple: 2, brown: 2.5, black: 3 };
      const mult = beltMultiplier[newState.opponent.grappler.belt] || 1;
      const baseXp = isWin ? 100 + Math.floor(newState.turn * 2) : isDraw ? 50 : Math.floor(30 + newState.turn);
      // Challenge opponents come from untrusted URLs — flat XP so crafted
      // max-belt links can't be farmed for progression.
      const isChallengeOpp = newState.opponent.grappler.id.startsWith('challenge-');
      let xpGained = isChallengeOpp ? Math.min(60, baseXp) : Math.floor(baseXp * mult);

      // Fresh Legs — first wins of the day hit different
      let freshLegs = false;
      if (isWin) {
        freshLegs = consumeFreshLegsWin();
        if (freshLegs) xpGained = Math.floor(xpGained * FRESH_LEGS_XP_MULT);
      }

      // Mark opponent as scouted (now you know their tendencies)
      markScouted(newState.opponent.grappler.name);

      // Funnel analytics — onboarding battle vs regular, win/loss/draw
      const isOnboardingBattle = !!localStorage.getItem('rollcraft-onboarding-battle');
      const outcome = isWin ? 'win' : isDraw ? 'draw' : 'loss';
      track('battle-result', isOnboardingBattle ? `first-${outcome}` : outcome);
      if (newState.opponent.grappler.id.startsWith('challenge-')) track('challenge-accepted', outcome);

      // Check if this is a tournament match
      const activeTourneyId = localStorage.getItem('rollcraft-active-tourney-id');
      if (activeTourneyId) localStorage.removeItem('rollcraft-active-tourney-id');

      saveBattleResult({
        ts: Date.now(),
        winner: newState.winner ?? 'draw',
        method: newState.winMethod ?? 'points',
        xpGained,
        freshLegs,
        finishingMoveId: newState.finishingMoveId,
        turns: newState.turn,
        playerName: newState.player.grappler.name,
        opponentName: newState.opponent.grappler.name,
        opponentId: newState.opponent.grappler.id,
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
    <div className="game-shell" style={{ overflow: isOver ? 'auto' : 'hidden' }}>
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
        overflow: 'hidden', minHeight: 0, position: 'relative',
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
        <canvas
          ref={effectsCanvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            imageRendering: 'pixelated',
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 40,
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
            maxHeight: isOver ? 150 : 130, overflowY: 'auto', lineHeight: 1.6,
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
          <div style={{ textAlign: 'center', padding: '4px 16px 16px' }}>
            <div style={{
              fontSize: 'var(--fs-lg)',
              color: state.winner === 'player' ? '#22c55e' : state.winner === null ? '#888' : '#ef4444',
            }}>
              {state.winner === 'player' ? 'YOU WIN!' : state.winner === null ? 'DRAW' : 'YOU LOSE!'}
              <span style={{ fontSize: 'var(--fs-xs)', color: '#888', marginLeft: 8 }}>
                {state.winMethod === 'submission' ? 'by SUBMISSION' :
                 state.winMethod === 'points' ? 'by POINTS' :
                 state.winMethod === 'advantages' ? 'by ADVANTAGES' : ''}
              </span>
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
              className="breathe"
              style={{
                marginTop: 8, padding: '12px 40px', background: '#ffd700',
                color: '#000', fontSize: 'var(--fs-sm)', border: 'none',
              }}
            >
              CONTINUE
            </button>
          </div>
        )}
      </div>

      {/* First-battle tutorial — three taps, once ever */}
      {tutorialStep >= 0 && tutorialStep < TUTORIAL_STEPS.length && (
        <div
          onClick={() => {
            const next = tutorialStep + 1;
            if (next >= TUTORIAL_STEPS.length) {
              localStorage.setItem(TUTORIAL_KEY, 'true');
              track('tutorial-seen');
              setTutorialStep(-1);
            } else {
              setTutorialStep(next);
            }
          }}
          style={{
            position: 'absolute', inset: 0, zIndex: 60,
            background: 'rgba(0,0,0,0.82)', cursor: 'pointer',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            padding: 28, gap: 16,
          }}
        >
          <div style={{ fontSize: 'var(--fs-xs)', color: '#666', letterSpacing: 2 }}>
            HOW IT WORKS {tutorialStep + 1}/{TUTORIAL_STEPS.length}
          </div>
          <div style={{ fontSize: 'var(--fs-lg)', color: '#ffd700', textAlign: 'center' }}>
            {TUTORIAL_STEPS[tutorialStep].title}
          </div>
          <div style={{
            fontSize: 'var(--fs-sm)', color: '#ccc', textAlign: 'center',
            lineHeight: 1.9, maxWidth: 340,
          }}>
            {TUTORIAL_STEPS[tutorialStep].body}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: '#555', marginTop: 12 }} className="blink">
            TAP TO CONTINUE
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              localStorage.setItem(TUTORIAL_KEY, 'true');
              track('tutorial-seen');
              setTutorialStep(-1);
            }}
            style={{
              marginTop: 4, padding: '6px 14px', background: 'transparent',
              border: '1px solid #333', color: '#555', fontSize: 'var(--fs-xs)',
            }}
          >
            SKIP
          </button>
        </div>
      )}

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
