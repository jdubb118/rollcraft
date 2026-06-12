// Inspect the persisted character from the spike — rotation labels/order.
import { readFileSync, writeFileSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { Authorization: `Bearer ${key}` };
const id = process.argv[2] || '2330583f-4391-4eec-8810-0aaa405a3236';

const r = await fetch(`https://api.pixellab.ai/v2/characters/${id}`, { headers });
const data = await r.json();
// print structure without base64 blobs
function strip(o) {
  if (Array.isArray(o)) return o.map(strip);
  if (o && typeof o === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(o)) {
      out[k] = (typeof v === 'string' && v.length > 80) ? `<b64:${v.length}>` : strip(v);
    }
    return out;
  }
  return o;
}
console.log(JSON.stringify(strip(data), null, 1).slice(0, 3000));
