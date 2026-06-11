#!/usr/bin/env node
// Retention-layer e2e: coach gift claim, Daily Roll full flow (fight → streak),
// Fresh Legs badge, learn-by-getting-caught offer + learn.
// Run from workspace root: node rollcraft/tools/retention-e2e.mjs http://localhost:4173
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.argv[2] || 'http://localhost:4173';
const SHOTS = '/tmp/gq-retention';
mkdirSync(SHOTS, { recursive: true });

const player = {
  id: 'ret-player', name: 'Testy', style: 'wrestler', belt: 'blue', xp: 2500,
  baseStats: { hp: 80, str: 95, tec: 70, tgh: 85, flx: 55, spd: 75, end: 80 },
  ivs: { str: 14, tec: 14, tgh: 14, flx: 14, spd: 14, end: 14 },
  evs: { str: 200, tec: 100, tgh: 50, flx: 0, spd: 100, end: 60 },
  moves: ['double-leg', 'single-leg', 'high-crotch', 'americana', 'arm-triangle', 'knee-cut', 'front-headlock'],
  learnedMoves: ['double-leg'], moveXp: { 'double-leg': 200 }, frame: 'heavy',
  giColor: '#2563eb', gymName: 'Retention Gym', coachName: 'Coach Bot',
};
const progression = {
  stamps: [], tournamentResults: [], money: 500, sponsorships: [], specialization: null,
  currentRegionId: 'home', storyFlags: {}, npcDefeated: { a: true, b: true }, npcScouted: {},
  trainingSessions: 0, inventory: {}, totalWins: 5, totalLosses: 2,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
let step = 0;
const shot = (n) => page.screenshot({ path: `${SHOTS}/${String(++step).padStart(2, '0')}-${n}.png` });
const fail = async (msg) => { await shot('FAIL'); console.error('FAIL:', msg); await browser.close(); process.exit(1); };

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(([p, prog]) => {
  localStorage.setItem('rollcraft-player', JSON.stringify(p));
  localStorage.setItem('rollcraft-progression', JSON.stringify(prog));
  localStorage.setItem('rollcraft-battle-tutorial-seen', 'true');
  // first-seen yesterday so the coach gift triggers
  const y = new Intl.DateTimeFormat('en-CA').format(new Date(Date.now() - 86400000));
  localStorage.setItem('rollcraft-first-seen', y);
}, [player, progression]);
await page.goto(`${BASE}/#/overworld`, { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// ── 1. Coach gift: visible → claim → money increases, banner gone ──
const gift = page.getByText(/TAP TO ACCEPT/);
if (!(await gift.isVisible().catch(() => false))) await fail('coach gift not visible');
const moneyBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('rollcraft-progression')).money);
await gift.click({ force: true });
await page.waitForTimeout(500);
const moneyAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('rollcraft-progression')).money);
if (moneyAfter <= moneyBefore) await fail(`coach gift money: ${moneyBefore} -> ${moneyAfter}`);
if (await gift.isVisible().catch(() => false)) await fail('coach gift still visible after claim');
console.log(`✓ coach gift claimed (+$${moneyAfter - moneyBefore})`);

// ── 2. Daily Roll: button → fight to the end → streak/reset on results ──
const daily = page.getByText(/DAILY ROLL.*TAP TO FIGHT/s);
if (!(await daily.isVisible().catch(() => false))) await fail('daily roll button missing');
await daily.click({ force: true });
await page.waitForTimeout(2000);

let over = false, won = false;
for (let turn = 0; turn < 30; turn++) {
  const res = await page.getByText(/YOU WIN!|YOU LOSE!|DRAW/).first().textContent().catch(() => null);
  if (res) { over = true; won = /WIN/.test(res); break; }
  const buttons = page.locator('button:enabled');
  const n = await buttons.count();
  let pick = -1, stall = -1;
  for (let b = 0; b < n; b++) {
    const t = (await buttons.nth(b).innerText().catch(() => '')) || '';
    if (/TAKEDOWN|SUBMISSION|SWEEP|PASS|ESCAPE|TRANSITION/.test(t) && pick === -1) pick = b;
    if (t.includes('STALL') && stall === -1) stall = b;
  }
  if (pick === -1 && stall === -1) await fail(`no buttons turn ${turn}`);
  await buttons.nth(pick >= 0 ? pick : stall).click({ force: true });
  await page.waitForTimeout(1700);
}
if (!over) await fail('daily battle never ended');
await page.getByRole('button', { name: 'CONTINUE' }).click({ force: true });
await page.waitForTimeout(1200);
await shot('daily-result');

const dailyBanner = won ? /DAILY ROLL ✓ — STREAK: 1/ : /STREAK RESET/;
if (!(await page.getByText(dailyBanner).isVisible().catch(() => false))) await fail(`daily banner missing (won=${won})`);
console.log(`✓ daily roll flow (${won ? 'won, streak 1' : 'lost, reset shown'})`);

// Fresh Legs badge on a win
if (won) {
  if (!(await page.getByText('FRESH LEGS 2×').isVisible().catch(() => false))) await fail('fresh legs badge missing on first win');
  console.log('✓ fresh legs 2× badge shown');
}

// daily state persisted + button gone
const ds = await page.evaluate(() => JSON.parse(localStorage.getItem('rollcraft-daily-roll')));
if (!ds.attempted) await fail('daily not marked attempted');
await page.getByRole('button', { name: 'BACK TO GYM' }).click({ force: true });
await page.waitForTimeout(1500);
if (await page.getByText(/DAILY ROLL.*TAP TO FIGHT/s).isVisible().catch(() => false)) await fail('daily button still visible after attempt');
console.log('✓ daily one-attempt lock');

// ── 3. Learn by getting caught: 2nd catch offers the move ──
await page.evaluate(() => {
  localStorage.setItem('rollcraft-caught-by', JSON.stringify({ 'armbar-mount': 1 }));
  localStorage.setItem('rollcraft-result', JSON.stringify({
    ts: Date.now(), winner: 'opponent', method: 'submission', xpGained: 30, turns: 6,
    playerName: 'Testy', opponentName: 'Grinder', opponentId: 'random-x', opponentStyle: 'pressure-passer',
    finishingMoveId: 'armbar-mount', moveUsage: {},
  }));
});
await page.goto(`${BASE}/#/results`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await shot('caught-offer');
const learnBtn = page.getByRole('button', { name: /LEARN ARMBAR FROM MOUNT/ });
if (!(await learnBtn.isVisible().catch(() => false))) await fail('learn-by-caught offer missing');
await learnBtn.click({ force: true });
await page.waitForTimeout(600);
if (!(await page.getByText(/pain is a teacher/).isVisible().catch(() => false))) await fail('learned confirmation missing');
const learned = await page.evaluate(() => JSON.parse(localStorage.getItem('rollcraft-player')).learnedMoves);
if (!learned.includes('armbar-mount')) await fail('armbar-mount not in learnedMoves');
console.log('✓ learn-by-getting-caught (offer → learned → persisted)');

console.log('RETENTION E2E: ALL PASS');
await browser.close();
