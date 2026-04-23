// Targeted regen of bg-home-v2, bg-steel-v2, bg-iron-v2.
// Prompt fixes:
// - home + steel: EXPLICITLY empty mat, no painted fighters (real sprites draw on top)
// - iron: more training-gym, less ceremonial throne hall

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)[1].trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
const OUT = 'public/sprites/backgrounds';

const BASE = 'BJJ jiu-jitsu training gym interior, thick grappling mats covering the centre floor as the dominant feature, EMPTY MAT with no people on it, side-view pixel art, modern-pixel Stardew Valley aesthetic, clear mat-floor distinction from walls, no furniture on the mat, no water';

const FIXES = [
  { file: 'bg-home-v2.png',
    p: 'friendly neighbourhood BJJ dojo seen side-on, large green grappling mat covering the centre floor (empty — no fighters painted in), wood-panelled walls with framed instructor certificates, sparring class atmosphere, heavy bag or kettlebells against the back wall, warm lighting' },
  { file: 'bg-steel-v2.png',
    p: 'hard-nosed wrestling and BJJ room seen side-on, navy blue grappling mat covering the centre floor (empty — no fighters painted in), painted concrete walls with silhouette murals, chalkboard with training schedule, ropes and medicine balls stacked against the walls, iron grind atmosphere' },
  { file: 'bg-iron-v2.png',
    p: 'elite BJJ training gym at a cliffside competition centre, full-floor polished black grappling mats with gold trim (empty — no fighters painted in), stone walls with dumbbell racks and kettlebells on one side, heavy bag hanging in corner, championship banners, window with ocean view, prestigious active training gym atmosphere NOT a ceremonial hall' },
];

for (const f of FIXES) {
  const path = `${OUT}/${f.file}`;
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

console.log(`\n=== Targeted regen of ${FIXES.length} battle BGs ===\n`);
for (const f of FIXES) {
  await gen(`${f.p}, ${BASE}`, `${OUT}/${f.file}`);
}

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('\nBalance:', await bal.text());
