/**
 * Lightweight first-party analytics.
 * Events POST to /api/track (Netlify function → Netlify Blobs counters).
 * Fire-and-forget: failures are silently ignored, gameplay never blocks on this.
 * No PII — event names, optional small props, and the player's gym name for
 * the gym leaderboard. That's it.
 */

const FIRST_SEEN_KEY = 'rollcraft-first-seen';
const LAST_DAY_KEY = 'rollcraft-last-session-day';

let _sessionTracked = false;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function post(payload: Record<string, unknown>): void {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon('/api/track', blob)) return;
    }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never let analytics break the game
  }
}

/** Track an event. Optional variant becomes a sub-counter (e.g. battle-result:win). */
export function track(event: string, variant?: string): void {
  post({ e: variant ? `${event}:${variant}` : event });
}

/** Track a win for the gym leaderboard. */
export function trackGymWin(gymName: string | undefined): void {
  const gym = (gymName || '').trim().slice(0, 24);
  if (!gym) return;
  post({ e: 'gym-win', g: gym });
}

/**
 * Once per page load: session-start, plus a return-day bucket so we can
 * read D1/D7 retention straight off the counters.
 */
export function trackSession(): void {
  if (_sessionTracked) return;
  _sessionTracked = true;

  const today = todayStr();
  let firstSeen = localStorage.getItem(FIRST_SEEN_KEY);
  if (!firstSeen) {
    firstSeen = today;
    localStorage.setItem(FIRST_SEEN_KEY, today);
    track('new-player');
  }

  track('session-start');

  // One return event per calendar day, bucketed by days-since-first-seen
  const lastDay = localStorage.getItem(LAST_DAY_KEY);
  if (lastDay !== today) {
    localStorage.setItem(LAST_DAY_KEY, today);
    const days = Math.round(
      (new Date(today).getTime() - new Date(firstSeen).getTime()) / 86400000
    );
    const bucket = days === 0 ? 'd0' : days === 1 ? 'd1' : days <= 7 ? 'd7' : days <= 30 ? 'd30' : 'd30plus';
    track('return', bucket);
  }
}
