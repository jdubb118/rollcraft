import type { Style } from '../engine/types';

// Style matchup chart: matchup[attacker][defender] = effectiveness multiplier
// 2.0 = super effective, 1.5 = strong, 1.0 = neutral, 0.5 = weak
export const STYLE_MATCHUP: Record<Style, Record<Style, number>> = {
  'wrestler': {
    'wrestler': 1.0, 'judoka': 1.5, 'guard-player': 0.5, 'pressure-passer': 1.0,
    'leg-locker': 0.5, 'berimbolo': 1.5, 'sub-hunter': 1.0, 'controller': 1.5,
  },
  'judoka': {
    'wrestler': 0.5, 'judoka': 1.0, 'guard-player': 1.5, 'pressure-passer': 0.5,
    'leg-locker': 1.0, 'berimbolo': 2.0, 'sub-hunter': 1.0, 'controller': 1.0,
  },
  'guard-player': {
    'wrestler': 2.0, 'judoka': 0.5, 'guard-player': 1.0, 'pressure-passer': 0.5,
    'leg-locker': 1.5, 'berimbolo': 1.0, 'sub-hunter': 1.5, 'controller': 1.0,
  },
  'pressure-passer': {
    'wrestler': 1.0, 'judoka': 1.5, 'guard-player': 2.0, 'pressure-passer': 1.0,
    'leg-locker': 1.0, 'berimbolo': 0.5, 'sub-hunter': 0.5, 'controller': 1.5,
  },
  'leg-locker': {
    'wrestler': 2.0, 'judoka': 1.0, 'guard-player': 0.5, 'pressure-passer': 1.0,
    'leg-locker': 1.0, 'berimbolo': 1.5, 'sub-hunter': 1.5, 'controller': 0.5,
  },
  'berimbolo': {
    'wrestler': 0.5, 'judoka': 0.5, 'guard-player': 1.0, 'pressure-passer': 2.0,
    'leg-locker': 0.5, 'berimbolo': 1.0, 'sub-hunter': 1.5, 'controller': 1.5,
  },
  'sub-hunter': {
    'wrestler': 1.0, 'judoka': 1.0, 'guard-player': 0.5, 'pressure-passer': 1.5,
    'leg-locker': 0.5, 'berimbolo': 0.5, 'sub-hunter': 1.0, 'controller': 2.0,
  },
  'controller': {
    'wrestler': 0.5, 'judoka': 1.0, 'guard-player': 1.0, 'pressure-passer': 0.5,
    'leg-locker': 2.0, 'berimbolo': 0.5, 'sub-hunter': 0.5, 'controller': 1.0,
  },
};

export function getStyleEffectiveness(attacker: Style, defender: Style): number {
  return STYLE_MATCHUP[attacker][defender];
}
