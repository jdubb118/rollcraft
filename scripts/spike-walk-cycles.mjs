// Phase 0.5 PixelLab spike — can we produce a consistent 2-frame walk cycle
// by conditioning on an existing directional sprite?
//
// We'll generate a "step" variant for white-front and white-left using
// concept_image. If the new frames match the character and just shift
// the leg/foot pose, walk cycles via PixelLab are viable.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
if (!key) { console.error('No PIXELLAB_SECRET in .env'); process.exit(1); }
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const OUT = 'spike-out';
mkdirSync(OUT, { recursive: true });

async function gen(description, conceptPath, outPath, size = 32) {
  console.log(`\n→ ${description.substring(0, 70)}`);
  const conceptBase64 = readFileSync(conceptPath).toString('base64');
  const start = Date.now();
  const res = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
    method: 'POST', headers,
    body: JSON.stringify({
      description,
      image_size: { width: size, height: size },
      no_background: true,
      concept_image: { type: 'base64', base64: conceptBase64, format: 'png' },
    }),
  });
  if (!res.ok) { console.log(`  ✗ HTTP ${res.status}`); return false; }
  const data = await res.json();
  if (!data.image?.base64) { console.log(`  ✗ no image in response: ${JSON.stringify(data).slice(0, 200)}`); return false; }
  writeFileSync(outPath, Buffer.from(data.image.base64, 'base64'));
  console.log(`  ✓ ${outPath} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  return true;
}

console.log('=== WALK CYCLE SPIKE ===');

// Test 1: walk step — front view, right leg forward
await gen(
  'small BJJ student in oversized baggy white gi, front view, walking pose, right leg stepping forward, left leg behind, arms slightly swinging, pixel art game character sprite',
  'public/sprites/directions/white-front.png',
  `${OUT}/white-front-step.png`,
);

// Test 2: walk step — left view, opposite leg forward to the reference
await gen(
  'small BJJ student in oversized baggy white gi, side profile facing left, mid-step walking pose, opposite leg forward than reference, pixel art game character sprite',
  'public/sprites/directions/white-left.png',
  `${OUT}/white-left-step.png`,
);

// Test 3: ambient tile — water ripple variant
console.log('\n=== TILE FRAME SPIKE ===');
async function genTile(description, outPath, size = 16) {
  console.log(`\n→ ${description.substring(0, 70)}`);
  const start = Date.now();
  const res = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
    method: 'POST', headers,
    body: JSON.stringify({
      description,
      image_size: { width: size, height: size },
      no_background: false,
    }),
  });
  if (!res.ok) { console.log(`  ✗ HTTP ${res.status}`); return false; }
  const data = await res.json();
  if (!data.image?.base64) { console.log(`  ✗ no image`); return false; }
  writeFileSync(outPath, Buffer.from(data.image.base64, 'base64'));
  console.log(`  ✓ ${outPath} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  return true;
}

await genTile(
  'top-down pixel art 16x16 water tile, deep blue ripples, seamless tileable, frame 1 of 3',
  `${OUT}/water-f1.png`,
);
await genTile(
  'top-down pixel art 16x16 water tile, deep blue ripples shifted slightly, seamless tileable, frame 2 of 3',
  `${OUT}/water-f2.png`,
);

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('\nBalance:', await bal.text());
console.log('\nCompare the output PNGs in spike-out/ against the originals.');
console.log('Decision point: do frame1+frame2 look like the same character mid-stride?');
