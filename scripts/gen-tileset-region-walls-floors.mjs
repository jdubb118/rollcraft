// Per-region WALL + FLOOR overrides — gives every region a unique architectural identity
// on top of its mat. With this each region truly *feels* different.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)[1].trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const ROOT = 'public/sprites/tilesets/regions';

const STYLE = '32x32 pixel art, top-down view as if looking straight down, crisp pixels, no shadows, no anti-aliasing';
const TILE  = 'seamlessly tileable on all four edges, fills the entire tile, repeating texture, no border';

const REGIONS = [
  {
    id: 'home',
    wall:  `warm honey-brown wood-panelled BJJ dojo wall, vertical planks with subtle grain, ${TILE}, ${STYLE}`,
    floor: `light blonde wooden gym floorboards, clean horizontal grain, ${TILE}, ${STYLE}`,
  },
  {
    id: 'scramble-valley',
    wall:  `corrugated rust-brown metal warehouse wall panels, vertical ridges, slight industrial wear, ${TILE}, ${STYLE}`,
    floor: `polished dark grey concrete warehouse floor with subtle splatter marks, industrial, ${TILE}, ${STYLE}`,
  },
  {
    id: 'old-town',
    wall:  `traditional Japanese white paper shoji screen wall with dark wood frame grid, ${TILE}, ${STYLE}`,
    floor: `dark polished hardwood floorboards, traditional Japanese dojo style, narrow planks, ${TILE}, ${STYLE}`,
  },
  {
    id: 'steel-mountain',
    wall:  `rough painted dark grey concrete wall, hint of faded chalk silhouette markings, gritty wrestling room, ${TILE}, ${STYLE}`,
    floor: `scuffed light grey rubber gym mat floor, subtle wear marks, ${TILE}, ${STYLE}`,
  },
  {
    id: 'coral-bay',
    wall:  `light tropical bamboo slat wall, vertical pale-green-and-tan slats, beach academy, ${TILE}, ${STYLE}`,
    floor: `light sandy wooden beach boardwalk planks, pale yellow wood, ${TILE}, ${STYLE}`,
  },
  {
    id: 'sambo-district',
    wall:  `dark red brick wall with thick black mortar lines, gritty underground gym, ${TILE}, ${STYLE}`,
    floor: `dark stained polished concrete floor, gritty industrial basement, ${TILE}, ${STYLE}`,
  },
  {
    id: 'nova-camp',
    wall:  `sleek dark glass wall panel with thin glowing cyan LED trim line, futuristic high-tech, ${TILE}, ${STYLE}`,
    floor: `glossy bright white reflective panel floor with thin glowing cyan grid lines, futuristic, ${TILE}, ${STYLE}`,
  },
  {
    id: 'iron-coast',
    wall:  `dark grey carved stone wall with subtle hint of gold trim, prestigious elite gym, ${TILE}, ${STYLE}`,
    floor: `polished obsidian black stone floor with very subtle gold flecks, prestigious, ${TILE}, ${STYLE}`,
  },
  {
    id: 'summit-city',
    wall:  `polished white marble wall with thin gold trim lines, championship arena, ${TILE}, ${STYLE}`,
    floor: `polished white marble floor tiles with thin gold seam lines forming a grid, championship arena, ${TILE}, ${STYLE}`,
  },
];

async function gen(out, desc) {
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

console.log(`\n=== Generating ${REGIONS.length * 2} region wall + floor tiles ===\n`);
let ok = 0, fail = 0;
for (const r of REGIONS) {
  mkdirSync(`${ROOT}/${r.id}`, { recursive: true });
  if (await gen(`${ROOT}/${r.id}/wall.png`,  r.wall))  ok++; else fail++;
  if (await gen(`${ROOT}/${r.id}/floor.png`, r.floor)) ok++; else fail++;
}

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log(`\n=== Done: ${ok} ok / ${fail} fail ===`);
console.log('Balance:', await bal.text());
