// Re-generate the 4 prop tiles with transparent backgrounds + true top-down prompts.
// Renderer already paints the floor texture under any prop tile, so transparent props
// composite cleanly onto whatever floor the region uses.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)[1].trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const SHARED = 'public/sprites/tilesets/shared';
mkdirSync(SHARED, { recursive: true });

const STYLE = 'orthographic top-down view as if looking straight down from the ceiling, 32x32 pixel art, crisp pixels, no anti-aliasing, no shadows';

const TILES = [
  {
    out: `${SHARED}/locker.png`,
    desc: `single grey metal gym locker viewed from directly above, simple rectangle with a small handle and ventilation slats, ${STYLE}`,
  },
  {
    out: `${SHARED}/desk.png`,
    desc: `small dark wooden gym front-desk viewed from directly above, rectangular shape with a clipboard and pen on top, ${STYLE}`,
  },
  {
    out: `${SHARED}/board.png`,
    desc: `cork techniques board with three pinned papers, viewed from directly above as if mounted on the floor, fills the centre of the tile, ${STYLE}`,
  },
  {
    out: `${SHARED}/door.png`,
    desc: `top-down floor exit threshold, dark welcome mat with a brass arrow indicator, viewed from directly above, ${STYLE}`,
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
      no_background: true, // <-- the fix: transparent BG so floor shows through
    }),
  });
  if (!res.ok) {
    console.log(`  ✗ HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return false;
  }
  const data = await res.json();
  if (!data.image?.base64) { console.log(`  ✗ no image`); return false; }
  writeFileSync(out, Buffer.from(data.image.base64, 'base64'));
  console.log(`  ✓ ${out} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  return true;
}

console.log(`\n=== Re-generating ${TILES.length} prop tiles (transparent BG) ===\n`);
let ok = 0, fail = 0;
for (const t of TILES) if (await gen(t)) ok++; else fail++;

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log(`\n=== Done: ${ok} ok / ${fail} fail ===`);
console.log('Balance:', await bal.text());
