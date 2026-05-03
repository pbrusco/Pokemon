import type { Tile } from '../../types';

type VoxelKind = 'floor' | 'wall' | 'object' | 'water';

interface VoxelDef {
  kind: VoxelKind;
  height: number;
  yOffset?: number;
  color: string;
  extras?: VoxelDef[];
  textureKey?: string;
  emissive?: string;
  emissiveIntensity?: number;
  signpost?: boolean;
}

export const FLOOR_FALLBACK_COLOR = '#5fa85a';

export const TILE_VOXEL: Record<Tile['type'], VoxelDef> = {
  grass:       { kind: 'floor',  height: 0,    color: '#5fa85a', textureKey: 'grass',
                 extras: [{ kind: 'object', height: 0.28, yOffset: 0, color: '#3d8a30', textureKey: 'grass_blade' }] },
  path:        { kind: 'floor',  height: 0,    color: '#d8c890', textureKey: 'path' },
  floor:       { kind: 'floor',  height: 0,    color: '#c8a878', textureKey: 'floor' },
  carpet:      { kind: 'floor',  height: 0,    color: '#c84848', textureKey: 'carpet' },
  door:        { kind: 'floor',  height: 0,    color: '#704018', emissive: '#1a0800', emissiveIntensity: 0.4 },
  wall:        { kind: 'wall',   height: 1.5,  color: '#909090', textureKey: 'wall' },
  tree:        { kind: 'object', height: 0.7,  color: '#5c3a21', textureKey: 'trunk',
                 extras: [{ kind: 'object', height: 1.2, yOffset: 0.7, color: '#2f7a3a', textureKey: 'canopy' }] },
  cut_tree:    { kind: 'object', height: 0.4,  color: '#7a5a3a', textureKey: 'trunk' },
  bookshelf:   { kind: 'object', height: 1.4,  color: '#6b3a1a' },
  table:       { kind: 'object', height: 0.5,  color: '#a0683a' },
  boulder:     { kind: 'object', height: 0.8,  color: '#7a7a78' },
  machine:     { kind: 'object', height: 1.3,  color: '#4a4a78' },
  fence:       { kind: 'object', height: 0.6,  color: '#8b6a3a' },
  sign:        { kind: 'object', height: 0.55, color: '#8b6914', signpost: true,
                  extras: [{ kind: 'object', height: 0.22, yOffset: 0.55, color: '#d4a850', signpost: true }] },
  flower:      { kind: 'object', height: 0.15, color: '#e84a8a' },
  water:       { kind: 'water',  height: 0.05, color: '#3a78d8', textureKey: 'water' },
  ledge_down:  { kind: 'object', height: 0.25, color: '#6a8a4a' },
  ledge_left:  { kind: 'object', height: 0.25, color: '#6a8a4a' },
  ledge_right: { kind: 'object', height: 0.25, color: '#6a8a4a' },
};
