// Enable anonymous sign-ins + create the profiles table (auth.ts references
// it but it never existed). Uses the Management API via the CLI's keychain token.
import { execSync } from 'child_process';

const REF = 'hizlmlftwwkxdnljgqju';
const API = 'https://api.supabase.com/v1';

function getToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN.trim();
  for (const svc of ['Supabase CLI', 'supabase', 'Supabase']) {
    try {
      const t = execSync(`security find-generic-password -s "${svc}" -w`, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 8000 }).toString().trim();
      if (t) return t;
    } catch { /* next */ }
  }
  throw new Error('no supabase token');
}

const headers = { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };

// 1. Current auth config — find the anonymous flag name
const g = await fetch(`${API}/projects/${REF}/config/auth`, { headers });
const cfg = await g.json();
const anonKeys = Object.keys(cfg).filter(k => /anon/i.test(k));
console.log('anonymous-related config keys:', anonKeys.map(k => `${k}=${cfg[k]}`).join(', ') || 'none found');

// 2. Enable anonymous sign-ins
const patchBody = {};
for (const k of anonKeys) if (/enable|allow/i.test(k) || k === 'external_anonymous_users_enabled') patchBody[k] = true;
if (!Object.keys(patchBody).length) patchBody['external_anonymous_users_enabled'] = true;
const p = await fetch(`${API}/projects/${REF}/config/auth`, { method: 'PATCH', headers, body: JSON.stringify(patchBody) });
console.log('patch:', p.status, JSON.stringify(patchBody));
if (p.ok) {
  const after = await (await fetch(`${API}/projects/${REF}/config/auth`, { headers })).json();
  for (const k of Object.keys(patchBody)) console.log(`  ${k} now =`, after[k]);
}

// 3. profiles table
const SQL = `
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  slug text unique,
  display_name text,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
drop policy if exists "profiles public read" on profiles;
create policy "profiles public read" on profiles for select using (true);
drop policy if exists "profiles owner write" on profiles;
create policy "profiles owner write" on profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);
`;
const q = await fetch(`${API}/projects/${REF}/database/query`, { method: 'POST', headers, body: JSON.stringify({ query: SQL }) });
console.log('profiles table:', q.status, (await q.text()).slice(0, 120));
