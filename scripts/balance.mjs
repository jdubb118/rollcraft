import { readFileSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)[1].trim();
const r = await fetch('https://api.pixellab.ai/v2/balance', { headers: { Authorization: 'Bearer ' + key } });
console.log(await r.text());
