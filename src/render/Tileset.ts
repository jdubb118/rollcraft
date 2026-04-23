import { Tile } from '../overworld/tiles';

// Tile texture lookup: per-region override → shared default → null.
// Returned image is 16×16 (or scaled to it at draw time).
//
// Layout on disk:
//   public/sprites/tilesets/shared/{name}.png        — fallback for any region
//   public/sprites/tilesets/regions/{regionId}/{name}.png — per-region override
//
// Names map 1:1 to Tile enum:
//   wall, mat, floor, locker, desk, board, door

const NAME_BY_TILE: Record<number, string> = {
  [Tile.WALL]:   'wall',
  [Tile.MAT]:    'mat',
  [Tile.FLOOR]:  'floor',
  [Tile.LOCKER]: 'locker',
  [Tile.DESK]:   'desk',
  [Tile.BOARD]:  'board',
  [Tile.DOOR]:   'door',
};

type CacheState = HTMLImageElement | 'loading' | 'failed';
const cache: Record<string, CacheState> = {};

function load(url: string): HTMLImageElement | null {
  const c = cache[url];
  if (c === 'loading' || c === 'failed') return null;
  if (c) return c;
  const img = new Image();
  cache[url] = 'loading';
  img.onload  = () => { cache[url] = img; };
  img.onerror = () => { cache[url] = 'failed'; };
  img.src = url;
  return null;
}

export function getTileTexture(regionId: string, tile: number): HTMLImageElement | null {
  const name = NAME_BY_TILE[tile];
  if (!name) return null;
  // Try region override first, then shared.
  return load(`/sprites/tilesets/regions/${regionId}/${name}.png`)
      ?? load(`/sprites/tilesets/shared/${name}.png`);
}

// Optional preload — call once at boot for the active region to warm the cache.
export function preloadTileset(regionId: string): void {
  for (const t of Object.keys(NAME_BY_TILE)) {
    getTileTexture(regionId, Number(t));
  }
}
