/**
 * Pre-loaded blockset data for all canonical pokered tilesets.
 * Used by parseMap() to resolve block IDs → per-tile semantics at runtime.
 */

import OVERWORLD_BLOCKS from '../artifacts/tilesets/OVERWORLD.blocks.json';
import OVERWORLD_SEMANTICS from '../artifacts/tilesets/OVERWORLD.semantics.json';

import CAVERN_BLOCKS from '../artifacts/tilesets/CAVERN.blocks.json';
import CAVERN_SEMANTICS from '../artifacts/tilesets/CAVERN.semantics.json';

import CEMETERY_BLOCKS from '../artifacts/tilesets/CEMETERY.blocks.json';
import CEMETERY_SEMANTICS from '../artifacts/tilesets/CEMETERY.semantics.json';

import CLUB_BLOCKS from '../artifacts/tilesets/CLUB.blocks.json';
import CLUB_SEMANTICS from '../artifacts/tilesets/CLUB.semantics.json';

import FACILITY_BLOCKS from '../artifacts/tilesets/FACILITY.blocks.json';
import FACILITY_SEMANTICS from '../artifacts/tilesets/FACILITY.semantics.json';

import FOREST_BLOCKS from '../artifacts/tilesets/FOREST.blocks.json';
import FOREST_SEMANTICS from '../artifacts/tilesets/FOREST.semantics.json';

import GATE_BLOCKS from '../artifacts/tilesets/GATE.blocks.json';
import GATE_SEMANTICS from '../artifacts/tilesets/GATE.semantics.json';

import GYM_BLOCKS from '../artifacts/tilesets/GYM.blocks.json';
import GYM_SEMANTICS from '../artifacts/tilesets/GYM.semantics.json';

import HOUSE_BLOCKS from '../artifacts/tilesets/HOUSE.blocks.json';
import HOUSE_SEMANTICS from '../artifacts/tilesets/HOUSE.semantics.json';

import INTERIOR_BLOCKS from '../artifacts/tilesets/INTERIOR.blocks.json';
import INTERIOR_SEMANTICS from '../artifacts/tilesets/INTERIOR.semantics.json';

import LAB_BLOCKS from '../artifacts/tilesets/LAB.blocks.json';
import LAB_SEMANTICS from '../artifacts/tilesets/LAB.semantics.json';

import LOBBY_BLOCKS from '../artifacts/tilesets/LOBBY.blocks.json';
import LOBBY_SEMANTICS from '../artifacts/tilesets/LOBBY.semantics.json';

import MANSION_BLOCKS from '../artifacts/tilesets/MANSION.blocks.json';
import MANSION_SEMANTICS from '../artifacts/tilesets/MANSION.semantics.json';

import PLATEAU_BLOCKS from '../artifacts/tilesets/PLATEAU.blocks.json';
import PLATEAU_SEMANTICS from '../artifacts/tilesets/PLATEAU.semantics.json';

import POKECENTER_BLOCKS from '../artifacts/tilesets/POKECENTER.blocks.json';
import POKECENTER_SEMANTICS from '../artifacts/tilesets/POKECENTER.semantics.json';

import REDS_HOUSE_BLOCKS from '../artifacts/tilesets/REDS_HOUSE.blocks.json';
import REDS_HOUSE_SEMANTICS from '../artifacts/tilesets/REDS_HOUSE.semantics.json';

import SHIP_BLOCKS from '../artifacts/tilesets/SHIP.blocks.json';
import SHIP_SEMANTICS from '../artifacts/tilesets/SHIP.semantics.json';

import SHIP_PORT_BLOCKS from '../artifacts/tilesets/SHIP_PORT.blocks.json';
import SHIP_PORT_SEMANTICS from '../artifacts/tilesets/SHIP_PORT.semantics.json';

import UNDERGROUND_BLOCKS from '../artifacts/tilesets/UNDERGROUND.blocks.json';
import UNDERGROUND_SEMANTICS from '../artifacts/tilesets/UNDERGROUND.semantics.json';

type SemanticsMap = Record<number, { type: string; walkable: boolean }>;

export const blocksetBlocks: Record<string, number[][]> = {
  OVERWORLD: OVERWORLD_BLOCKS,
  CAVERN: CAVERN_BLOCKS,
  CEMETERY: CEMETERY_BLOCKS,
  CLUB: CLUB_BLOCKS,
  FACILITY: FACILITY_BLOCKS,
  FOREST: FOREST_BLOCKS,
  GATE: GATE_BLOCKS,
  GYM: GYM_BLOCKS,
  HOUSE: HOUSE_BLOCKS,
  INTERIOR: INTERIOR_BLOCKS,
  LAB: LAB_BLOCKS,
  LOBBY: LOBBY_BLOCKS,
  MANSION: MANSION_BLOCKS,
  PLATEAU: PLATEAU_BLOCKS,
  POKECENTER: POKECENTER_BLOCKS,
  REDS_HOUSE: REDS_HOUSE_BLOCKS,
  SHIP: SHIP_BLOCKS,
  SHIP_PORT: SHIP_PORT_BLOCKS,
  UNDERGROUND: UNDERGROUND_BLOCKS,
};

export const blocksetSemantics: Record<string, SemanticsMap> = {
  OVERWORLD: OVERWORLD_SEMANTICS,
  CAVERN: CAVERN_SEMANTICS,
  CEMETERY: CEMETERY_SEMANTICS,
  CLUB: CLUB_SEMANTICS,
  FACILITY: FACILITY_SEMANTICS,
  FOREST: FOREST_SEMANTICS,
  GATE: GATE_SEMANTICS,
  GYM: GYM_SEMANTICS,
  HOUSE: HOUSE_SEMANTICS,
  INTERIOR: INTERIOR_SEMANTICS,
  LAB: LAB_SEMANTICS,
  LOBBY: LOBBY_SEMANTICS,
  MANSION: MANSION_SEMANTICS,
  PLATEAU: PLATEAU_SEMANTICS,
  POKECENTER: POKECENTER_SEMANTICS,
  REDS_HOUSE: REDS_HOUSE_SEMANTICS,
  SHIP: SHIP_SEMANTICS,
  SHIP_PORT: SHIP_PORT_SEMANTICS,
  UNDERGROUND: UNDERGROUND_SEMANTICS,
};
