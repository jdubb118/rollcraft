// Rotate south-facing NPC sprites into north/east/west variants.
// Only for NPCs with wanders: true — stationary NPCs keep showing south.

import { readFileSync, writeFileSync, existsSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)[1].trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const WANDERERS = [
  'cb-kai','cb-ray','cb-ana',
  'ic-atlas','ic-nova','ic-steel',
  'nc-elena','nc-dante','nc-phoenix',
  'ot-marco','ot-lucia','ot-bruno',
  'sd-nikolai','sd-yuki','sd-ivan',
  'sv-paulo','sv-jade','sv-diego','sv-tank',
  'tp-renzo','tp-rickson','tp-keenan','tp-gordon',
  'sm-tyler','sm-sarah','sm-beast',
  'sc-ghost','sc-legend1','sc-legend2',
];

const ROTATIONS = [
  { dir: 'north', file: 'north' },
  { dir: 'east',  file: 'east'  },
  { dir: 'west',  file: 'west'  },
];

async function rotate(id, toDir, fileLabel) {
  const sourcePath = `public/sprites/npcs/${id}-south.png`;
  const outPath    = `public/sprites/npcs/${id}-${fileLabel}.png`;
  if (existsSync(outPath)) { console.log(`  skip (exists): ${outPath}`); return true; }
  if (!existsSync(sourcePath)) { console.log(`  ✗ missing source: ${sourcePath}`); return false; }

  const base64 = readFileSync(sourcePath).toString('base64');
  const start = Date.now();
  const res = await fetch('https://api.pixellab.ai/v2/rotate', {
    method: 'POST', headers,
    body: JSON.stringify({
      image_size: { width: 32, height: 32 },
      from_direction: 'south',
      to_direction: toDir,
      from_image: { type: 'base64', base64, format: 'png' },
    }),
  });
  if (!res.ok) { console.log(`  ✗ HTTP ${res.status} for ${id}→${toDir}`); return false; }
  const data = await res.json();
  if (!data.image?.base64) { console.log(`  ✗ no image for ${id}→${toDir}`); return false; }
  writeFileSync(outPath, Buffer.from(data.image.base64, 'base64'));
  console.log(`  ✓ ${outPath} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  return true;
}

console.log(`=== Rotating ${WANDERERS.length} wanderers × 3 directions = ${WANDERERS.length * 3} gens ===\n`);
let ok = 0, fail = 0;
for (const id of WANDERERS) {
  console.log(`[${id}]`);
  for (const r of ROTATIONS) {
    const success = await rotate(id, r.dir, r.file);
    if (success) ok++; else fail++;
  }
}

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log(`\n=== Done: ${ok} ok / ${fail} fail ===`);
console.log('Balance:', await bal.text());
