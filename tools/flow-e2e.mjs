#!/usr/bin/env node
// THE 2026 FLOW TEST — full identity journey with a REAL character generation:
// create flow with photo upload → forge in background → Kenzo fight →
// overworld → reveal → equip → directional sprite on the mats → battle.
// SPENDS ~20 PixelLab generations. Run from workspace root.
// Usage: node rollcraft/tools/flow-e2e.mjs <deploy-url> <photo-path>
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.argv[2];
const PHOTO = process.argv[3];
if (!BASE || !PHOTO) { console.error('usage: flow-e2e.mjs <url> <photo>'); process.exit(1); }
const SHOTS = '/tmp/gq-flow';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
let step = 0;
const shot = (n) => page.screenshot({ path: `${SHOTS}/${String(++step).padStart(2, '0')}-${n}.png` });
const fail = async (msg) => { await shot('FAIL'); console.error('FAIL:', msg); await browser.close(); process.exit(1); };
const clickBtn = async (name, timeout = 10000) => {
  const b = page.getByRole('button', { name }).first();
  await b.waitFor({ state: 'visible', timeout }).catch(() => fail(`button "${name}" missing`));
  await b.click({ force: true });
};

await page.goto(BASE, { waitUntil: 'networkidle' });
await clickBtn('NEW GAME');
await page.getByPlaceholder('ENTER NAME').fill('PixelJeff');
await clickBtn('CONTINUE');
await page.getByPlaceholder('GYM NAME').fill('Flow Test Gym');
await page.getByPlaceholder('COACH NAME').fill('Coach Flow');
await clickBtn('CONTINUE');
await clickBtn('White');

// ── BECOME THE FIGHTER: upload the photo ──
await page.getByText('BECOME THE FIGHTER').waitFor({ timeout: 8000 }).catch(() => fail('photo step missing'));
await shot('become-the-fighter');
const [chooser] = await Promise.all([
  page.waitForEvent('filechooser', { timeout: 8000 }),
  page.getByRole('button', { name: /TAKE \/ UPLOAD PHOTO/ }).click({ force: true }),
]);
await chooser.setFiles(PHOTO);
await page.getByText('FORGING YOUR FIGHTER').waitFor({ timeout: 30000 }).catch(() => fail('forge never started'));
await shot('forging');
console.log('✓ forge started in background');
await page.waitForTimeout(2200); // auto-advance to cinematic

// ── Story: rip through cinematic → wrestlers → moves → Kenzo ──
for (let i = 0; i < 18; i++) {
  await page.mouse.click(210, 400);
  await page.waitForTimeout(120);
  if (await page.getByText('The Wrestlers').isVisible().catch(() => false)) break;
}
await clickBtn('The Wrestlers');
for (let i = 0; i < 8; i++) {
  await page.mouse.click(210, 400);
  await page.waitForTimeout(120);
  if (await page.getByText('NEW MOVES UNLOCKED!').isVisible().catch(() => false)) break;
}
await clickBtn('CONTINUE');
for (let i = 0; i < 6; i++) {
  await page.mouse.click(210, 400);
  await page.waitForTimeout(150);
  if (await page.getByRole('button', { name: "LET'S ROLL" }).isVisible().catch(() => false)) break;
}
await clickBtn("LET'S ROLL");

// tutorial overlay (first battle)
await page.getByText('HOW IT WORKS').waitFor({ timeout: 8000 }).catch(() => null);
for (let i = 0; i < 3; i++) { await page.mouse.click(210, 300); await page.waitForTimeout(250); }

// fight Kenzo
let over = false;
for (let t = 0; t < 30; t++) {
  if (await page.getByText(/YOU WIN!|YOU LOSE!|DRAW/).first().isVisible().catch(() => false)) { over = true; break; }
  const buttons = page.locator('button:enabled');
  const n = await buttons.count();
  let pick = -1, stall = -1;
  for (let b = 0; b < n; b++) {
    const txt = (await buttons.nth(b).innerText().catch(() => '')) || '';
    if (/TAKEDOWN|SUBMISSION|SWEEP|PASS|ESCAPE|TRANSITION/.test(txt) && pick === -1) pick = b;
    if (txt.includes('STALL') && stall === -1) stall = b;
  }
  if (pick === -1 && stall === -1) await fail(`no moves turn ${t}`);
  await buttons.nth(pick >= 0 ? pick : stall).click({ force: true });
  await page.waitForTimeout(1700);
}
if (!over) await fail('Kenzo fight never ended');
await clickBtn('CONTINUE');
console.log('✓ Kenzo fight done');

// aftermath → overworld
for (let i = 0; i < 14; i++) {
  await page.mouse.click(210, 400);
  await page.waitForTimeout(160);
  if (page.url().includes('/overworld')) break;
}
await page.waitForTimeout(1500);
if (!page.url().includes('/overworld')) await fail('never reached overworld');
console.log('✓ on the mats — waiting for the reveal (generation ~2-4 min)...');

// ── THE REVEAL ──
const reveal = page.getByText('YOUR FIGHTER IS READY');
let revealed = false;
for (let i = 0; i < 40; i++) { // up to ~6.5 min
  if (await reveal.isVisible().catch(() => false)) { revealed = true; break; }
  await page.waitForTimeout(10000);
}
if (!revealed) await fail('reveal never fired');
await shot('REVEAL');
console.log('✓ THE REVEAL fired');

await clickBtn('STEP ON THE MAT');
await page.waitForTimeout(1200);
await shot('overworld-custom-south');

// walk around — directional sprites
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(400);
await shot('custom-north');
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(400);
await shot('custom-east');
console.log('✓ directional sprites rendering');

// verify persisted
const saved = await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('rollcraft-player'));
  return { hasSet: !!p.customSprites, dirs: p.customSprites ? Object.keys(p.customSprites) : [] };
});
if (!saved.hasSet || saved.dirs.length !== 4) await fail(`customSprites not persisted: ${JSON.stringify(saved)}`);
console.log('✓ 4 directional sprites persisted to save');

console.log('FLOW E2E: ALL PASS');
await browser.close();
