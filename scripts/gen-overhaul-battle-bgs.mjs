// V3: mat-first prompts. Every battle BG must read as a BJJ gym with a visible training mat
// as the dominant floor element — not a living room, not a pool, not a throne room.

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)[1].trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
const OUT = 'public/sprites/backgrounds';
mkdirSync(OUT, { recursive: true });

// Shared framing: every BG is a BJJ training gym, with mats as the focal ground element.
const BASE = 'BJJ jiu-jitsu training gym interior, thick grappling mats covering floor as the central feature, two fighters will spar on the mat, side-view pixel art, Stardew Valley meets modern gaming aesthetic, clear mat-floor distinction from walls, no furniture on the mat, no water, no carpet';

const BGS = [
  { id: 'home',     file: 'bg-home-v2.png',     p: 'friendly neighbourhood BJJ dojo, warm green training mats covering most of the floor, wood-panelled walls, framed instructor certificates hanging, sparring class atmosphere' },
  { id: 'scramble', file: 'bg-scramble-v2.png', p: 'warehouse-turned-BJJ-gym, teal grappling mats filling the floor, corrugated metal walls, neon lights, speakers on walls, industrial modern vibe' },
  { id: 'oldtown',  file: 'bg-oldtown-v2.png',  p: 'traditional Japanese BJJ academy, tatami grappling mats covering floor, paper screen walls, hanging calligraphy scrolls, bonsai, solemn respectful atmosphere' },
  { id: 'steel',    file: 'bg-steel-v2.png',    p: 'hard-nosed BJJ and wrestling room, scuffed navy blue grappling mats filling floor, painted concrete walls with silhouette murals, chalkboard with schedule, ropes and medicine balls, iron grind atmosphere' },
  { id: 'coral',    file: 'bg-coral-v2.png',    p: 'beach-side BJJ academy, bright blue grappling mats covering floor (NOT water, solid mat pattern), bamboo-slat walls with window to ocean, palms outside, relaxed tropical training atmosphere' },
  { id: 'sambo',    file: 'bg-sambo-v2.png',    p: 'underground sambo and BJJ gym, crimson red grappling mats covering floor, brick walls with red lighting, hanging heavy bag, combat sambo posters, gritty atmosphere' },
  { id: 'nova',     file: 'bg-nova-v2.png',     p: 'futuristic elite BJJ training centre, sleek white grappling mats with blue LED strip edges covering floor, glass walls, monitors showing match analysis, high-tech clean' },
  { id: 'iron',     file: 'bg-iron-v2.png',     p: 'cliffside elite BJJ competition gym, polished obsidian black grappling mats with gold trim covering floor, stone walls, championship banners hanging, cliff-ocean view window, prestigious' },
  { id: 'summit',   file: 'bg-summit-v2.png',   p: 'grand BJJ world-championship arena, polished white and gold competition mats with championship circle centred, covering the full floor, marble walls, banners of past champions, spotlights, legendary atmosphere' },
];

// Force regen: delete any existing v2 files
for (const b of BGS) {
  const path = `${OUT}/${b.file}`;
  if (existsSync(path)) { unlinkSync(path); console.log(`  cleared stale: ${path}`); }
}

async function gen(description, filename, w = 384, h = 272) {
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

console.log(`\n=== Regenerating ${BGS.length} battle backgrounds (v3, mat-first) ===\n`);
let ok = 0, fail = 0;
for (const b of BGS) {
  const filename = `${OUT}/${b.file}`;
  const prompt = `${b.p}, ${BASE}`;
  const success = await gen(prompt, filename);
  if (success) ok++; else fail++;
}

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log(`\n=== Done: ${ok} ok / ${fail} fail ===`);
console.log('Balance:', await bal.text());
