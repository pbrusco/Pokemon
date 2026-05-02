#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = '/Users/pbrusco/projects/poke';
const src = readFileSync(join(ROOT, 'src/data/npcDatabase.ts'), 'utf8');

// Route 9 zone: O = { x: 255, y: 12 }
// Route 16 zone: O = { x: 109, y: 66 }

// These are all trainers we know are missing from our DB.
// Format: [id, name, zone, lx, ly, trainerClass, party data]
const entries = [
  // ── Route 9 (8 missing) ──
  `{ id: 'jrtrainerf_kanto_overworld_8', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_9', 13, 10), direction: 'left', trainerClass: 'cooltrainer_f', dialogue: ['¡Prepárate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('oddish', 'ODDISH', 18, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 43, { types: ['grass', 'poison'] }), makePokemon('bellsprout', 'BELLSPROUT', 18, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 69, { types: ['grass', 'poison'] }), makePokemon('oddish', 'ODDISH', 18, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 43, { types: ['grass', 'poison'] }), makePokemon('bellsprout', 'BELLSPROUT', 18, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 69, { types: ['grass', 'poison'] })] }`,
  `{ id: 'jrtrainerm_kanto_overworld_9', name: 'ENTRENADOR', type: 'npc', position: w('ROUTE_9', 24, 7), direction: 'left', trainerClass: 'cooltrainer_m', dialogue: ['¡Prepárate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('growlithe', 'GROWLITHE', 21, 'fire', [MOVES.EMBER, MOVES.TACKLE], 58), makePokemon('charmander', 'CHARMANDER', 21, 'fire', [MOVES.EMBER, MOVES.TACKLE], 4)] }`,
  `{ id: 'jrtrainerm_kanto_overworld_10', name: 'ENTRENADOR', type: 'npc', position: w('ROUTE_9', 31, 7), direction: 'right', trainerClass: 'cooltrainer_m', dialogue: ['¡Prepárate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 19, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('diglett', 'DIGLETT', 19, 'ground', [MOVES.DIG, MOVES.TACKLE], 50), makePokemon('ekans', 'EKANS', 19, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 23), makePokemon('sandshrew', 'SANDSHREW', 19, 'ground', [MOVES.DIG, MOVES.TACKLE], 27)] }`,
  `{ id: 'jrtrainerf_kanto_overworld_9', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_9', 48, 8), direction: 'right', trainerClass: 'cooltrainer_f', dialogue: ['¡Prepárate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('meowth', 'MEOWTH', 23, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 52)] }`,
  `{ id: 'hiker_kanto_overworld_8', name: 'MONTAÑERO', type: 'npc', position: w('ROUTE_9', 43, 3), direction: 'left', trainerClass: 'hiker', dialogue: ['¡Prepárate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 21, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('onix', 'ONIX', 21, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 95, { types: ['rock', 'ground'] })] }`,
  `{ id: 'bugcatcher_kanto_overworld_15', name: 'CAZABICHOS', type: 'npc', position: w('ROUTE_9', 22, 2), direction: 'down', trainerClass: 'bugcatcher', dialogue: ['¡Prepárate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('beedrill', 'BEEDRILL', 19, 'bug', [MOVES.POISON_POWDER, MOVES.TACKLE], 15, { types: ['bug', 'poison'] }), makePokemon('beedrill', 'BEEDRILL', 19, 'bug', [MOVES.POISON_POWDER, MOVES.TACKLE], 15, { types: ['bug', 'poison'] })] }`,
  `{ id: 'hiker_kanto_overworld_9', name: 'MONTAÑERO', type: 'npc', position: w('ROUTE_9', 45, 15), direction: 'right', trainerClass: 'hiker', dialogue: ['¡Prepárate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 21, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('onix', 'ONIX', 21, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 95, { types: ['rock', 'ground'] })] }`,
  `{ id: 'bugcatcher_kanto_overworld_16', name: 'CAZABICHOS', type: 'npc', position: w('ROUTE_9', 40, 8), direction: 'right', trainerClass: 'bugcatcher', dialogue: ['¡Prepárate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('caterpie', 'CATERPIE', 20, 'bug', [MOVES.STRING_SHOT, MOVES.TACKLE], 10), makePokemon('weedle', 'WEEDLE', 20, 'bug', [MOVES.POISON_POWDER, MOVES.TACKLE], 13, { types: ['bug', 'poison'] }), makePokemon('venonat', 'VENONAT', 20, 'bug', [MOVES.POISON_POWDER, MOVES.TACKLE], 48, { types: ['bug', 'poison'] })] }`,

  // ── Route 16 (3 missing) ──
  `{ id: 'cueball_kanto_overworld_9', name: 'GOLFO', type: 'npc', position: w('ROUTE_16', 11, 12), direction: 'up', trainerClass: 'gambler', dialogue: ['¡Prepárate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('mankey', 'MANKEY', 29, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 56), makePokemon('machop', 'MACHOP', 29, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 66)] }`,
  `{ id: 'biker_kanto_overworld_15', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_16', 9, 11), direction: 'left', trainerClass: 'biker', dialogue: ['¡Prepárate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('weezing', 'WEEZING', 33, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 110)] }`,
  `{ id: 'biker_kanto_overworld_16', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_16', 3, 12), direction: 'right', trainerClass: 'biker', dialogue: ['¡Prepárate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('grimer', 'GRIMER', 26, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 88), makePokemon('grimer', 'GRIMER', 26, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 88), makePokemon('grimer', 'GRIMER', 26, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 88), makePokemon('grimer', 'GRIMER', 26, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 88)] }`,
];

// Insert these right after the existing Route 9 trainer (hiker_kanto_overworld_10)
const insertAfter = `hiker_kanto_overworld_10`;
const idx = src.indexOf(insertAfter);
if (idx === -1) { console.log('Insert point not found'); process.exit(1); }

// Find the end of this entry (next ']' or beginning of next zone)
const endOfLine = src.indexOf('\n', idx);
const after = src.substring(endOfLine + 1);

// Find where Route 10 section starts (to put entries before it)
// Actually let's just insert right after the Route 9 hiker entry
const before = src.substring(0, endOfLine + 1);

// Add marker comment and entries
const insertBlock = '\n' + 
  '      // ── Route 9/16 gap fillers ──\n      ' +
  entries.join('\n      ') + '\n';

const result = before + insertBlock + after;
writeFileSync(join(ROOT, 'src/data/npcDatabase.ts'), result);
console.log(`Added ${entries.length} trainer entries`);
