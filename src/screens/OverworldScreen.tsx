import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/constants';
import { getRegionMap } from '../overworld/maps/registry';
import { createOverworldState, updateOverworld, getFacingNPC } from '../overworld/OverworldEngine';
import { renderOverworld } from '../overworld/OverworldRenderer';
import type { OverworldState, Direction, MenuOption, NPCState } from '../overworld/overworldTypes';
import { loadPlayer, savePlayer, saveOpponent, loadProgression, spendMoney, getTrainingSessions, addTrainingSession} from '../state/saveLoad';
import type { Grappler, Belt, StatKey } from '../engine/types';
import { BELT_XP_THRESHOLDS, BELT_MOVE_SLOTS } from '../engine/types';
import { getMove } from '../data/moves';
import { rollIVs } from '../engine/random';
import { getLevel } from '../battle/stats';
import { getDifficulty } from '../components/ScoutPanel';
import { RIVAL_ENCOUNTERS, REGION_STORIES } from '../data/storyArc';
import { generateRandomOpponent, shouldTriggerEncounter } from '../data/randomEncounters';
import { getShopItems } from '../data/items';
import { addItem } from '../state/saveLoad';
import { Tile } from '../overworld/tiles';
import { createParticleSystem, type ParticleSystem } from '../engine/particles';
import { createAmbientState, tickAmbient, type AmbientState } from '../engine/ambientParticles';
import { getRegionAtmosphere, getNextObjective, REGIONS } from '../data/world';
import { getPendingChallenge, clearPendingChallenge } from '../engine/challenge';
import { playRegionBGM } from '../engine/audio';
import { preloadNPC } from '../render/NPCSprites';
import { getRegionBG } from '../render/RegionBGs';

const BELTS: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];
import DPad from '../components/DPad';
import DialogueBox from '../components/DialogueBox';

// XP values so getLevel() returns appropriate level for each belt
const BELT_XP_MID: Record<Belt, number> = {
  white: 500, blue: 2500, purple: 7000, brown: 15000, black: 30000,
};

function npcToGrappler(npc: NPCState): Grappler {
  const def = npc.def;
  return {
    id: def.id, // preserve NPC identity so BattleRenderer can load the per-character AI sprite
    name: def.name,
    style: def.style,
    belt: def.belt,
    xp: BELT_XP_MID[def.belt],
    baseStats: def.baseStats ?? { hp: 75, str: 70, tec: 70, tgh: 70, flx: 70, spd: 70, end: 70 },
    ivs: rollIVs(),
    evs: def.evSpread ?? { str: 0, tec: 0, tgh: 0, flx: 0, spd: 0, end: 0 },
    moves: def.moves,
    learnedMoves: [...def.moves], moveXp: {},
    frame: def.frame ?? 'medium',
  };
}

export default function OverworldScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectsCanvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<OverworldState | null>(null);
  const inputRef = useRef({ up: false, down: false, left: false, right: false });
  const [player, setPlayer] = useState<Grappler | null>(null);
  const [dialogueNPC, setDialogueNPC] = useState<NPCState | null>(null);
  const [dialogueText, setDialogueText] = useState<string>('');
  const [menuOptions, setMenuOptions] = useState<MenuOption[] | null>(null);
  const [menuIndex, setMenuIndex] = useState(0);
  const [currentRegionId, setCurrentRegionId] = useState('home');
  const regionRef = useRef(getRegionMap('home')!);
  const regionIdRef = useRef<string>('home');
  const wasMovingRef = useRef(false);
  const [arrivalText, setArrivalText] = useState<string[] | null>(null);
  const navigate = useNavigate();
  const particlesRef = useRef<ParticleSystem>(createParticleSystem(60));
  const ambientRef = useRef<AmbientState>(createAmbientState());

  // ── Single dispatch ref — keyboard always calls the latest version ──
  const dispatchRef = useRef<(type: 'action' | 'select', action?: string) => void>(() => {});

  // Load player and init overworld
  useEffect(() => {
    const p = loadPlayer();
    if (!p) { navigate('/create'); return; }
    setPlayer(p);
    const prog = loadProgression();
    const regionId = prog.currentRegionId || 'home';
    const region = getRegionMap(regionId) || getRegionMap('home')!;
    regionRef.current = region;
    regionIdRef.current = regionId;
    setCurrentRegionId(regionId);
    ambientRef.current.kind = getRegionAtmosphere(regionId).particle ?? null;
    particlesRef.current.clear();
    playRegionBGM(regionId);
    // Kick off asset loads for this region — renderer tolerates them not being ready yet
    getRegionBG(regionId);
    for (const npcDef of region.npcs) preloadNPC(npcDef.id);
    stateRef.current = createOverworldState(region.playerSpawn.col, region.playerSpawn.row, region.npcs);

    // Show arrival story text for non-home regions (first visit)
    const storyKey = `rollcraft-visited-${regionId}`;
    const regionStory = REGION_STORIES[regionId as keyof typeof REGION_STORIES];
    if (regionId !== 'home' && regionStory && !localStorage.getItem(storyKey)) {
      localStorage.setItem(storyKey, 'true');
      const lines: string[] = [regionStory.arrival];
      // Check for rival encounter on arrival
      const rivalEvent = RIVAL_ENCOUNTERS.find(e => e.region === regionId && e.trigger === 'on-arrival');
      if (rivalEvent) {
        for (const dl of rivalEvent.dialogueBefore) {
          lines.push(`${dl.speaker}: ${dl.line}`);
        }
      }
      setArrivalText(lines);
    }
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
      const tileMap = regionRef.current.tileMap;
      if (!state.interactingNPC) {
        updateOverworld(state, tileMap, inputRef.current, dt);

        // Check exit tiles + random encounters
        const p = state.player;
        if (!p.isMoving) {
          // Exit check
          for (const exit of regionRef.current.exits) {
            if (p.col === exit.col && p.row === exit.row) {
              if (exit.targetRegion === '__world_map__') {
                navigate('/world');
                return;
              }
            }
          }

          // Random mat encounter check (only when player just STOPPED moving on a mat tile)
          const currentTile = tileMap[p.row]?.[p.col];
          const justStopped = wasMovingRef.current && !p.isMoving;
          wasMovingRef.current = p.isMoving;
          if (justStopped && currentTile === Tile.MAT && shouldTriggerEncounter() && player) {
            const { opponent, greeting } = generateRandomOpponent(player.belt, player.xp);
            saveOpponent(opponent);
            setArrivalText([
              `"${greeting}"`,
              `${opponent.name} (${opponent.belt} belt ${opponent.style.replace('-', ' ')}) wants to roll!`,
            ]);
            // When arrival text is dismissed, go to battle
            localStorage.setItem('rollcraft-random-encounter', 'true');
            stopped = true;
            return;
          }
        }
      }

      const ctx = canvasRef.current!.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      renderOverworld(ctx, state, tileMap, player.giColor, player.belt, player.coachName, regionIdRef.current);

      // Ambient particles on overlay canvas
      if (effectsCanvasRef.current) {
        const fxCtx = effectsCanvasRef.current.getContext('2d')!;
        fxCtx.imageSmoothingEnabled = false;
        tickAmbient(ambientRef.current, particlesRef.current, dt, CANVAS_WIDTH, CANVAS_HEIGHT);
        particlesRef.current.update(dt, { w: CANVAS_WIDTH, h: CANVAS_HEIGHT });
        fxCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        particlesRef.current.render(fxCtx);
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => { stopped = true; cancelAnimationFrame(rafId); };
  }, [player]);

  // Keyboard input — uses dispatchRef so it always gets the latest handler
  useEffect(() => {
    const keyMap: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const dir = keyMap[e.key];
      if (dir) {
        if (stateRef.current?.interactingNPC && (dir === 'up' || dir === 'down')) {
          dispatchRef.current('action', dir === 'up' ? '__nav_up__' : '__nav_down__');
          return;
        }
        inputRef.current[dir] = true;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dispatchRef.current('action');
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        dispatchRef.current('action', '__dismiss__');
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = keyMap[e.key];
      if (dir) inputRef.current[dir] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  // ── All interaction logic — plain functions, no useCallback ──
  // These are recreated every render, which is fine. The keyboard
  // listener accesses them through dispatchRef which is synced below.

  function dismiss() {
    if (stateRef.current) stateRef.current.interactingNPC = null;
    setDialogueNPC(null);
    setDialogueText('');
    setMenuOptions(null);
    setMenuIndex(0);
  }

  function showMenu(text: string, options: MenuOption[]) {
    setDialogueText(text);
    setMenuOptions(options);
    setMenuIndex(0);
  }

  function showText(text: string) {
    setDialogueText(text);
    setMenuOptions(null);
    setMenuIndex(0);
  }

  function handleMenuAction(action: string) {
    const npc = dialogueNPC;
    if (!npc || !stateRef.current || !player) return;

    if (action === 'roll') {
      const opponent = npcToGrappler(npc);
      saveOpponent(opponent);
      navigate('/battle');

    } else if (action === 'learn') {
      const teachable = npc.def.teachableMoves || [];
      const cost = npc.def.teachCost || 100;
      const prog = loadProgression();
      const alreadyLearned = player.learnedMoves || [];

      const moveOptions: MenuOption[] = teachable.map(moveId => {
        const move = getMove(moveId);
        const already = alreadyLearned.includes(moveId);
        const cantAfford = prog.money < cost;
        return {
          label: move
            ? `${move.name} (${move.category.toUpperCase()}) — $${cost}${already ? ' ✓ LEARNED' : ''}`
            : moveId,
          action: `learn-move:${moveId}`,
          disabled: already || cantAfford,
        };
      });

      showMenu(
        `${npc.def.dialogue.teach || 'I can teach you...'}\n\nYou have $${prog.money} Mat Bucks.`,
        moveOptions,
      );

    } else if (action.startsWith('learn-move:')) {
      const moveId = action.replace('learn-move:', '');
      const move = getMove(moveId);
      const cost = npc.def.teachCost || 100;
      if (!move) return;

      const paid = spendMoney(cost);
      if (!paid) {
        showText("You don't have enough Mat Bucks.");
        return;
      }

      if (!player.learnedMoves) player.learnedMoves = [...player.moves];
      if (!player.learnedMoves.includes(moveId)) {
        player.learnedMoves.push(moveId);
      }

      const maxSlots = BELT_MOVE_SLOTS[player.belt];
      let equipped = false;
      if (player.moves.length < maxSlots && !player.moves.includes(moveId)) {
        player.moves.push(moveId);
        equipped = true;
      }

      savePlayer(player);
      setPlayer({ ...player });

      showText(
        `NEW MOVE LEARNED!\n\n` +
        `${move.name.toUpperCase()}\n` +
        `${move.category.toUpperCase()} | PWR:${move.power} ACC:${move.accuracy} STA:${move.staminaCost}\n\n` +
        `"${move.description}"\n\n` +
        `-$${cost} Mat Bucks` +
        (equipped ? '\n\nMove equipped!' : '\n\nSlots full. Manage moves from MENU.')
      );

    } else if (action === 'promote') {
      navigate('/promotion');

    } else if (action === 'train') {
      // Show stat training options
      const prog = loadProgression();
      const sessions = getTrainingSessions();
      const maxSessions: Record<Belt, number> = { white: 10, blue: 25, purple: 45, brown: 70, black: 100 };
      const cap = maxSessions[player.belt];
      const baseCost = 50;
      const costTier = Math.floor(sessions / 5);
      const currentCost = baseCost * (1 + costTier);

      if (sessions >= cap) {
        showText(`You've maxed out your training for ${player.belt} belt.\n\nGet promoted to unlock more sessions.`);
        return;
      }

      if (prog.money < currentCost) {
        showText(`Training costs $${currentCost} per session.\n\nYou have $${prog.money}. Not enough. Win some matches first.`);
        return;
      }

      const statKeys: StatKey[] = ['str', 'tec', 'tgh', 'flx', 'spd', 'end'];
      const statLabels: Record<StatKey, string> = { str: 'STR', tec: 'TEC', tgh: 'TGH', flx: 'FLX', spd: 'SPD', end: 'END' };
      const trainOptions: MenuOption[] = statKeys.map(stat => ({
        label: `${statLabels[stat]} +4 (${player.evs[stat]}/252) — $${currentCost}`,
        action: `train-stat:${stat}`,
        disabled: player.evs[stat] >= 252,
      }));

      showMenu(
        `Training session ${sessions + 1}/${cap}\n\nCost: $${currentCost} per session\nYou have $${prog.money}`,
        trainOptions,
      );

    } else if (action.startsWith('train-stat:')) {
      const stat = action.replace('train-stat:', '') as StatKey;
      const sessions = getTrainingSessions();
      const baseCost = 50;
      const currentCost = baseCost * (1 + Math.floor(sessions / 5));

      const paid = spendMoney(currentCost);
      if (!paid) { showText("Not enough Mat Bucks."); return; }

      player.evs[stat] = Math.min(252, player.evs[stat] + 4);
      addTrainingSession();
      savePlayer(player);
      setPlayer({ ...player });

      const statLabels: Record<StatKey, string> = { str: 'STR', tec: 'TEC', tgh: 'TGH', flx: 'FLX', spd: 'SPD', end: 'END' };
      showText(`TRAINING COMPLETE!\n\n${statLabels[stat]} +4 (now ${player.evs[stat]}/252)\n\n-$${currentCost}`);

    } else if (action === 'shop') {
      const prog = loadProgression();
      const items = getShopItems();
      const shopOptions: MenuOption[] = items.map(item => ({
        label: `${item.name} — $${item.cost}`,
        action: `buy-item:${item.id}`,
        disabled: prog.money < item.cost,
      }));
      showMenu(`GYM SHOP\n\nYou have $${prog.money}`, shopOptions);

    } else if (action.startsWith('buy-item:')) {
      const itemId = action.replace('buy-item:', '');
      const item = getShopItems().find(i => i.id === itemId);
      if (!item) return;
      const paid = spendMoney(item.cost);
      if (!paid) { showText("Not enough Mat Bucks."); return; }
      addItem(itemId);
      showText(`PURCHASED!\n\n${item.name}\n${item.description}\n\n-$${item.cost}`);

    } else if (action === 'exam') {
      showText("You need more mat time before your next belt. Keep training.");
    } else if (action.startsWith('enter-tournament:')) {
      const tourneyId = action.replace('enter-tournament:', '');
      dismiss();
      navigate(`/tournament?id=${tourneyId}`);
    }
  }

  function handleAction() {
    const state = stateRef.current;
    if (!state) return;

    // Menu open → select current item
    if (state.interactingNPC && menuOptions && menuOptions.length > 0) {
      if (menuIndex < menuOptions.length) {
        const opt = menuOptions[menuIndex];
        if (!opt.disabled) handleMenuAction(opt.action);
      } else {
        dismiss();
      }
      return;
    }

    // Dialogue with no menu → dismiss
    if (state.interactingNPC) {
      dismiss();
      return;
    }

    // Not in dialogue → try to interact with facing NPC
    const npc = getFacingNPC(state);
    if (!npc) return;

    state.interactingNPC = npc.def.id;
    setDialogueNPC(npc);

    let greeting = npc.def.role === 'professor' && player?.coachName
      ? npc.def.dialogue.greeting.replace('Prof. Helio', player.coachName)
      : npc.def.dialogue.greeting;

    const options: MenuOption[] = [];
    if (npc.def.role === 'training-partner') {
      // Show difficulty label
      const oppLevel = BELTS.indexOf(npc.def.belt) * 15 + 5;
      const playerLevel = getLevel(player!);
      const diff = getDifficulty(playerLevel, oppLevel);
      options.push({ label: `LET'S ROLL [${diff.label}]`, action: 'roll' });
    }
    if (npc.def.role === 'instructor' && npc.def.teachableMoves) {
      options.push({ label: 'LEARN A MOVE', action: 'learn' });
      options.push({ label: 'TRAIN STATS', action: 'train' });
      options.push({ label: 'SHOP', action: 'shop' });
    }
    if (npc.def.role === 'tournament-desk' && npc.def.tournamentId) {
      options.push({ label: 'ENTER TOURNAMENT', action: `enter-tournament:${npc.def.tournamentId}` });
    }
    if (npc.def.role === 'professor' && player) {
      const beltIdx = BELTS.indexOf(player.belt);
      const nextBelt = beltIdx < BELTS.length - 1 ? BELTS[beltIdx + 1] : null;
      const canPromote = nextBelt && player.xp >= BELT_XP_THRESHOLDS[nextBelt];
      if (canPromote) {
        const coachName = player.coachName || 'Coach';
        greeting = `"${player.name}, I've been watching your progress. You've put in the work.\n\nI'm holding a grading this week. I think you're ready for your ${nextBelt} belt.\n\nStep on the mat — let's make it official."\n\n— ${coachName}`;
        options.push({ label: `PROMOTE TO ${nextBelt!.toUpperCase()}`, action: 'promote' });
      } else if (nextBelt) {
        options.push({ label: 'BELT PROMOTION', action: 'exam', disabled: true });
      }
    }

    showMenu(greeting, options);
  }

  // ── Sync the dispatch ref every render ──
  dispatchRef.current = (type, extra) => {
    if (type === 'action') {
      if (extra === '__nav_up__') {
        setMenuIndex(prev => {
          const total = (menuOptions?.length || 0) + 1;
          return (prev - 1 + total) % total;
        });
      } else if (extra === '__nav_down__') {
        setMenuIndex(prev => {
          const total = (menuOptions?.length || 0) + 1;
          return (prev + 1) % total;
        });
      } else if (extra === '__dismiss__') {
        dismiss();
      } else {
        handleAction();
      }
    }
  };

  // D-pad direction handler (stable — no state deps)
  const handleDirection = useCallback((dir: Direction | null) => {
    inputRef.current = { up: false, down: false, left: false, right: false };
    if (dir) inputRef.current[dir] = true;
  }, []);

  if (!player) return <div style={{ color: '#fff', padding: 20 }}>Loading...</div>;

  return (
    <div className="game-shell">
      {/* Header bar */}
      <div style={{
        padding: '6px 10px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', background: '#0d0d1a', borderBottom: '1px solid #222',
      }}>
        <div>
          <div style={{ fontSize: 'var(--fs-xs)', color: '#ffd700' }}>
            {player.name.toUpperCase()}
          </div>
          <div style={{ fontSize: 7, color: '#666' }}>
            Lv{getLevel(player)} | {player.xp}xp
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => navigate('/world')}
            style={{
              padding: '4px 8px', background: '#1a1a2e', color: '#3498db',
              fontSize: 7, border: '1px solid #3498db',
            }}
          >
            MAP
          </button>
          <button
            onClick={() => navigate('/movedex')}
            style={{
              padding: '4px 8px', background: '#1a1a2e', color: '#22c55e',
              fontSize: 7, border: '1px solid #22c55e',
            }}
          >
            DEX
          </button>
          <button
            onClick={() => navigate('/stats')}
            style={{
              padding: '4px 8px', background: '#1a1a2e', color: '#ffd700',
              fontSize: 7, border: '1px solid #ffd700',
            }}
          >
            MENU
          </button>
          <button
            onClick={() => navigate('/settings')}
            style={{
              padding: '4px 8px', background: '#1a1a2e', color: '#ccc',
              fontSize: 7, border: '1px solid #888',
            }}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Main play area — canvas + side/bottom UI tray. Canvas fills the space
          while preserving 4:3; tray docks to the right on wide viewports, to
          the bottom on mobile. */}
      <div className="play-area">
        {/* Canvas zone — canvas scales up to fill, preserving 4:3 aspect */}
        <div className="canvas-zone">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              width: '100%', height: '100%',
              objectFit: 'contain',
              imageRendering: 'pixelated',
            }}
          />
          <canvas
            ref={effectsCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              imageRendering: 'pixelated',
              pointerEvents: 'none',
              zIndex: 40,
            }}
          />
        </div>

        {/* UI tray — side panel on desktop, bottom sheet on mobile */}
        {(() => {
          const region = REGIONS.find(r => r.id === currentRegionId);

          // "What now?" breadcrumb: promotion first, then the next locked region
          const prog = loadProgression();
          const beltIdx = BELTS.indexOf(player.belt);
          const nb = beltIdx < BELTS.length - 1 ? BELTS[beltIdx + 1] : null;
          const promotionReady = nb && player.xp >= BELT_XP_THRESHOLDS[nb];
          const objective = promotionReady
            ? { title: 'PROMOTION READY', detail: `See ${player.coachName || 'your coach'} at the Home Gym` }
            : getNextObjective(
                player.belt,
                prog.stamps,
                prog.tournamentResults.filter(r => r.placement === 'gold').map(r => r.tournamentId),
                Object.keys(prog.npcDefeated).length,
              );

          const challenge = getPendingChallenge();

          return (
            <div className="ui-tray">
              <div style={{
                padding: '14px 16px',
                background: 'linear-gradient(180deg, #12121f 0%, #0d0d1a 100%)',
                border: '1px solid #1a1a2e',
                borderRadius: 8,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}>
                <div style={{
                  fontSize: 'var(--fs-lg)', color: region?.color || '#ffd700',
                  letterSpacing: 2, marginBottom: 8,
                }}>
                  {(region?.name || 'Home Gym').toUpperCase()}
                </div>
                <div style={{
                  fontSize: 'var(--fs-xs)', color: '#888', lineHeight: 1.7,
                }}>
                  {region?.description || 'Where it all began.'}
                </div>
              </div>

              {objective && (
                <div style={{
                  marginTop: 8, padding: '10px 12px',
                  background: '#11110a', border: '1px solid #3a3416', borderRadius: 8,
                }}>
                  <div style={{ fontSize: 'var(--fs-xs)', color: '#ffd700', marginBottom: 4, letterSpacing: 1 }}>
                    NEXT ▸ {objective.title}
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: '#998', lineHeight: 1.7 }}>
                    {objective.detail}
                  </div>
                </div>
              )}

              {challenge && (
                <button
                  onClick={() => {
                    saveOpponent(challenge.opponent);
                    clearPendingChallenge();
                    navigate('/battle');
                  }}
                  style={{
                    marginTop: 8, padding: '10px 12px', textAlign: 'left',
                    background: '#1a0e0e', border: '1px solid #ef4444', borderRadius: 8,
                    color: '#ef4444', fontSize: 'var(--fs-xs)', lineHeight: 1.7,
                  }}
                  className="blink"
                >
                  ⚔ {challenge.opponent.name.toUpperCase()}
                  {challenge.gym ? ` (${challenge.gym})` : ''} CHALLENGED YOU
                  {challenge.record ? ` — ${challenge.record}` : ''}. TAP TO FIGHT!
                </button>
              )}

              <div style={{ flex: 1 }} />

              <div style={{
                fontSize: 'var(--fs-xs)', color: '#555', textAlign: 'center',
                lineHeight: 1.8, letterSpacing: 1,
              }}>
                WALK TO AN NPC TO INTERACT<br />WALK TO THE DOOR TO LEAVE
              </div>
            </div>
          );
        })()}
      </div>

      {/* Arrival story overlay */}
      {arrivalText && (
        <div
          onClick={() => {
            const isEncounter = localStorage.getItem('rollcraft-random-encounter');
            if (isEncounter) {
              localStorage.removeItem('rollcraft-random-encounter');
              navigate('/battle');
            } else {
              setArrivalText(null);
            }
          }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 55,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            alignItems: 'center', padding: 24, gap: 12, cursor: 'pointer',
          }}
        >
          {arrivalText.map((line, i) => {
            const isRival = line.includes('Kenzo:');
            return (
              <div key={i} style={{
                fontSize: 'var(--fs-sm)',
                color: isRival ? '#ef4444' : i === 0 ? '#ffd700' : '#ccc',
                textAlign: 'center', lineHeight: 1.8,
                fontStyle: i === 0 ? 'italic' : 'normal',
              }}>
                {line}
              </div>
            );
          })}
          <div style={{ fontSize: 'var(--fs-xs)', color: '#444', marginTop: 16 }} className="blink">
            TAP TO CONTINUE
          </div>
        </div>
      )}

      {/* Dialogue box */}
      {dialogueNPC && (
        <DialogueBox
          speakerName={dialogueNPC.def.name === 'Prof. Helio' && player?.coachName ? player.coachName : dialogueNPC.def.name}
          text={dialogueText}
          menuOptions={menuOptions}
          selectedIndex={menuIndex}
          onMenuSelect={(action) => handleMenuAction(action)}
          onDismiss={() => dismiss()}
        />
      )}

      {/* D-pad */}
      <DPad onDirection={handleDirection} onAction={() => handleAction()} />

    </div>
  );
}
