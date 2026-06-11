#!/usr/bin/env node
// Drive /#/promotion → share card download → save the PNG for eyeballing.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.argv[2] || 'http://localhost:4173';
mkdirSync('/tmp/gq-share', { recursive: true });

const player = {
  id: 'e2e-player', name: 'Testy', style: 'wrestler', belt: 'white', xp: 1600,
  baseStats: { hp: 80, str: 90, tec: 60, tgh: 80, flx: 50, spd: 70, end: 75 },
  ivs: { str: 10, tec: 10, tgh: 10, flx: 10, spd: 10, end: 10 },
  evs: { str: 60, tec: 30, tgh: 0, flx: 0, spd: 30, end: 0 },
  moves: ['double-leg'], learnedMoves: ['double-leg'], moveXp: {}, frame: 'heavy',
  giColor: '#2563eb', gymName: 'Academia BJJ', coachName: 'Coach Jeff',
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 }, acceptDownloads: true });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate((p) => {
  localStorage.setItem('rollcraft-player', JSON.stringify(p));
  localStorage.setItem('rollcraft-progression', JSON.stringify({
    stamps: [], tournamentResults: [], money: 500, sponsorships: [], specialization: null,
    currentRegionId: 'home', storyFlags: {}, npcDefeated: { a: true, b: true }, npcScouted: {},
    trainingSessions: 0, inventory: {}, totalWins: 12, totalLosses: 3,
  }));
}, player);

await page.goto(`${BASE}/#/promotion`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
// narrative → tap skips to reveal → tap to done
await page.mouse.click(210, 400);
await page.waitForTimeout(600);
await page.mouse.click(210, 400);
await page.waitForTimeout(600);

const shareBtn = page.getByRole('button', { name: /SHARE YOUR PROMOTION/ });
await shareBtn.waitFor({ timeout: 5000 });
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 20000 }),
  shareBtn.click({ force: true }),
]);
await download.saveAs('/tmp/gq-share/promotion-card.png');
console.log('share card saved:', await download.suggestedFilename());
await browser.close();
