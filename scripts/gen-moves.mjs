#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = '/Users/pbrusco/projects/poke';
const CONSTANTS = join(ROOT, 'src/constants.ts');
const OUT_DIR = join(ROOT, 'scripts/out');

const ALL_MOVES = [
  // [ID, name, type, power, acc, pp, flags]
  {id:'POUND',n:'DESTRUCTOR',t:'normal',p:40,a:100,pp:35},
  {id:'KARATE_CHOP',n:'GOLPE KÁRATE',t:'fighting',p:50,a:100,pp:25,highCrit:true},
  {id:'DOUBLESLAP',n:'DOBLE BOFETÓN',t:'normal',p:15,a:85,pp:10,multiHit:{minHits:2,maxHits:5}},
  {id:'COMET_PUNCH',n:'PUÑO COMETA',t:'normal',p:18,a:85,pp:15,multiHit:{minHits:2,maxHits:5}},
  {id:'MEGA_PUNCH',n:'MEGA PUÑO',t:'normal',p:80,a:85,pp:20},
  {id:'PAY_DAY',n:'DÍA DE PAGO',t:'normal',p:40,a:100,pp:20},
  {id:'FIRE_PUNCH',n:'PUÑO FUEGO',t:'fire',p:75,a:100,pp:15,statusEffect:'burn',statusChance:10},
  {id:'ICE_PUNCH',n:'PUÑO HIELO',t:'ice',p:75,a:100,pp:15,statusEffect:'frozen',statusChance:10},
  {id:'THUNDERPUNCH',n:'PUÑO TRUENO',t:'electric',p:75,a:100,pp:15,statusEffect:'paralyzed',statusChance:10},
  {id:'SCRATCH',n:'ARAÑAZO',t:'normal',p:40,a:100,pp:35},
  {id:'VICEGRIP',n:'AGARRÓN',t:'normal',p:55,a:100,pp:30},
  {id:'RAZOR_WIND',n:'VIENTO CORT.',t:'normal',p:80,a:100,pp:10},
  {id:'SWORDS_DANCE',n:'DANZA ESPADA',t:'normal',p:0,a:100,pp:20,statChange:{target:'self',stat:'attack',stages:2}},
  {id:'CUT',n:'CORTAR',t:'normal',p:50,a:95,pp:30},
  {id:'GUST',n:'TORNADO',t:'flying',p:40,a:100,pp:35},
  {id:'WING_ATTACK',n:'ATAQUE ALA',t:'flying',p:60,a:100,pp:35},
  {id:'FLY',n:'VUELO',t:'flying',p:70,a:95,pp:15,twoTurn:{chargeMessage:'¡voló muy alto!',invulnerable:true}},
  {id:'BIND',n:'ATADURA',t:'normal',p:15,a:85,pp:20},
  {id:'SLAM',n:'PORTAZO',t:'normal',p:80,a:75,pp:20},
  {id:'VINE_WHIP',n:'LÁTIGO CEPA',t:'grass',p:45,a:100,pp:25},
  {id:'STOMP',n:'PISOTÓN',t:'normal',p:65,a:100,pp:20,statusEffect:'paralyzed',statusChance:30},
  {id:'DOUBLE_KICK',n:'DOBLE PATADA',t:'fighting',p:30,a:100,pp:30,multiHit:{minHits:2,maxHits:2}},
  {id:'MEGA_KICK',n:'MEGA PATADA',t:'normal',p:120,a:75,pp:5},
  {id:'JUMP_KICK',n:'PAT. SALTO',t:'fighting',p:70,a:95,pp:25},
  {id:'ROLLING_KICK',n:'PATADA GIRO',t:'fighting',p:60,a:85,pp:15},
  {id:'SAND_ATTACK',n:'ATAQUE ARENA',t:'normal',p:0,a:100,pp:15,statChange:{target:'enemy',stat:'accuracy',stages:-2}},
  {id:'HEADBUTT',n:'GOLPE CABEZA',t:'normal',p:70,a:100,pp:15,statusEffect:'paralyzed',statusChance:30},
  {id:'HORN_ATTACK',n:'CORNEAZO',t:'normal',p:65,a:100,pp:25},
  {id:'FURY_ATTACK',n:'ATAQUE FURIA',t:'normal',p:15,a:85,pp:20,multiHit:{minHits:2,maxHits:5}},
  {id:'TACKLE',n:'PLACAJE',t:'normal',p:35,a:95,pp:35},
  {id:'BODY_SLAM',n:'GOLPE CUERPO',t:'normal',p:85,a:100,pp:15,statusEffect:'paralyzed',statusChance:30},
  {id:'WRAP',n:'REPETICIÓN',t:'normal',p:15,a:90,pp:20},
  {id:'TAKE_DOWN',n:'DERRIBO',t:'normal',p:90,a:85,pp:20,recoil:0.25},
  {id:'THRASH',n:'GOLPE',t:'normal',p:90,a:100,pp:20,rampage:{turns:2}},
  {id:'DOUBLE_EDGE',n:'DOBLE FILO',t:'normal',p:120,a:100,pp:15,recoil:0.25},
  {id:'TAIL_WHIP',n:'LÁTIGO',t:'normal',p:0,a:100,pp:30,statChange:{target:'enemy',stat:'defense',stages:-1}},
  {id:'POISON_STING',n:'PICOT. VENENO',t:'poison',p:15,a:100,pp:35,statusEffect:'poison',statusChance:30},
  {id:'TWINEEDLE',n:'DOBLE ATAQUE',t:'bug',p:25,a:100,pp:20,multiHit:{minHits:2,maxHits:2},statusEffect:'poison',statusChance:20},
  {id:'PIN_MISSILE',n:'PIN MISIL',t:'bug',p:14,a:85,pp:20,multiHit:{minHits:2,maxHits:5}},
  {id:'LEER',n:'MALICIA',t:'normal',p:0,a:100,pp:30,statChange:{target:'enemy',stat:'defense',stages:-1}},
  {id:'BITE',n:'MORDISCO',t:'normal',p:60,a:100,pp:25},
  {id:'GROWL',n:'GRUÑIDO',t:'normal',p:0,a:100,pp:40,statChange:{target:'enemy',stat:'attack',stages:-1}},
  {id:'SING',n:'CANTO',t:'normal',p:0,a:55,pp:15,statusEffect:'sleep',statusChance:100},
  {id:'SUPERSONIC',n:'SUPERSÓNICO',t:'normal',p:0,a:55,pp:20,confuseChance:100},
  {id:'SONICBOOM',n:'BOMBA SÓNICA',t:'normal',p:1,a:90,pp:20,fixedDmg:20},
  {id:'ACID',n:'ÁCIDO',t:'poison',p:40,a:100,pp:30,statChange:{target:'enemy',stat:'defense',stages:-1}},
  {id:'EMBER',n:'ASCUAS',t:'fire',p:40,a:100,pp:25,statusEffect:'burn',statusChance:10},
  {id:'FLAMETHROWER',n:'LANZALLAMAS',t:'fire',p:90,a:100,pp:15,statusEffect:'burn',statusChance:10},
  {id:'WATER_GUN',n:'PISTOLA AGUA',t:'water',p:40,a:100,pp:25},
  {id:'HYDRO_PUMP',n:'HIDROBOMBA',t:'water',p:120,a:80,pp:5},
  {id:'SURF',n:'SURF',t:'water',p:90,a:100,pp:15},
  {id:'ICE_BEAM',n:'RAYO HIELO',t:'ice',p:90,a:100,pp:10,statusEffect:'frozen',statusChance:10},
  {id:'BLIZZARD',n:'VENTISCA',t:'ice',p:110,a:90,pp:5,statusEffect:'frozen',statusChance:10},
  {id:'PSYBEAM',n:'PSICO RAYO',t:'psychic',p:65,a:100,pp:20,confuseChance:10},
  {id:'BUBBLEBEAM',n:'RAYO BURBUJA',t:'water',p:65,a:100,pp:20},
  {id:'AURORA_BEAM',n:'RAYO AURORA',t:'ice',p:65,a:100,pp:20,statChange:{target:'enemy',stat:'attack',stages:-1}},
  {id:'HYPER_BEAM',n:'HIPER RAYO',t:'normal',p:150,a:90,pp:5,recharge:true},
  {id:'PECK',n:'PICOTAZO',t:'flying',p:35,a:100,pp:35},
  {id:'DRILL_PECK',n:'PICO TALADRO',t:'flying',p:80,a:100,pp:20},
  {id:'SUBMISSION',n:'SUBMISIÓN',t:'fighting',p:80,a:80,pp:25,recoil:0.25},
  {id:'LOW_KICK',n:'PATADA BAJA',t:'fighting',p:50,a:100,pp:20},
  {id:'COUNTER',n:'CONTRAATAQUE',t:'fighting',p:1,a:100,pp:20},
  {id:'SEISMIC_TOSS',n:'MOV. SÍSM.',t:'fighting',p:1,a:100,pp:20,dmgEqualsLevel:true},
  {id:'STRENGTH',n:'FUERZA',t:'normal',p:80,a:100,pp:15},
  {id:'ABSORB',n:'ABSORBER',t:'grass',p:20,a:100,pp:20,drain:0.5},
  {id:'MEGA_DRAIN',n:'MEGA DRENADO',t:'grass',p:40,a:100,pp:15,drain:0.5},
  {id:'LEECH_SEED',n:'DRENADORAS',t:'grass',p:0,a:90,pp:10},
  {id:'GROWTH',n:'CRECIMIENTO',t:'normal',p:0,a:100,pp:20,statChange:{target:'self',stat:'special',stages:1}},
  {id:'RAZOR_LEAF',n:'HOJA AFILADA',t:'grass',p:55,a:95,pp:25,highCrit:true},
  {id:'SOLAR_BEAM',n:'RAYO SOLAR',t:'grass',p:120,a:100,pp:10,twoTurn:{chargeMessage:'¡tomó luz solar!',invulnerable:false}},
  {id:'POISON_POWDER',n:'POLVO VENENO',t:'poison',p:0,a:75,pp:35,statusEffect:'poison',statusChance:100},
  {id:'STUN_SPORE',n:'PARALIZADOR',t:'grass',p:0,a:75,pp:30,statusEffect:'paralyzed',statusChance:100},
  {id:'SLEEP_POWDER',n:'SOMNÍFERO',t:'grass',p:0,a:75,pp:15,statusEffect:'sleep',statusChance:100},
  {id:'PETAL_DANCE',n:'DANZA PÉTALO',t:'grass',p:70,a:100,pp:20,rampage:{turns:2}},
  {id:'STRING_SHOT',n:'DISP. SEDA',t:'bug',p:0,a:95,pp:40,statChange:{target:'enemy',stat:'speed',stages:-1}},
  {id:'DRAGON_RAGE',n:'FURIA DRAGÓN',t:'dragon',p:1,a:100,pp:10,fixedDmg:40},
  {id:'FIRE_SPIN',n:'GIRO FUEGO',t:'fire',p:15,a:70,pp:15},
  {id:'THUNDERSHOCK',n:'IMPACTRUENO',t:'electric',p:40,a:100,pp:30,statusEffect:'paralyzed',statusChance:10},
  {id:'THUNDERBOLT',n:'RAYO',t:'electric',p:90,a:100,pp:15,statusEffect:'paralyzed',statusChance:10},
  {id:'THUNDER_WAVE',n:'ONDA TRUENO',t:'electric',p:0,a:100,pp:20,statusEffect:'paralyzed',statusChance:100},
  {id:'THUNDER',n:'TRUENO',t:'electric',p:110,a:70,pp:10,statusEffect:'paralyzed',statusChance:30},
  {id:'ROCK_THROW',n:'LANZARROCAS',t:'rock',p:50,a:90,pp:15},
  {id:'EARTHQUAKE',n:'TERREMOTO',t:'ground',p:100,a:100,pp:10},
  {id:'DIG',n:'EXCAVAR',t:'ground',p:80,a:100,pp:10,twoTurn:{chargeMessage:'¡cavó un hoyo!',invulnerable:true}},
  {id:'TOXIC',n:'TÓXICO',t:'poison',p:0,a:85,pp:10,statusEffect:'poison',statusChance:100},
  {id:'CONFUSION',n:'CONFUSIÓN',t:'psychic',p:50,a:100,pp:25,confuseChance:10},
  {id:'PSYCHIC',n:'PSÍQUICO',t:'psychic',p:90,a:100,pp:10,statChange:{target:'enemy',stat:'special',stages:-1}},
  {id:'HYPNOSIS',n:'HIPNOSIS',t:'psychic',p:0,a:60,pp:20,statusEffect:'sleep',statusChance:100},
  {id:'MEDITATE',n:'MEDITACIÓN',t:'psychic',p:0,a:100,pp:40,statChange:{target:'self',stat:'attack',stages:1}},
  {id:'AGILITY',n:'AGILIDAD',t:'psychic',p:0,a:100,pp:30,statChange:{target:'self',stat:'speed',stages:2}},
  {id:'QUICK_ATTACK',n:'ATAQUE RÁPIDO',t:'normal',p:40,a:100,pp:30,priority:1},
  {id:'RAGE',n:'FURIA',t:'normal',p:20,a:100,pp:20},
  {id:'NIGHT_SHADE',n:'TINIEBLAS',t:'ghost',p:1,a:100,pp:15,dmgEqualsLevel:true},
  {id:'SCREECH',n:'CHIRRIDO',t:'normal',p:0,a:85,pp:40,statChange:{target:'enemy',stat:'defense',stages:-2}},
  {id:'DOUBLE_TEAM',n:'DOBLE EQUIPO',t:'normal',p:0,a:100,pp:15,statChange:{target:'self',stat:'evasion',stages:1}},
  {id:'RECOVER',n:'RECUPERACIÓN',t:'normal',p:0,a:100,pp:20,healSelf:50},
  {id:'HARDEN',n:'FORTALEZA',t:'normal',p:0,a:100,pp:30,statChange:{target:'self',stat:'defense',stages:1}},
  {id:'MINIMIZE',n:'REDUCCIÓN',t:'normal',p:0,a:100,pp:20,statChange:{target:'self',stat:'evasion',stages:1}},
  {id:'SMOKESCREEN',n:'PANTALLAHUMO',t:'normal',p:0,a:100,pp:20,statChange:{target:'enemy',stat:'accuracy',stages:-2}},
  {id:'CONFUSE_RAY',n:'RAYO CONFUSO',t:'ghost',p:0,a:100,pp:10,confuseChance:100},
  {id:'WITHDRAW',n:'RETIRADA',t:'water',p:0,a:100,pp:40,statChange:{target:'self',stat:'defense',stages:1}},
  {id:'DEFENSE_CURL',n:'RIZO DEFENSA',t:'normal',p:0,a:100,pp:40,statChange:{target:'self',stat:'defense',stages:1}},
  {id:'BARRIER',n:'BARRERA',t:'psychic',p:0,a:100,pp:20,statChange:{target:'self',stat:'defense',stages:2}},
  {id:'LIGHT_SCREEN',n:'PANTALLA LUZ',t:'psychic',p:0,a:100,pp:30},
  {id:'HAZE',n:'NEBLINA OSC.',t:'ice',p:0,a:100,pp:30},
  {id:'REFLECT',n:'REFLEJO',t:'psychic',p:0,a:100,pp:20},
  {id:'FOCUS_ENERGY',n:'ENERG. FOCAL',t:'normal',p:0,a:100,pp:30},
  {id:'BIDE',n:'ESPERA',t:'normal',p:0,a:100,pp:10},
  {id:'METRONOME',n:'METRÓNOMO',t:'normal',p:0,a:100,pp:10},
  {id:'MIRROR_MOVE',n:'MOV. ESPEJO',t:'flying',p:0,a:100,pp:20},
  {id:'SELFDESTRUCT',n:'AUTODESTR.',t:'normal',p:200,a:100,pp:5,faintsUser:true},
  {id:'EGG_BOMB',n:'BOMBA HUEVO',t:'normal',p:100,a:75,pp:10},
  {id:'LICK',n:'LENGÜETAZO',t:'ghost',p:20,a:100,pp:30,statusEffect:'paralyzed',statusChance:30},
  {id:'SMOG',n:'MOHO',t:'poison',p:20,a:70,pp:20,statusEffect:'poison',statusChance:40},
  {id:'SLUDGE',n:'RESIDUOS',t:'poison',p:65,a:100,pp:20,statusEffect:'poison',statusChance:30},
  {id:'BONE_CLUB',n:'HUESO PALO',t:'ground',p:65,a:85,pp:20},
  {id:'FIRE_BLAST',n:'LLAMARADA',t:'fire',p:110,a:85,pp:5,statusEffect:'burn',statusChance:30},
  {id:'WATERFALL',n:'CASCADA',t:'water',p:80,a:100,pp:15},
  {id:'CLAMP',n:'TENAZA',t:'water',p:35,a:85,pp:10},
  {id:'SWIFT',n:'RAPIDEZ',t:'normal',p:60,a:100,pp:20,alwaysHit:true},
  {id:'SPIKE_CANNON',n:'CLAVO CAÑÓN',t:'normal',p:20,a:100,pp:15,multiHit:{minHits:2,maxHits:5}},
  {id:'CONSTRICT',n:'RESTRICCIÓN',t:'normal',p:10,a:100,pp:35},
  {id:'AMNESIA',n:'AMNESIA',t:'psychic',p:0,a:100,pp:20,statChange:{target:'self',stat:'special',stages:2}},
  {id:'KINESIS',n:'KINESIS',t:'psychic',p:0,a:80,pp:15,statChange:{target:'enemy',stat:'accuracy',stages:-2}},
  {id:'SOFTBOILED',n:'AMORTIGUADOR',t:'normal',p:0,a:100,pp:10,healSelf:50},
  {id:'HI_JUMP_KICK',n:'PAT. SALTO A.',t:'fighting',p:85,a:90,pp:20},
  {id:'GLARE',n:'MIRADA ESTEL.',t:'normal',p:0,a:100,pp:30,statusEffect:'paralyzed',statusChance:100},
  {id:'DREAM_EATER',n:'COMESUEÑOS',t:'psychic',p:100,a:100,pp:15,drain:0.5},
  {id:'POISON_GAS',n:'GAS VENENOSO',t:'poison',p:0,a:80,pp:40,statusEffect:'poison',statusChance:100},
  {id:'BARRAGE',n:'LLUVIA',t:'normal',p:15,a:85,pp:20,multiHit:{minHits:2,maxHits:5}},
  {id:'LEECH_LIFE',n:'DRENAJE',t:'bug',p:20,a:100,pp:15,drain:0.5},
  {id:'LOVELY_KISS',n:'BESO AMOROSO',t:'normal',p:0,a:75,pp:10,statusEffect:'sleep',statusChance:100},
  {id:'SKY_ATTACK',n:'ATAQ. CIELO',t:'flying',p:140,a:90,pp:5},
  {id:'TRANSFORM',n:'TRANSFORMAC.',t:'normal',p:0,a:100,pp:10},
  {id:'BUBBLE',n:'BURBUJA',t:'water',p:20,a:100,pp:30,statChange:{target:'enemy',stat:'speed',stages:-1}},
  {id:'DIZZY_PUNCH',n:'PUÑO MAREANTE',t:'normal',p:70,a:100,pp:10},
  {id:'SPORE',n:'ESPORA',t:'grass',p:0,a:75,pp:15,statusEffect:'sleep',statusChance:100},
  {id:'FLASH',n:'DESTELLO',t:'normal',p:0,a:100,pp:20,statChange:{target:'enemy',stat:'accuracy',stages:-2}},
  {id:'PSYWAVE',n:'PSIQUI ONDA',t:'psychic',p:1,a:100,pp:15},
  {id:'SPLASH',n:'SALPICADURA',t:'normal',p:0,a:100,pp:40},
  {id:'ACID_ARMOR',n:'ARMADURA ÁCI.',t:'poison',p:0,a:100,pp:20,statChange:{target:'self',stat:'defense',stages:2}},
  {id:'CRABHAMMER',n:'MARTILLO',t:'water',p:90,a:85,pp:10,highCrit:true},
  {id:'EXPLOSION',n:'EXPLOSIÓN',t:'normal',p:250,a:100,pp:5,faintsUser:true},
  {id:'FURY_SWIPES',n:'GOLPES FURIA',t:'normal',p:18,a:80,pp:15,multiHit:{minHits:2,maxHits:5}},
  {id:'BONEMERANG',n:'BUMERANG',t:'ground',p:50,a:90,pp:10,multiHit:{minHits:2,maxHits:2}},
  {id:'REST',n:'DESCANSO',t:'psychic',p:0,a:100,pp:10,healSelf:100,healStatus:true},
  {id:'ROCK_SLIDE',n:'AVALANCHA',t:'rock',p:75,a:90,pp:10},
  {id:'HYPER_FANG',n:'SUPER DIENTE',t:'normal',p:80,a:90,pp:15},
  {id:'SHARPEN',n:'AFILAR',t:'normal',p:0,a:100,pp:30,statChange:{target:'self',stat:'attack',stages:1}},
  {id:'CONVERSION',n:'CONVERSIÓN',t:'normal',p:0,a:100,pp:30},
  {id:'TRI_ATTACK',n:'TRIPLE ATAQUE',t:'normal',p:80,a:100,pp:10,statusEffect:'paralyzed',statusChance:20},
  {id:'SUPER_FANG',n:'SUPER COLMIL.',t:'normal',p:1,a:90,pp:10},
  {id:'SLASH',n:'CUCHILLADA',t:'normal',p:70,a:100,pp:20,highCrit:true},
  {id:'SUBSTITUTE',n:'SUSTITUTO',t:'normal',p:0,a:100,pp:10},
  {id:'STRUGGLE',n:'FORCEJEO',t:'normal',p:50,a:100,pp:99},
];

// Check which moves are already defined
const constants = readFileSync(CONSTANTS, 'utf8');
const existing = new Set();
const mRe = /^\s{2}([A-Z_]+): .*move\(/gm;
let m;
while ((m = mRe.exec(constants))) existing.add(m[1]);

const missing = ALL_MOVES.filter(mv => !existing.has(mv.id));

// Generate entries
let out = '// ── Auto-generated moves from pokered data ──\n\n';
for (const mv of missing) {
  const extras = [];
  if (mv.statusEffect) extras.push(`statusEffect: '${mv.statusEffect}'`);
  if (mv.statusChance) extras.push(`statusChance: ${mv.statusChance}`);
  if (mv.statChange) {
    const s = mv.statChange;
    extras.push(`statChange: { target: '${s.target}', stat: '${s.stat}', stages: ${s.stages} }`);
  }
  if (mv.highCrit) extras.push('highCrit: true');
  if (mv.recoil) extras.push(`recoil: ${mv.recoil}`);
  if (mv.drain) extras.push(`drain: ${mv.drain}`);
  if (mv.multiHit) extras.push(`multiHit: { minHits: ${mv.multiHit.minHits}, maxHits: ${mv.multiHit.maxHits} }`);
  if (mv.rampage) extras.push(`rampage: { turns: ${mv.rampage.turns} }`);
  if (mv.recharge) extras.push('recharge: true');
  if (mv.twoTurn) extras.push(`twoTurn: { chargeMessage: '${mv.twoTurn.chargeMessage}', invulnerable: ${mv.twoTurn.invulnerable} }`);
  if (mv.alwaysHit) extras.push('alwaysHit: true');
  if (mv.confuseChance) extras.push(`confuseChance: ${mv.confuseChance}`);
  if (mv.priority) extras.push(`priority: ${mv.priority}`);
  if (mv.fixedDmg) extras.push(`fixedDmg: ${mv.fixedDmg}`);
  if (mv.dmgEqualsLevel) extras.push('dmgEqualsLevel: true');
  if (mv.faintsUser) extras.push('faintsUser: true');
  if (mv.healSelf) extras.push(`healSelf: ${mv.healSelf}`);
  if (mv.healStatus) extras.push('healStatus: true');

  const pad = Math.max(1, 16 - mv.id.length);
  const extraStr = extras.length ? `, { ${extras.join(', ')} }` : '';
  out += `  ${mv.id}:${' '.repeat(pad)}move('${mv.n}', ${`'${mv.t}'`.padEnd(10)}, ${String(mv.p).padStart(3)}, ${String(mv.a).padStart(3)}, ${String(mv.pp).padStart(3)}${extraStr}),\n`;
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'new_moves.txt'), out);

const dupes = ALL_MOVES.filter(mv => existing.has(mv.id));
console.log(`Total: ${ALL_MOVES.length}, Existing: ${existing.size}, Missing: ${missing.length}, Duplicates: ${dupes.length}`);
console.log('Written to scripts/out/new_moves.txt');
