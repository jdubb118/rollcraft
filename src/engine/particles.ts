export type ParticleKind =
  | 'dust'        // small round fade-out, gravity
  | 'spark'       // bright star burst, no gravity
  | 'streak'      // short-lived line (miss whiff)
  | 'ring'        // expanding ring pulse (submission)
  | 'float'       // upward floating text
  | 'ambient';    // slow-drift ambient (fireflies, snow, etc.)

export interface Particle {
  active: boolean;
  x: number; y: number;
  vx: number; vy: number;
  life: number;       // seconds remaining
  maxLife: number;    // seconds total
  size: number;
  color: string;
  kind: ParticleKind;
  gravity: number;    // px/s^2
  text?: string;      // for 'float' kind
}

export interface ParticleSystem {
  particles: Particle[];
  capacity: number;
  update(dt: number, bounds?: { w: number; h: number }): void;
  render(ctx: CanvasRenderingContext2D): void;
  spawn(p: Partial<Particle> & { x: number; y: number; kind: ParticleKind }): Particle | null;
  spawnBurst(kind: ParticleKind, x: number, y: number, count: number, opts?: Partial<Particle>): void;
  clear(): void;
  activeCount(): number;
}

function makeParticle(): Particle {
  return {
    active: false, x: 0, y: 0, vx: 0, vy: 0,
    life: 0, maxLife: 1, size: 1, color: '#fff',
    kind: 'dust', gravity: 0,
  };
}

export function createParticleSystem(capacity = 80): ParticleSystem {
  const particles: Particle[] = Array.from({ length: capacity }, makeParticle);

  function findFree(): Particle | null {
    for (const p of particles) if (!p.active) return p;
    return null;
  }

  return {
    particles,
    capacity,

    spawn(opts) {
      const p = findFree();
      if (!p) return null;
      p.active = true;
      p.x = opts.x;
      p.y = opts.y;
      p.vx = opts.vx ?? 0;
      p.vy = opts.vy ?? 0;
      p.maxLife = opts.maxLife ?? 0.6;
      p.life = p.maxLife;
      p.size = opts.size ?? 2;
      p.color = opts.color ?? '#fff';
      p.kind = opts.kind;
      p.gravity = opts.gravity ?? 0;
      p.text = opts.text;
      return p;
    },

    spawnBurst(kind, x, y, count, opts = {}) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 60;
        this.spawn({
          x, y, kind,
          vx: Math.cos(angle) * speed + (opts.vx ?? 0),
          vy: Math.sin(angle) * speed + (opts.vy ?? 0),
          ...opts,
        });
      }
    },

    update(dt, bounds) {
      for (const p of particles) {
        if (!p.active) continue;
        p.life -= dt;
        if (p.life <= 0) { p.active = false; continue; }
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (bounds) {
          if (p.x < -8 || p.x > bounds.w + 8 || p.y < -8 || p.y > bounds.h + 8) {
            p.active = false;
          }
        }
      }
    },

    render(ctx) {
      ctx.save();
      for (const p of particles) {
        if (!p.active) continue;
        const t = p.life / p.maxLife;
        const alpha = Math.max(0, Math.min(1, t));
        ctx.globalAlpha = alpha;

        switch (p.kind) {
          case 'dust':
          case 'ambient': {
            ctx.fillStyle = p.color;
            const s = Math.max(1, Math.round(p.size * (0.5 + t * 0.5)));
            ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
            break;
          }
          case 'spark': {
            ctx.fillStyle = p.color;
            const s = Math.max(1, Math.round(p.size));
            // cross-shape spark
            ctx.fillRect(Math.round(p.x) - s, Math.round(p.y), s * 2 + 1, 1);
            ctx.fillRect(Math.round(p.x), Math.round(p.y) - s, 1, s * 2 + 1);
            break;
          }
          case 'streak': {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(Math.round(p.x), Math.round(p.y));
            ctx.lineTo(Math.round(p.x - p.vx * 0.05), Math.round(p.y - p.vy * 0.05));
            ctx.stroke();
            break;
          }
          case 'ring': {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1;
            const r = p.size * (1 - t) * 3;
            ctx.beginPath();
            ctx.arc(Math.round(p.x), Math.round(p.y), r, 0, Math.PI * 2);
            ctx.stroke();
            break;
          }
          case 'float': {
            ctx.fillStyle = p.color;
            ctx.font = `${Math.max(6, p.size)}px "Press Start 2P", monospace`;
            ctx.textBaseline = 'top';
            ctx.fillText(p.text ?? '', Math.round(p.x), Math.round(p.y));
            break;
          }
        }
      }
      ctx.restore();
    },

    clear() {
      for (const p of particles) p.active = false;
    },

    activeCount() {
      let n = 0;
      for (const p of particles) if (p.active) n++;
      return n;
    },
  };
}
