import type { Grappler, BattleResult, PlayerProgression } from '../engine/types';

const PLAYER_KEY = 'rollcraft-player';
const OPPONENT_KEY = 'rollcraft-opponent';
const RESULT_KEY = 'rollcraft-result';
const PROGRESSION_KEY = 'rollcraft-progression';

// ── Player ──
export function savePlayer(grappler: Grappler): void {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(grappler));
}

export function loadPlayer(): Grappler | null {
  const data = localStorage.getItem(PLAYER_KEY);
  if (!data) return null;
  let player: Grappler;
  try { player = JSON.parse(data) as Grappler; } catch { return null; }
  // Backward compat
  if (!player.learnedMoves) player.learnedMoves = [...player.moves];
  if (!player.frame) player.frame = 'medium';
  if (!player.moveXp) player.moveXp = {};
  return player;
}

// ── Opponent ──
export function saveOpponent(grappler: Grappler): void {
  localStorage.setItem(OPPONENT_KEY, JSON.stringify(grappler));
}

export function loadOpponent(): Grappler | null {
  const data = localStorage.getItem(OPPONENT_KEY);
  return data ? JSON.parse(data) : null;
}

// ── Battle Result ──
export function saveBattleResult(result: BattleResult): void {
  localStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

export function loadBattleResult(): BattleResult | null {
  const data = localStorage.getItem(RESULT_KEY);
  return data ? JSON.parse(data) : null;
}

// ── Progression (world state) ──
const DEFAULT_PROGRESSION: PlayerProgression = {
  stamps: [],
  tournamentResults: [],
  money: 100, // start with 100 Mat Bucks
  sponsorships: [],
  specialization: null,
  currentRegionId: 'home',
  storyFlags: {},
  npcDefeated: {},
  npcScouted: {},
  trainingSessions: 0,
  inventory: {},
  totalWins: 0,
  totalLosses: 0,
};

export function saveProgression(progression: PlayerProgression): void {
  localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progression));
}

export function loadProgression(): PlayerProgression {
  const data = localStorage.getItem(PROGRESSION_KEY);
  if (!data) return { ...DEFAULT_PROGRESSION };
  try { return { ...DEFAULT_PROGRESSION, ...JSON.parse(data) }; } catch { return { ...DEFAULT_PROGRESSION }; }
}

export function updateProgression(updates: Partial<PlayerProgression>): PlayerProgression {
  const current = loadProgression();
  const updated = { ...current, ...updates };
  saveProgression(updated);
  return updated;
}

// Record a win
export function recordWin(npcId?: string): void {
  const prog = loadProgression();
  prog.totalWins++;
  if (npcId) prog.npcDefeated[npcId] = true;
  saveProgression(prog);
}

// Record a loss
export function recordLoss(): void {
  const prog = loadProgression();
  prog.totalLosses++;
  saveProgression(prog);
}

// Add money
export function addMoney(amount: number): void {
  const prog = loadProgression();
  prog.money += amount;
  saveProgression(prog);
}

// Spend money (returns false if not enough)
export function spendMoney(amount: number): boolean {
  const prog = loadProgression();
  if (prog.money < amount) return false;
  prog.money -= amount;
  saveProgression(prog);
  return true;
}

// Add a stamp
export function addStamp(stampId: string): void {
  const prog = loadProgression();
  if (!prog.stamps.includes(stampId)) {
    prog.stamps.push(stampId);
    saveProgression(prog);
  }
}

// ── Scouting ──
export function markScouted(npcId: string): void {
  const prog = loadProgression();
  if (!prog.npcScouted) prog.npcScouted = {};
  prog.npcScouted[npcId] = true;
  saveProgression(prog);
  // Also store directly for faster access
  localStorage.setItem(`rollcraft-scouted-${npcId}`, 'true');
}

export function isScouted(npcId: string): boolean {
  // Check direct key first (more reliable across save format changes)
  if (localStorage.getItem(`rollcraft-scouted-${npcId}`) === 'true') return true;
  const prog = loadProgression();
  return prog.npcScouted?.[npcId] ?? false;
}

// ── Training ──
export function getTrainingSessions(): number {
  return loadProgression().trainingSessions ?? 0;
}

export function addTrainingSession(): void {
  const prog = loadProgression();
  prog.trainingSessions = (prog.trainingSessions ?? 0) + 1;
  saveProgression(prog);
}

// ── Inventory ──
export function addItem(itemId: string, qty: number = 1): void {
  const prog = loadProgression();
  if (!prog.inventory) prog.inventory = {};
  prog.inventory[itemId] = (prog.inventory[itemId] || 0) + qty;
  saveProgression(prog);
}

export function useItem(itemId: string): boolean {
  const prog = loadProgression();
  if (!prog.inventory?.[itemId] || prog.inventory[itemId] <= 0) return false;
  prog.inventory[itemId]--;
  if (prog.inventory[itemId] === 0) delete prog.inventory[itemId];
  saveProgression(prog);
  return true;
}

export function getInventory(): Record<string, number> {
  return loadProgression().inventory || {};
}

// ── Utilities ──
export function hasExistingPlayer(): boolean {
  return localStorage.getItem(PLAYER_KEY) !== null;
}

export function clearAll(): void {
  // Remove all game keys including dynamic ones
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('rollcraft-')) keysToRemove.push(key);
  }
  for (const key of keysToRemove) localStorage.removeItem(key);
}
