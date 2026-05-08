/**
 * Runtime adapter — converts the auto-extracted FireRed data tables
 * (firedNpcs, firedTrainers, firedWildEncounters, firedItems, firedSpecies)
 * into the runtime shapes the existing engine consumes (NPC[], Entity[],
 * Pokemon[]).
 *
 * Spanish dialogue is layered on top via `firedDialogue.ts` keyed by FireRed
 * `local_id`; missing translations fall back to a placeholder so the game
 * still boots while we incrementally translate.
 */

import { FIRERED_NPCS, type FireredNpc } from './firedNpcs.generated';
import { FIRERED_TRAINERS, FIRERED_TRAINER_PARTIES } from './firedTrainers.generated';
import { FIRERED_WILD_ENCOUNTERS } from './firedWildEncounters.generated';
import { FIRERED_SPECIES } from './firedSpecies.generated';
import { FIRERED_SIGNS } from './firedSigns.generated';
import { FIRERED_MAP_ID_TO_INTERNAL } from './mapIds.generated';
import { KANTO_FIRERED_ZONE_OFFSETS } from './kantoZoneOffsets.generated';
import { makePokemon } from '../../constants/pokemon';
import { MOVES } from '../../constants/moves';
import type { NPC, Entity, MapID, Direction, Pokemon } from '../../types';
import { NPC_OVERRIDES } from './firedDialogue';

// ─── FireRed map id → internal MapID resolution ──────────────────────────
// Outdoor zones aggregate into KANTO_OVERWORLD; their FireRed local x/y is
// translated into world coords via the auto-generated zone offsets.
function resolveMapAndOffset(fireredMapId: string): { mapId: MapID; offsetX: number; offsetY: number } | null {
  // Indoor: direct mapping to internal MapID
  const internal = (FIRERED_MAP_ID_TO_INTERNAL as Record<string, string>)[fireredMapId];
  if (internal) return { mapId: internal as MapID, offsetX: 0, offsetY: 0 };

  // Outdoor: lookup in KANTO_FIRERED_ZONE_OFFSETS (keyed by our zone names)
  // FireRed map id MAP_ROUTE1 → ROUTE_1, MAP_PALLET_TOWN → PALLET_TOWN.
  const zoneName = fireredMapId
    .replace(/^MAP_/, '')
    .replace(/^ROUTE(\d)/, 'ROUTE_$1')
    .replace(/^ROUTE21_NORTH$/, 'ROUTE_21')
    .replace(/^INDIGO_PLATEAU_EXTERIOR$/, 'INDIGO_PLATEAU')
    .replace(/^SAFFRON_CITY_CONNECTION$/, 'SAFFRON_CITY');
  const zone = (KANTO_FIRERED_ZONE_OFFSETS as Record<string, { x: number; y: number }>)[zoneName];
  if (zone) return { mapId: 'KANTO_OVERWORLD', offsetX: zone.x, offsetY: zone.y };
  return null;
}

// ─── FireRed gfx → trainerClass / sprite key ─────────────────────────────
// Maps the FireRed graphics_id (e.g. YOUNGSTER, BUG_CATCHER, OLD_MAN_1) to
// our internal trainerClass key used by NPC_SPRITE_MAP. Anything missing
// falls back to 'citizen' (generic old man sprite).
const GFX_TO_TRAINER_CLASS: Record<string, string> = {
  YOUNGSTER: 'youngster',
  BUG_CATCHER: 'bugcatcher',
  LASS: 'lass',
  HIKER: 'hiker',
  FISHER: 'fisher',
  GAMER: 'gambler',
  GENTLEMAN: 'gentleman',
  WOMAN_1: 'lass',
  WOMAN_2: 'lass',
  WOMAN_3: 'lass',
  OLD_WOMAN_1: 'lass',
  OLD_WOMAN_2: 'lass',
  MAN_1: 'citizen',
  MAN_2: 'citizen',
  MAN_3: 'citizen',
  OLD_MAN_1: 'citizen',
  OLD_MAN_2: 'citizen',
  FAT_MAN: 'fisher',
  BALDING_MAN: 'gambler',
  LITTLE_BOY: 'youngster',
  LITTLE_GIRL: 'lass',
  BOY: 'youngster',
  GIRL: 'lass',
  MOM: 'mom',
  PROF_OAK: 'oak',
  RIVAL_OAKS_LAB: 'rival',
  RED_NORMAL: 'rival',
  ROCKET_M: 'rocket',
  ROCKET_F: 'rocket',
  ROCKET: 'rocket',
  BIKER: 'biker',
  BLACK_BELT: 'blackbelt',
  CHANNELER: 'channeler',
  COOL_TRAINER_M: 'cooltrainer_m',
  COOL_TRAINER_F: 'cooltrainer_f',
  CRUSH_GIRL: 'cooltrainer_f',
  CUE_BALL: 'cueball',
  JUGGLER: 'juggler',
  POKE_MANIAC: 'pokemaniac',
  PSYCHIC_M: 'psychic',
  PSYCHIC_F: 'psychic',
  SAILOR: 'sailor',
  SCIENTIST: 'scientist',
  SUPER_NERD: 'supernerd',
  SWIMMER_M: 'swimmer',
  TAMER: 'tamer',
  ROCKER: 'gambler',
  PROF_OAK_AIDE: 'scientist',
  AGATHA: 'agatha',
  BLAINE: 'blaine',
  BROCK: 'brock',
  BRUNO: 'bruno',
  ERIKA: 'erika',
  GIOVANNI: 'giovanni',
  KOGA: 'koga',
  LANCE: 'lance',
  LORELEI: 'lorelei',
  LT_SURGE: 'lt_surge',
  MISTY: 'misty',
  SABRINA: 'sabrina',
  BILL: 'bill',
  DAISY: 'daisy',
  CHANSEY: 'chansey',
  KANGASKHAN: 'kangaskhan',
  LAPRAS: 'lapras',
  MACHOP: 'machop',
  MR_FUJI: 'fuji',
  ITEM_BALL: '__item_ball__', // sentinel — handled separately
  CUT_TREE: '__cut_tree__',
  SNORLAX: 'snorlax',
  ZAPDOS: 'zapdos',
  ARTICUNO: 'articuno',
  MOLTRES: 'moltres',
  MEWTWO: 'mewtwo',
  PIDGEOT: 'fossil',
  POKEFAN_M: 'gentleman',
  POKEFAN_F: 'lass',
  WAITRESS: 'lass',
  BIRD_KEEPER: 'birdkeeper',
  NURSE: 'nurse',
  CLERK: 'clerk',
};

function gfxToTrainerClass(gfx: string | null): string {
  if (!gfx) return 'citizen';
  return GFX_TO_TRAINER_CLASS[gfx] ?? 'citizen';
}

// ─── FireRed movement type → starting direction ──────────────────────────
function movementToDirection(movement: string | null): Direction {
  if (!movement) return 'down';
  if (movement.startsWith('FACE_')) {
    const dir = movement.slice(5).toLowerCase();
    if (dir === 'up' || dir === 'down' || dir === 'left' || dir === 'right') return dir;
  }
  return 'down';
}

// ─── Trainer team builder ────────────────────────────────────────────────
// Convert a FireRed party (sParty_X) into our Pokemon[] runtime shape.
// Default moves are the species' first 1-2 known moves; level + species come
// from FIRERED_TRAINER_PARTIES; types come from FIRERED_SPECIES.
function speciesIdToInternal(speciesEnum: string): string {
  // SPECIES_NIDORAN_F → nidoran-f, SPECIES_MR_MIME → mr-mime, etc.
  return speciesEnum
    .replace(/^SPECIES_/, '')
    .toLowerCase()
    .replace(/_/g, '-');
}

function speciesPrimaryType(species: string): string {
  const enumKey = species.replace(/-/g, '_').toUpperCase();
  const info = FIRERED_SPECIES[enumKey];
  if (!info?.types) return 'normal';
  return info.types[0].toLowerCase();
}

function speciesDexId(species: string): number {
  // Internal id like 'pidgey'. Use a coarse alphabetical hash to derive a
  // sprite id when we don't have a real dex map. The actual sprite URL is
  // computed from spriteId in makePokemon.
  // For the 151 Gen I species we mostly know the dex number via a small
  // table; default to 0 (Bulbasaur sprite) for unknowns.
  const dex = GEN1_DEX[species];
  return dex ?? 1;
}

const GEN1_DEX: Record<string, number> = {
  bulbasaur: 1, ivysaur: 2, venusaur: 3, charmander: 4, charmeleon: 5, charizard: 6,
  squirtle: 7, wartortle: 8, blastoise: 9, caterpie: 10, metapod: 11, butterfree: 12,
  weedle: 13, kakuna: 14, beedrill: 15, pidgey: 16, pidgeotto: 17, pidgeot: 18,
  rattata: 19, raticate: 20, spearow: 21, fearow: 22, ekans: 23, arbok: 24,
  pikachu: 25, raichu: 26, sandshrew: 27, sandslash: 28, 'nidoran-f': 29, nidorina: 30,
  nidoqueen: 31, 'nidoran-m': 32, nidorino: 33, nidoking: 34, clefairy: 35, clefable: 36,
  vulpix: 37, ninetales: 38, jigglypuff: 39, wigglytuff: 40, zubat: 41, golbat: 42,
  oddish: 43, gloom: 44, vileplume: 45, paras: 46, parasect: 47, venonat: 48,
  venomoth: 49, diglett: 50, dugtrio: 51, meowth: 52, persian: 53, psyduck: 54,
  golduck: 55, mankey: 56, primeape: 57, growlithe: 58, arcanine: 59, poliwag: 60,
  poliwhirl: 61, poliwrath: 62, abra: 63, kadabra: 64, alakazam: 65, machop: 66,
  machoke: 67, machamp: 68, bellsprout: 69, weepinbell: 70, victreebel: 71, tentacool: 72,
  tentacruel: 73, geodude: 74, graveler: 75, golem: 76, ponyta: 77, rapidash: 78,
  slowpoke: 79, slowbro: 80, magnemite: 81, magneton: 82, 'farfetchd': 83, doduo: 84,
  dodrio: 85, seel: 86, dewgong: 87, grimer: 88, muk: 89, shellder: 90, cloyster: 91,
  gastly: 92, haunter: 93, gengar: 94, onix: 95, drowzee: 96, hypno: 97,
  krabby: 98, kingler: 99, voltorb: 100, electrode: 101, exeggcute: 102, exeggutor: 103,
  cubone: 104, marowak: 105, hitmonlee: 106, hitmonchan: 107, lickitung: 108, koffing: 109,
  weezing: 110, rhyhorn: 111, rhydon: 112, chansey: 113, tangela: 114, kangaskhan: 115,
  horsea: 116, seadra: 117, goldeen: 118, seaking: 119, staryu: 120, starmie: 121,
  'mr-mime': 122, scyther: 123, jynx: 124, electabuzz: 125, magmar: 126, pinsir: 127,
  tauros: 128, magikarp: 129, gyarados: 130, lapras: 131, ditto: 132, eevee: 133,
  vaporeon: 134, jolteon: 135, flareon: 136, porygon: 137, omanyte: 138, omastar: 139,
  kabuto: 140, kabutops: 141, aerodactyl: 142, snorlax: 143, articuno: 144, zapdos: 145,
  moltres: 146, dratini: 147, dragonair: 148, dragonite: 149, mewtwo: 150, mew: 151,
};

function buildTrainerTeam(trainerId: string): Pokemon[] {
  const trainer = FIRERED_TRAINERS[trainerId];
  if (!trainer?.partyKey) return [];
  const party = FIRERED_TRAINER_PARTIES[trainer.partyKey];
  if (!party) return [];
  return party.mons.map(mon => {
    const id = speciesIdToInternal(mon.species);
    const name = mon.species.replace(/^SPECIES_/, '');
    const type = speciesPrimaryType(id);
    const dexId = speciesDexId(id);
    // Default moves: TACKLE + first non-tackle attack. The custom-moves
    // variants (.moves = {MOVE_X, MOVE_Y, ...}) in FireRed parties are rare
    // boss fights; a future pass can wire them through.
    return makePokemon(id, name, mon.lvl, type, [MOVES.TACKLE, MOVES.GROWL], dexId);
  });
}

// ─── NPC builder ─────────────────────────────────────────────────────────
function fireredNpcToEntity(
  npc: FireredNpc,
  fireredMapId: string,
  worldX: number,
  worldY: number,
): NPC | Entity | null {
  // Item balls — render as collectable item, not NPC
  if (npc.gfx === 'ITEM_BALL') {
    return {
      id: `item_${fireredMapId}_${npc.x}_${npc.y}`,
      type: 'item',
      position: { x: worldX, y: worldY },
      direction: 'down',
      sprite: '🔴',
      itemId: scriptToItemId(npc.script) ?? 'POTION',
    };
  }
  // Cut-tree obstacles, snorlax — interactive objects
  if (npc.gfx === 'CUT_TREE') {
    return {
      id: `cut_tree_${fireredMapId}_${npc.x}_${npc.y}`,
      type: 'object',
      position: { x: worldX, y: worldY },
      direction: 'down',
      sprite: '🌳',
      dialogue: ['Este árbol parece poder cortarse.'],
    };
  }
  if (npc.gfx === 'SNORLAX') {
    return {
      id: `snorlax_${fireredMapId}_${npc.x}_${npc.y}`,
      name: 'SNORLAX',
      type: 'npc',
      position: { x: worldX, y: worldY },
      direction: 'down',
      sprite: 'snorlax',
      dialogue: ['Snorlax está dormido…'],
      trainerClass: 'snorlax',
    };
  }

  // Look up Spanish dialogue + custom behaviour by FireRed local_id, or fall
  // back to a class-based override for the per-city LOCALID_<CITY>_NURSE /
  // LOCALID_<CITY>_MART_CLERK patterns we don't enumerate by hand.
  const exactOverride = npc.localId ? NPC_OVERRIDES[npc.localId] : undefined;
  const patternOverride = !exactOverride && npc.localId
    ? (npc.localId.endsWith('_NURSE') ? NPC_OVERRIDES.LOCALID_NURSE
      : npc.localId.endsWith('_MART_CLERK') || npc.localId.endsWith('_CLERK') ? NPC_OVERRIDES.LOCALID_POKEMART_CLERK
      : undefined)
    : undefined;
  const gfxOverride = !exactOverride && !patternOverride
    ? (npc.gfx === 'NURSE' ? NPC_OVERRIDES.LOCALID_NURSE
      : npc.gfx === 'CLERK' ? NPC_OVERRIDES.LOCALID_POKEMART_CLERK
      : undefined)
    : undefined;
  const override = exactOverride ?? patternOverride ?? gfxOverride;
  const trainerClass = gfxToTrainerClass(npc.gfx);

  const id = npc.localId
    ? npc.localId.toLowerCase()
    : `npc_${fireredMapId}_${npc.x}_${npc.y}`;

  const base: NPC = {
    id,
    name: override?.name ?? npc.localId?.replace(/^LOCALID_/, '') ?? trainerClass.toUpperCase(),
    type: 'npc',
    position: { x: worldX, y: worldY },
    direction: movementToDirection(npc.movement),
    trainerClass,
    dialogue: override?.dialogue ?? [`(Sin traducir: ${npc.localId ?? npc.script ?? 'NPC'})`],
  };

  if (npc.trainerId) {
    base.isTrainer = true;
    base.trainerTeam = buildTrainerTeam(npc.trainerId);
  }
  if (override?.onInteract) base.onInteract = override.onInteract;

  return base;
}

// Map a FireRed script name (e.g. 'Route24_EventScript_ItemPotion') to
// an itemId. Falls back to POTION for unknown scripts.
function scriptToItemId(script: string | null): string | null {
  if (!script) return null;
  const m = script.match(/_Item([A-Z][a-zA-Z0-9_]+)/);
  if (!m) return null;
  // ItemPotion → POTION, ItemSuperPotion → SUPER_POTION, etc.
  const camel = m[1];
  return camel.replace(/([A-Z])/g, '_$1').replace(/^_/, '').toUpperCase();
}

// FireRed sign script → Spanish dialogue. Translated incrementally; missing
// scripts fall through to a generic "Es un cartel." message and the validator
// will still consider the sign tile wired-up.
const SIGN_DIALOGUE: Record<string, string[]> = {};

function dialogueForSign(script: string | null): string[] {
  if (script && SIGN_DIALOGUE[script]) return SIGN_DIALOGUE[script];
  return ['Es un cartel.'];
}

// ─── Public builders ─────────────────────────────────────────────────────
export function buildAutoEntities(): { npcs: Record<MapID, NPC[]>; items: Record<MapID, Entity[]>; signs: Record<MapID, Entity[]> } {
  const npcsOut: Record<string, NPC[]> = {};
  const itemsOut: Record<string, Entity[]> = {};
  const signsOut: Record<string, Entity[]> = {};

  for (const [fireredMapId, list] of Object.entries(FIRERED_NPCS)) {
    const resolved = resolveMapAndOffset(fireredMapId);
    if (!resolved) continue;
    const { mapId, offsetX, offsetY } = resolved;
    npcsOut[mapId] ??= [];
    itemsOut[mapId] ??= [];
    for (const npc of list) {
      const wx = offsetX + npc.x;
      const wy = offsetY + npc.y;
      const e = fireredNpcToEntity(npc, fireredMapId, wx, wy);
      if (!e) continue;
      if (e.type === 'item' || e.type === 'object') itemsOut[mapId].push(e);
      else npcsOut[mapId].push(e as NPC);
    }
  }

  // Auto-generate sign objects from FireRed bg_events. These are merged
  // additively (deduped by position) into the items table downstream so each
  // sign tile has an interaction object instead of relying on the engine's
  // generic "Es un cartel." fallback. Hidden_item bg_events are skipped here
  // (they belong to the item-finder feature, not implemented yet).
  for (const [fireredMapId, list] of Object.entries(FIRERED_SIGNS)) {
    const resolved = resolveMapAndOffset(fireredMapId);
    if (!resolved) continue;
    const { mapId, offsetX, offsetY } = resolved;
    signsOut[mapId] ??= [];
    for (const sign of list) {
      if (sign.type !== 'sign') continue;
      signsOut[mapId].push({
        id: `sign_${fireredMapId}_${sign.x}_${sign.y}`,
        type: 'object',
        position: { x: offsetX + sign.x, y: offsetY + sign.y },
        direction: 'down',
        sprite: '🪧',
        dialogue: dialogueForSign(sign.script),
      });
    }
  }

  return {
    npcs: npcsOut as Record<MapID, NPC[]>,
    items: itemsOut as Record<MapID, Entity[]>,
    signs: signsOut as Record<MapID, Entity[]>,
  };
}

// ─── Wild encounter table builder ────────────────────────────────────────
export function buildAutoWildEncounters(): Record<MapID, Pokemon[]> {
  return buildEncountersForTable('land_mons');
}

export function buildWaterEncounters(): Record<MapID, Pokemon[]> {
  return buildEncountersForTable('water_mons');
}

function buildEncountersForTable(tableName: string): Record<MapID, Pokemon[]> {
  const out: Record<string, Pokemon[]> = {};
  for (const [fireredMapId, tables] of Object.entries(FIRERED_WILD_ENCOUNTERS)) {
    const resolved = resolveMapAndOffset(fireredMapId);
    if (!resolved) continue;
    const internalId = resolveWildMapId(fireredMapId, resolved.mapId);
    if (!internalId) continue;
    const all: Pokemon[] = [];
    const tablesWithMons = tables as unknown as Record<string, { encounter_rate?: number; mons: Array<{ species: string; min_level: number; max_level: number }> }>;
    const entry = tablesWithMons[tableName];
    if (!entry?.mons) continue;
    for (const slot of entry.mons) {
      const species = speciesIdToInternal(slot.species);
      const dex = GEN1_DEX[species];
      if (!dex) continue;
      const lvl = Math.floor((slot.min_level + slot.max_level) / 2);
      all.push(makePokemon(species, slot.species.replace(/^SPECIES_/, ''), lvl, speciesPrimaryType(species), [MOVES.TACKLE, MOVES.GROWL], dex));
    }
    if (all.length > 0) {
      const seen = new Set<string>();
      const deduped = all.filter(p => {
        if (seen.has(p.name)) return false;
        seen.add(p.name);
        return true;
      });
      out[internalId] = deduped;
    }
  }
  return out as Record<MapID, Pokemon[]>;
}

// Wild encounters are a per-zone concept. Outdoor FireRed maps map 1:1 to
// our zone names (PALLET_TOWN, ROUTE_1, etc.) — those are the keys the
// runtime uses to look up encounters for the player's current zone.
function resolveWildMapId(fireredMapId: string, mapId: MapID): string | null {
  if (mapId !== 'KANTO_OVERWORLD') return mapId;
  const zoneName = fireredMapId
    .replace(/^MAP_/, '')
    .replace(/^ROUTE(\d)/, 'ROUTE_$1')
    .replace(/^ROUTE21_NORTH$/, 'ROUTE_21')
    .replace(/^ROUTE21_SOUTH$/, 'ROUTE_21')
    .replace(/^INDIGO_PLATEAU_EXTERIOR$/, 'INDIGO_PLATEAU');
  return (KANTO_FIRERED_ZONE_OFFSETS as Record<string, unknown>)[zoneName] ? zoneName : null;
}
