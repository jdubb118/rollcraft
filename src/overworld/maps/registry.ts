import type { NPCDef } from '../overworldTypes';
import { STARTER_GYM, PLAYER_SPAWN, STARTER_GYM_NPCS } from './starterGym';
import { SCRAMBLE_VALLEY_MAP, SCRAMBLE_VALLEY_SPAWN, SCRAMBLE_VALLEY_NPCS } from './scrambleValley';
import { OLD_TOWN_MAP, OLD_TOWN_SPAWN, OLD_TOWN_NPCS } from './oldTown';
import { STEEL_MOUNTAIN_MAP, STEEL_MOUNTAIN_SPAWN, STEEL_MOUNTAIN_NPCS } from './steelMountain';
import { CORAL_BAY_MAP, CORAL_BAY_SPAWN, CORAL_BAY_NPCS } from './coralBay';

export interface RegionMap {
  tileMap: number[][];
  playerSpawn: { col: number; row: number };
  npcs: NPCDef[];
  // Exit tiles — when player steps on these, transition to another region
  exits: { col: number; row: number; targetRegion: string; targetCol: number; targetRow: number }[];
  dropInFee: number; // 0 for home gym
  matColor?: string; // custom mat color per gym
}

export const REGION_MAPS: Record<string, RegionMap> = {
  home: {
    tileMap: STARTER_GYM,
    playerSpawn: PLAYER_SPAWN,
    npcs: STARTER_GYM_NPCS,
    exits: [
      // Door at bottom leads to world map
      { col: 9, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
      { col: 10, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
    ],
    dropInFee: 0,
  },
  'scramble-valley': {
    tileMap: SCRAMBLE_VALLEY_MAP,
    playerSpawn: SCRAMBLE_VALLEY_SPAWN,
    npcs: SCRAMBLE_VALLEY_NPCS,
    exits: [
      { col: 9, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
      { col: 10, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
    ],
    dropInFee: 20,
    matColor: '#0a4a4a', // teal-tinted mats
  },
  'old-town': {
    tileMap: OLD_TOWN_MAP,
    playerSpawn: OLD_TOWN_SPAWN,
    npcs: OLD_TOWN_NPCS,
    exits: [
      { col: 9, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
      { col: 10, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
    ],
    dropInFee: 30,
  },
  'steel-mountain': {
    tileMap: STEEL_MOUNTAIN_MAP,
    playerSpawn: STEEL_MOUNTAIN_SPAWN,
    npcs: STEEL_MOUNTAIN_NPCS,
    exits: [
      { col: 9, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
      { col: 10, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
    ],
    dropInFee: 40,
  },
  'coral-bay': {
    tileMap: CORAL_BAY_MAP,
    playerSpawn: CORAL_BAY_SPAWN,
    npcs: CORAL_BAY_NPCS,
    exits: [
      { col: 9, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
      { col: 10, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
    ],
    dropInFee: 50,
  },
};

export function getRegionMap(regionId: string): RegionMap | undefined {
  return REGION_MAPS[regionId];
}
