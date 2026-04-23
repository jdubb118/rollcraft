const SETTINGS_KEY = 'rollcraft-settings';

export interface Settings {
  modernVisuals: boolean;
  masterVolume: number; // 0–1
  sfxVolume: number;    // 0–1 (applied on top of master)
  bgmVolume: number;    // 0–1 (applied on top of master)
  muted: boolean;
}

const DEFAULTS: Settings = {
  modernVisuals: true,
  masterVolume: 0.7,
  sfxVolume: 1.0,
  bgmVolume: 0.8,
  muted: false,
};

let cache: Settings | null = null;

export function getSettings(): Settings {
  if (cache) return cache;
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) { cache = { ...DEFAULTS }; return cache; }
  try {
    cache = { ...DEFAULTS, ...JSON.parse(raw) };
    return cache!;
  } catch {
    cache = { ...DEFAULTS };
    return cache;
  }
}

export function saveSettings(updates: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...updates };
  cache = next;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function isModernVisuals(): boolean { return getSettings().modernVisuals; }
export function isMuted(): boolean { return getSettings().muted; }
export function getEffectiveSfxVolume(): number {
  const s = getSettings();
  return s.muted ? 0 : s.masterVolume * s.sfxVolume;
}
export function getEffectiveBgmVolume(): number {
  const s = getSettings();
  return s.muted ? 0 : s.masterVolume * s.bgmVolume;
}
