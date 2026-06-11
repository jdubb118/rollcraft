// Wire Supabase credentials everywhere they belong, without ever printing them:
// - Netlify env (functions): SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// - Netlify env (client builds on Netlify): VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
// - .env.local (local vite builds): VITE_ pair
// Keys come from the Supabase CLI (keychain-authorized).
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const REF = 'hizlmlftwwkxdnljgqju';
const URL = `https://${REF}.supabase.co`;

const raw = execSync(`supabase projects api-keys --project-ref ${REF} --output json`, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const keys = JSON.parse(raw);
const anon = keys.find(k => k.name === 'anon')?.api_key;
const service = keys.find(k => k.name === 'service_role')?.api_key;
if (!anon || !service) {
  console.log('key names found:', keys.map(k => k.name).join(', '));
  throw new Error('missing anon/service_role keys');
}

const set = (name, value) =>
  execSync(`netlify env:set ${name} "${value}" --force`, { stdio: ['ignore', 'pipe', 'pipe'] });

set('SUPABASE_URL', URL);
set('SUPABASE_SERVICE_ROLE_KEY', service);
set('VITE_SUPABASE_URL', URL);
set('VITE_SUPABASE_ANON_KEY', anon);
console.log('netlify env set: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');

// .env.local for local builds (vite inlines VITE_ at build time)
const envLocal = '.env.local';
let contents = existsSync(envLocal) ? readFileSync(envLocal, 'utf8') : '';
contents = contents.split('\n').filter(l => !l.startsWith('VITE_SUPABASE')).join('\n').trim();
contents += `\nVITE_SUPABASE_URL=${URL}\nVITE_SUPABASE_ANON_KEY=${anon}\n`;
writeFileSync(envLocal, contents.trimStart());
console.log('.env.local updated (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');

// sanity: .env.local must be gitignored
const gi = readFileSync('.gitignore', 'utf8');
console.log('.env.local gitignored:', /(^|\n)\s*(\.env\.local|\*\.local|\.env\*)\s*(\n|$)/.test(gi) ? 'YES' : 'NO — ADD IT');
