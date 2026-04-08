import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/constants';
import { STARTER_GYM, PLAYER_SPAWN, STARTER_GYM_NPCS } from '../overworld/maps/starterGym';
import { createOverworldState, updateOverworld, getFacingNPC } from '../overworld/OverworldEngine';
import { renderOverworld } from '../overworld/OverworldRenderer';
import type { OverworldState, Direction, MenuOption, NPCState } from '../overworld/overworldTypes';
import { loadPlayer, saveOpponent } from '../state/saveLoad';
import type { Grappler } from '../engine/types';
import { rollIVs } from '../engine/random';
import DPad from '../components/DPad';
import DialogueBox from '../components/DialogueBox';

function makeId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function npcToGrappler(npc: NPCState): Grappler {
  return {
    id: makeId(),
    name: npc.def.name,
    style: npc.def.style,
    belt: npc.def.belt,
    xp: 0,
    baseStats: { hp: 75, str: 70, tec: 70, tgh: 70, flx: 70, spd: 70, end: 70 },
    ivs: rollIVs(),
    evs: { str: 0, tec: 0, tgh: 0, flx: 0, spd: 0, end: 0 },
    moves: npc.def.moves,
  };
}

export default function OverworldScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<OverworldState | null>(null);
  const inputRef = useRef({ up: false, down: false, left: false, right: false });
  const [player, setPlayer] = useState<Grappler | null>(null);
  const [dialogueNPC, setDialogueNPC] = useState<NPCState | null>(null);
  const [dialogueText, setDialogueText] = useState<string>('');
  const [menuOptions, setMenuOptions] = useState<MenuOption[] | null>(null);
  const navigate = useNavigate();

  // Load player and init overworld
  useEffect(() => {
    const p = loadPlayer();
    if (!p) { navigate('/create'); return; }
    setPlayer(p);
    stateRef.current = createOverworldState(PLAYER_SPAWN.col, PLAYER_SPAWN.row, STARTER_GYM_NPCS);
  }, [navigate]);

  // Game loop
  useEffect(() => {
    if (!stateRef.current || !canvasRef.current || !player) return;

    let lastTime = 0;
    let rafId = 0;
    let stopped = false;

    const frame = (time: number) => {
      if (stopped) return;
      const dt = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const state = stateRef.current!;
      if (!state.interactingNPC) {
        updateOverworld(state, STARTER_GYM, inputRef.current, dt);
      }

      const ctx = canvasRef.current!.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      renderOverworld(ctx, state, STARTER_GYM, player.giColor, player.belt);

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => { stopped = true; cancelAnimationFrame(rafId); };
  }, [player]);

  // Keyboard input
  useEffect(() => {
    const keyMap: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const dir = keyMap[e.key];
      if (dir) inputRef.current[dir] = true;
      if (e.key === 'Enter' || e.key === ' ') handleAction();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = keyMap[e.key];
      if (dir) inputRef.current[dir] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  // Handle D-pad input
  const handleDirection = useCallback((dir: Direction | null) => {
    inputRef.current = { up: false, down: false, left: false, right: false };
    if (dir) inputRef.current[dir] = true;
  }, []);

  // Handle action button (interact with NPC)
  const handleAction = useCallback(() => {
    const state = stateRef.current;
    if (!state) return;

    // If already in dialogue, dismiss it
    if (state.interactingNPC) {
      state.interactingNPC = null;
      setDialogueNPC(null);
      setDialogueText('');
      setMenuOptions(null);
      return;
    }

    // Check for facing NPC
    const npc = getFacingNPC(state);
    if (!npc) return;

    state.interactingNPC = npc.def.id;
    setDialogueNPC(npc);
    setDialogueText(npc.def.dialogue.greeting);

    // Build menu based on role
    const options: MenuOption[] = [];
    if (npc.def.role === 'training-partner') {
      options.push({ label: "LET'S ROLL", action: 'roll' });
    }
    if (npc.def.role === 'instructor' && npc.def.teachableMoves) {
      options.push({ label: 'LEARN A MOVE', action: 'learn' });
    }
    if (npc.def.role === 'professor') {
      options.push({ label: 'BELT EXAM', action: 'exam' });
    }
    setMenuOptions(options);
  }, []);

  // Handle menu selection
  const handleMenuSelect = useCallback((action: string) => {
    if (!dialogueNPC || !stateRef.current) return;

    if (action === 'roll') {
      // Save opponent and go to battle
      const opponent = npcToGrappler(dialogueNPC);
      saveOpponent(opponent);
      navigate('/battle');
    } else if (action === 'learn') {
      setDialogueText(dialogueNPC.def.dialogue.teach || 'I can teach you...');
      setMenuOptions(null); // TODO: show learnable moves list
    } else if (action === 'exam') {
      setDialogueText(dialogueNPC.def.dialogue.promotion || 'Not yet ready.');
      setMenuOptions(null);
    }
  }, [dialogueNPC, navigate]);

  // Dismiss dialogue
  const handleDismiss = useCallback(() => {
    if (stateRef.current) {
      stateRef.current.interactingNPC = null;
    }
    setDialogueNPC(null);
    setDialogueText('');
    setMenuOptions(null);
  }, []);

  if (!player) return <div style={{ color: '#fff', padding: 20 }}>Loading...</div>;

  return (
    <div style={{
      width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#0a0a14', overflow: 'hidden', position: 'relative',
    }}>
      {/* Header bar */}
      <div style={{
        padding: '6px 12px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', background: '#0d0d1a', borderBottom: '1px solid #222',
      }}>
        <span style={{ fontSize: '0.4rem', color: '#ffd700' }}>
          {player.name.toUpperCase()}
        </span>
        <span style={{ fontSize: '0.35rem', color: '#888' }}>
          {player.belt.toUpperCase()} BELT | {player.xp} XP
        </span>
      </div>

      {/* Canvas */}
      <div style={{
        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden',
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

      {/* Dialogue box */}
      {dialogueNPC && (
        <DialogueBox
          speakerName={dialogueNPC.def.name}
          text={dialogueText}
          menuOptions={menuOptions}
          onMenuSelect={handleMenuSelect}
          onDismiss={handleDismiss}
        />
      )}

      {/* D-pad */}
      <DPad onDirection={handleDirection} onAction={handleAction} />

      {/* Hint text */}
      {!dialogueNPC && (
        <div style={{
          position: 'fixed', bottom: 170, left: 0, right: 0,
          textAlign: 'center', fontSize: '0.3rem', color: '#444',
        }}>
          WALK TO AN NPC AND PRESS A TO INTERACT
        </div>
      )}
    </div>
  );
}
