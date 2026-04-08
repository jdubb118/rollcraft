// Tile types for the gym map
export const Tile = {
  VOID: 0,    // out of bounds
  WALL: 1,    // gym walls
  MAT: 2,     // green mat (battle zone)
  FLOOR: 3,   // wooden floor
  LOCKER: 4,  // locker area (solid)
  DESK: 5,    // interactable desk (solid)
  BOARD: 6,   // techniques board (solid, interactable)
  DOOR: 7,    // gym door / exit
} as const;

export type TileType = (typeof Tile)[keyof typeof Tile];

export function isSolid(tile: number): boolean {
  return tile === Tile.VOID || tile === Tile.WALL || tile === Tile.LOCKER || tile === Tile.DESK || tile === Tile.BOARD;
}

export function isInteractable(tile: number): boolean {
  return tile === Tile.BOARD || tile === Tile.DESK || tile === Tile.DOOR;
}

export const TILE_SIZE = 16; // pixels per tile

// Tile colors for rendering
export const TILE_COLORS: Record<number, string> = {
  [Tile.VOID]: '#0a0a14',
  [Tile.WALL]: '#2a2a3a',
  [Tile.MAT]: '#1a4a2a',
  [Tile.FLOOR]: '#8b7355',
  [Tile.LOCKER]: '#555566',
  [Tile.DESK]: '#4a3a2a',
  [Tile.BOARD]: '#3a3a5a',
  [Tile.DOOR]: '#6a5a3a',
};
