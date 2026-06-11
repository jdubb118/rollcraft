/**
 * Gyms — the Identity Engine client.
 * A gym is a shared entity: founded once, joined by link, every member's
 * sprite/belt/build on the roster, every win counted for the academy.
 * All writes go through /api/gym (service-role); reads too, so visitors
 * need zero Supabase config.
 */
import type { Belt, Grappler } from './types';
import { encodeBuild } from './challenge';
import { loadProgression } from '../state/saveLoad';
import { track } from './analytics';

const DEVICE_KEY = 'rollcraft-device-id';
const MY_GYM_KEY = 'rollcraft-my-gym';
const PENDING_GYM_KEY = 'rollcraft-pending-gym';

export interface GymInfo {
  id: string;
  name: string;
  wins: number;
  member_count: number;
  palette: { mat: string } | null;
  founder_device?: string;
  created_at?: string;
}

export interface GymMember {
  name: string;
  belt: Belt;
  style: string | null;
  sprite: string | null;   // base64 png
  build: string | null;    // challenge-encoded — fightable as a drop-in
  wins: number;
  member_key?: string;
}

export interface MyGym { gymId: string; gymName: string }

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getMyGym(): MyGym | null {
  try { return JSON.parse(localStorage.getItem(MY_GYM_KEY) || 'null'); } catch { return null; }
}

function setMyGym(gym: MyGym): void {
  localStorage.setItem(MY_GYM_KEY, JSON.stringify(gym));
}

async function api(body: Record<string, unknown>): Promise<any> {
  const res = await fetch('/api/gym', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, deviceId: getDeviceId() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `gym api ${res.status}`);
  return data;
}

export async function fetchGym(id: string): Promise<{ gym: GymInfo; members: GymMember[] }> {
  const res = await fetch(`/api/gym?id=${encodeURIComponent(id)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'gym not found');
  return data;
}

export async function fetchTopGyms(): Promise<GymInfo[]> {
  const res = await fetch('/api/gym?list=1');
  const data = await res.json().catch(() => ({ gyms: [] }));
  return data.gyms || [];
}

export async function createGym(name: string, matColor?: string): Promise<GymInfo> {
  const data = await api({ action: 'create', name, palette: matColor ? { mat: matColor } : null });
  setMyGym({ gymId: data.gym.id, gymName: data.gym.name });
  track('gym-created');
  return data.gym;
}

function memberPayload(player: Grappler) {
  const prog = loadProgression();
  return {
    name: player.name,
    belt: player.belt,
    style: player.style,
    sprite: player.customSprite && player.customSprite.length <= 24_000 ? player.customSprite : null,
    build: encodeBuild(player, { wins: prog.totalWins, losses: prog.totalLosses }),
  };
}

export async function joinGym(gymId: string, player: Grappler): Promise<GymInfo> {
  const data = await api({ action: 'join', gymId, ...memberPayload(player) });
  setMyGym({ gymId: data.gym.id, gymName: data.gym.name });
  clearPendingGym();
  track('gym-joined');
  return data.gym;
}

/** Fire-and-forget: keep the roster fresh after promotions / sprite changes / battles. */
export function syncGymMember(player: Grappler): void {
  const mine = getMyGym();
  if (!mine) return;
  api({ action: 'sync', gymId: mine.gymId, ...memberPayload(player) }).catch(() => {});
}

/** Fire-and-forget gym win (the new id-keyed system). */
export function recordGymWinV2(): void {
  const mine = getMyGym();
  if (!mine) return;
  api({ action: 'win', gymId: mine.gymId }).catch(() => {});
}

// ── Invite links: grapplequest.com/g/<slug> (also ?gym=<slug>) ──

export function gymUrl(gymId: string): string {
  return `${window.location.origin}/g/${gymId}`;
}

export function captureGymFromUrl(): void {
  try {
    const path = window.location.pathname;
    const m = path.match(/^\/g\/([a-z0-9-]{3,40})\/?$/);
    const param = new URLSearchParams(window.location.search).get('gym');
    const slug = m?.[1] || param;
    if (slug) {
      localStorage.setItem(PENDING_GYM_KEY, slug);
      window.history.replaceState(null, '', '/' + window.location.hash);
    }
  } catch { /* ignore */ }
}

export function getPendingGym(): string | null {
  return localStorage.getItem(PENDING_GYM_KEY);
}

export function clearPendingGym(): void {
  localStorage.removeItem(PENDING_GYM_KEY);
}
