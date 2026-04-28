import { type Tile, type Position, type MapID, type Direction } from '../../types';
import { buildRenderLayers, type RenderLayers } from '../tileset/autotiler';

interface Warp {
  x: number;
  y: number;
  targetMap: MapID;
  targetPos: Position;
  targetDir?: Direction;
}

interface ParsedMap {
  tiles: Tile[][];
  warps: Warp[];
  /** Rendering layers – tile IDs resolved by the autotiler */
  layers: RenderLayers;
}

const TILE_LEGEND: Record<string, Tile> = {
  'T': { type: 'tree',   walkable: false },
  'G': { type: 'grass',  walkable: true  },
  'P': { type: 'path',   walkable: true  },
  'W': { type: 'wall',   walkable: false },
  'D': { type: 'door',   walkable: true  },
  'F': { type: 'floor',  walkable: true  },
  'C': { type: 'carpet', walkable: true  },
  'X': { type: 'table',  walkable: false },
  'S': { type: 'sign',   walkable: true  },
  'H': { type: 'cut_tree', walkable: false },
  'B': { type: 'boulder', walkable: false },
  '~': { type: 'water', walkable: false },
  'K': { type: 'bookshelf', walkable: false },
  'M': { type: 'machine', walkable: false },
  '+': { type: 'fence',  walkable: false },
  '*': { type: 'flower', walkable: true  },
  'L': { type: 'ledge_down',  walkable: false },
  '<': { type: 'ledge_left',  walkable: false },
  '>': { type: 'ledge_right', walkable: false },
};

const FALLBACK_TILE: Tile = { type: 'path', walkable: true };

export function parseTileMap(data: { rows: string[], warps?: Array<{ x: number; y: number; targetMap: string; targetPos: { x: number; y: number }; targetDir?: string }> }): ParsedMap {
  const tiles = data.rows.map(row =>
    row.split('').map(char => TILE_LEGEND[char] ?? FALLBACK_TILE)
  );

  const layers = buildRenderLayers(tiles);

  return {
    tiles,
    warps: (data.warps || []) as Warp[],
    layers,
  };
}