/**
 * Netlify Function: /api/gym — the Identity Engine backend.
 * All WRITES go through here with the service-role key (RLS blocks client
 * writes); reads are served here too so visitors need zero Supabase config.
 *
 * POST {action:'create', name, palette?, deviceId, founderName?}
 * POST {action:'join', gymId, deviceId, name, belt, style?, sprite?, build?}
 * POST {action:'win', gymId, deviceId}
 * POST {action:'sync', gymId, deviceId, belt?, sprite?, build?, name?}
 * GET  ?id=<slug>           → { gym, members }
 * GET  ?list=1              → { gyms: top 25 by wins }
 */
import { createClient } from '@supabase/supabase-js';

const BELTS = ['white', 'blue', 'purple', 'brown', 'black'];

function sb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

const cleanStr = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/[<>{}\\\n\r\t]/g, '').trim().slice(0, max) : '';

export default async function handler(req: Request): Promise<Response> {
  const db = sb();
  if (!db) return json({ error: 'not configured' }, 500);

  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (url.searchParams.get('list')) {
      const { data, error } = await db.from('gyms')
        .select('id,name,wins,member_count,palette')
        .order('wins', { ascending: false }).limit(25);
      if (error) return json({ error: error.message }, 500);
      return json({ gyms: data }, 200);
    }
    const id = slugify(url.searchParams.get('id') || '');
    if (!id) return json({ error: 'missing id' }, 400);
    const { data: gym, error } = await db.from('gyms').select('*').eq('id', id).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!gym) return json({ error: 'gym not found' }, 404);
    const { data: members } = await db.from('gym_members')
      .select('name,belt,style,sprite,build,wins,joined_at,device_id')
      .eq('gym_id', id).order('joined_at', { ascending: true }).limit(60);
    // device_id is needed client-side only to recognize "that's me" — hash it
    const safeMembers = (members || []).map(m => ({
      ...m,
      device_id: undefined,
      member_key: m.device_id?.slice(0, 8),
    }));
    return json({ gym, members: safeMembers }, 200);
  }

  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > 40_000) return json({ error: 'too large' }, 413); // sprite base64 fits well under this
    body = JSON.parse(text);
  } catch { return json({ error: 'bad json' }, 400); }

  const action = body.action;
  const deviceId = cleanStr(body.deviceId, 64);
  if (!deviceId || deviceId.length < 8) return json({ error: 'bad device' }, 400);

  if (action === 'create') {
    const name = cleanStr(body.name, 28);
    if (name.length < 3) return json({ error: 'Gym name must be at least 3 characters' }, 400);
    const id = slugify(name);
    if (id.length < 3) return json({ error: 'Gym name needs more letters' }, 400);
    const palette = typeof body.palette === 'object' && body.palette ? body.palette : null;

    const { data: existing } = await db.from('gyms').select('id').eq('id', id).maybeSingle();
    if (existing) return json({ error: 'That gym name is taken' }, 409);

    const { data: gym, error } = await db.from('gyms')
      .insert({ id, name, founder_device: deviceId, palette })
      .select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ gym }, 200);
  }

  if (action === 'join' || action === 'sync') {
    const gymId = slugify(cleanStr(body.gymId, 40));
    const { data: gym } = await db.from('gyms').select('id,name,member_count').eq('id', gymId).maybeSingle();
    if (!gym) return json({ error: 'gym not found' }, 404);

    const belt = BELTS.includes(body.belt as string) ? (body.belt as string) : 'white';
    const sprite = typeof body.sprite === 'string' && body.sprite.length <= 24_000 ? body.sprite : null;
    const build = typeof body.build === 'string' && body.build.length <= 4_000 ? body.build : null;
    const name = cleanStr(body.name, 12) || 'Fighter';
    const style = cleanStr(body.style, 20) || null;

    if (action === 'join') {
      const { data: member, error } = await db.from('gym_members')
        .upsert(
          { gym_id: gymId, device_id: deviceId, name, belt, style, sprite, build },
          { onConflict: 'gym_id,device_id' },
        ).select().single();
      if (error) return json({ error: error.message }, 500);
      const { count } = await db.from('gym_members').select('*', { count: 'exact', head: true }).eq('gym_id', gymId);
      await db.from('gyms').update({ member_count: count ?? gym.member_count }).eq('id', gymId);
      return json({ gym, member: { ...member, device_id: undefined, member_key: deviceId.slice(0, 8) } }, 200);
    }

    // sync — update an existing membership (promotion, new sprite, new build)
    const patch: Record<string, unknown> = {};
    if (body.belt) patch.belt = belt;
    if (sprite) patch.sprite = sprite;
    if (build) patch.build = build;
    if (body.name) patch.name = name;
    if (Object.keys(patch).length === 0) return json({ ok: true }, 200);
    const { error } = await db.from('gym_members').update(patch)
      .eq('gym_id', gymId).eq('device_id', deviceId);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true }, 200);
  }

  if (action === 'win') {
    const gymId = slugify(cleanStr(body.gymId, 40));
    // Two RPC-less increments; lossy under heavy concurrency like the Blobs
    // counters — fine for a leaderboard.
    const { data: member } = await db.from('gym_members').select('id,wins')
      .eq('gym_id', gymId).eq('device_id', deviceId).maybeSingle();
    if (!member) return json({ error: 'not a member' }, 404);
    await db.from('gym_members').update({ wins: member.wins + 1 }).eq('id', member.id);
    const { data: gym } = await db.from('gyms').select('wins').eq('id', gymId).maybeSingle();
    if (gym) await db.from('gyms').update({ wins: gym.wins + 1 }).eq('id', gymId);
    return json({ ok: true }, 200);
  }

  return json({ error: 'unknown action' }, 400);
}

export const config = { path: '/api/gym' };
