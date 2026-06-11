#!/usr/bin/env node
// Full-game screenshot tour: all 9 region overworlds, battles on several
// region backgrounds, world map, dex, stats, tournament, gyms, settings.
// Run from workspace root (playwright lives there).
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.argv[2] || 'http://localhost:4173';
const SHOTS = '/tmp/gq-tour';
mkdirSync(SHOTS, { recursive: true });

const player = {
  id: 'tour-player', name: 'Testy', style: 'wrestler', belt: 'black', xp: 25000,
  baseStats: { hp: 80, str: 90, tec: 60, tgh: 80, flx: 50, spd: 70, end: 75 },
  ivs: { str: 12, tec: 12, tgh: 12, flx: 12, spd: 12, end: 12 },
  evs: { str: 200, tec: 100, tgh: 50, flx: 50, spd: 60, end: 50 },
  moves: ['double-leg', 'single-leg', 'snap-down', 'high-crotch', 'suplex', 'bridge-escape', 'turtle-standup', 'americana', 'arm-triangle', 'knee-cut', 'front-headlock', 'guillotine', 'darce'],
  learnedMoves: ['double-leg', 'single-leg', 'snap-down', 'high-crotch', 'suplex', 'bridge-escape', 'turtle-standup', 'americana', 'arm-triangle', 'knee-cut', 'front-headlock', 'guillotine', 'darce'],
  moveXp: { 'double-leg': 120, 'guillotine': 300, 'knee-cut': 50 }, frame: 'heavy',
  giColor: '#2563eb', gymName: 'Academia BJJ', coachName: 'Coach Jeff',
};
const progression = {
  stamps: ['scramble', 'tradition', 'iron', 'wave', 'combat', 'precision', 'champion'],
  tournamentResults: [
    { tournamentId: 'old-town-classic', placement: 'gold', prizeMoney: 750, timestamp: 1 },
    { tournamentId: 'scramble-open', placement: 'gold', prizeMoney: 300, timestamp: 2 },
  ],
  money: 9000, sponsorships: [], specialization: null, currentRegionId: 'home',
  storyFlags: {}, npcDefeated: { a: true, b: true, c: true }, npcScouted: {},
  trainingSessions: 5, inventory: { 'acai-bowl': 2 }, totalWins: 31, totalLosses: 6,
};
const opponent = {
  id: 'random-tour', name: 'Carlos', style: 'pressure-passer', belt: 'black', xp: 26000,
  baseStats: { hp: 85, str: 90, tec: 65, tgh: 85, flx: 50, spd: 55, end: 80 },
  ivs: { str: 8, tec: 8, tgh: 8, flx: 8, spd: 8, end: 8 },
  evs: { str: 150, tec: 80, tgh: 80, flx: 0, spd: 0, end: 70 },
  moves: ['double-leg', 'smash-pass', 'americana', 'knee-cut'],
  learnedMoves: ['double-leg'], moveXp: {}, frame: 'heavy',
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
const shot = (name) => page.screenshot({ path: `${SHOTS}/${name}.png` });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(([p, prog, o]) => {
  localStorage.setItem('rollcraft-player', JSON.stringify(p));
  localStorage.setItem('rollcraft-progression', JSON.stringify(prog));
  localStorage.setItem('rollcraft-opponent', JSON.stringify(o));
  localStorage.setItem('rollcraft-battle-tutorial-seen', 'true');
  // mark all regions visited so arrival overlays don't block screenshots
  for (const r of ['scramble-valley','old-town','steel-mountain','coral-bay','sambo-district','nova-camp','iron-coast','summit-city']) {
    localStorage.setItem(`rollcraft-visited-${r}`, 'true');
  }
}, [player, progression, opponent]);

// ── Region overworlds ──
const regions = ['home', 'scramble-valley', 'old-town', 'steel-mountain', 'coral-bay', 'sambo-district', 'nova-camp', 'iron-coast', 'summit-city'];
for (const r of regions) {
  await page.evaluate((rid) => {
    const prog = JSON.parse(localStorage.getItem('rollcraft-progression'));
    prog.currentRegionId = rid;
    localStorage.setItem('rollcraft-progression', JSON.stringify(prog));
  }, r);
  await page.goto(`${BASE}/#/overworld`, { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' }); // hash-only goto doesn't remount the SPA
  await page.waitForTimeout(1800);
  await shot(`region-${r}`);
}

// ── Battles on different region backgrounds ──
for (const r of ['old-town', 'nova-camp', 'iron-coast', 'summit-city']) {
  await page.evaluate((rid) => {
    const prog = JSON.parse(localStorage.getItem('rollcraft-progression'));
    prog.currentRegionId = rid;
    localStorage.setItem('rollcraft-progression', JSON.stringify(prog));
  }, r);
  await page.goto(`${BASE}/#/battle`, { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await shot(`battle-${r}`);
  // play 2 turns for mid-fight state
  for (let t = 0; t < 2; t++) {
    const buttons = page.locator('button:enabled');
    const n = await buttons.count();
    for (let b = 0; b < n; b++) {
      const txt = (await buttons.nth(b).innerText().catch(() => '')) || '';
      if (/TAKEDOWN|SUBMISSION|PASS/.test(txt)) { await buttons.nth(b).click({ force: true }); break; }
    }
    await page.waitForTimeout(1700);
  }
  await shot(`battle-${r}-mid`);
}

// ── Menu screens ──
await page.goto(`${BASE}/#/world`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await shot('world-map');
await page.goto(`${BASE}/#/movedex`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await shot('movedex');
await page.goto(`${BASE}/#/stats`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await shot('stats');
await page.getByRole('button', { name: 'MOVES' }).click({ force: true }).catch(() => {});
await page.waitForTimeout(400);
await shot('stats-moves');
await page.goto(`${BASE}/#/gyms`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await shot('gyms');
await page.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await shot('settings');

// ── Tournament: register + bracket ──
await page.goto(`${BASE}/#/tournament?id=iron-grand-prix`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await shot('tournament-registration');
await page.getByRole('button', { name: /REGISTER/ }).click({ force: true }).catch(() => {});
await page.waitForTimeout(800);
await shot('tournament-bracket');

// ── Overworld NPC dialogue: walk to coach (home) ──
await page.evaluate(() => {
  const prog = JSON.parse(localStorage.getItem('rollcraft-progression'));
  prog.currentRegionId = 'home';
  localStorage.setItem('rollcraft-progression', JSON.stringify(prog));
});
await page.goto(`${BASE}/#/overworld`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
// spawn (9,13) → walk up the mat toward NPCs
for (let i = 0; i < 7; i++) { await page.keyboard.press('ArrowUp'); await page.waitForTimeout(260); }
await page.keyboard.press('Enter');
await page.waitForTimeout(600);
await shot('npc-dialogue');

console.log('TOUR DONE');
await browser.close();
