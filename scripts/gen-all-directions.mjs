import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
mkdirSync('public/sprites/directions', { recursive: true });

const DIRS = { left: 'west', right: 'east', back: 'north' };

async function rotateOne(imgBase64, fromDir, toDir) {
  const res = await fetch('https://api.pixellab.ai/v2/rotate', {
    method: 'POST', headers,
    body: JSON.stringify({
      from_image: { type: 'base64', base64: imgBase64, format: 'png' },
      from_direction: fromDir,
      to_direction: toDir,
      image_size: { width: 32, height: 32 },
    }),
  });
  const data = await res.json();
  return data.image?.base64 || null;
}

const belts = ['white', 'blue', 'purple', 'brown', 'black'];

for (const belt of belts) {
  console.log(`\n=== ${belt.toUpperCase()} ===`);
  const imgData = readFileSync(`public/sprites/belt-${belt}.png`).toString('base64');

  // Copy front
  writeFileSync(`public/sprites/directions/${belt}-front.png`, readFileSync(`public/sprites/belt-${belt}.png`));
  console.log(`  front: copied`);

  for (const [gameDir, compassDir] of Object.entries(DIRS)) {
    const start = Date.now();
    const result = await rotateOne(imgData, 'south', compassDir);
    if (result) {
      writeFileSync(`public/sprites/directions/${belt}-${gameDir}.png`, Buffer.from(result, 'base64'));
      console.log(`  ${gameDir}: saved (${((Date.now()-start)/1000).toFixed(1)}s)`);
    } else {
      console.log(`  ${gameDir}: FAILED`);
    }
  }
}

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('\nBalance:', await bal.text());
console.log('Done!');
