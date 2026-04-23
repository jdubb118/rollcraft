// Archetype sprites — (style × belt) combos for random-encounter opponents.
//
// Used as a middle fallback in the battle-render priority chain:
//   1. named NPC sprite (getNPCSprite) — for registry opponents like 'tp-keenan'
//   2. archetype sprite (this module) — for random-encounter opponents
//   3. programmatic fallback (drawGrapplerSprite) — if nothing else loads yet
//
// Layout on disk: /sprites/archetypes/{style}-{belt}.png
// 32×32, transparent background.

import type { Style, Belt } from '../engine/types';

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

export function getArchetypeSprite(style: Style, belt: Belt): HTMLImageElement | null {
  return load(`/sprites/archetypes/${style}-${belt}.png`);
}
