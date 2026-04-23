import type { ParticleSystem } from './particles';
import type { AmbientParticleKind } from './types';

interface AmbientConfig {
  cap: number;           // max concurrent ambient particles of this kind
  spawnPerSec: number;   // spawn attempts per second
  spawn: (ps: ParticleSystem, w: number, h: number) => void;
}

const CONFIGS: Record<AmbientParticleKind, AmbientConfig> = {
  fireflies: {
    cap: 8, spawnPerSec: 2,
    spawn(ps, w, h) {
      ps.spawn({
        kind: 'ambient',
        x: Math.random() * w,
        y: h * 0.4 + Math.random() * h * 0.5,
        vx: (Math.random() - 0.5) * 6,
        vy: -4 - Math.random() * 6,
        maxLife: 2 + Math.random() * 1.5,
        size: 1,
        color: Math.random() > 0.5 ? '#fff7a0' : '#c8ff80',
      });
    },
  },
  snow: {
    cap: 40, spawnPerSec: 18,
    spawn(ps, w) {
      ps.spawn({
        kind: 'ambient',
        x: Math.random() * w,
        y: -4,
        vx: (Math.random() - 0.5) * 8,
        vy: 14 + Math.random() * 10,
        maxLife: 3 + Math.random() * 2,
        size: Math.random() > 0.7 ? 2 : 1,
        color: '#ffffff',
      });
    },
  },
  dust: {
    cap: 18, spawnPerSec: 3,
    spawn(ps, w, h) {
      ps.spawn({
        kind: 'ambient',
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 3 + Math.random() * 4,
        vy: (Math.random() - 0.5) * 3,
        maxLife: 3 + Math.random() * 2,
        size: 1,
        color: '#d9c89c',
      });
    },
  },
  wavemist: {
    cap: 16, spawnPerSec: 5,
    spawn(ps, _w, h) {
      ps.spawn({
        kind: 'ambient',
        x: -4,
        y: h * 0.7 + Math.random() * h * 0.3,
        vx: 15 + Math.random() * 10,
        vy: (Math.random() - 0.5) * 3,
        maxLife: 2 + Math.random() * 1.5,
        size: 1,
        color: '#bfe7ff',
      });
    },
  },
  leaves: {
    cap: 10, spawnPerSec: 2,
    spawn(ps, w) {
      ps.spawn({
        kind: 'ambient',
        x: Math.random() * w,
        y: -4,
        vx: -4 + Math.random() * 8,
        vy: 10 + Math.random() * 6,
        maxLife: 4 + Math.random() * 2,
        size: 2,
        color: Math.random() > 0.5 ? '#88c070' : '#c9b054',
      });
    },
  },
  embers: {
    cap: 12, spawnPerSec: 4,
    spawn(ps, w, h) {
      ps.spawn({
        kind: 'ambient',
        x: Math.random() * w,
        y: h - 4,
        vx: (Math.random() - 0.5) * 6,
        vy: -18 - Math.random() * 10,
        maxLife: 1.5 + Math.random() * 1.2,
        size: 1,
        color: Math.random() > 0.5 ? '#ff9040' : '#ffd060',
      });
    },
  },
};

export interface AmbientState {
  kind: AmbientParticleKind | null;
  accumulator: number;
}

export function createAmbientState(): AmbientState {
  return { kind: null, accumulator: 0 };
}

export function tickAmbient(
  s: AmbientState,
  ps: ParticleSystem,
  dt: number,
  canvasW: number,
  canvasH: number,
): void {
  if (!s.kind) return;
  const cfg = CONFIGS[s.kind];
  if (!cfg) return;

  // Count active ambient particles to respect cap (counts *any* ambient-kind particle)
  let active = 0;
  for (const p of ps.particles) if (p.active && p.kind === 'ambient') active++;
  if (active >= cfg.cap) return;

  s.accumulator += dt * cfg.spawnPerSec;
  while (s.accumulator >= 1 && active < cfg.cap) {
    cfg.spawn(ps, canvasW, canvasH);
    s.accumulator -= 1;
    active++;
  }
}
