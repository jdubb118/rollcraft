// Identity Engine schema setup — restores the (auto-paused) Supabase project
// and creates the gyms + gym_members tables with RLS via the Management API.
// Reads the access token that `supabase login` stored locally.
// Idempotent: CREATE TABLE IF NOT EXISTS + drop/recreate policies.
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';

const REF = 'hizlmlftwwkxdnljgqju';
const API = 'https://api.supabase.com/v1';

function getToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN.trim();
  const candidates = [
    join(homedir(), '.supabase', 'access-token'),
    join(homedir(), 'Library', 'Application Support', 'supabase', 'access-token'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, 'utf8').trim();
  }
  // CLI 2.x on macOS stores the login token in the system keychain
  for (const svc of ['Supabase CLI', 'supabase', 'Supabase']) {
    try {
      const t = execSync(`security find-generic-password -s "${svc}" -w`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      if (t) return t;
    } catch { /* try next */ }
  }
  throw new Error('No supabase access token found — run `supabase login`');
}

const token = getToken();
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function getStatus() {
  const r = await fetch(`${API}/projects/${REF}`, { headers });
  const j = await r.json();
  return j.status;
}

let status = await getStatus();
console.log('project status:', status);

if (status === 'INACTIVE') {
  console.log('restoring project...');
  const r = await fetch(`${API}/projects/${REF}/restore`, { method: 'POST', headers, body: '{}' });
  console.log('restore request:', r.status);
}
if (status !== 'ACTIVE_HEALTHY') {
  // INACTIVE (just kicked), COMING_UP, RESTORING — poll until healthy
  for (let i = 0; i < 60; i++) {
    await new Promise(res => setTimeout(res, 10000));
    status = await getStatus();
    console.log(`  [${i}] ${status}`);
    if (status === 'ACTIVE_HEALTHY') break;
  }
}

if (status !== 'ACTIVE_HEALTHY') {
  console.log('project not healthy:', status);
  process.exit(1);
}

const SQL = `
create table if not exists gyms (
  id text primary key,
  name text not null,
  founder_device text,
  palette jsonb,
  logo_url text,
  wins int not null default 0,
  member_count int not null default 0,
  trophies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists gym_members (
  id uuid primary key default gen_random_uuid(),
  gym_id text not null references gyms(id) on delete cascade,
  device_id text not null,
  name text not null,
  belt text not null default 'white',
  style text,
  sprite text,
  build text,
  wins int not null default 0,
  joined_at timestamptz not null default now(),
  unique (gym_id, device_id)
);

create index if not exists gym_members_gym_idx on gym_members(gym_id);

alter table gyms enable row level security;
alter table gym_members enable row level security;

drop policy if exists "gyms public read" on gyms;
create policy "gyms public read" on gyms for select using (true);
drop policy if exists "members public read" on gym_members;
create policy "members public read" on gym_members for select using (true);
-- No insert/update/delete policies: all writes go through Netlify functions
-- using the service role key, which bypasses RLS.

create table if not exists saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  player jsonb,
  opponent jsonb,
  progression jsonb,
  custom_sprite_url text,
  photo_hash text,
  device_updated_at timestamptz
);
alter table saves enable row level security;
drop policy if exists "saves owner all" on saves;
create policy "saves owner all" on saves for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
`;

console.log('creating schema...');
const q = await fetch(`${API}/projects/${REF}/database/query`, {
  method: 'POST', headers, body: JSON.stringify({ query: SQL }),
});
const out = await q.text();
console.log('schema result:', q.status, out.slice(0, 300));

// Verify
const v = await fetch(`${API}/projects/${REF}/database/query`, {
  method: 'POST', headers,
  body: JSON.stringify({ query: "select table_name from information_schema.tables where table_schema='public' order by 1" }),
});
console.log('tables:', await v.text());
