// Probe 2: is there any endpoint that still accepts a reference image?
import { readFileSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
const conceptBase64 = readFileSync('public/sprites/directions/white-front.png').toString('base64');

// rotate endpoint
console.log('--- rotate ---');
let r = await fetch('https://api.pixellab.ai/v2/rotate', {
  method: 'POST', headers,
  body: JSON.stringify({
    image_size: { width: 32, height: 32 },
    from_direction: 'south',
    to_direction: 'south',
    image: { type: 'base64', base64: conceptBase64, format: 'png' },
  }),
});
console.log('HTTP', r.status);
console.log('Body:', (await r.text()).slice(0, 600));

// character-with-4-directions endpoint (async)
console.log('\n--- create-character-with-4-directions ---');
r = await fetch('https://api.pixellab.ai/v2/create-character-with-4-directions', {
  method: 'POST', headers,
  body: JSON.stringify({
    description: 'BJJ student in white gi',
    image_size: { width: 32, height: 32 },
    no_background: true,
    concept_image: { type: 'base64', base64: conceptBase64, format: 'png' },
  }),
});
console.log('HTTP', r.status);
console.log('Body:', (await r.text()).slice(0, 600));

// list endpoints (sometimes helpful)
console.log('\n--- GET / (root) ---');
r = await fetch('https://api.pixellab.ai/v2/', { headers });
console.log('HTTP', r.status);
console.log('Body:', (await r.text()).slice(0, 400));
