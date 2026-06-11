#!/usr/bin/env node
// Inject a save, run one battle, screenshot every turn — verifies the
// position-driven battle composition across real ground positions.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.argv[2] || 'http://localhost:4173';
const SHOTS = '/tmp/gq-battle-shots';
mkdirSync(SHOTS, { recursive: true });

const player = {
  id: 'e2e-player', name: 'Testy', style: 'wrestler', belt: 'blue', xp: 2500,
  baseStats: { hp: 80, str: 90, tec: 60, tgh: 80, flx: 50, spd: 70, end: 75 },
  ivs: { str: 10, tec: 10, tgh: 10, flx: 10, spd: 10, end: 10 },
  evs: { str: 60, tec: 30, tgh: 0, flx: 0, spd: 30, end: 0 },
  moves: ['double-leg', 'single-leg', 'snap-down', 'bridge-escape', 'posture-up', 'knee-slice', 'americana'],
  learnedMoves: ['double-leg'], moveXp: {}, frame: 'heavy', giColor: '#2563eb',
  gymName: 'E2E Gym', coachName: 'Coach Bot',
};
const opponent = {
  id: 'random-e2e', name: 'Grinder', style: 'pressure-passer', belt: 'blue', xp: 2200,
  baseStats: { hp: 80, str: 80, tec: 70, tgh: 85, flx: 55, spd: 60, end: 80 },
  ivs: { str: 8, tec: 8, tgh: 8, flx: 8, spd: 8, end: 8 },
  evs: { str: 40, tec: 40, tgh: 20, flx: 0, spd: 0, end: 0 },
  moves: ['double-leg', 'knee-slice', 'americana', 'posture-up'],
  learnedMoves: ['double-leg'], moveXp: {}, frame: 'heavy',
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(([p, o]) => {
  localStorage.setItem('rollcraft-player', JSON.stringify(p));
  localStorage.setItem('rollcraft-opponent', JSON.stringify(o));
  localStorage.setItem('rollcraft-battle-tutorial-seen', 'true');
}, [player, opponent]);
await page.goto(`${BASE}/#/battle`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const positions = new Set();
for (let turn = 0; turn < 25; turn++) {
  const over = await page.getByText(/YOU WIN!|YOU LOSE!|DRAW/).first().isVisible().catch(() => false);
  if (over) break;
  // Record the displayed position
  const posText = await page.locator('div').filter({ hasText: /^[A-Z\- ()]+$/ }).allInnerTexts().catch(() => []);
  const buttons = page.locator('button:enabled');
  const n = await buttons.count();
  let moveIdx = -1, stallIdx = -1;
  for (let b = 0; b < n; b++) {
    const t = (await buttons.nth(b).innerText().catch(() => '')) || '';
    if (/TAKEDOWN|SUBMISSION|SWEEP|PASS|ESCAPE|TRANSITION|SETUP/.test(t) && moveIdx === -1) moveIdx = b;
    if (t.includes('STALL') && stallIdx === -1) stallIdx = b;
  }
  const pick = moveIdx >= 0 ? moveIdx : stallIdx;
  if (pick === -1) break;
  await buttons.nth(pick).click({ force: true });
  // Mid-turn shot: phase 1 (our move) has resolved, opponent hasn't responded
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/t${String(turn).padStart(2, '0')}-mid.png` });
  await page.waitForTimeout(1200);
  const pos = (posText.find(t => t.length < 30 && /GUARD|MOUNT|SIDE|BACK|TURTLE|KNEE|NORTH|CLINCH|STANDING|LEG/.test(t)) || `turn${turn}`).trim();
  positions.add(pos);
  await page.screenshot({ path: `${SHOTS}/t${String(turn).padStart(2, '0')}-end.png` });
}
console.log('positions seen:', [...positions].join(' | '));
await browser.close();
