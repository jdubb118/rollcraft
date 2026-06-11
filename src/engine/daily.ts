/**
 * The daily layer — everything that makes tomorrow worth coming back for.
 *
 * - FRESH LEGS: first 3 wins each day earn 2× XP (+50% money). Never blocks
 *   play; it front-loads reward into the return moment (rested-XP pattern).
 * - DAILY ROLL: one seeded opponent per day — same build for every player on
 *   Earth. One attempt. Win to keep the streak alive.
 * - COACH'S PROMISE: once a day, your coach has something for you.
 */
import type { Belt, Grappler } from './types';
import { ARCHETYPES, ARCHETYPE_FRAMES, getArchetypeMoves } from '../data/archetypes';

const FRESH_KEY = 'rollcraft-fresh-legs';        // { date, wins }
const DAILY_KEY = 'rollcraft-daily-roll';        // { date, attempted, won, streak, lastWinDate }
const COACH_KEY = 'rollcraft-coach-gift';        // last claimed date

export const FRESH_LEGS_WINS = 3;
export const FRESH_LEGS_XP_MULT = 2;

function todayStr(): string {
  // LOCAL calendar day, not UTC — toISOString rolls the day over at 7-8pm for
  // American players, which would double-grant gifts and break streaks.
  // en-CA gives YYYY-MM-DD directly.
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

// ── Seeded PRNG (mulberry32) — same date, same opponent, everywhere ──
function hashStr(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Fresh Legs ──

function loadFresh(): { date: string; wins: number } {
  try {
    const raw = JSON.parse(localStorage.getItem(FRESH_KEY) || 'null');
    if (raw && raw.date === todayStr()) return raw;
  } catch { /* fresh */ }
  return { date: todayStr(), wins: 0 };
}

/** How many 2×XP wins remain today. */
export function getFreshLegsRemaining(): number {
  return Math.max(0, FRESH_LEGS_WINS - loadFresh().wins);
}

/** Call on a win. Returns true if this win was a Fresh Legs (2×) win. */
export function consumeFreshLegsWin(): boolean {
  const state = loadFresh();
  const wasFresh = state.wins < FRESH_LEGS_WINS;
  state.wins++;
  localStorage.setItem(FRESH_KEY, JSON.stringify(state));
  return wasFresh;
}

// ── Daily Roll ──

export interface DailyRollState {
  date: string;
  attempted: boolean;
  won: boolean;
  streak: number;
  lastWinDate: string | null;
}

export function getDailyRollState(): DailyRollState {
  const today = todayStr();
  let s: DailyRollState;
  try {
    s = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null') || { date: today, attempted: false, won: false, streak: 0, lastWinDate: null };
  } catch {
    s = { date: today, attempted: false, won: false, streak: 0, lastWinDate: null };
  }
  if (s.date !== today) {
    // New day — streak survives only if yesterday was won
    const yesterday = new Intl.DateTimeFormat('en-CA').format(new Date(Date.now() - 86400000));
    if (s.lastWinDate !== yesterday && s.lastWinDate !== today) s.streak = 0;
    s.date = today;
    s.attempted = false;
    s.won = false;
    localStorage.setItem(DAILY_KEY, JSON.stringify(s));
  }
  return s;
}

const DAILY_NAMES = [
  'The Visitor', 'Mat Enforcer', 'The Sandbagger', 'Comp Team Killer',
  'The Old Timer', 'Tournament Ghost', 'The Blue Belt Blues', 'Open Mat Menace',
  'The Smasher', 'Berimbolo Bandit', 'The Gas Tank', 'Knee On Soul',
];

/** Build today's seeded opponent — identical for every player at this belt. */
export function buildDailyOpponent(playerBelt: Belt): Grappler {
  const date = todayStr();
  const rand = mulberry32(hashStr(`gq-daily-${date}`));
  const arch = ARCHETYPES[Math.floor(rand() * ARCHETYPES.length)];
  const name = DAILY_NAMES[Math.floor(rand() * DAILY_NAMES.length)];

  const iv = () => 6 + Math.floor(rand() * 8); // 6-13: solid, fair
  const EV_BUDGET: Record<Belt, number> = { white: 80, blue: 140, purple: 220, brown: 320, black: 420 };
  const evs = { str: 0, tec: 0, tgh: 0, flx: 0, spd: 0, end: 0 };
  const keys = Object.keys(evs) as (keyof typeof evs)[];
  const sorted = [...keys].sort((a, b) => (arch.baseStats as any)[b] - (arch.baseStats as any)[a]);
  let remaining = EV_BUDGET[playerBelt];
  for (let i = 0; i < sorted.length && remaining > 0; i++) {
    const alloc = Math.min(remaining, Math.floor(EV_BUDGET[playerBelt] * (i === 0 ? 0.35 : i === 1 ? 0.25 : 0.1)));
    evs[sorted[i]] = Math.min(252, alloc);
    remaining -= alloc;
  }

  const BELT_XP: Record<Belt, number> = { white: 700, blue: 2800, purple: 7500, brown: 16000, black: 30000 };

  return {
    id: `daily-${date}`,
    name,
    style: arch.style,
    belt: playerBelt,
    xp: BELT_XP[playerBelt],
    baseStats: { ...arch.baseStats },
    ivs: { str: iv(), tec: iv(), tgh: iv(), flx: iv(), spd: iv(), end: iv() },
    evs,
    moves: getArchetypeMoves(arch.id, playerBelt),
    learnedMoves: getArchetypeMoves(arch.id, playerBelt),
    moveXp: {},
    frame: ARCHETYPE_FRAMES[arch.id] || 'medium',
  };
}

export function markDailyAttempted(): void {
  const s = getDailyRollState();
  s.attempted = true;
  localStorage.setItem(DAILY_KEY, JSON.stringify(s));
}

/**
 * Record the daily result for the day the roll was STARTED (`forDate`, parsed
 * from the daily-<date> opponent id). A match that crosses midnight settles
 * against its own day instead of consuming/resetting the new one.
 */
export function recordDailyResult(won: boolean, forDate?: string): number {
  const s = getDailyRollState();
  if (forDate && forDate !== s.date) {
    // The day rolled over mid-match. Credit a win to the streak (it was that
    // day's challenge, fought and won); a loss just expires with its day.
    if (won) {
      s.streak = s.streak + 1;
      s.lastWinDate = forDate;
      localStorage.setItem(DAILY_KEY, JSON.stringify(s));
    }
    return s.streak;
  }
  s.attempted = true;
  s.won = won;
  if (won) {
    s.streak = s.streak + 1;
    s.lastWinDate = s.date;
  } else {
    s.streak = 0;
  }
  localStorage.setItem(DAILY_KEY, JSON.stringify(s));
  return s.streak;
}

// ── Coach's promise ──

const COACH_GIFTS: { line: string; money: number }[] = [
  { line: "Good, you came back. Consistency beats talent. Here — comp fund.", money: 60 },
  { line: "I watched your last rounds. You're improving. Don't let it slow down.", money: 50 },
  { line: "Mat fees are covered today. Just train.", money: 70 },
  { line: "A scout asked about you yesterday. Keep showing up.", money: 80 },
  { line: "Drilling beats dreaming. Glad you're here.", money: 50 },
  { line: "You know what separates belts? Days like this. Showing up.", money: 60 },
];

/** Once per day (not on a player's very first day): the coach has something for you. */
export function getCoachGift(): { line: string; money: number } | null {
  const today = todayStr();
  if (localStorage.getItem(COACH_KEY) === today) return null;
  const firstSeen = localStorage.getItem('rollcraft-first-seen');
  if (!firstSeen || firstSeen === today) return null; // not on day 0
  const rand = mulberry32(hashStr(`gq-coach-${today}`));
  return COACH_GIFTS[Math.floor(rand() * COACH_GIFTS.length)];
}

export function claimCoachGift(): void {
  localStorage.setItem(COACH_KEY, todayStr());
}
