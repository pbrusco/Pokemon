import { MOVES, STARTERS, makePokemon } from '../constants';
import { type NPC, type Entity, type MapID, type Direction, type Pokemon, type Position } from '../types';

// ─── Kanto zone offsets in the unified KANTO_OVERWORLD map ───────────────────
// Derived from scripts/stitch-kanto.mjs output.
// Format: top-left corner of each segment in world tile coordinates.
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
      // ── Cerulean City ──
      { id: 'cerulean_rival', name: 'AZUL', type: 'npc', position: w('CERULEAN_CITY', 20, 2), direction: 'down', trainerClass: 'rival', dialogue: ["¡Hola! ¡Hacía tiempo que no nos veíamos!", "¡He atrapado un montón de POKÉMON fuertes!", "¡Enséñame qué has conseguido tú!"], isTrainer: true, trainerTeam: [makePokemon('pidgeotto', 'PIDGEOTTO', 18, 'flying', [MOVES.GUST, MOVES.SAND_ATTACK], 17), makePokemon('abra', 'ABRA', 15, 'psychic', [MOVES.TELEPORT], 63), makePokemon('rattata', 'RATTATA', 15, 'normal', [MOVES.TACKLE, MOVES.QUICK_ATTACK], 19), makePokemon('bulbasaur', 'BULBASAUR', 17, 'grass', [MOVES.TACKLE, MOVES.VINE_WHIP], 1)] },
      { id: 'cerulean_rocket', name: 'SOLDADO ROCKET', type: 'npc', position: w('CERULEAN_CITY', 32, 8), direction: 'down', trainerClass: 'rocket', dialogue: ["¡El TEAM ROCKET se llevará todo lo que quiera!", "¡No te metas en nuestros asuntos!"], isTrainer: true, trainerTeam: [makePokemon('machop', 'MACHOP', 15, 'fighting', [MOVES.LOW_KICK, MOVES.LEER], 66), makePokemon('drowzee', 'DROWZEE', 15, 'psychic', [MOVES.POUND, MOVES.HYPNOSIS], 96)] },
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
      { id: 'saffron_guard_n', name: 'GUARDIA', type: 'npc', position: w('ROUTE_5', 4, 15), direction: 'up', trainerClass: 'citizen', dialogue: ["¡No puedes pasar! ¡Tengo mucha sed!", "Dicen que en CIUDAD CELESTE venden TÉ..."] },
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
    ],
    MT_MOON_B1F: [
      { id: 'supernerd_mtmoon', name: 'SABIONDO MIGUEL', type: 'npc', position: { x: 8, y: 15 }, direction: 'left', trainerClass: 'supernerd', dialogue: ["¡Yo domino los fósiles and science!", "¡Mis POKÉMON son experimentos!"], isTrainer: true, trainerTeam: [makePokemon('grimer', 'GRIMER', 11, 'poison', [MOVES.POUND, MOVES.POISON_POWDER], 88, { types: ['poison'] }), makePokemon('voltorb', 'VOLTORB', 11, 'electric', [MOVES.TACKLE, MOVES.THUNDERSHOCK], 100, { types: ['electric'] }), makePokemon('koffing', 'KOFFING', 11, 'poison', [MOVES.TACKLE, MOVES.POISON_POWDER], 109, { types: ['poison'] })] }
    ],
    MT_MOON_B2F: [
      { id: 'lass_mtmoon', name: 'CHICA IRIS', type: 'npc', position: { x: 15, y: 10 }, direction: 'down', trainerClass: 'lass', dialogue: ["¡Las plantas son preciosas!", "¡Pero también pican!"], isTrainer: true, trainerTeam: [makePokemon('oddish', 'ODDISH', 14, 'grass', [MOVES.POUND, MOVES.SLEEP_POWDER], 43, { types: ['grass', 'poison'] }), makePokemon('bellsprout', 'BELLSPROUT', 14, 'grass', [MOVES.VINE_WHIP, MOVES.GROWL], 69, { types: ['grass', 'poison'] })] }
    ],
    PEWTER_GYM: [
      { id: 'gym_trainer', name: 'CAMPISTA JERRY', type: 'npc', position: { x: 4, y: 7 }, direction: 'right', trainerClass: 'hiker', dialogue: ["¡Alto ahí!", "¡No eres rival para BROCK!"], isTrainer: true, trainerTeam: [makePokemon('diglett', 'DIGLETT', 10, 'ground', [MOVES.SCRATCH], 74), makePokemon('sandshrew', 'SANDSHREW', 10, 'ground', [MOVES.SCRATCH], 93)] },
      { id: 'brock', name: 'BROCK', type: 'npc', position: { x: 4, y: 2 }, direction: 'down', trainerClass: 'brock', dialogue: ["¡Soy BROCK!", "¡Soy el líder de gimnasio de Ciudad Plateada!", "Mis POKÉMON son tipo roca."], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 12, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 86, { types: ['rock', 'ground'] }), makePokemon('onix', 'ONIX', 14, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 108, { types: ['rock', 'ground'] })] }
    ],
    CERULEAN_GYM: [
      { id: 'door_cerulean_gym_internal', type: 'object', position: { x: 5, y: 13 }, direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
    ],
    VERMILION_GYM: [
      { id: 'door_vermilion_gym_internal', type: 'object', position: { x: 5, y: 13 }, direction: 'up', sprite: '🚪', dialogue: ['Está cerrado.'] },
    ],
    ROCK_TUNNEL_1F: [],
    ROCK_TUNNEL_B1F: [],
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
  };

  return Object.fromEntries(
    Object.entries(rawItems).map(([map, entities]) => [
      map, entities.filter(e => !pickedItemIds.includes(e.id))
    ])
  ) as Record<MapID, Entity[]>;
}
