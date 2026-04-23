// Generate per-region MAT textures (everything else is shared).
// Each region gets its own mat colour/pattern; walls, floor, props are shared by default.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)[1].trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const ROOT = 'public/sprites/tilesets/regions';

const STYLE_NOTE = '32x32 pixel art, top-down view as if looking straight down, crisp pixels, no shadows, no anti-aliasing, vibrant saturated colour';
const TILE_NOTE  = 'seamlessly tileable on all four edges, fills the entire tile, repeating texture, no border';

const REGIONS = [
  { id: 'scramble-valley', desc: `bright teal grappling mat texture, smooth puzzle-piece seam pattern faintly visible, ${TILE_NOTE}, ${STYLE_NOTE}` },
  { id: 'old-town',        desc: `tan straw tatami mat texture in a clean grid pattern, traditional Japanese, ${TILE_NOTE}, ${STYLE_NOTE}` },
  { id: 'steel-mountain',  desc: `scuffed navy blue grappling mat texture, slightly worn with subtle scuff marks, ${TILE_NOTE}, ${STYLE_NOTE}` },
  { id: 'coral-bay',       desc: `bright cyan blue grappling mat texture (NOT water, solid mat surface), subtle wave-pattern seams, ${TILE_NOTE}, ${STYLE_NOTE}` },
  { id: 'sambo-district',  desc: `crimson red grappling mat texture, smooth puzzle-piece seam pattern, ${TILE_NOTE}, ${STYLE_NOTE}` },
  { id: 'nova-camp',       desc: `sleek bright white grappling mat texture with thin glowing blue LED grid lines, futuristic, ${TILE_NOTE}, ${STYLE_NOTE}` },
  { id: 'iron-coast',      desc: `polished obsidian black grappling mat texture with subtle thin gold trim lines forming a grid, prestigious, ${TILE_NOTE}, ${STYLE_NOTE}` },
  { id: 'summit-city',     desc: `polished white and gold championship mat texture, marble-like with gold seam lines forming a grid, ${TILE_NOTE}, ${STYLE_NOTE}` },
];

async function gen({ id, desc }) {
  const out = `${ROOT}/${id}/mat.png`;
  mkdirSync(`${ROOT}/${id}`, { recursive: true });
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
  if (!data.image?.base64) { console.log(`  ✗ no image`); return false; }
  writeFileSync(out, Buffer.from(data.image.base64, 'base64'));
  console.log(`  ✓ ${out} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  return true;
}

console.log(`\n=== Generating ${REGIONS.length} region mat tiles ===\n`);
let ok = 0, fail = 0;
for (const r of REGIONS) if (await gen(r)) ok++; else fail++;

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log(`\n=== Done: ${ok} ok / ${fail} fail ===`);
console.log('Balance:', await bal.text());
