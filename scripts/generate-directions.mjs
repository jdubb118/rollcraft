import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

mkdirSync('public/sprites/directions', { recursive: true });

async function genSync(endpoint, body, filename) {
  console.log(`  Calling ${endpoint}...`);
  const start = Date.now();
  const res = await fetch(`https://api.pixellab.ai/v2/${endpoint}`, {
    method: 'POST', headers, body: JSON.stringify(body),
  });
  const data = await res.json();

  // Sync response
  if (data.image?.base64) {
    writeFileSync(filename, Buffer.from(data.image.base64, 'base64'));
    console.log(`  Saved: ${filename} (${((Date.now()-start)/1000).toFixed(1)}s)`);
    return data;
  }

  // Async — poll
  if (data.background_job_id) {
    console.log(`  Job: ${data.background_job_id}`);
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const poll = await fetch(`https://api.pixellab.ai/v2/background-jobs/${data.background_job_id}`, { headers });
      const job = await poll.json();
      if (job.status === 'completed') {
        // Check for character with directions
        if (job.character) {
          console.log(`  Character created! ID: ${job.character.id || 'unknown'}`);
          console.log(`  Keys: ${Object.keys(job).join(', ')}`);
          // Save any images
          if (job.character.images) {
            for (const [dir, img] of Object.entries(job.character.images)) {
              if (img?.base64) {
                const dirFile = filename.replace('.png', `-${dir}.png`);
                writeFileSync(dirFile, Buffer.from(img.base64, 'base64'));
                console.log(`  Saved direction: ${dirFile}`);
              }
            }
          }
          return job;
        }
        if (job.image?.base64) {
          writeFileSync(filename, Buffer.from(job.image.base64, 'base64'));
          console.log(`  Saved: ${filename} (${((Date.now()-start)/1000).toFixed(1)}s)`);
          return job;
        }
        if (job.images) {
          for (let j = 0; j < job.images.length; j++) {
            if (job.images[j]?.base64) {
              const f = filename.replace('.png', `-${j}.png`);
              writeFileSync(f, Buffer.from(job.images[j].base64, 'base64'));
              console.log(`  Saved: ${f}`);
            }
          }
          return job;
        }
        console.log(`  Completed. Keys: ${Object.keys(job).join(', ')}`);
        console.log(`  Full: ${JSON.stringify(job).substring(0, 500)}`);
        return job;
      }
      if (job.status === 'failed') { console.log(`  FAILED`); return null; }
      if (i % 5 === 4) console.log(`  Still processing... (${(i+1)*3}s)`);
    }
    console.log(`  TIMEOUT`);
    return null;
  }

  console.log(`  Response: ${JSON.stringify(data).substring(0, 300)}`);
  return data;
}

// ── Generate 4-direction sprites for white belt ──
console.log('=== 4-DIRECTION WHITE BELT ===');
const whiteFront = readFileSync('public/sprites/belt-white.png');
const whiteBase64 = whiteFront.toString('base64');

await genSync('create-character-with-4-directions', {
  description: 'small BJJ martial arts student in white gi, pixel art game character',
  image_size: { width: 32, height: 32 },
  no_background: true,
  concept_image: { type: 'base64', base64: whiteBase64, format: 'png' },
}, 'public/sprites/directions/white-belt.png');

// ── Generate 4-direction sprites for black belt ──
console.log('\n=== 4-DIRECTION BLACK BELT ===');
const blackFront = readFileSync('public/sprites/belt-black.png');
const blackBase64 = blackFront.toString('base64');

await genSync('create-character-with-4-directions', {
  description: 'elite BJJ master in black gi, powerful muscular, pixel art game character',
  image_size: { width: 32, height: 32 },
  no_background: true,
  concept_image: { type: 'base64', base64: blackBase64, format: 'png' },
}, 'public/sprites/directions/black-belt.png');

// ── Generate custom gym tileset ──
console.log('\n=== HOME GYM TILESET ===');
await genSync('create-image-pixflux', {
  description: 'top-down pixel art tileset for martial arts dojo gym, green training mats, wooden floor planks, grey stone walls, metal lockers, wooden desk, technique board, door frame, organized 4x4 grid of 16px tiles',
  image_size: { width: 64, height: 64 },
  no_background: false,
}, 'public/sprites/tileset-home.png');

// ── Scramble Valley tileset (warehouse/industrial) ──
console.log('\n=== SCRAMBLE VALLEY TILESET ===');
await genSync('create-image-pixflux', {
  description: 'top-down pixel art tileset for industrial warehouse gym, teal blue training mats, concrete floor, corrugated metal walls, neon lights, speakers, organized 4x4 grid of 16px tiles',
  image_size: { width: 64, height: 64 },
  no_background: false,
}, 'public/sprites/tileset-scramble.png');

// ── Old Town tileset (traditional dojo) ──
console.log('\n=== OLD TOWN TILESET ===');
await genSync('create-image-pixflux', {
  description: 'top-down pixel art tileset for traditional Japanese dojo, tatami mats, dark wood floor, paper screen walls, hanging scrolls, bonsai, organized 4x4 grid of 16px tiles',
  image_size: { width: 64, height: 64 },
  no_background: false,
}, 'public/sprites/tileset-oldtown.png');

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('\nBalance:', await bal.text());
console.log('Done!');
