import { MOVES, STARTERS, makePokemon } from '../constants';
import { type NPC, type Entity, type MapID, type Direction, type Pokemon, type Position } from '../types';

// ─── Kanto zone offsets in the unified KANTO_OVERWORLD map ───────────────────
// Derived from scripts/stitch-kanto.mjs output.
// Format: top-left corner of each segment in world tile coordinates.
export const O = {
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
  ROUTE_19:        { x: 118, y: 251 },
  ROUTE_20:        { x:  19, y: 300 },
  CINNABAR_ISLAND: { x:   0, y: 300 },
  ROUTE_21:        { x:   0, y: 211 },
  CELADON_CITY:    { x: 148, y:  61 },
  ROUTE_16:        { x: 109, y:  66 },
  ROUTE_17:        { x: 109, y:  83 },
  ROUTE_18:        { x: 109, y: 226 },
  ROUTE_22:        { x: 618, y: 396 },
  ROUTE_23:        { x: 608, y: 257 },
  INDIGO_PLATEAU:  { x: 608, y: 240 },
  ROUTE_24:        { x: 618, y: 596 },
  ROUTE_25:        { x: 637, y: 596 },
};

/** Translate a local (x,y) position within a named zone to world coords. */
function w(zone: keyof typeof O, lx: number, ly: number): Position {
  return { x: O[zone].x + lx, y: O[zone].y + ly };
}

export function buildNPCDatabase(
  playerTeam: Pokemon[],
  hasParcel: boolean,
  hasPokedex: boolean,
  _badges: string[],
  storyStep: string = 'START',
  oakCutscenePos: Position | null = null,
  oakCutsceneDir: Direction | null = null,
  hasSilphScope: boolean = false,
  hasPokeFlute: boolean = false,
  hasSsTicket: boolean = false,
  clearedSnorlax: string[] = []
): Record<MapID, NPC[]> {
  return {
    // ── Unified outdoor map ──────────────────────────────────────────────────
    KANTO_OVERWORLD: [
      // ── Pallet Town ──
      ...(playerTeam.length === 0 ? [{
        id: 'oak_pallet',
        name: 'PROF. OAK',
        type: 'npc' as const,
        position: oakCutscenePos || w('PALLET_TOWN', 12, 10),
        direction: oakCutsceneDir || ('down' as const),
        trainerClass: 'oak',
        dialogue: ["¡Espera! ¡No vayas por ahí!", "¡Es peligroso ir solo por la hierba alta!", "Ven conmigo a mi laboratorio."]
      }] : []),
      { id: 'girl_pallet', name: 'CHICA', type: 'npc', position: w('PALLET_TOWN', 8, 12), direction: 'right', trainerClass: 'lass', dialogue: ["¡Yo también entreno POKÉMON!", "¡Cuando crezca, seré una gran entrenadora!"] },
      { id: 'fat_man', name: 'PESCADOR', type: 'npc', position: w('PALLET_TOWN', 10, 17), direction: 'left', trainerClass: 'fisher', dialogue: ["¡La tecnología es increíble!", "¡Ahora puedes guardar POKÉMON y objetos como datos en el PC!"] },
      // ── Route 1 ──
      { id: 'youngster_rt1_1', name: 'JOVEN', type: 'npc', position: w('ROUTE_1', 10, 15), direction: 'down', trainerClass: 'youngster', dialogue: ["¡Si te caes por un saliente, podrás volver rápidamente a PUEBLO PALETA!"] },
      { id: 'youngster_rt1_2', name: 'JOVEN', type: 'npc', position: w('ROUTE_1', 15, 13), direction: 'left', trainerClass: 'youngster', dialogue: ["¿Ves esas zonas de hierba alta?", "¡Ahí es donde aparecen los POKÉMON salvajes!"] },
      // ── Viridian City ──
      { id: 'viridian_youngster1', name: 'JOVEN', type: 'npc', position: w('VIRIDIAN_CITY', 13, 20), direction: 'down', trainerClass: 'youngster', dialogue: ["¡Esas POKÉ BALL que llevas en el cinturón son POKÉMON!", "¡Es genial poder llevarlos contigo!"] },
      { id: 'viridian_gambler1', name: 'GOLFO', type: 'npc', position: w('VIRIDIAN_CITY', 30, 8), direction: 'down', trainerClass: 'gambler', dialogue: ["¡Este GIMNASIO POKÉMON siempre está cerrado!", "Me pregunto quién será el LÍDER..."] },
      { id: 'viridian_youngster2', name: 'JOVEN', type: 'npc', position: w('VIRIDIAN_CITY', 32, 25), direction: 'down', trainerClass: 'youngster', dialogue: ["¿Quieres saber algo sobre el TÚNEL ROCA?", "¡Está lleno de POKÉMON salvajes!"] },
      {
        id: 'viridian_girl', name: 'CHICA', type: 'npc', position: w('VIRIDIAN_CITY', 17, 9), direction: 'right', trainerClass: 'lass',
        dialogue: hasPokedex
          ? ["¡El abuelo ya se despertó y se quitó del camino!", "¡Ahora podemos ir al norte!"]
          : ["¡Ese abuelo está durmiendo en medio del camino!", "¡No nos deja pasar!"]
      },
      ...(!hasPokedex ? [{ id: 'viridian_oldman_sleepy', name: 'ABUELO', type: 'npc' as const, position: w('VIRIDIAN_CITY', 18, 9), direction: 'down' as Direction, trainerClass: 'old_man', dialogue: ["Zzzzz... No me molestes...", "Aún no me he tomado el café..."] }] : []),
      { id: 'viridian_fisher', name: 'PESCADOR', type: 'npc', position: w('VIRIDIAN_CITY', 6, 23), direction: 'down', trainerClass: 'fisher', dialogue: ["¡He pescado un POKÉMON increíble!", "¡Pero se me escapó!"] },
      ...(hasPokedex ? [{ id: 'viridian_oldman', name: 'ABUELO', type: 'npc' as const, position: w('VIRIDIAN_CITY', 17, 5), direction: 'down' as Direction, trainerClass: 'old_man', dialogue: ["¡He tomado mi café y ahora me siento de maravilla!", "¡Por supuesto que puedes pasar!"] }] : []),
      // ── Route 2 ──
      { id: 'bug_catcher_rt2', name: 'CAZABICHOS TOMY', type: 'npc', position: w('ROUTE_2', 3, 12), direction: 'right', trainerClass: 'bugcatcher', dialogue: ["¡Atrapé estos bichos en el Bosque Verde!"], isTrainer: true, trainerTeam: [makePokemon('caterpie', 'CATERPIE', 4, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10), makePokemon('weedle', 'WEEDLE', 4, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] })] },
      // ── Viridian Forest ──
      { id: 'lass_forest', name: 'CHICA LILA', type: 'npc', position: w('VIRIDIAN_FOREST', 13, 31), direction: 'right' as Direction, trainerClass: 'lass', dialogue: ["¡Mis NIDORAN son preciosos!", "¡Pero también muerden!"], isTrainer: true, trainerTeam: [makePokemon('nidoran-f', 'NIDORAN♀', 6, 'poison', [MOVES.TACKLE, MOVES.GROWL], 29, { types: ['poison'] }), makePokemon('nidoran-f', 'NIDORAN♀', 6, 'poison', [MOVES.TACKLE, MOVES.GROWL], 29, { types: ['poison'] })] },
      { id: 'bug_catcher_forest_2', name: 'CAZABICHOS DOUG', type: 'npc', position: w('VIRIDIAN_FOREST', 19, 18), direction: 'left' as Direction, trainerClass: 'bugcatcher', dialogue: ["¡Mis CATERPIE son los más obedientes!"], isTrainer: true, trainerTeam: [makePokemon('caterpie', 'CATERPIE', 7, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10), makePokemon('caterpie', 'CATERPIE', 7, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10)] },
      { id: 'bug_catcher_forest_3', name: 'CAZABICHOS SAMI', type: 'npc', position: w('VIRIDIAN_FOREST', 23, 14), direction: 'down', trainerClass: 'bugcatcher', dialogue: ["¡Tengo un ejército de bichos!", "¡Prepárate!"], isTrainer: true, trainerTeam: [makePokemon('metapod', 'METAPOD', 6, 'bug', [MOVES.HARDEN, MOVES.TACKLE], 11), makePokemon('caterpie', 'CATERPIE', 6, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10), makePokemon('metapod', 'METAPOD', 6, 'bug', [MOVES.HARDEN, MOVES.TACKLE], 11)] },
      { id: 'bug_catcher_forest', name: 'CAZABICHOS RICKY', type: 'npc', position: w('VIRIDIAN_FOREST', 14, 16), direction: 'down', trainerClass: 'bugcatcher', dialogue: ["¡Mi POKÉMON bicho es el más fuerte!", "¡No podrás pasar de aquí!"], isTrainer: true, trainerTeam: [makePokemon('caterpie', 'CATERPIE', 9, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10), makePokemon('metapod', 'METAPOD', 9, 'bug', [MOVES.HARDEN, MOVES.TACKLE], 11)] },
      // ── Pewter City ──
      { id: 'pewter_cooltrainer_f', name: 'ENTRENADORA', type: 'npc', position: w('PEWTER_CITY', 8, 15), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ["¡BROCK es el mejor entrenador!", "¡Sus POKÉMON de roca son súper duros!"] },
      { id: 'pewter_cooltrainer_m', name: 'ENTRENADOR', type: 'npc', position: w('PEWTER_CITY', 17, 25), direction: 'down', trainerClass: 'cooltrainer_m', dialogue: ["¿Eres un entrenador? ¡Se nota en tu mirada!", "¡Deberías ir al GIMNASIO de BROCK!"] },
      { id: 'pewter_supernerd1', name: 'SABIONDO', type: 'npc', position: w('PEWTER_CITY', 27, 17), direction: 'down', trainerClass: 'supernerd', dialogue: ["¿Conoces el REPELENTE?", "¡Mantiene a los POKÉMON débiles alejados de ti!"] },
      { id: 'pewter_supernerd2', name: 'SABIONDO', type: 'npc', position: w('PEWTER_CITY', 26, 25), direction: 'left', trainerClass: 'supernerd', dialogue: ["¿Has visitado ya el MUSEO?", "¡Tienen fósiles de POKÉMON antiguos!"] },
      { id: 'pewter_youngster', name: 'JOVEN', type: 'npc', position: w('PEWTER_CITY', 35, 16), direction: 'down', trainerClass: 'youngster', dialogue: ["¿Sabías que CLEFAIRY vino de la Luna?", "¡Eso dicen en el MUSEO!"] },
      // ── Route 3 ──
      { id: 'bug_catcher_rt3', name: 'CAZABICHOS RICK', type: 'npc', position: w('ROUTE_3', 5, 6), direction: 'right' as Direction, trainerClass: 'bugcatcher', dialogue: ["¡Los bichos son los mejores POKÉMON!", "¡Te voy a demostrar que soy el mejor!"], isTrainer: true, trainerTeam: [makePokemon('weedle', 'WEEDLE', 10, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] }), makePokemon('caterpie', 'CATERPIE', 10, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10)] },
      { id: 'lass_rt3', name: 'CHICA JANICE', type: 'npc', position: w('ROUTE_3', 13, 11), direction: 'left' as Direction, trainerClass: 'lass', dialogue: ["¡Oye tú! ¡No pases por aquí sin luchar!", "¡Mis PIDGEY son adorables Y fuertes!"], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 11, 'flying', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('pidgey', 'PIDGEY', 11, 'flying', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] })] },
      { id: 'youngster_rt3', name: 'CHICO BEN', type: 'npc', position: w('ROUTE_3', 8, 14), direction: 'down' as Direction, trainerClass: 'youngster', dialogue: ["¡Llevo mis pantalones cortos todo el año!", "¡Eso me hace más fuerte!"], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 10, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19), makePokemon('ekans', 'EKANS', 10, 'poison', [MOVES.TACKLE, MOVES.GROWL], 23, { types: ['poison'] })] },
      { id: 'lass_rt3_2', name: 'CHICA HALEY', type: 'npc', position: w('ROUTE_3', 16, 7), direction: 'down' as Direction, trainerClass: 'lass', dialogue: ["¡Las flores son mis favoritas!", "¡Prepárate!"], isTrainer: true, trainerTeam: [makePokemon('oddish', 'ODDISH', 14, 'grass', [MOVES.POUND, MOVES.SLEEP_POWDER], 43, { types: ['grass', 'poison'] })] },
      // ── Route 4 ──
      { id: 'lass_rt4', name: 'CHICA CRINA', type: 'npc', position: w('ROUTE_4', 23, 3), direction: 'down', trainerClass: 'lass', dialogue: ['¡Tengo una POKÉDEX genial!'], isTrainer: true, trainerTeam: [makePokemon('paras', 'PARAS', 31, 'bug', [MOVES.SCRATCH, MOVES.STRING_SHOT], 46, { types: ['bug', 'grass'] }), makePokemon('paras', 'PARAS', 31, 'bug', [MOVES.SCRATCH, MOVES.STRING_SHOT], 46, { types: ['bug', 'grass'] }), makePokemon('parasect', 'PARASECT', 31, 'bug', [MOVES.SCRATCH, MOVES.STRING_SHOT], 47, { types: ['bug', 'grass'] })] },
      // ── Route 6 ──
      { id: 'cooltrainer_m_rt6', name: 'ENTRENADOR LIONEL', type: 'npc', position: w('ROUTE_6', 6, 21), direction: 'right', trainerClass: 'cooltrainer_m', dialogue: ['¡A ver quién es mejor!'], isTrainer: true, trainerTeam: [makePokemon('squirtle', 'SQUIRTLE', 20, 'water', [MOVES.TACKLE, MOVES.WATER_GUN], 7, { types: ['water'] })] },
      { id: 'youngster_rt6', name: 'CHICO RICKY', type: 'npc', position: w('ROUTE_6', 4, 14), direction: 'right', trainerClass: 'youngster', dialogue: ['¡Estoy investigando los bichos!'], isTrainer: true, trainerTeam: [makePokemon('weedle', 'WEEDLE', 16, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] }), makePokemon('caterpie', 'CATERPIE', 16, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10), makePokemon('weedle', 'WEEDLE', 16, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] })] },
      // ── Route 8 ──
      { id: 'cooltrainer_f_rt8', name: 'ENTRENADORA LOLA', type: 'npc', position: w('ROUTE_8', 18, 6), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['¡Tengo los mejores POKÉMON!'], isTrainer: true, trainerTeam: [makePokemon('meowth', 'MEOWTH', 24, 'normal', [MOVES.SCRATCH, MOVES.GROWL], 52), makePokemon('meowth', 'MEOWTH', 24, 'normal', [MOVES.SCRATCH, MOVES.GROWL], 52), makePokemon('meowth', 'MEOWTH', 24, 'normal', [MOVES.SCRATCH, MOVES.GROWL], 52)] },
      { id: 'cooltrainer_f_rt8_2', name: 'ENTRENADORA MIA', type: 'npc', position: w('ROUTE_8', 22, 6), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['¡Mis POKÉMON son irresistibles!'], isTrainer: true, trainerTeam: [makePokemon('clefairy', 'CLEFAIRY', 22, 'normal', [MOVES.POUND, MOVES.GROWL], 35), makePokemon('clefairy', 'CLEFAIRY', 22, 'normal', [MOVES.POUND, MOVES.GROWL], 35)] },
      // ── Route 10 ──
      { id: 'cooltrainer_f_rt10', name: 'ENTRENADORA CAROL', type: 'npc', position: w('ROUTE_10', 4, 7), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['¡Soy fuerte y hermosa!', '¡Una combinación mortal!'], isTrainer: true, trainerTeam: [makePokemon('pikachu', 'PIKACHU', 20, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 25, { types: ['electric'] }), makePokemon('clefairy', 'CLEFAIRY', 20, 'normal', [MOVES.POUND, MOVES.GROWL], 35)] },
      { id: 'cooltrainer_f_rt10_2', name: 'ENTRENADORA SANDRA', type: 'npc', position: w('ROUTE_10', 6, 7), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['¡Mis pájaros te vencerán!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 21, 'flying', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('pidgeotto', 'PIDGEOTTO', 21, 'flying', [MOVES.TACKLE, MOVES.GUST], 17, { types: ['normal', 'flying'] })] },
      // ── Route 11 ──
      { id: 'gambler_rt11', name: 'GOLFO YASU', type: 'npc', position: w('ROUTE_11', 12, 5), direction: 'down', trainerClass: 'gambler', dialogue: ['¡La vida es un juego!', '¡Y yo siempre gano!'], isTrainer: true, trainerTeam: [makePokemon('growlithe', 'GROWLITHE', 18, 'fire', [MOVES.EMBER, MOVES.TACKLE], 58, { types: ['fire'] }), makePokemon('vulpix', 'VULPIX', 18, 'fire', [MOVES.EMBER, MOVES.TACKLE], 37, { types: ['fire'] })] },
      // ── Route 12 / 16 Snorlax ──
      ...(!clearedSnorlax.includes('SNORLAX_12') ? [{
        id: 'snorlax_12', name: 'SNORLAX', type: 'npc' as const,
        position: w('ROUTE_12', 10, 2),
        direction: 'down' as Direction, trainerClass: 'snorlax',
        onInteract: 'wake_snorlax' as const,
        dialogue: ['...ZZZ...', '¡Está dormido profundamente! Necesitas la FLAUTA POKé.'],
      }] : []),
      ...(!clearedSnorlax.includes('SNORLAX_16') ? [{
        id: 'snorlax_16', name: 'SNORLAX', type: 'npc' as const,
        position: w('ROUTE_16', 1, 9),
        direction: 'down' as Direction, trainerClass: 'snorlax',
        onInteract: 'wake_snorlax' as const,
        dialogue: ['...ZZZ...', '¡Está dormido profundamente! Necesitas la FLAUTA POKé.'],
      }] : []),
      // ── Rival encounters ──
      { id: 'rival_route22', name: 'AZUL', type: 'npc', position: w('ROUTE_22', 12, 5), direction: 'down', trainerClass: 'rival', dialogue: ['¿Qué? ¿Ya tienes POKÉMON?', '¡Vamos a ver quién es más fuerte!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 9, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('squirtle', 'SQUIRTLE', 8, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 7)] },
      { id: 'rival_ss_anne', name: 'AZUL', type: 'npc', position: w('VERMILION_CITY', 28, 16), direction: 'down', trainerClass: 'rival', dialogue: ['¿Has venido a fardar de POKÉMON?', '¡Al menos te he ganado en el S.S. ANNE!'], isTrainer: true, trainerTeam: [makePokemon('pidgeotto', 'PIDGEOTTO', 19, 'flying', [MOVES.GUST, MOVES.TACKLE], 17, { types: ['normal', 'flying'] }), makePokemon('raticate', 'RATICATE', 16, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 20), makePokemon('kadabra', 'KADABRA', 18, 'psychic', [MOVES.CONFUSION, MOVES.TACKLE], 64), makePokemon('wartortle', 'WARTORTLE', 20, 'water', [MOVES.WATER_GUN, MOVES.BITE], 8)] },
      { id: 'rival_pokemon_tower', name: 'AZUL', type: 'npc', position: w('LAVENDER_TOWN', 17, 9), direction: 'down', trainerClass: 'rival', dialogue: ['¡No te metas en mis asuntos!', '¡Ya que insistes, te derrotaré!'], isTrainer: true, trainerTeam: [makePokemon('pidgeotto', 'PIDGEOTTO', 25, 'flying', [MOVES.GUST, MOVES.QUICK_ATTACK], 17, { types: ['normal', 'flying'] }), makePokemon('growlithe', 'GROWLITHE', 23, 'fire', [MOVES.EMBER, MOVES.BITE], 58), makePokemon('exeggcute', 'EXEGGCUTE', 22, 'grass', [MOVES.VINE_WHIP, MOVES.CONFUSION], 102, { types: ['grass', 'psychic'] }), makePokemon('kadabra', 'KADABRA', 20, 'psychic', [MOVES.CONFUSION, MOVES.TACKLE], 64), makePokemon('wartortle', 'WARTORTLE', 25, 'water', [MOVES.WATER_GUN, MOVES.BITE], 8)] },
      // ── Cerulean City ──
      { id: 'cerulean_rival', name: 'AZUL', type: 'npc', position: w('CERULEAN_CITY', 20, 2), direction: 'down', trainerClass: 'rival', dialogue: ["¡Hola! ¡Hacía tiempo que no nos veíamos!", "¡He atrapado un montón de POKÉMON fuertes!", "¡Enséñame qué has conseguido tú!"], isTrainer: true, trainerTeam: [makePokemon('pidgeotto', 'PIDGEOTTO', 18, 'flying', [MOVES.GUST, MOVES.GROWL], 17), makePokemon('abra', 'ABRA', 15, 'psychic', [MOVES.POUND], 63), makePokemon('rattata', 'RATTATA', 15, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('bulbasaur', 'BULBASAUR', 17, 'grass', [MOVES.TACKLE, MOVES.VINE_WHIP], 1)] },
      { id: 'cerulean_rocket', name: 'SOLDADO ROCKET', type: 'npc', position: w('CERULEAN_CITY', 32, 8), direction: 'down', trainerClass: 'rocket', dialogue: ["¡El TEAM ROCKET se llevará todo lo que quiera!", "¡No te metas en nuestros asuntos!"], isTrainer: true, trainerTeam: [makePokemon('machop', 'MACHOP', 15, 'fighting', [MOVES.SCRATCH, MOVES.GROWL], 66), makePokemon('drowzee', 'DROWZEE', 15, 'psychic', [MOVES.POUND, MOVES.SLEEP_POWDER], 96)] },
      { id: 'cerulean_cooltrainer_m', name: 'ENTRENADOR', type: 'npc', position: w('CERULEAN_CITY', 31, 20), direction: 'down', trainerClass: 'cooltrainer_m', dialogue: ["¡MISTY es la mejor!", "¡Sus POKÉMON de agua son invencibles!"] },
      { id: 'cerulean_supernerd1', name: 'SABIONDO', type: 'npc', position: w('CERULEAN_CITY', 15, 18), direction: 'down', trainerClass: 'supernerd', dialogue: ["¿Has visto al POKÉMON raro de esa cueva?", "¡Dicen que es increíblemente poderoso!"] },
      { id: 'cerulean_supernerd2', name: 'SABIONDO', type: 'npc', position: w('CERULEAN_CITY', 9, 21), direction: 'left', trainerClass: 'supernerd', dialogue: ["¡He intercambiado un POKÉMON con ese chico de ahí!", "¡Mira qué guay es!"] },
      { id: 'cerulean_guard1', name: 'GUARDIA', type: 'npc', position: w('CERULEAN_CITY', 28, 12), direction: 'down', trainerClass: 'citizen', dialogue: ["¡No se puede pasar!", "¡Estamos investigando un robo en esta casa!"] },
      { id: 'cerulean_cooltrainer_f1', name: 'ENTRENADORA', type: 'npc', position: w('CERULEAN_CITY', 29, 26), direction: 'left', trainerClass: 'cooltrainer_f', dialogue: ["¡Mi SLOWBRO es el más fuerte!", "¡Enséñales, SLOWBRO!"] },
      { id: 'cerulean_slowbro', name: 'SLOWBRO', type: 'npc', position: w('CERULEAN_CITY', 28, 26), direction: 'down', trainerClass: 'slowbro', dialogue: ["¿Sloooow?", "¡Parece que está dormitando!"] },
      { id: 'cerulean_cooltrainer_f2', name: 'ENTRENADORA', type: 'npc', position: w('CERULEAN_CITY', 9, 27), direction: 'right', trainerClass: 'cooltrainer_f', dialogue: ["¿Te gusta mi POKÉMON?", "¡Es precioso!"] },
      { id: 'cerulean_supernerd3', name: 'SABIONDO', type: 'npc', position: w('CERULEAN_CITY', 4, 12), direction: 'down', trainerClass: 'supernerd', dialogue: ["¡Esta cueva es peligrosa!", "¡Sólo los mejores entrenadores pueden entrar!"] },
      { id: 'cerulean_guard2', name: 'GUARDIA', type: 'npc', position: w('CERULEAN_CITY', 27, 12), direction: 'down', trainerClass: 'citizen', dialogue: ["¡Estamos vigilando la zona!", "¡Ten cuidado!"] },
      // ── Vermilion City ──
      { id: 'saffron_guard_n', name: 'GUARDIA', type: 'npc', position: w('ROUTE_5', 4, 15), direction: 'up', trainerClass: 'citizen', questId: 'thirsty_guard' as const, dialogue: ["¡No puedes pasar! ¡Tengo mucha sed!", "Dicen que en CIUDAD CELESTE venden TÉ..."] },
      // ── Saffron City ──
      { id: 'saffron_rocket1', name: 'SOLDADO ROCKET', type: 'npc', position: w('SAFFRON_CITY', 7, 6), direction: 'down', trainerClass: 'rocket', dialogue: ["¡Estamos ocupados! ¡Lárgate!", "¡El TEAM ROCKET manda en esta ciudad!"] },
      { id: 'saffron_rocket2', name: 'SOLDADO ROCKET', type: 'npc', position: w('SAFFRON_CITY', 20, 8), direction: 'down', trainerClass: 'rocket', dialogue: ["¡Ni un paso más!", "¡SILPH S.A. es ahora nuestra!"] },
      { id: 'saffron_rocket3', name: 'SOLDADO ROCKET', type: 'npc', position: w('SAFFRON_CITY', 34, 4), direction: 'down', trainerClass: 'rocket', dialogue: ["¡Este GIMNASIO está cerrado por orden del TEAM ROCKET!"] },
      { id: 'saffron_rocket4', name: 'SOLDADO ROCKET', type: 'npc', position: w('SAFFRON_CITY', 13, 12), direction: 'down', trainerClass: 'rocket', dialogue: ["¡No molestes!", "¡Estamos haciendo cosas importantes!"] },
      { id: 'saffron_rocket5', name: 'SOLDADO ROCKET', type: 'npc', position: w('SAFFRON_CITY', 11, 25), direction: 'down', trainerClass: 'rocket', dialogue: ["¡Vete a casa, niño!", "¡Esta no es zona para jugar!"] },
      { id: 'saffron_rocket6', name: 'SOLDADO ROCKET', type: 'npc', position: w('SAFFRON_CITY', 32, 13), direction: 'down', trainerClass: 'rocket', dialogue: ["¡No puedes entrar aquí!", "¡Es propiedad privada!"] },
      { id: 'saffron_rocket7', name: 'SOLDADO ROCKET', type: 'npc', position: w('SAFFRON_CITY', 18, 30), direction: 'down', trainerClass: 'rocket', dialogue: ["¡Cuidado! ¡No nos obligues a usar la fuerza!"] },
      { id: 'saffron_scientist', name: 'CIENTÍFICO', type: 'npc', position: w('SAFFRON_CITY', 8, 14), direction: 'down', trainerClass: 'scientist', dialogue: ["¡El TEAM ROCKET se ha apoderado de todo!", "¡Tienen retenidos a los trabajadores de SILPH!"] },
      { id: 'saffron_worker_m', name: 'TRABAJADOR', type: 'npc', position: w('SAFFRON_CITY', 23, 23), direction: 'down', trainerClass: 'citizen', dialogue: ["¡Por fin somos libres!", "¡Gracias por derrotar al TEAM ROCKET!"] },
      { id: 'saffron_worker_f', name: 'TRABAJADORA', type: 'npc', position: w('SAFFRON_CITY', 17, 30), direction: 'down', trainerClass: 'citizen', dialogue: ["¡Qué alivio!", "¡Ya puedo volver a casa tranquila!"] },
      { id: 'saffron_gentleman', name: 'CABALLERO', type: 'npc', position: w('SAFFRON_CITY', 30, 12), direction: 'down', trainerClass: 'gentleman', dialogue: ["¡Oh, mi querido PIDGEOT!", "¡Qué haríamos el uno sin el otro!"] },
      { id: 'saffron_pidgeot', name: 'PIDGEOT', type: 'npc', position: w('SAFFRON_CITY', 31, 12), direction: 'down', trainerClass: 'pidgeot', dialogue: ["¡Pii-geoot!"] },
      { id: 'saffron_rocker', name: 'ROCKERO', type: 'npc', position: w('SAFFRON_CITY', 18, 8), direction: 'up', trainerClass: 'rocker', dialogue: ["¡Este sitio es genial para tocar!", "¡Siente el ritmo!"] },
      { id: 'saffron_rocket8', name: 'SOLDADO ROCKET', type: 'npc', position: w('SAFFRON_CITY', 18, 22), direction: 'down', trainerClass: 'rocket', dialogue: ["¡Nadie entra en el edificio principal!"] },
      { id: 'saffron_rocket9', name: 'SOLDADO ROCKET', type: 'npc', position: w('SAFFRON_CITY', 19, 22), direction: 'down', trainerClass: 'rocket', dialogue: ["¡Lárgate de aquí si no quieres problemas!"] },
      // ── Celadon City ──
      { id: 'celadon_little_girl', name: 'NIÑA', type: 'npc', position: w('CELADON_CITY', 8, 17), direction: 'down', trainerClass: 'lass', dialogue: ["¡Voy a comprar una POKE MUÑECA!", "¡Son tan monas!"] },
      { id: 'celadon_gramps1', name: 'ABUELO', type: 'npc', position: w('CELADON_CITY', 11, 28), direction: 'up', trainerClass: 'old_man', dialogue: ["¡Je, je! ¡Este GIMNASIO es genial!", "¡Está lleno de chicas fuertes!"] },
      { id: 'celadon_girl', name: 'CHICA', type: 'npc', position: w('CELADON_CITY', 14, 19), direction: 'down', trainerClass: 'lass', dialogue: ["¡Qué ciudad tan grande!", "¡A veces me canso de ver a tanta gente!"] },
      { id: 'celadon_gramps2', name: 'ABUELO', type: 'npc', position: w('CELADON_CITY', 25, 22), direction: 'down', trainerClass: 'old_man', dialogue: ["¡Estoy vigilando el CASINO!", "¡No parece que pase nada raro!"] },
      { id: 'celadon_gramps3', name: 'ABUELO', type: 'npc', position: w('CELADON_CITY', 22, 16), direction: 'down', trainerClass: 'old_man', dialogue: ["¡Soy miembro de la MANSIÓN AZUL!", "¡Es un edificio con mucha historia!"] },
      { id: 'celadon_fisher', name: 'PESCADOR', type: 'npc', position: w('CELADON_CITY', 32, 12), direction: 'left', trainerClass: 'fisher', dialogue: ["¡Mi POLIWRATH es el más fuerte!", "¡Enséñales de lo que eres capaz!"] },
      { id: 'celadon_poliwrath', name: 'POLIWRATH', type: 'npc', position: w('CELADON_CITY', 29, 12), direction: 'right', trainerClass: 'poliwrath', dialogue: ["¡Poliwrath: Ribbit!"] },
      { id: 'celadon_rocket1', name: 'SOLDADO ROCKET', type: 'npc', position: w('CELADON_CITY', 32, 29), direction: 'down', trainerClass: 'rocket', dialogue: ["¡Je, je! ¡No puedes pasar por aquí!", "¡Fuera!"] },
      { id: 'celadon_rocket2', name: 'SOLDADO ROCKET', type: 'npc', position: w('CELADON_CITY', 42, 14), direction: 'down', trainerClass: 'rocket', dialogue: ["¡No metas las narices donde no te llaman!", "¡Vete!"] },
      // ── Fuchsia City ──
      { id: 'fuchsia_youngster1', name: 'JOVEN', type: 'npc', position: w('FUCHSIA_CITY', 10, 12), direction: 'down', trainerClass: 'youngster', dialogue: ["¿Has probado el JUEGO DE LA SAFARI?", "¡Es muy divertido!"] },
      { id: 'fuchsia_gambler', name: 'GOLFO', type: 'npc', position: w('FUCHSIA_CITY', 5, 17), direction: 'down', trainerClass: 'gambler', dialogue: ["¡La ZONA SAFARI es enorme!", "¡Asegúrate de llevar bastantes POKÉ BALL!"] },
      { id: 'fuchsia_erik', name: 'ERIK', type: 'npc', position: w('FUCHSIA_CITY', 30, 14), direction: 'down', trainerClass: 'fisher', dialogue: ["¿Dónde está mi SARA?", "¡Habíamos quedado aquí!"] },
      { id: 'fuchsia_youngster2', name: 'JOVEN', type: 'npc', position: w('FUCHSIA_CITY', 24, 8), direction: 'up', trainerClass: 'youngster', dialogue: ["¡Mira a esos POKÉMON!", "¡Están en sus recintos del zoo!"] },
      { id: 'fuchsia_chansey', name: 'CHANSEY', type: 'npc', position: w('FUCHSIA_CITY', 31, 5), direction: 'down', trainerClass: 'chansey', dialogue: ["¡Chansey: Chaan!"] },
      { id: 'fuchsia_voltorb', name: 'VOLTORB', type: 'npc', position: w('FUCHSIA_CITY', 25, 6), direction: 'down', trainerClass: 'voltorb', dialogue: ["¡Voltorb: Bzzzzt!"] },
      { id: 'fuchsia_kangaskhan', name: 'KANGASKHAN', type: 'npc', position: w('FUCHSIA_CITY', 12, 6), direction: 'down', trainerClass: 'kangaskhan', dialogue: ["¡Kangaskhan: Gaaa-oh!"] },
      { id: 'fuchsia_slowpoke', name: 'SLOWPOKE', type: 'npc', position: w('FUCHSIA_CITY', 30, 12), direction: 'down', trainerClass: 'slowpoke', dialogue: ["¡Slowpoke: ...Sloooow?"] },
      { id: 'fuchsia_lapras', name: 'LAPRAS', type: 'npc', position: w('FUCHSIA_CITY', 8, 17), direction: 'down', trainerClass: 'lapras', dialogue: ["¡Lapras: Laaa-pas!"] },
      { id: 'fuchsia_fossil', name: 'FÓSIL', type: 'npc', position: w('FUCHSIA_CITY', 6, 5), direction: 'down', trainerClass: 'fossil', dialogue: ["¡Es un fósil de POKÉMON antiguo!"] },
      // ── Cinnabar Island ──
      { id: 'cinnabar_girl', name: 'CHICA', type: 'npc', position: w('CINNABAR_ISLAND', 12, 5), direction: 'down', trainerClass: 'lass', dialogue: ["¡El PROF. BLAINE es el LÍDER de este GIMNASIO!", "¡Es un experto en POKÉMON de fuego!"] },
      { id: 'cinnabar_gambler', name: 'GOLFO', type: 'npc', position: w('CINNABAR_ISLAND', 14, 6), direction: 'down', trainerClass: 'gambler', dialogue: ["¡Este laboratorio es increíble!", "¡Estudian todo tipo de POKÉMON raros!"] },
      // ── Vermilion City ──
      { id: 'vermilion_beauty', name: 'CHICA', type: 'npc', position: w('VERMILION_CITY', 19, 7), direction: 'down', trainerClass: 'lass', dialogue: ["¿Has visto el S.S. ANNE?", "¡Es un barco increíblemente grande!"] },
      { id: 'vermilion_gambler1', name: 'GOLFO', type: 'npc', position: w('VERMILION_CITY', 14, 6), direction: 'down', trainerClass: 'gambler', dialogue: ["¡El S.S. ANNE está en el puerto!", "¡Dicen que hay muchos entrenadores a bordo!"] },
      { id: 'vermilion_sailor1', name: 'MARINERO', type: 'npc', position: w('VERMILION_CITY', 19, 30), direction: 'up', trainerClass: 'sailor', dialogue: ["¡Bienvenido a CIUDAD CARMÍN!", "¡El puerto es mi lugar favorito!"] },
      { id: 'vermilion_gambler2', name: 'GOLFO', type: 'npc', position: w('VERMILION_CITY', 30, 7), direction: 'down', trainerClass: 'gambler', dialogue: ["¡Estoy construyendo mi propia casa!", "¡Mi POKÉMON me está ayudando!"] },
      { id: 'vermilion_machop', name: 'MACHOP', type: 'npc', position: w('VERMILION_CITY', 29, 9), direction: 'down', trainerClass: 'machop', dialogue: ["¡Guoh! ¡Guoguo!", "¡MACHOP está apisonando el suelo con cuidado!"] },
      { id: 'vermilion_sailor2', name: 'MARINERO', type: 'npc', position: w('VERMILION_CITY', 25, 27), direction: 'left', trainerClass: 'sailor', dialogue: ["¿Has oído hablar del TENIENTE SURGE?", "¡Es el LÍDER del GIMNASIO y un experto en POKÉMON eléctricos!"] },
      // ── SS Anne Dock ──
      ...(!hasSsTicket ? [{
        id: 'dock_guard', name: 'GUARDIA', type: 'npc' as const,
        position: w('VERMILION_CITY', 29, 16),
        direction: 'down' as Direction, trainerClass: 'sailor',
        dialogue: ['Solo se admiten viajeros con BILLETE SS.', '¡Vuelve cuando tengas uno!'],
      }] : []),
      // ── Lavender Town ──
      { id: 'lavender_girl', name: 'NIÑA', type: 'npc', position: w('LAVENDER_TOWN', 15, 9), direction: 'down', trainerClass: 'lass', dialogue: ["¿Crees en los fantasmas?", "¡Yo sí! ¡He visto uno en la TORRE POKÉMON!"] },
      { id: 'lavender_cooltrainer_m', name: 'ENTRENADOR', type: 'npc', position: w('LAVENDER_TOWN', 5, 14), direction: 'down', trainerClass: 'cooltrainer_m', dialogue: ["Este pueblo es muy tranquilo...", "Demasiado tranquilo para mi gusto."] },
      { id: 'lavender_supernerd', name: 'SABIONDO', type: 'npc', position: w('LAVENDER_TOWN', 8, 7), direction: 'left', trainerClass: 'supernerd', dialogue: ["¿Has oído hablar del SCOPE SILPH?", "¡Dicen que puede identificar a los fantasmas!"] },
      // ── Lavender Town Signs ──
      { id: 'sign_lavender_main', type: 'object', position: w('LAVENDER_TOWN', 15, 9), direction: 'down', sprite: '🪧', dialogue: ['PUEBLO LAVANDA', 'El pueblo noble y púrpura.'] },
      { id: 'sign_silph_scope', type: 'object', position: w('LAVENDER_TOWN', 9, 3), direction: 'down', sprite: '🪧', dialogue: ['NUEVO SCOPE SILPH!', '¡Haz visible lo invisible!', 'SILPH S.A.'] },
      { id: 'sign_mart_lavender', type: 'object', position: w('LAVENDER_TOWN', 16, 13), direction: 'down', sprite: '🪧', dialogue: ['TIENDA POKÉMON'] },
      { id: 'sign_center_lavender', type: 'object', position: w('LAVENDER_TOWN', 2, 5), direction: 'down', sprite: '🪧', dialogue: ['CENTRO POKÉMON'] },
      { id: 'sign_pokemon_house', type: 'object', position: w('LAVENDER_TOWN', 5, 9), direction: 'down', sprite: '🪧', dialogue: ['CASA POKÉMON VOLUNTARIA DE LAVANDA'] },
      { id: 'sign_tower_lavender', type: 'object', position: w('LAVENDER_TOWN', 17, 7), direction: 'down', sprite: '🪧', dialogue: ['TORRE POKÉMON', 'Aquí descansan los POKÉMON fallecidos.'] },
    
      { id: 'pokemaniac_kanto_overworld_0', name: 'POKÉMANÍACO', type: 'npc', position: w('ROUTE_10', 10, 44), direction: 'down', trainerClass: 'pokemaniac', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rhyhorn', 'RHYHORN', 30, 'ground', [MOVES.DIG, MOVES.ROCK_THROW], 111, { types: ['ground', 'rock'] }), makePokemon('lickitung', 'LICKITUNG', 30, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 108)] },
      { id: 'hiker_kanto_overworld_6', name: 'MONTAÑERO', type: 'npc', position: w('ROUTE_10', 3, 57), direction: 'down', trainerClass: 'hiker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 21, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('onix', 'ONIX', 21, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 95, { types: ['rock', 'ground'] })] },
      { id: 'jrtrainerf_kanto_overworld_6', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_10', 7, 25), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pikachu', 'PIKACHU', 20, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 25), makePokemon('clefairy', 'CLEFAIRY', 20, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 35)] },
      { id: 'hiker_kanto_overworld_7', name: 'MONTAÑERO', type: 'npc', position: w('ROUTE_10', 3, 61), direction: 'down', trainerClass: 'hiker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('onix', 'ONIX', 19, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 95, { types: ['rock', 'ground'] }), makePokemon('graveler', 'GRAVELER', 19, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 75, { types: ['rock', 'ground'] })] },
      { id: 'jrtrainerf_kanto_overworld_7', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_10', 7, 54), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 21, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('pidgeotto', 'PIDGEOTTO', 21, 'normal', [MOVES.TACKLE, MOVES.GUST], 17, { types: ['normal', 'flying'] })] },
      { id: 'gambler_kanto_overworld_0', name: 'GOLFO', type: 'npc', position: w('ROUTE_11', 10, 14), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('poliwag', 'POLIWAG', 18, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 60), makePokemon('horsea', 'HORSEA', 18, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116)] },
      { id: 'gambler_kanto_overworld_1', name: 'GOLFO', type: 'npc', position: w('ROUTE_11', 26, 9), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('bellsprout', 'BELLSPROUT', 18, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 69, { types: ['grass', 'poison'] }), makePokemon('oddish', 'ODDISH', 18, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 43, { types: ['grass', 'poison'] })] },
      { id: 'youngster_kanto_overworld_8', name: 'JOVEN', type: 'npc', position: w('ROUTE_11', 13, 5), direction: 'down', trainerClass: 'youngster', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('ekans', 'EKANS', 21, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 23)] },
      { id: 'engineer_kanto_overworld_1', name: 'INGENIERO', type: 'npc', position: w('ROUTE_11', 36, 11), direction: 'down', trainerClass: 'engineer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('magnemite', 'MAGNEMITE', 21, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 81)] },
      { id: 'youngster_kanto_overworld_9', name: 'JOVEN', type: 'npc', position: w('ROUTE_11', 22, 4), direction: 'down', trainerClass: 'youngster', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('sandshrew', 'SANDSHREW', 19, 'ground', [MOVES.DIG, MOVES.TACKLE], 27), makePokemon('zubat', 'ZUBAT', 19, 'poison', [MOVES.POISON_POWDER, MOVES.GUST], 41, { types: ['poison', 'flying'] })] },
      { id: 'gambler_kanto_overworld_2', name: 'GOLFO', type: 'npc', position: w('ROUTE_11', 45, 7), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('voltorb', 'VOLTORB', 18, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 100), makePokemon('magnemite', 'MAGNEMITE', 18, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 81)] },
      { id: 'gambler_kanto_overworld_3', name: 'GOLFO', type: 'npc', position: w('ROUTE_11', 33, 3), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('growlithe', 'GROWLITHE', 18, 'fire', [MOVES.EMBER, MOVES.TACKLE], 58), makePokemon('vulpix', 'VULPIX', 18, 'fire', [MOVES.EMBER, MOVES.TACKLE], 37)] },
      { id: 'youngster_kanto_overworld_10', name: 'JOVEN', type: 'npc', position: w('ROUTE_11', 43, 5), direction: 'down', trainerClass: 'youngster', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 17, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('rattata', 'RATTATA', 17, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('raticate', 'RATICATE', 17, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 20)] },
      { id: 'engineer_kanto_overworld_2', name: 'INGENIERO', type: 'npc', position: w('ROUTE_11', 45, 16), direction: 'down', trainerClass: 'engineer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('magnemite', 'MAGNEMITE', 18, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 81), makePokemon('magnemite', 'MAGNEMITE', 18, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 81), makePokemon('magneton', 'MAGNETON', 18, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 82)] },
      { id: 'youngster_kanto_overworld_11', name: 'JOVEN', type: 'npc', position: w('ROUTE_11', 22, 12), direction: 'down', trainerClass: 'youngster', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('nidoran-m', 'NIDORAN_M', 18, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 32), makePokemon('nidorino', 'NIDORINO', 18, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 33)] },
      { id: 'fisher_kanto_overworld_2', name: 'PESCADOR', type: 'npc', position: w('ROUTE_12', 14, 31), direction: 'down', trainerClass: 'fisher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('goldeen', 'GOLDEEN', 22, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118), makePokemon('poliwag', 'POLIWAG', 22, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 60), makePokemon('goldeen', 'GOLDEEN', 22, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118)] },
      { id: 'fisher_kanto_overworld_3', name: 'PESCADOR', type: 'npc', position: w('ROUTE_12', 5, 39), direction: 'down', trainerClass: 'fisher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('tentacool', 'TENTACOOL', 24, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 72, { types: ['water', 'poison'] }), makePokemon('goldeen', 'GOLDEEN', 24, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118)] },
      { id: 'jrtrainerm_kanto_overworld_8', name: 'ENTRENADOR', type: 'npc', position: w('ROUTE_12', 11, 92), direction: 'down', trainerClass: 'cooltrainer_m', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('nidoran-m', 'NIDORAN_M', 29, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 32), makePokemon('nidorino', 'NIDORINO', 29, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 33)] },
      { id: 'rocker_kanto_overworld_1', name: 'ROCKERO', type: 'npc', position: w('ROUTE_12', 14, 76), direction: 'down', trainerClass: 'rocker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('voltorb', 'VOLTORB', 29, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 100), makePokemon('electrode', 'ELECTRODE', 29, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 101)] },
      { id: 'fisher_kanto_overworld_4', name: 'PESCADOR', type: 'npc', position: w('ROUTE_12', 12, 40), direction: 'down', trainerClass: 'fisher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('goldeen', 'GOLDEEN', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118)] },
      { id: 'fisher_kanto_overworld_5', name: 'PESCADOR', type: 'npc', position: w('ROUTE_12', 9, 52), direction: 'down', trainerClass: 'fisher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('poliwag', 'POLIWAG', 21, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 60), makePokemon('shellder', 'SHELLDER', 21, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 90), makePokemon('goldeen', 'GOLDEEN', 21, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118), makePokemon('horsea', 'HORSEA', 21, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116)] },
      { id: 'fisher_kanto_overworld_10', name: 'PESCADOR', type: 'npc', position: w('ROUTE_12', 6, 87), direction: 'down', trainerClass: 'fisher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('magikarp', 'MAGIKARP', 24, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 129), makePokemon('magikarp', 'MAGIKARP', 24, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 129)] },
      { id: 'birdkeeper_kanto_overworld_0', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_13', 49, 10), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 29, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('pidgeotto', 'PIDGEOTTO', 29, 'normal', [MOVES.TACKLE, MOVES.GUST], 17, { types: ['normal', 'flying'] })] },
      { id: 'jrtrainerf_kanto_overworld_11', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_13', 48, 10), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 24, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('meowth', 'MEOWTH', 24, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 52), makePokemon('rattata', 'RATTATA', 24, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('pikachu', 'PIKACHU', 24, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 25), makePokemon('meowth', 'MEOWTH', 24, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 52)] },
      { id: 'jrtrainerf_kanto_overworld_12', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_13', 27, 9), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('poliwag', 'POLIWAG', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 60), makePokemon('poliwag', 'POLIWAG', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 60)] },
      { id: 'jrtrainerf_kanto_overworld_13', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_13', 23, 10), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 27, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('meowth', 'MEOWTH', 27, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 52), makePokemon('pidgey', 'PIDGEY', 27, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('pidgeotto', 'PIDGEOTTO', 27, 'normal', [MOVES.TACKLE, MOVES.GUST], 17, { types: ['normal', 'flying'] })] },
      { id: 'jrtrainerf_kanto_overworld_14', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_13', 50, 5), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('goldeen', 'GOLDEEN', 28, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118), makePokemon('poliwag', 'POLIWAG', 28, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 60), makePokemon('horsea', 'HORSEA', 28, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116)] },
      { id: 'birdkeeper_kanto_overworld_1', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_13', 12, 4), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('spearow', 'SPEAROW', 25, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] }), makePokemon('pidgey', 'PIDGEY', 25, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('pidgey', 'PIDGEY', 25, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('spearow', 'SPEAROW', 25, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] }), makePokemon('spearow', 'SPEAROW', 25, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] })] },
      { id: 'beauty_kanto_overworld_3', name: 'BELLEZA', type: 'npc', position: w('ROUTE_13', 33, 6), direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 27, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('pikachu', 'PIKACHU', 27, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 25), makePokemon('rattata', 'RATTATA', 27, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19)] },
      { id: 'beauty_kanto_overworld_4', name: 'BELLEZA', type: 'npc', position: w('ROUTE_13', 32, 6), direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('clefairy', 'CLEFAIRY', 29, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 35), makePokemon('meowth', 'MEOWTH', 29, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 52)] },
      { id: 'biker_kanto_overworld_0', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_13', 10, 7), direction: 'down', trainerClass: 'biker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('koffing', 'KOFFING', 28, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('koffing', 'KOFFING', 28, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('koffing', 'KOFFING', 28, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109)] },
      { id: 'birdkeeper_kanto_overworld_2', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_13', 7, 13), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('pidgeotto', 'PIDGEOTTO', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 17, { types: ['normal', 'flying'] }), makePokemon('spearow', 'SPEAROW', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] }), makePokemon('fearow', 'FEAROW', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 22, { types: ['normal', 'flying'] })] },
      { id: 'birdkeeper_kanto_overworld_13', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_14', 4, 4), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 28, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('doduo', 'DODUO', 28, 'normal', [MOVES.TACKLE, MOVES.GUST], 84, { types: ['normal', 'flying'] }), makePokemon('pidgeotto', 'PIDGEOTTO', 28, 'normal', [MOVES.TACKLE, MOVES.GUST], 17, { types: ['normal', 'flying'] })] },
      { id: 'birdkeeper_kanto_overworld_14', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_14', 15, 6), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('spearow', 'SPEAROW', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] }), makePokemon('pidgey', 'PIDGEY', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('fearow', 'FEAROW', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 22, { types: ['normal', 'flying'] })] },
      { id: 'birdkeeper_kanto_overworld_15', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_14', 12, 11), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgeotto', 'PIDGEOTTO', 29, 'normal', [MOVES.TACKLE, MOVES.GUST], 17, { types: ['normal', 'flying'] }), makePokemon('fearow', 'FEAROW', 29, 'normal', [MOVES.TACKLE, MOVES.GUST], 22, { types: ['normal', 'flying'] })] },
      { id: 'birdkeeper_kanto_overworld_16', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_14', 14, 15), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('spearow', 'SPEAROW', 28, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] }), makePokemon('doduo', 'DODUO', 28, 'normal', [MOVES.TACKLE, MOVES.GUST], 84, { types: ['normal', 'flying'] }), makePokemon('fearow', 'FEAROW', 28, 'normal', [MOVES.TACKLE, MOVES.GUST], 22, { types: ['normal', 'flying'] })] },
      { id: 'birdkeeper_kanto_overworld_3', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_14', 15, 31), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('farfetchd', 'FARFETCHD', 33, 'normal', [MOVES.TACKLE, MOVES.GUST], 83, { types: ['normal', 'flying'] })] },
      { id: 'birdkeeper_kanto_overworld_4', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_14', 6, 49), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('spearow', 'SPEAROW', 29, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] }), makePokemon('fearow', 'FEAROW', 29, 'normal', [MOVES.TACKLE, MOVES.GUST], 22, { types: ['normal', 'flying'] })] },
      { id: 'biker_kanto_overworld_12', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_14', 5, 39), direction: 'down', trainerClass: 'biker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('koffing', 'KOFFING', 26, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('koffing', 'KOFFING', 26, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('grimer', 'GRIMER', 26, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 88), makePokemon('koffing', 'KOFFING', 26, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109)] },
      { id: 'biker_kanto_overworld_13', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_14', 4, 30), direction: 'down', trainerClass: 'biker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('grimer', 'GRIMER', 28, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 88), makePokemon('grimer', 'GRIMER', 28, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 88), makePokemon('koffing', 'KOFFING', 28, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109)] },
      { id: 'biker_kanto_overworld_14', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_14', 15, 30), direction: 'down', trainerClass: 'biker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('koffing', 'KOFFING', 29, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('muk', 'MUK', 29, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 89)] },
      { id: 'biker_kanto_overworld_1', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_14', 4, 31), direction: 'down', trainerClass: 'biker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('koffing', 'KOFFING', 29, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('grimer', 'GRIMER', 29, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 88)] },
      { id: 'jrtrainerf_kanto_overworld_19', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_15', 41, 11), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('gloom', 'GLOOM', 28, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 44, { types: ['grass', 'poison'] }), makePokemon('oddish', 'ODDISH', 28, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 43, { types: ['grass', 'poison'] }), makePokemon('oddish', 'ODDISH', 28, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 43, { types: ['grass', 'poison'] })] },
      { id: 'jrtrainerf_kanto_overworld_20', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_15', 53, 10), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pikachu', 'PIKACHU', 29, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 25), makePokemon('raichu', 'RAICHU', 29, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 26)] },
      { id: 'birdkeeper_kanto_overworld_5', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_15', 31, 13), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgeotto', 'PIDGEOTTO', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 17, { types: ['normal', 'flying'] }), makePokemon('farfetchd', 'FARFETCHD', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 83, { types: ['normal', 'flying'] }), makePokemon('doduo', 'DODUO', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 84, { types: ['normal', 'flying'] }), makePokemon('pidgey', 'PIDGEY', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] })] },
      { id: 'birdkeeper_kanto_overworld_6', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_15', 35, 13), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('dodrio', 'DODRIO', 28, 'normal', [MOVES.TACKLE, MOVES.GUST], 85, { types: ['normal', 'flying'] }), makePokemon('doduo', 'DODUO', 28, 'normal', [MOVES.TACKLE, MOVES.GUST], 84, { types: ['normal', 'flying'] }), makePokemon('doduo', 'DODUO', 28, 'normal', [MOVES.TACKLE, MOVES.GUST], 84, { types: ['normal', 'flying'] })] },
      { id: 'beauty_kanto_overworld_8', name: 'BELLEZA', type: 'npc', position: w('ROUTE_15', 53, 11), direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgeotto', 'PIDGEOTTO', 29, 'normal', [MOVES.TACKLE, MOVES.GUST], 17, { types: ['normal', 'flying'] }), makePokemon('wigglytuff', 'WIGGLYTUFF', 29, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 40)] },
      { id: 'beauty_kanto_overworld_9', name: 'BELLEZA', type: 'npc', position: w('ROUTE_15', 41, 10), direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('bulbasaur', 'BULBASAUR', 29, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 1, { types: ['grass', 'poison'] }), makePokemon('ivysaur', 'IVYSAUR', 29, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 2, { types: ['grass', 'poison'] })] },
      { id: 'biker_kanto_overworld_2', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_15', 48, 10), direction: 'down', trainerClass: 'biker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('koffing', 'KOFFING', 25, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('koffing', 'KOFFING', 25, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('weezing', 'WEEZING', 25, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 110), makePokemon('koffing', 'KOFFING', 25, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('grimer', 'GRIMER', 25, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 88)] },
      { id: 'biker_kanto_overworld_3', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_15', 46, 10), direction: 'down', trainerClass: 'biker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('koffing', 'KOFFING', 28, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('grimer', 'GRIMER', 28, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 88), makePokemon('weezing', 'WEEZING', 28, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 110)] },
      { id: 'jrtrainerf_kanto_overworld_21', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_15', 37, 5), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('clefairy', 'CLEFAIRY', 33, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 35)] },
      { id: 'jrtrainerf_kanto_overworld_22', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_15', 18, 13), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('bellsprout', 'BELLSPROUT', 29, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 69, { types: ['grass', 'poison'] }), makePokemon('oddish', 'ODDISH', 29, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 43, { types: ['grass', 'poison'] }), makePokemon('tangela', 'TANGELA', 29, 'grass', [MOVES.VINE_WHIP, MOVES.TACKLE], 114)] },
      { id: 'cueball_kanto_overworld_0', name: 'GOLFO', type: 'npc', position: w('ROUTE_16', 14, 13), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('machop', 'MACHOP', 28, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 66), makePokemon('mankey', 'MANKEY', 28, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 56), makePokemon('machop', 'MACHOP', 28, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 66)] },
      { id: 'biker_kanto_overworld_5', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_16', 9, 11), direction: 'down', trainerClass: 'biker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('weezing', 'WEEZING', 33, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 110)] },
      { id: 'cueball_kanto_overworld_2', name: 'GOLFO', type: 'npc', position: w('ROUTE_16', 6, 10), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('machop', 'MACHOP', 33, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 66)] },
      { id: 'cueball_kanto_overworld_3', name: 'GOLFO', type: 'npc', position: w('ROUTE_17', 12, 19), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('mankey', 'MANKEY', 29, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 56), makePokemon('primeape', 'PRIMEAPE', 29, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 57)] },
      { id: 'cueball_kanto_overworld_4', name: 'GOLFO', type: 'npc', position: w('ROUTE_17', 11, 16), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('machop', 'MACHOP', 29, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 66), makePokemon('machoke', 'MACHOKE', 29, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 67)] },
      { id: 'biker_kanto_overworld_7', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_17', 4, 18), direction: 'down', trainerClass: 'biker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('weezing', 'WEEZING', 28, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 110), makePokemon('koffing', 'KOFFING', 28, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('weezing', 'WEEZING', 28, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 110)] },
      { id: 'biker_kanto_overworld_8', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_17', 7, 32), direction: 'down', trainerClass: 'biker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('muk', 'MUK', 33, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 89)] },
      { id: 'biker_kanto_overworld_9', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_17', 14, 34), direction: 'down', trainerClass: 'biker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('voltorb', 'VOLTORB', 29, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 100), makePokemon('voltorb', 'VOLTORB', 29, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 100)] },
      { id: 'cueball_kanto_overworld_5', name: 'GOLFO', type: 'npc', position: w('ROUTE_17', 17, 58), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('machoke', 'MACHOKE', 33, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 67)] },
      { id: 'cueball_kanto_overworld_6', name: 'GOLFO', type: 'npc', position: w('ROUTE_17', 2, 68), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('mankey', 'MANKEY', 26, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 56), makePokemon('mankey', 'MANKEY', 26, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 56), makePokemon('machoke', 'MACHOKE', 26, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 67), makePokemon('machop', 'MACHOP', 26, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 66)] },
      { id: 'cueball_kanto_overworld_7', name: 'GOLFO', type: 'npc', position: w('ROUTE_17', 14, 98), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('primeape', 'PRIMEAPE', 29, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 57), makePokemon('machoke', 'MACHOKE', 29, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 67)] },
      { id: 'biker_kanto_overworld_10', name: 'MOTORISTA', type: 'npc', position: w('ROUTE_17', 5, 98), direction: 'down', trainerClass: 'biker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('weezing', 'WEEZING', 29, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 110), makePokemon('muk', 'MUK', 29, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 89)] },
      { id: 'birdkeeper_kanto_overworld_7', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_18', 36, 11), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('spearow', 'SPEAROW', 29, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] }), makePokemon('fearow', 'FEAROW', 29, 'normal', [MOVES.TACKLE, MOVES.GUST], 22, { types: ['normal', 'flying'] })] },
      { id: 'birdkeeper_kanto_overworld_9', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_18', 42, 13), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('spearow', 'SPEAROW', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] }), makePokemon('spearow', 'SPEAROW', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] }), makePokemon('fearow', 'FEAROW', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 22, { types: ['normal', 'flying'] }), makePokemon('spearow', 'SPEAROW', 26, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] })] },
      { id: 'swimmer_kanto_overworld_1', name: 'NADADOR', type: 'npc', position: w('ROUTE_19', 8, 7), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('tentacool', 'TENTACOOL', 30, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 72, { types: ['water', 'poison'] }), makePokemon('shellder', 'SHELLDER', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 90)] },
      { id: 'swimmer_kanto_overworld_2', name: 'NADADOR', type: 'npc', position: w('ROUTE_19', 13, 7), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('goldeen', 'GOLDEEN', 29, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118), makePokemon('horsea', 'HORSEA', 29, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116), makePokemon('staryu', 'STARYU', 29, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 120)] },
      { id: 'swimmer_kanto_overworld_3', name: 'NADADOR', type: 'npc', position: w('ROUTE_19', 13, 25), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('poliwag', 'POLIWAG', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 60), makePokemon('poliwhirl', 'POLIWHIRL', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 61)] },
      { id: 'swimmer_kanto_overworld_4', name: 'NADADOR', type: 'npc', position: w('ROUTE_19', 4, 27), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('horsea', 'HORSEA', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116), makePokemon('tentacool', 'TENTACOOL', 27, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 72, { types: ['water', 'poison'] }), makePokemon('tentacool', 'TENTACOOL', 27, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 72, { types: ['water', 'poison'] }), makePokemon('goldeen', 'GOLDEEN', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118)] },
      { id: 'swimmer_kanto_overworld_5', name: 'NADADOR', type: 'npc', position: w('ROUTE_19', 16, 31), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('goldeen', 'GOLDEEN', 29, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118), makePokemon('shellder', 'SHELLDER', 29, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 90), makePokemon('seaking', 'SEAKING', 29, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 119)] },
      { id: 'swimmer_kanto_overworld_6', name: 'NADADOR', type: 'npc', position: w('ROUTE_19', 9, 11), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('horsea', 'HORSEA', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116), makePokemon('horsea', 'HORSEA', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116)] },
      { id: 'beauty_kanto_overworld_11', name: 'BELLEZA', type: 'npc', position: w('ROUTE_19', 8, 43), direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('poliwag', 'POLIWAG', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 60), makePokemon('goldeen', 'GOLDEEN', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118), makePokemon('seaking', 'SEAKING', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 119), makePokemon('goldeen', 'GOLDEEN', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118), makePokemon('poliwag', 'POLIWAG', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 60)] },
      { id: 'beauty_kanto_overworld_12', name: 'BELLEZA', type: 'npc', position: w('ROUTE_19', 11, 43), direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('goldeen', 'GOLDEEN', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118), makePokemon('seaking', 'SEAKING', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 119)] },
      { id: 'swimmer_kanto_overworld_7', name: 'NADADOR', type: 'npc', position: w('ROUTE_19', 9, 42), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('tentacool', 'TENTACOOL', 27, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 72, { types: ['water', 'poison'] }), makePokemon('tentacool', 'TENTACOOL', 27, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 72, { types: ['water', 'poison'] }), makePokemon('staryu', 'STARYU', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 120), makePokemon('horsea', 'HORSEA', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116), makePokemon('tentacruel', 'TENTACRUEL', 27, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 73, { types: ['water', 'poison'] })] },
      { id: 'beauty_kanto_overworld_13', name: 'BELLEZA', type: 'npc', position: w('ROUTE_19', 10, 44), direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('staryu', 'STARYU', 29, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 120), makePokemon('staryu', 'STARYU', 29, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 120), makePokemon('staryu', 'STARYU', 29, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 120)] },
      { id: 'swimmer_kanto_overworld_8', name: 'NADADOR', type: 'npc', position: w('ROUTE_20', 87, 8), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('shellder', 'SHELLDER', 31, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 90), makePokemon('cloyster', 'CLOYSTER', 31, 'water', [MOVES.WATER_GUN, MOVES.ICE_BEAM], 91, { types: ['water', 'ice'] })] },
      { id: 'beauty_kanto_overworld_14', name: 'BELLEZA', type: 'npc', position: w('ROUTE_20', 68, 11), direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('seadra', 'SEADRA', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 117), makePokemon('horsea', 'HORSEA', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116), makePokemon('seadra', 'SEADRA', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 117)] },
      { id: 'beauty_kanto_overworld_5', name: 'BELLEZA', type: 'npc', position: w('ROUTE_20', 45, 10), direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('seaking', 'SEAKING', 35, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 119)] },
      { id: 'jrtrainerf_kanto_overworld_23', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_20', 55, 14), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('tentacool', 'TENTACOOL', 30, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 72, { types: ['water', 'poison'] }), makePokemon('horsea', 'HORSEA', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116), makePokemon('seel', 'SEEL', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 86)] },
      { id: 'swimmer_kanto_overworld_9', name: 'NADADOR', type: 'npc', position: w('ROUTE_20', 38, 13), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('staryu', 'STARYU', 35, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 120)] },
      { id: 'swimmer_kanto_overworld_10', name: 'NADADOR', type: 'npc', position: w('ROUTE_20', 87, 13), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('horsea', 'HORSEA', 28, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116), makePokemon('horsea', 'HORSEA', 28, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116), makePokemon('seadra', 'SEADRA', 28, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 117), makePokemon('horsea', 'HORSEA', 28, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116)] },
      { id: 'birdkeeper_kanto_overworld_10', name: 'ORNITÓLOGO', type: 'npc', position: w('ROUTE_20', 34, 9), direction: 'down', trainerClass: 'birdkeeper', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('fearow', 'FEAROW', 30, 'normal', [MOVES.TACKLE, MOVES.GUST], 22, { types: ['normal', 'flying'] }), makePokemon('fearow', 'FEAROW', 30, 'normal', [MOVES.TACKLE, MOVES.GUST], 22, { types: ['normal', 'flying'] }), makePokemon('pidgeotto', 'PIDGEOTTO', 30, 'normal', [MOVES.TACKLE, MOVES.GUST], 17, { types: ['normal', 'flying'] })] },
      { id: 'beauty_kanto_overworld_6', name: 'BELLEZA', type: 'npc', position: w('ROUTE_20', 25, 7), direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('shellder', 'SHELLDER', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 90), makePokemon('shellder', 'SHELLDER', 30, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 90), makePokemon('cloyster', 'CLOYSTER', 30, 'water', [MOVES.WATER_GUN, MOVES.ICE_BEAM], 91, { types: ['water', 'ice'] })] },
      { id: 'jrtrainerf_kanto_overworld_15', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_20', 24, 12), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('goldeen', 'GOLDEEN', 31, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118), makePokemon('seaking', 'SEAKING', 31, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 119)] },
      { id: 'beauty_kanto_overworld_7', name: 'BELLEZA', type: 'npc', position: w('ROUTE_20', 15, 8), direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('poliwag', 'POLIWAG', 31, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 60), makePokemon('seaking', 'SEAKING', 31, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 119)] },
      { id: 'fisher_kanto_overworld_6', name: 'PESCADOR', type: 'npc', position: w('ROUTE_21', 4, 24), direction: 'down', trainerClass: 'fisher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('seaking', 'SEAKING', 28, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 119), makePokemon('goldeen', 'GOLDEEN', 28, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118), makePokemon('seaking', 'SEAKING', 28, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 119), makePokemon('seaking', 'SEAKING', 28, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 119)] },
      { id: 'fisher_kanto_overworld_8', name: 'PESCADOR', type: 'npc', position: w('ROUTE_21', 6, 25), direction: 'down', trainerClass: 'fisher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('magikarp', 'MAGIKARP', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 129), makePokemon('magikarp', 'MAGIKARP', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 129), makePokemon('magikarp', 'MAGIKARP', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 129), makePokemon('magikarp', 'MAGIKARP', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 129), makePokemon('magikarp', 'MAGIKARP', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 129), makePokemon('magikarp', 'MAGIKARP', 27, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 129)] },
      { id: 'swimmer_kanto_overworld_11', name: 'NADADOR', type: 'npc', position: w('ROUTE_21', 10, 31), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('seadra', 'SEADRA', 33, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 117), makePokemon('tentacruel', 'TENTACRUEL', 33, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 73, { types: ['water', 'poison'] })] },
      { id: 'cueball_kanto_overworld_8', name: 'GOLFO', type: 'npc', position: w('ROUTE_21', 12, 30), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('tentacool', 'TENTACOOL', 31, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 72, { types: ['water', 'poison'] }), makePokemon('tentacool', 'TENTACOOL', 31, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 72, { types: ['water', 'poison'] }), makePokemon('tentacruel', 'TENTACRUEL', 31, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 73, { types: ['water', 'poison'] })] },
      { id: 'swimmer_kanto_overworld_12', name: 'NADADOR', type: 'npc', position: w('ROUTE_21', 16, 63), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('starmie', 'STARMIE', 37, 'water', [MOVES.WATER_GUN, MOVES.CONFUSION], 121, { types: ['water', 'psychic'] })] },
      { id: 'swimmer_kanto_overworld_13', name: 'NADADOR', type: 'npc', position: w('ROUTE_21', 5, 71), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('staryu', 'STARYU', 33, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 120), makePokemon('wartortle', 'WARTORTLE', 33, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 8)] },
      { id: 'swimmer_kanto_overworld_14', name: 'NADADOR', type: 'npc', position: w('ROUTE_21', 15, 71), direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('poliwhirl', 'POLIWHIRL', 32, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 61), makePokemon('tentacool', 'TENTACOOL', 32, 'water', [MOVES.WATER_GUN, MOVES.POISON_POWDER], 72, { types: ['water', 'poison'] }), makePokemon('seadra', 'SEADRA', 32, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 117)] },
      { id: 'fisher_kanto_overworld_7', name: 'PESCADOR', type: 'npc', position: w('ROUTE_21', 14, 56), direction: 'down', trainerClass: 'fisher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('shellder', 'SHELLDER', 31, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 90), makePokemon('cloyster', 'CLOYSTER', 31, 'water', [MOVES.WATER_GUN, MOVES.ICE_BEAM], 91, { types: ['water', 'ice'] })] },
      { id: 'fisher_kanto_overworld_9', name: 'PESCADOR', type: 'npc', position: w('ROUTE_21', 17, 57), direction: 'down', trainerClass: 'fisher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('seaking', 'SEAKING', 33, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 119), makePokemon('goldeen', 'GOLDEEN', 33, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118)] },
      { id: 'rocket_kanto_overworld_5', name: 'SOLDADO ROCKET', type: 'npc', position: w('ROUTE_24', 11, 15), direction: 'down', trainerClass: 'rocket', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('ekans', 'EKANS', 15, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 23), makePokemon('zubat', 'ZUBAT', 15, 'poison', [MOVES.POISON_POWDER, MOVES.GUST], 41, { types: ['poison', 'flying'] })] },
      { id: 'jrtrainerm_kanto_overworld_1', name: 'ENTRENADOR', type: 'npc', position: w('ROUTE_24', 5, 20), direction: 'down', trainerClass: 'cooltrainer_m', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 14, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('ekans', 'EKANS', 14, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 23)] },
      { id: 'jrtrainerm_kanto_overworld_2', name: 'ENTRENADOR', type: 'npc', position: w('ROUTE_24', 11, 19), direction: 'down', trainerClass: 'cooltrainer_m', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('mankey', 'MANKEY', 18, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 56)] },
      { id: 'lass_kanto_overworld_6', name: 'CHICA', type: 'npc', position: w('ROUTE_24', 10, 22), direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 16, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('nidoran-f', 'NIDORAN_F', 16, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 29)] },
      { id: 'youngster_kanto_overworld_3', name: 'JOVEN', type: 'npc', position: w('ROUTE_24', 11, 25), direction: 'down', trainerClass: 'youngster', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 14, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('ekans', 'EKANS', 14, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 23), makePokemon('zubat', 'ZUBAT', 14, 'poison', [MOVES.POISON_POWDER, MOVES.GUST], 41, { types: ['poison', 'flying'] })] },
      { id: 'lass_kanto_overworld_7', name: 'CHICA', type: 'npc', position: w('ROUTE_24', 10, 28), direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 14, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('nidoran-f', 'NIDORAN_F', 14, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 29)] },
      { id: 'bugcatcher_kanto_overworld_8', name: 'CAZABICHOS', type: 'npc', position: w('ROUTE_24', 11, 31), direction: 'down', trainerClass: 'bugcatcher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('caterpie', 'CATERPIE', 14, 'bug', [MOVES.STRING_SHOT, MOVES.TACKLE], 10), makePokemon('weedle', 'WEEDLE', 14, 'bug', [MOVES.STRING_SHOT, MOVES.POISON_POWDER], 13, { types: ['bug', 'poison'] })] },
      { id: 'youngster_kanto_overworld_4', name: 'JOVEN', type: 'npc', position: w('ROUTE_25', 14, 2), direction: 'down', trainerClass: 'youngster', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 15, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('spearow', 'SPEAROW', 15, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] })] },
      { id: 'youngster_kanto_overworld_5', name: 'JOVEN', type: 'npc', position: w('ROUTE_25', 18, 5), direction: 'down', trainerClass: 'youngster', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('slowpoke', 'SLOWPOKE', 17, 'water', [MOVES.WATER_GUN, MOVES.CONFUSION], 79, { types: ['water', 'psychic'] })] },
      { id: 'lass_kanto_overworld_8', name: 'CHICA', type: 'npc', position: w('ROUTE_25', 18, 8), direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('nidoran-m', 'NIDORAN_M', 15, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 32), makePokemon('nidoran-f', 'NIDORAN_F', 15, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 29)] },
      { id: 'youngster_kanto_overworld_6', name: 'JOVEN', type: 'npc', position: w('ROUTE_25', 32, 3), direction: 'down', trainerClass: 'youngster', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('ekans', 'EKANS', 14, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 23), makePokemon('sandshrew', 'SANDSHREW', 14, 'ground', [MOVES.DIG, MOVES.TACKLE], 27)] },
      { id: 'lass_kanto_overworld_9', name: 'CHICA', type: 'npc', position: w('ROUTE_25', 37, 4), direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('oddish', 'ODDISH', 13, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 43, { types: ['grass', 'poison'] }), makePokemon('pidgey', 'PIDGEY', 13, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('oddish', 'ODDISH', 13, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 43, { types: ['grass', 'poison'] })] },
      { id: 'hiker_kanto_overworld_1', name: 'MONTAÑERO', type: 'npc', position: w('ROUTE_25', 8, 4), direction: 'down', trainerClass: 'hiker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('machop', 'MACHOP', 15, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 66), makePokemon('geodude', 'GEODUDE', 15, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] })] },
      { id: 'hiker_kanto_overworld_2', name: 'MONTAÑERO', type: 'npc', position: w('ROUTE_25', 23, 9), direction: 'down', trainerClass: 'hiker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 13, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('geodude', 'GEODUDE', 13, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('machop', 'MACHOP', 13, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 66), makePokemon('geodude', 'GEODUDE', 13, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] })] },
      { id: 'hiker_kanto_overworld_3', name: 'MONTAÑERO', type: 'npc', position: w('ROUTE_25', 13, 7), direction: 'down', trainerClass: 'hiker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('onix', 'ONIX', 17, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 95, { types: ['rock', 'ground'] })] },
      { id: 'bugcatcher_kanto_overworld_3', name: 'CAZABICHOS', type: 'npc', position: w('ROUTE_3', 10, 6), direction: 'down', trainerClass: 'bugcatcher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('caterpie', 'CATERPIE', 10, 'bug', [MOVES.STRING_SHOT, MOVES.TACKLE], 10), makePokemon('weedle', 'WEEDLE', 10, 'bug', [MOVES.STRING_SHOT, MOVES.POISON_POWDER], 13, { types: ['bug', 'poison'] }), makePokemon('caterpie', 'CATERPIE', 10, 'bug', [MOVES.STRING_SHOT, MOVES.TACKLE], 10)] },
      { id: 'youngster_kanto_overworld_0', name: 'JOVEN', type: 'npc', position: w('ROUTE_3', 14, 4), direction: 'down', trainerClass: 'youngster', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 11, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('ekans', 'EKANS', 11, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 23)] },
      { id: 'lass_kanto_overworld_0', name: 'CHICA', type: 'npc', position: w('ROUTE_3', 16, 9), direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 9, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('pidgey', 'PIDGEY', 9, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] })] },
      { id: 'bugcatcher_kanto_overworld_4', name: 'CAZABICHOS', type: 'npc', position: w('ROUTE_3', 19, 5), direction: 'down', trainerClass: 'bugcatcher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('weedle', 'WEEDLE', 9, 'bug', [MOVES.STRING_SHOT, MOVES.POISON_POWDER], 13, { types: ['bug', 'poison'] }), makePokemon('kakuna', 'KAKUNA', 9, 'bug', [MOVES.STRING_SHOT, MOVES.POISON_POWDER], 14, { types: ['bug', 'poison'] }), makePokemon('caterpie', 'CATERPIE', 9, 'bug', [MOVES.STRING_SHOT, MOVES.TACKLE], 10), makePokemon('metapod', 'METAPOD', 9, 'bug', [MOVES.STRING_SHOT, MOVES.TACKLE], 11)] },
      { id: 'lass_kanto_overworld_1', name: 'CHICA', type: 'npc', position: w('ROUTE_3', 23, 4), direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 10, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('nidoran-m', 'NIDORAN_M', 10, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 32)] },
      { id: 'youngster_kanto_overworld_1', name: 'JOVEN', type: 'npc', position: w('ROUTE_3', 22, 9), direction: 'down', trainerClass: 'youngster', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('spearow', 'SPEAROW', 14, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] })] },
      { id: 'bugcatcher_kanto_overworld_5', name: 'CAZABICHOS', type: 'npc', position: w('ROUTE_3', 24, 6), direction: 'down', trainerClass: 'bugcatcher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('caterpie', 'CATERPIE', 11, 'bug', [MOVES.STRING_SHOT, MOVES.TACKLE], 10), makePokemon('metapod', 'METAPOD', 11, 'bug', [MOVES.STRING_SHOT, MOVES.TACKLE], 11)] },
      { id: 'lass_kanto_overworld_2', name: 'CHICA', type: 'npc', position: w('ROUTE_3', 33, 10), direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('jigglypuff', 'JIGGLYPUFF', 14, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 39)] },
      { id: 'lass_kanto_overworld_3', name: 'CHICA', type: 'npc', position: w('ROUTE_4', 63, 3), direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('paras', 'PARAS', 31, 'bug', [MOVES.STRING_SHOT, MOVES.VINE_WHIP], 46, { types: ['bug', 'grass'] }), makePokemon('paras', 'PARAS', 31, 'bug', [MOVES.STRING_SHOT, MOVES.VINE_WHIP], 46, { types: ['bug', 'grass'] }), makePokemon('parasect', 'PARASECT', 31, 'bug', [MOVES.STRING_SHOT, MOVES.VINE_WHIP], 47, { types: ['bug', 'grass'] })] },
      { id: 'jrtrainerm_kanto_overworld_3', name: 'ENTRENADOR', type: 'npc', position: w('ROUTE_6', 10, 21), direction: 'down', trainerClass: 'cooltrainer_m', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('squirtle', 'SQUIRTLE', 20, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 7)] },
      { id: 'jrtrainerf_kanto_overworld_1', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_6', 11, 21), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 16, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('pikachu', 'PIKACHU', 16, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 25)] },
      { id: 'jrtrainerm_kanto_overworld_4', name: 'ENTRENADOR', type: 'npc', position: w('ROUTE_6', 11, 31), direction: 'down', trainerClass: 'cooltrainer_m', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('spearow', 'SPEAROW', 16, 'normal', [MOVES.TACKLE, MOVES.GUST], 21, { types: ['normal', 'flying'] }), makePokemon('raticate', 'RATICATE', 16, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 20)] },
      { id: 'jrtrainerf_kanto_overworld_2', name: 'ENTRENADORA', type: 'npc', position: w('ROUTE_6', 11, 30), direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 16, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('pidgey', 'PIDGEY', 16, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('pidgey', 'PIDGEY', 16, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] })] },
      { id: 'bugcatcher_kanto_overworld_10', name: 'CAZABICHOS', type: 'npc', position: w('ROUTE_6', 19, 26), direction: 'down', trainerClass: 'bugcatcher', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('butterfree', 'BUTTERFREE', 20, 'bug', [MOVES.STRING_SHOT, MOVES.GUST], 12, { types: ['bug', 'flying'] })] },
      { id: 'supernerd_kanto_overworld_2', name: 'SABIONDO', type: 'npc', position: w('ROUTE_8', 8, 5), direction: 'down', trainerClass: 'supernerd', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('voltorb', 'VOLTORB', 20, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 100), makePokemon('koffing', 'KOFFING', 20, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('voltorb', 'VOLTORB', 20, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 100), makePokemon('magnemite', 'MAGNEMITE', 20, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 81)] },
      { id: 'gambler_kanto_overworld_4', name: 'GOLFO', type: 'npc', position: w('ROUTE_8', 13, 9), direction: 'down', trainerClass: 'gambler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('poliwag', 'POLIWAG', 22, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 60), makePokemon('poliwag', 'POLIWAG', 22, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 60), makePokemon('poliwhirl', 'POLIWHIRL', 22, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 61)] },
      { id: 'lass_kanto_overworld_12', name: 'CHICA', type: 'npc', position: w('ROUTE_8', 26, 3), direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('nidoran-f', 'NIDORAN_F', 23, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 29), makePokemon('nidorina', 'NIDORINA', 23, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 30)] },
      { id: 'supernerd_kanto_overworld_4', name: 'SABIONDO', type: 'npc', position: w('ROUTE_8', 26, 4), direction: 'down', trainerClass: 'supernerd', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('koffing', 'KOFFING', 26, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109)] },
      { id: 'lass_kanto_overworld_13', name: 'CHICA', type: 'npc', position: w('ROUTE_8', 26, 5), direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('meowth', 'MEOWTH', 24, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 52), makePokemon('meowth', 'MEOWTH', 24, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 52), makePokemon('meowth', 'MEOWTH', 24, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 52)] },
      { id: 'lass_kanto_overworld_14', name: 'CHICA', type: 'npc', position: w('ROUTE_8', 26, 6), direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 19, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('rattata', 'RATTATA', 19, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('nidoran-m', 'NIDORAN_M', 19, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 32), makePokemon('meowth', 'MEOWTH', 19, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 52), makePokemon('pikachu', 'PIKACHU', 19, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 25)] },
      { id: 'hiker_kanto_overworld_10', name: 'MONTAÑERO', type: 'npc', position: w('ROUTE_9', 16, 15), direction: 'down', trainerClass: 'hiker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('machop', 'MACHOP', 20, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 66), makePokemon('onix', 'ONIX', 20, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 95, { types: ['rock', 'ground'] })] },
    ],

    // ── Indoor maps (positions unchanged — all local coords) ─────────────────
    PLAYERS_HOUSE_1F: [
      {
        id: 'mom',
        name: 'MAMÁ',
        type: 'npc',
        onInteract: 'heal',
        trainerClass: 'mom',
        position: { x: 5, y: 4 },
        direction: 'down',
        dialogue: playerTeam.length === 0
          ? ["¡Todos los chicos se van de casa algún día. ¡Lo dijeron en la tele!"]
          : ["¡Red! Pareces cansado. Deja que cuide de tus POKÉMON."]
      }
    ],
    PLAYERS_HOUSE_2F: [],
    RIVALS_HOUSE: [
      {
        id: 'daisy',
        name: 'MARGARITA',
        type: 'npc',
        position: { x: 5, y: 4 },
        direction: 'down',
        trainerClass: 'daisy',
        onInteract: 'give_town_map',
        dialogue: !hasPokedex
          ? ["¡Hola, Pablo! ¡Azul está en el laboratorio del abuelo!"]
          : ["¡Cuida bien de tus POKÉMON!"]
      }
    ],
    OAKS_LAB: [
      ...(storyStep !== 'START' ? [{
        id: 'oak',
        name: 'PROF. OAK',
        type: 'npc' as const,
        onInteract: 'oak_parcel_turnin' as const,
        trainerClass: 'oak',
        position: { x: 4, y: 2 },
        direction: 'down' as const,
        dialogue: hasParcel
          ? ["¡Oh! ¡Es el paquete que pedí!", "¡Gracias! Como recompensa, tomad esto: ¡Una POKÉDEX!", "¡Es un inventario de alta tecnología!"]
          : hasPokedex
            ? ["¡La POKÉDEX es un gran invento!", "¡Trata de capturarlos a todos!"]
            : ["¡Hola Pablo! Por fin llegas.", "Toma uno de estos POKÉMON, te ayudará en tu viaje."]
      }] : []),
      { id: 'rival', name: 'AZUL', type: 'npc', position: { x: 6, y: 3 }, direction: 'left', trainerClass: 'rival', dialogue: ["¡Abuelo! ¡Yo también quiero un POKÉMON!", "¡Ja! Mi POKÉMON es mucho más fuerte que el tuyo."], isRival: true }
    ,
      { id: 'rival1_oaks_lab_0', name: 'AZUL', type: 'npc', position: { x: 4, y: 3 }, direction: 'down', trainerClass: 'rival', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('squirtle', 'SQUIRTLE', 5, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 7)] },
    ],
    POKECENTER: [
      { id: 'joy', name: 'ENFERMERA JOY', type: 'npc', onInteract: 'heal', trainerClass: 'nurse', position: { x: 6, y: 2 }, direction: 'down', dialogue: ["¡Hola! Bienvenida al CENTRO POKÉMON.", "Curaremos a tus POKÉMON hasta que estén a tope."] }
    ],
    POKEMART: [
      {
        id: 'clerk',
        name: 'DEPENDIENTE',
        type: 'npc',
        position: { x: 4, y: 2 },
        direction: 'down',
        trainerClass: 'clerk',
        onInteract: 'shop',
        dialogue: (!hasParcel && !hasPokedex)
          ? ["¡Ah! ¡Tú vienes de PUEBLO PALETA!", "Tengo un paquete para el PROF. OAK. ¿Se lo llevarías?", "¡Gracias! Dile que es de parte de la TIENDA."]
          : ["¡Hola! ¿En qué puedo ayudarte hoy?"]
      },
    ],
    MT_MOON: [
      { id: 'hiker_mtmoon', name: 'MONTAÑERO MARCOS', type: 'npc', position: { x: 6, y: 10 }, direction: 'down', trainerClass: 'hiker', dialogue: ["¡Las rocas son mis amigas!", "¡Te aplastaré!"], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 10, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 74, { types: ['rock', 'ground'] }), makePokemon('geodude', 'GEODUDE', 10, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 74, { types: ['rock', 'ground'] }), makePokemon('onix', 'ONIX', 10, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 95, { types: ['rock', 'ground'] })] },
      { id: 'rocket_mtmoon', name: 'SOLDADO ROCKET', type: 'npc', position: { x: 12, y: 5 }, direction: 'left', trainerClass: 'rocket', dialogue: ["¡El TEAM ROCKET se hará con todos los fósiles de MT MOON!"], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 11, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19), makePokemon('zubat', 'ZUBAT', 11, 'poison', [MOVES.TACKLE], 41, { types: ['poison', 'flying'] })] },
    
      { id: 'hiker_mt_moon_0', name: 'MONTAÑERO', type: 'npc', position: { x: 5, y: 6 }, direction: 'down', trainerClass: 'hiker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 10, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('geodude', 'GEODUDE', 10, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('onix', 'ONIX', 10, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 95, { types: ['rock', 'ground'] })] },
      { id: 'youngster_mt_moon_2', name: 'JOVEN', type: 'npc', position: { x: 12, y: 16 }, direction: 'down', trainerClass: 'youngster', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 10, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('rattata', 'RATTATA', 10, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('zubat', 'ZUBAT', 10, 'poison', [MOVES.POISON_POWDER, MOVES.GUST], 41, { types: ['poison', 'flying'] })] },
    ],
    MT_MOON_B1F: [
      { id: 'supernerd_mtmoon', name: 'SABIONDO MIGUEL', type: 'npc', position: { x: 8, y: 15 }, direction: 'left', trainerClass: 'supernerd', dialogue: ["¡Yo domino los fósiles and science!", "¡Mis POKÉMON son experimentos!"], isTrainer: true, trainerTeam: [makePokemon('grimer', 'GRIMER', 11, 'poison', [MOVES.POUND, MOVES.POISON_POWDER], 88, { types: ['poison'] }), makePokemon('voltorb', 'VOLTORB', 11, 'electric', [MOVES.TACKLE, MOVES.THUNDERSHOCK], 100, { types: ['electric'] }), makePokemon('koffing', 'KOFFING', 11, 'poison', [MOVES.TACKLE, MOVES.POISON_POWDER], 109, { types: ['poison'] })] }
    ],
    MT_MOON_B2F: [
      { id: 'lass_mtmoon', name: 'CHICA IRIS', type: 'npc', position: { x: 15, y: 10 }, direction: 'down', trainerClass: 'lass', dialogue: ["¡Las plantas son preciosas!", "¡Pero también pican!"], isTrainer: true, trainerTeam: [makePokemon('oddish', 'ODDISH', 14, 'grass', [MOVES.POUND, MOVES.SLEEP_POWDER], 43, { types: ['grass', 'poison'] }), makePokemon('bellsprout', 'BELLSPROUT', 14, 'grass', [MOVES.VINE_WHIP, MOVES.GROWL], 69, { types: ['grass', 'poison'] })] }
    ,
      { id: 'rocket_mt_moon_b2f_0', name: 'SOLDADO ROCKET', type: 'npc', position: { x: 11, y: 16 }, direction: 'down', trainerClass: 'rocket', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 13, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 19), makePokemon('zubat', 'ZUBAT', 13, 'poison', [MOVES.POISON_POWDER, MOVES.GUST], 41, { types: ['poison', 'flying'] })] },
    ],
    PEWTER_GYM: [
      { id: 'gym_trainer', name: 'CAMPISTA JERRY', type: 'npc', position: { x: 4, y: 7 }, direction: 'right', trainerClass: 'hiker', dialogue: ["¡Alto ahí!", "¡No eres rival para BROCK!"], isTrainer: true, trainerTeam: [makePokemon('diglett', 'DIGLETT', 10, 'ground', [MOVES.SCRATCH], 74), makePokemon('sandshrew', 'SANDSHREW', 10, 'ground', [MOVES.SCRATCH], 93)] },
      { id: 'brock', name: 'BROCK', type: 'npc', position: { x: 4, y: 2 }, direction: 'down', trainerClass: 'brock', dialogue: ["¡Soy BROCK!", "¡Soy el líder de gimnasio de Ciudad Plateada!", "Mis POKÉMON son tipo roca."], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 12, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 86, { types: ['rock', 'ground'] }), makePokemon('onix', 'ONIX', 14, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 108, { types: ['rock', 'ground'] })] }
    ,
      { id: 'brock_pewter_gym_0', name: 'BROCK', type: 'npc', position: { x: 4, y: 1 }, direction: 'down', trainerClass: 'brock', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 12, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('onix', 'ONIX', 14, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 95, { types: ['rock', 'ground'] })] },
      { id: 'jrtrainerm_pewter_gym_0', name: 'ENTRENADOR', type: 'npc', position: { x: 3, y: 6 }, direction: 'down', trainerClass: 'cooltrainer_m', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('diglett', 'DIGLETT', 11, 'ground', [MOVES.DIG, MOVES.TACKLE], 50), makePokemon('sandshrew', 'SANDSHREW', 11, 'ground', [MOVES.DIG, MOVES.TACKLE], 27)] },
    ],
    CERULEAN_GYM: [
      { id: 'swimmer_cerulean_gym', name: 'NADADOR LUIS', type: 'npc', position: { x: 7, y: 4 }, direction: 'left', trainerClass: 'swimmer', dialogue: ['¡No permito que cualquiera vea a MISTY!', '¡Solo los mejores pueden desafiarla!'], isTrainer: true, trainerTeam: [makePokemon('horsea', 'HORSEA', 16, 'water', [MOVES.WATER_GUN], 116, { types: ['water'] }), makePokemon('shellder', 'SHELLDER', 16, 'water', [MOVES.TACKLE, MOVES.WATER_GUN], 90, { types: ['water'] })] },
      { id: 'misty', name: 'MISTY', type: 'npc', position: { x: 5, y: 2 }, direction: 'down', trainerClass: 'misty', dialogue: ['¡Soy MISTY!', '¡La líder del gimnasio de CIUDAD CELESTE!', '¡Mis POKÉMON de agua son invencibles!'], isTrainer: true, trainerTeam: [makePokemon('staryu', 'STARYU', 18, 'water', [MOVES.TACKLE, MOVES.WATER_GUN], 120, { types: ['water'] }), makePokemon('starmie', 'STARMIE', 21, 'water', [MOVES.TACKLE, MOVES.WATER_GUN, MOVES.BUBBLEBEAM], 121, { types: ['water', 'psychic'] })] },
    
      { id: 'misty_cerulean_gym_0', name: 'MISTY', type: 'npc', position: { x: 4, y: 2 }, direction: 'down', trainerClass: 'misty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('staryu', 'STARYU', 18, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 120), makePokemon('starmie', 'STARMIE', 21, 'water', [MOVES.WATER_GUN, MOVES.CONFUSION], 121, { types: ['water', 'psychic'] })] },
      { id: 'jrtrainerf_cerulean_gym_0', name: 'ENTRENADORA', type: 'npc', position: { x: 2, y: 3 }, direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('goldeen', 'GOLDEEN', 19, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 118)] },
      { id: 'swimmer_cerulean_gym_0', name: 'NADADOR', type: 'npc', position: { x: 8, y: 7 }, direction: 'down', trainerClass: 'swimmer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('horsea', 'HORSEA', 16, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 116), makePokemon('shellder', 'SHELLDER', 16, 'water', [MOVES.WATER_GUN, MOVES.TACKLE], 90)] },
    ],
    VERMILION_GYM: [
      { id: 'sailor_ver_gym_1', name: 'MARINERO DMITRI', type: 'npc', position: { x: 7, y: 6 }, direction: 'left', trainerClass: 'sailor', dialogue: ['¡No pasarás!', '¡El TENIENTE SURGE no tiene tiempo para novatos!'], isTrainer: true, trainerTeam: [makePokemon('pikachu', 'PIKACHU', 21, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 25, { types: ['electric'] }), makePokemon('pikachu', 'PIKACHU', 21, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 25, { types: ['electric'] })] },
      { id: 'lt_surge', name: 'TENIENTE SURGE', type: 'npc', position: { x: 5, y: 2 }, direction: 'down', trainerClass: 'lt_surge', dialogue: ['¡Soy el TENIENTE SURGE!', '¡Líder del gimnasio de CIUDAD CARMÍN!', '¡Mis POKÉMON eléctricos te electrocutarán!'], isTrainer: true, trainerTeam: [makePokemon('voltorb', 'VOLTORB', 21, 'electric', [MOVES.TACKLE, MOVES.THUNDERSHOCK], 100, { types: ['electric'] }), makePokemon('pikachu', 'PIKACHU', 18, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 25, { types: ['electric'] }), makePokemon('raichu', 'RAICHU', 24, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE, MOVES.THUNDERSHOCK], 26, { types: ['electric'] })] },
    
      { id: 'ltsurge_vermilion_gym_0', name: 'TENIENTE SURGE', type: 'npc', position: { x: 5, y: 1 }, direction: 'down', trainerClass: 'lt_surge', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('voltorb', 'VOLTORB', 21, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 100), makePokemon('pikachu', 'PIKACHU', 18, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 25), makePokemon('raichu', 'RAICHU', 24, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 26)] },
      { id: 'rocker_vermilion_gym_0', name: 'ROCKERO', type: 'npc', position: { x: 3, y: 8 }, direction: 'down', trainerClass: 'rocker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('voltorb', 'VOLTORB', 20, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 100), makePokemon('magnemite', 'MAGNEMITE', 20, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 81), makePokemon('voltorb', 'VOLTORB', 20, 'electric', [MOVES.THUNDERSHOCK, MOVES.TACKLE], 100)] },
    ],
    ROCK_TUNNEL_1F: [
      { id: 'hiker_rock_tunnel_1f_11', name: 'MONTAÑERO', type: 'npc', position: { x: 7, y: 5 }, direction: 'down', trainerClass: 'hiker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 19, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('machop', 'MACHOP', 19, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 66), makePokemon('geodude', 'GEODUDE', 19, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('geodude', 'GEODUDE', 19, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] })] },
      { id: 'hiker_rock_tunnel_1f_12', name: 'MONTAÑERO', type: 'npc', position: { x: 5, y: 16 }, direction: 'down', trainerClass: 'hiker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('onix', 'ONIX', 20, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 95, { types: ['rock', 'ground'] }), makePokemon('onix', 'ONIX', 20, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 95, { types: ['rock', 'ground'] }), makePokemon('geodude', 'GEODUDE', 20, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] })] },
      { id: 'hiker_rock_tunnel_1f_13', name: 'MONTAÑERO', type: 'npc', position: { x: 17, y: 15 }, direction: 'down', trainerClass: 'hiker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 21, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('graveler', 'GRAVELER', 21, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 75, { types: ['rock', 'ground'] })] },
    ],
    ROCK_TUNNEL_B1F: [
      { id: 'jrtrainerf_rock_tunnel_b1f_8', name: 'ENTRENADORA', type: 'npc', position: { x: 11, y: 13 }, direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('jigglypuff', 'JIGGLYPUFF', 21, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 39), makePokemon('pidgey', 'PIDGEY', 21, 'normal', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('meowth', 'MEOWTH', 21, 'normal', [MOVES.TACKLE, MOVES.TACKLE], 52)] },
      { id: 'hiker_rock_tunnel_b1f_8', name: 'MONTAÑERO', type: 'npc', position: { x: 6, y: 10 }, direction: 'down', trainerClass: 'hiker', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 21, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('geodude', 'GEODUDE', 21, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 74, { types: ['rock', 'ground'] }), makePokemon('graveler', 'GRAVELER', 21, 'rock', [MOVES.ROCK_THROW, MOVES.DIG], 75, { types: ['rock', 'ground'] })] },
      { id: 'pokemaniac_rock_tunnel_b1f_2', name: 'POKÉMANÍACO', type: 'npc', position: { x: 3, y: 5 }, direction: 'down', trainerClass: 'pokemaniac', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('slowpoke', 'SLOWPOKE', 20, 'water', [MOVES.WATER_GUN, MOVES.CONFUSION], 79, { types: ['water', 'psychic'] }), makePokemon('slowpoke', 'SLOWPOKE', 20, 'water', [MOVES.WATER_GUN, MOVES.CONFUSION], 79, { types: ['water', 'psychic'] }), makePokemon('slowpoke', 'SLOWPOKE', 20, 'water', [MOVES.WATER_GUN, MOVES.CONFUSION], 79, { types: ['water', 'psychic'] })] },
    ],
    CELADON_GYM: [
      { id: 'lass_celadon_gym', name: 'CHICA LINA', type: 'npc', position: { x: 3, y: 7 }, direction: 'right', trainerClass: 'lass', dialogue: ['¡No puedes pasar!', '¡ERIKA es demasiado buena para novatos!'], isTrainer: true, trainerTeam: [makePokemon('bellsprout', 'BELLSPROUT', 23, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 69, { types: ['grass', 'poison'] }), makePokemon('weepinbell', 'WEEPINBELL', 23, 'grass', [MOVES.VINE_WHIP, MOVES.SLEEP_POWDER], 70, { types: ['grass', 'poison'] })] },
      { id: 'lass_celadon_gym2', name: 'CHICA MARTA', type: 'npc', position: { x: 8, y: 5 }, direction: 'left', trainerClass: 'lass', dialogue: ['¡Me encantan las plantas!', '¡Pero en batalla son letales!'], isTrainer: true, trainerTeam: [makePokemon('oddish', 'ODDISH', 23, 'grass', [MOVES.POUND, MOVES.SLEEP_POWDER], 43, { types: ['grass', 'poison'] }), makePokemon('gloom', 'GLOOM', 23, 'grass', [MOVES.POUND, MOVES.POISON_POWDER], 44, { types: ['grass', 'poison'] })] },
      { id: 'erika', name: 'ERIKA', type: 'npc', position: { x: 5, y: 2 }, direction: 'down', trainerClass: 'erika', dialogue: ['¡Soy ERIKA!', '¡Líder del gimnasio de CIUDAD AZULONA!', '¡Mis POKÉMON planta son hermosos y fuertes!'], isTrainer: true, trainerTeam: [makePokemon('victreebel', 'VICTREEBEL', 29, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER, MOVES.RAZOR_LEAF], 71, { types: ['grass', 'poison'] }), makePokemon('tangela', 'TANGELA', 24, 'grass', [MOVES.VINE_WHIP, MOVES.SLEEP_POWDER], 114, { types: ['grass'] }), makePokemon('vileplume', 'VILEPLUME', 29, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER, MOVES.RAZOR_LEAF], 45, { types: ['grass', 'poison'] })] },
    
      { id: 'erika_celadon_gym_0', name: 'ERIKA', type: 'npc', position: { x: 4, y: 3 }, direction: 'down', trainerClass: 'erika', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('victreebel', 'VICTREEBEL', 29, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 71, { types: ['grass', 'poison'] }), makePokemon('tangela', 'TANGELA', 24, 'grass', [MOVES.VINE_WHIP, MOVES.TACKLE], 114), makePokemon('vileplume', 'VILEPLUME', 29, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 45, { types: ['grass', 'poison'] })] },
      { id: 'lass_celadon_gym_16', name: 'CHICA', type: 'npc', position: { x: 2, y: 11 }, direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('bellsprout', 'BELLSPROUT', 23, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 69, { types: ['grass', 'poison'] }), makePokemon('weepinbell', 'WEEPINBELL', 23, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 70, { types: ['grass', 'poison'] })] },
      { id: 'beauty_celadon_gym_0', name: 'BELLEZA', type: 'npc', position: { x: 7, y: 10 }, direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('oddish', 'ODDISH', 21, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 43, { types: ['grass', 'poison'] }), makePokemon('bellsprout', 'BELLSPROUT', 21, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 69, { types: ['grass', 'poison'] }), makePokemon('oddish', 'ODDISH', 21, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 43, { types: ['grass', 'poison'] }), makePokemon('bellsprout', 'BELLSPROUT', 21, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 69, { types: ['grass', 'poison'] })] },
      { id: 'beauty_celadon_gym_1', name: 'BELLEZA', type: 'npc', position: { x: 1, y: 5 }, direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('bellsprout', 'BELLSPROUT', 24, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 69, { types: ['grass', 'poison'] }), makePokemon('bellsprout', 'BELLSPROUT', 24, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 69, { types: ['grass', 'poison'] })] },
      { id: 'lass_celadon_gym_17', name: 'CHICA', type: 'npc', position: { x: 6, y: 3 }, direction: 'down', trainerClass: 'lass', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('oddish', 'ODDISH', 23, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 43, { types: ['grass', 'poison'] }), makePokemon('gloom', 'GLOOM', 23, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 44, { types: ['grass', 'poison'] })] },
      { id: 'beauty_celadon_gym_2', name: 'BELLEZA', type: 'npc', position: { x: 3, y: 3 }, direction: 'down', trainerClass: 'beauty', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('exeggcute', 'EXEGGCUTE', 26, 'grass', [MOVES.VINE_WHIP, MOVES.CONFUSION], 102, { types: ['grass', 'psychic'] })] },
      { id: 'cooltrainerf_celadon_gym_0', name: 'ENTRENADORA', type: 'npc', position: { x: 5, y: 3 }, direction: 'down', trainerClass: 'cooltrainer_f', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('weepinbell', 'WEEPINBELL', 24, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 70, { types: ['grass', 'poison'] }), makePokemon('gloom', 'GLOOM', 24, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 44, { types: ['grass', 'poison'] }), makePokemon('ivysaur', 'IVYSAUR', 24, 'grass', [MOVES.VINE_WHIP, MOVES.POISON_POWDER], 2, { types: ['grass', 'poison'] })] },
    ],
    FUCHSIA_GYM: [
      { id: 'juggler_fuchsia_gym', name: 'MALABARISTA KAY', type: 'npc', position: { x: 7, y: 5 }, direction: 'left', trainerClass: 'juggler', dialogue: ['¡KOGA es un maestro ninja!', '¡No llegarás a verlo!'], isTrainer: true, trainerTeam: [makePokemon('koffing', 'KOFFING', 30, 'poison', [MOVES.TACKLE, MOVES.POISON_POWDER], 109, { types: ['poison'] })] },
      { id: 'koga', name: 'KOGA', type: 'npc', position: { x: 5, y: 2 }, direction: 'down', trainerClass: 'koga', dialogue: ['¡Soy KOGA!', '¡Líder del gimnasio de CIUDAD FUCSIA!', '¡Mis tácticas ninja y POKÉMON veneno te derrotarán!'], isTrainer: true, trainerTeam: [makePokemon('koffing', 'KOFFING', 37, 'poison', [MOVES.TACKLE, MOVES.POISON_POWDER], 109, { types: ['poison'] }), makePokemon('muk', 'MUK', 39, 'poison', [MOVES.POUND, MOVES.POISON_POWDER], 89, { types: ['poison'] }), makePokemon('koffing', 'KOFFING', 37, 'poison', [MOVES.TACKLE, MOVES.POISON_POWDER], 109, { types: ['poison'] }), makePokemon('weezing', 'WEEZING', 43, 'poison', [MOVES.TACKLE, MOVES.POISON_POWDER, MOVES.TACKLE], 110, { types: ['poison'] })] },
    
      { id: 'koga_fuchsia_gym_0', name: 'KOGA', type: 'npc', position: { x: 4, y: 10 }, direction: 'down', trainerClass: 'koga', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('koffing', 'KOFFING', 37, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('muk', 'MUK', 39, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 89), makePokemon('koffing', 'KOFFING', 37, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 109), makePokemon('weezing', 'WEEZING', 43, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 110)] },
      { id: 'juggler_fuchsia_gym_2', name: 'MALABARISTA', type: 'npc', position: { x: 7, y: 8 }, direction: 'down', trainerClass: 'juggler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('drowzee', 'DROWZEE', 31, 'psychic', [MOVES.CONFUSION, MOVES.TACKLE], 96), makePokemon('drowzee', 'DROWZEE', 31, 'psychic', [MOVES.CONFUSION, MOVES.TACKLE], 96), makePokemon('kadabra', 'KADABRA', 31, 'psychic', [MOVES.CONFUSION, MOVES.TACKLE], 64), makePokemon('drowzee', 'DROWZEE', 31, 'psychic', [MOVES.CONFUSION, MOVES.TACKLE], 96)] },
      { id: 'juggler_fuchsia_gym_7', name: 'MALABARISTA', type: 'npc', position: { x: 1, y: 12 }, direction: 'down', trainerClass: 'juggler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('drowzee', 'DROWZEE', 34, 'psychic', [MOVES.CONFUSION, MOVES.TACKLE], 96), makePokemon('kadabra', 'KADABRA', 34, 'psychic', [MOVES.CONFUSION, MOVES.TACKLE], 64)] },
      { id: 'tamer_fuchsia_gym_0', name: 'DOMADOR', type: 'npc', position: { x: 3, y: 5 }, direction: 'down', trainerClass: 'tamer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('sandslash', 'SANDSLASH', 34, 'ground', [MOVES.DIG, MOVES.TACKLE], 28), makePokemon('arbok', 'ARBOK', 34, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 24)] },
      { id: 'tamer_fuchsia_gym_1', name: 'DOMADOR', type: 'npc', position: { x: 8, y: 2 }, direction: 'down', trainerClass: 'tamer', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('arbok', 'ARBOK', 33, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 24), makePokemon('sandslash', 'SANDSLASH', 33, 'ground', [MOVES.DIG, MOVES.TACKLE], 28), makePokemon('arbok', 'ARBOK', 33, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 24)] },
      { id: 'juggler_fuchsia_gym_3', name: 'MALABARISTA', type: 'npc', position: { x: 2, y: 7 }, direction: 'down', trainerClass: 'juggler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('drowzee', 'DROWZEE', 34, 'psychic', [MOVES.CONFUSION, MOVES.TACKLE], 96), makePokemon('hypno', 'HYPNO', 34, 'psychic', [MOVES.CONFUSION, MOVES.TACKLE], 97)] },
    ],
    SAFFRON_GYM: [
      { id: 'sabrina', name: 'SABRINA', type: 'npc', position: { x: 5, y: 2 }, direction: 'down', trainerClass: 'sabrina', dialogue: ['...Soy SABRINA...', 'Líder del gimnasio de CIUDAD AZAFRÁN.', '...Tu mente es débil...'], isTrainer: true, trainerTeam: [makePokemon('kadabra', 'KADABRA', 38, 'psychic', [MOVES.POUND, MOVES.TACKLE], 64, { types: ['psychic'] }), makePokemon('venomoth', 'VENOMOTH', 38, 'bug', [MOVES.TACKLE, MOVES.POISON_POWDER], 49, { types: ['bug', 'poison'] }), makePokemon('alakazam', 'ALAKAZAM', 43, 'psychic', [MOVES.POUND, MOVES.TACKLE], 65, { types: ['psychic'] })] },
    
      { id: 'channeler_saffron_gym_22', name: 'CANALERA', type: 'npc', position: { x: 3, y: 7 }, direction: 'down', trainerClass: 'channeler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('haunter', 'HAUNTER', 38, 'ghost', [MOVES.LICK, MOVES.POISON_POWDER], 93, { types: ['ghost', 'poison'] })] },
      { id: 'psychic_saffron_gym_3', name: 'PSÍQUICO', type: 'npc', position: { x: 3, y: 1 }, direction: 'down', trainerClass: 'psychic', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('slowbro', 'SLOWBRO', 38, 'water', [MOVES.WATER_GUN, MOVES.CONFUSION], 80, { types: ['water', 'psychic'] })] },
    ],
    CINNABAR_GYM: [
      { id: 'blaine', name: 'BLAINE', type: 'npc', position: { x: 5, y: 2 }, direction: 'down', trainerClass: 'blaine', dialogue: ['¡Soy BLAINE!', '¡Líder del gimnasio de ISLA CANELA!', '¡Mis POKÉMON fuego arden con pasión!'], isTrainer: true, trainerTeam: [makePokemon('growlithe', 'GROWLITHE', 42, 'fire', [MOVES.EMBER, MOVES.TACKLE], 58, { types: ['fire'] }), makePokemon('ponyta', 'PONYTA', 40, 'fire', [MOVES.EMBER, MOVES.TACKLE], 77, { types: ['fire'] }), makePokemon('rapidash', 'RAPIDASH', 42, 'fire', [MOVES.EMBER, MOVES.TACKLE, MOVES.SLASH], 78, { types: ['fire'] }), makePokemon('arcanine', 'ARCANINE', 47, 'fire', [MOVES.EMBER, MOVES.TACKLE, MOVES.SLASH], 59, { types: ['fire'] })] },
    
      { id: 'blaine_cinnabar_gym_0', name: 'BLAINE', type: 'npc', position: { x: 3, y: 3 }, direction: 'down', trainerClass: 'blaine', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('growlithe', 'GROWLITHE', 42, 'fire', [MOVES.EMBER, MOVES.TACKLE], 58), makePokemon('ponyta', 'PONYTA', 40, 'fire', [MOVES.EMBER, MOVES.TACKLE], 77), makePokemon('rapidash', 'RAPIDASH', 42, 'fire', [MOVES.EMBER, MOVES.TACKLE], 78), makePokemon('arcanine', 'ARCANINE', 47, 'fire', [MOVES.EMBER, MOVES.TACKLE], 59)] },
      { id: 'supernerd_cinnabar_gym_11', name: 'SABIONDO', type: 'npc', position: { x: 3, y: 8 }, direction: 'down', trainerClass: 'supernerd', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('growlithe', 'GROWLITHE', 37, 'fire', [MOVES.EMBER, MOVES.TACKLE], 58), makePokemon('vulpix', 'VULPIX', 37, 'fire', [MOVES.EMBER, MOVES.TACKLE], 37)] },
    ],
    VIRIDIAN_GYM: [
      { id: 'giovanni', name: 'GIOVANNI', type: 'npc', position: { x: 5, y: 2 }, direction: 'down', trainerClass: 'giovanni', dialogue: ['...Bienvenido...', 'Soy GIOVANNI, el líder de CIUDAD VERDE.', '¡Prepárate para perder!'], isTrainer: true, trainerTeam: [makePokemon('nidorino', 'NIDORINO', 37, 'poison', [MOVES.TACKLE, MOVES.POISON_POWDER], 33, { types: ['poison'] }), makePokemon('kangaskhan', 'KANGASKHAN', 35, 'normal', [MOVES.TACKLE, MOVES.SLASH], 115, { types: ['normal'] }), makePokemon('rhyhorn', 'RHYHORN', 37, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 111, { types: ['ground', 'rock'] }), makePokemon('nidoqueen', 'NIDOQUEEN', 41, 'poison', [MOVES.TACKLE, MOVES.ROCK_THROW], 31, { types: ['poison', 'ground'] }), makePokemon('rhydon', 'RHYDON', 45, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW, MOVES.SLASH], 112, { types: ['ground', 'rock'] })] },
    
      { id: 'giovanni_viridian_gym_2', name: 'GIOVANNI', type: 'npc', position: { x: 2, y: 1 }, direction: 'down', trainerClass: 'giovanni', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('rhyhorn', 'RHYHORN', 45, 'ground', [MOVES.DIG, MOVES.ROCK_THROW], 111, { types: ['ground', 'rock'] }), makePokemon('dugtrio', 'DUGTRIO', 42, 'ground', [MOVES.DIG, MOVES.TACKLE], 51), makePokemon('nidoqueen', 'NIDOQUEEN', 44, 'poison', [MOVES.POISON_POWDER, MOVES.DIG], 31, { types: ['poison', 'ground'] }), makePokemon('nidoking', 'NIDOKING', 45, 'poison', [MOVES.POISON_POWDER, MOVES.DIG], 34, { types: ['poison', 'ground'] }), makePokemon('rhydon', 'RHYDON', 50, 'ground', [MOVES.DIG, MOVES.ROCK_THROW], 112, { types: ['ground', 'rock'] })] },
      { id: 'blackbelt_viridian_gym_6', name: 'KARATEKA', type: 'npc', position: { x: 3, y: 7 }, direction: 'down', trainerClass: 'blackbelt', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('machoke', 'MACHOKE', 43, 'fighting', [MOVES.DOUBLE_KICK, MOVES.TACKLE], 67)] },
      { id: 'cooltrainerm_viridian_gym_0', name: 'ENTRENADOR', type: 'npc', position: { x: 6, y: 5 }, direction: 'down', trainerClass: 'cooltrainer_m', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('nidorino', 'NIDORINO', 39, 'poison', [MOVES.POISON_POWDER, MOVES.TACKLE], 33), makePokemon('nidoking', 'NIDOKING', 39, 'poison', [MOVES.POISON_POWDER, MOVES.DIG], 34, { types: ['poison', 'ground'] })] },
    ],
    POKEMON_TOWER_1F: [
      { id: 'door_pokemon_tower_internal', type: 'object', position: { x: 10, y: 16 }, direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
    ],
    POKEMON_TOWER_2F: [],
    POKEMON_TOWER_3F: [
      ...(!hasSilphScope ? [{
        id: 'tower_3f_ghost',
        name: 'FANTASMA',
        type: 'npc' as const,
        position: { x: 10, y: 2 },
        direction: 'down' as Direction,
        trainerClass: 'ghost',
        dialogue: ['¡Un FANTASMA horrible bloquea el paso!', 'Necesitas el ALCANCE SILPH para verlo.'],
      }] : []),
      ...(hasSilphScope && !hasPokeFlute ? [{
        id: 'mr_fuji',
        name: 'SR. FUJI',
        type: 'npc' as const,
        position: { x: 10, y: 8 },
        direction: 'down' as Direction,
        trainerClass: 'old_man',
        onInteract: 'give_poke_flute' as const,
        dialogue: ['Gracias por liberar esta torre de los ROCKET...', '¡Toma esta FLAUTA POKé como agradecimiento!'],
      }] : []),
    
      { id: 'channeler_pokemon_tower_3f_4', name: 'CANALERA', type: 'npc', position: { x: 12, y: 3 }, direction: 'down', trainerClass: 'channeler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('gastly', 'GASTLY', 23, 'ghost', [MOVES.LICK, MOVES.POISON_POWDER], 92, { types: ['ghost', 'poison'] })] },
      { id: 'channeler_pokemon_tower_3f_5', name: 'CANALERA', type: 'npc', position: { x: 9, y: 8 }, direction: 'down', trainerClass: 'channeler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('gastly', 'GASTLY', 24, 'ghost', [MOVES.LICK, MOVES.POISON_POWDER], 92, { types: ['ghost', 'poison'] })] },
      { id: 'channeler_pokemon_tower_3f_7', name: 'CANALERA', type: 'npc', position: { x: 10, y: 13 }, direction: 'down', trainerClass: 'channeler', dialogue: ['\u00A1Prep\u00E1rate para luchar!'], isTrainer: true, trainerTeam: [makePokemon('gastly', 'GASTLY', 22, 'ghost', [MOVES.LICK, MOVES.POISON_POWDER], 92, { types: ['ghost', 'poison'] })] },
    ],
    BILLS_HOUSE: [
      {
        id: 'bill', name: 'BILL', type: 'npc' as const,
        position: { x: 3, y: 2 }, direction: 'down' as Direction,
        trainerClass: 'scientist',
        onInteract: 'give_ss_ticket' as const,
        dialogue: hasSsTicket
          ? ['¡Ya tienes tu BILLETE SS! El barco está en CIUDAD CARMÍN.']
          : ['¡Mi teletransportador falló y quedé atrapado en el cuerpo de un POKÉMON!',
             '¡Solucioné el problema! ¡Toma este BILLETE SS como agradecimiento!']
      },
    ],
  } as unknown as Record<MapID, NPC[]>;
}

export function buildItemDatabase(pickedItemIds: string[], storyStep: string): Record<MapID, Entity[]> {
  const rawItems: Record<MapID, Entity[]> = {
    KANTO_OVERWORLD: [
      // ── Pallet Town ──
      { id: 'sign_home',  type: 'object', position: w('PALLET_TOWN', 2, 5),   direction: 'down', sprite: '🪧', dialogue: ['CASA DE RED'] },
      { id: 'sign_rival_pallet', type: 'object', position: w('PALLET_TOWN', 12, 5), direction: 'down', sprite: '🪧', dialogue: ['CASA DE AZUL'] },
      { id: 'sign_lab',   type: 'object', position: w('PALLET_TOWN', 18, 15),  direction: 'down', sprite: '🪧', dialogue: ['LAB. POKÉMON DEL PROF. OAK'] },
      { id: 'sign_town',  type: 'object', position: w('PALLET_TOWN', 11, 9), direction: 'down', sprite: '🪧', dialogue: ['PUEBLO PALETA', 'Un lugar de sombra y tonos puros.'] },
      ...(storyStep === 'START' ? [
        { id: 'lab_locked', type: 'object' as const, position: w('PALLET_TOWN', 16, 14), direction: 'down' as const, sprite: '🚫', dialogue: ['Está cerrado.'] },
      ] : []),
      // ── Route 1 ──
      { id: 'sign_route1',    type: 'object', position: w('ROUTE_1', 9, 27), direction: 'down', sprite: '🪧', dialogue: ['RUTA 1: HACIA CIUDAD VERDE.'] },
      // ── Viridian City ──
      { id: 'viridian_gym_locked', type: 'object', position: w('VIRIDIAN_CITY', 32, 7), direction: 'up', sprite: '🚪', dialogue: ['El GIMNASIO de CIUDAD VERDE está cerrado.', 'El LÍDER ha salido.'] },
      { id: 'sign_viridian_main', type: 'object', position: w('VIRIDIAN_CITY', 17, 17), direction: 'down', sprite: '🪧', dialogue: ['CIUDAD VERDE', '¡La ciudad del eterno verdor!'] },
      { id: 'sign_tips1', type: 'object', position: w('VIRIDIAN_CITY', 19, 1), direction: 'down', sprite: '🪧', dialogue: ['PISTAS PARA ENTRENADORES', '¡Captura POKÉMON y aumenta tu equipo!', '¡Cuantos más tengas, más fácil será luchar!'] },
      { id: 'sign_tips2', type: 'object', position: w('VIRIDIAN_CITY', 21, 29), direction: 'down', sprite: '🪧', dialogue: ['PISTAS PARA ENTRENADORES', 'Las medicinas POKÉMON se pueden comprar en la TIENDA POKÉMON.'] },
      { id: 'sign_mart_viridian', type: 'object', position: w('VIRIDIAN_CITY', 30, 19), direction: 'down', sprite: '🪧', dialogue: ['TIENDA POKÉMON', '¡Para todas tus necesidades POKÉMON!'] },
      { id: 'sign_center_viridian', type: 'object', position: w('VIRIDIAN_CITY', 24, 25), direction: 'down', sprite: '🪧', dialogue: ['CENTRO POKÉMON', '¡Curamos a tus POKÉMON!'] },
      { id: 'sign_gym_viridian', type: 'object', position: w('VIRIDIAN_CITY', 27, 7), direction: 'down', sprite: '🪧', dialogue: ['GIMNASIO POKÉMON DE CIUDAD VERDE'] },
      { id: 'door_closed_viridian', type: 'object', position: w('VIRIDIAN_CITY', 21, 15), direction: 'up',   sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_closed_viridian_2', type: 'object', position: w('VIRIDIAN_CITY', 21, 9), direction: 'up',   sprite: '🚪', dialogue: ['Está cerrado.'] },
      // ── Route 2 ──
      { id: 'sign_route2',    type: 'object', position: w('ROUTE_2', 3, 15), direction: 'down', sprite: '🪧', dialogue: ['RUTA 2: Al norte a CIUDAD PLATEADA.'] },
      { id: 'door_closed_rt2',type: 'object', position: w('ROUTE_2', 3, 35), direction: 'up',   sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'item_potion_rt2', type: 'item',  position: w('ROUTE_2', 7, 5),  direction: 'down', sprite: '🧪', itemId: 'POTION' },
      // ── Viridian Forest ──
      { id: 'item_pokeball_forest_1', type: 'item', position: w('VIRIDIAN_FOREST', 10, 11), direction: 'down', sprite: '🔴', itemId: 'POKEBALL' },
      { id: 'item_potion_forest_1',   type: 'item', position: w('VIRIDIAN_FOREST', 20, 21), direction: 'down', sprite: '🧪', itemId: 'POTION' },
      { id: 'item_antidote_forest_1', type: 'item', position: w('VIRIDIAN_FOREST', 2, 21),  direction: 'down', sprite: '💊', itemId: 'ANTIDOTE' },
      { id: 'item_potion_forest_2',   type: 'item', position: w('VIRIDIAN_FOREST', 3, 40),  direction: 'down', sprite: '🧪', itemId: 'POTION' },
      { id: 'item_pokeball_forest_2', type: 'item', position: w('VIRIDIAN_FOREST', 33, 40), direction: 'down', sprite: '🔴', itemId: 'POKEBALL' },
      // ── Route 3 ──
      { id: 'item_awakening_rt3', type: 'item', position: w('ROUTE_3', 25, 6), direction: 'down', sprite: '☕', itemId: 'AWAKENING' },
      // ── Route 4 ──
      { id: 'item_potion_rt4', type: 'item', position: w('ROUTE_4', 33, 4), direction: 'down', sprite: '🧪', itemId: 'POTION' },
      { id: 'item_tm_whirlwind_rt4', type: 'item', position: w('ROUTE_4', 17, 3), direction: 'down', sprite: '📀', itemId: 'FULL_HEAL' },
      // ── Route 9 ──
      { id: 'item_tm_teleport_rt9', type: 'item', position: w('ROUTE_9', 10, 15), direction: 'down', sprite: '📀', itemId: 'FULL_HEAL' },
      // ── Route 24 ──
      { id: 'item_tm_thunderwave_rt24', type: 'item', position: w('ROUTE_24', 10, 5), direction: 'down', sprite: '📀', itemId: 'FULL_HEAL' },
      // ── Route 25 ──
      { id: 'item_tm_seismic_rt25', type: 'item', position: w('ROUTE_25', 22, 2), direction: 'down', sprite: '📀', itemId: 'FULL_HEAL' },
      { id: 'sign_bill_rt25', type: 'object', position: w('ROUTE_25', 5, 2), direction: 'down', sprite: '🪧', dialogue: ['CASA DE BILL', 'Aquí vive el famoso investigador de POKÉMON.'] },
      // ── Pewter City ──
      { id: 'sign_tips_pewter', type: 'object', position: w('PEWTER_CITY', 19, 29), direction: 'down', sprite: '🪧', dialogue: ['PISTAS PARA ENTRENADORES', '¡Cualquier POKÉMON que participe en una batalla, aunque sea poco tiempo, ganará EXP!'] },
      { id: 'sign_police_notice', type: 'object', position: w('PEWTER_CITY', 33, 19), direction: 'down', sprite: '🪧', dialogue: ['AVISO POLICIAL', '¡Se han visto ladrones en el MONTE MOON!', '¡Si ves algo sospechoso, avisa a la POLICÍA de PLATEADA!'] },
      { id: 'sign_mart_pewter', type: 'object', position: w('PEWTER_CITY', 24, 17), direction: 'down', sprite: '🪧', dialogue: ['TIENDA POKÉMON'] },
      { id: 'sign_center_pewter', type: 'object', position: w('PEWTER_CITY', 14, 25), direction: 'down', sprite: '🪧', dialogue: ['CENTRO POKÉMON'] },
      { id: 'sign_museum_pewter', type: 'object', position: w('PEWTER_CITY', 15, 9), direction: 'down', sprite: '🪧', dialogue: ['MUSEO DE CIENCIAS DE PLATEADA'] },
      { id: 'sign_gym_pewter', type: 'object', position: w('PEWTER_CITY', 11, 17), direction: 'down', sprite: '🪧', dialogue: ['GIMNASIO POKÉMON DE CIUDAD PLATEADA', 'LÍDER: BROCK', 'El Pilar de Roca.'] },
      { id: 'sign_pewter_main', type: 'object', position: w('PEWTER_CITY', 25, 23), direction: 'down', sprite: '🪧', dialogue: ['CIUDAD PLATEADA', 'Una ciudad de piedra gris.'] },
      { id: 'door_museum_front', type: 'object', position: w('PEWTER_CITY', 14, 7), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_museum_side', type: 'object', position: w('PEWTER_CITY', 19, 5), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_nidoran_house', type: 'object', position: w('PEWTER_CITY', 29, 13), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_speech_house', type: 'object', position: w('PEWTER_CITY', 7, 29), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      // ── Cerulean City ──
      // ── Cinnabar Island ──
      { id: 'sign_cinnabar_main', type: 'object', position: w('CINNABAR_ISLAND', 9, 5), direction: 'down', sprite: '🪧', dialogue: ['ISLA CANELA', '¡La ciudad de los deseos fervientes!'] },
      { id: 'sign_mart_cinnabar', type: 'object', position: w('CINNABAR_ISLAND', 16, 11), direction: 'down', sprite: '🪧', dialogue: ['TIENDA POKÉMON'] },
      { id: 'sign_center_cinnabar', type: 'object', position: w('CINNABAR_ISLAND', 12, 11), direction: 'down', sprite: '🪧', dialogue: ['CENTRO POKÉMON'] },
      { id: 'sign_lab_cinnabar', type: 'object', position: w('CINNABAR_ISLAND', 9, 11), direction: 'down', sprite: '🪧', dialogue: ['LABORATORIO POKÉMON DE ISLA CANELA'] },
      { id: 'sign_gym_cinnabar', type: 'object', position: w('CINNABAR_ISLAND', 13, 3), direction: 'down', sprite: '🪧', dialogue: ['GIMNASIO POKÉMON DE ISLA CANELA', 'LÍDER: BLAINE', '¡El Maestro de los Acertijos Calientes!'] },
      { id: 'door_mansion', type: 'object', position: w('CINNABAR_ISLAND', 6, 3), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_cinnabar_gym', type: 'object', position: w('CINNABAR_ISLAND', 18, 3), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_cinnabar_lab', type: 'object', position: w('CINNABAR_ISLAND', 6, 9), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_cinnabar_center', type: 'object', position: w('CINNABAR_ISLAND', 11, 11), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_cinnabar_mart', type: 'object', position: w('CINNABAR_ISLAND', 15, 11), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      // ── Fuchsia City ──
      { id: 'sign_fuchsia_1', type: 'object', position: w('FUCHSIA_CITY', 15, 23), direction: 'down', sprite: '🪧', dialogue: ['CIUDAD FUCSIA', '¡Estamos orgullosos de ser la ciudad de la ZONA SAFARI!'] },
      { id: 'sign_fuchsia_2', type: 'object', position: w('FUCHSIA_CITY', 25, 15), direction: 'down', sprite: '🪧', dialogue: ['¡Bienvenido a la ZONA SAFARI!', '¡Atrapa POKÉMON raros de todo el mundo!'] },
      { id: 'sign_safari_game', type: 'object', position: w('FUCHSIA_CITY', 17, 5), direction: 'down', sprite: '🪧', dialogue: ['¡JUEGO DE LA SAFARI!', '¡Atrapa todos los que puedas por sólo 500 POKÉYENES!'] },
      { id: 'sign_mart_fuchsia', type: 'object', position: w('FUCHSIA_CITY', 6, 13), direction: 'down', sprite: '🪧', dialogue: ['TIENDA POKÉMON'] },
      { id: 'sign_center_fuchsia', type: 'object', position: w('FUCHSIA_CITY', 20, 27), direction: 'down', sprite: '🪧', dialogue: ['CENTRO POKÉMON'] },
      { id: 'sign_warden_fuchsia', type: 'object', position: w('FUCHSIA_CITY', 27, 29), direction: 'down', sprite: '🪧', dialogue: ['CASA DEL GUARDA DE LA ZONA SAFARI'] },
      { id: 'sign_safari_zone', type: 'object', position: w('FUCHSIA_CITY', 21, 15), direction: 'down', sprite: '🪧', dialogue: ['OFICINA DE LA ZONA SAFARI'] },
      { id: 'sign_gym_fuchsia', type: 'object', position: w('FUCHSIA_CITY', 5, 29), direction: 'down', sprite: '🪧', dialogue: ['GIMNASIO POKÉMON DE CIUDAD FUCSIA', 'LÍDER: KOGA', '¡El Maestro Ninja Venenoso!'] },
      { id: 'sign_chansey_fuchsia', type: 'object', position: w('FUCHSIA_CITY', 33, 7), direction: 'down', sprite: '🪧', dialogue: ['CHANSEY', 'Nombre: CHANSEY', 'Captura: Es un POKÉMON muy difícil de encontrar.'] },
      { id: 'sign_voltorb_fuchsia', type: 'object', position: w('FUCHSIA_CITY', 27, 7), direction: 'down', sprite: '🪧', dialogue: ['VOLTORB', 'Nombre: VOLTORB', 'Captura: Suele vivir cerca de plantas eléctricas.'] },
      { id: 'sign_kangaskhan_fuchsia', type: 'object', position: w('FUCHSIA_CITY', 13, 7), direction: 'down', sprite: '🪧', dialogue: ['KANGASKHAN', 'Nombre: KANGASKHAN', 'Captura: Protege a su cría con gran ferocidad.'] },
      { id: 'sign_slowpoke_fuchsia', type: 'object', position: w('FUCHSIA_CITY', 31, 13), direction: 'down', sprite: '🪧', dialogue: ['SLOWPOKE', 'Nombre: SLOWPOKE', 'Captura: Es muy perezoso y se mueve despacio.'] },
      { id: 'sign_lapras_fuchsia', type: 'object', position: w('FUCHSIA_CITY', 13, 15), direction: 'down', sprite: '🪧', dialogue: ['LAPRAS', 'Nombre: LAPRAS', 'Captura: Un POKÉMON muy inteligente que entiende a los humanos.'] },
      { id: 'sign_fossil_fuchsia', type: 'object', position: w('FUCHSIA_CITY', 7, 7), direction: 'down', sprite: '🪧', dialogue: ['FÓSIL', 'Nombre: OMANITE/KABUTO', 'Captura: Un POKÉMON que vivió hace millones de años.'] },
      { id: 'door_fuchsia_mart', type: 'object', position: w('FUCHSIA_CITY', 5, 13), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_bills_grandpa', type: 'object', position: w('FUCHSIA_CITY', 11, 27), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_fuchsia_center', type: 'object', position: w('FUCHSIA_CITY', 19, 27), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_warden', type: 'object', position: w('FUCHSIA_CITY', 27, 27), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_safari_zone', type: 'object', position: w('FUCHSIA_CITY', 18, 3), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_fuchsia_gym', type: 'object', position: w('FUCHSIA_CITY', 5, 27), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_fuchsia_meeting', type: 'object', position: w('FUCHSIA_CITY', 22, 13), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_good_rod_1', type: 'object', position: w('FUCHSIA_CITY', 31, 27), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_good_rod_2', type: 'object', position: w('FUCHSIA_CITY', 31, 24), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      // ── Celadon City ──
      { id: 'sign_tips1_celadon', type: 'object', position: w('CELADON_CITY', 27, 15), direction: 'down', sprite: '🪧', dialogue: ['PISTAS PARA ENTRENADORES', '¡Usa una PIEDRA LUNAR para hacer evolucionar a ciertos POKÉMON!'] },
      { id: 'sign_celadon_main', type: 'object', position: w('CELADON_CITY', 19, 15), direction: 'down', sprite: '🪧', dialogue: ['CIUDAD AZULONA', '¡La ciudad de los sueños arcoíris!'] },
      { id: 'sign_center_celadon', type: 'object', position: w('CELADON_CITY', 42, 9), direction: 'down', sprite: '🪧', dialogue: ['CENTRO POKÉMON'] },
      { id: 'sign_gym_celadon', type: 'object', position: w('CELADON_CITY', 13, 29), direction: 'down', sprite: '🪧', dialogue: ['GIMNASIO POKÉMON DE CIUDAD AZULONA', 'LÍDER: ERIKA', '¡La Princesa Amante de la Naturaleza!'] },
      { id: 'door_celadon_gym_main', type: 'object', position: w('CELADON_CITY', 13, 28), direction: 'up', sprite: '🚪', dialogue: ['GIMNASIO CERRADO.'] },
      { id: 'sign_mansion_celadon', type: 'object', position: w('CELADON_CITY', 21, 9), direction: 'down', sprite: '🪧', dialogue: ['MANSIÓN AZULONA'] },
      { id: 'door_celadon_mansion', type: 'object', position: w('CELADON_CITY', 21, 8), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'sign_deptstore_celadon', type: 'object', position: w('CELADON_CITY', 12, 13), direction: 'down', sprite: '🪧', dialogue: ['CENTRO COMERCIAL DE AZULONA'] },
      { id: 'sign_tips2_celadon', type: 'object', position: w('CELADON_CITY', 39, 21), direction: 'down', sprite: '🪧', dialogue: ['PISTAS PARA ENTRENADORES', '¡Protege a tus POKÉMON de los estados alterados con medicinas!'] },
      { id: 'sign_prizeexchange_celadon', type: 'object', position: w('CELADON_CITY', 33, 21), direction: 'down', sprite: '🪧', dialogue: ['CANJE DE PREMIOS', '¡Cambia tus fichas por fantásticos premios!'] },
      { id: 'sign_gamecorner_celadon', type: 'object', position: w('CELADON_CITY', 27, 21), direction: 'down', sprite: '🪧', dialogue: ['CASINO ROCKET', '¡Diversión para todos!'] },
      { id: 'door_celadon_mart_1', type: 'object', position: w('CELADON_CITY', 8, 13), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_celadon_mart_2', type: 'object', position: w('CELADON_CITY', 10, 13), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_mansion_1', type: 'object', position: w('CELADON_CITY', 24, 9), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_mansion_2', type: 'object', position: w('CELADON_CITY', 24, 3), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_mansion_3', type: 'object', position: w('CELADON_CITY', 25, 3), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_celadon_center', type: 'object', position: w('CELADON_CITY', 41, 9), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_celadon_gym', type: 'object', position: w('CELADON_CITY', 12, 27), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_gamecorner', type: 'object', position: w('CELADON_CITY', 28, 19), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_celadon_mart_5f', type: 'object', position: w('CELADON_CITY', 39, 19), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_prizeroom', type: 'object', position: w('CELADON_CITY', 33, 19), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_celadon_diner', type: 'object', position: w('CELADON_CITY', 31, 27), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_celadon_chief', type: 'object', position: w('CELADON_CITY', 35, 27), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_celadon_hotel', type: 'object', position: w('CELADON_CITY', 43, 27), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      // ── Saffron City ──
      { id: 'sign_saffron_main', type: 'object', position: w('SAFFRON_CITY', 17, 5), direction: 'down', sprite: '🪧', dialogue: ['CIUDAD AZAFRÁN', '¡La ciudad dorada y resplandeciente!'] },
      { id: 'sign_dojo_saffron', type: 'object', position: w('SAFFRON_CITY', 27, 5), direction: 'down', sprite: '🪧', dialogue: ['DOJO DE LUCHA'] },
      { id: 'sign_gym_saffron', type: 'object', position: w('SAFFRON_CITY', 35, 5), direction: 'down', sprite: '🪧', dialogue: ['GIMNASIO POKÉMON DE CIUDAD AZAFRÁN', 'LÍDER: SABRINA', '¡La Maestra de los POKÉMON Psíquicos!'] },
      { id: 'sign_mart_saffron', type: 'object', position: w('SAFFRON_CITY', 26, 11), direction: 'down', sprite: '🪧', dialogue: ['TIENDA POKÉMON'] },
      { id: 'sign_tips1_saffron', type: 'object', position: w('SAFFRON_CITY', 39, 19), direction: 'down', sprite: '🪧', dialogue: ['PISTAS PARA ENTRENADORES', '¡La MÁXIMA POCIÓN restaura todos los PS!'] },
      { id: 'sign_tips2_saffron', type: 'object', position: w('SAFFRON_CITY', 5, 21), direction: 'down', sprite: '🪧', dialogue: ['PISTAS PARA ENTRENADORES', '¡Usa una CUERDA HUIDA para salir de las cuevas al instante!'] },
      { id: 'sign_silphco_saffron', type: 'object', position: w('SAFFRON_CITY', 15, 21), direction: 'down', sprite: '🪧', dialogue: ['EDIFICIO PRINCIPAL DE SILPH S.A.'] },
      { id: 'sign_center_saffron', type: 'object', position: w('SAFFRON_CITY', 10, 29), direction: 'down', sprite: '🪧', dialogue: ['CENTRO POKÉMON'] },
      { id: 'sign_mrpsychic_saffron', type: 'object', position: w('SAFFRON_CITY', 27, 29), direction: 'down', sprite: '🪧', dialogue: ['CASA DEL SR. PSÍQUICO'] },
      { id: 'sign_silph_product', type: 'object', position: w('SAFFRON_CITY', 1, 19), direction: 'down', sprite: '🪧', dialogue: ['¡NUEVOS PRODUCTOS DE SILPH!', '¡Próximamente!'] },
      { id: 'door_copycat', type: 'object', position: w('SAFFRON_CITY', 7, 5), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_dojo', type: 'object', position: w('SAFFRON_CITY', 26, 3), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_saffron_gym', type: 'object', position: w('SAFFRON_CITY', 34, 3), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_saffron_pidgey_house', type: 'object', position: w('SAFFRON_CITY', 13, 11), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_saffron_mart', type: 'object', position: w('SAFFRON_CITY', 25, 11), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_silphco', type: 'object', position: w('SAFFRON_CITY', 18, 21), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_saffron_center', type: 'object', position: w('SAFFRON_CITY', 9, 29), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_mrpsychic', type: 'object', position: w('SAFFRON_CITY', 29, 29), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      // ── Cerulean City ──
      { id: 'sign_cerulean_main', type: 'object', position: w('CERULEAN_CITY', 23, 19), direction: 'down', sprite: '🪧', dialogue: ['CIUDAD CELESTE', 'Una ciudad misteriosa y azul.'] },
      { id: 'sign_tips_cerulean', type: 'object', position: w('CERULEAN_CITY', 17, 29), direction: 'down', sprite: '🪧', dialogue: ['PISTAS PARA ENTRENADORES', '¡Cualquier POKÉMON puede ser fuerte si se le entrena con cariño!'] },
      { id: 'sign_mart_cerulean', type: 'object', position: w('CERULEAN_CITY', 26, 25), direction: 'down', sprite: '🪧', dialogue: ['TIENDA POKÉMON'] },
      { id: 'sign_center_cerulean', type: 'object', position: w('CERULEAN_CITY', 20, 17), direction: 'down', sprite: '🪧', dialogue: ['CENTRO POKÉMON'] },
      { id: 'sign_bikeshop_cerulean', type: 'object', position: w('CERULEAN_CITY', 11, 25), direction: 'down', sprite: '🪧', dialogue: ['TIENDA DE BICIS', '¡Consigue una y viaja a toda velocidad!'] },
      { id: 'sign_gym_cerulean', type: 'object', position: w('CERULEAN_CITY', 27, 21), direction: 'down', sprite: '🪧', dialogue: ['GIMNASIO POKÉMON DE CIUDAD CELESTE', 'LÍDER: MISTY', '¡La Sirena Marimacho!'] },
      { id: 'item_rare_candy_cerulean', type: 'item', position: w('CERULEAN_CITY', 15, 8), direction: 'down', sprite: '🍬', itemId: 'RARE_CANDY' },
      { id: 'item_hm01_cut', type: 'item', position: w('ROUTE_25', 14, 2), direction: 'down', sprite: '✂️', itemId: 'HM01_CUT' },
      { id: 'item_hm03_surf', type: 'item', position: w('VERMILION_CITY', 31, 8), direction: 'down', sprite: '🌊', itemId: 'HM03_SURF' },
      // ── Vermilion City ──
      { id: 'sign_vermilion_main', type: 'object', position: w('VERMILION_CITY', 27, 3), direction: 'down', sprite: '🪧', dialogue: ['CIUDAD CARMÍN', 'El puerto de los atardeceres exquisitos.'] },
      { id: 'sign_notice_vermilion', type: 'object', position: w('VERMILION_CITY', 37, 13), direction: 'down', sprite: '🪧', dialogue: ['AVISO', '¡La RUTA 12 puede estar bloqueada por un POKÉMON dormilón!'] },
      { id: 'sign_mart_vermilion', type: 'object', position: w('VERMILION_CITY', 24, 13), direction: 'down', sprite: '🪧', dialogue: ['TIENDA POKÉMON'] },
      { id: 'sign_center_vermilion', type: 'object', position: w('VERMILION_CITY', 12, 3), direction: 'down', sprite: '🪧', dialogue: ['CENTRO POKÉMON'] },
      { id: 'sign_fanclub_vermilion', type: 'object', position: w('VERMILION_CITY', 7, 13), direction: 'down', sprite: '🪧', dialogue: ['CLUB DE FANS DE POKÉMON', '¡Todos son bienvenidos!'] },
      { id: 'sign_gym_vermilion', type: 'object', position: w('VERMILION_CITY', 7, 19), direction: 'down', sprite: '🪧', dialogue: ['GIMNASIO POKÉMON DE CIUDAD CARMÍN', 'LÍDER: TENIENTE SURGE', '¡El Rayo Americano!'] },
      { id: 'sign_harbor_vermilion', type: 'object', position: w('VERMILION_CITY', 29, 15), direction: 'down', sprite: '🪧', dialogue: ['PUERTO DE CIUDAD CARMÍN'] },
      { id: 'door_vermilion_center', type: 'object', position: w('VERMILION_CITY', 11, 3), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_fanclub', type: 'object', position: w('VERMILION_CITY', 9, 13), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_vermilion_mart', type: 'object', position: w('VERMILION_CITY', 23, 13), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_vermilion_gym', type: 'object', position: w('VERMILION_CITY', 12, 19), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_pidgey_house', type: 'object', position: w('VERMILION_CITY', 23, 19), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_trade_house', type: 'object', position: w('VERMILION_CITY', 15, 13), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      { id: 'door_old_rod_house', type: 'object', position: w('VERMILION_CITY', 7, 3), direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
      // ── Lavender Town ──
      { id: 'sign_rock_tunnel_rt10',type: 'object', position: w('ROUTE_10', 4,  0),     direction: 'down', sprite: '🪧', dialogue: ['TÚNEL ROCA'] },
    ],

    // ── Indoor maps ──────────────────────────────────────────────────────────
    OAKS_LAB: [
      { id: 'starter_1', type: 'item', position: { x: 3, y: 5 }, direction: 'down', sprite: STARTERS[0].sprite },
      { id: 'starter_2', type: 'item', position: { x: 4, y: 5 }, direction: 'down', sprite: STARTERS[1].sprite },
      { id: 'starter_3', type: 'item', position: { x: 5, y: 5 }, direction: 'down', sprite: STARTERS[2].sprite },
    ],
    PLAYERS_HOUSE_1F: [],
    PLAYERS_HOUSE_2F: [
      { id: 'snes',         type: 'object', position: { x: 2, y: 4 }, direction: 'down', sprite: '🎮' },
      { id: 'pc_reds_house',type: 'object', position: { x: 5, y: 5 }, direction: 'down', sprite: '💻' },
    ],
    RIVALS_HOUSE: [],
    POKECENTER: [],
    POKEMART: [],
    MT_MOON:     [
      { id: 'item_potion_mtmoon_1', type: 'item', position: { x: 14, y: 14 }, direction: 'down', sprite: '🧪', itemId: 'POTION' },
      { id: 'item_full_heal_mtmoon', type: 'item', position: { x: 3, y: 3 },  direction: 'down', sprite: '🌟', itemId: 'FULL_HEAL' },
      { id: 'item_revive_mtmoon',   type: 'item', position: { x: 17, y: 14 }, direction: 'down', sprite: '💎', itemId: 'REVIVE' },
      { id: 'item_pokeball_mtmoon', type: 'item', position: { x: 2, y: 10 },  direction: 'down', sprite: '🔴', itemId: 'POKEBALL' },
    ],
    MT_MOON_B1F: [
      { id: 'item_potion_mtmoon_b1f', type: 'item', position: { x: 14, y: 14 }, direction: 'down', sprite: '🧪', itemId: 'POTION' }
    ],
    MT_MOON_B2F: [
      { id: 'item_moonstone_mtmoon',  type: 'item', position: { x: 10, y: 10 }, direction: 'down', sprite: '🌙', itemId: 'FULL_RESTORE' } // Using Full Restore for Moon Stone for now
    ],
    PEWTER_GYM:     [],
    CERULEAN_GYM:   [],
    VERMILION_GYM:  [],
    ROCK_TUNNEL_1F: [
      { id: 'item_potion_rock_1', type: 'item', position: { x: 4, y: 4 }, direction: 'down', sprite: '🧪', itemId: 'POTION' },
    ],
    ROCK_TUNNEL_B1F: [
      { id: 'item_revive_rock_1', type: 'item', position: { x: 5, y: 15 }, direction: 'down', sprite: '💎', itemId: 'REVIVE' },
    ],
    POKEMON_TOWER_1F: [],
    POKEMON_TOWER_2F: [
      { id: 'item_silph_scope', type: 'item', position: { x: 5, y: 3 }, direction: 'down', sprite: '🔭', itemId: 'SILPH_SCOPE' },
    ],
    POKEMON_TOWER_3F: [
      { id: 'item_pokeball_tower_1', type: 'item', position: { x: 5, y: 5 }, direction: 'down', sprite: '🔴', itemId: 'POKEBALL' },
    ],
    BILLS_HOUSE: [],
    CELADON_GYM: [],
    FUCHSIA_GYM: [],
    SAFFRON_GYM: [],
    CINNABAR_GYM: [],
    VIRIDIAN_GYM: [],
    POKEMON_TOWER_4F: [],
    POKEMON_TOWER_5F: [],
    POKEMON_TOWER_6F: [],
    POKEMON_TOWER_7F: [],
    SEAFOAM_ISLANDS_1F: [],
    SEAFOAM_ISLANDS_B1F: [],
    SEAFOAM_ISLANDS_B2F: [],
    SEAFOAM_ISLANDS_B3F: [],
    SEAFOAM_ISLANDS_B4F: [],
    VICTORY_ROAD_1F: [],
    VICTORY_ROAD_2F: [],
    VICTORY_ROAD_3F: [],
    CERULEAN_CAVE_1F: [],
    CERULEAN_CAVE_2F: [],
    CERULEAN_CAVE_B_1F: [],
    DIGLETTS_CAVE: [],
    POWER_PLANT: [],
    POKEMON_MANSION_1F: [],
    POKEMON_MANSION_2F: [],
    POKEMON_MANSION_3F: [],
    POKEMON_MANSION_B1F: [],
    SAFARI_ZONE_CENTER: [],
  };

  return Object.fromEntries(
    Object.entries(rawItems).map(([map, entities]) => [
      map, entities.filter(e => !pickedItemIds.includes(e.id))
    ])
  ) as Record<MapID, Entity[]>;
}
