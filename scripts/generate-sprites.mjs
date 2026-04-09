import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

mkdirSync('public/sprites', { recursive: true });

async function gen(desc, filename, size = 32) {
  console.log(`\nGenerating: ${desc.substring(0, 70)}...`);
  const start = Date.now();
  const res = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
    method: 'POST', headers,
    body: JSON.stringify({ description: desc, image_size: { width: size, height: size }, no_background: true }),
  });
  if (res.ok) {
    const data = await res.json();
    if (data.image?.base64) {
      writeFileSync(filename, Buffer.from(data.image.base64, 'base64'));
      console.log(`  Saved: ${filename} (${((Date.now()-start)/1000).toFixed(1)}s)`);
      return true;
    }
  }
  console.log(`  Failed: ${res.status}`);
  return false;
}

console.log('=== BELT EVOLUTION SPRITES (32x32) ===');

await gen(
  'tiny skinny nervous beginner martial arts student in oversized baggy white gi, scared wide eyes, slouching posture, front facing, full body, pixel art game character sprite',
  'public/sprites/belt-white.png'
);

await gen(
  'lean athletic young martial arts fighter in fitted blue gi with blue belt, confident standing stance, slight muscle definition, front facing, full body, pixel art game character sprite',
  'public/sprites/belt-blue.png'
);

await gen(
  'fit muscular martial arts fighter in purple gi with purple belt, strong athletic stance, defined arms and shoulders, calm focused expression, front facing, full body, pixel art game character sprite',
  'public/sprites/belt-purple.png'
);

await gen(
  'powerful broad-shouldered martial arts fighter in dark brown gi with brown belt, imposing muscular build, intense warrior stance, front facing, full body, pixel art game character sprite',
  'public/sprites/belt-brown.png'
);

await gen(
  'elite martial arts master in black gi with black belt, peak physique massive shoulders, zen powerful expression, legendary warrior stance, intimidating aura, front facing, full body, pixel art game character sprite',
  'public/sprites/belt-black.png'
);

console.log('\n=== GYM TILESETS ===');

await gen(
  'top down view pixel art tileset of martial arts gym interior, green training mats, wooden floor, grey walls, arranged in clean grid for game, 16 tiles',
  'public/sprites/tileset-gym.png', 64
);

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('\nBalance:', await bal.text());
console.log('Done!');
