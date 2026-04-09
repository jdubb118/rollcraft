import type { NPCDef } from '../overworldTypes';
import { STARTER_GYM, PLAYER_SPAWN, STARTER_GYM_NPCS } from './starterGym';
import { SCRAMBLE_VALLEY_MAP, SCRAMBLE_VALLEY_SPAWN, SCRAMBLE_VALLEY_NPCS } from './scrambleValley';
import { OLD_TOWN_MAP, OLD_TOWN_SPAWN, OLD_TOWN_NPCS } from './oldTown';
import { STEEL_MOUNTAIN_MAP, STEEL_MOUNTAIN_SPAWN, STEEL_MOUNTAIN_NPCS } from './steelMountain';
import { CORAL_BAY_MAP, CORAL_BAY_SPAWN, CORAL_BAY_NPCS } from './coralBay';
import { SAMBO_DISTRICT_MAP, SAMBO_DISTRICT_SPAWN, SAMBO_DISTRICT_NPCS } from './samboDistrict';
import { NOVA_CAMP_MAP, NOVA_CAMP_SPAWN, NOVA_CAMP_NPCS } from './novaCamp';
import { IRON_COAST_MAP, IRON_COAST_SPAWN, IRON_COAST_NPCS } from './ironCoast';
import { SUMMIT_CITY_MAP, SUMMIT_CITY_SPAWN, SUMMIT_CITY_NPCS } from './summitCity';

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
  'sambo-district': {
    tileMap: SAMBO_DISTRICT_MAP, playerSpawn: SAMBO_DISTRICT_SPAWN, npcs: SAMBO_DISTRICT_NPCS,
    exits: [
      { col: 9, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
      { col: 10, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
    ],
    dropInFee: 60,
  },
  'nova-camp': {
    tileMap: NOVA_CAMP_MAP, playerSpawn: NOVA_CAMP_SPAWN, npcs: NOVA_CAMP_NPCS,
    exits: [
      { col: 9, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
      { col: 10, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
    ],
    dropInFee: 80,
  },
  'iron-coast': {
    tileMap: IRON_COAST_MAP, playerSpawn: IRON_COAST_SPAWN, npcs: IRON_COAST_NPCS,
    exits: [
      { col: 9, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
      { col: 10, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
    ],
    dropInFee: 100,
  },
  'summit-city': {
    tileMap: SUMMIT_CITY_MAP, playerSpawn: SUMMIT_CITY_SPAWN, npcs: SUMMIT_CITY_NPCS,
    exits: [
      { col: 9, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
      { col: 10, row: 14, targetRegion: '__world_map__', targetCol: 0, targetRow: 0 },
    ],
    dropInFee: 0, // World Championship venue — free entry
  },
};

export function getRegionMap(regionId: string): RegionMap | undefined {
  return REGION_MAPS[regionId];
}
