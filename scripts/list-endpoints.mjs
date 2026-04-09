import { readFileSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const spec = await fetch('https://api.pixellab.ai/v2/openapi.json', { headers }).then(r => r.json());
const paths = Object.keys(spec.paths || {});
console.log(`Total endpoints: ${paths.length}\n`);
paths.forEach(p => {
  const methods = Object.keys(spec.paths[p]).join(',').toUpperCase();
  console.log(`${methods} ${p}`);
});

// Also try a quick sync call to generate-with-style-v2
console.log('\n--- Trying generate-with-style-v2 ---');
const res = await fetch('https://api.pixellab.ai/v2/generate-with-style-v2', {
  method: 'POST', headers,
  body: JSON.stringify({
    description: 'BJJ fighter white gi standing pixel art',
    image_size: { width: 32, height: 32 },
    no_background: true,
  }),
});
console.log('Status:', res.status);
const data = await res.json();
console.log('Keys:', Object.keys(data));
if (data.image) console.log('GOT SYNC IMAGE!');
if (data.background_job_id) console.log('Async job:', data.background_job_id);
