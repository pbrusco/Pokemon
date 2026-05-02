#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = '/Users/pbrusco/projects/poke';
const EVOS = readFileSync(join(ROOT, 'pokered_dissasembly/data/pokemon/evos_moves.asm'), 'utf8');

// pokered species index → dex# (PokeAPI)
const PK_TO_DEX = {
  1:112,2:115,3:32,4:35,5:21,6:100,7:34,8:80,9:2,10:103,11:108,12:102,13:88,14:94,15:29,16:31,
  17:104,18:111,19:131,20:59,21:151,22:130,23:90,24:72,25:92,26:123,27:120,28:9,29:127,30:114,
  33:58,34:95,35:22,36:16,37:79,38:64,39:75,40:113,41:67,42:122,43:106,44:107,45:24,46:47,
  47:54,48:96,49:76,51:126,53:125,54:82,55:109,57:56,58:86,59:50,60:128,64:83,65:48,66:149,
  70:84,71:60,72:124,73:146,74:145,75:144,76:132,77:52,78:98,82:37,83:38,84:25,85:26,
  88:147,89:148,90:140,91:141,92:116,93:117,96:27,97:28,98:138,99:139,100:39,101:40,
  102:133,103:136,104:135,105:134,106:66,107:41,108:23,109:46,110:61,111:62,112:13,113:14,114:15,
  116:85,117:57,118:51,119:49,120:87,123:10,124:11,125:12,126:68,128:55,129:97,130:42,131:150,
  132:143,133:129,136:89,138:99,139:91,141:101,142:36,143:110,144:53,145:105,147:93,148:63,149:65,
  150:17,151:18,152:121,153:1,154:3,155:73,157:118,158:119,163:77,164:78,165:19,166:20,167:33,
  168:30,169:74,170:137,171:142,173:81,176:4,177:7,178:5,179:8,180:6,185:43,186:44,187:45,
  188:69,189:70,190:71,
};

const MOVE_NAMES = {POUND:'POUND',KARATE_CHOP:'KARATE_CHOP',DOUBLESLAP:'DOUBLESLAP',COMET_PUNCH:'COMET_PUNCH',MEGA_PUNCH:'MEGA_PUNCH',PAY_DAY:'PAY_DAY',FIRE_PUNCH:'FIRE_PUNCH',ICE_PUNCH:'ICE_PUNCH',THUNDERPUNCH:'THUNDERPUNCH',SCRATCH:'SCRATCH',VICEGRIP:'VICEGRIP',GUILLOTINE:'GUILLOTINE',RAZOR_WIND:'RAZOR_WIND',SWORDS_DANCE:'SWORDS_DANCE',CUT:'CUT',GUST:'GUST',WING_ATTACK:'WING_ATTACK',WHIRLWIND:'WHIRLWIND',FLY:'FLY',BIND:'BIND',SLAM:'SLAM',VINE_WHIP:'VINE_WHIP',STOMP:'STOMP',DOUBLE_KICK:'DOUBLE_KICK',MEGA_KICK:'MEGA_KICK',JUMP_KICK:'JUMP_KICK',ROLLING_KICK:'ROLLING_KICK',SAND_ATTACK:'SAND_ATTACK',HEADBUTT:'HEADBUTT',HORN_ATTACK:'HORN_ATTACK',FURY_ATTACK:'FURY_ATTACK',HORN_DRILL:'HORN_DRILL',TACKLE:'TACKLE',BODY_SLAM:'BODY_SLAM',WRAP:'WRAP',TAKE_DOWN:'TAKE_DOWN',THRASH:'THRASH',DOUBLE_EDGE:'DOUBLE_EDGE',TAIL_WHIP:'TAIL_WHIP',POISON_STING:'POISON_STING',TWINEEDLE:'TWINEEDLE',PIN_MISSILE:'PIN_MISSILE',LEER:'LEER',BITE:'BITE',GROWL:'GROWL',ROAR:'ROAR',SING:'SING',SUPERSONIC:'SUPERSONIC',SONICBOOM:'SONICBOOM',DISABLE:'DISABLE',ACID:'ACID',EMBER:'EMBER',FLAMETHROWER:'FLAMETHROWER',MIST:'MIST',WATER_GUN:'WATER_GUN',HYDRO_PUMP:'HYDRO_PUMP',SURF:'SURF',ICE_BEAM:'ICE_BEAM',BLIZZARD:'BLIZZARD',PSYBEAM:'PSYBEAM',BUBBLEBEAM:'BUBBLEBEAM',AURORA_BEAM:'AURORA_BEAM',HYPER_BEAM:'HYPER_BEAM',PECK:'PECK',DRILL_PECK:'DRILL_PECK',SUBMISSION:'SUBMISSION',LOW_KICK:'LOW_KICK',COUNTER:'COUNTER',SEISMIC_TOSS:'SEISMIC_TOSS',STRENGTH:'STRENGTH',ABSORB:'ABSORB',MEGA_DRAIN:'MEGA_DRAIN',LEECH_SEED:'LEECH_SEED',GROWTH:'GROWTH',RAZOR_LEAF:'RAZOR_LEAF',SOLARBEAM:'SOLAR_BEAM',POISONPOWDER:'POISON_POWDER',STUN_SPORE:'STUN_SPORE',SLEEP_POWDER:'SLEEP_POWDER',PETAL_DANCE:'PETAL_DANCE',STRING_SHOT:'STRING_SHOT',DRAGON_RAGE:'DRAGON_RAGE',FIRE_SPIN:'FIRE_SPIN',THUNDERSHOCK:'THUNDERSHOCK',THUNDERBOLT:'THUNDERBOLT',THUNDER_WAVE:'THUNDER_WAVE',THUNDER:'THUNDER',ROCK_THROW:'ROCK_THROW',EARTHQUAKE:'EARTHQUAKE',FISSURE:'FISSURE',DIG:'DIG',TOXIC:'TOXIC',CONFUSION:'CONFUSION',PSYCHIC:'PSYCHIC',HYPNOSIS:'HYPNOSIS',MEDITATE:'MEDITATE',AGILITY:'AGILITY',QUICK_ATTACK:'QUICK_ATTACK',RAGE:'RAGE',TELEPORT:'TELEPORT',NIGHT_SHADE:'NIGHT_SHADE',MIMIC:'MIMIC',SCREECH:'SCREECH',DOUBLE_TEAM:'DOUBLE_TEAM',RECOVER:'RECOVER',HARDEN:'HARDEN',MINIMIZE:'MINIMIZE',SMOKESCREEN:'SMOKESCREEN',CONFUSE_RAY:'CONFUSE_RAY',WITHDRAW:'WITHDRAW',DEFENSE_CURL:'DEFENSE_CURL',BARRIER:'BARRIER',LIGHT_SCREEN:'LIGHT_SCREEN',HAZE:'HAZE',REFLECT:'REFLECT',FOCUS_ENERGY:'FOCUS_ENERGY',BIDE:'BIDE',METRONOME:'METRONOME',MIRROR_MOVE:'MIRROR_MOVE',SELFDESTRUCT:'SELFDESTRUCT',EGG_BOMB:'EGG_BOMB',LICK:'LICK',SMOG:'SMOG',SLUDGE:'SLUDGE',BONE_CLUB:'BONE_CLUB',FIRE_BLAST:'FIRE_BLAST',WATERFALL:'WATERFALL',CLAMP:'CLAMP',SWIFT:'SWIFT',SKULL_BASH:'SKULL_BASH',SPIKE_CANNON:'SPIKE_CANNON',CONSTRICT:'CONSTRICT',AMNESIA:'AMNESIA',KINESIS:'KINESIS',SOFTBOILED:'SOFTBOILED',HI_JUMP_KICK:'HI_JUMP_KICK',GLARE:'GLARE',DREAM_EATER:'DREAM_EATER',POISON_GAS:'POISON_GAS',BARRAGE:'BARRAGE',LEECH_LIFE:'LEECH_LIFE',LOVELY_KISS:'LOVELY_KISS',SKY_ATTACK:'SKY_ATTACK',TRANSFORM:'TRANSFORM',BUBBLE:'BUBBLE',DIZZY_PUNCH:'DIZZY_PUNCH',SPORE:'SPORE',FLASH:'FLASH',PSYWAVE:'PSYWAVE',SPLASH:'SPLASH',ACID_ARMOR:'ACID_ARMOR',CRABHAMMER:'CRABHAMMER',EXPLOSION:'EXPLOSION',FURY_SWIPES:'FURY_SWIPES',BONEMERANG:'BONEMERANG',REST:'REST',ROCK_SLIDE:'ROCK_SLIDE',HYPER_FANG:'HYPER_FANG',SHARPEN:'SHARPEN',CONVERSION:'CONVERSION',TRI_ATTACK:'TRI_ATTACK',SUPER_FANG:'SUPER_FANG',SLASH:'SLASH',SUBSTITUTE:'SUBSTITUTE'};

// Parse sections
const sections = {};
const re = /(\w+EvosMoves):\n([\s\S]*?)(?=\n\w+EvosMoves:|\n$)/g;
let m;
while ((m = re.exec(EVOS))) sections[m[1]] = m[2];

const learnsets = {};
for (const [label, data] of Object.entries(sections)) {
  const species = label.replace('EvosMoves', '').toLowerCase().replace(/♀/,'-f').replace(/♂/,'-m');
  const idx = Object.entries(PK_TO_DEX).find(([i, _]) => {
    const lookup = {
      rhyhorn:111, kangaskhan:115, 'nidoran-m':32, clefairy:35, spearow:21, voltorb:100,
      nidoking:34, slowbro:80, ivysaur:2, exeggutor:103, lickitung:108, exeggcute:102,
      grimer:88, gengar:94, 'nidoran-f':29, nidoqueen:31, cubone:104, rhydon:112, lapras:131,
      arcanine:59, mew:151, gyarados:130, shellder:90, tentacool:72, gastly:92, scyther:123,
      staryu:120, blastoise:9, pinsir:127, tangela:114,
    };
    return lookup[species] === parseInt(i);
  });
  let pkIdx = null;
  for (const [k, dex] of Object.entries(PK_TO_DEX)) {
    const dexLookup = {
      rhydon:112, kangaskhan:115, 'nidoran-m':32, clefairy:35, spearow:21, voltorb:100, 
      nidoking:34, slowbro:80, ivysaur:2, exeggutor:103, lickitung:108, exeggcute:102,
      grimer:88, gengar:94, 'nidoran-f':29, nidoqueen:31, cubone:104, rhyhorn:111, lapras:131,
      arcanine:59, mew:151, gyarados:130, shellder:90, tentacool:72, gastly:92, scyther:123,
      staryu:120, blastoise:9, pinsir:127, tangela:114, growlithe:58, onix:95, fearow:22,
      pidgey:16, slowpoke:79, kadabra:64, graveler:75, chansey:113, machoke:67, 'mr-mime':122,
      hitmonlee:106, hitmonchan:107, arbok:24, parasect:47, psyduck:54, drowzee:96, golem:76,
      magmar:126, electabuzz:125, magneton:82, koffing:109, mankey:56, seel:86, diglett:50,
      tauros:128, farfetchd:83, venonat:48, dragonite:149, doduo:84, poliwag:60, jynx:124,
      moltres:146, articuno:144, zapdos:145, ditto:132, meowth:52, krabby:98, vulpix:37,
      ninetales:38, pikachu:25, raichu:26, dratini:147, dragonair:148, kabuto:140, kabutops:141,
      horsea:116, seadra:117, sandshrew:27, sandslash:28, omanyte:138, omastar:139,
      jigglypuff:39, wigglytuff:40, eevee:133, flareon:136, jolteon:135, vaporeon:134,
      machop:66, zubat:41, ekans:23, paras:46, poliwhirl:61, poliwrath:62, weedle:13,
      kakuna:14, beedrill:15, dodrio:85, primeape:57, dugtrio:51, venomoth:49, dewgong:87,
      caterpie:10, metapod:11, butterfree:12, machamp:68, golduck:55, hypno:97, golbat:42,
      mewtwo:150, snorlax:143, magikarp:129, muk:89, kingler:99, cloyster:91, electrode:101,
      clefable:36, weezing:110, persian:53, marowak:105, haunter:93, abra:63, alakazam:65,
      pidgeotto:17, pidgeot:18, starmie:121, bulbasaur:1, venusaur:3, tentacruel:73,
      goldeen:118, seaking:119, ponyta:77, rapidash:78, rattata:19, raticate:20, nidorino:33,
      nidorina:30, geodude:74, porygon:137, aerodactyl:142, magnemite:81, charmander:4,
      squirtle:7, charmeleon:5, wartortle:8, charizard:6, oddish:43, gloom:44, vileplume:45,
      bellsprout:69, weepinbell:70, victreebel:71,
    };
    if (dexLookup[species] === dex) { pkIdx = parseInt(k); break; }
  }
  if (pkIdx === null) continue;
  
  const lines = data.split('\n');
  let inMoves = false;
  const moves = [];
  for (const line of lines) {
    const t = line.trim();
    if (t === 'db 0') { if (!inMoves) { inMoves = true; continue; } else break; }
    if (inMoves) {
      const m2 = t.match(/db\s+(\d+),\s*(\w+)/);
      if (m2) {
        const lvl = parseInt(m2[1]);
        const mv = MOVE_NAMES[m2[2]];
        if (mv && lvl > 1) moves.push(`{ level: ${lvl}, move: MOVES.${mv} }`);
      }
    }
  }
  if (moves.length > 0) learnsets[pkIdx] = moves;
}

// Write as a txt file for manual pasting
let out = 'export const LEARNSET_DATABASE: Record<string, { level: number; move: Move }[]> = {\n';
for (const [k, v] of Object.entries(learnsets).sort(([a],[b])=>parseInt(a)-parseInt(b))) {
  out += `  ${k}: [${v.join(', ')}],\n`;
}
out += '};\n';

mkdirSync(join(ROOT, 'scripts/out'), {recursive:true});
writeFileSync(join(ROOT, 'scripts/out/learnset_db_typed.ts'), out);
console.log(`Learnset database: ${Object.keys(learnsets).length} species`);
