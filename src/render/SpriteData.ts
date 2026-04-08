import type { Style } from '../engine/types';
import { STYLE_COLORS } from '../engine/constants';

// 12x16 pixel grappler sprite (simplified gi figure)
// '' = transparent, any other string = hex color
function createGrapplerSprite(primaryColor: string, beltColor: string): string[][] {
  const S = primaryColor;   // gi/body
  const B = beltColor;      // belt
  const H = '#ffd5b0';      // skin
  const K = '#1a1a1a';      // hair/outline
  const W = '#ffffff';      // gi white parts
  const _ = '';             // transparent

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

export function getGrapplerSprite(style: Style, scale: number): HTMLCanvasElement {
  const key = `${style}-${scale}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const color = STYLE_COLORS[style];
  const beltColor = '#ffffff'; // white belt default
  const pixels = createGrapplerSprite(color, beltColor);

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

  spriteCache.set(key, canvas);
  return canvas;
}

// Sprite dimensions
export const SPRITE_W = 12;
export const SPRITE_H = 16;
