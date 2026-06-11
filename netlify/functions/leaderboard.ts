/**
 * Netlify Function: /api/leaderboard
 * Top gyms by wins — powers the in-game TOP GYMS board.
 */
import { getStore } from '@netlify/blobs';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') return new Response('GET only', { status: 405 });

  try {
    const gyms = getStore('gyms');
    const { blobs } = await gyms.list();

    const entries: { name: string; wins: number }[] = [];
    // Cap reads — leaderboard only needs the realistic population
    for (const b of blobs.slice(0, 500)) {
      const entry = (await gyms.get(b.key, { type: 'json' })) as { name: string; wins: number } | null;
      if (entry && entry.name && entry.wins > 0) entries.push({ name: entry.name, wins: entry.wins });
    }

    entries.sort((a, b) => b.wins - a.wins);

    return new Response(JSON.stringify({ gyms: entries.slice(0, 25) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message, gyms: [] }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config = { path: '/api/leaderboard' };
