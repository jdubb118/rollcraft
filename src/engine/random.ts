// Simple random utilities for the game

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollIVs() {
  return {
    str: randInt(0, 15),
    tec: randInt(0, 15),
    tgh: randInt(0, 15),
    flx: randInt(0, 15),
    spd: randInt(0, 15),
    end: randInt(0, 15),
  };
}

export function damageRandom(): number {
  return 0.85 + Math.random() * 0.15; // 0.85 to 1.00
}
