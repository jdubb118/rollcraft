/**
 * Challenge links — serialize a fighter build into a URL so a friend can
 * battle it (AI-driven) with zero backend. The decode side clamps and
 * validates everything: a challenge link is untrusted input.
 *
 * URL shape: https://grapplequest.com/?challenge=<base64url>#/
 * (query param sits BEFORE the hash — the app uses HashRouter)
 */
import type { Belt, Frame, Grappler, Style } from './types';
import { BELT_MOVE_SLOTS, BELT_XP_THRESHOLDS } from './types';
import { getMove } from '../data/moves';

const PENDING_KEY = 'rollcraft-pending-challenge';

const STYLES: Style[] = ['wrestler', 'judoka', 'guard-player', 'pressure-passer', 'leg-locker', 'berimbolo', 'sub-hunter', 'controller'];
const BELTS: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];
const FRAMES: Frame[] = ['light', 'medium', 'heavy'];

interface ChallengePayload {
  v: 1;
  n: string;          // name
  g?: string;         // gym
  s: Style;
  b: Belt;
  f: Frame;
  x: number;          // xp
  bs: number[];       // base stats [hp,str,tec,tgh,flx,spd,end]
  iv: number[];       // ivs [str,tec,tgh,flx,spd,end]
  ev: number[];       // evs [str,tec,tgh,flx,spd,end]
  m: string[];        // equipped move ids
  w?: number;         // record wins
  l?: number;         // record losses
}

function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b64)));
}

const clamp = (n: unknown, lo: number, hi: number): number => {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : lo;
  return Math.max(lo, Math.min(hi, v));
};

export function createChallengeUrl(player: Grappler, record: { wins: number; losses: number }): string {
  const payload: ChallengePayload = {
    v: 1,
    n: player.name.slice(0, 12),
    g: player.gymName?.slice(0, 20),
    s: player.style,
    b: player.belt,
    f: player.frame || 'medium',
    x: Math.round(player.xp),
    bs: [player.baseStats.hp, player.baseStats.str, player.baseStats.tec, player.baseStats.tgh, player.baseStats.flx, player.baseStats.spd, player.baseStats.end],
    iv: [player.ivs.str, player.ivs.tec, player.ivs.tgh, player.ivs.flx, player.ivs.spd, player.ivs.end],
    ev: [player.evs.str, player.evs.tec, player.evs.tgh, player.evs.flx, player.evs.spd, player.evs.end],
    m: player.moves.slice(0, BELT_MOVE_SLOTS[player.belt]),
    w: record.wins, l: record.losses,
  };
  const encoded = b64urlEncode(JSON.stringify(payload));
  return `${window.location.origin}/?challenge=${encoded}#/`;
}

/** Decode + harden a challenge string into a battle-ready Grappler. Null if invalid. */
export function decodeChallenge(encoded: string): { opponent: Grappler; gym?: string; record?: string } | null {
  let p: ChallengePayload;
  try {
    p = JSON.parse(b64urlDecode(encoded));
  } catch { return null; }
  if (!p || p.v !== 1) return null;

  const style = STYLES.includes(p.s) ? p.s : 'wrestler';
  const belt = BELTS.includes(p.b) ? p.b : 'white';
  const frame = FRAMES.includes(p.f) ? p.f : 'medium';
  const name = (typeof p.n === 'string' ? p.n : 'Challenger').replace(/[^\w\s'-]/g, '').trim().slice(0, 12) || 'Challenger';
  const gym = typeof p.g === 'string' ? p.g.replace(/[^\w\s'-]/g, '').trim().slice(0, 20) : undefined;

  const bs = Array.isArray(p.bs) ? p.bs : [];
  const iv = Array.isArray(p.iv) ? p.iv : [];
  const ev = Array.isArray(p.ev) ? p.ev : [];

  // EVs: clamp per-stat then scale to the 510 total cap
  let evs = {
    str: clamp(ev[0], 0, 252), tec: clamp(ev[1], 0, 252), tgh: clamp(ev[2], 0, 252),
    flx: clamp(ev[3], 0, 252), spd: clamp(ev[4], 0, 252), end: clamp(ev[5], 0, 252),
  };
  const evTotal = Object.values(evs).reduce((a, b) => a + b, 0);
  if (evTotal > 510) {
    const scale = 510 / evTotal;
    evs = Object.fromEntries(Object.entries(evs).map(([k, v]) => [k, Math.floor(v * scale)])) as typeof evs;
  }

  // Moves: only real move ids, capped to belt slots
  const moves = (Array.isArray(p.m) ? p.m : [])
    .filter((id): id is string => typeof id === 'string' && !!getMove(id))
    .slice(0, BELT_MOVE_SLOTS[belt]);
  if (moves.length === 0) return null;

  // XP clamped to the belt's plausible range
  const beltIdx = BELTS.indexOf(belt);
  const xpLo = BELT_XP_THRESHOLDS[belt];
  const xpHi = beltIdx < BELTS.length - 1 ? BELT_XP_THRESHOLDS[BELTS[beltIdx + 1]] : xpLo + 15000;
  const xp = clamp(p.x, xpLo, xpHi);

  const opponent: Grappler = {
    id: `challenge-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name, style, belt, xp,
    baseStats: {
      hp: clamp(bs[0], 40, 120), str: clamp(bs[1], 30, 120), tec: clamp(bs[2], 30, 120),
      tgh: clamp(bs[3], 30, 120), flx: clamp(bs[4], 30, 120), spd: clamp(bs[5], 30, 120),
      end: clamp(bs[6], 30, 120),
    },
    ivs: {
      str: clamp(iv[0], 0, 15), tec: clamp(iv[1], 0, 15), tgh: clamp(iv[2], 0, 15),
      flx: clamp(iv[3], 0, 15), spd: clamp(iv[4], 0, 15), end: clamp(iv[5], 0, 15),
    },
    evs,
    moves,
    learnedMoves: [...moves],
    moveXp: {},
    frame,
    gymName: gym,
  };

  const record = typeof p.w === 'number' && typeof p.l === 'number'
    ? `${clamp(p.w, 0, 9999)}W-${clamp(p.l, 0, 9999)}L` : undefined;

  return { opponent, gym, record };
}

/** Capture ?challenge= from the URL (before the hash) into localStorage, then clean the URL. */
export function captureChallengeFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('challenge');
    if (c && decodeChallenge(c)) {
      localStorage.setItem(PENDING_KEY, c);
      // Strip the query so refreshes don't re-trigger
      const clean = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', clean);
    }
  } catch { /* ignore */ }
}

export function getPendingChallenge(): { opponent: Grappler; gym?: string; record?: string } | null {
  const c = localStorage.getItem(PENDING_KEY);
  if (!c) return null;
  const decoded = decodeChallenge(c);
  if (!decoded) { localStorage.removeItem(PENDING_KEY); return null; }
  return decoded;
}

export function clearPendingChallenge(): void {
  localStorage.removeItem(PENDING_KEY);
}
