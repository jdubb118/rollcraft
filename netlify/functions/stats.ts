/**
 * Netlify Function: /api/stats
 * Read-only aggregate of the analytics counters — last 30 days of daily
 * event counts plus totals. Counts only, no PII, so it's safe to leave open.
 */
import { getStore } from '@netlify/blobs';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') return new Response('GET only', { status: 405 });

  try {
    const store = getStore('analytics');
    const { blobs } = await store.list({ prefix: 'events/' });

    // Last 30 day-keys, newest first
    const keys = blobs
      .map(b => b.key)
      .sort()
      .reverse()
      .slice(0, 30);

    const days: Record<string, Record<string, number>> = {};
    const totals: Record<string, number> = {};

    for (const key of keys) {
      const counts = ((await store.get(key, { type: 'json' })) ?? {}) as Record<string, number>;
      days[key.replace('events/', '')] = counts;
      for (const [event, n] of Object.entries(counts)) {
        totals[event] = (totals[event] || 0) + n;
      }
    }

    return new Response(JSON.stringify({ totals, days }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config = { path: '/api/stats' };
