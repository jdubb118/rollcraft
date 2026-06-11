#!/usr/bin/env node
// Tournament e2e: register → fight through the bracket → podium → prize money.
// Run from workspace root: node rollcraft/tools/tournament-e2e.mjs http://localhost:4173
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.argv[2] || 'http://localhost:4173';
mkdirSync('/tmp/gq-tourney', { recursive: true });

// Overpowered blue belt so the bracket run is deterministic-ish
const player = {
  id: 't-player', name: 'Testy', style: 'wrestler', belt: 'blue', xp: 4900,
  baseStats: { hp: 95, str: 110, tec: 90, tgh: 100, flx: 70, spd: 90, end: 95 },
  ivs: { str: 15, tec: 15, tgh: 15, flx: 15, spd: 15, end: 15 },
  evs: { str: 252, tec: 100, tgh: 50, flx: 0, spd: 60, end: 48 },
  moves: ['double-leg', 'single-leg', 'high-crotch', 'americana', 'arm-triangle', 'knee-cut', 'front-headlock'],
  learnedMoves: ['double-leg'], moveXp: { 'double-leg': 300, 'americana': 300 }, frame: 'heavy',
  giColor: '#2563eb', gymName: 'Tourney Gym', coachName: 'Coach Bot',
};
const progression = {
  stamps: ['scramble'], tournamentResults: [], money: 1000, sponsorships: [], specialization: null,
  currentRegionId: 'scramble-valley', storyFlags: {}, npcDefeated: { a: true, b: true }, npcScouted: {},
  trainingSessions: 0, inventory: {}, totalWins: 9, totalLosses: 1,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
const fail = async (msg) => {
  await page.screenshot({ path: '/tmp/gq-tourney/FAIL.png' });
  console.error('FAIL:', msg);
  await browser.close();
  process.exit(1);
};

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(([p, prog]) => {
  localStorage.setItem('rollcraft-player', JSON.stringify(p));
  localStorage.setItem('rollcraft-progression', JSON.stringify(prog));
  localStorage.setItem('rollcraft-battle-tutorial-seen', 'true');
}, [player, progression]);

await page.goto(`${BASE}/#/tournament?id=scramble-open`, { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

await page.getByRole('button', { name: /REGISTER/ }).click({ force: true });
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/gq-tourney/bracket-r1.png' });

// Bracket loop: FIGHT → battle bot → CONTINUE → (results auto-routes back) → repeat
for (let round = 0; round < 4; round++) {
  const fight = page.getByRole('button', { name: /^FIGHT — / });
  const podium = await page.getByText(/CHAMPION!|SILVER MEDAL|BRONZE MEDAL|ELIMINATED/).first().isVisible().catch(() => false);
  if (podium) break;
  if (!(await fight.isVisible().catch(() => false))) await fail(`no FIGHT button in round ${round}`);
  await fight.click({ force: true });
  await page.waitForTimeout(2000);

  // battle bot
  let over = false;
  for (let turn = 0; turn < 30; turn++) {
    const res = await page.getByText(/YOU WIN!|YOU LOSE!|DRAW/).first().isVisible().catch(() => false);
    if (res) { over = true; break; }
    const buttons = page.locator('button:enabled');
    const n = await buttons.count();
    let pick = -1, stall = -1;
    for (let b = 0; b < n; b++) {
      const t = (await buttons.nth(b).innerText().catch(() => '')) || '';
      if (/TAKEDOWN|SUBMISSION|SWEEP|PASS|ESCAPE|TRANSITION/.test(t) && pick === -1) pick = b;
      if (t.includes('STALL') && stall === -1) stall = b;
    }
    if (pick === -1 && stall === -1) await fail(`no move buttons (round ${round} turn ${turn})`);
    await buttons.nth(pick >= 0 ? pick : stall).click({ force: true });
    await page.waitForTimeout(1700);
  }
  if (!over) await fail(`battle never ended (round ${round})`);
  await page.getByRole('button', { name: 'CONTINUE' }).click({ force: true });
  await page.waitForTimeout(1200);
  // results screen → BACK TO GYM routes back into the tournament
  await page.getByRole('button', { name: 'BACK TO GYM' }).click({ force: true });
  await page.waitForTimeout(1500);
}

await page.screenshot({ path: '/tmp/gq-tourney/podium.png' });
const placement = await page.getByText(/CHAMPION!|SILVER MEDAL|BRONZE MEDAL|ELIMINATED/).first().textContent().catch(() => null);
if (!placement) await fail('never reached the podium');
console.log('placement:', placement.trim());

const moneyBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('rollcraft-progression')).money);
await page.getByRole('button', { name: /CLAIM YOUR PRIZE|BACK TO GYM/ }).click({ force: true });
await page.waitForTimeout(1200);
const prog2 = await page.evaluate(() => JSON.parse(localStorage.getItem('rollcraft-progression')));
console.log(`money: ${moneyBefore} -> ${prog2.money}; tournamentResults:`, JSON.stringify(prog2.tournamentResults));
if (!prog2.tournamentResults.length) await fail('tournament result not recorded');

console.log('TOURNAMENT E2E: PASS');
await browser.close();
