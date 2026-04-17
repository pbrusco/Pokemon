/**
 * Autotiler
 *
 * Converts a ParsedMap's semantic Tile[][] grid into three rendering layers
 * (ground, objects, overhead) of numeric tile IDs. Uses neighbor context to
 * select visual variants for walls, trees, etc.
 */

import { Tile } from '../../types';
import { T } from './tilesetGenerator';

export interface RenderLayers {
  ground:   number[][];
  objects:  number[][];
  overhead: number[][];
}

/** Deterministic pseudo-random from coordinates for tile variety */
function hash(x: number, y: number): number {
  return ((x * 374761393 + y * 668265263) >>> 0) % 1000;
}

function typeAt(grid: Tile[][], x: number, y: number): string {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[y]?.length) return '';
  return grid[y][x].type;
}

export function buildRenderLayers(grid: Tile[][]): RenderLayers {
  const h = grid.length;

  const ground:   number[][] = [];
  const objects:  number[][] = [];
  const overhead: number[][] = [];

  for (let y = 0; y < h; y++) {
    const row = grid[y];
    const gRow: number[] = [];
    const oRow: number[] = [];
    const hRow: number[] = [];

    for (let x = 0; x < row.length; x++) {
      const tile = grid[y][x];
      const above = typeAt(grid, x, y - 1);
      const below = typeAt(grid, x, y + 1);
      const left  = typeAt(grid, x - 1, y);
      const right = typeAt(grid, x + 1, y);

      let gid: number = T.EMPTY;
      let oid: number = T.EMPTY;
      let hid: number = T.EMPTY;

      switch (tile.type) {
        // ── Grass ──────────────────────────────────────────
        case 'grass':
          gid = hash(x, y) % 3 === 0 ? T.GRASS_ALT : T.GRASS;
          break;

        // ── Path ───────────────────────────────────────────
        case 'path':
          gid = hash(x, y) % 4 === 0 ? T.PATH_ALT : T.PATH;
          break;

        // ── Water ──────────────────────────────────────────
        case 'water':
          gid = hash(x, y) % 2 === 0 ? T.WATER : T.WATER_ALT;
          break;

        // ── Tree ───────────────────────────────────────────
        case 'tree': {
          // Ground is always grass under trees
          gid = hash(x, y) % 3 === 0 ? T.GRASS_ALT : T.GRASS;

          const belowIsTree = below === 'tree';
          const aboveIsTree = above === 'tree';

          if (!belowIsTree) {
            // Bottom edge of tree cluster → show trunk
            oid = T.TREE_TRUNK;
            // Canopy on overhead (rounded bottom edge)
            hid = T.TREE_CANOPY_BOT;
          } else if (!aboveIsTree) {
            // Top of tree cluster → dense canopy on overhead
            hid = T.TREE_CANOPY;
          } else {
            // Interior tree → dense canopy
            hid = T.TREE_CANOPY;
          }
          break;
        }

        // ── Wall (building exterior) ──────────────────────
        case 'wall': {
          const aboveIsBuilding = above === 'wall' || above === 'door';
          const belowIsBuilding = below === 'wall' || below === 'door';
          const leftIsBuilding  = left === 'wall' || left === 'door';
          const rightIsBuilding = right === 'wall' || right === 'door';

          if (!aboveIsBuilding) {
            // Top row of building → roof tiles
            if (!leftIsBuilding) {
              gid = T.ROOF_L;
            } else if (!rightIsBuilding) {
              gid = T.ROOF_R;
            } else {
              gid = T.ROOF_M;
            }
          } else if (!belowIsBuilding) {
            // Bottom row (not door row) → plain wall
            gid = T.WALL;
          } else {
            // Middle row — check if this could be a window
            // Window on middle rows of buildings wider than 2 tiles
            const isMiddleColumn = leftIsBuilding && rightIsBuilding;
            const isTallEnough = aboveIsBuilding && belowIsBuilding;
            if (isMiddleColumn && isTallEnough && hash(x, y) % 3 === 0) {
              gid = T.WALL_WINDOW;
            } else {
              gid = T.WALL;
            }
          }
          break;
        }

        // ── Door ───────────────────────────────────────────
        case 'door':
          gid = T.DOOR;
          break;

        // ── Floor ──────────────────────────────────────────
        case 'floor':
          gid = (x + y) % 2 === 0 ? T.FLOOR_A : T.FLOOR_B;
          break;

        // ── Carpet ─────────────────────────────────────────
        case 'carpet':
          gid = T.CARPET;
          break;

        // ── Table ──────────────────────────────────────────
        case 'table':
          gid = (x + y) % 2 === 0 ? T.FLOOR_A : T.FLOOR_B;
          oid = T.TABLE;
          break;

        // ── Sign ───────────────────────────────────────────
        case 'sign':
          gid = T.PATH;
          oid = T.SIGN_OBJ;
          break;

        // ── Bookshelf ──────────────────────────────────────
        case 'bookshelf':
          gid = (x + y) % 2 === 0 ? T.FLOOR_A : T.FLOOR_B;
          oid = T.BOOKSHELF;
          break;

        // ── Machine ────────────────────────────────────────
        case 'machine':
          gid = (x + y) % 2 === 0 ? T.FLOOR_A : T.FLOOR_B;
          oid = T.MACHINE;
          break;

        // ── Boulder ────────────────────────────────────────
        case 'boulder':
          gid = T.PATH;
          oid = T.BOULDER_OBJ;
          break;

        // ── Cut Tree ───────────────────────────────────────
        case 'cut_tree':
          gid = hash(x, y) % 3 === 0 ? T.GRASS_ALT : T.GRASS;
          oid = T.CUT_TREE_OBJ;
          break;

        // ── Fence ──────────────────────────────────────────
        case 'fence':
          gid = hash(x, y) % 3 === 0 ? T.GRASS_ALT : T.GRASS;
          oid = T.FENCE;
          break;

        // ── Flower ─────────────────────────────────────────
        case 'flower':
          gid = T.FLOWER;
          break;

        default:
          gid = T.PATH;
          break;
      }

      gRow.push(gid);
      oRow.push(oid);
      hRow.push(hid);
    }

    ground.push(gRow);
    objects.push(oRow);
    overhead.push(hRow);
  }

  return { ground, objects, overhead };
}
