// AAA home-gym composite surfaces.
// Paint each tile-region as its OWN surface at native resolution — no tile
// repetition within a surface. Renderer stacks them at tile-grid coordinates
// so collision = visuals by construction.
//
// Home grid recap (see src/overworld/maps/starterGym.ts):
//   20×15 @ 16px = 320×240
//   Mat: cols 6-13, rows 1-12  → 128×192 surface
//   Interior (floor underlay): cols 1-18, rows 1-12  → 288×192 surface
//   Walls: outer ring + partial inner @ col 5/14  → 32×32 detailed tile
//   Lockers: cols 1-2, rows 11-12  → 32×32 prop sprite
//   Desk: col 17, row 3  → 16×16 prop
//   Board: col 2, row 1  → 16×16 prop

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

mkdirSync('public/sprites/scenes/home', { recursive: true });

async function pixflux(desc, w, h, filename, noBg = false) {
  console.log(`Gen ${w}×${h}: ${desc.substring(0, 70)}...`);
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
    console.log(`  ✗ Error: ${JSON.stringify(data).substring(0, 300)}`);
  }
}

// ── 1. MAT SURFACE (128×192) — the whole central BJJ mat, painted as one cohesive
//       image with rich puzzle-piece detail, subtle sweat variation, thin red edge.
//       NO tiling, NO grid lines, NO characters.
await pixflux(
  'top-down orthographic view of a brazilian jiu-jitsu training mat surface, bright kelly green color (#2da44e), visible puzzle-piece seams forming subtle interlocking pattern across the whole surface, thin dark red safety border stripe around the outer edge, subtle texture variation with slight sweat marks and scuff areas, worn but clean, hand-painted pixel art, HD-2D style, soft ambient lighting from above, NO grid lines, NO characters, NO furniture, NO text, empty mat surface only, fills entire image edge to edge',
  128, 192,
  'public/sprites/scenes/home/mat-surface.png'
);

// ── 2. FLOOR UNDERLAY (288×192) — full interior floor, gym hardwood planks, rich
//       detail, scuff marks near mat edges, subtle ambient warm light.
await pixflux(
  'top-down orthographic view of a martial arts gym hardwood floor, warm blonde maple planks running horizontally, visible plank seams with slight variation between boards, subtle scuff marks and foot traffic wear patterns, a few darker knots in the wood for natural detail, HD-2D painted pixel art, soft warm overhead lighting, NO grid lines, NO mat, NO characters, NO furniture, NO walls, empty hardwood floor only, fills entire image',
  288, 192,
  'public/sprites/scenes/home/floor-surface.png'
);

// ── 3. WALL TILE (32×32, drawn at 16×16) — dark stained wood paneling, rich detail.
//       Drawn top-down on each wall tile position. Can tile edge-to-edge.
await pixflux(
  'top-down orthographic view of dark stained wood wall paneling from above looking straight down, rich mahogany brown color with visible wood grain, subtle knots, vertical plank seams, deep shadow along one edge for depth, HD-2D painted pixel art, NO grid lines, NO characters, NO decorations, fills entire image, tileable edges',
  32, 32,
  'public/sprites/scenes/home/wall-tile.png'
);

// ── 4. LOCKER BANK (32×32, 2×2 tiles, transparent bg) — bottom-left corner at (1-2, 11-12).
await pixflux(
  'top-down orthographic view of gym metal locker bank, 4 lockers in 2x2 arrangement, grey steel with subtle blue tint, slight gaps between lockers, small vent slats on each locker door, locker handle visible, small label plates, gym equipment style, HD-2D painted pixel art, transparent background showing gym floor through gaps at locker corners, soft shadow cast to the lower-right',
  32, 32,
  'public/sprites/scenes/home/prop-lockers.png',
  true
);

// ── 5. INSTRUCTOR DESK (16×16, transparent) — (col 17, row 3). Interactable.
await pixflux(
  'top-down orthographic view of small wooden instructor desk with a clipboard and stopwatch on top, dark mahogany wood surface, clipboard with paper visible, stopwatch with silver face, pen beside clipboard, HD-2D painted pixel art, transparent background, soft drop shadow cast to the lower-right',
  32, 32,
  'public/sprites/scenes/home/prop-desk.png',
  true
);

// ── 6. TECHNIQUES BOARD (16×16, transparent) — (col 2, row 1). Interactable.
await pixflux(
  'top-down orthographic view of a cork bulletin board mounted on floor (as if we are looking at it from above), cork surface with pushpins holding pinned papers and technique diagrams, sheets of paper with faint line drawings, wooden frame around the cork, HD-2D painted pixel art, transparent background, soft shadow cast to lower-right',
  32, 32,
  'public/sprites/scenes/home/prop-board.png',
  true
);

console.log('\n✓ Home surfaces generated. Review under public/sprites/scenes/home/');
