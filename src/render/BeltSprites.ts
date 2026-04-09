/**
 * Belt Evolution Sprite System
 * Loads AI-generated PNG sprites for each belt level.
 * Falls back to programmatic sprites if images fail to load.
 */

import type { Belt } from '../engine/types';

const BELT_SPRITE_URLS: Record<Belt, string> = {
  white: '/sprites/belt-white.png',
  blue: '/sprites/belt-blue.png',
  purple: '/sprites/belt-purple.png',
  brown: '/sprites/belt-brown.png',
  black: '/sprites/belt-black.png',
};

// Cache loaded images
const spriteCache: Record<string, HTMLImageElement> = {};
const loadingPromises: Record<string, Promise<HTMLImageElement | null>> = {};

function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (spriteCache[url]) return Promise.resolve(spriteCache[url]);
  if (url in loadingPromises) return loadingPromises[url];

  loadingPromises[url] = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      spriteCache[url] = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

  return loadingPromises[url];
}

/**
 * Get the belt evolution sprite image (or null if not loaded yet).
 * Call this from render loops — it returns synchronously from cache.
 */
export function getBeltSprite(belt: Belt): HTMLImageElement | null {
  const url = BELT_SPRITE_URLS[belt];
  if (spriteCache[url]) return spriteCache[url];
  // Kick off async load
  loadImage(url);
  return null;
}

/**
 * Get a custom sprite from base64 data (stored on player).
 */
export function getCustomSprite(base64: string): HTMLImageElement | null {
  const key = `custom:${base64.substring(0, 32)}`;
  if (spriteCache[key]) return spriteCache[key];

  const img = new Image();
  img.src = `data:image/png;base64,${base64}`;
  img.onload = () => { spriteCache[key] = img; };
  return spriteCache[key] || null;
}

/**
 * Preload all belt sprites so they're ready when needed.
 */
export function preloadBeltSprites(): void {
  for (const url of Object.values(BELT_SPRITE_URLS)) {
    loadImage(url);
  }
}
