/**
 * Random mat encounters — triggered when walking around the overworld.
 * Like wild Pokemon encounters but BJJ-themed.
 */
import type { Grappler, Belt, Style, Frame } from '../engine/types';
import { ARCHETYPES } from './archetypes';
import { rollIVs } from '../engine/random';

const ENCOUNTER_NAMES = [
  'Alex', 'Sam', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Dakota', 'Quinn',
  'Avery', 'Drew', 'Reese', 'Skyler', 'Tatum', 'Sage', 'Rowan', 'Blair',
  'Emery', 'Finley', 'Harley', 'Jude', 'Lane', 'Micah', 'Noel', 'Phoenix',
];

const ENCOUNTER_LINES = [
  "Hey, wanna roll?",
  "I need a training partner. You in?",
  "You look like you know what you're doing.",
  "Quick 5-minute round?",
  "I've been drilling all day. Let's test it live.",
  "New face! Let's see what you got.",
  "I saw your last match. Impressive. Roll?",
  "My coach said to find someone new to train with.",
];

const STYLE_FRAME: Record<Style, Frame> = {
  'wrestler': 'heavy', 'judoka': 'heavy', 'pressure-passer': 'heavy',
  'guard-player': 'light', 'leg-locker': 'light', 'berimbolo': 'light',
  'sub-hunter': 'medium', 'controller': 'medium',
};

const BELT_EV_BUDGET: Record<Belt, number> = {
  white: 40, blue: 100, purple: 180, brown: 280, black: 380,
};

const BELT_XP_MID: Record<Belt, number> = {
  white: 400, blue: 2000, purple: 6000, brown: 14000, black: 28000,
};

/**
 * Generate a random encounter opponent scaled to the player's level.
 * Opponents are slightly weaker than the player (beatable but not trivial).
 */
export function generateRandomOpponent(playerBelt: Belt, _playerXp?: number): {
  opponent: Grappler;
  greeting: string;
} {
  const arch = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
  const name = ENCOUNTER_NAMES[Math.floor(Math.random() * ENCOUNTER_NAMES.length)];
  const greeting = ENCOUNTER_LINES[Math.floor(Math.random() * ENCOUNTER_LINES.length)];

  // Match player's belt but slightly weaker
  const belt = playerBelt;
  const evBudget = Math.floor(BELT_EV_BUDGET[belt] * (0.6 + Math.random() * 0.4));

  // Distribute EVs toward archetype's strengths
  const evs = { str: 0, tec: 0, tgh: 0, flx: 0, spd: 0, end: 0 };
  const statKeys = Object.keys(evs) as (keyof typeof evs)[];
  let remaining = evBudget;
  const sorted = [...statKeys].sort((a, b) => (arch.baseStats as any)[b] - (arch.baseStats as any)[a]);
  for (let i = 0; i < sorted.length && remaining > 0; i++) {
    const alloc = Math.min(remaining, Math.floor(evBudget * (i === 0 ? 0.3 : i === 1 ? 0.25 : 0.1)));
    evs[sorted[i]] = Math.min(252, alloc);
    remaining -= alloc;
  }

  const belts: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];
  const beltIdx = belts.indexOf(belt);
  const moveCount = 4 + beltIdx;

  return {
    opponent: {
      id: `random-${Date.now()}`,
      name,
      style: arch.style,
      belt,
      xp: BELT_XP_MID[belt] * (0.5 + Math.random() * 0.5),
      baseStats: { ...arch.baseStats },
      ivs: rollIVs(),
      evs,
      moves: arch.startingMoves.slice(0, moveCount),
      learnedMoves: [...arch.startingMoves], moveXp: {},
      frame: STYLE_FRAME[arch.style],
    },
    greeting,
  };
}

/**
 * Should a random encounter trigger? ~8% chance per stop on mat tiles.
 */
export function shouldTriggerEncounter(): boolean {
  return Math.random() < 0.08;
}
