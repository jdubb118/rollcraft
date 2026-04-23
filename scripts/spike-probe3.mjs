import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
const conceptBase64 = readFileSync('public/sprites/directions/white-front.png').toString('base64');
mkdirSync('spike-out', { recursive: true });

// rotate with from_image
console.log('--- rotate (same dir, for variation) ---');
let r = await fetch('https://api.pixellab.ai/v2/rotate', {
  method: 'POST', headers,
  body: JSON.stringify({
    image_size: { width: 32, height: 32 },
    from_direction: 'south',
    to_direction: 'south',
    from_image: { type: 'base64', base64: conceptBase64, format: 'png' },
  }),
});
console.log('HTTP', r.status);
const t = await r.text();
try {
  const d = JSON.parse(t);
  if (d.image?.base64) {
    writeFileSync('spike-out/rotate-same-south.png', Buffer.from(d.image.base64, 'base64'));
    console.log('  saved spike-out/rotate-same-south.png');
  } else {
    console.log('Body:', t.slice(0, 500));
  }
} catch {
  console.log('Body:', t.slice(0, 500));
}

// rotate south -> east (true rotation — we already have these but good sanity)
console.log('\n--- rotate south -> east ---');
r = await fetch('https://api.pixellab.ai/v2/rotate', {
  method: 'POST', headers,
  body: JSON.stringify({
    image_size: { width: 32, height: 32 },
    from_direction: 'south',
    to_direction: 'east',
    from_image: { type: 'base64', base64: conceptBase64, format: 'png' },
  }),
});
console.log('HTTP', r.status);
const t2 = await r.text();
try {
  const d = JSON.parse(t2);
  if (d.image?.base64) {
    writeFileSync('spike-out/rotate-south-to-east.png', Buffer.from(d.image.base64, 'base64'));
    console.log('  saved spike-out/rotate-south-to-east.png');
  } else {
    console.log('Body:', t2.slice(0, 500));
  }
} catch {
  console.log('Body:', t2.slice(0, 500));
}

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('\nBalance:', await bal.text());
