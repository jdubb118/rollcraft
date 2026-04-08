import type { Grappler, BattleResult } from '../engine/types';

const PLAYER_KEY = 'rollcraft-player';
const OPPONENT_KEY = 'rollcraft-opponent';
const RESULT_KEY = 'rollcraft-result';

export function savePlayer(grappler: Grappler): void {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(grappler));
}

export function loadPlayer(): Grappler | null {
  const data = localStorage.getItem(PLAYER_KEY);
  return data ? JSON.parse(data) : null;
}

export function saveOpponent(grappler: Grappler): void {
  localStorage.setItem(OPPONENT_KEY, JSON.stringify(grappler));
}

export function loadOpponent(): Grappler | null {
  const data = localStorage.getItem(OPPONENT_KEY);
  return data ? JSON.parse(data) : null;
}

export function saveBattleResult(result: BattleResult): void {
  localStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

export function loadBattleResult(): BattleResult | null {
  const data = localStorage.getItem(RESULT_KEY);
  return data ? JSON.parse(data) : null;
}

export function hasExistingPlayer(): boolean {
  return localStorage.getItem(PLAYER_KEY) !== null;
}

export function clearAll(): void {
  localStorage.removeItem(PLAYER_KEY);
  localStorage.removeItem(OPPONENT_KEY);
  localStorage.removeItem(RESULT_KEY);
}
