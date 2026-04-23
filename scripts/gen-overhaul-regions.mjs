// V2: mat-first overworld BGs. Top-down BJJ gym interiors where mats are the focal element.

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)[1].trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
const OUT = 'public/sprites/region-bgs';
mkdirSync(OUT, { recursive: true });

const BASE = 'top-down view BJJ jiu-jitsu gym interior, thick grappling mats covering the centre floor as the dominant feature, walls and fixtures around the perimeter, fighters will walk around on these mats, pixel art, Stardew Valley aesthetic, mat-floor clearly distinct from surrounding surfaces, no furniture ON the mats, no water, no carpet';

const REGIONS = [
  { id: 'home',            p: 'small friendly BJJ home dojo, green grappling mats filling the central floor, warm wood-panelled walls, instructor desk in the top corner, framed certificates on walls, door at the bottom, inviting beginner atmosphere' },
  { id: 'scramble-valley', p: 'warehouse-converted BJJ gym, teal grappling mats filling the central floor, corrugated metal walls, hanging neon lights, speaker stacks in corners, door at bottom, industrial modern vibe' },
  { id: 'old-town',        p: 'traditional Japanese BJJ academy, tatami grappling mats filling the central floor in a clean grid, dark polished wood floor border, paper screen walls, hanging calligraphy scrolls, bonsai in corner, door at bottom, solemn atmosphere' },
  { id: 'steel-mountain',  p: 'hard-nosed wrestling and BJJ room, scuffed navy blue grappling mats filling the central floor, painted concrete walls, silhouette murals, chalkboard with training schedule on the wall, ropes and medicine balls stacked in corners, door at bottom, industrial grind vibe' },
  { id: 'coral-bay',       p: 'beach-side BJJ academy, bright blue grappling mats covering the central floor (NOT water, solid pixel-art mat texture), sand-coloured wooden border, bamboo-slat walls with open ocean views at top, palm fronds at edges, door at bottom, tropical relaxed atmosphere' },
  { id: 'sambo-district',  p: 'underground sambo and BJJ gym, crimson red grappling mats filling the central floor, dark brick walls with red lighting, hanging heavy bag in corner, combat sambo posters on walls, door at bottom, gritty tough atmosphere' },
  { id: 'nova-camp',       p: 'futuristic elite BJJ training facility, sleek white grappling mats with blue LED trim filling the central floor, glass walls, wall-mounted screens showing match analysis, holographic charts in corners, door at bottom, high-tech science-lab aesthetic' },
  { id: 'iron-coast',      p: 'cliffside elite BJJ competition centre, polished obsidian black grappling mats with gold trim filling the central floor, stone walls, championship banners hanging, large arched window at top with cliff-ocean view, door at bottom, prestigious elite atmosphere' },
  { id: 'summit-city',     p: 'grand BJJ world championship coliseum floor, polished white and gold competition mats with a large championship circle in the centre, covering the full central area, marble walls with banners of past champions, spotlights shining down, door at bottom, legendary world-finals atmosphere' },
];

// Force regen: clear existing v2 files
for (const r of REGIONS) {
  const path = `${OUT}/${r.id}.png`;
  if (existsSync(path)) { unlinkSync(path); console.log(`  cleared stale: ${path}`); }
}

async function gen(description, filename, w = 320, h = 240) {
  console.log(`→ ${description.substring(0, 90)}...`);
  const start = Date.now();
  const res = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
    method: 'POST', headers,
    body: JSON.stringify({
      description,
      image_size: { width: w, height: h },
      no_background: false,
    }),
  });
  if (!res.ok) { console.log(`  ✗ HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`); return false; }
  const data = await res.json();
  if (!data.image?.base64) { console.log(`  ✗ no image`); return false; }
  writeFileSync(filename, Buffer.from(data.image.base64, 'base64'));
  console.log(`  ✓ ${filename} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  return true;
}

console.log(`\n=== Regenerating ${REGIONS.length} overworld BGs (v2, mat-first) ===\n`);
let ok = 0, fail = 0;
for (const r of REGIONS) {
  const filename = `${OUT}/${r.id}.png`;
  const prompt = `${r.p}, ${BASE}`;
  const success = await gen(prompt, filename);
  if (success) ok++; else fail++;
}

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log(`\n=== Done: ${ok} ok / ${fail} fail ===`);
console.log('Balance:', await bal.text());
