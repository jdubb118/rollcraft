// Dump the init_image / image_size schema details from PixelLab's spec.
import { readFileSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const r = await fetch('https://api.pixellab.ai/v2/openapi.json', { headers: { Authorization: `Bearer ${key}` } });
const spec = await r.json();
const schemas = spec.components.schemas;

for (const [name, s] of Object.entries(schemas)) {
  const props = s.properties || {};
  if (props.init_image && props.image_size) {
    console.log('SCHEMA:', name);
    for (const k of ['init_image', 'init_image_strength', 'image_size', 'no_background']) {
      console.log(` ${k}:`, JSON.stringify(props[k]).slice(0, 300));
    }
  }
}
for (const name of Object.keys(schemas)) {
  if (/base64/i.test(name)) {
    console.log(name, JSON.stringify(schemas[name].properties || {}).slice(0, 300));
  }
}
