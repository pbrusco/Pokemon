import { Move, Pokemon, InventoryItem, PokemonSummary } from './types';

export const MOVES: Record<string, Move> = {
  TACKLE: { name: 'PLACAJE', type: 'normal', power: 40, accuracy: 100 },
  THUNDERSHOCK: { name: 'IMPACTRUENO', type: 'electric', power: 40, accuracy: 100, statusEffect: 'paralyzed', statusChance: 10 },
  SCRATCH: { name: 'ARAÑAZO', type: 'normal', power: 40, accuracy: 100 },
  GROWL: { name: 'GRUÑIDO', type: 'normal', power: 0, accuracy: 100 },
  GUST: { name: 'TORNADO', type: 'flying', power: 40, accuracy: 100 },
  STRING_SHOT: { name: 'DISP. SEDA', type: 'bug', power: 0, accuracy: 95, statusEffect: 'paralyzed', statusChance: 30 },
  PECK: { name: 'PICOTAZO', type: 'flying', power: 35, accuracy: 100 },
  EMBER: { name: 'ASCUAS', type: 'fire', power: 40, accuracy: 100, statusEffect: 'burn', statusChance: 10 },
  WATER_GUN: { name: 'PISTOLA AGUA', type: 'water', power: 40, accuracy: 100 },
  VINE_WHIP: { name: 'LATIGO CEPA', type: 'grass', power: 45, accuracy: 100 },
  POISON_POWDER: { name: 'POLVO VENENO', type: 'poison', power: 0, accuracy: 75, statusEffect: 'poison', statusChance: 100 },
  SLEEP_POWDER: { name: 'SOMNÍFERO', type: 'grass', power: 0, accuracy: 75, statusEffect: 'sleep', statusChance: 100 },
  ROCK_THROW: { name: 'LANZARROCAS', type: 'rock', power: 50, accuracy: 90 },
  HARDEN: { name: 'FORTALEZA', type: 'normal', power: 0, accuracy: 100 },
};

export const STARTERS: Pokemon[] = [
  { 
    id: 'bulbasaur', name: 'BULBASAUR', level: 5, hp: 20, maxHp: 20, type: 'grass', moves: [MOVES.TACKLE, MOVES.GROWL], sprite: '🍃', exp: 0, expToNextLevel: 100, evolutionLevel: 16, evolvesTo: 'ivysaur',
    movesToLearn: [{ level: 7, move: MOVES.VINE_WHIP }, { level: 13, move: MOVES.POISON_POWDER }]
  },
  { 
    id: 'charmander', name: 'CHARMANDER', level: 5, hp: 19, maxHp: 19, type: 'fire', moves: [MOVES.SCRATCH, MOVES.GROWL], sprite: '🔥', exp: 0, expToNextLevel: 100, evolutionLevel: 16, evolvesTo: 'charmeleon',
    movesToLearn: [{ level: 7, move: MOVES.EMBER }]
  },
  { 
    id: 'squirtle', name: 'SQUIRTLE', level: 5, hp: 21, maxHp: 21, type: 'water', moves: [MOVES.TACKLE, MOVES.GROWL], sprite: '💧', exp: 0, expToNextLevel: 100, evolutionLevel: 16, evolvesTo: 'wartortle',
    movesToLearn: [{ level: 7, move: MOVES.WATER_GUN }]
  },
];

export const ITEMS_DATABASE: Record<string, InventoryItem> = {
  OAK_PARCEL: { id: 'OAK_PARCEL', name: 'PAQUETE OAK', description: 'Un paquete para el Prof. Oak.', icon: '📦', type: 'key_item' },
  POTION: { id: 'POTION', name: 'POCIÓN', description: 'Restaura 20 PS de un Pokémon.', icon: '🧪', type: 'potion' },
  POKEBALL: { id: 'POKEBALL', name: 'POKÉ BALL', description: 'Sirve para atrapar Pokémon salvajes.', icon: '🔴', type: 'pokeball' },
};

export const POKEMON_LIST: PokemonSummary[] = [
  { id: 'bulbasaur', name: 'Bulbasaur', sprite: '🍃' },
  { id: 'charmander', name: 'Charmander', sprite: '🔥' },
  { id: 'squirtle', name: 'Squirtle', sprite: '💧' },
  { id: 'pidgey', name: 'Pidgey', sprite: '🐦' },
  { id: 'rattata', name: 'Rattata', sprite: '🐭' },
  { id: 'caterpie', name: 'Caterpie', sprite: '🐛' },
  { id: 'weedle', name: 'Weedle', sprite: '🐝' },
  { id: 'pikachu', name: 'Pikachu', sprite: '⚡' },
  { id: 'geodude', name: 'Geodude', sprite: '🌑' },
  { id: 'onix', name: 'Onix', sprite: '🪨' },
];

export const EVOLUTIONS: Record<string, Partial<Pokemon>> = {
  ivysaur: { name: 'IVYSAUR', sprite: '🌿', evolutionLevel: 32, evolvesTo: 'venusaur' },
  venusaur: { name: 'VENUSAUR', sprite: '🌳' },
  charmeleon: { name: 'CHARMELEON', sprite: '🦖', evolutionLevel: 36, evolvesTo: 'charizard' },
  charizard: { name: 'CHARIZARD', sprite: '🐉' },
  wartortle: { name: 'WARTORTLE', sprite: '🐢', evolutionLevel: 36, evolvesTo: 'blastoise' },
  blastoise: { name: 'BLASTOISE', sprite: '🛡️' },
};

export const WILD_POKEMON_DATABASE: Record<string, Pokemon[]> = {
  ROUTE_1: [
    { id: 'pidgey', name: 'PIDGEY', level: 3, hp: 16, maxHp: 16, type: 'flying', moves: [MOVES.TACKLE, MOVES.GUST], sprite: '🐦', exp: 0, expToNextLevel: 60 },
    { id: 'rattata', name: 'RATTATA', level: 3, hp: 15, maxHp: 15, type: 'normal', moves: [MOVES.TACKLE, MOVES.SCRATCH], sprite: '🐭', exp: 0, expToNextLevel: 60 },
    { id: 'caterpie', name: 'CATERPIE', level: 2, hp: 14, maxHp: 14, type: 'bug', moves: [MOVES.TACKLE, MOVES.STRING_SHOT], sprite: '🐛', exp: 0, expToNextLevel: 40 },
    { id: 'weedle', name: 'WEEDLE', level: 2, hp: 14, maxHp: 14, type: 'bug', moves: [MOVES.TACKLE, MOVES.STRING_SHOT], sprite: '🐝', exp: 0, expToNextLevel: 40 },
    { id: 'spearow', name: 'SPEAROW', level: 4, hp: 18, maxHp: 18, type: 'flying', moves: [MOVES.PECK, MOVES.GROWL], sprite: '🦅', exp: 0, expToNextLevel: 80 },
    { id: 'mankey', name: 'MANKEY', level: 4, hp: 22, maxHp: 22, type: 'fighting', moves: [MOVES.SCRATCH, MOVES.TACKLE], sprite: '🐒', exp: 0, expToNextLevel: 80 },
    { id: 'pikachu', name: 'PIKACHU', level: 5, hp: 25, maxHp: 25, type: 'electric', moves: [MOVES.THUNDERSHOCK, MOVES.GROWL], sprite: '⚡', exp: 0, expToNextLevel: 100 },
  ],
  VIRIDIAN_FOREST: [
    { id: 'caterpie', name: 'CATERPIE', level: 3, hp: 16, maxHp: 16, type: 'bug', moves: [MOVES.TACKLE, MOVES.STRING_SHOT], sprite: '🐛', exp: 0, expToNextLevel: 60 },
    { id: 'weedle', name: 'WEEDLE', level: 3, hp: 16, maxHp: 16, type: 'bug', moves: [MOVES.TACKLE, MOVES.STRING_SHOT], sprite: '🐝', exp: 0, expToNextLevel: 60 },
    { id: 'metapod', name: 'METAPOD', level: 5, hp: 22, maxHp: 22, type: 'bug', moves: [MOVES.HARDEN], sprite: '蛹', exp: 0, expToNextLevel: 100 },
    { id: 'pikachu', name: 'PIKACHU', level: 5, hp: 25, maxHp: 25, type: 'electric', moves: [MOVES.THUNDERSHOCK, MOVES.GROWL], sprite: '⚡', exp: 0, expToNextLevel: 100 },
  ]
};
