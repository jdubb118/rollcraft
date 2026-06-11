import { Howl, Howler } from 'howler';
import { getEffectiveBgmVolume, getSettings } from './settings';

// Per-region BGM tracks — generative chiptune loops (scripts/gen-bgm.mjs).
// Missing files fail silently, so swapping in composed tracks later is a
// drop-in replacement.
const BGM_FILES: Record<string, string> = {
  'home':            '/audio/bgm/home.mp3',
  'scramble-valley': '/audio/bgm/scramble.mp3',
  'old-town':        '/audio/bgm/oldtown.mp3',
  'steel-mountain':  '/audio/bgm/steel.mp3',
  'coral-bay':       '/audio/bgm/coral.mp3',
  'sambo-district':  '/audio/bgm/sambo.mp3',
  'nova-camp':       '/audio/bgm/nova.mp3',
  'iron-coast':      '/audio/bgm/iron.mp3',
  'summit-city':     '/audio/bgm/summit.mp3',
};

interface Track { howl: Howl; id: number; url: string; }

const trackCache: Record<string, Howl> = {};
let current: Track | null = null;
let currentRegionId: string | null = null;
let duckLevel = 1.0; // multiplied into bgm volume when ducking
let fadeRafId: number | null = null;

function effBgm(): number {
  return getEffectiveBgmVolume() * duckLevel;
}

function loadTrack(url: string): Howl {
  if (trackCache[url]) return trackCache[url];
  const h = new Howl({
    src: [url],
    loop: true,
    volume: 0,
    html5: false,
    preload: true,
    onloaderror: () => { /* file missing — silent; expected before assets drop */ },
    onplayerror: () => { /* swallow */ },
  });
  trackCache[url] = h;
  return h;
}

function animate(setter: (v: number) => void, from: number, to: number, ms: number) {
  if (fadeRafId) cancelAnimationFrame(fadeRafId);
  const start = performance.now();
  const frame = (t: number) => {
    const k = Math.min(1, (t - start) / ms);
    setter(from + (to - from) * k);
    if (k < 1) fadeRafId = requestAnimationFrame(frame);
  };
  fadeRafId = requestAnimationFrame(frame);
}

export function playRegionBGM(regionId: string): void {
  if (currentRegionId === regionId) return;
  currentRegionId = regionId;
  const url = BGM_FILES[regionId];
  if (!url) { stopBGM(); return; }

  const next = loadTrack(url);
  const prev = current;
  const id = next.play();
  next.volume(0, id);

  // Fade in new
  const targetVol = effBgm();
  animate((v) => next.volume(v, id), 0, targetVol, 1500);

  // Fade out prev
  if (prev) {
    const prevId = prev.id;
    const prevHowl = prev.howl;
    const startVol = prevHowl.volume(prevId);
    animate((v) => prevHowl.volume(v, prevId), typeof startVol === 'number' ? startVol : targetVol, 0, 1200);
    setTimeout(() => prevHowl.stop(prevId), 1250);
  }

  current = { howl: next, id, url };
}

export function stopBGM(): void {
  if (current) {
    current.howl.stop(current.id);
    current = null;
  }
  currentRegionId = null;
}

export function duckBGM(): void {
  duckLevel = 0.4;
  if (current) animate((v) => current!.howl.volume(v, current!.id), current.howl.volume(current.id) as number, effBgm(), 180);
}

export function restoreBGM(): void {
  duckLevel = 1.0;
  if (current) animate((v) => current!.howl.volume(v, current!.id), current.howl.volume(current.id) as number, effBgm(), 300);
}

// Called by SettingsScreen on changes — pull in new master/bgm volumes.
export function refreshAudio(): void {
  const s = getSettings();
  Howler.mute(s.muted);
  if (current) {
    current.howl.volume(effBgm(), current.id);
  }
}
