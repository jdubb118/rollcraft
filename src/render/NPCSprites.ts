import type { Direction } from '../overworld/overworldTypes';

const DIR_MAP: Record<Direction, string> = {
  down: 'south', up: 'north', left: 'west', right: 'east',
};

const cache: Record<string, HTMLImageElement | 'loading' | 'failed'> = {};

function load(url: string): HTMLImageElement | null {
  const c = cache[url];
  if (c === 'loading' || c === 'failed') return null;
  if (c) return c;
  const img = new Image();
  cache[url] = 'loading';
  img.onload = () => { cache[url] = img; };
  img.onerror = () => { cache[url] = 'failed'; };
  img.src = url;
  return null;
}

// Fallback chain: exact-direction → south → null (caller falls back to programmatic).
export function getNPCSprite(npcId: string, dir: Direction): HTMLImageElement | null {
  const compass = DIR_MAP[dir];
  const exact = load(`/sprites/npcs/${npcId}-${compass}.png`);
  if (exact) return exact;
  if (compass !== 'south') {
    const south = load(`/sprites/npcs/${npcId}-south.png`);
    if (south) return south;
  }
  return null;
}

// Preload all 4 directions for a given NPC id — fire-and-forget.
export function preloadNPC(npcId: string): void {
  for (const d of ['south', 'north', 'east', 'west']) {
    load(`/sprites/npcs/${npcId}-${d}.png`);
  }
}
