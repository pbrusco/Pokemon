#!/usr/bin/env node
/**
 * Extract pokered learnsets (evos_moves.asm) and generate movesToLearn arrays
 * for our Pokemon definitions in constants.ts.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = '/Users/pbrusco/projects/poke';
const EVOS = readFileSync(join(ROOT, 'pokered_dissasembly/data/pokemon/evos_moves.asm'), 'utf8');

// pokered species index → our id
const SPECIES_MAP = [
  null,
  'rhydon','kangaskhan','nidoran-m','clefairy','spearow','voltorb',
  'nidoking','slowbro','ivysaur','exeggutor','lickitung','exeggcute',
  'grimer','gengar','nidoran-f','nidoqueen','cubone','rhyhorn','lapras',
  'arcanine','mew','gyarados','shellder','tentacool','gastly','scyther',
  'staryu','blastoise','pinsir','tangela',
  null,null, // MissingNo
  'growlithe','onix','fearow','pidgey','slowpoke','kadabra','graveler',
  'chansey','machoke','mr-mime','hitmonlee','hitmonchan','arbok','parasect',
  'psyduck','drowzee','golem',null,'magmar',
  null,'electabuzz','magneton','koffing',null,'mankey','seel','diglett',
  'tauros',null,null,null,
  'farfetchd','venonat','dragonite',null,null,null,
  'doduo','poliwag','jynx','moltres','articuno','zapdos','ditto','meowth',
  'krabby',null,null,null,
  'vulpix','ninetales','pikachu','raichu',null,null,
  'dratini','dragonair','kabuto','kabutops','horsea','seadra',null,null,
  'sandshrew','sandslash','omanyte','omastar','jigglypuff','wigglytuff',
  'eevee','flareon','jolteon','vaporeon','machop','zubat','ekans','paras',
  'poliwhirl','poliwrath','weedle','kakuna','beedrill',null,
  'dodrio','primeape','dugtrio','venomoth','dewgong',null,null,
  'caterpie','metapod','butterfree','machamp',null,
  'golduck','hypno','golbat','mewtwo','snorlax','magikarp',null,null,
  'muk',null,'kingler','cloyster',null,'electrode','clefable',
  'weezing','persian','marowak',null,
  'haunter','abra','alakazam','pidgeotto','pidgeot','starmie','bulbasaur',
  'venusaur','tentacruel',null,'goldeen','seaking',null,null,null,null,
  'ponyta','rapidash','rattata','raticate','nidorino','nidorina','geodude',
  'porygon','aerodactyl',null,'magnemite',null,null,
  'charmander','squirtle','charmeleon','wartortle','charizard',
  null,null,null,null,
  'oddish','gloom','vileplume','bellsprout','weepinbell','victreebel',
];

// Move name mapping
const MOVE_NAMES = {
  POUND:'POUND', KARATE_CHOP:'KARATE_CHOP', DOUBLESLAP:'DOUBLESLAP',
  COMET_PUNCH:'COMET_PUNCH', MEGA_PUNCH:'MEGA_PUNCH', PAY_DAY:'PAY_DAY',
  FIRE_PUNCH:'FIRE_PUNCH', ICE_PUNCH:'ICE_PUNCH', THUNDERPUNCH:'THUNDERPUNCH',
  SCRATCH:'SCRATCH', VICEGRIP:'VICEGRIP', GUILLOTINE:'GUILLOTINE',
  RAZOR_WIND:'RAZOR_WIND', SWORDS_DANCE:'SWORDS_DANCE', CUT:'CUT',
  GUST:'GUST', WING_ATTACK:'WING_ATTACK', WHIRLWIND:'WHIRLWIND', FLY:'FLY',
  BIND:'BIND', SLAM:'SLAM', VINE_WHIP:'VINE_WHIP', STOMP:'STOMP',
  DOUBLE_KICK:'DOUBLE_KICK', MEGA_KICK:'MEGA_KICK', JUMP_KICK:'JUMP_KICK',
  ROLLING_KICK:'ROLLING_KICK', SAND_ATTACK:'SAND_ATTACK', HEADBUTT:'HEADBUTT',
  HORN_ATTACK:'HORN_ATTACK', FURY_ATTACK:'FURY_ATTACK', HORN_DRILL:'HORN_DRILL',
  TACKLE:'TACKLE', BODY_SLAM:'BODY_SLAM', WRAP:'WRAP', TAKE_DOWN:'TAKE_DOWN',
  THRASH:'THRASH', DOUBLE_EDGE:'DOUBLE_EDGE', TAIL_WHIP:'TAIL_WHIP',
  POISON_STING:'POISON_STING', TWINEEDLE:'TWINEEDLE', PIN_MISSILE:'PIN_MISSILE',
  LEER:'LEER', BITE:'BITE', GROWL:'GROWL', ROAR:'ROAR', SING:'SING',
  SUPERSONIC:'SUPERSONIC', SONICBOOM:'SONICBOOM', DISABLE:'DISABLE',
  ACID:'ACID', EMBER:'EMBER', FLAMETHROWER:'FLAMETHROWER', MIST:'MIST',
  WATER_GUN:'WATER_GUN', HYDRO_PUMP:'HYDRO_PUMP', SURF:'SURF', ICE_BEAM:'ICE_BEAM',
  BLIZZARD:'BLIZZARD', PSYBEAM:'PSYBEAM', BUBBLEBEAM:'BUBBLEBEAM',
  AURORA_BEAM:'AURORA_BEAM', HYPER_BEAM:'HYPER_BEAM', PECK:'PECK',
  DRILL_PECK:'DRILL_PECK', SUBMISSION:'SUBMISSION', LOW_KICK:'LOW_KICK',
  COUNTER:'COUNTER', SEISMIC_TOSS:'SEISMIC_TOSS', STRENGTH:'STRENGTH',
  ABSORB:'ABSORB', MEGA_DRAIN:'MEGA_DRAIN', LEECH_SEED:'LEECH_SEED',
  GROWTH:'GROWTH', RAZOR_LEAF:'RAZOR_LEAF', SOLARBEAM:'SOLAR_BEAM',
  POISONPOWDER:'POISON_POWDER', STUN_SPORE:'STUN_SPORE',
  SLEEP_POWDER:'SLEEP_POWDER', PETAL_DANCE:'PETAL_DANCE',
  STRING_SHOT:'STRING_SHOT', DRAGON_RAGE:'DRAGON_RAGE', FIRE_SPIN:'FIRE_SPIN',
  THUNDERSHOCK:'THUNDERSHOCK', THUNDERBOLT:'THUNDERBOLT',
  THUNDER_WAVE:'THUNDER_WAVE', THUNDER:'THUNDER', ROCK_THROW:'ROCK_THROW',
  EARTHQUAKE:'EARTHQUAKE', FISSURE:'FISSURE', DIG:'DIG', TOXIC:'TOXIC',
  CONFUSION:'CONFUSION', PSYCHIC:'PSYCHIC', HYPNOSIS:'HYPNOSIS',
  MEDITATE:'MEDITATE', AGILITY:'AGILITY', QUICK_ATTACK:'QUICK_ATTACK',
  RAGE:'RAGE', TELEPORT:'TELEPORT', NIGHT_SHADE:'NIGHT_SHADE', MIMIC:'MIMIC',
  SCREECH:'SCREECH', DOUBLE_TEAM:'DOUBLE_TEAM', RECOVER:'RECOVER',
  HARDEN:'HARDEN', MINIMIZE:'MINIMIZE', SMOKESCREEN:'SMOKESCREEN',
  CONFUSE_RAY:'CONFUSE_RAY', WITHDRAW:'WITHDRAW', DEFENSE_CURL:'DEFENSE_CURL',
  BARRIER:'BARRIER', LIGHT_SCREEN:'LIGHT_SCREEN', HAZE:'HAZE',
  REFLECT:'REFLECT', FOCUS_ENERGY:'FOCUS_ENERGY', BIDE:'BIDE',
  METRONOME:'METRONOME', MIRROR_MOVE:'MIRROR_MOVE',
  SELFDESTRUCT:'SELFDESTRUCT', EGG_BOMB:'EGG_BOMB', LICK:'LICK', SMOG:'SMOG',
  SLUDGE:'SLUDGE', BONE_CLUB:'BONE_CLUB', FIRE_BLAST:'FIRE_BLAST',
  WATERFALL:'WATERFALL', CLAMP:'CLAMP', SWIFT:'SWIFT', SKULL_BASH:'SKULL_BASH',
  SPIKE_CANNON:'SPIKE_CANNON', CONSTRICT:'CONSTRICT', AMNESIA:'AMNESIA',
  KINESIS:'KINESIS', SOFTBOILED:'SOFTBOILED', HI_JUMP_KICK:'HI_JUMP_KICK',
  GLARE:'GLARE', DREAM_EATER:'DREAM_EATER', POISON_GAS:'POISON_GAS',
  BARRAGE:'BARRAGE', LEECH_LIFE:'LEECH_LIFE', LOVELY_KISS:'LOVELY_KISS',
  SKY_ATTACK:'SKY_ATTACK', TRANSFORM:'TRANSFORM', BUBBLE:'BUBBLE',
  DIZZY_PUNCH:'DIZZY_PUNCH', SPORE:'SPORE', FLASH:'FLASH', PSYWAVE:'PSYWAVE',
  SPLASH:'SPLASH', ACID_ARMOR:'ACID_ARMOR', CRABHAMMER:'CRABHAMMER',
  EXPLOSION:'EXPLOSION', FURY_SWIPES:'FURY_SWIPES', BONEMERANG:'BONEMERANG',
  REST:'REST', ROCK_SLIDE:'ROCK_SLIDE', HYPER_FANG:'HYPER_FANG',
  SHARPEN:'SHARPEN', CONVERSION:'CONVERSION', TRI_ATTACK:'TRI_ATTACK',
  SUPER_FANG:'SUPER_FANG', SLASH:'SLASH', SUBSTITUTE:'SUBSTITUTE',
};

function resolvePokeredMove(moveName) {
  return MOVE_NAMES[moveName] || null;
}

// Parse sections
const sections = {};
const re = /(\w+EvosMoves):\n([\s\S]*?)(?=\n\w+EvosMoves:|\n\w+:|\n\w+$|$)/g;
let m;
while ((m = re.exec(EVOS)) !== null) {
  sections[m[1]] = m[2];
}

// Parse each section for learnset
const learnsets = {};
for (const [label, data] of Object.entries(sections)) {
  const speciesName = label.replace('EvosMoves', '');
  const idx = SPECIES_MAP.indexOf(speciesName.toLowerCase().replace(/♀/,'-f').replace(/♂/,'-m'));
  if (idx === -1) continue;

  // Skip evo lines, find moves
  const lines = data.split('\n');
  let inMoves = false;
  const moves = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'db 0') {
      if (!inMoves) { inMoves = true; continue; }
      else break;
    }
    if (inMoves) {
      const moveMatch = trimmed.match(/db\s+(\d+),\s*(\w+)/);
      if (moveMatch) {
        const lvl = parseInt(moveMatch[1]);
        const mv = resolvePokeredMove(moveMatch[2]);
        if (mv && lvl > 1) moves.push({ level: lvl, move: mv });
      }
    }
  }
  if (moves.length > 0) learnsets[idx] = moves;
}

// Generate TS code
let out = [];
for (let i = 1; i <= 151; i++) {
  const moves = learnsets[i] || [];
  if (moves.length === 0) continue;
  out.push(`  ${i}: [${moves.map(m => `{ level: ${m.level}, move: MOVES.${m.move} }`).join(', ')}],`);
}

writeFileSync(join(ROOT, 'scripts/out/learnsets.txt'), out.join('\n'));
console.log(`Generated learnsets for ${Object.keys(learnsets).length} species`);
console.log('Written to scripts/out/learnsets.txt');
