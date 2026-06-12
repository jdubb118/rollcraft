/**
 * Netlify Function: /api/create-character — the identity pipeline.
 * Photo in → full game character out: PixelLab create-character-pro
 * (concept mode) generates 8 directional rotations of a stylized fighter
 * in the player's gi color. ~20 generations per character.
 *
 * POST {photo: b64 png ≤512², giColor: 'white'|'blue'|'black', deviceId}
 *   → { jobId, characterId }            (kicks off async generation)
 * GET ?job=<jobId>&character=<characterId>
 *   → { status: 'processing' } | { status: 'failed', error }
 *   | { status: 'completed', rotations: { south, north, east, west } } (b64 pngs)
 */
import { getStore } from '@netlify/blobs';

const MONTHLY_GEN_CAP = 800;            // shared with create-sprite
const GENS_PER_CHARACTER = 20;
const DEVICE_CHARACTER_CAP = 3;

const GI_DESCRIPTIONS: Record<string, string> = {
  white: 'crisp white gi with a white belt',
  blue: 'blue gi with a white belt',
  black: 'black gi with a white belt',
};

// NOTE: deviceId is client-supplied and the counters are read-modify-write —
// the per-device cap is best-effort, not a security boundary. The MONTHLY cap
// is the real backstop on spend. Proper fix when worth it: bind quota to the
// (now anonymous-first) Supabase user id via a verified JWT.
async function checkBudget(deviceId: string): Promise<string | null> {
  try {
    const store = getStore('sprite-gens');
    const monthKey = new Date().toISOString().slice(0, 7);
    const count = ((await store.get(monthKey, { type: 'json' })) ?? 0) as number;
    if (count + GENS_PER_CHARACTER > MONTHLY_GEN_CAP) {
      return 'Character forge is at capacity this month — try again soon!';
    }
    const devKey = `device-chars/${deviceId}`;
    const devCount = ((await store.get(devKey, { type: 'json' })) ?? 0) as number;
    if (devCount >= DEVICE_CHARACTER_CAP) {
      return `You've forged ${DEVICE_CHARACTER_CAP} fighters on this device — that's the limit.`;
    }
    await store.setJSON(monthKey, count + GENS_PER_CHARACTER);
    await store.setJSON(devKey, devCount + 1);
    return null;
  } catch {
    return null; // fail open — broken counter shouldn't kill the feature
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async function handler(req: Request): Promise<Response> {
  const KEY = process.env.PIXELLAB_SECRET;
  if (!KEY) return json({ error: 'not configured' }, 500);
  const plHeaders = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

  // ── Poll an in-flight generation ──
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('job');
    const characterId = url.searchParams.get('character');
    if (!jobId || !characterId) return json({ error: 'missing job/character' }, 400);

    const jr = await fetch(`https://api.pixellab.ai/v2/background-jobs/${jobId}`, { headers: plHeaders });
    const job = await jr.json();
    if (job.status === 'failed') return json({ status: 'failed', error: 'Generation failed — try another photo' }, 200);
    if (job.status !== 'completed') return json({ status: 'processing' }, 200);

    // Completed → fetch the labeled rotations from the persisted character
    const cr = await fetch(`https://api.pixellab.ai/v2/characters/${characterId}`, { headers: plHeaders });
    const character = await cr.json();
    const urls = character.rotation_urls || {};
    const rotations: Record<string, string> = {};
    for (const dir of ['south', 'north', 'east', 'west']) {
      if (!urls[dir]) return json({ status: 'failed', error: 'rotations missing' }, 200);
      const ir = await fetch(urls[dir]);
      const buf = Buffer.from(await ir.arrayBuffer());
      rotations[dir] = buf.toString('base64');
    }
    return json({ status: 'completed', rotations }, 200);
  }

  if (req.method !== 'POST') return json({ error: 'POST/GET only' }, 405);

  let body: { photo?: string; giColor?: string; deviceId?: string };
  try {
    const text = await req.text();
    if (text.length > 1_200_000) return json({ error: 'photo too large' }, 413);
    body = JSON.parse(text);
  } catch { return json({ error: 'bad json' }, 400); }

  if (!body.photo || body.photo.length < 1000) return json({ error: 'missing photo' }, 400);
  const deviceId = (body.deviceId || '').slice(0, 64);
  if (deviceId.length < 8) return json({ error: 'bad device' }, 400);

  const budgetError = await checkBudget(deviceId);
  if (budgetError) return json({ error: budgetError }, 429);

  const gi = GI_DESCRIPTIONS[body.giColor || 'white'] || GI_DESCRIPTIONS.white;
  const r = await fetch('https://api.pixellab.ai/v2/create-character-pro', {
    method: 'POST', headers: plHeaders,
    body: JSON.stringify({
      description: `adult BJJ fighter wearing a ${gi}, athletic build, game character`,
      method: 'create_from_concept',
      concept_image: { type: 'base64', base64: body.photo, format: 'png' },
      image_size: { width: 32, height: 32 },
      view: 'low top-down',
      template_id: 'mannequin',
      no_background: true,
    }),
  });
  const data = await r.json();
  if (!data.background_job_id || !data.character_id) {
    return json({ error: 'Could not start generation', detail: data }, 500);
  }
  return json({ jobId: data.background_job_id, characterId: data.character_id }, 200);
}

export const config = { path: '/api/create-character' };
