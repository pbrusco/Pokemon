import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const POKERED = '/Users/pbrusco/projects/poke/pokered_dissasembly';

// ─── Species map ───
function parseSpecies() {
  const txt = readFileSync(join(POKERED, 'constants/pokemon_constants.asm'), 'utf8');
  const m = {}; let i = 0;
  for (const l of txt.split('\n')) {
    const mc = l.match(/^\tconst\s+(\w+)/);
    if (mc) { m[String(i)] = mc[1]; i++; }
    else if (l.match(/^\tconst_skip/)) { i++; }
  }
  return m;
}

// ─── Parties ───
function parseParties() {
  const txt = readFileSync(join(POKERED, 'data/trainers/parties.asm'), 'utf8');
  const p = {}; let cls = null, idx = 1;
  for (const l of txt.split('\n')) {
    const t = l.trim();
    if (!t || t[0] === ';') continue;
    if (t.startsWith('TrainerDataPointers') || t.startsWith('table_width') ||
        t.startsWith('dw ') || t.startsWith('DEF ') || t.startsWith('assert_')) continue;
    const sec = t.match(/^(\w+Data):$/);
    if (sec) { cls = sec[1].replace('Data',''); p[cls] = {}; idx = 1; continue; }
    const pm = t.match(/^db\s+(.*)/);
    if (!pm || !cls) continue;
    const v = pm[1].replace(/\$FF/g,'255').split(/\s*,\s*/).filter(x=>x);
    const team = [];
    if (v[0] === '255') {
      for (let i = 1; i < v.length && v[i] !== '0'; i += 2)
        team.push({ species: v[i+1]?.replace(',',''), level: parseInt(v[i]) });
    } else {
      const lv = parseInt(v[0]);
      for (let i = 1; i < v.length && v[i] !== '0'; i++)
        team.push({ species: v[i], level: lv });
    }
    if (team.length) { p[cls][String(idx)] = team; }
    idx++;
  }
  return p;
}

// ─── Map filename → map key ───
function pokeredFileToMapKey(filename) {
  const f = filename.replace('.asm','');
  const u = f.toUpperCase();

  // Full mapping table — order matters for overlaps
  const map = {
    // ── Towns & Cities (outdoor zones in KANTO_OVERWORLD) ──
    'PALLETTOWN': 'PALLET_TOWN',
    'VIRIDIANCITY': 'VIRIDIAN_CITY',
    'PEWTERCITY': 'PEWTER_CITY',
    'CERULEANCITY': 'CERULEAN_CITY',
    'CERULEANCITY_2': 'CERULEAN_CITY',
    'VERMILIONCITY': 'VERMILION_CITY',
    'LAVENDERTOWN': 'LAVENDER_TOWN',
    'CELADONCITY': 'CELADON_CITY',
    'FUCHSIACITY': 'FUCHSIA_CITY',
    'SAFFRONCITY': 'SAFFRON_CITY',
    'CINNABARISLAND': 'CINNABAR_ISLAND',
    // ── Routes ──
    'ROUTE1': 'ROUTE_1', 'ROUTE2': 'ROUTE_2', 'ROUTE3': 'ROUTE_3', 'ROUTE4': 'ROUTE_4',
    'ROUTE5': 'ROUTE_5', 'ROUTE6': 'ROUTE_6', 'ROUTE7': 'ROUTE_7', 'ROUTE8': 'ROUTE_8',
    'ROUTE9': 'ROUTE_9', 'ROUTE10': 'ROUTE_10', 'ROUTE11': 'ROUTE_11', 'ROUTE12': 'ROUTE_12',
    'ROUTE13': 'ROUTE_13', 'ROUTE14': 'ROUTE_14', 'ROUTE15': 'ROUTE_15', 'ROUTE16': 'ROUTE_16',
    'ROUTE17': 'ROUTE_17', 'ROUTE18': 'ROUTE_18', 'ROUTE19': 'ROUTE_19', 'ROUTE20': 'ROUTE_20',
    'ROUTE21': 'ROUTE_21', 'ROUTE22': 'ROUTE_22', 'ROUTE23': 'ROUTE_23',
    'ROUTE24': 'ROUTE_24', 'ROUTE25': 'ROUTE_25',
    // ── Special outdoor ──
    'INDIGOPLATEAU': 'INDIGO_PLATEAU',
    'VIRIDIANFOREST': 'VIRIDIAN_FOREST',
    // ── Gyms ──
    'PEWTERGYM': 'PEWTER_GYM', 'CERULEANGYM': 'CERULEAN_GYM',
    'VERMILIONGYM': 'VERMILION_GYM', 'CELADONGYM': 'CELADON_GYM',
    'FUCHSIAGYM': 'FUCHSIA_GYM', 'SAFFRONGYM': 'SAFFRON_GYM',
    'CINNABARGYM': 'CINNABAR_GYM', 'VIRIDIANGYM': 'VIRIDIAN_GYM',
    // ── Pokecenters (template) ──
    'VIRIDIANPOKECENTER': 'POKECENTER', 'PEWTERPOKECENTER': 'POKECENTER',
    'CERULEANPOKECENTER': 'POKECENTER', 'VERMILIONPOKECENTER': 'POKECENTER',
    'LAVENDERPOKECENTER': 'POKECENTER', 'CELADONPOKECENTER': 'POKECENTER',
    'FUCHSIAPOKECENTER': 'POKECENTER', 'SAFFRONPOKECENTER': 'POKECENTER',
    'CINNABARPOKECENTER': 'POKECENTER',
    // ── Pokemarts (template) ──
    'VIRIDIANMART': 'POKEMART', 'PEWTERMART': 'POKEMART', 'CERULEANMART': 'POKEMART',
    'VERMILIONMART': 'POKEMART', 'LAVENDERMART': 'POKEMART',
    'FUCHSIAMART': 'POKEMART', 'SAFFRONMART': 'POKEMART', 'CINNABARMART': 'POKEMART',
    // ── Celadon Dept Store ──
    'CELADONMART1F': 'CELADON_MART_1F', 'CELADONMART2F': 'CELADON_MART_2F',
    'CELADONMART3F': 'CELADON_MART_3F', 'CELADONMART4F': 'CELADON_MART_4F',
    'CELADONMART5F': 'CELADON_MART_5F',
    'CELADONMARTELEVATOR': 'CELADON_MART_ELEVATOR', 'CELADONMARTROOF': 'CELADON_MART_ROOF',
    // ── Houses / indoor ──
    'OAKS_LAB': 'OAKS_LAB', 'REDS_HOUSE_1F': 'PLAYERS_HOUSE_1F', 'REDS_HOUSE_2F': 'PLAYERS_HOUSE_2F',
    'BLUES_HOUSE': 'RIVALS_HOUSE', 'BILLS_HOUSE': 'BILLS_HOUSE',
    'MUSEUM1F': 'MUSEUM_1F', 'MUSEUM2F': 'MUSEUM_2F',
    'BIKESHOP': 'BIKE_SHOP', 'WARDENSHOUSE': 'WARDENS_HOUSE',
    'POKEMONFANCLUB': 'POKEMON_FAN_CLUB', 'DAYCARE': 'DAYCARE',
    'NAMERATERSHOUSE': 'NAME_RATERS_HOUSE',
    'VIRIDIANSCHOOLHOUSE': 'VIRIDIAN_SCHOOL_HOUSE',
    'VIRIDIANNICKNAMEHOUSE': 'VIRIDIAN_NICKNAME_HOUSE',
    'PEWTERSPEECHHOUSE': 'PEWTER_SPEECH_HOUSE', 'PEWTERNIDORANHOUSE': 'PEWTER_NIDORAN_HOUSE',
    'CERULEANTRADEDHOUSE': 'CERULEAN_TRADE_HOUSE', 'CERULEANTRASHEDHOUSE': 'CERULEAN_TRASHED_HOUSE',
    'CERULEANBADGEHOUSE': 'CERULEAN_BADGE_HOUSE',
    'VERMILIONTRADEHOUSE': 'VERMILION_TRADE_HOUSE', 'VERMILIONPIDGEYHOUSE': 'VERMILION_PIDGEY_HOUSE',
    'VERMILIONOLDRODHOUSE': 'VERMILION_OLD_ROD_HOUSE', 'VERMILIONDOCK': 'VERMILION_DOCK',
    'LAVENDERCUBONEHOUSE': 'LAVENDER_CUBONE_HOUSE',
    'MRPSYCHICSHOUSE': 'MR_PSYCHICS_HOUSE', 'MRFUJIHOUSE': 'MR_FUJIS_HOUSE',
    'FUCHSIABILLSGRANDPASHOUSE': 'FUCHSIA_BILLS_GRANDPAS_HOUSE',
    'FUCHSIAGOODRODHOUSE': 'FUCHSIA_GOOD_ROD_HOUSE',
    'FUCHSIAMEETINGROOM': 'FUCHSIA_MEETING_ROOM',
    'SAFFRONPIDGEYHOUSE': 'SAFFRON_PIDGEY_HOUSE',
    'COPYCATSHOUSE1F': 'COPYCATS_HOUSE_1F', 'COPYCATSHOUSE2F': 'COPYCATS_HOUSE_2F',
    'ROUTE2TRADEHOUSE': 'ROUTE_2_TRADE_HOUSE',
    'ROUTE12SUPERRODHOUSE': 'ROUTE_12_SUPER_ROD_HOUSE',
    'ROUTE16FLYHOUSE': 'ROUTE_16_FLY_HOUSE',
    'CELADONCHIEFHOUSE': 'CELADON_CHIEF_HOUSE', 'CELADONHOTEL': 'CELADON_HOTEL',
    'CELADONDINER': 'CELADON_DINER',
    'CELADONMANSION1F': 'CELADON_MANSION_1F', 'CELADONMANSION2F': 'CELADON_MANSION_2F',
    'CELADONMANSION3F': 'CELADON_MANSION_3F',
    'CELADONMANSIONROOF': 'CELADON_MANSION_ROOF',
    'CELADONMANSIONROOFHOUSE': 'CELADON_MANSION_ROOF_HOUSE',
    // ── Caves / Dungeons ──
    'MTMOON1F': 'MT_MOON', 'MTMOONB1F': 'MT_MOON_B1F', 'MTMOONB2F': 'MT_MOON_B2F',
    'MTMOONPOKECENTER': 'MT_MOON_POKECENTER',
    'ROCKTUNNEL1F': 'ROCK_TUNNEL_1F', 'ROCKTUNNELB1F': 'ROCK_TUNNEL_B1F',
    'ROCKTUNNELPOKECENTER': 'ROCK_TUNNEL_POKECENTER',
    'VICTORYROAD1F': 'VICTORY_ROAD_1F', 'VICTORYROAD2F': 'VICTORY_ROAD_2F',
    'VICTORYROAD3F': 'VICTORY_ROAD_3F',
    'SEAFOAMISLANDS1F': 'SEAFOAM_ISLANDS_1F', 'SEAFOAMISLANDSB1F': 'SEAFOAM_ISLANDS_B1F',
    'SEAFOAMISLANDSB2F': 'SEAFOAM_ISLANDS_B2F', 'SEAFOAMISLANDSB3F': 'SEAFOAM_ISLANDS_B3F',
    'SEAFOAMISLANDSB4F': 'SEAFOAM_ISLANDS_B4F',
    'CERULEANCAVE1F': 'CERULEAN_CAVE_1F', 'CERULEANCAVE2F': 'CERULEAN_CAVE_2F',
    'CERULEANCAVEB1F': 'CERULEAN_CAVE_B1F',
    'DIGLETTSCAVE': 'DIGLETTS_CAVE', 'DIGLETTSCAVEROUTE2': 'DIGLETTS_CAVE_ROUTE2',
    'DIGLETTSCAVEROUTE11': 'DIGLETTS_CAVE_ROUTE11',
    'POWERPLANT': 'POWER_PLANT',
    // ── Pokémon Tower ──
    'POKEMONTOWER1F': 'POKEMON_TOWER_1F', 'POKEMONTOWER2F': 'POKEMON_TOWER_2F',
    'POKEMONTOWER3F': 'POKEMON_TOWER_3F', 'POKEMONTOWER4F': 'POKEMON_TOWER_4F',
    'POKEMONTOWER5F': 'POKEMON_TOWER_5F', 'POKEMONTOWER6F': 'POKEMON_TOWER_6F',
    'POKEMONTOWER7F': 'POKEMON_TOWER_7F',
    // ── Pokémon Mansion ──
    'POKEMONMANSION1F': 'POKEMON_MANSION_1F', 'POKEMONMANSION2F': 'POKEMON_MANSION_2F',
    'POKEMONMANSION3F': 'POKEMON_MANSION_3F', 'POKEMONMANSIONB1F': 'POKEMON_MANSION_B1F',
    // ── Rocket Hideout ──
    'ROCKETHIDEOUTB1F': 'ROCKET_HIDEOUT_B1F', 'ROCKETHIDEOUTB2F': 'ROCKET_HIDEOUT_B2F',
    'ROCKETHIDEOUTB3F': 'ROCKET_HIDEOUT_B3F', 'ROCKETHIDEOUTB4F': 'ROCKET_HIDEOUT_B4F',
    'ROCKETHIDEOUTELEVATOR': 'ROCKET_HIDEOUT_ELEVATOR',
    // ── Silph Co ──
    'SILPHCO1F': 'SILPH_CO_1F', 'SILPHCO2F': 'SILPH_CO_2F', 'SILPHCO3F': 'SILPH_CO_3F',
    'SILPHCO4F': 'SILPH_CO_4F', 'SILPHCO5F': 'SILPH_CO_5F', 'SILPHCO6F': 'SILPH_CO_6F',
    'SILPHCO7F': 'SILPH_CO_7F', 'SILPHCO8F': 'SILPH_CO_8F', 'SILPHCO9F': 'SILPH_CO_9F',
    'SILPHCO10F': 'SILPH_CO_10F', 'SILPHCO11F': 'SILPH_CO_11F',
    'SILPHCOELEVATOR': 'SILPH_CO_ELEVATOR',
    // ── SS Anne ──
    'SSANNE1F': 'SS_ANNE_1F', 'SSANNE2F': 'SS_ANNE_2F', 'SSANNE3F': 'SS_ANNE_3F',
    'SSANNEB1F': 'SS_ANNE_B1F',
    'SSANNE1FROOMS': 'SS_ANNE_1F_ROOMS', 'SSANNE2FROOMS': 'SS_ANNE_2F_ROOMS',
    'SSANNEB1FROOMS': 'SS_ANNE_B1F_ROOMS',
    'SSANNEBOW': 'SS_ANNE_BOW', 'SSANNECAPTAINSROOM': 'SS_ANNE_CAPTAINS_ROOM',
    'SSANNEKITCHEN': 'SS_ANNE_KITCHEN',
    // ── Game Corner ──
    'GAMECORNER': 'CELADON_GAME_CORNER', 'GAMECORNERPRIZEROOM': 'CELADON_GAME_CORNER_PRIZE_ROOM',
    // ── Safari Zone ──
    'SAFARIZONEGATE': 'SAFARI_ZONE_GATE',
    'SAFARIZONECENTER': 'SAFARI_ZONE_CENTER', 'SAFARIZONEEAST': 'SAFARI_ZONE_EAST',
    'SAFARIZONENORTH': 'SAFARI_ZONE_NORTH', 'SAFARIZONEWEST': 'SAFARI_ZONE_WEST',
    'SAFARIZONESECRETHOUSE': 'SAFARI_ZONE_SECRET_HOUSE',
    'SAFARIZONECENTERRESTHOUSE': 'SAFARI_ZONE_CENTER_REST_HOUSE',
    'SAFARIZONEEASTRESTHOUSE': 'SAFARI_ZONE_EAST_REST_HOUSE',
    'SAFARIZONENORTHRESTHOUSE': 'SAFARI_ZONE_NORTH_REST_HOUSE',
    'SAFARIZONEWESTRESTHOUSE': 'SAFARI_ZONE_WEST_REST_HOUSE',
    // ── Elite Four ──
    'INDIGOPLATEAULOBY': 'INDIGO_PLATEAU_LOBBY',
    'CHAMPIONSROOM': 'ELITE_FOUR_CHAMPION', 'LORELEISROOM': 'ELITE_FOUR_LORELEI',
    'BRUNOSROOM': 'ELITE_FOUR_BRUNO', 'AGATHASROOM': 'ELITE_FOUR_AGATHA',
    'LANCESROOM': 'ELITE_FOUR_LANCE', 'HALLOFFAME': 'HALL_OF_FAME',
    // ── Cinnabar Lab ──
    'CINNABARLAB': 'CINNABAR_LAB', 'CINNABARLABFOSSILROOM': 'CINNABAR_LAB_FOSSIL_ROOM',
    'CINNABARLABMETRONOMEROOM': 'CINNABAR_LAB_METRONOME_ROOM',
    'CINNABARLABTRADEROOM': 'CINNABAR_LAB_TRADE_ROOM',
    // ── Misc ──
    'COLOSSEUM': 'COLOSSEUM', 'TRADECENTER': 'TRADE_CENTER',
    'FIGHTINGDOJO': 'FIGHTING_DOJO',
    // ── Gates ──
    'ROUTE2GATE': 'ROUTE_2_GATE', 'ROUTE5GATE': 'ROUTE_5_GATE', 'ROUTE6GATE': 'ROUTE_6_GATE',
    'ROUTE7GATE': 'ROUTE_7_GATE', 'ROUTE8GATE': 'ROUTE_8_GATE',
    'ROUTE11GATE1F': 'ROUTE_11_GATE_1F', 'ROUTE11GATE2F': 'ROUTE_11_GATE_2F',
    'ROUTE12GATE1F': 'ROUTE_12_GATE_1F', 'ROUTE12GATE2F': 'ROUTE_12_GATE_2F',
    'ROUTE15GATE1F': 'ROUTE_15_GATE_1F', 'ROUTE15GATE2F': 'ROUTE_15_GATE_2F',
    'ROUTE16GATE1F': 'ROUTE_16_GATE_1F', 'ROUTE16GATE2F': 'ROUTE_16_GATE_2F',
    'ROUTE18GATE1F': 'ROUTE_18_GATE_1F', 'ROUTE18GATE2F': 'ROUTE_18_GATE_2F',
    'ROUTE22GATE': 'ROUTE_22_GATE',
    // ── Underground paths ──
    'UNDERGROUNDPATHNORTHSOUTH': 'UNDERGROUND_PATH_NORTH_SOUTH',
    'UNDERGROUNDPATHWESTEAST': 'UNDERGROUND_PATH_WEST_EAST',
    'UNDERGROUNDPATHROUTE5': 'UNDERGROUND_PATH_ROUTE_5',
    'UNDERGROUNDPATHROUTE6': 'UNDERGROUND_PATH_ROUTE_6',
    'UNDERGROUNDPATHROUTE7': 'UNDERGROUND_PATH_ROUTE_7',
    'UNDERGROUNDPATHROUTE7COPY': 'UNDERGROUND_PATH_ROUTE_7_COPY',
    'UNDERGROUNDPATHROUTE8': 'UNDERGROUND_PATH_ROUTE_8',
    'VIRIDIANFORESTNORTHGATE': 'VIRIDIAN_FOREST_NORTH_GATE',
    'VIRIDIANFORESTSOUTHGATE': 'VIRIDIAN_FOREST_SOUTH_GATE',
  };

  if (map[u]) return map[u];
  return u; // fallback: just uppercase (e.g. for maps not yet in the project)
}

// ─── Parse all object files ───
function parseAllObjects() {
  const files = readdirSync(join(POKERED, 'data/maps/objects')).filter(f => f.endsWith('.asm'));
  const trainerPositions = {};

  for (const file of files) {
    const content = readFileSync(join(POKERED, 'data/maps/objects', file), 'utf8');
    const lines = content.split('\n');
    const trainers = [];

    for (const line of lines) {
      const m = line.match(/^\tobject_event\s+(\d+),\s*(\d+),\s*SPRITE_\w+,\s*\w+,\s*\w+,\s*(\w+)/);
      if (!m) continue;
      const x = parseInt(m[1]), y = parseInt(m[2]), textLabel = m[3];
      const rest = line.substring(m[0].length);
      const oppMatch = rest.match(/,\s*(OPP_\w+),\s*(\d+)/);
      if (!oppMatch) continue;
      const oppConst = oppMatch[1];
      const oppIndex = parseInt(oppMatch[2]);
      const className = oppConst.replace('OPP_','');
      trainers.push({ x, y, oppConst, oppIndex, className, textLabel });
    }

    if (trainers.length > 0) {
      const mapKey = pokeredFileToMapKey(file);
      trainerPositions[mapKey] = trainers;
    }
  }
  return trainerPositions;
}

// ─── Convert internal party names to OPP_* keys ───
function partyNameToOPP(name) {
  // section name (e.g. "JrTrainerF") → OPP constant (e.g. "OPP_JR_TRAINER_F")
  const map = {
    'Youngster': 'OPP_YOUNGSTER', 'BugCatcher': 'OPP_BUG_CATCHER',
    'Lass': 'OPP_LASS', 'Sailor': 'OPP_SAILOR',
    'JrTrainerM': 'OPP_JR_TRAINER_M', 'JrTrainerF': 'OPP_JR_TRAINER_F',
    'Pokemaniac': 'OPP_POKEMANIAC', 'SuperNerd': 'OPP_SUPER_NERD',
    'Hiker': 'OPP_HIKER', 'Biker': 'OPP_BIKER', 'Burglar': 'OPP_BURGLAR',
    'Engineer': 'OPP_ENGINEER', 'UnusedJuggler': 'OPP_UNUSED_JUGGLER',
    'Fisher': 'OPP_FISHER', 'Swimmer': 'OPP_SWIMMER',
    'CueBall': 'OPP_CUE_BALL', 'Gambler': 'OPP_GAMBLER',
    'Beauty': 'OPP_BEAUTY', 'Psychic': 'OPP_PSYCHIC_TR',
    'Rocker': 'OPP_ROCKER', 'Juggler': 'OPP_JUGGLER', 'Tamer': 'OPP_TAMER',
    'BirdKeeper': 'OPP_BIRD_KEEPER', 'Blackbelt': 'OPP_BLACKBELT',
    'Rival1': 'OPP_RIVAL1', 'ProfOak': 'OPP_PROF_OAK',
    'Chief': 'OPP_CHIEF', 'Scientist': 'OPP_SCIENTIST',
    'Giovanni': 'OPP_GIOVANNI', 'Rocket': 'OPP_ROCKET',
    'CooltrainerM': 'OPP_COOLTRAINER_M', 'CooltrainerF': 'OPP_COOLTRAINER_F',
    'Bruno': 'OPP_BRUNO', 'Brock': 'OPP_BROCK', 'Misty': 'OPP_MISTY',
    'LtSurge': 'OPP_LT_SURGE', 'Erika': 'OPP_ERIKA', 'Koga': 'OPP_KOGA',
    'Blaine': 'OPP_BLAINE', 'Sabrina': 'OPP_SABRINA',
    'Gentleman': 'OPP_GENTLEMAN', 'Rival2': 'OPP_RIVAL2', 'Rival3': 'OPP_RIVAL3',
    'Lorelei': 'OPP_LORELEI', 'Channeler': 'OPP_CHANNELER',
    'Agatha': 'OPP_AGATHA', 'Lance': 'OPP_LANCE',
  };
  return map[name] || `OPP_${name.toUpperCase()}`;
}

// ─── MAIN ───
const speciesMap = parseSpecies();
const rawParties = parseParties();
const trainerPositions = parseAllObjects();

// Convert party keys to OPP_* format
const parties = {};
for (const [k, v] of Object.entries(rawParties)) {
  parties[partyNameToOPP(k)] = v;
}

const result = { parties, trainerPositions, speciesMap };

// Summary
let total = 0;
const keys = Object.keys(trainerPositions).sort();
for (const k of keys) {
  const v = trainerPositions[k];
  console.error(`${k}: ${v.length} trainers  (${v.map(t => t.className+'#'+t.oppIndex).join(', ')})`);
  total += v.length;
}
console.error(`\nTotal: ${total} trainers across ${keys.length} maps`);

writeFileSync('./trainer_data.json', JSON.stringify(result, null, 2));
console.error('\nWritten to trainer_data.json');
