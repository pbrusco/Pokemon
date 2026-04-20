/**
 * Tileset Generator
 *
 * Draws Fire-Red-style 16×16 pixel art tiles onto a canvas at init time,
 * then exposes the resulting image as a data-URL for use with
 * background-image / background-position rendering in GameTile.
 */

// ── Tile ID constants ─────────────────────────────────────────────
export const T = {
  EMPTY:           0,
  GRASS:           1,
  GRASS_ALT:       2,
  TALL_GRASS:      3,
  PATH:            4,
  PATH_ALT:        5,
  WATER:           6,
  WATER_ALT:       7,
  TREE_CANOPY:     8,
  TREE_CANOPY_BOT: 9,
  TREE_TRUNK:      10,
  ROOF_L:          11,
  ROOF_M:          12,
  ROOF_R:          13,
  WALL:            14,
  WALL_WINDOW:     15,
  DOOR:            16,
  FLOOR_A:         17,
  FLOOR_B:         18,
  CARPET:          19,
  TABLE:           20,
  BOOKSHELF:       21,
  MACHINE:         22,
  SIGN_OBJ:        23,
  BOULDER_OBJ:     24,
  CUT_TREE_OBJ:    25,
  GRASS_ON_PATH:   26,  // grass base shown under object tiles that sit on grass
  FLOOR_ON_TABLE:  27,  // floor base shown under table
  FENCE:           28,
  FLOWER:          29,
  LEDGE_DOWN:      30,
  LEDGE_LEFT:      31,
  LEDGE_RIGHT:     32,
} as const;

/** Source pixels per tile (before scaling) */
const TILE_PX = 16;
/** How many tile columns in the generated spritesheet */
export const TILESET_COLS = 8;
const TILESET_ROWS = 5; // 8×5 = 40 slots

// ── Palette ───────────────────────────────────────────────────────
const C = {
  // Grass
  GRASS:       '#88C858',
  GRASS_DK:    '#70A840',
  GRASS_LT:    '#98D868',
  // Tall grass
  TGRASS:      '#48A030',
  TGRASS_DK:   '#306820',
  TGRASS_LT:   '#60B848',
  // Path
  PATH:        '#D8C078',
  PATH_DK:     '#C0A858',
  PATH_LT:     '#E8D898',
  // Tree
  CANOPY:      '#389028',
  CANOPY_DK:   '#206818',
  CANOPY_LT:   '#50A840',
  TRUNK:       '#886030',
  TRUNK_DK:    '#704820',
  // Building
  ROOF:        '#C05038',
  ROOF_DK:     '#A03028',
  ROOF_LT:     '#D86850',
  WALL:        '#E8D8C0',
  WALL_DK:     '#D0C0A0',
  WALL_LT:     '#F8F0E0',
  // Water
  WATER:       '#5888C8',
  WATER_DK:    '#4070B0',
  WATER_LT:    '#70A8E8',
  // Interior
  FLOOR_LT:    '#F0E8D0',
  FLOOR_DK:    '#E0D0B8',
  CARPET:      '#C84040',
  CARPET_DK:   '#A83030',
  // Misc
  DOOR:        '#A06030',
  DOOR_DK:     '#804820',
  DOOR_LT:     '#B87840',
  SIGN:        '#D8B888',
  SIGN_DK:     '#B89868',
  TABLE:       '#C09858',
  TABLE_DK:    '#A88040',
  BOOK_R:      '#C04040',
  BOOK_B:      '#4060C0',
  BOOK_G:      '#40A060',
  BOOK_Y:      '#C0A030',
  SHELF:       '#6A4A2A',
  MACHINE_BG:  '#A0B0C0',
  MACHINE_DK:  '#7888A0',
  FENCE:       '#F0E0B0',
  FENCE_DK:    '#B89068',
  PETAL_R:     '#F06888',
  PETAL_LT:    '#F8A8C0',
  PETAL_Y:     '#F8D850',
  LED_G:       '#50D060',
  LED_R:       '#D05050',
  BOULDER:     '#989898',
  BOULDER_DK:  '#787878',
  BOULDER_LT:  '#B0B0B0',
  BLACK:       '#383838',
  WHITE:       '#F8F8F8',
  KNOB:        '#D8C020',
  TRANSPARENT: 'rgba(0,0,0,0)',
} as const;

// ── Helpers ───────────────────────────────────────────────────────
type Ctx = CanvasRenderingContext2D;

function px(ctx: Ctx, x: number, y: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

function fill(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, fill_c: string, border_c: string) {
  fill(ctx, x, y, w, h, border_c);
  fill(ctx, x + 1, y + 1, w - 2, h - 2, fill_c);
}

/** Origin (top-left) of tile slot in the sheet */
function origin(tileId: number): [number, number] {
  return [(tileId % TILESET_COLS) * TILE_PX, Math.floor(tileId / TILESET_COLS) * TILE_PX];
}

// ── Individual tile draw functions ────────────────────────────────

function drawGrass(ctx: Ctx, ox: number, oy: number) {
  // Base fill with subtle gradient for depth
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      // Slightly lighter at the top, darker at the bottom
      const grad = y < 5 ? C.GRASS_LT : y > 12 ? C.GRASS_DK : C.GRASS;
      px(ctx, ox + x, oy + y, grad);
    }
  }
  // Denser, more varied dark blades
  const dkBlades = [
    [3,2],[10,6],[6,11],[14,3],[1,8],[8,14],[12,10],[5,5],
    [2,5],[7,8],[13,12],[4,13],[11,4],[9,2],[0,10],[15,7]
  ];
  for (const [dx, dy] of dkBlades) px(ctx, ox+dx, oy+dy, C.GRASS_DK);
  // More highlights for lushness
  const ltBlades = [
    [8,3],[2,12],[13,8],[0,4],[11,1],[6,4],[10,13],[12,2],[4,7],[9,10]
  ];
  for (const [dx, dy] of ltBlades) px(ctx, ox+dx, oy+dy, C.GRASS_LT);
  // Add a few white sparkle pixels for extra vibrancy
  px(ctx, ox+7, oy+7, C.WHITE);
  px(ctx, ox+12, oy+5, C.WHITE);
}

function drawGrassAlt(ctx: Ctx, ox: number, oy: number) {
  // Base fill with subtle gradient for depth
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const grad = y < 5 ? C.GRASS_LT : y > 12 ? C.GRASS_DK : C.GRASS;
      px(ctx, ox + x, oy + y, grad);
    }
  }
  // Alternate dark blades
  const dkBlades = [
    [1,1],[7,4],[13,2],[4,9],[10,12],[2,15],[15,8],[9,0],
    [3,7],[12,6],[5,13],[8,11],[0,6],[14,13],[6,2],[11,14]
  ];
  for (const [dx, dy] of dkBlades) px(ctx, ox+dx, oy+dy, C.GRASS_DK);
  // Alternate highlights
  const ltBlades = [
    [5,6],[11,10],[3,13],[14,5],[0,10],[7,2],[12,9],[2,8],[10,4],[8,13]
  ];
  for (const [dx, dy] of ltBlades) px(ctx, ox+dx, oy+dy, C.GRASS_LT);
  // Add a few white sparkle pixels for extra vibrancy
  px(ctx, ox+5, oy+8, C.WHITE);
  px(ctx, ox+13, oy+3, C.WHITE);
}

function drawTallGrass(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.TGRASS);
  // Draw blade-like patterns: pairs of angled marks
  const blades: [number, number][] = [
    [2,1],[5,1],[9,1],[13,1],
    [0,5],[4,5],[7,5],[11,5],
    [2,9],[6,9],[10,9],[14,9],
    [1,13],[5,13],[8,13],[12,13],
  ];
  for (const [bx, by] of blades) {
    // Each blade: darker stem with lighter tip
    px(ctx, ox+bx, oy+by, C.TGRASS_LT);
    px(ctx, ox+bx, oy+by+1, C.TGRASS_DK);
    px(ctx, ox+bx+1, oy+by+1, C.TGRASS_DK);
    px(ctx, ox+bx, oy+by+2, C.TGRASS_DK);
  }
}

function drawPath(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.PATH);
  const dkDots = [[4,3],[11,7],[2,10],[9,13],[14,1],[7,5],[0,14],[13,11]];
  for (const [dx, dy] of dkDots) px(ctx, ox+dx, oy+dy, C.PATH_DK);
  const ltDots = [[7,1],[1,6],[12,4],[5,12],[10,9]];
  for (const [dx, dy] of ltDots) px(ctx, ox+dx, oy+dy, C.PATH_LT);
}

function drawPathAlt(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.PATH);
  const dkDots = [[2,2],[8,5],[14,10],[5,14],[11,1],[0,8],[6,7],[13,15]];
  for (const [dx, dy] of dkDots) px(ctx, ox+dx, oy+dy, C.PATH_DK);
  const ltDots = [[4,8],[10,3],[1,13],[12,12],[9,6]];
  for (const [dx, dy] of ltDots) px(ctx, ox+dx, oy+dy, C.PATH_LT);
}

function drawWater(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.WATER);
  // Wave highlights
  fill(ctx, ox+2, oy+3, 4, 1, C.WATER_LT);
  fill(ctx, ox+10, oy+3, 3, 1, C.WATER_LT);
  fill(ctx, ox+1, oy+8, 3, 1, C.WATER_LT);
  fill(ctx, ox+8, oy+8, 5, 1, C.WATER_LT);
  fill(ctx, ox+4, oy+13, 4, 1, C.WATER_LT);
  fill(ctx, ox+12, oy+13, 2, 1, C.WATER_LT);
  // Darker wave troughs
  fill(ctx, ox+2, oy+5, 3, 1, C.WATER_DK);
  fill(ctx, ox+9, oy+5, 4, 1, C.WATER_DK);
  fill(ctx, ox+0, oy+10, 4, 1, C.WATER_DK);
  fill(ctx, ox+8, oy+10, 4, 1, C.WATER_DK);
}

function drawWaterAlt(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.WATER);
  fill(ctx, ox+0, oy+2, 3, 1, C.WATER_LT);
  fill(ctx, ox+7, oy+2, 5, 1, C.WATER_LT);
  fill(ctx, ox+3, oy+7, 4, 1, C.WATER_LT);
  fill(ctx, ox+11, oy+7, 3, 1, C.WATER_LT);
  fill(ctx, ox+1, oy+12, 5, 1, C.WATER_LT);
  fill(ctx, ox+10, oy+12, 4, 1, C.WATER_LT);
  fill(ctx, ox+0, oy+4, 4, 1, C.WATER_DK);
  fill(ctx, ox+7, oy+4, 3, 1, C.WATER_DK);
  fill(ctx, ox+3, oy+9, 3, 1, C.WATER_DK);
  fill(ctx, ox+10, oy+9, 4, 1, C.WATER_DK);
}

function drawTreeCanopy(ctx: Ctx, ox: number, oy: number) {
  // Dense canopy — dark green fill with light highlights and dark shadows
  fill(ctx, ox, oy, 16, 16, C.CANOPY);
  // Dark patches
  fill(ctx, ox+1, oy+2, 3, 2, C.CANOPY_DK);
  fill(ctx, ox+8, oy+1, 4, 2, C.CANOPY_DK);
  fill(ctx, ox+3, oy+7, 3, 3, C.CANOPY_DK);
  fill(ctx, ox+10, oy+6, 3, 2, C.CANOPY_DK);
  fill(ctx, ox+0, oy+11, 4, 2, C.CANOPY_DK);
  fill(ctx, ox+7, oy+10, 4, 3, C.CANOPY_DK);
  fill(ctx, ox+13, oy+12, 3, 2, C.CANOPY_DK);
  // Light highlights
  fill(ctx, ox+5, oy+1, 2, 1, C.CANOPY_LT);
  fill(ctx, ox+13, oy+3, 2, 1, C.CANOPY_LT);
  fill(ctx, ox+0, oy+6, 2, 1, C.CANOPY_LT);
  fill(ctx, ox+7, oy+5, 2, 1, C.CANOPY_LT);
  fill(ctx, ox+14, oy+8, 2, 1, C.CANOPY_LT);
  fill(ctx, ox+5, oy+12, 2, 1, C.CANOPY_LT);
  fill(ctx, ox+1, oy+15, 2, 1, C.CANOPY_LT);
}

function drawTreeCanopyBot(ctx: Ctx, ox: number, oy: number) {
  // Bottom of canopy — rounded bottom edge, grass visible underneath
  fill(ctx, ox, oy, 16, 16, C.GRASS);
  // Canopy fills top ~12 rows with rounded bottom
  fill(ctx, ox, oy, 16, 10, C.CANOPY);
  fill(ctx, ox+1, oy+10, 14, 1, C.CANOPY);
  fill(ctx, ox+2, oy+11, 12, 1, C.CANOPY);
  fill(ctx, ox+3, oy+12, 10, 1, C.CANOPY);
  fill(ctx, ox+5, oy+13, 6, 1, C.CANOPY);
  // Dark edge at bottom
  fill(ctx, ox+1, oy+10, 1, 1, C.CANOPY_DK);
  fill(ctx, ox+14, oy+10, 1, 1, C.CANOPY_DK);
  fill(ctx, ox+2, oy+11, 1, 1, C.CANOPY_DK);
  fill(ctx, ox+13, oy+11, 1, 1, C.CANOPY_DK);
  fill(ctx, ox+3, oy+12, 1, 1, C.CANOPY_DK);
  fill(ctx, ox+12, oy+12, 1, 1, C.CANOPY_DK);
  fill(ctx, ox+5, oy+13, 1, 1, C.CANOPY_DK);
  fill(ctx, ox+10, oy+13, 1, 1, C.CANOPY_DK);
  // Highlights
  fill(ctx, ox+4, oy+2, 2, 1, C.CANOPY_LT);
  fill(ctx, ox+11, oy+4, 2, 1, C.CANOPY_LT);
  fill(ctx, ox+1, oy+6, 2, 1, C.CANOPY_LT);
  // Dark patches
  fill(ctx, ox+7, oy+1, 3, 2, C.CANOPY_DK);
  fill(ctx, ox+2, oy+4, 3, 2, C.CANOPY_DK);
  fill(ctx, ox+9, oy+6, 3, 2, C.CANOPY_DK);
}

function drawTreeTrunk(ctx: Ctx, ox: number, oy: number) {
  // Grass base with brown trunk in the center
  fill(ctx, ox, oy, 16, 16, C.GRASS);
  // Trunk — centered, 6px wide, full height (canopy above covers top)
  fill(ctx, ox+5, oy, 6, 16, C.TRUNK);
  // Shadow on left side
  fill(ctx, ox+5, oy, 2, 16, C.TRUNK_DK);
  // Bark texture
  px(ctx, ox+7, oy+3, C.TRUNK_DK);
  px(ctx, ox+8, oy+7, C.TRUNK_DK);
  px(ctx, ox+7, oy+11, C.TRUNK_DK);
  px(ctx, ox+9, oy+14, C.TRUNK_DK);
  // Grass detail around trunk
  px(ctx, ox+3, oy+2, C.GRASS_DK);
  px(ctx, ox+12, oy+5, C.GRASS_DK);
  px(ctx, ox+1, oy+10, C.GRASS_DK);
  px(ctx, ox+13, oy+13, C.GRASS_DK);
}

function drawRoofL(ctx: Ctx, ox: number, oy: number) {
  // Left edge of red roof with slant
  fill(ctx, ox, oy, 16, 16, C.ROOF);
  // Highlight ridges
  fill(ctx, ox, oy+0, 16, 1, C.ROOF_LT);
  fill(ctx, ox, oy+4, 16, 1, C.ROOF_LT);
  fill(ctx, ox, oy+8, 16, 1, C.ROOF_LT);
  fill(ctx, ox, oy+12, 16, 1, C.ROOF_LT);
  // Dark shadow under ridges
  fill(ctx, ox, oy+2, 16, 1, C.ROOF_DK);
  fill(ctx, ox, oy+6, 16, 1, C.ROOF_DK);
  fill(ctx, ox, oy+10, 16, 1, C.ROOF_DK);
  fill(ctx, ox, oy+14, 16, 1, C.ROOF_DK);
  // Left edge — dark vertical line
  fill(ctx, ox, oy, 1, 16, C.ROOF_DK);
  // Bottom edge
  fill(ctx, ox, oy+15, 16, 1, C.BLACK);
}

function drawRoofM(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.ROOF);
  fill(ctx, ox, oy+0, 16, 1, C.ROOF_LT);
  fill(ctx, ox, oy+4, 16, 1, C.ROOF_LT);
  fill(ctx, ox, oy+8, 16, 1, C.ROOF_LT);
  fill(ctx, ox, oy+12, 16, 1, C.ROOF_LT);
  fill(ctx, ox, oy+2, 16, 1, C.ROOF_DK);
  fill(ctx, ox, oy+6, 16, 1, C.ROOF_DK);
  fill(ctx, ox, oy+10, 16, 1, C.ROOF_DK);
  fill(ctx, ox, oy+14, 16, 1, C.ROOF_DK);
  fill(ctx, ox, oy+15, 16, 1, C.BLACK);
}

function drawRoofR(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.ROOF);
  fill(ctx, ox, oy+0, 16, 1, C.ROOF_LT);
  fill(ctx, ox, oy+4, 16, 1, C.ROOF_LT);
  fill(ctx, ox, oy+8, 16, 1, C.ROOF_LT);
  fill(ctx, ox, oy+12, 16, 1, C.ROOF_LT);
  fill(ctx, ox, oy+2, 16, 1, C.ROOF_DK);
  fill(ctx, ox, oy+6, 16, 1, C.ROOF_DK);
  fill(ctx, ox, oy+10, 16, 1, C.ROOF_DK);
  fill(ctx, ox, oy+14, 16, 1, C.ROOF_DK);
  // Right edge
  fill(ctx, ox+15, oy, 1, 16, C.ROOF_DK);
  fill(ctx, ox, oy+15, 16, 1, C.BLACK);
}

function drawWall(ctx: Ctx, ox: number, oy: number) {
  // Cream wall with subtle brick pattern
  fill(ctx, ox, oy, 16, 16, C.WALL);
  // Horizontal mortar lines
  fill(ctx, ox, oy+3, 16, 1, C.WALL_DK);
  fill(ctx, ox, oy+7, 16, 1, C.WALL_DK);
  fill(ctx, ox, oy+11, 16, 1, C.WALL_DK);
  fill(ctx, ox, oy+15, 16, 1, C.WALL_DK);
  // Vertical mortar (offset every other row for brick pattern)
  px(ctx, ox+7, oy+0, C.WALL_DK); fill(ctx, ox+7, oy+0, 1, 3, C.WALL_DK);
  px(ctx, ox+15, oy+0, C.WALL_DK); fill(ctx, ox+15, oy+0, 1, 3, C.WALL_DK);
  fill(ctx, ox+3, oy+4, 1, 3, C.WALL_DK);
  fill(ctx, ox+11, oy+4, 1, 3, C.WALL_DK);
  fill(ctx, ox+7, oy+8, 1, 3, C.WALL_DK);
  fill(ctx, ox+15, oy+8, 1, 3, C.WALL_DK);
  fill(ctx, ox+3, oy+12, 1, 3, C.WALL_DK);
  fill(ctx, ox+11, oy+12, 1, 3, C.WALL_DK);
  // Subtle highlight on some bricks
  px(ctx, ox+1, oy+1, C.WALL_LT);
  px(ctx, ox+9, oy+5, C.WALL_LT);
  px(ctx, ox+5, oy+9, C.WALL_LT);
  px(ctx, ox+13, oy+13, C.WALL_LT);
}

function drawWallWindow(ctx: Ctx, ox: number, oy: number) {
  // Wall base
  drawWall(ctx, ox, oy);
  // Window: 6×6 centered
  fill(ctx, ox+5, oy+4, 6, 7, C.BLACK);
  fill(ctx, ox+6, oy+5, 4, 5, C.WATER); // glass = blue-ish
  // Window cross
  fill(ctx, ox+5, oy+7, 6, 1, C.BLACK);
  fill(ctx, ox+7, oy+4, 2, 7, C.BLACK);
  // Highlight
  px(ctx, ox+6, oy+5, C.WATER_LT);
}

function drawDoor(ctx: Ctx, ox: number, oy: number) {
  // Wall around door
  fill(ctx, ox, oy, 16, 16, C.WALL);
  fill(ctx, ox, oy+15, 16, 1, C.WALL_DK);
  // Door frame
  fill(ctx, ox+3, oy+1, 10, 15, C.BLACK);
  // Door itself
  fill(ctx, ox+4, oy+2, 8, 13, C.DOOR);
  // Door panels
  fill(ctx, ox+5, oy+3, 6, 4, C.DOOR_DK);
  fill(ctx, ox+5, oy+9, 6, 5, C.DOOR_DK);
  // Panel insets
  fill(ctx, ox+6, oy+4, 4, 2, C.DOOR_LT);
  fill(ctx, ox+6, oy+10, 4, 3, C.DOOR_LT);
  // Knob
  fill(ctx, ox+10, oy+9, 1, 2, C.KNOB);
}

function drawFloorA(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.FLOOR_LT);
  // Subtle tile pattern
  fill(ctx, ox, oy+7, 16, 1, C.FLOOR_DK);
  fill(ctx, ox+7, oy, 1, 16, C.FLOOR_DK);
  // Highlight
  px(ctx, ox+2, oy+2, C.WHITE);
  px(ctx, ox+10, oy+10, C.WHITE);
}

function drawFloorB(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.FLOOR_DK);
  fill(ctx, ox, oy+7, 16, 1, C.FLOOR_LT);
  fill(ctx, ox+7, oy, 1, 16, C.FLOOR_LT);
  px(ctx, ox+3, oy+3, C.FLOOR_LT);
  px(ctx, ox+12, oy+12, C.FLOOR_LT);
}

function drawCarpet(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.CARPET);
  // Diamond pattern
  fill(ctx, ox+6, oy+2, 4, 1, C.CARPET_DK);
  fill(ctx, ox+5, oy+3, 6, 1, C.CARPET_DK);
  fill(ctx, ox+4, oy+4, 8, 1, C.CARPET_DK);
  fill(ctx, ox+5, oy+5, 6, 1, C.CARPET_DK);
  fill(ctx, ox+6, oy+6, 4, 1, C.CARPET_DK);
  // Repeat lower
  fill(ctx, ox+6, oy+9, 4, 1, C.CARPET_DK);
  fill(ctx, ox+5, oy+10, 6, 1, C.CARPET_DK);
  fill(ctx, ox+4, oy+11, 8, 1, C.CARPET_DK);
  fill(ctx, ox+5, oy+12, 6, 1, C.CARPET_DK);
  fill(ctx, ox+6, oy+13, 4, 1, C.CARPET_DK);
}

function drawTable(ctx: Ctx, ox: number, oy: number) {
  // Floor underneath
  fill(ctx, ox, oy, 16, 16, C.FLOOR_LT);
  // Table top
  fill(ctx, ox+1, oy+2, 14, 10, C.TABLE);
  fill(ctx, ox+1, oy+2, 14, 1, C.TABLE_DK); // top edge
  fill(ctx, ox+1, oy+11, 14, 1, C.TABLE_DK); // bottom edge
  fill(ctx, ox+1, oy+2, 1, 10, C.TABLE_DK); // left edge
  fill(ctx, ox+14, oy+2, 1, 10, C.TABLE_DK); // right edge
  // Surface highlight
  fill(ctx, ox+3, oy+4, 5, 1, C.PATH_LT);
  // Legs
  fill(ctx, ox+2, oy+12, 2, 3, C.TABLE_DK);
  fill(ctx, ox+12, oy+12, 2, 3, C.TABLE_DK);
}

function drawBookshelf(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.SHELF);
  // Shelf dividers
  fill(ctx, ox, oy+5, 16, 1, C.TRUNK_DK);
  fill(ctx, ox, oy+10, 16, 1, C.TRUNK_DK);
  // Books top row
  fill(ctx, ox+1, oy+1, 2, 4, C.BOOK_R);
  fill(ctx, ox+3, oy+1, 2, 4, C.BOOK_B);
  fill(ctx, ox+5, oy+1, 2, 4, C.BOOK_G);
  fill(ctx, ox+7, oy+2, 2, 3, C.BOOK_Y);
  fill(ctx, ox+9, oy+1, 2, 4, C.BOOK_R);
  fill(ctx, ox+11, oy+1, 2, 4, C.BOOK_B);
  fill(ctx, ox+13, oy+2, 2, 3, C.BOOK_G);
  // Books bottom row
  fill(ctx, ox+1, oy+6, 2, 4, C.BOOK_Y);
  fill(ctx, ox+3, oy+6, 2, 4, C.BOOK_G);
  fill(ctx, ox+5, oy+7, 2, 3, C.BOOK_R);
  fill(ctx, ox+7, oy+6, 2, 4, C.BOOK_B);
  fill(ctx, ox+9, oy+6, 2, 4, C.BOOK_Y);
  fill(ctx, ox+11, oy+7, 2, 3, C.BOOK_R);
  fill(ctx, ox+13, oy+6, 2, 4, C.BOOK_G);
  // Bottom shelf / base
  fill(ctx, ox, oy+11, 16, 5, C.TRUNK);
  fill(ctx, ox+1, oy+12, 14, 3, C.SHELF);
}

function drawMachine(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.FLOOR_LT);
  // Machine body
  rect(ctx, ox+2, oy+1, 12, 14, C.MACHINE_BG, C.MACHINE_DK);
  // Screen
  fill(ctx, ox+4, oy+3, 8, 5, C.BLACK);
  fill(ctx, ox+5, oy+4, 6, 3, C.CANOPY); // green screen
  // LEDs
  px(ctx, ox+4, oy+10, C.LED_G);
  px(ctx, ox+6, oy+10, C.LED_R);
  // Buttons
  fill(ctx, ox+9, oy+10, 3, 2, C.MACHINE_DK);
  // Vent
  fill(ctx, ox+4, oy+12, 8, 1, C.MACHINE_DK);
}

function drawSign(ctx: Ctx, ox: number, oy: number) {
  // On path background
  fill(ctx, ox, oy, 16, 16, C.PATH);
  // Post
  fill(ctx, ox+7, oy+9, 2, 7, C.TRUNK);
  fill(ctx, ox+7, oy+9, 1, 7, C.TRUNK_DK);
  // Sign board
  rect(ctx, ox+2, oy+2, 12, 8, C.SIGN, C.SIGN_DK);
  // Text lines
  fill(ctx, ox+4, oy+4, 8, 1, C.TRUNK_DK);
  fill(ctx, ox+4, oy+6, 6, 1, C.TRUNK_DK);
}

function drawBoulder(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.PATH);
  // Boulder — rounded rectangle
  fill(ctx, ox+3, oy+3, 10, 10, C.BOULDER);
  fill(ctx, ox+4, oy+2, 8, 12, C.BOULDER);
  fill(ctx, ox+2, oy+4, 12, 8, C.BOULDER);
  // Highlight
  fill(ctx, ox+5, oy+4, 4, 2, C.BOULDER_LT);
  // Shadow
  fill(ctx, ox+5, oy+10, 6, 2, C.BOULDER_DK);
  fill(ctx, ox+10, oy+5, 2, 5, C.BOULDER_DK);
  // Cracks
  px(ctx, ox+7, oy+7, C.BOULDER_DK);
  px(ctx, ox+8, oy+8, C.BOULDER_DK);
}

function drawFence(ctx: Ctx, ox: number, oy: number) {
  // Grass base
  fill(ctx, ox, oy, 16, 16, C.GRASS);
  // Horizontal rails
  fill(ctx, ox, oy+4, 16, 2, C.FENCE);
  fill(ctx, ox, oy+10, 16, 2, C.FENCE);
  // Rail shadows
  fill(ctx, ox, oy+5, 16, 1, C.FENCE_DK);
  fill(ctx, ox, oy+11, 16, 1, C.FENCE_DK);
  // Vertical posts every 4 px
  for (let i = 0; i < 16; i += 4) {
    fill(ctx, ox+i, oy+2, 2, 12, C.FENCE);
    fill(ctx, ox+i, oy+2, 1, 12, C.FENCE_DK);
  }
}

function drawFlower(ctx: Ctx, ox: number, oy: number) {
  // Grass base
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const grad = y < 5 ? C.GRASS_LT : y > 12 ? C.GRASS_DK : C.GRASS;
      px(ctx, ox + x, oy + y, grad);
    }
  }
  // Flower cluster centered
  const cx = 8, cy = 8;
  // Pink petals
  px(ctx, ox+cx-1, oy+cy-2, C.PETAL_R);
  px(ctx, ox+cx,   oy+cy-2, C.PETAL_LT);
  px(ctx, ox+cx+1, oy+cy-2, C.PETAL_R);
  px(ctx, ox+cx-2, oy+cy-1, C.PETAL_R);
  px(ctx, ox+cx+2, oy+cy-1, C.PETAL_R);
  px(ctx, ox+cx-2, oy+cy,   C.PETAL_R);
  px(ctx, ox+cx+2, oy+cy,   C.PETAL_R);
  px(ctx, ox+cx-1, oy+cy+1, C.PETAL_R);
  px(ctx, ox+cx,   oy+cy+1, C.PETAL_LT);
  px(ctx, ox+cx+1, oy+cy+1, C.PETAL_R);
  // Yellow center
  px(ctx, ox+cx-1, oy+cy,   C.PETAL_Y);
  px(ctx, ox+cx,   oy+cy,   C.PETAL_Y);
  px(ctx, ox+cx+1, oy+cy,   C.PETAL_Y);
  px(ctx, ox+cx,   oy+cy-1, C.PETAL_Y);
  // Small companion flower
  px(ctx, ox+3, oy+13, C.PETAL_R);
  px(ctx, ox+4, oy+13, C.PETAL_LT);
  px(ctx, ox+4, oy+12, C.PETAL_Y);
}

function drawLedgeDown(ctx: Ctx, ox: number, oy: number) {
  // Grass base
  drawGrass(ctx, ox, oy);
  // Stone edge across the bottom
  fill(ctx, ox, oy+10, 16, 6, C.PATH_DK);
  fill(ctx, ox, oy+10, 16, 1, C.BLACK);
  fill(ctx, ox, oy+15, 16, 1, C.BLACK);
  // Highlight groove pattern
  for (let i = 0; i < 16; i += 4) {
    fill(ctx, ox+i, oy+12, 3, 1, C.PATH_LT);
  }
}

function drawLedgeLeft(ctx: Ctx, ox: number, oy: number) {
  drawGrass(ctx, ox, oy);
  fill(ctx, ox, oy, 6, 16, C.PATH_DK);
  fill(ctx, ox, oy, 1, 16, C.BLACK);
  fill(ctx, ox+5, oy, 1, 16, C.BLACK);
  for (let i = 0; i < 16; i += 4) {
    fill(ctx, ox+2, oy+i, 1, 3, C.PATH_LT);
  }
}

function drawLedgeRight(ctx: Ctx, ox: number, oy: number) {
  drawGrass(ctx, ox, oy);
  fill(ctx, ox+10, oy, 6, 16, C.PATH_DK);
  fill(ctx, ox+10, oy, 1, 16, C.BLACK);
  fill(ctx, ox+15, oy, 1, 16, C.BLACK);
  for (let i = 0; i < 16; i += 4) {
    fill(ctx, ox+13, oy+i, 1, 3, C.PATH_LT);
  }
}

function drawCutTree(ctx: Ctx, ox: number, oy: number) {
  fill(ctx, ox, oy, 16, 16, C.GRASS);
  // Small bush/stump
  fill(ctx, ox+4, oy+6, 8, 8, C.CANOPY);
  fill(ctx, ox+5, oy+5, 6, 9, C.CANOPY);
  fill(ctx, ox+3, oy+7, 10, 5, C.CANOPY);
  // Highlights
  fill(ctx, ox+5, oy+6, 3, 2, C.CANOPY_LT);
  // Shadows
  fill(ctx, ox+6, oy+11, 4, 2, C.CANOPY_DK);
  fill(ctx, ox+9, oy+8, 2, 3, C.CANOPY_DK);
}

// ── Sheet assembly ────────────────────────────────────────────────

type DrawFn = (ctx: Ctx, ox: number, oy: number) => void;

const DRAW_MAP: Partial<Record<number, DrawFn>> = {
  [T.GRASS]:           drawGrass,
  [T.GRASS_ALT]:       drawGrassAlt,
  [T.TALL_GRASS]:      drawTallGrass,
  [T.PATH]:            drawPath,
  [T.PATH_ALT]:        drawPathAlt,
  [T.WATER]:           drawWater,
  [T.WATER_ALT]:       drawWaterAlt,
  [T.TREE_CANOPY]:     drawTreeCanopy,
  [T.TREE_CANOPY_BOT]: drawTreeCanopyBot,
  [T.TREE_TRUNK]:      drawTreeTrunk,
  [T.ROOF_L]:          drawRoofL,
  [T.ROOF_M]:          drawRoofM,
  [T.ROOF_R]:          drawRoofR,
  [T.WALL]:            drawWall,
  [T.WALL_WINDOW]:     drawWallWindow,
  [T.DOOR]:            drawDoor,
  [T.FLOOR_A]:         drawFloorA,
  [T.FLOOR_B]:         drawFloorB,
  [T.CARPET]:          drawCarpet,
  [T.TABLE]:           drawTable,
  [T.BOOKSHELF]:       drawBookshelf,
  [T.MACHINE]:         drawMachine,
  [T.SIGN_OBJ]:        drawSign,
  [T.BOULDER_OBJ]:     drawBoulder,
  [T.CUT_TREE_OBJ]:    drawCutTree,
  [T.GRASS_ON_PATH]:   drawGrass,   // alias
  [T.FLOOR_ON_TABLE]:  drawFloorA,  // alias
  [T.FENCE]:           drawFence,
  [T.FLOWER]:          drawFlower,
  [T.LEDGE_DOWN]:      drawLedgeDown,
  [T.LEDGE_LEFT]:      drawLedgeLeft,
  [T.LEDGE_RIGHT]:     drawLedgeRight,
};

let _url: string | null = null;

export function getTilesetUrl(): string {
  if (_url) return _url;

  const canvas = document.createElement('canvas');
  canvas.width = TILESET_COLS * TILE_PX;
  canvas.height = TILESET_ROWS * TILE_PX;
  const ctx = canvas.getContext('2d')!;

  // Clear with transparency
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw each tile into its slot
  for (const [idStr, drawFn] of Object.entries(DRAW_MAP)) {
    const id = Number(idStr);
    const [ox, oy] = origin(id);
    drawFn(ctx, ox, oy);
  }

  _url = canvas.toDataURL('image/png');
  return _url;
}
