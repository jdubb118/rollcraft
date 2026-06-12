// Dump request schemas for PixelLab's character suite — can we get a full
// 4-direction game character conditioned on a player's photo?
import { readFileSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const r = await fetch('https://api.pixellab.ai/v2/openapi.json', { headers: { Authorization: `Bearer ${key}` } });
const spec = await r.json();
const schemas = spec.components.schemas;

const targets = [
  '/create-character-with-4-directions',
  '/create-character-v3',
  '/create-character-pro',
  '/create-character-state',
  '/transfer-outfit-v2',
  '/generate-with-style-v2',
  '/animate-with-skeleton',
];

for (const path of targets) {
  const post = spec.paths[path]?.post;
  if (!post) { console.log(`${path}: MISSING`); continue; }
  const ref = post.requestBody?.content?.['application/json']?.schema?.$ref;
  const name = ref?.split('/').pop();
  const props = name ? schemas[name]?.properties || {} : {};
  console.log(`\n=== ${path} (${name}) ===`);
  for (const [k, v] of Object.entries(props)) {
    const t = v.type || v.$ref?.split('/').pop() || (v.anyOf ? v.anyOf.map(a => a.type || a.$ref?.split('/').pop()).join('|') : '?');
    const d = (v.description || '').slice(0, 90);
    console.log(`  ${k}: ${t}${v.default !== undefined ? ` (default ${JSON.stringify(v.default)})` : ''} ${d ? '— ' + d : ''}`);
  }
}
