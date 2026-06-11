// Regenerate the home-gym mat surface. The original gen collapsed to a flat
// green rectangle ("subtle" descriptors gave PixelLab nothing to paint) — the
// screen every player stares at for their entire first hour. This prompt
// demands the strong repeating structure that worked for old-town's tatami.
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { Agent, fetch } from 'undici';

// PixelLab sync responses can exceed undici's 5-min default timeouts.
// NOTE: must use the npm undici's fetch — node's bundled fetch ignores
// dispatchers configured on the npm copy.
const dispatcher = new Agent({ headersTimeout: 900000, bodyTimeout: 900000 });
const fetchLong = (url, opts = {}) => fetch(url, { ...opts, dispatcher });

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const target = 'public/sprites/scenes/home/mat-surface.png';
if (!existsSync(target + '.bak')) copyFileSync(target, target + '.bak');

const desc =
  'top-down view of interlocking foam jigsaw puzzle exercise mats covering the whole image, ' +
  'two-tone green checkerboard of large square mat tiles, alternating medium green and slightly darker green squares, ' +
  'each square tile has clearly VISIBLE dark seam lines between tiles forming a bold grid of mat squares, ' +
  'zigzag jigsaw interlocking teeth visible along every seam, ' +
  'each tile has subtle foam speckle texture and slight scuffing, ' +
  'crisp hand-painted pixel art, strong contrast between tiles and seams, ' +
  'NO characters, NO furniture, NO text, NO lighting glare, flat even lighting, pattern fills entire image edge to edge';

console.log('Generating home mat (128x192)...');
const res = await fetchLong('https://api.pixellab.ai/v2/create-image-pixflux', {
  method: 'POST', headers,
  body: JSON.stringify({
    description: desc,
    image_size: { width: 128, height: 192 },
    no_background: false,
  }),
});
const data = await res.json();

let b64 = data.image?.base64;
if (!b64 && data.background_job_id) {
  console.log('Async job — polling...');
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const poll = await fetchLong(`https://api.pixellab.ai/v2/background-jobs/${data.background_job_id}`, { headers });
    const job = await poll.json();
    if (job.status === 'completed') { b64 = job.image?.base64 || job.images?.[0]?.base64; break; }
    if (job.status === 'failed') break;
  }
}

if (b64) {
  writeFileSync(target, Buffer.from(b64, 'base64'));
  console.log('✓ wrote', target, '(backup at .bak)');
} else {
  console.log('✗ Error:', JSON.stringify(data).substring(0, 300));
  process.exit(1);
}
