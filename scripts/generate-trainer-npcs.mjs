#!/usr/bin/env node

/**
 * generate-trainer-npcs.mjs
 *
 * Reads pokered disassembly (object files + parties.asm) and generates
 * TypeScript trainer NPC entries for npcDatabase.ts.
 *
 * Usage:  node scripts/generate-trainer-npcs.mjs
 * Output: scripts/out/trainer_entries.txt  (paste into npcDatabase.ts)
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POKERED = join(ROOT, 'pokered_dissasembly');
const OBJECTS_DIR = join(POKERED, 'data', 'maps', 'objects');
const PARTIES_ASM = join(POKERED, 'data', 'trainers', 'parties.asm');
const OUT_DIR = join(__dirname, 'out');
const OUT_FILE = join(OUT_DIR, 'trainer_entries.txt');

// ─── Species lookup: pokered name → { speciesId, spriteNum, types[] } ──────

const SPECIES = {
  BULBASAUR:  { id: 'bulbasaur',  num: 1,   types: ['grass','poison'] },
  IVYSAUR:    { id: 'ivysaur',    num: 2,   types: ['grass','poison'] },
  VENUSAUR:   { id: 'venusaur',   num: 3,   types: ['grass','poison'] },
  CHARMANDER: { id: 'charmander', num: 4,   types: ['fire'] },
  CHARMELEON: { id: 'charmeleon', num: 5,   types: ['fire'] },
  CHARIZARD:  { id: 'charizard',  num: 6,   types: ['fire','flying'] },
  SQUIRTLE:   { id: 'squirtle',   num: 7,   types: ['water'] },
  WARTORTLE:  { id: 'wartortle',  num: 8,   types: ['water'] },
  BLASTOISE:  { id: 'blastoise',  num: 9,   types: ['water'] },
  CATERPIE:   { id: 'caterpie',   num: 10,  types: ['bug'] },
  METAPOD:    { id: 'metapod',    num: 11,  types: ['bug'] },
  BUTTERFREE: { id: 'butterfree', num: 12,  types: ['bug','flying'] },
  WEEDLE:     { id: 'weedle',     num: 13,  types: ['bug','poison'] },
  KAKUNA:     { id: 'kakuna',     num: 14,  types: ['bug','poison'] },
  BEEDRILL:   { id: 'beedrill',   num: 15,  types: ['bug','poison'] },
  PIDGEY:     { id: 'pidgey',     num: 16,  types: ['normal','flying'] },
  PIDGEOTTO:  { id: 'pidgeotto',  num: 17,  types: ['normal','flying'] },
  PIDGEOT:    { id: 'pidgeot',    num: 18,  types: ['normal','flying'] },
  RATTATA:    { id: 'rattata',    num: 19,  types: ['normal'] },
  RATICATE:   { id: 'raticate',   num: 20,  types: ['normal'] },
  SPEAROW:    { id: 'spearow',    num: 21,  types: ['normal','flying'] },
  FEAROW:     { id: 'fearow',     num: 22,  types: ['normal','flying'] },
  EKANS:      { id: 'ekans',      num: 23,  types: ['poison'] },
  ARBOK:      { id: 'arbok',      num: 24,  types: ['poison'] },
  PIKACHU:    { id: 'pikachu',    num: 25,  types: ['electric'] },
  RAICHU:     { id: 'raichu',     num: 26,  types: ['electric'] },
  SANDSHREW:  { id: 'sandshrew',  num: 27,  types: ['ground'] },
  SANDSLASH:  { id: 'sandslash',  num: 28,  types: ['ground'] },
  NIDORAN_F:  { id: 'nidoran-f',  num: 29,  types: ['poison'] },
  NIDORINA:   { id: 'nidorina',   num: 30,  types: ['poison'] },
  NIDOQUEEN:  { id: 'nidoqueen',  num: 31,  types: ['poison','ground'] },
  NIDORAN_M:  { id: 'nidoran-m',  num: 32,  types: ['poison'] },
  NIDORINO:   { id: 'nidorino',   num: 33,  types: ['poison'] },
  NIDOKING:   { id: 'nidoking',   num: 34,  types: ['poison','ground'] },
  CLEFAIRY:   { id: 'clefairy',   num: 35,  types: ['normal'] },
  CLEFABLE:   { id: 'clefable',   num: 36,  types: ['normal'] },
  VULPIX:     { id: 'vulpix',     num: 37,  types: ['fire'] },
  NINETALES:  { id: 'ninetales',  num: 38,  types: ['fire'] },
  JIGGLYPUFF: { id: 'jigglypuff', num: 39,  types: ['normal'] },
  WIGGLYTUFF: { id: 'wigglytuff', num: 40,  types: ['normal'] },
  ZUBAT:      { id: 'zubat',      num: 41,  types: ['poison','flying'] },
  GOLBAT:     { id: 'golbat',     num: 42,  types: ['poison','flying'] },
  ODDISH:     { id: 'oddish',     num: 43,  types: ['grass','poison'] },
  GLOOM:      { id: 'gloom',      num: 44,  types: ['grass','poison'] },
  VILEPLUME:  { id: 'vileplume',  num: 45,  types: ['grass','poison'] },
  PARAS:      { id: 'paras',      num: 46,  types: ['bug','grass'] },
  PARASECT:   { id: 'parasect',   num: 47,  types: ['bug','grass'] },
  VENONAT:    { id: 'venonat',    num: 48,  types: ['bug','poison'] },
  VENOMOTH:   { id: 'venomoth',   num: 49,  types: ['bug','poison'] },
  DIGLETT:    { id: 'diglett',    num: 50,  types: ['ground'] },
  DUGTRIO:    { id: 'dugtrio',    num: 51,  types: ['ground'] },
  MEOWTH:     { id: 'meowth',     num: 52,  types: ['normal'] },
  PERSIAN:    { id: 'persian',    num: 53,  types: ['normal'] },
  PSYDUCK:    { id: 'psyduck',    num: 54,  types: ['water'] },
  GOLDUCK:    { id: 'golduck',    num: 55,  types: ['water'] },
  MANKEY:     { id: 'mankey',     num: 56,  types: ['fighting'] },
  PRIMEAPE:   { id: 'primeape',   num: 57,  types: ['fighting'] },
  GROWLITHE:  { id: 'growlithe',  num: 58,  types: ['fire'] },
  ARCANINE:   { id: 'arcanine',   num: 59,  types: ['fire'] },
  POLIWAG:    { id: 'poliwag',    num: 60,  types: ['water'] },
  POLIWHIRL:  { id: 'poliwhirl',  num: 61,  types: ['water'] },
  POLIWRATH:  { id: 'poliwrath',  num: 62,  types: ['water','fighting'] },
  ABRA:       { id: 'abra',       num: 63,  types: ['psychic'] },
  KADABRA:    { id: 'kadabra',    num: 64,  types: ['psychic'] },
  ALAKAZAM:   { id: 'alakazam',   num: 65,  types: ['psychic'] },
  MACHOP:     { id: 'machop',     num: 66,  types: ['fighting'] },
  MACHOKE:    { id: 'machoke',    num: 67,  types: ['fighting'] },
  MACHAMP:    { id: 'machamp',    num: 68,  types: ['fighting'] },
  BELLSPROUT: { id: 'bellsprout', num: 69,  types: ['grass','poison'] },
  WEEPINBELL: { id: 'weepinbell', num: 70,  types: ['grass','poison'] },
  VICTREEBEL: { id: 'victreebel', num: 71,  types: ['grass','poison'] },
  TENTACOOL:  { id: 'tentacool',  num: 72,  types: ['water','poison'] },
  TENTACRUEL: { id: 'tentacruel', num: 73,  types: ['water','poison'] },
  GEODUDE:    { id: 'geodude',    num: 74,  types: ['rock','ground'] },
  GRAVELER:   { id: 'graveler',   num: 75,  types: ['rock','ground'] },
  GOLEM:      { id: 'golem',      num: 76,  types: ['rock','ground'] },
  PONYTA:     { id: 'ponyta',     num: 77,  types: ['fire'] },
  RAPIDASH:   { id: 'rapidash',   num: 78,  types: ['fire'] },
  SLOWPOKE:   { id: 'slowpoke',   num: 79,  types: ['water','psychic'] },
  SLOWBRO:    { id: 'slowbro',    num: 80,  types: ['water','psychic'] },
  MAGNEMITE:  { id: 'magnemite',  num: 81,  types: ['electric'] },
  MAGNETON:   { id: 'magneton',   num: 82,  types: ['electric'] },
  FARFETCHD:  { id: 'farfetchd',  num: 83,  types: ['normal','flying'] },
  DODUO:      { id: 'doduo',      num: 84,  types: ['normal','flying'] },
  DODRIO:     { id: 'dodrio',     num: 85,  types: ['normal','flying'] },
  SEEL:       { id: 'seel',       num: 86,  types: ['water'] },
  DEWGONG:    { id: 'dewgong',    num: 87,  types: ['water','ice'] },
  GRIMER:     { id: 'grimer',     num: 88,  types: ['poison'] },
  MUK:        { id: 'muk',        num: 89,  types: ['poison'] },
  SHELLDER:   { id: 'shellder',   num: 90,  types: ['water'] },
  CLOYSTER:   { id: 'cloyster',   num: 91,  types: ['water','ice'] },
  GASTLY:     { id: 'gastly',     num: 92,  types: ['ghost','poison'] },
  HAUNTER:    { id: 'haunter',    num: 93,  types: ['ghost','poison'] },
  GENGAR:     { id: 'gengar',     num: 94,  types: ['ghost','poison'] },
  ONIX:       { id: 'onix',       num: 95,  types: ['rock','ground'] },
  DROWZEE:    { id: 'drowzee',    num: 96,  types: ['psychic'] },
  HYPNO:      { id: 'hypno',      num: 97,  types: ['psychic'] },
  KRABBY:     { id: 'krabby',     num: 98,  types: ['water'] },
  KINGLER:    { id: 'kingler',    num: 99,  types: ['water'] },
  VOLTORB:    { id: 'voltorb',    num: 100, types: ['electric'] },
  ELECTRODE:  { id: 'electrode',  num: 101, types: ['electric'] },
  EXEGGCUTE:  { id: 'exeggcute',  num: 102, types: ['grass','psychic'] },
  EXEGGUTOR:  { id: 'exeggutor',  num: 103, types: ['grass','psychic'] },
  CUBONE:     { id: 'cubone',     num: 104, types: ['ground'] },
  MAROWAK:    { id: 'marowak',    num: 105, types: ['ground'] },
  HITMONLEE:  { id: 'hitmonlee',  num: 106, types: ['fighting'] },
  HITMONCHAN: { id: 'hitmonchan', num: 107, types: ['fighting'] },
  LICKITUNG:  { id: 'lickitung',  num: 108, types: ['normal'] },
  KOFFING:    { id: 'koffing',    num: 109, types: ['poison'] },
  WEEZING:    { id: 'weezing',    num: 110, types: ['poison'] },
  RHYHORN:    { id: 'rhyhorn',    num: 111, types: ['ground','rock'] },
  RHYDON:     { id: 'rhydon',     num: 112, types: ['ground','rock'] },
  CHANSEY:    { id: 'chansey',    num: 113, types: ['normal'] },
  TANGELA:    { id: 'tangela',    num: 114, types: ['grass'] },
  KANGASKHAN: { id: 'kangaskhan', num: 115, types: ['normal'] },
  HORSEA:     { id: 'horsea',     num: 116, types: ['water'] },
  SEADRA:     { id: 'seadra',     num: 117, types: ['water'] },
  GOLDEEN:    { id: 'goldeen',    num: 118, types: ['water'] },
  SEAKING:    { id: 'seaking',    num: 119, types: ['water'] },
  STARYU:     { id: 'staryu',     num: 120, types: ['water'] },
  STARMIE:    { id: 'starmie',    num: 121, types: ['water','psychic'] },
  MR_MIME:    { id: 'mr-mime',    num: 122, types: ['psychic'] },
  SCYTHER:    { id: 'scyther',    num: 123, types: ['bug','flying'] },
  JYNX:       { id: 'jynx',       num: 124, types: ['ice','psychic'] },
  ELECTABUZZ: { id: 'electabuzz', num: 125, types: ['electric'] },
  MAGMAR:     { id: 'magmar',     num: 126, types: ['fire'] },
  PINSIR:     { id: 'pinsir',     num: 127, types: ['bug'] },
  TAUROS:     { id: 'tauros',     num: 128, types: ['normal'] },
  MAGIKARP:   { id: 'magikarp',   num: 129, types: ['water'] },
  GYARADOS:   { id: 'gyarados',   num: 130, types: ['water','flying'] },
  LAPRAS:     { id: 'lapras',     num: 131, types: ['water','ice'] },
  DITTO:      { id: 'ditto',      num: 132, types: ['normal'] },
  EEVEE:      { id: 'eevee',      num: 133, types: ['normal'] },
  VAPOREON:   { id: 'vaporeon',   num: 134, types: ['water'] },
  JOLTEON:    { id: 'jolteon',    num: 135, types: ['electric'] },
  FLAREON:    { id: 'flareon',    num: 136, types: ['fire'] },
  PORYGON:    { id: 'porygon',    num: 137, types: ['normal'] },
  OMANYTE:    { id: 'omanyte',    num: 138, types: ['rock','water'] },
  OMASTAR:    { id: 'omastar',    num: 139, types: ['rock','water'] },
  KABUTO:     { id: 'kabuto',     num: 140, types: ['rock','water'] },
  KABUTOPS:   { id: 'kabutops',   num: 141, types: ['rock','water'] },
  AERODACTYL: { id: 'aerodactyl', num: 142, types: ['rock','flying'] },
  SNORLAX:    { id: 'snorlax',    num: 143, types: ['normal'] },
  ARTICUNO:   { id: 'articuno',   num: 144, types: ['ice','flying'] },
  ZAPDOS:     { id: 'zapdos',     num: 145, types: ['electric','flying'] },
  MOLTRES:    { id: 'moltres',    num: 146, types: ['fire','flying'] },
  DRATINI:    { id: 'dratini',    num: 147, types: ['dragon'] },
  DRAGONAIR:  { id: 'dragonair',  num: 148, types: ['dragon'] },
  DRAGONITE:  { id: 'dragonite',  num: 149, types: ['dragon','flying'] },
  MEWTWO:     { id: 'mewtwo',     num: 150, types: ['psychic'] },
  MEW:        { id: 'mew',        num: 151, types: ['psychic'] },
};

// ─── Move assignment: type → default moves ─────────────────────────────────

const MOVE_POOL = {
  normal:    ['TACKLE', 'SCRATCH', 'POUND', 'QUICK_ATTACK', 'HEADBUTT', 'SLASH', 'BODY_SLAM'],
  fighting:  ['DOUBLE_KICK', 'ROLLING_KICK', 'SEISMIC_TOSS', 'COUNTER'],
  flying:    ['GUST', 'PECK', 'WING_ATTACK', 'DRILL_PECK'],
  poison:    ['POISON_POWDER', 'SLUDGE', 'SMOKESCREEN'],
  ground:    ['DIG', 'EARTHQUAKE', 'ROCK_THROW'],
  rock:      ['ROCK_THROW', 'ROCK_SLIDE', 'HARDEN'],
  bug:       ['STRING_SHOT', 'SLASH'],
  ghost:     ['LICK', 'DREAM_EATER'],
  fire:      ['EMBER', 'FLAMETHROWER', 'FIRE_BLAST', 'GROWL'],
  water:     ['WATER_GUN', 'BUBBLEBEAM', 'SURF', 'HYDRO_PUMP', 'WITHDRAW'],
  grass:     ['VINE_WHIP', 'RAZOR_LEAF', 'MEGA_DRAIN', 'SOLAR_BEAM', 'SLEEP_POWDER', 'STUN_SPORE'],
  electric:  ['THUNDERSHOCK', 'THUNDERBOLT', 'THUNDER_WAVE', 'THUNDER'],
  psychic:   ['CONFUSION', 'PSYBEAM', 'PSYCHIC', 'HYPNOSIS', 'AGILITY', 'AMNESIA', 'BARRIER'],
  ice:       ['ICE_BEAM', 'BLIZZARD'],
  dragon:    ['DRAGON_RAGE'],
};

function assignMoves(speciesName, level) {
  const sp = SPECIES[speciesName];
  if (!sp) return ['MOVES.TACKLE', 'MOVES.GROWL'];
  const types = sp.types;
  const pool = new Set();
  for (const t of types) pool.add(...(MOVE_POOL[t] || []));
  const all = [...pool];
  const picks = [];
  for (const move of all) {
    if (picks.length >= 2) break;
    if (move === 'EARTHQUAKE' && level < 30) continue;
    if (move === 'SURF' && level < 25) continue;
    if (move === 'FIRE_BLAST' && level < 35) continue;
    if (move === 'BLIZZARD' && level < 35) continue;
    if (move === 'THUNDER' && level < 35) continue;
    if (move === 'HYDRO_PUMP' && level < 35) continue;
    if (move === 'PSYCHIC' && level < 30) continue;
    if (move === 'FLAMETHROWER' && level < 25) continue;
    if (move === 'THUNDERBOLT' && level < 25) continue;
    if (move === 'ICE_BEAM' && level < 25) continue;
    if (move === 'BODY_SLAM' && level < 20) continue;
    if (move === 'DRILL_PECK' && level < 20) continue;
    if (move === 'ROCK_SLIDE' && level < 25) continue;
    if (move === 'SOLAR_BEAM' && level < 30) continue;
    if (move === 'DIG' && level < 20) continue;
    if (move === 'DREAM_EATER' && level < 20) continue;
    picks.push(move);
  }
  // Fill with basics if not enough
  if (picks.length < 2) {
    for (const move of all) {
      if (picks.length >= 2) break;
      if (!picks.includes(move)) picks.push(move);
    }
  }
  while (picks.length < 2) picks.push('TACKLE');
  return picks.slice(0, 2).map(m => `MOVES.${m}`);
}

function makePokemon(speciesName, level) {
  const sp = SPECIES[speciesName];
  if (!sp) {
    console.warn(`Unknown species: ${speciesName}`);
    return `makePokemon('rattata', 'RATTATA', ${level}, 'normal', [MOVES.TACKLE, MOVES.GROWL], 19)`;
  }
  const moves = assignMoves(speciesName, level);
  const primaryType = sp.types[0];
  const typesStr = sp.types.length > 1 ? `, { types: ['${sp.types.join(`', '`)}'] }` : '';
  return `makePokemon('${sp.id}', '${speciesName}', ${level}, '${primaryType}', [${moves.join(', ')}], ${sp.num}${typesStr})`;
}

// ─── Parse parties.asm ──────────────────────────────────────────────────────

function parseParties() {
  const content = readFileSync(PARTIES_ASM, 'utf8');
  const ptrPattern = /^\s*dw\s+(\w+Data)/gm;
  const pointerTable = [];
  let m;
  while ((m = ptrPattern.exec(content)) !== null) {
    pointerTable.push(m[1].replace('Data', ''));
  }

  const trainers = {};
  for (const className of pointerTable) {
    const re = new RegExp(String.raw`(?:^|\n)\s*${className}Data:`);
    const sectionMatch = content.match(re);
    if (!sectionMatch) continue;
    const afterColon = sectionMatch.index + sectionMatch[0].length;

    let nextPos = Infinity;
    for (const c of pointerTable) {
      if (c === className) continue;
      const re2 = new RegExp(String.raw`(?:^|\n)\s*${c}Data:`);
      const m2 = content.match(re2);
      if (m2 && m2.index > afterColon) {
        nextPos = Math.min(nextPos, m2.index);
      }
    }

    const section = nextPos === Infinity
      ? content.slice(afterColon)
      : content.slice(afterColon, nextPos);

    const dbLinePattern = /\s*db\s+(.+)/g;
    const dbLines = [];
    let dbMatch;
    while ((dbMatch = dbLinePattern.exec(section)) !== null) {
      const line = dbMatch[1].trim();
      if (line === '0') continue;
      dbLines.push(line);
    }

    const teams = [];
    for (const line of dbLines) {
      const parts = line.split(',').map(s => s.trim());
      const team = [];
      if (parts[0].toUpperCase() === '$FF') {
        for (let i = 1; i < parts.length - 1; i += 2) {
          if (parts[i] === '0') break;
          const lev = parseInt(parts[i], 10);
          if (isNaN(lev) || !parts[i + 1]) break;
          team.push({ level: lev, species: parts[i + 1] });
        }
      } else {
        const level = parseInt(parts[0], 10);
        if (isNaN(level)) continue;
        for (let i = 1; i < parts.length; i++) {
          if (parts[i] === '0') break;
          team.push({ level, species: parts[i] });
        }
      }
      if (team.length > 0) teams.push(team);
    }
    if (teams.length > 0) trainers[className] = teams;
  }
  return trainers;
}

// ─── Parse object files for OPP_ references ─────────────────────────────────

function oppToClass(oppName) {
  // OPP_BUG_CATCHER → BugCatcher
  // OPP_PSYCHIC_TR → Psychic (not PsychicTr — parties.asm uses PsychicData)
  const className = oppName.replace('OPP_', '');
  // Special mappings
  if (className === 'PSYCHIC_TR') return 'Psychic';
  const parts = className.split('_');
  return parts.map((p, i) => {
    if (p === 'F' && i > 0) return 'F';
    if (p === 'M' && i > 0) return 'M';
    return p[0] + p.slice(1).toLowerCase();
  }).join('');
}

function parseObjectFile(content) {
  const trainers = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const oppMatch = line.match(/object_event\s+(\d+),\s*(\d+),\s*(\w+).*OPP_(\w+),\s*(\d+)/);
    if (oppMatch) {
      trainers.push({
        x: parseInt(oppMatch[1], 10),
        y: parseInt(oppMatch[2], 10),
        sprite: oppMatch[3],
        oppClass: oppToClass(`OPP_${oppMatch[4]}`),
        oppIndex: parseInt(oppMatch[5], 10) - 1, // 0-based
      });
    }
  }
  return trainers;
}

// ─── Map pokered name to our MapID ─────────────────────────────────────────

function pokeredToMapID(name) {
  const special = {
    'RedsHouse1F': 'PLAYERS_HOUSE_1F', 'RedsHouse2F': 'PLAYERS_HOUSE_2F',
    'BluesHouse': 'RIVALS_HOUSE', 'OaksLab': 'OAKS_LAB',
    'PewterGym': 'PEWTER_GYM', 'CeruleanGym': 'CERULEAN_GYM',
    'VermilionGym': 'VERMILION_GYM', 'CeladonGym': 'CELADON_GYM',
    'FuchsiaGym': 'FUCHSIA_GYM', 'SaffronGym': 'SAFFRON_GYM',
    'CinnabarGym': 'CINNABAR_GYM', 'ViridianGym': 'VIRIDIAN_GYM',
    'MtMoon1F': 'MT_MOON', 'MtMoonB2F': 'MT_MOON_B2F',
    'RockTunnel1F': 'ROCK_TUNNEL_1F', 'RockTunnelB1F': 'ROCK_TUNNEL_B1F',
    'PokemonTower3F': 'POKEMON_TOWER_3F', 'PokemonTower4F': 'POKEMON_TOWER_4F',
    'PokemonTower5F': 'POKEMON_TOWER_5F', 'PokemonTower6F': 'POKEMON_TOWER_6F',
    'PokemonTower7F': 'POKEMON_TOWER_7F',
    'PokemonMansion1F': 'POKEMON_MANSION_1F', 'PokemonMansion2F': 'POKEMON_MANSION_2F',
    'PokemonMansion3F': 'POKEMON_MANSION_3F', 'PokemonMansionB1F': 'POKEMON_MANSION_B1F',
    'CeruleanCity': 'KANTO_OVERWORLD',
    'VermilionCity': 'KANTO_OVERWORLD',
    'CeladonCity': 'KANTO_OVERWORLD',
    'SaffronCity': 'KANTO_OVERWORLD',
    'FuchsiaCity': 'KANTO_OVERWORLD',
    'CinnabarIsland': 'KANTO_OVERWORLD',
    'ViridianCity': 'KANTO_OVERWORLD',
    'PewterCity': 'KANTO_OVERWORLD',
    'PalletTown': 'KANTO_OVERWORLD',
    'LavenderTown': 'KANTO_OVERWORLD',
  };
  if (special[name]) return special[name];
  const routeMatch = name.match(/^Route(\d+)$/);
  if (routeMatch) return 'KANTO_OVERWORLD';
  return null; // unmapped interior
}

// ─── Zone offsets for outdoor trainers ──────────────────────────────────────

const O = {
  PALLET_TOWN:     { x: 118, y: 196 },
  ROUTE_1:         { x: 118, y: 161 },
  VIRIDIAN_CITY:   { x: 108, y: 126 },
  ROUTE_2:         { x: 124, y:  87 },
  VIRIDIAN_FOREST: { x: 112, y:  40 },
  PEWTER_CITY:     { x: 108, y:   5 },
  ROUTE_3:         { x: 147, y:  16 },
  ROUTE_4:         { x: 177, y:  12 },
  CERULEAN_CITY:   { x: 216, y:   0 },
  ROUTE_5:         { x: 232, y:  35 },
  SAFFRON_CITY:    { x: 216, y:  51 },
  ROUTE_7:         { x: 197, y:  65 },
  ROUTE_8:         { x: 255, y:  65 },
  ROUTE_6:         { x: 232, y:  86 },
  VERMILION_CITY:  { x: 216, y: 102 },
  ROUTE_9:         { x: 255, y:  12 },
  ROUTE_10:        { x: 270, y:  16 },
  LAVENDER_TOWN:   { x: 264, y:  39 },
  ROUTE_11:        { x: 255, y: 115 },
  ROUTE_12:        { x: 264, y:  56 },
  ROUTE_13:        { x: 225, y: 163 },
  ROUTE_14:        { x: 206, y: 180 },
  ROUTE_15:        { x: 147, y: 224 },
  FUCHSIA_CITY:    { x: 108, y: 216 },
  ROUTE_16:        { x: 109, y:  66 },
  ROUTE_17:        { x: 109, y:  83 },
  ROUTE_18:        { x: 109, y: 226 },
  ROUTE_22:        { x: 618, y: 396 },
  ROUTE_24:        { x: 618, y: 596 },
  ROUTE_25:        { x: 637, y: 596 },
  CELADON_CITY:    { x: 148, y:  61 },
  ROUTE_19:        { x: 118, y: 251 },
  ROUTE_20:        { x:  19, y: 300 },
  CINNABAR_ISLAND: { x:   0, y: 300 },
  ROUTE_21:        { x:   0, y: 211 },
  ROUTE_23:        { x: 608, y: 257 },
  INDIGO_PLATEAU:  { x: 608, y: 240 },
};

function pokeredZoneToOffsetKey(name) {
  if (name === 'Route1') return 'ROUTE_1';
  if (name === 'Route2') return 'ROUTE_2';
  if (name === 'Route3') return 'ROUTE_3';
  if (name === 'Route4') return 'ROUTE_4';
  // ... etc all routes
  const routeMatch = name.match(/^Route(\d+)$/);
  if (routeMatch) return `ROUTE_${routeMatch[1]}`;
  const cityMap = {
    'PalletTown': 'PALLET_TOWN', 'ViridianCity': 'VIRIDIAN_CITY', 'PewterCity': 'PEWTER_CITY',
    'CeruleanCity': 'CERULEAN_CITY', 'VermilionCity': 'VERMILION_CITY', 'LavenderTown': 'LAVENDER_TOWN',
    'CeladonCity': 'CELADON_CITY', 'FuchsiaCity': 'FUCHSIA_CITY', 'SaffronCity': 'SAFFRON_CITY',
    'CinnabarIsland': 'CINNABAR_ISLAND', 'ViridianForest': 'VIRIDIAN_FOREST',
  };
  return cityMap[name] || null;
}

function worldPos(pokeredMapName, lx, ly) {
  const key = pokeredZoneToOffsetKey(pokeredMapName);
  if (!key || !O[key]) return { x: lx, y: ly };
  return { x: O[key].x + lx, y: O[key].y + ly };
}

// ─── Trainer class name: pokered → Spanish display name ─────────────────────

const CLASS_SPANISH = {
  Youngster: 'JOVEN', BugCatcher: 'CAZABICHOS', Lass: 'CHICA',
  Sailor: 'MARINERO', JrTrainerM: 'ENTRENADOR', JrTrainerF: 'ENTRENADORA',
  Pokemaniac: 'POKÉMANÍACO', SuperNerd: 'SABIONDO', Hiker: 'MONTAÑERO',
  Biker: 'MOTORISTA', Burglar: 'LADRÓN', Engineer: 'INGENIERO',
  Fisher: 'PESCADOR', Swimmer: 'NADADOR', CueBall: 'GOLFO',
  Gambler: 'GOLFO', Beauty: 'BELLEZA', Psychic: 'PSÍQUICO',
  PsychicTr: 'PSÍQUICO', Rocker: 'ROCKERO', Juggler: 'MALABARISTA',
  Tamer: 'DOMADOR', BirdKeeper: 'ORNITÓLOGO', Blackbelt: 'KARATEKA',
  Rival1: 'AZUL', Rival2: 'AZUL', Rival3: 'AZUL',
  ProfOak: 'PROF. OAK', Scientist: 'CIENTÍFICO', Giovanni: 'GIOVANNI',
  Rocket: 'SOLDADO ROCKET', CooltrainerM: 'ENTRENADOR', CooltrainerF: 'ENTRENADORA',
  Bruno: 'BRUNO', Brock: 'BROCK', Misty: 'MISTY', LtSurge: 'TENIENTE SURGE',
  Erika: 'ERIKA', Koga: 'KOGA', Blaine: 'BLAINE', Sabrina: 'SABRINA',
  Gentleman: 'CABALLERO', Lorelei: 'LORELEI', Channeler: 'CANALERA',
  Agatha: 'AGATHA', Lance: 'LANCE',
};

const CLASS_TS = {
  Youngster: 'youngster', BugCatcher: 'bugcatcher', Lass: 'lass',
  Sailor: 'sailor', JrTrainerM: 'cooltrainer_m', JrTrainerF: 'cooltrainer_f',
  Pokemaniac: 'pokemaniac', SuperNerd: 'supernerd', Hiker: 'hiker',
  Biker: 'biker', Fisher: 'fisher', Swimmer: 'swimmer',
  CueBall: 'gambler', Gambler: 'gambler', Beauty: 'beauty',
  Psychic: 'psychic', PsychicTr: 'psychic', Rocker: 'rocker', Juggler: 'juggler',
  Tamer: 'tamer', BirdKeeper: 'birdkeeper',
  Rival1: 'rival', Rival2: 'rival', Rival3: 'rival',
  Scientist: 'scientist', Rocket: 'rocket',
  CooltrainerM: 'cooltrainer_m', CooltrainerF: 'cooltrainer_f',
  Brock: 'brock', Misty: 'misty', LtSurge: 'lt_surge',
  Erika: 'erika', Koga: 'koga', Blaine: 'blaine', Sabrina: 'sabrina',
  Giovanni: 'giovanni', Gentleman: 'gentleman', Channeler: 'channeler',
  Bruno: 'bruno', Lorelei: 'lorelei', Agatha: 'agatha', Lance: 'lance',
  Blackbelt: 'blackbelt', Engineer: 'engineer', Burglar: 'burglar',
};

// Direction mapping from pokered movement types
const DIR_MAP = { STAY: 'down', NONE: 'down', UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right' };

// ─── Generate entries ───────────────────────────────────────────────────────

const parties = parseParties();
console.log(`Parsed ${Object.keys(parties).length} trainer classes`);

const objFiles = readdirSync(OBJECTS_DIR).filter(f => f.endsWith('.asm'));

const allEntries = {};

for (const file of objFiles) {
  const basename = file.replace('.asm', '');
  const mapID = pokeredToMapID(basename);
  if (!mapID) continue;

  const content = readFileSync(join(OBJECTS_DIR, file), 'utf8');
  const opps = parseObjectFile(content);
  if (opps.length === 0) continue;

  const entries = [];
  for (const opp of opps) {
    const classParty = parties[opp.oppClass];
    if (!classParty || !classParty[opp.oppIndex]) {
      console.warn(`No party for ${opp.oppClass}[${opp.oppIndex}] in ${basename}`);
      continue;
    }
    const team = classParty[opp.oppIndex];
    const teamStr = team.map(p => makePokemon(p.species, p.level)).join(', ');

    // Generate id: lowercasename_mapid_index
    const idBase = opp.oppClass.toLowerCase() + '_' + mapID.toLowerCase() + '_' + opp.oppIndex;
    const safeId = idBase.replace(/[^a-z0-9_]/g, '_').slice(0, 50);

    // Position
    let posStr;
    if (mapID === 'KANTO_OVERWORLD') {
      const wp = worldPos(basename, opp.x, opp.y);
      posStr = `w('${pokeredZoneToOffsetKey(basename)}', ${opp.x}, ${opp.y})`;
    } else {
      posStr = `{ x: ${opp.x}, y: ${opp.y} }`;
    }

    const dir = DIR_MAP[opp.sprite.split('_').pop()] || 'down';
    const spanishName = CLASS_SPANISH[opp.oppClass] || opp.oppClass.toUpperCase();
    const tsClass = CLASS_TS[opp.oppClass] || 'youngster';

    const entry = `{ id: '${safeId}', name: '${spanishName}', type: 'npc', position: ${posStr}, direction: '${dir}', trainerClass: '${tsClass}', dialogue: ['\\u00A1Prep\\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [${teamStr}] },`;
    entries.push(entry);
  }

  if (entries.length > 0) {
    if (!allEntries[mapID]) allEntries[mapID] = [];
    allEntries[mapID].push(...entries);
  }
}

// ─── Write output ───────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });
let out = '// Auto-generated trainer NPC entries\n';
out += `// ${new Date().toISOString()}\n`;
out += `// Paste into buildNPCDatabase() in src/data/npcDatabase.ts\n\n`;

for (const [mapID, entries] of Object.entries(allEntries)) {
  out += `// ── ${mapID} ──\n`;
  for (const e of entries) {
    out += e + '\n';
  }
  out += '\n';
}

writeFileSync(OUT_FILE, out);

// Report
const total = Object.values(allEntries).reduce((s, e) => s + e.length, 0);
console.log(`\nWrote ${total} trainer entries for ${Object.keys(allEntries).length} maps to ${OUT_FILE}`);
for (const [map, entries] of Object.entries(allEntries)) {
  console.log(`  ${map}: ${entries.length} trainers`);
}
