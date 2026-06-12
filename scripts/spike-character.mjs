// SPIKE: photo → full game character with directional rotations.
// Tries create-character-pro (concept mode: photo straight in, gi in the
// description). Saves every returned frame for visual judgment.
// Usage: node scripts/spike-character.mjs /tmp/gq-model-512.png
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const photo = readFileSync(process.argv[2]).toString('base64');
mkdirSync('/tmp/gq-char', { recursive: true });

console.log('creating character (pro, concept mode)...');
const r = await fetch('https://api.pixellab.ai/v2/create-character-pro', {
  method: 'POST', headers,
  body: JSON.stringify({
    description: 'adult male BJJ fighter wearing a white gi with a white belt, athletic build, game character',
    method: 'create_from_concept',
    concept_image: { type: 'base64', base64: photo, format: 'png' },
    image_size: { width: 32, height: 32 },
    view: 'low top-down',
    template_id: 'mannequin',
    no_background: true,
  }),
});
let data = await r.json();
console.log('initial:', r.status, JSON.stringify(data).slice(0, 240));

const jobId = data.background_job_id || data.job_id;
if (jobId) {
  for (let i = 0; i < 90; i++) {
    await new Promise(res => setTimeout(res, 8000));
    const p = await fetch(`https://api.pixellab.ai/v2/background-jobs/${jobId}`, { headers });
    const job = await p.json();
    if (i % 4 === 0) console.log(`  [${i}] ${job.status}`);
    if (job.status === 'completed' || job.status === 'failed') { data = job; break; }
  }
}

console.log('final keys:', Object.keys(data).join(', '));
console.log('usage:', JSON.stringify(data.usage || {}));

// Hunt for frames anywhere in the response
const frames = [];
function walk(o, path = '') {
  if (!o || typeof o !== 'object') return;
  if (typeof o.base64 === 'string' && o.base64.length > 100) frames.push({ path, b64: o.base64 });
  for (const [k, v] of Object.entries(o)) {
    if (k === 'base64') continue;
    walk(v, path ? `${path}.${k}` : k);
  }
}
walk(data);
console.log('frames found:', frames.length);
frames.forEach((f, i) => {
  writeFileSync(`/tmp/gq-char/frame-${String(i).padStart(2, '0')}.png`, Buffer.from(f.b64, 'base64'));
  console.log(`  saved frame-${String(i).padStart(2, '0')} (${f.path})`);
});

// Character may persist server-side — record the id for /characters/{id} fetch
if (data.character_id || data.last_response?.character_id) {
  console.log('character_id:', data.character_id || data.last_response.character_id);
}
