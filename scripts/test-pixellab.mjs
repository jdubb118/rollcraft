import { readFileSync, writeFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const key = env.match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

async function generateAndSave(description, filename, size = 32) {
  console.log(`\nGenerating: ${description.substring(0, 50)}...`);
  const res = await fetch('https://api.pixellab.ai/v2/generate-image-v2', {
    method: 'POST', headers,
    body: JSON.stringify({
      description,
      image_size: { width: size, height: size },
      no_background: true,
    }),
  });
  const data = await res.json();

  if (data.image?.base64) {
    writeFileSync(filename, Buffer.from(data.image.base64, 'base64'));
    console.log(`  Saved: ${filename}`);
    return true;
  }

  if (data.background_job_id) {
    console.log(`  Job: ${data.background_job_id} — polling...`);
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const poll = await fetch(`https://api.pixellab.ai/v2/background-jobs/${data.background_job_id}`, { headers });
      const job = await poll.json();
      if (job.status === 'completed') {
        if (job.image?.base64) {
          writeFileSync(filename, Buffer.from(job.image.base64, 'base64'));
          console.log(`  Saved: ${filename} (after ${(i+1)*3}s)`);
          return true;
        }
        // Check for images array
        if (job.images?.[0]?.base64) {
          writeFileSync(filename, Buffer.from(job.images[0].base64, 'base64'));
          console.log(`  Saved: ${filename} (after ${(i+1)*3}s)`);
          return true;
        }
        console.log('  Completed but no image:', JSON.stringify(job).substring(0, 300));
        return false;
      }
      if (job.status === 'failed') {
        console.log('  FAILED:', JSON.stringify(job).substring(0, 300));
        return false;
      }
      if (i % 5 === 4) console.log(`  Still processing... (${(i+1)*3}s)`);
    }
    console.log('  TIMEOUT after 3 minutes');
    return false;
  }

  console.log('  Error:', JSON.stringify(data).substring(0, 300));
  return false;
}

// Check balance
const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('Balance:', await bal.text());

// Generate 5 belt-evolution sprites
console.log('\n=== BELT EVOLUTION SPRITES ===');

await generateAndSave(
  'tiny skinny nervous white belt martial arts student, oversized white kimono gi, wide scared eyes, slouching posture, front facing, full body, pixel art game character sprite',
  '/tmp/gq-belt-white.png', 32
);

await generateAndSave(
  'lean athletic blue belt BJJ fighter in blue gi, confident stance, slight muscle definition, front facing, full body, pixel art game character sprite',
  '/tmp/gq-belt-blue.png', 32
);

await generateAndSave(
  'fit muscular purple belt BJJ fighter in purple gi, strong stance, athletic build, calm confident expression, front facing, full body, pixel art game character sprite',
  '/tmp/gq-belt-purple.png', 32
);

await generateAndSave(
  'powerful brown belt BJJ fighter in brown gi, broad shoulders, muscular, intense focused expression, imposing stance, front facing, full body, pixel art game character sprite',
  '/tmp/gq-belt-brown.png', 32
);

await generateAndSave(
  'elite black belt BJJ master in black gi, peak physique, massive shoulders, zen expression, powerful warrior stance, intimidating, front facing, full body, pixel art game character sprite',
  '/tmp/gq-belt-black.png', 32
);

// Generate a gym tileset
console.log('\n=== GYM TILESET ===');
await generateAndSave(
  'top down view martial arts gym interior tileset, green training mats, wooden floor tiles, wall tiles, locker tiles, desk tile, door tile, organized grid layout',
  '/tmp/gq-gym-tileset.png', 64
);

// Final balance
const bal2 = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('\nFinal balance:', await bal2.text());
