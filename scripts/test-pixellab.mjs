import { readFileSync, writeFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const key = env.match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

// Check balance
const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('Balance:', await bal.text());

async function generate(desc, filename, size = 32) {
  console.log(`\nGenerating: ${desc.substring(0, 60)}...`);
  const start = Date.now();
  const res = await fetch('https://api.pixellab.ai/v2/generate-image-v2', {
    method: 'POST', headers,
    body: JSON.stringify({ description: desc, image_size: { width: size, height: size }, no_background: true }),
  });
  const data = await res.json();

  if (data.image?.base64) {
    writeFileSync(filename, Buffer.from(data.image.base64, 'base64'));
    console.log(`  SYNC! Saved ${filename} (${Date.now() - start}ms)`);
    return true;
  }
  if (data.background_job_id) {
    console.log(`  Job: ${data.background_job_id}`);
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`https://api.pixellab.ai/v2/background-jobs/${data.background_job_id}`, { headers });
      const job = await poll.json();
      if (job.status === 'completed') {
        const img = job.image?.base64 || job.images?.[0]?.base64;
        if (img) {
          writeFileSync(filename, Buffer.from(img, 'base64'));
          console.log(`  Saved ${filename} (${Date.now() - start}ms)`);
          return true;
        }
        console.log('  Completed but no image:', Object.keys(job));
        return false;
      }
      if (job.status === 'failed') { console.log('  FAILED'); return false; }
    }
    console.log('  TIMEOUT');
    return false;
  }
  console.log('  Error:', JSON.stringify(data).substring(0, 200));
  return false;
}

// Quick test — single sprite
await generate(
  'BJJ fighter in white gi, standing fighting stance, front facing, full body, pixel art game character',
  '/tmp/gq-test-fighter.png', 32
);

console.log('\nDone!');
const bal2 = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('Balance after:', await bal2.text());
