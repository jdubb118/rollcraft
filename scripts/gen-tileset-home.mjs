// Generate the home gym tileset — 16×16 tiles for tile-textured rendering.
// Outputs:
//   public/sprites/tilesets/regions/home/mat.png       (region-specific)
//   public/sprites/tilesets/shared/{wall,floor,locker,desk,board,door}.png
//
// The shared tiles are reused by every region until that region overrides them.
// Run: node scripts/gen-tileset-home.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)[1].trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const SHARED = 'public/sprites/tilesets/shared';
const HOME   = 'public/sprites/tilesets/regions/home';
mkdirSync(SHARED, { recursive: true });
mkdirSync(HOME,   { recursive: true });

const STYLE_NOTE = 'top-down view, 16x16 pixel art, clean Stardew Valley / Earthbound aesthetic, crisp pixels, no anti-aliasing, no shadows, vibrant saturated colours, viewed straight from above';
const TILE_NOTE  = 'seamlessly tileable on all four edges, no border, no frame, fills the entire 16x16 canvas, repeating texture';

const TILES = [
  // ── SHARED TILES (used by every region by default) ──
  {
    out: `${SHARED}/wall.png`,
    desc: `dark wood-panelled gym wall texture, vertical wood planks, warm brown tones, ${TILE_NOTE}, ${STYLE_NOTE}`,
  },
  {
    out: `${SHARED}/floor.png`,
    desc: `light wooden gym floor planks, blonde wood, subtle grain, ${TILE_NOTE}, ${STYLE_NOTE}`,
  },
  {
    out: `${SHARED}/locker.png`,
    desc: `single grey metal gym locker viewed from above, with a small handle, ventilation slats on top, fills the tile, ${STYLE_NOTE}`,
  },
  {
    out: `${SHARED}/desk.png`,
    desc: `small dark wooden front desk for a gym viewed from above, with a clipboard and pen on top, fills the tile, ${STYLE_NOTE}`,
  },
  {
    out: `${SHARED}/board.png`,
    desc: `cork bulletin board mounted on a wall viewed from above, with three small white papers pinned to it, fills the tile, ${STYLE_NOTE}`,
  },
  {
    out: `${SHARED}/door.png`,
    desc: `closed wooden gym door viewed from above with a brass handle, set into the floor, fills the tile, ${STYLE_NOTE}`,
  },
  // ── HOME REGION OVERRIDE ──
  {
    out: `${HOME}/mat.png`,
    desc: `bright kelly-green BJJ training mat texture, smooth subtle puzzle-piece seam pattern faintly visible, ${TILE_NOTE}, ${STYLE_NOTE}`,
  },
];

async function gen({ out, desc }) {
  console.log(`→ ${out}`);
  const start = Date.now();
  const res = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
    method: 'POST', headers,
    body: JSON.stringify({
      description: desc,
      image_size: { width: 32, height: 32 },
      no_background: false,
    }),
  });
  if (!res.ok) {
    console.log(`  ✗ HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return false;
  }
  const data = await res.json();
  if (!data.image?.base64) { console.log(`  ✗ no image in response`); return false; }
  writeFileSync(out, Buffer.from(data.image.base64, 'base64'));
  console.log(`  ✓ ${out} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  return true;
}

console.log(`\n=== Generating home tileset (${TILES.length} tiles) ===\n`);
let ok = 0, fail = 0;
for (const t of TILES) {
  if (await gen(t)) ok++; else fail++;
}

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log(`\n=== Done: ${ok} ok / ${fail} fail ===`);
console.log('Balance:', await bal.text());
