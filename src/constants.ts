import { Move, Pokemon, InventoryItem, PokemonSummary, BaseStats } from './types';
import { calcHp } from './lib/damage';

/** Gen I base stats for all 151 Pokemon */
const BASE_STATS: Record<string, BaseStats> = {
  // #001–#009: Bulbasaur line, Charmander line, Squirtle line
  bulbasaur:   { hp: 45,  attack: 49,  defense: 49,  special: 65,  speed: 45 },
  ivysaur:     { hp: 60,  attack: 62,  defense: 63,  special: 80,  speed: 60 },
  venusaur:    { hp: 80,  attack: 82,  defense: 83,  special: 100, speed: 80 },
  charmander:  { hp: 39,  attack: 52,  defense: 43,  special: 50,  speed: 65 },
  charmeleon:  { hp: 58,  attack: 64,  defense: 58,  special: 65,  speed: 80 },
  charizard:   { hp: 78,  attack: 84,  defense: 78,  special: 85,  speed: 100 },
  squirtle:    { hp: 44,  attack: 48,  defense: 65,  special: 50,  speed: 43 },
  wartortle:   { hp: 59,  attack: 63,  defense: 80,  special: 65,  speed: 58 },
  blastoise:   { hp: 79,  attack: 83,  defense: 100, special: 85,  speed: 78 },
  // #010–#018: Caterpie line, Weedle line, Pidgey line
  caterpie:    { hp: 45,  attack: 30,  defense: 35,  special: 20,  speed: 45 },
  metapod:     { hp: 50,  attack: 20,  defense: 55,  special: 25,  speed: 30 },
  butterfree:  { hp: 60,  attack: 45,  defense: 50,  special: 80,  speed: 70 },
  weedle:      { hp: 40,  attack: 35,  defense: 30,  special: 20,  speed: 50 },
  kakuna:      { hp: 45,  attack: 25,  defense: 50,  special: 25,  speed: 35 },
  beedrill:    { hp: 65,  attack: 80,  defense: 40,  special: 45,  speed: 75 },
  pidgey:      { hp: 40,  attack: 45,  defense: 40,  special: 35,  speed: 56 },
  pidgeotto:   { hp: 63,  attack: 60,  defense: 55,  special: 50,  speed: 71 },
  pidgeot:     { hp: 83,  attack: 80,  defense: 75,  special: 70,  speed: 101 },
  // #019–#026: Rattata line, Spearow line, Ekans line, Pikachu line
  rattata:     { hp: 30,  attack: 56,  defense: 35,  special: 25,  speed: 72 },
  raticate:    { hp: 55,  attack: 81,  defense: 60,  special: 50,  speed: 97 },
  spearow:     { hp: 40,  attack: 60,  defense: 30,  special: 31,  speed: 70 },
  fearow:      { hp: 65,  attack: 90,  defense: 65,  special: 61,  speed: 100 },
  ekans:       { hp: 35,  attack: 60,  defense: 44,  special: 40,  speed: 55 },
  arbok:       { hp: 60,  attack: 85,  defense: 69,  special: 65,  speed: 80 },
  pikachu:     { hp: 35,  attack: 55,  defense: 30,  special: 50,  speed: 90 },
  raichu:      { hp: 60,  attack: 90,  defense: 55,  special: 90,  speed: 100 },
  // #027–#034: Sandshrew line, Nidoran lines
  sandshrew:   { hp: 50,  attack: 75,  defense: 85,  special: 30,  speed: 40 },
  sandslash:   { hp: 75,  attack: 100, defense: 110, special: 55,  speed: 65 },
  'nidoran-f': { hp: 55,  attack: 47,  defense: 52,  special: 40,  speed: 41 },
  nidorina:    { hp: 70,  attack: 62,  defense: 67,  special: 55,  speed: 56 },
  nidoqueen:   { hp: 90,  attack: 82,  defense: 87,  special: 75,  speed: 76 },
  'nidoran-m': { hp: 46,  attack: 57,  defense: 40,  special: 40,  speed: 50 },
  nidorino:    { hp: 61,  attack: 72,  defense: 57,  special: 55,  speed: 65 },
  nidoking:    { hp: 81,  attack: 102, defense: 77,  special: 85,  speed: 85 },
  // #035–#040: Clefairy line, Vulpix line, Jigglypuff line
  clefairy:    { hp: 70,  attack: 45,  defense: 48,  special: 60,  speed: 35 },
  clefable:    { hp: 95,  attack: 70,  defense: 73,  special: 85,  speed: 60 },
  vulpix:      { hp: 38,  attack: 41,  defense: 40,  special: 65,  speed: 65 },
  ninetales:   { hp: 73,  attack: 76,  defense: 75,  special: 100, speed: 100 },
  jigglypuff:  { hp: 115, attack: 45,  defense: 20,  special: 25,  speed: 20 },
  wigglytuff:  { hp: 140, attack: 70,  defense: 45,  special: 50,  speed: 45 },
  // #041–#045: Zubat line, Oddish line
  zubat:       { hp: 40,  attack: 45,  defense: 35,  special: 40,  speed: 55 },
  golbat:      { hp: 75,  attack: 80,  defense: 70,  special: 75,  speed: 90 },
  oddish:      { hp: 45,  attack: 50,  defense: 55,  special: 75,  speed: 30 },
  gloom:       { hp: 60,  attack: 65,  defense: 70,  special: 85,  speed: 40 },
  vileplume:   { hp: 75,  attack: 80,  defense: 85,  special: 100, speed: 50 },
  // #046–#051: Paras line, Venonat line, Diglett line
  paras:       { hp: 35,  attack: 70,  defense: 55,  special: 55,  speed: 25 },
  parasect:    { hp: 60,  attack: 95,  defense: 80,  special: 80,  speed: 30 },
  venonat:     { hp: 60,  attack: 55,  defense: 50,  special: 40,  speed: 45 },
  venomoth:    { hp: 70,  attack: 65,  defense: 60,  special: 90,  speed: 90 },
  diglett:     { hp: 10,  attack: 55,  defense: 25,  special: 45,  speed: 95 },
  dugtrio:     { hp: 35,  attack: 80,  defense: 50,  special: 50,  speed: 120 },
  // #052–#057: Meowth line, Psyduck line, Mankey line
  meowth:      { hp: 40,  attack: 45,  defense: 35,  special: 40,  speed: 90 },
  persian:     { hp: 65,  attack: 70,  defense: 60,  special: 65,  speed: 115 },
  psyduck:     { hp: 50,  attack: 52,  defense: 48,  special: 50,  speed: 55 },
  golduck:     { hp: 80,  attack: 82,  defense: 78,  special: 80,  speed: 85 },
  mankey:      { hp: 40,  attack: 80,  defense: 35,  special: 35,  speed: 70 },
  primeape:    { hp: 65,  attack: 105, defense: 60,  special: 60,  speed: 95 },
  // #058–#062: Growlithe line, Poliwag line
  growlithe:   { hp: 55,  attack: 70,  defense: 45,  special: 50,  speed: 60 },
  arcanine:    { hp: 90,  attack: 110, defense: 80,  special: 80,  speed: 95 },
  poliwag:     { hp: 40,  attack: 50,  defense: 40,  special: 40,  speed: 90 },
  poliwhirl:   { hp: 65,  attack: 65,  defense: 65,  special: 50,  speed: 90 },
  poliwrath:   { hp: 90,  attack: 85,  defense: 95,  special: 70,  speed: 70 },
  // #063–#068: Abra line, Machop line
  abra:        { hp: 25,  attack: 20,  defense: 15,  special: 105, speed: 90 },
  kadabra:     { hp: 40,  attack: 35,  defense: 30,  special: 120, speed: 105 },
  alakazam:    { hp: 55,  attack: 50,  defense: 45,  special: 135, speed: 120 },
  machop:      { hp: 70,  attack: 80,  defense: 50,  special: 35,  speed: 35 },
  machoke:     { hp: 80,  attack: 100, defense: 70,  special: 50,  speed: 45 },
  machamp:     { hp: 90,  attack: 130, defense: 80,  special: 65,  speed: 55 },
  // #069–#076: Bellsprout line, Tentacool line, Geodude line
  bellsprout:  { hp: 50,  attack: 75,  defense: 35,  special: 70,  speed: 40 },
  weepinbell:  { hp: 65,  attack: 90,  defense: 50,  special: 85,  speed: 55 },
  victreebel:  { hp: 80,  attack: 105, defense: 65,  special: 100, speed: 70 },
  tentacool:   { hp: 40,  attack: 40,  defense: 35,  special: 100, speed: 70 },
  tentacruel:  { hp: 80,  attack: 70,  defense: 65,  special: 120, speed: 100 },
  geodude:     { hp: 40,  attack: 80,  defense: 100, special: 30,  speed: 20 },
  graveler:    { hp: 55,  attack: 95,  defense: 115, special: 45,  speed: 35 },
  golem:       { hp: 80,  attack: 110, defense: 130, special: 55,  speed: 45 },
  // #077–#082: Ponyta line, Slowpoke line, Magnemite line
  ponyta:      { hp: 50,  attack: 85,  defense: 55,  special: 65,  speed: 90 },
  rapidash:    { hp: 65,  attack: 100, defense: 70,  special: 80,  speed: 105 },
  slowpoke:    { hp: 90,  attack: 65,  defense: 65,  special: 40,  speed: 15 },
  slowbro:     { hp: 95,  attack: 75,  defense: 110, special: 80,  speed: 30 },
  magnemite:   { hp: 25,  attack: 35,  defense: 70,  special: 95,  speed: 45 },
  magneton:    { hp: 50,  attack: 60,  defense: 95,  special: 120, speed: 70 },
  // #083–#089: Farfetch'd, Doduo line, Seel line, Grimer line
  farfetchd:   { hp: 52,  attack: 65,  defense: 55,  special: 58,  speed: 60 },
  doduo:       { hp: 35,  attack: 85,  defense: 45,  special: 35,  speed: 75 },
  dodrio:      { hp: 60,  attack: 110, defense: 70,  special: 60,  speed: 100 },
  seel:        { hp: 65,  attack: 45,  defense: 55,  special: 70,  speed: 45 },
  dewgong:     { hp: 90,  attack: 70,  defense: 80,  special: 95,  speed: 70 },
  grimer:      { hp: 80,  attack: 80,  defense: 50,  special: 40,  speed: 25 },
  muk:         { hp: 105, attack: 105, defense: 75,  special: 65,  speed: 50 },
  // #090–#095: Shellder line, Gastly line, Onix
  shellder:    { hp: 30,  attack: 65,  defense: 100, special: 45,  speed: 40 },
  cloyster:    { hp: 50,  attack: 95,  defense: 180, special: 85,  speed: 70 },
  gastly:      { hp: 30,  attack: 35,  defense: 30,  special: 100, speed: 80 },
  haunter:     { hp: 45,  attack: 50,  defense: 45,  special: 115, speed: 95 },
  gengar:      { hp: 60,  attack: 65,  defense: 60,  special: 130, speed: 110 },
  onix:        { hp: 35,  attack: 45,  defense: 160, special: 30,  speed: 70 },
  // #096–#101: Drowzee line, Krabby line, Voltorb line
  drowzee:     { hp: 60,  attack: 48,  defense: 45,  special: 90,  speed: 42 },
  hypno:       { hp: 85,  attack: 73,  defense: 70,  special: 115, speed: 67 },
  krabby:      { hp: 30,  attack: 105, defense: 90,  special: 25,  speed: 50 },
  kingler:     { hp: 55,  attack: 130, defense: 115, special: 50,  speed: 75 },
  voltorb:     { hp: 40,  attack: 30,  defense: 50,  special: 55,  speed: 100 },
  electrode:   { hp: 60,  attack: 50,  defense: 70,  special: 80,  speed: 140 },
  // #102–#106: Exeggcute line, Cubone line, Hitmonlee
  exeggcute:   { hp: 60,  attack: 40,  defense: 80,  special: 60,  speed: 40 },
  exeggutor:   { hp: 95,  attack: 95,  defense: 85,  special: 125, speed: 55 },
  cubone:      { hp: 50,  attack: 50,  defense: 95,  special: 40,  speed: 35 },
  marowak:     { hp: 60,  attack: 80,  defense: 110, special: 50,  speed: 45 },
  hitmonlee:   { hp: 50,  attack: 120, defense: 53,  special: 35,  speed: 87 },
  // #107–#114: Hitmonchan, Lickitung, Koffing line, Rhyhorn line, Chansey, Tangela
  hitmonchan:  { hp: 50,  attack: 105, defense: 79,  special: 35,  speed: 76 },
  lickitung:   { hp: 90,  attack: 55,  defense: 75,  special: 60,  speed: 30 },
  koffing:     { hp: 40,  attack: 65,  defense: 95,  special: 60,  speed: 35 },
  weezing:     { hp: 65,  attack: 90,  defense: 120, special: 85,  speed: 60 },
  rhyhorn:     { hp: 80,  attack: 85,  defense: 95,  special: 30,  speed: 25 },
  rhydon:      { hp: 105, attack: 130, defense: 120, special: 45,  speed: 40 },
  chansey:     { hp: 250, attack: 5,   defense: 5,   special: 105, speed: 50 },
  tangela:     { hp: 65,  attack: 55,  defense: 115, special: 100, speed: 60 },
  // #115–#122: Kangaskhan, Horsea line, Goldeen line, Staryu line, Mr. Mime
  kangaskhan:  { hp: 105, attack: 95,  defense: 80,  special: 40,  speed: 90 },
  horsea:      { hp: 30,  attack: 40,  defense: 70,  special: 70,  speed: 60 },
  seadra:      { hp: 55,  attack: 65,  defense: 95,  special: 95,  speed: 85 },
  goldeen:     { hp: 45,  attack: 67,  defense: 60,  special: 50,  speed: 63 },
  seaking:     { hp: 80,  attack: 92,  defense: 65,  special: 80,  speed: 68 },
  staryu:      { hp: 30,  attack: 45,  defense: 55,  special: 70,  speed: 85 },
  starmie:     { hp: 60,  attack: 75,  defense: 85,  special: 100, speed: 115 },
  'mr-mime':   { hp: 40,  attack: 45,  defense: 65,  special: 100, speed: 90 },
  // #123–#130: Scyther, Jynx, Electabuzz, Magmar, Pinsir, Tauros, Magikarp, Gyarados
  scyther:     { hp: 70,  attack: 110, defense: 80,  special: 55,  speed: 105 },
  jynx:        { hp: 65,  attack: 50,  defense: 35,  special: 95,  speed: 95 },
  electabuzz:  { hp: 65,  attack: 83,  defense: 57,  special: 85,  speed: 105 },
  magmar:      { hp: 65,  attack: 95,  defense: 57,  special: 85,  speed: 93 },
  pinsir:      { hp: 65,  attack: 125, defense: 100, special: 55,  speed: 85 },
  tauros:      { hp: 75,  attack: 100, defense: 95,  special: 70,  speed: 110 },
  magikarp:    { hp: 20,  attack: 10,  defense: 55,  special: 20,  speed: 80 },
  gyarados:    { hp: 95,  attack: 125, defense: 79,  special: 100, speed: 81 },
  // #131–#137: Lapras, Ditto, Eevee, Vaporeon, Jolteon, Flareon, Porygon
  lapras:      { hp: 130, attack: 85,  defense: 80,  special: 95,  speed: 60 },
  ditto:       { hp: 48,  attack: 48,  defense: 48,  special: 48,  speed: 48 },
  eevee:       { hp: 55,  attack: 55,  defense: 50,  special: 65,  speed: 55 },
  vaporeon:    { hp: 130, attack: 65,  defense: 60,  special: 110, speed: 65 },
  jolteon:     { hp: 65,  attack: 65,  defense: 60,  special: 110, speed: 130 },
  flareon:     { hp: 65,  attack: 130, defense: 60,  special: 110, speed: 65 },
  porygon:     { hp: 65,  attack: 60,  defense: 70,  special: 75,  speed: 40 },
  // #138–#145: Omanyte line, Kabuto line, Aerodactyl, Snorlax, Articuno, Zapdos
  omanyte:     { hp: 35,  attack: 40,  defense: 100, special: 90,  speed: 35 },
  omastar:     { hp: 70,  attack: 60,  defense: 125, special: 115, speed: 55 },
  kabuto:      { hp: 30,  attack: 80,  defense: 90,  special: 45,  speed: 55 },
  kabutops:    { hp: 60,  attack: 115, defense: 105, special: 70,  speed: 80 },
  aerodactyl:  { hp: 80,  attack: 105, defense: 65,  special: 60,  speed: 130 },
  snorlax:     { hp: 160, attack: 110, defense: 65,  special: 65,  speed: 30 },
  articuno:    { hp: 90,  attack: 85,  defense: 100, special: 125, speed: 85 },
  zapdos:      { hp: 90,  attack: 90,  defense: 85,  special: 125, speed: 100 },
  // #146–#151: Moltres, Dratini line, Mewtwo, Mew
  moltres:     { hp: 90,  attack: 100, defense: 90,  special: 125, speed: 90 },
  dratini:     { hp: 41,  attack: 64,  defense: 45,  special: 50,  speed: 50 },
  dragonair:   { hp: 61,  attack: 84,  defense: 65,  special: 70,  speed: 70 },
  dragonite:   { hp: 91,  attack: 134, defense: 95,  special: 100, speed: 80 },
  mewtwo:      { hp: 106, attack: 110, defense: 90,  special: 154, speed: 130 },
  mew:         { hp: 100, attack: 100, defense: 100, special: 100, speed: 100 },
};

// ─── Gen I catch rates (0–255) per species ────────────────────────────────────

const CATCH_RATES: Record<string, number> = {
  bulbasaur: 45,   ivysaur: 45,   venusaur: 45,
  charmander: 45,  charmeleon: 45, charizard: 45,
  squirtle: 45,    wartortle: 45,  blastoise: 45,
  caterpie: 255,   metapod: 120,   butterfree: 45,
  weedle: 255,     kakuna: 120,    beedrill: 45,
  pidgey: 255,     pidgeotto: 120, pidgeot: 45,
  rattata: 255,    raticate: 127,
  spearow: 255,    fearow: 90,
  ekans: 255,      arbok: 90,
  sandshrew: 255,  sandslash: 127,
  'nidoran-f': 235, nidorina: 120, nidoqueen: 45,
  'nidoran-m': 235, nidorino: 120, nidoking: 45,
  clefairy: 150,    clefable: 50,
  vulpix: 190,     ninetales: 75,
  jigglypuff: 170, wigglytuff: 50,
  zubat: 255,      golbat: 90,
  oddish: 255,     gloom: 120,    vileplume: 45,
  paras: 255,     parasect: 127,
  venonat: 255,   venomoth: 90,
  diglett: 255,   dugtrio: 127,
  meowth: 255,    persian: 127,
  psyduck: 255,   golduck: 127,
  mankey: 190,    primeape: 75,
  growlithe: 75,    arcanine: 75,
  poliwag: 255,   poliwhirl: 120, poliwrath: 45,
  Abra: 200,      kadabra: 100,   alakazam: 50,
  machop: 180,    machoke: 90,    machamp: 45,
  bellsprout: 255, weepinbell: 120, victreebel: 45,
  tentacool: 255,  tentacruel: 60,
  geodude: 255,    graveler: 120, golem: 45,
  ponyta: 190,    rapidash: 75,
  slowpoke: 255,   slowbro: 75,
  magnemite: 255,  magneton: 60,
  farfetchd: 90,
  doduo: 255,     dodrio: 90,
  seel: 255,      dewgong: 75,
  grimer: 255,    muk: 75,
  shellder: 255,   cloyster: 60,
  gastly: 180,    haunter: 90,    gengar: 45,
  onix: 45,
  drowzee: 255,   hypno: 75,
  krabby: 255,   kingler: 60,
  voltorb: 255,  electrode: 60,
  exeggcute: 255, exeggutor: 45,
  cubone: 190,    marowak: 75,
  hitmonlee: 45,  hitmonchan: 45,
  lickitung: 75,
  koffing: 255,  weezing: 60,
  rhyhorn: 255,  rhydon: 60,
  chansey: 30,
  tangela: 75,
  kangaskhan: 60,
  horsea: 255,   seadra: 60,
  goldeen: 255,   seaking: 60,
staryu: 255,  starmie: 60,
};

// ─── Gen I base experience yield per species ──────────────────────────────────
// Values from Bulbapedia (Gen I). Used in the Gen I EXP formula:
//   expGain = floor(baseExp × enemyLevel × trainerMult / (7 × participants))

const BASE_EXP: Record<string, number> = {
  bulbasaur: 64,  ivysaur: 141,  venusaur: 208,
  charmander: 65, charmeleon: 142, charizard: 209,
  squirtle: 66,   wartortle: 143, blastoise: 210,
  caterpie: 53,   metapod: 72,   butterfree: 160,
  weedle: 52,     kakuna: 71,    beedrill: 159,
  pidgey: 55,     pidgeotto: 113, pidgeot: 172,
  rattata: 57,    raticate: 116,
  spearow: 58,    fearow: 162,
  ekans: 62,      arbok: 147,
  pikachu: 82,    raichu: 122,
  sandshrew: 93,  sandslash: 163,
  'nidoran-f': 59, nidorina: 117, nidoqueen: 194,
  'nidoran-m': 60, nidorino: 118, nidoking: 195,
  clefairy: 68,   clefable: 129,
  vulpix: 63,     ninetales: 178,
  jigglypuff: 76, wigglytuff: 109,
  zubat: 54,      golbat: 171,
  oddish: 78,     gloom: 132,    vileplume: 184,
  paras: 70,      parasect: 128,
  venonat: 75,    venomoth: 138,
  diglett: 81,    dugtrio: 153,
  meowth: 69,     persian: 148,
  psyduck: 80,    golduck: 174,
  mankey: 74,     primeape: 149,
  growlithe: 91,  arcanine: 213,
  poliwag: 77,    poliwhirl: 131, poliwrath: 185,
  abra: 73,       kadabra: 145,  alakazam: 186,
  machop: 88,     machoke: 146,  machamp: 193,
  bellsprout: 84, weepinbell: 151, victreebel: 191,
  tentacool: 105, tentacruel: 205,
  geodude: 86,    graveler: 134, golem: 177,
  ponyta: 152,    rapidash: 192,
  slowpoke: 99,   slowbro: 164,
  magnemite: 89,  magneton: 161,
  farfetchd: 94,
  doduo: 96,      dodrio: 158,
  seel: 100,      dewgong: 176,
  grimer: 90,     muk: 157,
  shellder: 97,   cloyster: 203,
  gastly: 95,     haunter: 126,  gengar: 190,
  onix: 108,
  drowzee: 102,   hypno: 165,
  krabby: 115,    kingler: 206,
  voltorb: 103,   electrode: 150,
  exeggcute: 98,  exeggutor: 212,
  cubone: 87,     marowak: 124,
  hitmonlee: 139,
  hitmonchan: 140,
  lickitung: 127,
  koffing: 114,   weezing: 173,
  rhyhorn: 135,   rhydon: 204,
  chansey: 255,
  tangela: 166,
  kangaskhan: 175,
  horsea: 83,     seadra: 155,
  goldeen: 111,   seaking: 170,
  staryu: 106,    starmie: 207,
  'mr-mime': 136,
  scyther: 187,
  jynx: 137,
  electabuzz: 156,
  magmar: 167,
  pinsir: 175,
  tauros: 211,
  magikarp: 20,   gyarados: 214,
  lapras: 219,
  ditto: 61,
  eevee: 92,
  vaporeon: 196,  jolteon: 197,  flareon: 198,
  porygon: 130,
  omanyte: 120,   omastar: 199,
  kabuto: 119,    kabutops: 201,
  aerodactyl: 202,
  snorlax: 154,
  articuno: 215,  zapdos: 216,   moltres: 217,
  dratini: 67,    dragonair: 144, dragonite: 218,
  mewtwo: 220,
  mew: 64,
};

/** Gen I base EXP yield lookup with safe fallback. */
export function baseExpFor(id: string): number {
  return BASE_EXP[id] ?? 64;
}

// ─── Gen I growth rates per species ───────────────────────────────────────────

const GROWTH_RATES: Record<string, Pokemon['growthRate']> = {
  // Starters: medium_slow (gains exp slowly early, faster late)
  bulbasaur: 'medium_slow',  ivysaur: 'medium_slow',  venusaur: 'medium_slow',
  charmander: 'medium_slow', charmeleon: 'medium_slow', charizard: 'medium_slow',
  squirtle: 'medium_slow',   wartortle: 'medium_slow',  blastoise: 'medium_slow',
  // Bug Pokémon: fast
  caterpie: 'fast',  metapod: 'fast',  butterfree: 'fast',
  weedle: 'fast',    kakuna: 'fast',   beedrill: 'fast',
  // Common wilds: medium_fast
  pidgey: 'medium_fast',    pidgeotto: 'medium_fast', pidgeot: 'medium_fast',
  rattata: 'medium_fast',   raticate: 'medium_fast',
  spearow: 'medium_fast',  fearow: 'medium_fast',
  ekans: 'medium_fast',    arbok: 'medium_fast',
  sandshrew: 'medium_slow',  sandslash: 'medium_slow',
  'nidoran-f': 'medium_slow', nidorina: 'medium_slow', nidoqueen: 'medium_slow',
  'nidoran-m': 'medium_slow', nidorino: 'medium_slow', nidoking: 'medium_slow',
  clefairy: 'fast',     clefable: 'fast',
  vulpix: 'medium_slow', ninetales: 'medium_slow',
  jigglypuff: 'fast',    wigglytuff: 'fast',
  zubat: 'medium_fast',  golbat: 'medium_fast',
  oddish: 'medium_slow', gloom: 'medium_slow', vileplume: 'medium_slow',
  paras: 'medium_slow',  parasect: 'medium_slow',
  venonat: 'medium_slow', venomoth: 'medium_slow',
  diglett: 'medium_slow',  dugtrio: 'medium_slow',
  meowth: 'medium_fast',  persian: 'medium_fast',
  psyduck: 'medium_slow', golduck: 'medium_slow',
  mankey: 'medium_fast', primeape: 'medium_fast',
  growlithe: 'medium_slow', arcanine: 'medium_slow',
  poliwag: 'medium_slow', poliwhirl: 'medium_slow', poliwrath: 'medium_slow',
  abra: 'medium_slow',   kadabra: 'medium_slow', alakazam: 'medium_slow',
  machop: 'medium_slow', machoke: 'medium_slow', machamp: 'medium_slow',
  bellsprout: 'medium_slow', weepinbell: 'medium_slow', victreebel: 'medium_slow',
  tentacool: 'medium_slow', tentacruel: 'medium_slow',
  geodude: 'medium_slow', graveler: 'medium_slow', golem: 'medium_slow',
  ponyta: 'medium_slow', rapidash: 'medium_slow',
  slowpoke: 'medium_slow', slowbro: 'medium_slow',
  magnemite: 'medium_fast', magneton: 'medium_fast',
  farfetchd: 'medium_fast',
  doduo: 'medium_fast', dodrio: 'medium_fast',
  seel: 'medium_fast', dewgong: 'medium_fast',
  grimer: 'medium_slow', muk: 'medium_slow',
  shellder: 'medium_slow', cloyster: 'medium_slow',
  gastly: 'medium_slow', haunter: 'medium_slow', gengar: 'medium_slow',
  onix: 'medium_slow',
  drowzee: 'medium_slow', hypno: 'medium_slow',
  krabby: 'medium_slow', kingler: 'medium_slow',
  voltorb: 'medium_fast', electrode: 'medium_fast',
  exeggcute: 'medium_slow', exeggutor: 'medium_slow',
  cubone: 'medium_slow', marowak: 'medium_slow',
  hitmonlee: 'medium_fast', hitmonchan: 'medium_fast',
  lickitung: 'medium_slow',
  koffing: 'medium_slow', weezing: 'medium_slow',
  rhyhorn: 'medium_slow', rhydon: 'medium_slow',
  chansey: 'fast',
  tangela: 'medium_slow',
  kangaskhan: 'medium_fast',
  horsea: 'medium_slow', seadra: 'medium_slow',
  goldeen: 'medium_slow', seaking: 'medium_slow',
  staryu: 'medium_slow', starmie: 'medium_slow',
  'mr-mime': 'medium_fast',
  scyther: 'medium_fast',
  jynx: 'medium_slow',
  electabuzz: 'medium_slow', magmar: 'medium_slow',
  pinsir: 'medium_fast',
  tauros: 'medium_fast',
  magikarp: 'slow',  gyarados: 'slow',
  lapras: 'medium_slow',
  ditto: 'medium_fast',
  eevee: 'medium_fast',
  vaporeon: 'medium_fast', jolteon: 'medium_fast', flareon: 'medium_fast',
  porygon: 'medium_fast',
  omanyte: 'medium_slow', omastar: 'medium_slow',
  kabuto: 'medium_slow', kabutops: 'medium_slow',
  aerodactyl: 'slow',
  snorlax: 'slow',
  articuno: 'slow',    zapdos: 'slow',    moltres: 'slow',
  dratini: 'slow',    dragonair: 'slow',   dragonite: 'slow',
  mewtwo: 'slow',     mew: 'slow',
};

/**
 * Total experience required to reach a given level, per Gen I growth rate.
 * Fast: 0.8·L³ | Medium Fast: L³ | Medium Slow: 1.2·L³−15·L²+100·L−140 | Slow: 1.25·L³
 */
export function expForLevel(level: number, rate: Pokemon['growthRate'] = 'medium_fast'): number {
  const L = level;
  switch (rate) {
    case 'fast':        return Math.floor(0.8 * L ** 3);
    case 'medium_slow': return Math.max(0, Math.floor(1.2 * L ** 3 - 15 * L ** 2 + 100 * L - 140));
    case 'slow':        return Math.floor(1.25 * L ** 3);
    default:            return L ** 3; // medium_fast
  }
}

/** Helper: create a Pokemon with HP computed from base stats */
export function makePokemon(
  id: string,
  name: string,
  level: number,
  type: string,
  moves: Move[],
  spriteId: number,
  extra?: Partial<Pokemon>,
): Pokemon {
  const baseStats = BASE_STATS[id];
  const maxHp = calcHp(baseStats.hp, level);
  const growthRate = GROWTH_RATES[id] ?? 'medium_fast';
  const expToNextLevel = Math.max(1, expForLevel(level + 1, growthRate) - expForLevel(level, growthRate));
  return {
    id,
    name,
    level,
    hp: maxHp,
    maxHp,
    type,
    baseStats,
    moves,
    sprite: getSprite(spriteId),
    exp: 0,
    expToNextLevel,
    catchRate: CATCH_RATES[id] ?? 45,
    growthRate,
    baseExp: baseExpFor(id),
    ...extra,
  };
}

/** Helper to create a Move with pp === maxPp */
function move(name: string, type: string, power: number, accuracy: number, maxPp: number, extra?: Partial<Move>): Move {
  const defaultSfxType: Move['sfxType'] =
    power === 0 ? 'glissando' : (type === 'normal' || type === 'rock' || type === 'fighting' ? 'noise' : 'pulse');
  return { name, type, power, accuracy, pp: maxPp, maxPp, sfxType: defaultSfxType, ...extra };
}

export const MOVES: Record<string, Move> = {
  TACKLE:        move('PLACAJE',       'normal',   40, 100, 35),
  THUNDERSHOCK:  move('IMPACTRUENO',   'electric', 40, 100, 30, { statusEffect: 'paralyzed', statusChance: 10 }),
  SCRATCH:       move('ARAÑAZO',       'normal',   40, 100, 35),
  GROWL:         move('GRUÑIDO',       'normal',    0, 100, 40, { statChange: { target: 'enemy', stat: 'attack',  stages: -1 } }),
  GUST:          move('TORNADO',       'flying',   40, 100, 35),
  STRING_SHOT:   move('DISP. SEDA',    'bug',       0,  95, 40, { statChange: { target: 'enemy', stat: 'speed',   stages: -1 } }),
  PECK:          move('PICOTAZO',      'flying',   35, 100, 35),
  EMBER:         move('ASCUAS',        'fire',     40, 100, 25, { statusEffect: 'burn',      statusChance: 10 }),
  WATER_GUN:     move('PISTOLA AGUA',  'water',    40, 100, 25),
  VINE_WHIP:     move('LATIGO CEPA',   'grass',    45, 100, 25),
  POISON_POWDER: move('POLVO VENENO',  'poison',    0,  75, 35, { statusEffect: 'poison',    statusChance: 100 }),
  SLEEP_POWDER:  move('SOMNÍFERO',     'grass',     0,  75, 15, { statusEffect: 'sleep',     statusChance: 100 }),
  ROCK_THROW:    move('LANZARROCAS',   'rock',     50,  90, 15),
  CUT:           move('CORTAR',        'normal',   50,  95, 30),
  STRENGTH:      move('FUERZA',        'normal',   80, 100, 15),
  HARDEN:        move('FORTALEZA',     'normal',    0, 100, 30, { statChange: { target: 'self',  stat: 'defense', stages: +1 } }),
  POUND:         move('GOLPE NORMAL',  'normal',   40, 100, 35),
  // High-crit moves (baseSpeed × 8 / 512 crit chance)
  SLASH:         move('CUCHILLADA',    'normal',   70, 100, 20, { highCrit: true }),
  RAZOR_LEAF:    move('HOJA AFILADA',  'grass',    55,  95, 25, { highCrit: true }),
};

export const HM_REQUIREMENTS = {
  cut: { badge: 'CASCADE', move: 'CORTAR' },
  strength: { badge: 'RAINBOW', move: 'FUERZA' },
} as const;

const getSprite = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

export const STARTERS: Pokemon[] = [
  makePokemon('bulbasaur', 'BULBASAUR', 5, 'grass', [MOVES.TACKLE, MOVES.GROWL], 1, {
    types: ['grass', 'poison'], evolutionLevel: 16, evolvesTo: 'ivysaur',
    movesToLearn: [
      { level: 7, move: MOVES.VINE_WHIP },
      { level: 13, move: MOVES.POISON_POWDER },
      { level: 17, move: MOVES.RAZOR_LEAF },
    ],
  }),
  makePokemon('charmander', 'CHARMANDER', 5, 'fire', [MOVES.SCRATCH, MOVES.GROWL], 4, {
    evolutionLevel: 16, evolvesTo: 'charmeleon',
    movesToLearn: [
      { level: 7, move: MOVES.EMBER },
      { level: 17, move: MOVES.SLASH },
    ],
  }),
  makePokemon('squirtle', 'SQUIRTLE', 5, 'water', [MOVES.TACKLE, MOVES.GROWL], 7, {
    evolutionLevel: 16, evolvesTo: 'wartortle',
    movesToLearn: [{ level: 7, move: MOVES.WATER_GUN }],
  }),
];

export const ITEMS_DATABASE: Record<string, InventoryItem> = {
  OAK_PARCEL: { id: 'OAK_PARCEL', name: 'PAQUETE OAK', description: 'Un paquete para el Prof. Oak.', icon: '📦', type: 'key_item' },
  TOWN_MAP: { id: 'TOWN_MAP', name: 'MAPA CIUDAD', description: 'Mapa de la región Kanto.', icon: '🗺️', type: 'key_item' },
  POKEBALL: { id: 'POKEBALL', name: 'POKÉ BALL', description: 'Sirve para atrapar Pokémon salvajes.', icon: '🔴', type: 'pokeball' },
  
  // Healing Items
  POTION: { id: 'POTION', name: 'POCIÓN', description: 'Restaura 20 PS.', icon: '🧪', type: 'potion', effect: { healHp: 20 } },
  SUPER_POTION: { id: 'SUPER_POTION', name: 'SÚPER POCIÓN', description: 'Restaura 50 PS.', icon: '🧪', type: 'potion', effect: { healHp: 50 } },
  HYPER_POTION: { id: 'HYPER_POTION', name: 'HIPER POCIÓN', description: 'Restaura 200 PS.', icon: '🧪', type: 'potion', effect: { healHp: 200 } },
  MAX_POTION: { id: 'MAX_POTION', name: 'POCIÓN MÁXIMA', description: 'Restaura todos los PS.', icon: '🧪', type: 'potion', effect: { healHp: 9999 } },
  FULL_RESTORE: { id: 'FULL_RESTORE', name: 'RESTAURAR TODO', description: 'Restaura todos los PS y cura estados.', icon: '✨', type: 'potion', effect: { healHp: 9999, cureStatus: 'all' } },
  
  // Status Healing Items
  ANTIDOTE: { id: 'ANTIDOTE', name: 'ANTÍDOTO', description: 'Cura el envenenamiento.', icon: '💊', type: 'status_heal', effect: { cureStatus: 'poison' } },
  AWAKENING: { id: 'AWAKENING', name: 'DESPERTAR', description: 'Despierta a un Pokémon dormido.', icon: '☕', type: 'status_heal', effect: { cureStatus: 'sleep' } },
  BURN_HEAL: { id: 'BURN_HEAL', name: 'ANTIQUEMAR', description: 'Cura las quemaduras.', icon: '🩹', type: 'status_heal', effect: { cureStatus: 'burn' } },
  ICE_HEAL: { id: 'ICE_HEAL', name: 'ANTIHIELO', description: 'Descongela a un Pokémon.', icon: '🔥', type: 'status_heal', effect: { cureStatus: 'frozen' } },
  PARALYZE_HEAL: { id: 'PARALYZE_HEAL', name: 'ANTIPARALIZADOR', description: 'Cura la parálisis.', icon: '⚡', type: 'status_heal', effect: { cureStatus: 'paralyzed' } },
  FULL_HEAL: { id: 'FULL_HEAL', name: 'CURA TOTAL', description: 'Cura cualquier problema de estado.', icon: '🌟', type: 'status_heal', effect: { cureStatus: 'all' } },
  
  // Revives
  REVIVE: { id: 'REVIVE', name: 'REVIVIR', description: 'Revive a un Pokémon con la mitad de PS.', icon: '💎', type: 'revive', effect: { revive: true, reviveHpPercent: 50 } },
  MAX_REVIVE: { id: 'MAX_REVIVE', name: 'MAX REVIVIR', description: 'Revive a un Pokémon con todos sus PS.', icon: '💎', type: 'revive', effect: { revive: true, reviveHpPercent: 100 } },
};

export const POKEMON_LIST: PokemonSummary[] = [
  { id: 'bulbasaur', name: 'Bulbasaur', sprite: getSprite(1) },
  { id: 'ivysaur', name: 'Ivysaur', sprite: getSprite(2) },
  { id: 'venusaur', name: 'Venusaur', sprite: getSprite(3) },
  { id: 'charmander', name: 'Charmander', sprite: getSprite(4) },
  { id: 'charmeleon', name: 'Charmeleon', sprite: getSprite(5) },
  { id: 'charizard', name: 'Charizard', sprite: getSprite(6) },
  { id: 'squirtle', name: 'Squirtle', sprite: getSprite(7) },
  { id: 'wartortle', name: 'Wartortle', sprite: getSprite(8) },
  { id: 'blastoise', name: 'Blastoise', sprite: getSprite(9) },
  { id: 'caterpie', name: 'Caterpie', sprite: getSprite(10) },
  { id: 'metapod', name: 'Metapod', sprite: getSprite(11) },
  { id: 'butterfree', name: 'Butterfree', sprite: getSprite(12) },
  { id: 'weedle', name: 'Weedle', sprite: getSprite(13) },
  { id: 'kakuna', name: 'Kakuna', sprite: getSprite(14) },
  { id: 'beedrill', name: 'Beedrill', sprite: getSprite(15) },
  { id: 'pidgey', name: 'Pidgey', sprite: getSprite(16) },
  { id: 'pidgeotto', name: 'Pidgeotto', sprite: getSprite(17) },
  { id: 'pidgeot', name: 'Pidgeot', sprite: getSprite(18) },
  { id: 'rattata', name: 'Rattata', sprite: getSprite(19) },
  { id: 'raticate', name: 'Raticate', sprite: getSprite(20) },
  { id: 'spearow', name: 'Spearow', sprite: getSprite(21) },
  { id: 'fearow', name: 'Fearow', sprite: getSprite(22) },
  { id: 'ekans', name: 'Ekans', sprite: getSprite(23) },
  { id: 'arbok', name: 'Arbok', sprite: getSprite(24) },
  { id: 'pikachu', name: 'Pikachu', sprite: getSprite(25) },
  { id: 'raichu', name: 'Raichu', sprite: getSprite(26) },
  { id: 'sandshrew', name: 'Sandshrew', sprite: getSprite(27) },
  { id: 'sandslash', name: 'Sandslash', sprite: getSprite(28) },
  { id: 'nidoran-f', name: 'Nidoran♀', sprite: getSprite(29) },
  { id: 'nidorina', name: 'Nidorina', sprite: getSprite(30) },
  { id: 'nidoqueen', name: 'Nidoqueen', sprite: getSprite(31) },
  { id: 'nidoran-m', name: 'Nidoran♂', sprite: getSprite(32) },
  { id: 'nidorino', name: 'Nidorino', sprite: getSprite(33) },
  { id: 'nidoking', name: 'Nidoking', sprite: getSprite(34) },
  { id: 'clefairy', name: 'Clefairy', sprite: getSprite(35) },
  { id: 'clefable', name: 'Clefable', sprite: getSprite(36) },
  { id: 'vulpix', name: 'Vulpix', sprite: getSprite(37) },
  { id: 'ninetales', name: 'Ninetales', sprite: getSprite(38) },
  { id: 'jigglypuff', name: 'Jigglypuff', sprite: getSprite(39) },
  { id: 'wigglytuff', name: 'Wigglytuff', sprite: getSprite(40) },
  { id: 'zubat', name: 'Zubat', sprite: getSprite(41) },
  { id: 'golbat', name: 'Golbat', sprite: getSprite(42) },
  { id: 'oddish', name: 'Oddish', sprite: getSprite(43) },
  { id: 'gloom', name: 'Gloom', sprite: getSprite(44) },
  { id: 'vileplume', name: 'Vileplume', sprite: getSprite(45) },
  { id: 'paras', name: 'Paras', sprite: getSprite(46) },
  { id: 'parasect', name: 'Parasect', sprite: getSprite(47) },
  { id: 'venonat', name: 'Venonat', sprite: getSprite(48) },
  { id: 'venomoth', name: 'Venomoth', sprite: getSprite(49) },
  { id: 'diglett', name: 'Diglett', sprite: getSprite(50) },
  { id: 'dugtrio', name: 'Dugtrio', sprite: getSprite(51) },
  { id: 'meowth', name: 'Meowth', sprite: getSprite(52) },
  { id: 'persian', name: 'Persian', sprite: getSprite(53) },
  { id: 'psyduck', name: 'Psyduck', sprite: getSprite(54) },
  { id: 'golduck', name: 'Golduck', sprite: getSprite(55) },
  { id: 'mankey', name: 'Mankey', sprite: getSprite(56) },
  { id: 'primeape', name: 'Primeape', sprite: getSprite(57) },
  { id: 'growlithe', name: 'Growlithe', sprite: getSprite(58) },
  { id: 'arcanine', name: 'Arcanine', sprite: getSprite(59) },
  { id: 'poliwag', name: 'Poliwag', sprite: getSprite(60) },
  { id: 'poliwhirl', name: 'Poliwhirl', sprite: getSprite(61) },
  { id: 'poliwrath', name: 'Poliwrath', sprite: getSprite(62) },
  { id: 'abra', name: 'Abra', sprite: getSprite(63) },
  { id: 'kadabra', name: 'Kadabra', sprite: getSprite(64) },
  { id: 'alakazam', name: 'Alakazam', sprite: getSprite(65) },
  { id: 'machop', name: 'Machop', sprite: getSprite(66) },
  { id: 'machoke', name: 'Machoke', sprite: getSprite(67) },
  { id: 'machamp', name: 'Machamp', sprite: getSprite(68) },
  { id: 'bellsprout', name: 'Bellsprout', sprite: getSprite(69) },
  { id: 'weepinbell', name: 'Weepinbell', sprite: getSprite(70) },
  { id: 'victreebel', name: 'Victreebel', sprite: getSprite(71) },
  { id: 'tentacool', name: 'Tentacool', sprite: getSprite(72) },
  { id: 'tentacruel', name: 'Tentacruel', sprite: getSprite(73) },
  { id: 'geodude', name: 'Geodude', sprite: getSprite(74) },
  { id: 'graveler', name: 'Graveler', sprite: getSprite(75) },
  { id: 'golem', name: 'Golem', sprite: getSprite(76) },
  { id: 'ponyta', name: 'Ponyta', sprite: getSprite(77) },
  { id: 'rapidash', name: 'Rapidash', sprite: getSprite(78) },
  { id: 'slowpoke', name: 'Slowpoke', sprite: getSprite(79) },
  { id: 'slowbro', name: 'Slowbro', sprite: getSprite(80) },
  { id: 'magnemite', name: 'Magnemite', sprite: getSprite(81) },
  { id: 'magneton', name: 'Magneton', sprite: getSprite(82) },
  { id: 'farfetchd', name: "Farfetch'd", sprite: getSprite(83) },
  { id: 'doduo', name: 'Doduo', sprite: getSprite(84) },
  { id: 'dodrio', name: 'Dodrio', sprite: getSprite(85) },
  { id: 'seel', name: 'Seel', sprite: getSprite(86) },
  { id: 'dewgong', name: 'Dewgong', sprite: getSprite(87) },
  { id: 'grimer', name: 'Grimer', sprite: getSprite(88) },
  { id: 'muk', name: 'Muk', sprite: getSprite(89) },
  { id: 'shellder', name: 'Shellder', sprite: getSprite(90) },
  { id: 'cloyster', name: 'Cloyster', sprite: getSprite(91) },
  { id: 'gastly', name: 'Gastly', sprite: getSprite(92) },
  { id: 'haunter', name: 'Haunter', sprite: getSprite(93) },
  { id: 'gengar', name: 'Gengar', sprite: getSprite(94) },
  { id: 'onix', name: 'Onix', sprite: getSprite(95) },
  { id: 'drowzee', name: 'Drowzee', sprite: getSprite(96) },
  { id: 'hypno', name: 'Hypno', sprite: getSprite(97) },
  { id: 'krabby', name: 'Krabby', sprite: getSprite(98) },
  { id: 'kingler', name: 'Kingler', sprite: getSprite(99) },
  { id: 'voltorb', name: 'Voltorb', sprite: getSprite(100) },
  { id: 'electrode', name: 'Electrode', sprite: getSprite(101) },
  { id: 'exeggcute', name: 'Exeggcute', sprite: getSprite(102) },
  { id: 'exeggutor', name: 'Exeggutor', sprite: getSprite(103) },
  { id: 'cubone', name: 'Cubone', sprite: getSprite(104) },
  { id: 'marowak', name: 'Marowak', sprite: getSprite(105) },
  { id: 'hitmonlee', name: 'Hitmonlee', sprite: getSprite(106) },
  { id: 'hitmonchan', name: 'Hitmonchan', sprite: getSprite(107) },
  { id: 'lickitung', name: 'Lickitung', sprite: getSprite(108) },
  { id: 'koffing', name: 'Koffing', sprite: getSprite(109) },
  { id: 'weezing', name: 'Weezing', sprite: getSprite(110) },
  { id: 'rhyhorn', name: 'Rhyhorn', sprite: getSprite(111) },
  { id: 'rhydon', name: 'Rhydon', sprite: getSprite(112) },
  { id: 'chansey', name: 'Chansey', sprite: getSprite(113) },
  { id: 'tangela', name: 'Tangela', sprite: getSprite(114) },
  { id: 'kangaskhan', name: 'Kangaskhan', sprite: getSprite(115) },
  { id: 'horsea', name: 'Horsea', sprite: getSprite(116) },
  { id: 'seadra', name: 'Seadra', sprite: getSprite(117) },
  { id: 'goldeen', name: 'Goldeen', sprite: getSprite(118) },
  { id: 'seaking', name: 'Seaking', sprite: getSprite(119) },
  { id: 'staryu', name: 'Staryu', sprite: getSprite(120) },
  { id: 'starmie', name: 'Starmie', sprite: getSprite(121) },
  { id: 'mr-mime', name: 'Mr. Mime', sprite: getSprite(122) },
  { id: 'scyther', name: 'Scyther', sprite: getSprite(123) },
  { id: 'jynx', name: 'Jynx', sprite: getSprite(124) },
  { id: 'electabuzz', name: 'Electabuzz', sprite: getSprite(125) },
  { id: 'magmar', name: 'Magmar', sprite: getSprite(126) },
  { id: 'pinsir', name: 'Pinsir', sprite: getSprite(127) },
  { id: 'tauros', name: 'Tauros', sprite: getSprite(128) },
  { id: 'magikarp', name: 'Magikarp', sprite: getSprite(129) },
  { id: 'gyarados', name: 'Gyarados', sprite: getSprite(130) },
  { id: 'lapras', name: 'Lapras', sprite: getSprite(131) },
  { id: 'ditto', name: 'Ditto', sprite: getSprite(132) },
  { id: 'eevee', name: 'Eevee', sprite: getSprite(133) },
  { id: 'vaporeon', name: 'Vaporeon', sprite: getSprite(134) },
  { id: 'jolteon', name: 'Jolteon', sprite: getSprite(135) },
  { id: 'flareon', name: 'Flareon', sprite: getSprite(136) },
  { id: 'porygon', name: 'Porygon', sprite: getSprite(137) },
  { id: 'omanyte', name: 'Omanyte', sprite: getSprite(138) },
  { id: 'omastar', name: 'Omastar', sprite: getSprite(139) },
  { id: 'kabuto', name: 'Kabuto', sprite: getSprite(140) },
  { id: 'kabutops', name: 'Kabutops', sprite: getSprite(141) },
  { id: 'aerodactyl', name: 'Aerodactyl', sprite: getSprite(142) },
  { id: 'snorlax', name: 'Snorlax', sprite: getSprite(143) },
  { id: 'articuno', name: 'Articuno', sprite: getSprite(144) },
  { id: 'zapdos', name: 'Zapdos', sprite: getSprite(145) },
  { id: 'moltres', name: 'Moltres', sprite: getSprite(146) },
  { id: 'dratini', name: 'Dratini', sprite: getSprite(147) },
  { id: 'dragonair', name: 'Dragonair', sprite: getSprite(148) },
  { id: 'dragonite', name: 'Dragonite', sprite: getSprite(149) },
  { id: 'mewtwo', name: 'Mewtwo', sprite: getSprite(150) },
  { id: 'mew', name: 'Mew', sprite: getSprite(151) },
];

export const EVOLUTIONS: Record<string, Partial<Pokemon>> = {
  // Bulbasaur line
  ivysaur: { name: 'IVYSAUR', sprite: getSprite(2), baseStats: BASE_STATS.ivysaur, types: ['grass', 'poison'], evolutionLevel: 32, evolvesTo: 'venusaur' },
  venusaur: { name: 'VENUSAUR', sprite: getSprite(3), baseStats: BASE_STATS.venusaur, types: ['grass', 'poison'] },
  // Charmander line
  charmeleon: { name: 'CHARMELEON', sprite: getSprite(5), baseStats: BASE_STATS.charmeleon, evolutionLevel: 36, evolvesTo: 'charizard' },
  charizard: { name: 'CHARIZARD', sprite: getSprite(6), baseStats: BASE_STATS.charizard, types: ['fire', 'flying'] },
  // Squirtle line
  wartortle: { name: 'WARTORTLE', sprite: getSprite(8), baseStats: BASE_STATS.wartortle, evolutionLevel: 36, evolvesTo: 'blastoise' },
  blastoise: { name: 'BLASTOISE', sprite: getSprite(9), baseStats: BASE_STATS.blastoise },
  // Caterpie line
  metapod: { name: 'METAPOD', sprite: getSprite(11), baseStats: BASE_STATS.metapod, evolutionLevel: 10, evolvesTo: 'butterfree' },
  butterfree: { name: 'BUTTERFREE', sprite: getSprite(12), baseStats: BASE_STATS.butterfree, types: ['bug', 'flying'] },
  // Weedle line
  kakuna: { name: 'KAKUNA', sprite: getSprite(14), baseStats: BASE_STATS.kakuna, evolutionLevel: 10, evolvesTo: 'beedrill' },
  beedrill: { name: 'BEEDRILL', sprite: getSprite(15), baseStats: BASE_STATS.beedrill, types: ['bug', 'poison'] },
  // Pidgey line
  pidgeotto: { name: 'PIDGEOTTO', sprite: getSprite(17), baseStats: BASE_STATS.pidgeotto, evolutionLevel: 36, evolvesTo: 'pidgeot' },
  pidgeot: { name: 'PIDGEOT', sprite: getSprite(18), baseStats: BASE_STATS.pidgeot, types: ['normal', 'flying'] },
  // Rattata line
  raticate: { name: 'RATICATE', sprite: getSprite(20), baseStats: BASE_STATS.raticate, types: ['normal'] },
  // Spearow line
  fearow: { name: 'FEAROW', sprite: getSprite(22), baseStats: BASE_STATS.fearow, types: ['normal', 'flying'] },
  // Ekans line
  arbok: { name: 'ARBOK', sprite: getSprite(24), baseStats: BASE_STATS.arbok, types: ['poison'] },
  // Sandshrew line
  sandslash: { name: 'SANDSLASH', sprite: getSprite(28), baseStats: BASE_STATS.sandslash, types: ['ground'] },
  // Nidoran lines
  nidorina: { name: 'NIDORINA', sprite: getSprite(30), baseStats: BASE_STATS.nidorina, evolutionLevel: 32, evolvesTo: 'nidoqueen' },
  nidoqueen: { name: 'NIDOQUEEN', sprite: getSprite(31), baseStats: BASE_STATS.nidoqueen, types: ['poison', 'ground'] },
  nidorino: { name: 'NIDORINO', sprite: getSprite(33), baseStats: BASE_STATS.nidorino, evolutionLevel: 32, evolvesTo: 'nidoking' },
  nidoking: { name: 'NIDOKING', sprite: getSprite(34), baseStats: BASE_STATS.nidoking, types: ['poison', 'ground'] },
  // Clefairy line
  clefable: { name: 'CLEFABLE', sprite: getSprite(36), baseStats: BASE_STATS.clefable, types: ['normal'] },
  // Vulpix line
  ninetales: { name: 'NINETALES', sprite: getSprite(38), baseStats: BASE_STATS.ninetales, types: ['fire'] },
  // Jigglypuff line
  wigglytuff: { name: 'WIGGLYTUFF', sprite: getSprite(40), baseStats: BASE_STATS.wigglytuff, types: ['normal'] },
  // Zubat line
  golbat: { name: 'GOLBAT', sprite: getSprite(42), baseStats: BASE_STATS.golbat, types: ['poison', 'flying'] },
  // Oddish line
  gloom: { name: 'GLOOM', sprite: getSprite(44), baseStats: BASE_STATS.gloom, evolutionLevel: 21, evolvesTo: 'vileplume' },
  vileplume: { name: 'VILEPLUME', sprite: getSprite(45), baseStats: BASE_STATS.vileplume, types: ['grass', 'poison'] },
  // Paras line
  parasect: { name: 'PARASECT', sprite: getSprite(47), baseStats: BASE_STATS.parasect, types: ['bug', 'grass'] },
  // Venonat line
  venomoth: { name: 'VENOMOTH', sprite: getSprite(49), baseStats: BASE_STATS.venomoth, types: ['bug', 'poison'] },
  // Diglett line
  dugtrio: { name: 'DUGTRIO', sprite: getSprite(51), baseStats: BASE_STATS.dugtrio, types: ['ground'] },
  // Meowth line
  persian: { name: 'PERSIAN', sprite: getSprite(53), baseStats: BASE_STATS.persian, types: ['normal'] },
  // Psyduck line
  golduck: { name: 'GOLDUCK', sprite: getSprite(55), baseStats: BASE_STATS.golduck, types: ['water'] },
  // Mankey line
  primeape: { name: 'PRIMEAPE', sprite: getSprite(57), baseStats: BASE_STATS.primeape, types: ['fighting'] },
  // Growlithe line
  arcanine: { name: 'ARCANINE', sprite: getSprite(59), baseStats: BASE_STATS.arcanine, types: ['fire'] },
  // Poliwag line
  poliwhirl: { name: 'POLIWHIRL', sprite: getSprite(61), baseStats: BASE_STATS.poliwhirl, evolutionLevel: 36, evolvesTo: 'poliwrath' },
  poliwrath: { name: 'POLIWRATH', sprite: getSprite(62), baseStats: BASE_STATS.poliwrath, types: ['water', 'fighting'] },
  // Abra line
  kadabra: { name: 'KADABRA', sprite: getSprite(64), baseStats: BASE_STATS.kadabra, evolutionLevel: 16, evolvesTo: 'alakazam' },
  alakazam: { name: 'ALAKAZAM', sprite: getSprite(65), baseStats: BASE_STATS.alakazam, types: ['psychic'] },
  // Machop line
  machoke: { name: 'MACHOKE', sprite: getSprite(67), baseStats: BASE_STATS.machoke, evolutionLevel: 36, evolvesTo: 'machamp' },
  machamp: { name: 'MACHAMP', sprite: getSprite(68), baseStats: BASE_STATS.machamp, types: ['fighting'] },
  // Bellsprout line
  weepinbell: { name: 'WEEPINBELL', sprite: getSprite(70), baseStats: BASE_STATS.weepinbell, evolutionLevel: 21, evolvesTo: 'victreebel' },
  victreebel: { name: 'VICTREEBEL', sprite: getSprite(71), baseStats: BASE_STATS.victreebel, types: ['grass', 'poison'] },
  // Tentacool line
  tentacruel: { name: 'TENTACRUEL', sprite: getSprite(73), baseStats: BASE_STATS.tentacruel, types: ['water', 'poison'] },
  // Geodude line
  graveler: { name: 'GRAVELER', sprite: getSprite(75), baseStats: BASE_STATS.graveler, evolutionLevel: 36, evolvesTo: 'golem' },
  golem: { name: 'GOLEM', sprite: getSprite(76), baseStats: BASE_STATS.golem, types: ['rock', 'ground'] },
  // Ponyta line
  rapidash: { name: 'RAPIDASH', sprite: getSprite(78), baseStats: BASE_STATS.rapidash, types: ['fire'] },
  // Slowpoke line
  slowbro: { name: 'SLOWBRO', sprite: getSprite(80), baseStats: BASE_STATS.slowbro, types: ['water', 'psychic'] },
  // Magnemite line
  magneton: { name: 'MAGNETON', sprite: getSprite(82), baseStats: BASE_STATS.magneton, types: ['electric', 'steel'] },
  // Doduo line
  dodrio: { name: 'DODRIO', sprite: getSprite(85), baseStats: BASE_STATS.dodrio, types: ['normal', 'flying'] },
  // Seel line
  dewgong: { name: 'DEWGONG', sprite: getSprite(87), baseStats: BASE_STATS.dewgong, types: ['water', 'ice'] },
  // Grimer line
  muk: { name: 'MUK', sprite: getSprite(89), baseStats: BASE_STATS.muk, types: ['poison'] },
  // Shellder line
  cloyster: { name: 'CLOYSTER', sprite: getSprite(91), baseStats: BASE_STATS.cloyster, types: ['water', 'ice'] },
  // Gastly line
  haunter: { name: 'HAUNTER', sprite: getSprite(93), baseStats: BASE_STATS.haunter, evolutionLevel: 25, evolvesTo: 'gengar' },
  gengar: { name: 'GENGAR', sprite: getSprite(94), baseStats: BASE_STATS.gengar, types: ['ghost', 'poison'] },
  // Onix
  onix: { name: 'ONIX', sprite: getSprite(95), baseStats: BASE_STATS.onix, types: ['rock', 'ground'] },
  // Drowzee line
  hypno: { name: 'HYPNO', sprite: getSprite(97), baseStats: BASE_STATS.hypno, types: ['psychic'] },
  // Krabby line
  kingler: { name: 'KINGLER', sprite: getSprite(99), baseStats: BASE_STATS.kingler, types: ['water'] },
  // Voltorb line
  electrode: { name: 'ELECTRODE', sprite: getSprite(101), baseStats: BASE_STATS.electrode, types: ['electric'] },
  // Exeggcute line
  exeggutor: { name: 'EXEGGUTOR', sprite: getSprite(103), baseStats: BASE_STATS.exeggutor, types: ['grass', 'psychic'] },
  // Cubone line
  marowak: { name: 'MAROWAK', sprite: getSprite(105), baseStats: BASE_STATS.marowak, types: ['ground'] },
  // Rhyhorn line
  rhydon: { name: 'RHYDON', sprite: getSprite(112), baseStats: BASE_STATS.rhydon, types: ['ground', 'rock'] },
  // Horsea line
  seadra: { name: 'SEADRA', sprite: getSprite(117), baseStats: BASE_STATS.seadra, types: ['water', 'dragon'] },
  // Goldeen line
  seaking: { name: 'SEAKING', sprite: getSprite(119), baseStats: BASE_STATS.seaking, types: ['water'] },
  // Staryu line
  starmie: { name: 'STARMIE', sprite: getSprite(121), baseStats: BASE_STATS.starmie, types: ['water', 'psychic'] },
  // Scyther
  scyther: { name: 'SCYTHER', sprite: getSprite(123), baseStats: BASE_STATS.scyther, types: ['bug', 'flying'] },
  // Jynx
  jynx: { name: 'JYNX', sprite: getSprite(124), baseStats: BASE_STATS.jynx, types: ['ice', 'psychic'] },
  // Electabuzz line
  electabuzz: { name: 'ELECTABUZZ', sprite: getSprite(125), baseStats: BASE_STATS.electabuzz, types: ['electric'] },
  magmar: { name: 'MAGMAR', sprite: getSprite(126), baseStats: BASE_STATS.magmar, types: ['fire'] },
  // Magikarp line
  gyarados: { name: 'GYARADOS', sprite: getSprite(130), baseStats: BASE_STATS.gyarados, types: ['water', 'flying'] },
  // Eevee line
  vaporeon: { name: 'VAPOREON', sprite: getSprite(134), baseStats: BASE_STATS.vaporeon, types: ['water'] },
  jolteon: { name: 'JOLTEON', sprite: getSprite(135), baseStats: BASE_STATS.jolteon, types: ['electric'] },
  flareon: { name: 'FLAREON', sprite: getSprite(136), baseStats: BASE_STATS.flareon, types: ['fire'] },
  // Porygon
  porygon: { name: 'PORYGON', sprite: getSprite(137), baseStats: BASE_STATS.porygon, types: ['normal'] },
  // Omanyte line
  omastar: { name: 'OMASTAR', sprite: getSprite(139), baseStats: BASE_STATS.omastar, types: ['water', 'rock'] },
  // Kabuto line
  kabutops: { name: 'KABUTOPS', sprite: getSprite(141), baseStats: BASE_STATS.kabutops, types: ['water', 'rock'] },
  // Dratini line
  dragonair: { name: 'DRAGONAIR', sprite: getSprite(148), baseStats: BASE_STATS.dragonair, evolutionLevel: 55, evolvesTo: 'dragonite' },
  dragonite: { name: 'DRAGONITE', sprite: getSprite(149), baseStats: BASE_STATS.dragonite, types: ['dragon', 'flying'] },
};

/** Used automatically when all moves have 0 PP. Typeless, 50 power, 1/4 recoil. */
export const STRUGGLE_MOVE: Move = {
  name: 'Forcejeo', type: 'normal', power: 50, accuracy: 100,
  pp: Infinity, maxPp: Infinity, sfxType: 'noise',
};

/** Gen I encounter rate per map (0–255). Roll 0–255; if roll < rate, battle starts. */
export const WILD_ENCOUNTER_RATES: Record<string, number> = {
  KANTO_OVERWORLD: 10,   // fallback; per-zone rates applied in tryWildEncounter
  ROUTE_1: 10,
  ROUTE_2: 10,
  VIRIDIAN_FOREST: 16,
  ROUTE_3: 10,
  MT_MOON: 8,
  MT_MOON_B1F: 8,
  MT_MOON_B2F: 8,
  ROUTE_4: 10,
  ROUTE_5: 10,
  ROUTE_6: 10,
  ROUTE_9: 10,
  ROUTE_10: 10,
  ROCK_TUNNEL_1F: 8,
};

/**
 * Offsets of each outdoor zone inside KANTO_OVERWORLD (generated by stitch-kanto.mjs).
 * These are used to map an absolute (x,y) back to the legacy zone name so that
 * per-zone encounter tables still work.
 */
export const KANTO_ZONE_OFFSETS: Record<string, { x: number; y: number; w: number; h: number }> = {
  // NOTE: exact values are filled in after running `node scripts/stitch-kanto.mjs`.
  // Until then, all encounters default to Route 1 table.
  PALLET_TOWN:     { x:  11, y: 198, w: 20, h: 18 },
  ROUTE_1:         { x:  10, y: 163, w: 20, h: 36 },
  VIRIDIAN_CITY:   { x:   0, y: 128, w: 40, h: 36 },
  ROUTE_2:         { x:  16, y:  89, w: 10, h: 40 },
  VIRIDIAN_FOREST: { x:   4, y:  42, w: 34, h: 48 },
  PEWTER_CITY:     { x:   0, y:   7, w: 40, h: 36 },
  ROUTE_3:         { x:  39, y:  18, w: 40, h: 18 },
  ROUTE_4:         { x:  69, y:  14, w: 40, h: 10 },
  CERULEAN_CITY:   { x: 108, y:   0, w: 40, h: 36 },
  ROUTE_5:         { x: 124, y:  35, w: 10, h: 18 },
  SAFFRON_CITY:    { x: 108, y:  51, w: 40, h: 36 },
  ROUTE_6:         { x: 124, y:  86, w: 10, h: 18 },
  VERMILION_CITY:  { x: 108, y: 102, w: 40, h: 36 },
  ROUTE_9:         { x: 147, y:   3, w: 20, h: 10 },
  ROUTE_10:        { x: 162, y:   7, w: 10, h: 24 },
  LAVENDER_TOWN:   { x: 156, y:  30, w: 20, h: 18 },
};

/** Given an absolute (x,y) in KANTO_OVERWORLD, return the legacy zone name. */
export function getKantoRegion(x: number, y: number): string {
  for (const [zone, r] of Object.entries(KANTO_ZONE_OFFSETS)) {
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return zone;
  }
  return 'ROUTE_1'; // fallback
}

export const WILD_POKEMON_DATABASE: Record<string, Pokemon[]> = {
  ROUTE_1: [
    makePokemon('pidgey', 'PIDGEY', 4, 'flying', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }),
    makePokemon('rattata', 'RATTATA', 4, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19),
    makePokemon('caterpie', 'CATERPIE', 3, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10),
    makePokemon('weedle', 'WEEDLE', 3, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] }),
    makePokemon('spearow', 'SPEAROW', 5, 'flying', [MOVES.PECK, MOVES.GROWL], 21, { types: ['normal', 'flying'] }),
    makePokemon('mankey', 'MANKEY', 5, 'fighting', [MOVES.SCRATCH, MOVES.TACKLE], 56),
    makePokemon('pikachu', 'PIKACHU', 6, 'electric', [MOVES.THUNDERSHOCK, MOVES.GROWL], 25),
  ],
  ROUTE_2: [
    makePokemon('pidgey', 'PIDGEY', 7, 'flying', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }),
    makePokemon('rattata', 'RATTATA', 7, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19),
    makePokemon('nidoran-f', 'NIDORAN♀', 7, 'poison', [MOVES.TACKLE, MOVES.GROWL], 29, { types: ['poison'] }),
    makePokemon('nidoran-m', 'NIDORAN♂', 7, 'poison', [MOVES.TACKLE, MOVES.GROWL], 32, { types: ['poison'] }),
    makePokemon('caterpie', 'CATERPIE', 6, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10),
    makePokemon('weedle', 'WEEDLE', 6, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] }),
  ],
  VIRIDIAN_FOREST: [
    makePokemon('caterpie', 'CATERPIE', 4, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10),
    makePokemon('weedle', 'WEEDLE', 4, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] }),
    makePokemon('metapod', 'METAPOD', 6, 'bug', [MOVES.HARDEN], 11),
    makePokemon('pikachu', 'PIKACHU', 6, 'electric', [MOVES.THUNDERSHOCK, MOVES.GROWL], 25),
  ],
  ROUTE_3: [
    makePokemon('spearow', 'SPEAROW', 9, 'flying', [MOVES.PECK, MOVES.GROWL], 21, { types: ['normal', 'flying'] }),
    makePokemon('jigglypuff', 'JIGGLYPUFF', 9, 'normal', [MOVES.POUND, MOVES.GROWL], 39),
    makePokemon('mankey', 'MANKEY', 10, 'fighting', [MOVES.SCRATCH, MOVES.TACKLE], 56),
    makePokemon('nidoran-m', 'NIDORAN♂', 9, 'poison', [MOVES.TACKLE, MOVES.GROWL], 32, { types: ['poison'] }),
    makePokemon('nidoran-f', 'NIDORAN♀', 9, 'poison', [MOVES.TACKLE, MOVES.GROWL], 29, { types: ['poison'] }),
  ],
  MT_MOON: [
    makePokemon('zubat', 'ZUBAT', 8, 'poison', [MOVES.TACKLE], 41, { types: ['poison', 'flying'] }),
    makePokemon('geodude', 'GEODUDE', 8, 'rock', [MOVES.TACKLE], 74, { types: ['rock', 'ground'] }),
    makePokemon('paras', 'PARAS', 9, 'bug', [MOVES.SCRATCH], 59, { types: ['bug', 'grass'] }),
    makePokemon('clefairy', 'CLEFAIRY', 8, 'normal', [MOVES.POUND, MOVES.GROWL], 68),
  ],
  MT_MOON_B1F: [
    makePokemon('zubat', 'ZUBAT', 9, 'poison', [MOVES.TACKLE], 41, { types: ['poison', 'flying'] }),
    makePokemon('geodude', 'GEODUDE', 10, 'rock', [MOVES.TACKLE], 74, { types: ['rock', 'ground'] }),
    makePokemon('paras', 'PARAS', 10, 'bug', [MOVES.SCRATCH], 59, { types: ['bug', 'grass'] }),
  ],
  MT_MOON_B2F: [
    makePokemon('zubat', 'ZUBAT', 10, 'poison', [MOVES.TACKLE], 41, { types: ['poison', 'flying'] }),
    makePokemon('geodude', 'GEODUDE', 11, 'rock', [MOVES.TACKLE], 74, { types: ['rock', 'ground'] }),
    makePokemon('paras', 'PARAS', 11, 'bug', [MOVES.SCRATCH], 59, { types: ['bug', 'grass'] }),
    makePokemon('clefairy', 'CLEFAIRY', 10, 'normal', [MOVES.POUND, MOVES.GROWL], 68),
  ],
  ROUTE_4: [
    makePokemon('spearow', 'SPEAROW', 10, 'flying', [MOVES.PECK, MOVES.GROWL], 21, { types: ['normal', 'flying'] }),
    makePokemon('rattata', 'RATTATA', 10, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19),
    makePokemon('sandshrew', 'SANDSHREW', 11, 'ground', [MOVES.SCRATCH, MOVES.TACKLE], 60),
    makePokemon('ekans', 'EKANS', 10, 'poison', [MOVES.TACKLE, MOVES.GROWL], 62),
  ],
  ROUTE_5: [
    makePokemon('pidgey', 'PIDGEY', 13, 'flying', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }),
    makePokemon('oddish', 'ODDISH', 13, 'grass', [MOVES.POUND, MOVES.SLEEP_POWDER], 43, { types: ['grass', 'poison'] }),
    makePokemon('mankey', 'MANKEY', 13, 'fighting', [MOVES.SCRATCH, MOVES.TACKLE], 56),
    makePokemon('meowth', 'MEOWTH', 13, 'normal', [MOVES.SCRATCH, MOVES.GROWL], 69),
  ],
  ROUTE_6: [
    makePokemon('pidgey', 'PIDGEY', 14, 'flying', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }),
    makePokemon('oddish', 'ODDISH', 14, 'grass', [MOVES.POUND, MOVES.SLEEP_POWDER], 43, { types: ['grass', 'poison'] }),
    makePokemon('mankey', 'MANKEY', 14, 'fighting', [MOVES.SCRATCH, MOVES.TACKLE], 56),
    makePokemon('meowth', 'MEOWTH', 14, 'normal', [MOVES.SCRATCH, MOVES.GROWL], 69),
  ],
  ROUTE_9: [
    makePokemon('rattata', 'RATTATA', 16, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19),
    makePokemon('spearow', 'SPEAROW', 14, 'flying', [MOVES.PECK, MOVES.GROWL], 21, { types: ['normal', 'flying'] }),
    makePokemon('ekans', 'EKANS', 15, 'poison', [MOVES.TACKLE, MOVES.GROWL], 62),
    makePokemon('sandshrew', 'SANDSHREW', 15, 'ground', [MOVES.SCRATCH, MOVES.TACKLE], 60),
  ],
  ROUTE_10: [
    makePokemon('rattata', 'RATTATA', 17, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19),
    makePokemon('spearow', 'SPEAROW', 16, 'flying', [MOVES.PECK, MOVES.GROWL], 21, { types: ['normal', 'flying'] }),
    makePokemon('voltorb', 'VOLTORB', 17, 'electric', [MOVES.TACKLE, MOVES.THUNDERSHOCK], 100, { types: ['electric'] }),
    makePokemon('ekans', 'EKANS', 17, 'poison', [MOVES.TACKLE, MOVES.GROWL], 62),
  ],
  ROCK_TUNNEL_1F: [
    makePokemon('zubat', 'ZUBAT', 15, 'poison', [MOVES.TACKLE], 41, { types: ['poison', 'flying'] }),
    makePokemon('geodude', 'GEODUDE', 16, 'rock', [MOVES.TACKLE], 74, { types: ['rock', 'ground'] }),
    makePokemon('machop', 'MACHOP', 15, 'fighting', [MOVES.SCRATCH, MOVES.TACKLE], 61),
    makePokemon('onix', 'ONIX', 17, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 95, { types: ['rock', 'ground'] }),
  ],
};

export const SHOP_PRICES: Record<string, number> = { 
  POTION: 200, 
  POKEBALL: 200,
  ANTIDOTE: 100,
  PARALYZE_HEAL: 200,
  BURN_HEAL: 250
};
