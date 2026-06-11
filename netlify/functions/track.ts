/**
 * Netlify Function: /api/track
 * First-party analytics sink. Increments daily event counters and the
 * gym-leaderboard win counters in Netlify Blobs.
 *
 * Counters are read-modify-write and therefore lossy under heavy concurrent
 * load — that's an accepted trade for zero-infra funnel analytics. We need
 * direction and magnitude, not bookkeeping precision.
 */
import { getStore } from '@netlify/blobs';

// Whitelisted event prefixes — anything else is dropped.
const ALLOWED_PREFIXES = [
  'session-start', 'new-player', 'return',
  'create-started', 'create-completed',
  'battle-result', 'tutorial-seen',
  'promotion', 'share-clicked', 'sprite-gen',
  'challenge-created', 'challenge-accepted',
  'gym-win', 'daily-roll', 'caught-learn',
];

function sanitizeGym(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const gym = raw.trim().slice(0, 24).replace(/[<>{}\\\n\r\t]/g, '');
  return gym.length >= 2 ? gym : null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('POST only', { status: 405 });
  }

  let body: { e?: unknown; g?: unknown };
  try {
    const text = await req.text();
    if (text.length > 500) return new Response('too large', { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new Response('bad json', { status: 400 });
  }

  const event = typeof body.e === 'string' ? body.e.slice(0, 48) : '';
  const allowed = ALLOWED_PREFIXES.some(p => event === p || event.startsWith(`${p}:`));
  if (!allowed) return new Response(null, { status: 204 }); // drop silently

  try {
    const store = getStore('analytics');
    const day = new Date().toISOString().slice(0, 10);
    const key = `events/${day}`;
    const counts = ((await store.get(key, { type: 'json' })) ?? {}) as Record<string, number>;
    counts[event] = (counts[event] || 0) + 1;
    await store.setJSON(key, counts);

    // Gym leaderboard
    if (event === 'gym-win') {
      const gym = sanitizeGym(body.g);
      if (gym) {
        const slug = gym.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (slug) {
          const gyms = getStore('gyms');
          const entry = ((await gyms.get(slug, { type: 'json' })) ?? { name: gym, wins: 0 }) as { name: string; wins: number };
          entry.wins = (entry.wins || 0) + 1;
          entry.name = entry.name || gym;
          await gyms.setJSON(slug, entry);
        }
      }
    }
  } catch (err) {
    console.warn('[track] blob write failed:', (err as Error).message);
  }

  return new Response(null, { status: 204 });
}

export const config = { path: '/api/track' };
