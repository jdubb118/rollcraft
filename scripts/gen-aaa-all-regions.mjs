// AAA composite surfaces for all 8 remaining regions.
// Per region: mat-surface, floor-surface, wall-tile, plus region-appropriate
// props (lockers / desk / board) where the map calls for them.
//
// Mat sizing (from audit):
//   128×192 (cols 6-13):  oldtown, sambo   (straight rectangle, walled)
//   160×192 (cols 5-14):  scramble, coral, nova, iron, summit, steel
//     (notched shape — mat extends wider in rows 5-9; painting the full
//      bounding box is fine because wall tiles overwrite the mat paint where
//      the map places walls on rows 1-4 / 10-12 cols 5 & 14)
//
// Floor: 288×192 (cols 1-18) for all 8 regions.
// Wall tile: 32×32 downsampled to 16×16 — per-region material.
//
// Props needed per map (from audit):
//   lockers: scramble, oldtown, sambo, iron
//   desk:    scramble, oldtown, sambo, coral, nova, iron, summit  (NOT steel)
//   board:   ALL 8
//
// That gives 24 surfaces + 4 lockers + 7 desks + 8 boards = 43 gens.
// ~20s each = ~14 min runtime.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { existsSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

async function pixflux(desc, w, h, filename, noBg = false, skipIfExists = true) {
  if (skipIfExists && existsSync(filename)) {
    console.log(`  ⏭  ${filename} (exists, skip)`);
    return;
  }
  const start = Date.now();
  const res = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
    method: 'POST', headers,
    body: JSON.stringify({
      description: desc,
      image_size: { width: w, height: h },
      no_background: noBg,
    }),
  });
  const data = await res.json();
  if (data.image?.base64) {
    writeFileSync(filename, Buffer.from(data.image.base64, 'base64'));
    console.log(`  ✓ ${filename} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  } else {
    console.log(`  ✗ Error on ${filename}: ${JSON.stringify(data).substring(0, 250)}`);
  }
}

// Region themes — each line is a (mat / floor / wall) triple. Kept tight on
// material keywords so PixelLab keeps the region identity intact.
const REGIONS = {
  'scramble-valley': {
    matW: 160, props: ['lockers', 'desk', 'board'],
    mat:   'top-down orthographic view of a teal blue martial arts training mat surface, cyan-teal color (#0fa3a3), visible puzzle-piece seams across the whole surface, thin yellow safety border stripe around the outer edge, subtle sweat stains and mat scuffs, hand-painted pixel art, HD-2D style, soft overhead lighting, fills image edge to edge, NO grid lines NO characters NO furniture',
    floor: 'top-down orthographic view of a raw industrial warehouse gym floor, scuffed dark grey polished concrete with visible expansion joints, subtle oil stains and chalk smudges, occasional faint rebar outline visible through concrete, HD-2D painted pixel art, soft overhead LED lighting, fills image edge to edge, NO mat NO characters NO furniture NO walls',
    wall:  'top-down orthographic view of corrugated sheet metal wall panel from above, industrial steel grey with subtle rust streaks, visible ribbed corrugation lines running vertically, rivet dots along the edges, HD-2D pixel art, tileable edges, fills image, NO decorations NO characters',
    board: 'top-down 3/4 view of a metal clipboard holder mounted on the wall, graffiti-tagged metal plate with sticker decals and taped-up match schedules, industrial warehouse gym aesthetic, HD-2D painted pixel art, transparent background, soft drop shadow',
    desk:  'top-down 3/4 view of a heavy industrial workbench with a dented metal top, cracked rubber mat on surface, old stopwatch and a rolled-up hand-wrap, steel-pipe legs, warehouse gym aesthetic, HD-2D painted pixel art, transparent background, soft drop shadow',
    lockers: 'top-down 3/4 view of a 2x2 bank of industrial steel lockers, dented grey steel with yellow spray-paint numbering, chipped paint showing rust, padlocks on each door, warehouse gym aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
  },
  'old-town': {
    matW: 128, props: ['lockers', 'desk', 'board'],
    mat:   'top-down orthographic view of a traditional Japanese tatami mat surface, natural straw gold-tan color (#c9a96e), visible horizontal grass weave pattern running across the surface, tight black border edging around each tatami section (6 panels in 2 columns), HD-2D painted pixel art, soft warm temple lighting, fills image, NO grid lines beyond the tatami borders, NO characters, NO furniture',
    floor: 'top-down orthographic view of a traditional dojo hardwood floor, dark stained walnut boards running horizontally, visible plank seams with subtle variation, polished lacquered finish with faint reflections, HD-2D painted pixel art, warm lantern-style lighting, fills image, NO mat, NO characters, NO furniture, NO walls',
    wall:  'top-down orthographic view of a white paper shoji screen wall panel from above, rice-paper translucent surface with thin dark wooden lattice grid dividing it into small rectangles, HD-2D painted pixel art, soft glow, tileable, fills image, NO decorations NO characters',
    board: 'top-down 3/4 view of a traditional wooden kamidana shelf with hanging kanji scroll, rice paper with bold black brushstroke calligraphy, small offering bowl beneath, dark lacquered wood frame, Japanese dojo aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
    desk:  'top-down 3/4 view of a low japanese writing desk (zataku) with a bamboo inkwell, brush rest, and open training ledger, dark lacquered cedar wood, traditional dojo aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
    lockers: 'top-down 3/4 view of a 2x2 traditional wooden shoe cubby / getabako shelf, unfinished pine wood with cedar accents, folded gi uniforms visible in each slot, traditional dojo aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
  },
  'steel-mountain': {
    matW: 160, props: ['board'],
    mat:   'top-down orthographic view of a heavy-duty wrestling room mat surface, deep navy blue color (#1a3a6e), thin red safety stripe border, visible scuff marks from takedowns, rugged rubberized texture, HD-2D painted pixel art, harsh fluorescent lighting, fills image, NO grid lines, NO characters, NO furniture',
    floor: 'top-down orthographic view of a military wrestling facility floor, scuffed grey rubberized training mat extending outside the main wrestling mat, visible wear patterns near the edges, HD-2D painted pixel art, harsh overhead lighting, fills image, NO main mat, NO characters, NO furniture, NO walls',
    wall:  'top-down orthographic view of a raw grey concrete wall panel from above, cast concrete with visible form tie marks and subtle stains, cool industrial grey, HD-2D painted pixel art, tileable, fills image, NO decorations NO characters',
    board: 'top-down 3/4 view of a bold motivational banner mounted on the wall, red military canvas with yellow block lettering "NO WEAKNESS", steel rivets in corners, military wrestling room aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
  },
  'coral-bay': {
    matW: 160, props: ['desk', 'board'],
    mat:   'top-down orthographic view of a beachside gym training mat, bright cyan turquoise color (#00b8c4), subtle wave-ripple pattern across the surface, white seafoam border stripe, sand grain speckle texture, HD-2D painted pixel art, warm golden-hour sunset lighting, fills image, NO grid lines, NO characters, NO furniture',
    floor: 'top-down orthographic view of a weathered beach boardwalk floor, sandy cream-colored wood planks running horizontally, gaps between boards showing lighter sand beneath, occasional shell fragments and sand drifts, HD-2D painted pixel art, warm sunset glow, fills image, NO mat, NO characters, NO furniture, NO walls',
    wall:  'top-down orthographic view of a bamboo slat wall panel from above, pale tan bamboo poles lashed together with twine, warm beach-bungalow aesthetic, HD-2D painted pixel art, tileable, fills image, NO decorations NO characters',
    board: 'top-down 3/4 view of a weathered surfboard mounted on the wall covered in wax pencil technique diagrams, aqua-painted foam with chalky scribbles, beach-bungalow gym aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
    desk:  'top-down 3/4 view of a driftwood-topped desk with a potted palm, coconut-shell bowl, and a small conch shell, weathered salt-bleached wood, beach gym aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
  },
  'sambo-district': {
    matW: 128, props: ['lockers', 'desk', 'board'],
    mat:   'top-down orthographic view of an underground fight-club mat surface, deep crimson red color (#8a1a1a), visible heavy-duty puzzle-piece seams, subtle bloodstain smudges and scuff marks, black taped edge repairs, gritty texture, HD-2D painted pixel art, dim moody red lighting, fills image, NO grid lines, NO characters, NO furniture',
    floor: 'top-down orthographic view of an underground basement gym floor, stained dark concrete with ominous water damage patches, chalk sparring marks and heel scuffs, exposed rebar peeking through in spots, HD-2D painted pixel art, dim moody red-amber lighting, fills image, NO mat, NO characters, NO furniture, NO walls',
    wall:  'top-down orthographic view of a dark red brick wall panel from above, weathered oxblood-colored bricks with crumbling mortar, faint old graffiti tags, moody underground aesthetic, HD-2D painted pixel art, tileable, fills image, NO decorations NO characters',
    board: 'top-down 3/4 view of a graffiti-tagged concrete slab with a taped fight-card poster, faded red and black spray-paint, underground fight club aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
    desk:  'top-down 3/4 view of a battered metal drum repurposed as a gear table, rust spots, small first-aid kit on top, bloody towel, underground fight club aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
    lockers: 'top-down 3/4 view of a 2x2 bank of rusted orange-red fight-club lockers, chipped paint showing raw steel, graffiti tags and sticker decals, padlocks hanging, underground aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
  },
  'nova-camp': {
    matW: 160, props: ['desk', 'board'],
    mat:   'top-down orthographic view of a high-tech training facility mat surface, clean white color (#e8f0f8) with glowing cyan LED grid lines forming a subtle circuit-board pattern, blue accent border stripe, futuristic sci-fi aesthetic, HD-2D painted pixel art, cool blue ambient lighting, fills image, NO characters, NO furniture',
    floor: 'top-down orthographic view of a glossy high-tech training facility floor, polished white panel tiles with subtle blue LED strip borders, minimalist sci-fi aesthetic, HD-2D painted pixel art, cool blue ambient lighting, fills image, NO mat, NO characters, NO furniture, NO walls',
    wall:  'top-down orthographic view of a dark glass-panel wall from above, tinted near-black glass with faint cyan LED accent lines running along the edges, sci-fi sleek aesthetic, HD-2D painted pixel art, tileable, fills image, NO decorations NO characters',
    board: 'top-down 3/4 view of a holographic display panel mounted on the wall, glowing cyan technique diagrams floating on a dark glass surface, thin chrome frame, sci-fi aesthetic, HD-2D painted pixel art, transparent background, faint cyan glow',
    desk:  'top-down 3/4 view of a minimalist sci-fi training console, black glass top with glowing cyan touchpad interface, chrome legs, holographic data readouts, HD-2D painted pixel art, transparent background, soft shadow',
  },
  'iron-coast': {
    matW: 160, props: ['lockers', 'desk', 'board'],
    mat:   'top-down orthographic view of a goth-industrial training mat surface, near-black color (#0d0d14) with subtle dark grey puzzle-piece seams, thin red blood-accent border stripe, chains and iron-dust texture details, HD-2D painted pixel art, dim moody lighting, fills image, NO characters, NO furniture',
    floor: 'top-down orthographic view of a goth-industrial gym floor, charcoal black rubberized matting with faint chain drag marks, iron-dust speckle, HD-2D painted pixel art, dim moody lighting, fills image, NO main mat, NO characters, NO furniture, NO walls',
    wall:  'top-down orthographic view of a carved dark stone wall panel from above, black basalt stone with visible chisel marks and cracks, goth-industrial aesthetic, HD-2D painted pixel art, tileable, fills image, NO decorations NO characters',
    board: 'top-down 3/4 view of a wrought-iron rack holding weapon-like training implements, black iron framework with chains, technique scrolls pinned under iron weights, goth industrial aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
    desk:  'top-down 3/4 view of a black iron anvil-style table with chains, leather training log open on top, iron dagger paperweight, goth industrial aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
    lockers: 'top-down 3/4 view of a 2x2 bank of black iron-plated lockers with chain fastenings, dark goth-industrial aesthetic, heavy hinges, rust streaks, HD-2D painted pixel art, transparent background, soft shadow',
  },
  'summit-city': {
    matW: 160, props: ['desk', 'board'],
    mat:   'top-down orthographic view of a pristine elite academy training mat, white ivory color (#f4f0e6) with subtle gold-leaf vein marbling and gold-trim border, luxurious clean aesthetic, HD-2D painted pixel art, soft warm overhead lighting, fills image, NO characters, NO furniture',
    floor: 'top-down orthographic view of a pristine marble gym floor, polished white Carrara marble tiles with subtle grey veining, gold seam grout between tiles, elite luxury aesthetic, HD-2D painted pixel art, bright warm lighting, fills image, NO main mat, NO characters, NO furniture, NO walls',
    wall:  'top-down orthographic view of a white marble wall panel from above, pristine Carrara marble with elegant grey and gold veining, gold trim accents, elite luxury aesthetic, HD-2D painted pixel art, tileable, fills image, NO decorations NO characters',
    board: 'top-down 3/4 view of an ornate gold-framed champion banner with purple velvet backing, embroidered gold lettering and crown emblem, elite academy aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
    desk:  'top-down 3/4 view of an elegant mahogany writing desk with brass accents, gold-embossed leather blotter, crystal inkwell, championship medal on a silk ribbon, elite academy aesthetic, HD-2D painted pixel art, transparent background, soft shadow',
  },
};

async function run() {
  for (const [regionId, r] of Object.entries(REGIONS)) {
    console.log(`\n━━━ ${regionId} ━━━`);
    const dir = `public/sprites/scenes/${regionId}`;
    mkdirSync(dir, { recursive: true });

    await pixflux(r.mat,   r.matW, 192, `${dir}/mat-surface.png`);
    await pixflux(r.floor, 288,    192, `${dir}/floor-surface.png`);
    await pixflux(r.wall,  32,     32,  `${dir}/wall-tile.png`);
    if (r.props.includes('board'))   await pixflux(r.board,   32, 32, `${dir}/prop-board.png`,   true);
    if (r.props.includes('desk'))    await pixflux(r.desk,    32, 32, `${dir}/prop-desk.png`,    true);
    if (r.props.includes('lockers')) await pixflux(r.lockers, 32, 32, `${dir}/prop-lockers.png`, true);
  }
  console.log('\n✓ All regions generated.');
}

run();
