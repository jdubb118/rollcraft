/**
 * Grapple Quest Sound System
 * All sounds generated via Web Audio API — zero audio files needed.
 * Short synth tones that feel retro/pixel-art appropriate.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume: number = 0.15) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {}
}

function playSequence(notes: { freq: number; dur: number; delay: number }[], type: OscillatorType = 'square', vol = 0.12) {
  for (const n of notes) {
    setTimeout(() => playTone(n.freq, n.dur, type, vol), n.delay * 1000);
  }
}

// ── GAME SOUNDS ──

export function sfxHit() {
  // Quick punchy hit — low thud
  playTone(180, 0.08, 'square', 0.2);
  setTimeout(() => playTone(120, 0.06, 'sawtooth', 0.1), 30);
}

export function sfxCritical() {
  // Higher pitched double hit
  playTone(400, 0.06, 'square', 0.2);
  setTimeout(() => playTone(600, 0.08, 'square', 0.15), 60);
}

export function sfxMiss() {
  // Descending whoosh
  playTone(300, 0.12, 'sine', 0.08);
  setTimeout(() => playTone(150, 0.15, 'sine', 0.05), 50);
}

export function sfxSubmissionLock() {
  // Tense ascending tone
  playSequence([
    { freq: 200, dur: 0.15, delay: 0 },
    { freq: 280, dur: 0.15, delay: 0.12 },
    { freq: 350, dur: 0.2, delay: 0.24 },
  ], 'triangle', 0.12);
}

export function sfxTap() {
  // Victory sting — triumphant ascending
  playSequence([
    { freq: 523, dur: 0.12, delay: 0 },
    { freq: 659, dur: 0.12, delay: 0.1 },
    { freq: 784, dur: 0.3, delay: 0.2 },
  ], 'square', 0.15);
}

export function sfxLevelUp() {
  // Classic RPG level-up jingle
  playSequence([
    { freq: 523, dur: 0.1, delay: 0 },
    { freq: 587, dur: 0.1, delay: 0.08 },
    { freq: 659, dur: 0.1, delay: 0.16 },
    { freq: 784, dur: 0.1, delay: 0.24 },
    { freq: 1047, dur: 0.3, delay: 0.32 },
  ], 'square', 0.12);
}

export function sfxBeltPromotion() {
  // Majestic ascending fanfare
  playSequence([
    { freq: 262, dur: 0.2, delay: 0 },
    { freq: 330, dur: 0.2, delay: 0.2 },
    { freq: 392, dur: 0.2, delay: 0.4 },
    { freq: 523, dur: 0.15, delay: 0.6 },
    { freq: 659, dur: 0.15, delay: 0.72 },
    { freq: 784, dur: 0.5, delay: 0.84 },
  ], 'triangle', 0.15);
}

export function sfxMenuSelect() {
  // Quick blip
  playTone(800, 0.05, 'square', 0.08);
}

export function sfxMenuConfirm() {
  // Two-note confirm
  playTone(600, 0.06, 'square', 0.1);
  setTimeout(() => playTone(900, 0.08, 'square', 0.1), 60);
}

export function sfxPointsScored() {
  // Quick ascending triple
  playSequence([
    { freq: 440, dur: 0.06, delay: 0 },
    { freq: 554, dur: 0.06, delay: 0.06 },
    { freq: 659, dur: 0.1, delay: 0.12 },
  ], 'square', 0.1);
}

export function sfxTimeUp() {
  // Buzzer
  playTone(220, 0.4, 'sawtooth', 0.15);
}

export function sfxStunned() {
  // Disorienting wobble
  playSequence([
    { freq: 300, dur: 0.1, delay: 0 },
    { freq: 250, dur: 0.1, delay: 0.08 },
    { freq: 200, dur: 0.15, delay: 0.16 },
  ], 'sawtooth', 0.08);
}

export function sfxEscape() {
  // Quick upward escape
  playTone(350, 0.08, 'triangle', 0.1);
  setTimeout(() => playTone(500, 0.06, 'triangle', 0.08), 60);
}

// Initialize audio context on first user interaction
export function initAudio() {
  try {
    if (!ctx) ctx = new AudioContext();
  } catch {}
}
