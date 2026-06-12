#!/usr/bin/env node
// Grapple Quest e2e smoke: title → create flow → onboarding battle → aftermath
// → overworld objective hint → challenge link accept. Screenshots along the way.
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4173';
const SHOTS = '/tmp/gq-e2e';
import { mkdirSync } from 'fs';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
let step = 0;
const shot = async (name) => page.screenshot({ path: `${SHOTS}/${String(++step).padStart(2, '0')}-${name}.png` });
const fail = async (msg) => { await shot('FAIL'); console.error(`FAIL: ${msg}`); await browser.close(); process.exit(1); };

const clickText = async (text, timeout = 8000) => {
  const btn = page.getByRole('button', { name: text }).first();
  await btn.waitFor({ state: 'visible', timeout }).catch(() => fail(`button "${text}" never appeared`));
  // force: some buttons pulse via CSS animation and never go "stable"
  await btn.click({ force: true });
};

try {
  // ── Title ──
  await page.goto(BASE, { waitUntil: 'networkidle' });
  if (!(await page.getByText('GRAPPLE QUEST').first().isVisible())) await fail('title screen');
  await shot('title');
  await clickText('NEW GAME');

  // ── Create: name / gym / gi ──
  await page.getByPlaceholder('ENTER NAME').fill('Testy');
  await clickText('CONTINUE');
  await page.getByPlaceholder('GYM NAME').fill('E2E Test Gym');
  await page.getByPlaceholder('COACH NAME').fill('Coach Bot');
  await clickText('CONTINUE');
  await shot('gi-pick');
  await clickText('White');

  // BECOME THE FIGHTER (photo step) — take the skip path
  await clickText('SKIP');

  // ── Cinematic: tap-to-advance should rip through instantly ──
  // (break on the choice card itself — the cinematic text includes the
  // lowercase "Who do you partner with?" line, so don't match on that)
  for (let i = 0; i < 18; i++) {
    await page.mouse.click(210, 400);
    await page.waitForTimeout(120);
    if (await page.getByText('The Wrestlers').isVisible().catch(() => false)) break;
  }
  if (!(await page.getByText('The Wrestlers').isVisible())) await fail('tap-to-advance cinematic');
  await shot('choice');
  await clickText('The Wrestlers');

  // ── Training narrative → moves unlocked ──
  for (let i = 0; i < 8; i++) {
    await page.mouse.click(210, 400);
    await page.waitForTimeout(120);
    if (await page.getByText('NEW MOVES UNLOCKED!').isVisible().catch(() => false)) break;
  }
  await clickText('CONTINUE');

  // ── Rival intro → battle ──
  for (let i = 0; i < 6; i++) {
    await page.mouse.click(210, 400);
    await page.waitForTimeout(150);
    if (await page.getByText("LET'S ROLL").isVisible().catch(() => false)) break;
  }
  await clickText("LET'S ROLL");

  // ── First-battle tutorial overlay ──
  await page.getByText('HOW IT WORKS').waitFor({ timeout: 8000 }).catch(() => fail('tutorial overlay missing'));
  await shot('tutorial');
  for (let i = 0; i < 3; i++) { await page.mouse.click(210, 300); await page.waitForTimeout(250); }

  // ── Fight: click first enabled move until it ends ──
  let won = false;
  for (let turn = 0; turn < 30; turn++) {
    const over = await page.getByText(/YOU WIN!|YOU LOSE!|DRAW/).first().isVisible().catch(() => false);
    if (over) { won = true; break; }
    const buttons = page.locator('button:enabled');
    const n = await buttons.count();
    // Prefer a REAL move (category keywords in MoveButton text); STALL as last resort
    let moveIdx = -1, stallIdx = -1;
    for (let b = 0; b < n; b++) {
      const t = (await buttons.nth(b).innerText().catch(() => '')) || '';
      if (/TAKEDOWN|SUBMISSION|SWEEP|PASS|ESCAPE|TRANSITION|SETUP/.test(t) && moveIdx === -1) moveIdx = b;
      if (t.includes('STALL') && stallIdx === -1) stallIdx = b;
    }
    const pick = moveIdx >= 0 ? moveIdx : stallIdx;
    if (pick === -1) await fail(`no move button on turn ${turn}`);
    if (turn === 2) await shot('battle-midfight');
    await buttons.nth(pick).click({ force: true });
    await page.waitForTimeout(1700);
  }
  if (!won) await fail('battle never ended');
  await shot('battle-over');
  await clickText('CONTINUE');

  // ── Aftermath → overworld ──
  for (let i = 0; i < 12; i++) {
    await page.mouse.click(210, 400);
    await page.waitForTimeout(150);
    if (page.url().includes('/overworld')) break;
  }
  await page.waitForTimeout(1200);
  if (!page.url().includes('/overworld')) await fail('never reached overworld');

  // ── Objective breadcrumb ──
  const hasObjective = await page.getByText('NEXT ▸').isVisible().catch(() => false);
  if (!hasObjective) await fail('objective hint missing on overworld');
  await shot('overworld-objective');

  // ── Challenge link: craft one and accept it ──
  const payload = {
    v: 1, n: 'Rival Bot', g: 'Bot Gym', s: 'guard-player', b: 'white', f: 'light', x: 200,
    bs: [70, 55, 95, 60, 90, 70, 65], iv: [5, 5, 5, 5, 5, 5], ev: [0, 0, 0, 0, 0, 0],
    m: ['pull-guard', 'scissor-sweep', 'triangle'], w: 3, l: 1,
  };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await page.goto(`${BASE}/?challenge=${b64}#/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const challengeShown = await page.getByText('CHALLENGES YOU').isVisible().catch(() => false);
  if (!challengeShown) await fail('challenge banner missing on title');
  await shot('challenge-title');
  await clickText('ACCEPT');
  await page.waitForTimeout(1500);
  // tutorial seen already → battle UI should be up with the challenger's name
  const inBattle = await page.getByText('RIVAL BOT').first().isVisible().catch(() => false);
  if (!inBattle) await fail('challenge battle did not start');
  await shot('challenge-battle');

  console.log('E2E SMOKE: ALL PASS');
} finally {
  await browser.close();
}
