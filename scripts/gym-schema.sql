-- Identity Engine schema (fallback: paste into Supabase dashboard SQL editor)
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
