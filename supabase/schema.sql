-- Grapple Quest — Supabase schema
-- Paste this into: Supabase Dashboard → SQL Editor → New query → Run
-- Idempotent: safe to re-run if you change shape.

-- ─── 1. Profiles (mirrors auth.users; fighter slug + display name) ───
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  slug          text unique not null,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Slug lookup is hot (share URLs)
create index if not exists profiles_slug_idx on public.profiles(slug);

-- ─── 2. Saves (full game state mirror, JSONB) ───
create table if not exists public.saves (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  player               jsonb,
  opponent             jsonb,
  progression          jsonb,
  custom_sprite_url    text,
  custom_gym_url       text,
  belt_sprite_history  jsonb,
  photo_hash           text,
  device_updated_at    timestamptz,
  updated_at           timestamptz not null default now()
);

-- ─── 3. Fighter cards (cached share-card PNG metadata; Phase C) ───
create table if not exists public.fighter_cards (
  slug              text primary key references public.profiles(slug) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  card_png_url      text,
  belt              text,
  total_wins        int,
  total_losses      int,
  last_rendered_at  timestamptz not null default now()
);

-- ─── 4. updated_at auto-touch ───
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists saves_touch on public.saves;
create trigger saves_touch
  before update on public.saves
  for each row execute function public.touch_updated_at();

-- ─── 5. Auto-create profile row when a user signs up ───
-- Slug is generated from name (or 'fighter') + 4-char suffix; uniqueness handled by trigger retry.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_slug text;
  candidate text;
  attempt   int := 0;
begin
  base_slug := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'display_name', 'fighter'), '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'fighter'; end if;

  loop
    candidate := base_slug || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 4);
    begin
      insert into public.profiles (id, slug, display_name)
      values (new.id, candidate, new.raw_user_meta_data->>'display_name');
      exit;
    exception when unique_violation then
      attempt := attempt + 1;
      if attempt > 5 then raise; end if;
    end;
  end loop;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 6. Storage bucket for custom sprites + gym BGs ───
insert into storage.buckets (id, name, public)
values ('grapple-assets', 'grapple-assets', true)
on conflict (id) do nothing;

-- ─── 7. Row-level security ───
alter table public.profiles      enable row level security;
alter table public.saves         enable row level security;
alter table public.fighter_cards enable row level security;

-- Profiles: anyone can read (for share pages); only owner writes.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select using (true);

drop policy if exists profiles_write_self on public.profiles;
create policy profiles_write_self on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Saves: only owner can read or write.
drop policy if exists saves_owner_all on public.saves;
create policy saves_owner_all on public.saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Fighter cards: anyone can read; owner writes.
drop policy if exists cards_read on public.fighter_cards;
create policy cards_read on public.fighter_cards
  for select using (true);

drop policy if exists cards_owner_write on public.fighter_cards;
create policy cards_owner_write on public.fighter_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage: public bucket, but only owner can upload to /<their-uid>/* path.
drop policy if exists assets_read on storage.objects;
create policy assets_read on storage.objects
  for select using (bucket_id = 'grapple-assets');

drop policy if exists assets_owner_write on storage.objects;
create policy assets_owner_write on storage.objects
  for insert with check (
    bucket_id = 'grapple-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists assets_owner_update on storage.objects;
create policy assets_owner_update on storage.objects
  for update using (
    bucket_id = 'grapple-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists assets_owner_delete on storage.objects;
create policy assets_owner_delete on storage.objects
  for delete using (
    bucket_id = 'grapple-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
