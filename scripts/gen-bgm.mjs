// Generative chiptune BGM — 9 region loops, written as WAV then encoded to OGG
// via ffmpeg. Pure synthesis (square lead, triangle bass, noise hats) with
// strict guardrails: pentatonic/modal melodies over fixed progressions, AABA
// motif structure, conservative mix. The failure mode is "simple", not "bad".
//
// Run: node scripts/gen-bgm.mjs   (writes public/audio/bgm/*.ogg)
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { execSync } from 'child_process';

const SR = 44100;
mkdirSync('public/audio/bgm', { recursive: true });

// ── tiny seeded PRNG so regeneration is stable per region ──
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOTE = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// scale degrees (semitones from root)
const SCALES = {
  majorPent: [0, 2, 4, 7, 9],
  minorPent: [0, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
};

// chord progressions as scale-root offsets (semitones from key root)
const PROGRESSIONS = {
  warm:     [0, -3, 5, 7],      // I - vi - IV - V flavored
  heroic:   [0, 5, -3, 7],
  dark:     [0, 0, -4, -2],
  drive:    [0, -2, -4, -2],
  breezy:   [0, 7, 5, 7],
};

const REGIONS = [
  { id: 'home',     root: 60, scale: 'majorPent',    prog: 'warm',   bpm: 92,  mood: 'warm' },
  { id: 'scramble', root: 62, scale: 'dorian',       prog: 'breezy', bpm: 118, mood: 'bright' },
  { id: 'oldtown',  root: 57, scale: 'minorPent',    prog: 'warm',   bpm: 80,  mood: 'sparse' },
  { id: 'steel',    root: 52, scale: 'naturalMinor', prog: 'drive',  bpm: 130, mood: 'drive' },
  { id: 'coral',    root: 55, scale: 'majorPent',    prog: 'breezy', bpm: 96,  mood: 'bright' },
  { id: 'sambo',    root: 54, scale: 'naturalMinor', prog: 'dark',   bpm: 108, mood: 'dark' },
  { id: 'nova',     root: 59, scale: 'dorian',       prog: 'drive',  bpm: 116, mood: 'synth' },
  { id: 'iron',     root: 49, scale: 'naturalMinor', prog: 'dark',   bpm: 122, mood: 'drive' },
  { id: 'summit',   root: 62, scale: 'majorPent',    prog: 'heroic', bpm: 104, mood: 'anthem' },
];

// ── voices ──
function square(t, f, duty = 0.5) {
  return (t * f) % 1 < duty ? 1 : -1;
}
function triangle(t, f) {
  const p = (t * f) % 1;
  return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
}
let noiseState = 12345;
function noise() {
  noiseState = (noiseState * 1103515245 + 12345) & 0x7fffffff;
  return (noiseState / 0x3fffffff) - 1;
}

function synthLoop(region) {
  const rand = mulberry32(region.root * 7919 + region.bpm);
  const beat = 60 / region.bpm;       // seconds per beat
  const bars = 8;
  const total = Math.round(bars * 4 * beat * SR);
  const buf = new Float32Array(total);
  const scale = SCALES[region.scale];
  const prog = PROGRESSIONS[region.prog];

  const degToMidi = (deg, octave = 0) => {
    const idx = ((deg % scale.length) + scale.length) % scale.length;
    const oct = Math.floor(deg / scale.length) + octave;
    return region.root + scale[idx] + oct * 12;
  };

  // ── melody: 2-bar motif, structure A A B A (with light variation) ──
  const eighthsPerBar = 8;
  const makeMotif = () => {
    const motif = [];
    let deg = Math.floor(rand() * 3); // start near root
    for (let i = 0; i < eighthsPerBar * 2; i++) {
      const rest = rand() < (region.mood === 'sparse' ? 0.45 : 0.25);
      const hold = rand() < 0.3;
      if (!rest && !hold) {
        const step = [-2, -1, -1, 0, 1, 1, 2][Math.floor(rand() * 7)];
        deg = Math.max(-2, Math.min(scale.length + 4, deg + step));
      }
      motif.push(rest ? null : hold && motif.length ? motif[motif.length - 1] : deg);
    }
    return motif;
  };
  const A = makeMotif();
  const B = makeMotif();
  const phrase = [...A, ...A, ...B, ...A];

  // render helpers — write a note with a soft envelope
  const writeNote = (startSec, durSec, freq, voice, vol, duty) => {
    const s0 = Math.floor(startSec * SR);
    const n = Math.floor(durSec * SR);
    for (let i = 0; i < n; i++) {
      const idx = s0 + i;
      if (idx >= total) break;
      const t = i / SR;
      const env = Math.min(1, i / (0.008 * SR)) * Math.exp(-t * 3.2);
      const sample = voice === 'sq' ? square(t, freq, duty) : triangle(t, freq);
      buf[idx] += sample * env * vol;
    }
  };

  // ── lead (square, quiet, slight duty character per mood) ──
  const duty = region.mood === 'dark' ? 0.25 : region.mood === 'synth' ? 0.125 : 0.5;
  const leadVol = region.mood === 'sparse' ? 0.10 : 0.13;
  for (let i = 0; i < phrase.length; i++) {
    const deg = phrase[i];
    if (deg === null) continue;
    const tSec = i * beat / 2;
    writeNote(tSec, beat / 2 * 0.92, NOTE(degToMidi(deg, 1)), 'sq', leadVol, duty);
  }

  // ── bass (triangle): root/fifth following the progression, per half-bar ──
  for (let bar = 0; bar < bars; bar++) {
    const chordRoot = region.root - 12 + prog[bar % prog.length];
    for (let half = 0; half < 2; half++) {
      const tSec = (bar * 4 + half * 2) * beat;
      const note = half === 0 ? chordRoot : chordRoot + 7;
      writeNote(tSec, beat * 1.8, NOTE(note - 12), 'tri', 0.16);
    }
  }

  // ── hats (noise ticks on offbeats; kick-ish thump on downbeats for drive moods) ──
  for (let b = 0; b < bars * 4; b++) {
    const tSec = b * beat;
    // offbeat tick
    const tick0 = Math.floor((tSec + beat / 2) * SR);
    for (let i = 0; i < SR * 0.018; i++) {
      const idx = tick0 + i;
      if (idx >= total) break;
      buf[idx] += noise() * 0.05 * Math.exp(-i / (SR * 0.006));
    }
    if (region.mood === 'drive' || region.mood === 'anthem') {
      const k0 = Math.floor(tSec * SR);
      for (let i = 0; i < SR * 0.05; i++) {
        const idx = k0 + i;
        if (idx >= total) break;
        const t = i / SR;
        buf[idx] += Math.sin(2 * Math.PI * (90 - t * 600) * t) * 0.18 * Math.exp(-t * 30);
      }
    }
  }

  // ── normalize to a polite peak ──
  let peak = 0;
  for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(buf[i]));
  const gain = peak > 0 ? 0.55 / peak : 1;

  // 16-bit PCM WAV
  const pcm = Buffer.alloc(44 + total * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + total * 2, 4); pcm.write('WAVE', 8);
  pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20);
  pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28);
  pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34);
  pcm.write('data', 36); pcm.writeUInt32LE(total * 2, 40);
  for (let i = 0; i < total; i++) {
    pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(buf[i] * gain * 32767))), 44 + i * 2);
  }
  return pcm;
}

for (const region of REGIONS) {
  const wavPath = `/tmp/gq-bgm-${region.id}.wav`;
  const mp3Path = `public/audio/bgm/${region.id}.mp3`;
  writeFileSync(wavPath, synthLoop(region));
  execSync(`ffmpeg -y -loglevel error -i ${wavPath} -c:a libmp3lame -q:a 5 ${mp3Path}`);
  rmSync(wavPath);
  console.log(`✓ ${mp3Path} (${region.bpm}bpm ${region.scale})`);
}
console.log('BGM done.');
