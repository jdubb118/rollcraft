import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
mkdirSync('public/sprites/directions', { recursive: true });

async function rotateSprite(inputFile, belt) {
  const imgData = readFileSync(inputFile).toString('base64');
  const imgObj = { type: 'base64', base64: imgData, format: 'png' };

  console.log(`  Generating 8 rotations for ${belt}...`);
  const start = Date.now();

  const res = await fetch('https://api.pixellab.ai/v2/generate-8-rotations-v2', {
    method: 'POST', headers,
    body: JSON.stringify({
      from_image: imgObj,
      image_size: { width: 32, height: 32 },
      from_direction: 'south',
    }),
  });

  console.log(`  Status: ${res.status} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  const data = await res.json();

  const gameMap = { south: 'front', west: 'left', east: 'right', north: 'back' };

  if (data.images) {
    const dirNames = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'];
    for (let i = 0; i < data.images.length; i++) {
      if (data.images[i]?.base64 && gameMap[dirNames[i]]) {
        const outFile = `public/sprites/directions/${belt}-${gameMap[dirNames[i]]}.png`;
        writeFileSync(outFile, Buffer.from(data.images[i].base64, 'base64'));
        console.log(`    ${gameMap[dirNames[i]]}: saved`);
      }
    }
    return;
  }

  if (data.background_job_id) {
    console.log(`  Job: ${data.background_job_id}`);
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const poll = await fetch(`https://api.pixellab.ai/v2/background-jobs/${data.background_job_id}`, { headers });
      const job = await poll.json();
      if (job.status === 'completed' && job.images) {
        const dirNames = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'];
        for (let j = 0; j < job.images.length; j++) {
          if (job.images[j]?.base64 && gameMap[dirNames[j]]) {
            const outFile = `public/sprites/directions/${belt}-${gameMap[dirNames[j]]}.png`;
            writeFileSync(outFile, Buffer.from(job.images[j].base64, 'base64'));
            console.log(`    ${gameMap[dirNames[j]]}: saved`);
          }
        }
        console.log(`  Done (${((Date.now()-start)/1000).toFixed(1)}s)`);
        return;
      }
      if (job.status === 'failed') { console.log('  FAILED'); return; }
      if (i % 5 === 4) console.log(`  Polling... (${(i+1)*3}s)`);
    }
  }

  console.log(`  Response: ${JSON.stringify(data).substring(0, 300)}`);
}

console.log('=== WHITE BELT ===');
await rotateSprite('public/sprites/belt-white.png', 'white');

console.log('\n=== BLACK BELT ===');
await rotateSprite('public/sprites/belt-black.png', 'black');

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('\nBalance:', await bal.text());
