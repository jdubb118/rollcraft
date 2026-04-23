// AAA home-gym scene — painted base layer matching the tile grid.
// Grid spec (MUST match src/overworld/maps/starterGym.ts):
//   20 cols × 15 rows @ 16px = 320×240
//   walls: outer ring (col 0/19, row 0/13)
//   mat: cols 6-13, rows 1-12 (central vertical strip, bright kelly-green puzzle pattern)
//   floor: cols 1-4 and 15-18 (warm blonde gym hardwood)
//   door opening: cols 9-10, row 13 (no wall — floor strip leading to bottom)
//
// Strategy: two variants, keep the better one. Top-down orthographic, NO characters
// (characters are drawn by the renderer as sprites on top).

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

mkdirSync('public/sprites/scenes', { recursive: true });

const PROMPT = [
  'top-down orthographic pixel art of a brazilian jiu-jitsu gym interior, bird\'s eye view looking straight down',
  'CENTER: bright kelly green puzzle-piece BJJ mat filling the central vertical strip (40% of width), visible puzzle seams, subtle sweat stains and texture variation, a thin red border stripe around the mat edge',
  'LEFT SIDE and RIGHT SIDE: warm blonde hardwood gym floor with visible plank seams, subtle scuff marks near the mat edges',
  'OUTER BORDER: dark stained wood paneling walls framing the whole room, 1-tile thick',
  'BOTTOM CENTER: a narrow doorway opening with floor extending through the wall (no door drawn)',
  'hand-painted detailed texture on every surface, NOT tiled or repeated, NO grid lines',
  'HD-2D style, Octopath Traveler lighting, soft warm overhead ambient glow in the center, cooler shadowy corners, subtle vignette',
  'absolutely NO people, NO characters, NO sprites, NO furniture, NO lockers, NO desk — empty room only',
].join(', ');

async function gen(variant) {
  console.log(`Variant ${variant}: generating 320×240 painted gym scene...`);
  const start = Date.now();
  const res = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
    method: 'POST', headers,
    body: JSON.stringify({
      description: PROMPT,
      image_size: { width: 320, height: 240 },
      no_background: false,
    }),
  });
  const data = await res.json();
  if (data.image?.base64) {
    const path = `public/sprites/scenes/home-v${variant}.png`;
    writeFileSync(path, Buffer.from(data.image.base64, 'base64'));
    console.log(`  Saved: ${path} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  } else {
    console.log(`  Error: ${JSON.stringify(data).substring(0, 300)}`);
  }
}

await gen(1);
await gen(2);
console.log('\nDone — eyeball public/sprites/scenes/home-v1.png and home-v2.png to pick the winner.');
