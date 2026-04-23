// Painted scene surfaces for the overworld — AAA composite rendering.
//
// Each region gets cohesive painted surfaces (mat, floor underlay, wall tile)
// instead of a single tile repeated. Props draw over those as transparent
// sprites. Collision stays grid-based; visuals stay aligned to the grid by
// construction (surfaces drawn at exact tile-pixel coordinates).
//
// Layout on disk:
//   public/sprites/scenes/{regionId}/
//     mat-surface.png   — 128×192 (or region-appropriate size)
//     floor-surface.png — 288×192 (full interior)
//     wall-tile.png     — 32×32 (drawn at 16×16, allows fine detail downsample)
//     prop-lockers.png  — 32×32 (covers 2×2 tiles, transparent bg)
//     prop-desk.png     — 32×32 (covers 1 tile + padding for HD-2D feel)
//     prop-board.png    — 32×32
//     ...

type CacheState = HTMLImageElement | 'loading' | 'failed';
const cache: Record<string, CacheState> = {};

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

export type RegionSurfaces = {
  mat: HTMLImageElement | null;
  floor: HTMLImageElement | null;
  wall: HTMLImageElement | null;
  propLockers: HTMLImageElement | null;
  propDesk: HTMLImageElement | null;
  propBoard: HTMLImageElement | null;
};

export function getRegionSurfaces(regionId: string): RegionSurfaces {
  const base = `/sprites/scenes/${regionId}`;
  return {
    mat:         load(`${base}/mat-surface.png`),
    floor:       load(`${base}/floor-surface.png`),
    wall:        load(`${base}/wall-tile.png`),
    propLockers: load(`${base}/prop-lockers.png`),
    propDesk:    load(`${base}/prop-desk.png`),
    propBoard:   load(`${base}/prop-board.png`),
  };
}

export function preloadRegion(regionId: string): void {
  getRegionSurfaces(regionId);
}
