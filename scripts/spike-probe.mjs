// Minimal probe: what is PixelLab returning on 422?
import { readFileSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

// Probe 1: simplest possible call — no concept image
console.log('--- probe 1: plain pixflux gen ---');
let r = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
  method: 'POST', headers,
  body: JSON.stringify({
    description: 'pixel art martial artist',
    image_size: { width: 32, height: 32 },
    no_background: true,
  }),
});
console.log('HTTP', r.status);
console.log('Body:', (await r.text()).slice(0, 800));

// Probe 2: with concept_image
console.log('\n--- probe 2: pixflux with concept_image ---');
const conceptBase64 = readFileSync('public/sprites/directions/white-front.png').toString('base64');
r = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
  method: 'POST', headers,
  body: JSON.stringify({
    description: 'pixel art martial artist walking',
    image_size: { width: 32, height: 32 },
    no_background: true,
    concept_image: { type: 'base64', base64: conceptBase64, format: 'png' },
  }),
});
console.log('HTTP', r.status);
console.log('Body:', (await r.text()).slice(0, 800));

// Probe 3: balance
console.log('\n--- probe 3: balance ---');
r = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('HTTP', r.status);
console.log('Body:', (await r.text()).slice(0, 400));
