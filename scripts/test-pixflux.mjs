import { readFileSync, writeFileSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

console.log('Testing create-image-pixflux (v2)...');
const start = Date.now();
const res = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
  method: 'POST', headers,
  body: JSON.stringify({
    description: 'BJJ fighter white gi standing pixel art character',
    image_size: { width: 32, height: 32 },
    no_background: true,
  }),
});
console.log('Status:', res.status, `(${Date.now() - start}ms)`);
const data = await res.json();

if (data.image?.base64) {
  writeFileSync('/tmp/gq-pixflux-test.png', Buffer.from(data.image.base64, 'base64'));
  console.log('SYNC SUCCESS! Saved /tmp/gq-pixflux-test.png');
  console.log('Usage:', JSON.stringify(data.usage));
} else if (data.background_job_id) {
  console.log('Async job:', data.background_job_id, '- polling...');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const poll = await fetch(`https://api.pixellab.ai/v2/background-jobs/${data.background_job_id}`, { headers });
    const job = await poll.json();
    console.log(`  ${(i+1)*3}s: ${job.status}`);
    if (job.status === 'completed') {
      const img = job.image?.base64 || job.images?.[0]?.base64;
      if (img) {
        writeFileSync('/tmp/gq-pixflux-test.png', Buffer.from(img, 'base64'));
        console.log(`  SAVED! (${Date.now() - start}ms total)`);
      } else {
        console.log('  No image in completed job. Keys:', Object.keys(job));
        console.log('  Full response:', JSON.stringify(job).substring(0, 500));
      }
      break;
    }
    if (job.status === 'failed') { console.log('  FAILED:', JSON.stringify(job).substring(0, 200)); break; }
  }
} else {
  console.log('Response:', JSON.stringify(data).substring(0, 500));
}
