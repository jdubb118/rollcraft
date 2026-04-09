import { readFileSync, writeFileSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
const imgData = readFileSync('public/sprites/belt-white.png').toString('base64');

// Try with just description + reference, no direct image
console.log('Test 1: generate-8-rotations-v2 with reference_image...');
let res = await fetch('https://api.pixellab.ai/v2/generate-8-rotations-v2', {
  method: 'POST', headers,
  body: JSON.stringify({
    description: 'small martial arts student in white gi, pixel art character',
    reference_image: { type: 'base64', base64: imgData, format: 'png' },
    image_size: { width: 32, height: 32 },
    from_direction: 'south',
  }),
});
console.log('Status:', res.status);
let data = await res.json();
if (data.images) console.log('GOT IMAGES:', data.images.length);
else if (data.background_job_id) console.log('Job:', data.background_job_id);
else console.log(JSON.stringify(data).substring(0, 300));

// Try rotate endpoint with from_image
console.log('\nTest 2: rotate with from_image...');
res = await fetch('https://api.pixellab.ai/v2/rotate', {
  method: 'POST', headers,
  body: JSON.stringify({
    from_image: { type: 'base64', base64: imgData, format: 'png' },
    from_direction: 'south',
    to_direction: 'west',
    image_size: { width: 32, height: 32 },
  }),
});
console.log('Status:', res.status);
data = await res.json();
if (data.image?.base64) {
  writeFileSync('/tmp/gq-rotated.png', Buffer.from(data.image.base64, 'base64'));
  console.log('SAVED /tmp/gq-rotated.png');
} else if (data.background_job_id) console.log('Job:', data.background_job_id);
else console.log(JSON.stringify(data).substring(0, 300));
