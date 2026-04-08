import type { Style, Belt } from '../engine/types';
import { STYLE_COLORS } from '../engine/constants';

// Belt colors for sprite rendering
const BELT_SPRITE_COLORS: Record<Belt, string> = {
  white: '#ffffff',
  blue: '#2563eb',
  purple: '#7c3aed',
  brown: '#8b4513',
  black: '#1a1a1a',
};

// 12x16 pixel grappler sprite (simplified gi figure)
// '' = transparent, any other string = hex color
function createGrapplerSprite(giColor: string, beltColor: string): string[][] {
  const S = giColor;         // gi body
  const B = beltColor;       // belt
  const H = '#ffd5b0';       // skin
  const K = '#1a1a1a';       // hair/outline
  const W = '#ffffff';       // gi lapel
  const _ = '';              // transparent

  return [
    [_, _, _, _, K, K, K, K, _, _, _, _],
    [_, _, _, K, H, H, H, H, K, _, _, _],
    [_, _, _, K, H, K, H, K, H, K, _, _],
    [_, _, _, K, H, H, H, H, K, _, _, _],
    [_, _, _, _, K, H, H, K, _, _, _, _],
    [_, _, K, S, S, S, S, S, S, K, _, _],
    [_, K, S, S, W, S, S, W, S, S, K, _],
    [_, K, S, S, B, B, B, B, S, S, K, _],
    [_, K, S, S, S, S, S, S, S, S, K, _],
    [_, _, K, S, S, S, S, S, S, K, _, _],
    [_, _, _, K, S, _, _, S, K, _, _, _],
    [_, _, K, H, K, _, _, K, H, K, _, _],
    [_, _, K, S, K, _, _, K, S, K, _, _],
    [_, _, K, S, K, _, _, K, S, K, _, _],
    [_, _, K, K, K, _, _, K, K, K, _, _],
    [_, _, K, K, _, _, _, _, K, K, _, _],
  ];
}

const spriteCache = new Map<string, HTMLCanvasElement>();

function renderSprite(pixels: string[][], scale: number): HTMLCanvasElement {
  const w = pixels[0].length;
  const h = pixels.length;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pixels[y][x]) {
        ctx.fillStyle = pixels[y][x];
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
  return canvas;
}

// Get sprite by style (uses style color for gi — used for NPCs/opponents)
export function getGrapplerSprite(style: Style, scale: number, belt: Belt = 'white'): HTMLCanvasElement {
  const key = `style-${style}-${belt}-${scale}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const giColor = STYLE_COLORS[style];
  const beltColor = BELT_SPRITE_COLORS[belt];
  const pixels = createGrapplerSprite(giColor, beltColor);
  const canvas = renderSprite(pixels, scale);
  spriteCache.set(key, canvas);
  return canvas;
}

// Get sprite by gi color (used for player — gi color chosen at creation)
export function getPlayerSprite(giColor: string, scale: number, belt: Belt = 'white'): HTMLCanvasElement {
  const key = `player-${giColor}-${belt}-${scale}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const beltColor = BELT_SPRITE_COLORS[belt];
  const pixels = createGrapplerSprite(giColor, beltColor);
  const canvas = renderSprite(pixels, scale);
  spriteCache.set(key, canvas);
  return canvas;
}

// Sprite dimensions
export const SPRITE_W = 12;
export const SPRITE_H = 16;
