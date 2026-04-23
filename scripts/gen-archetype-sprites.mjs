// Archetype sprites: one per (style × belt) combo for random encounter
// opponents in battle. Fills the gap where `getNPCSprite(random-id)` returns
// null and battle falls through to the old programmatic drawGrapplerSprite.
//
// 8 styles × 5 belts = 40 sprites, front-facing (battle camera is head-on).
//
// Saved as: public/sprites/archetypes/{style}-{belt}.png

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
mkdirSync('public/sprites/archetypes', { recursive: true });

const STYLES = {
  wrestler:          'stocky muscular jiu-jitsu wrestler, thick traps, cauliflower ears, short hair, wide athletic stance, aggressive stare, confident',
  judoka:            'disciplined traditional judoka, clean white gi tied tight, focused calm expression, straight posture, ready stance',
  'guard-player':    'lean flexible jiu-jitsu guard player, sitting-ready stance, technical look, slightly longer hair, ready to pull guard',
  'pressure-passer': 'heavy-set jiu-jitsu pressure passer, thick build, confident imposing posture, methodical look, strong core',
  'leg-locker':      'lean wiry jiu-jitsu leg lock specialist, angular face, technical focused expression, crouched low, ready to attack legs',
  berimbolo:         'young lean flexible jiu-jitsu competitor, lapel-gripping ready stance, athletic dynamic posture, nimble look',
  'sub-hunter':      'angular predatory jiu-jitsu submission hunter, intense focused stare, grab-ready hands, arm positioning forward',
  controller:        'calm balanced jiu-jitsu all-rounder, centered stance, composed expression, versatile athletic build, poised',
};

const BELTS = {
  white: 'wearing a clean new white belt around the waist, white gi',
  blue:  'wearing a blue belt with black tip around the waist, white gi, a bit weathered',
  purple:'wearing a purple belt with black tip around the waist, white gi, experienced look',
  brown: 'wearing a brown belt with black tip around the waist, worn white gi, expert look',
  black: 'wearing a scuffed black belt with a few white stripes around the waist, well-worn gi, master-level presence',
};

const SHARED = 'front-facing portrait-standing pose, feet visible at bottom, head at top, centered in frame, HD-2D painted pixel art, clean transparent background, soft drop shadow at feet';

async function gen(style, belt) {
  const filename = `public/sprites/archetypes/${style}-${belt}.png`;
  if (existsSync(filename)) {
    console.log(`  ⏭  ${style}/${belt} (exists)`);
    return;
  }
  const desc = `${STYLES[style]}, ${BELTS[belt]}, ${SHARED}`;
  const start = Date.now();
  const res = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
    method: 'POST', headers,
    body: JSON.stringify({
      description: desc,
      image_size: { width: 32, height: 32 },
      no_background: true,
    }),
  });
  const data = await res.json();
  if (data.image?.base64) {
    writeFileSync(filename, Buffer.from(data.image.base64, 'base64'));
    console.log(`  ✓ ${style}/${belt} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  } else {
    console.log(`  ✗ ${style}/${belt} ERROR: ${JSON.stringify(data).substring(0, 200)}`);
  }
}

for (const style of Object.keys(STYLES)) {
  console.log(`\n━━━ ${style} ━━━`);
  for (const belt of Object.keys(BELTS)) {
    await gen(style, belt);
  }
}
console.log('\n✓ All 40 archetype sprites generated.');
