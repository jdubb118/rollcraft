// Probe /remove-background on the pixelart result.
import { readFileSync, writeFileSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const img = readFileSync('/tmp/gq-i2p-32.png').toString('base64');

const r = await fetch('https://api.pixellab.ai/v2/remove-background', {
  method: 'POST', headers,
  body: JSON.stringify({ image: { type: 'base64', base64: img, format: 'png' }, image_size: { width: 32, height: 32 } }),
});
const data = await r.json();
const b64 = data.image?.base64 || data.images?.[0]?.base64 || data.last_response?.image?.base64;
if (b64) {
  writeFileSync('/tmp/gq-i2p-nobg.png', Buffer.from(b64, 'base64'));
  console.log('✓ saved /tmp/gq-i2p-nobg.png — usage:', JSON.stringify(data.usage || {}));
} else {
  console.log('✗', r.status, JSON.stringify(data).slice(0, 300));
}
