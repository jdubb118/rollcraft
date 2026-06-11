// Probe the best photo→sprite path against PixelLab directly.
// Tries image-to-pixelart (with output_size) and image-to-pixelart-pro.
// Usage: node scripts/probe-photo-sprite.mjs /tmp/gq-model-256.png
import { readFileSync, writeFileSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const photo = readFileSync(process.argv[2]).toString('base64');

async function call(path, body, out) {
  const r = await fetch(`https://api.pixellab.ai/v2${path}`, {
    method: 'POST', headers, body: JSON.stringify(body),
  });
  let data = await r.json();
  if (data.background_job_id) {
    for (let i = 0; i < 40; i++) {
      await new Promise(res => setTimeout(res, 4000));
      const p = await fetch(`https://api.pixellab.ai/v2/background-jobs/${data.background_job_id}`, { headers });
      const job = await p.json();
      if (job.status === 'completed') { data = job; break; }
      if (job.status === 'failed') { data = job; break; }
    }
  }
  const b64 = data.image?.base64 || data.images?.[0]?.base64;
  if (b64) {
    writeFileSync(out, Buffer.from(b64, 'base64'));
    console.log(`✓ ${path} -> ${out}`);
  } else {
    console.log(`✗ ${path}:`, JSON.stringify(data).slice(0, 280));
  }
}

await call('/image-to-pixelart', {
  image: { type: 'base64', base64: photo, format: 'png' },
  image_size: { width: 256, height: 256 },
  output_size: { width: 32, height: 32 },
}, '/tmp/gq-i2p-32.png');

await call('/image-to-pixelart-pro', {
  image: { type: 'base64', base64: photo, format: 'png' },
  description: 'BJJ fighter in white gi with white belt, standing fighting stance, game character sprite',
}, '/tmp/gq-i2p-pro.png');
