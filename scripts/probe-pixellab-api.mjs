// Probe PixelLab's current API surface — their schema drifts (concept_image
// gone in April, reference_images gone by June). Finds image-conditioned params.
import { readFileSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { Authorization: `Bearer ${key}` };

for (const path of ['/v2/openapi.json', '/openapi.json', '/v2/docs/openapi.json']) {
  const r = await fetch(`https://api.pixellab.ai${path}`, { headers });
  if (r.ok) {
    const spec = await r.json();
    const paths = Object.keys(spec.paths || {});
    console.log('SPEC at', path, '— endpoints:');
    for (const p of paths) console.log(' ', p);
    // dump request schema names for generation endpoints
    for (const p of paths) {
      if (!/create|generate|image/.test(p)) continue;
      const post = spec.paths[p]?.post;
      const ref = post?.requestBody?.content?.['application/json']?.schema?.$ref;
      const name = ref?.split('/').pop();
      const props = name ? Object.keys(spec.components?.schemas?.[name]?.properties || {}) : [];
      console.log(`\n${p}:`, props.join(', '));
    }
    process.exit(0);
  }
}
console.log('no spec found; probing bitforge directly');
const r = await fetch('https://api.pixellab.ai/v2/create-image-bitforge', {
  method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
});
console.log(r.status, (await r.text()).slice(0, 800));

// Detail mode: node probe-pixellab-api.mjs detail — dump init_image specifics
export {};
