// Full-overhaul: per-NPC unique sprite (south-facing). Rotate to other directions in a follow-up pass.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)[1].trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
const OUT = 'public/sprites/npcs';
mkdirSync(OUT, { recursive: true });

// Per-NPC prompt library. Each is tailored: style (body type), belt (colour), personality hint.
// Kept terse because PixelLab does better with clean prompts.
const BASE = 'front facing, full body, pixel art game character sprite, no background';

const NPCS = [
  // starterGym
  { id: 'prof-helio',     p: 'wise old master BJJ professor with thick grey beard, worn black gi with weathered black belt, calm stance' },
  { id: 'instr-marcelo',  p: 'lean charismatic BJJ coach, slicked black hair, black gi with black belt, relaxed smile' },
  { id: 'instr-craig',    p: 'tall rangy BJJ instructor, buzzed hair, black gi with black belt, sharp analytical look' },
  { id: 'tp-renzo',       p: 'short stocky wrestler, dark curly hair, white gi with white belt, aggressive stance' },
  { id: 'tp-rickson',     p: 'lean quiet BJJ student, brown hair, white gi with white belt, calm steady posture' },
  { id: 'tp-keenan',      p: 'tall athletic guard player, long brown hair tied back, blue gi with blue belt, playful stance' },
  { id: 'tp-gordon',      p: 'muscular intense BJJ student, short brown hair, blue gi with blue belt, hunting submission look' },

  // scrambleValley
  { id: 'sv-miyao',       p: 'young wiry berimbolo specialist, messy black hair, teal gi with black belt, ready to invert' },
  { id: 'sv-lachlan',     p: 'tall lanky leg-lock master, shaved head, black rashguard and spats, black belt tied over, intense stare' },
  { id: 'sv-tourney',     p: 'tournament registrar in polo shirt with clipboard, black hair, friendly smile' },
  { id: 'sv-paulo',       p: 'teenage Brazilian kid, curly dark hair, white gi with white belt, grinning' },
  { id: 'sv-jade',        p: 'young woman with purple highlights, white gi with white belt, flexible stance' },
  { id: 'sv-diego',       p: 'wiry young berimbolo player, dark hair, blue gi with blue belt, ready to roll' },
  { id: 'sv-tank',        p: 'huge barrel-chested wrestler, bald, blue gi with blue belt, arms crossed' },

  // oldTown
  { id: 'ot-tanaka',      p: 'elder Japanese BJJ master with silver hair, traditional white gi with black belt, stern posture' },
  { id: 'ot-tourney',     p: 'dignified older registrar in traditional attire, grey hair, polite bow' },
  { id: 'ot-marco',       p: 'mid-twenties BJJ student, short dark hair, pressed white gi with blue belt, respectful stance' },
  { id: 'ot-lucia',       p: 'young woman with long braided hair, white gi with blue belt, graceful posture' },
  { id: 'ot-bruno',       p: 'thick muscular pressure passer, buzzed hair, white gi with purple belt, intimidating weight forward stance' },

  // steelMountain
  { id: 'sm-mike',        p: 'bearded grizzled wrestler coach, shaved head, muscular, singlet and black belt, intimidating' },
  { id: 'sm-tourney',     p: 'ex-wrestler registrar with cauliflower ear, sweatshirt, clipboard' },
  { id: 'sm-tyler',       p: 'athletic young wrestler, short blond hair, headgear around neck, blue rashguard, blue belt' },
  { id: 'sm-sarah',       p: 'strong judoka woman, dark hair in bun, judo gi dyed grey, blue belt, ready stance' },
  { id: 'sm-beast',       p: 'massive muscular wrestler, shaved head, singlet, purple belt, veins popping' },

  // coralBay
  { id: 'cb-marina',      p: 'laid-back beach BJJ coach woman, sun-bleached blonde hair, tan, light blue gi with black belt' },
  { id: 'cb-tourney',     p: 'tanned registrar in tropical shirt, friendly, clipboard' },
  { id: 'cb-kai',         p: 'surfer-type with long sun-kissed hair, tan skin, white gi with purple belt, flexible loose stance' },
  { id: 'cb-ray',         p: 'lean guy with sunglasses on head, tattoo sleeves, white gi with purple belt, leg-lock hunter pose' },
  { id: 'cb-ana',         p: 'athletic woman with wavy dark hair, tan, white gi with purple belt, ready to invert' },

  // samboDistrict
  { id: 'sd-viktor',      p: 'tough Russian sambo master, shaved head, thick beard, red sambo jacket with black belt, scarred face' },
  { id: 'sd-tourney',     p: 'serious Eastern European registrar in dark jacket, stoic' },
  { id: 'sd-nikolai',     p: 'stocky sambo judoka, buzzed hair, red jacket with purple belt, explosive stance' },
  { id: 'sd-yuki',        p: 'small quiet Japanese submission specialist, black bowl cut, black rashguard with brown belt rope tied' },
  { id: 'sd-ivan',        p: 'gigantic Russian wrestler, bald, thick neck, singlet and brown belt, intimidating' },

  // novaCamp
  { id: 'nc-yun',         p: 'precise scientific BJJ coach with glasses, lab-clean black gi, black belt, analytical expression' },
  { id: 'nc-tourney',     p: 'sharp-dressed registrar with tablet, modern athleisure' },
  { id: 'nc-elena',       p: 'lean technical woman, short dark bob, black rashguard and spats, brown belt tied over, calm' },
  { id: 'nc-dante',       p: 'tall lean controller, dreadlocks, fitted black gi with brown belt, poised stance' },
  { id: 'nc-phoenix',     p: 'athletic young berimbolo player with spiked hair, black gi with brown belt, dynamic ready pose' },

  // ironCoast
  { id: 'ic-professor',   p: 'legendary pressure-passing professor, greying hair swept back, crisp black gi with weathered black belt, commanding presence' },
  { id: 'ic-tourney',     p: 'world-class tournament director in formal attire, serious clipboard' },
  { id: 'ic-atlas',       p: 'massive chiseled black-belt pressure passer, shaved head, black gi, heavy grounded stance' },
  { id: 'ic-nova',        p: 'elite woman guard player, dark hair in tight braid, black gi with black belt, spider guard ready' },
  { id: 'ic-steel',       p: 'stoic precision controller, silver buzz cut, pristine black gi with black belt, unmoved stance' },

  // summitCity
  { id: 'sc-tourney',     p: 'World Championship director in suit jacket over polo, microphone, official' },
  { id: 'sc-ghost',       p: 'mysterious black belt with hood half up, shadowed face, all-black gi with worn black belt, silent presence' },
  { id: 'sc-legend1',     p: 'Grandmaster Leo, smiling elder with grey hair, decorated black gi, ancient black belt, wise aura' },
  { id: 'sc-legend2',     p: 'Queen Gabi, champion woman with confident smirk, crown badge on gi, pristine black belt, world-class posture' },

  // Rival — spawned dynamically but we bake a sprite for his spritesheet too
  { id: 'rival-kenzo',    p: 'arrogant rival BJJ prodigy, slicked black hair, smirking, pristine white gi with belt that matches player progression, proud stance' },
];

async function gen(description, filename) {
  if (existsSync(filename)) { console.log(`  skip (exists): ${filename}`); return true; }
  console.log(`→ ${description.substring(0, 80)}`);
  const start = Date.now();
  const res = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
    method: 'POST', headers,
    body: JSON.stringify({
      description,
      image_size: { width: 32, height: 32 },
      no_background: true,
    }),
  });
  if (!res.ok) { console.log(`  ✗ HTTP ${res.status}`); return false; }
  const data = await res.json();
  if (!data.image?.base64) { console.log(`  ✗ no image`); return false; }
  writeFileSync(filename, Buffer.from(data.image.base64, 'base64'));
  console.log(`  ✓ ${filename} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  return true;
}

console.log(`=== Generating ${NPCS.length} NPC sprites (south-facing) ===\n`);
let ok = 0, fail = 0;
for (const n of NPCS) {
  const filename = `${OUT}/${n.id}-south.png`;
  const prompt = `${n.p}, ${BASE}`;
  const success = await gen(prompt, filename);
  if (success) ok++; else fail++;
}

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log(`\n=== Done: ${ok} ok / ${fail} fail ===`);
console.log('Balance:', await bal.text());
