import type { Style } from './types';

export const MAX_DELTA_TIME_SEC = 0.1;

export const STYLE_COLORS: Record<Style, string> = {
  'wrestler': '#e74c3c',      // red
  'judoka': '#f39c12',        // orange
  'guard-player': '#2ecc71',  // green
  'pressure-passer': '#8e44ad', // purple
  'leg-locker': '#e67e22',    // dark orange
  'berimbolo': '#00bcd4',     // cyan
  'sub-hunter': '#e91e63',    // pink
  'controller': '#3498db',    // blue
};

export const STYLE_NAMES: Record<Style, string> = {
  'wrestler': 'Wrestler',
  'judoka': 'Judoka',
  'guard-player': 'Guard Player',
  'pressure-passer': 'Pressure Passer',
  'leg-locker': 'Leg Locker',
  'berimbolo': 'Berimbolo',
  'sub-hunter': 'Sub Hunter',
  'controller': 'Controller',
};

// Canvas dimensions (logical pixels, scaled by devicePixelRatio)
export const CANVAS_WIDTH = 320;
export const CANVAS_HEIGHT = 240;
export const SPRITE_SCALE = 3;
