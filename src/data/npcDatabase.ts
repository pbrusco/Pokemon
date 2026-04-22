import { MOVES, STARTERS, makePokemon } from '../constants';
import { NPC, Entity, MapID, Direction, Pokemon, Position } from '../types';

// ─── Kanto zone offsets in the unified KANTO_OVERWORLD map ───────────────────
// Derived from scripts/stitch-kanto.mjs output.
// Format: top-left corner of each segment in world tile coordinates.
const O = {
  PALLET_TOWN:     { x:  11, y: 198 },
  ROUTE_1:         { x:  16, y: 163 },
  VIRIDIAN_CITY:   { x:   0, y: 128 },
  ROUTE_2:         { x:  16, y:  89 },
  VIRIDIAN_FOREST: { x:   4, y:  42 },
  PEWTER_CITY:     { x:   0, y:   7 },
  ROUTE_3:         { x:  39, y:  18 },
  ROUTE_4:         { x:  69, y:  14 },
  CERULEAN_CITY:   { x: 108, y:   0 },
  ROUTE_5:         { x: 124, y:  35 },
  SAFFRON_CITY:    { x: 108, y:  51 },
  ROUTE_6:         { x: 124, y:  86 },
  VERMILION_CITY:  { x: 108, y: 102 },
  ROUTE_9:         { x: 147, y:   3 },
  ROUTE_10:        { x: 162, y:   7 },
  LAVENDER_TOWN:   { x: 156, y:  30 },
};

/** Translate a local (x,y) position within a named zone to world coords. */
function w(zone: keyof typeof O, lx: number, ly: number): Position {
  return { x: O[zone].x + lx, y: O[zone].y + ly };
}

export function buildNPCDatabase(
  playerTeam: Pokemon[],
  hasParcel: boolean,
  hasPokedex: boolean,
  badges: string[],
  storyStep: string = 'START',
  oakCutscenePos: Position | null = null,
  oakCutsceneDir: Direction | null = null
): Record<MapID, NPC[]> {
  return {
    // ── Unified outdoor map ──────────────────────────────────────────────────
    KANTO_OVERWORLD: [
      // ── Pallet Town ──
      ...(playerTeam.length === 0 ? [{
        id: 'oak_pallet',
        name: 'PROF. OAK',
        type: 'npc' as const,
        position: oakCutscenePos || w('PALLET_TOWN', 10, 2),
        direction: oakCutsceneDir || ('down' as const),
        trainerClass: 'oak',
        dialogue: ["¡Espera! ¡No vayas por ahí!", "¡Es peligroso ir solo por la hierba alta!", "Ven conmigo a mi laboratorio."]
      }] : []),
      { id: 'fat_man', name: 'SEÑOR GORDO', type: 'npc', position: w('PALLET_TOWN', 16, 10), direction: 'left', trainerClass: 'fat_man', dialogue: ["¡La tecnología es increíble!", "¡Ahora puedes guardar POKÉMON y objetos como datos en el PC!"] },
      // ── Route 1 ──
      { id: 'youngster_chano', name: 'JOVEN CHANO', type: 'npc', position: w('ROUTE_1', 3, 10), direction: 'left', trainerClass: 'youngster', dialogue: ["¡Eh! ¡Tú! ¡Mis POKÉMON son de lo mejor!", "¡No me ignores cuando te hablo!"], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 4, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19), makePokemon('spearow', 'SPEAROW', 4, 'flying', [MOVES.PECK, MOVES.GROWL], 21, { types: ['normal', 'flying'] })] },
      { id: 'bug_catcher', name: 'CAZABICHOS', type: 'npc', position: w('ROUTE_1', 6, 5), direction: 'left', trainerClass: 'bugcatcher', dialogue: ["¿Te gustan los POKÉMON bicho?", "¡Son los más guays del mundo!"], isTrainer: true, trainerTeam: [makePokemon('caterpie', 'CATERPIE', 3, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10), makePokemon('weedle', 'WEEDLE', 4, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] })] },
      // ── Viridian City ──
      { id: 'citizen', name: 'CIUDADANO', type: 'npc', position: w('VIRIDIAN_CITY', 8, 23), direction: 'down', trainerClass: 'citizen', dialogue: ["¡Bienvenido a CIUDAD VERDE!", "El GIMNASIO del octavo LÍDER está aquí...", "pero permanece cerrado casi siempre."] },
      // ── Route 2 ──
      { id: 'bug_catcher_rt2', name: 'CAZABICHOS TOMY', type: 'npc', position: w('ROUTE_2', 3, 12), direction: 'right', trainerClass: 'bugcatcher', dialogue: ["¡Atrapé estos bichos en el Bosque Verde!"], isTrainer: true, trainerTeam: [makePokemon('caterpie', 'CATERPIE', 4, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10), makePokemon('weedle', 'WEEDLE', 4, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] })] },
      // ── Viridian Forest ──
      { id: 'lass_forest', name: 'CHICA LILA', type: 'npc', position: w('VIRIDIAN_FOREST', 13, 31), direction: 'right' as Direction, trainerClass: 'lass', dialogue: ["¡Mis NIDORAN son preciosos!", "¡Pero también muerden!"], isTrainer: true, trainerTeam: [makePokemon('nidoran-f', 'NIDORAN♀', 6, 'poison', [MOVES.TACKLE, MOVES.GROWL], 29, { types: ['poison'] }), makePokemon('nidoran-f', 'NIDORAN♀', 6, 'poison', [MOVES.TACKLE, MOVES.GROWL], 29, { types: ['poison'] })] },
      { id: 'bug_catcher_forest_2', name: 'CAZABICHOS DOUG', type: 'npc', position: w('VIRIDIAN_FOREST', 19, 18), direction: 'left' as Direction, trainerClass: 'bugcatcher', dialogue: ["¡Mis CATERPIE son los más obedientes!"], isTrainer: true, trainerTeam: [makePokemon('caterpie', 'CATERPIE', 7, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10), makePokemon('caterpie', 'CATERPIE', 7, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10)] },
      { id: 'bug_catcher_forest_3', name: 'CAZABICHOS SAMI', type: 'npc', position: w('VIRIDIAN_FOREST', 23, 14), direction: 'down', trainerClass: 'bugcatcher', dialogue: ["¡Tengo un ejército de bichos!", "¡Prepárate!"], isTrainer: true, trainerTeam: [makePokemon('metapod', 'METAPOD', 6, 'bug', [MOVES.HARDEN, MOVES.TACKLE], 11), makePokemon('caterpie', 'CATERPIE', 6, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10), makePokemon('metapod', 'METAPOD', 6, 'bug', [MOVES.HARDEN, MOVES.TACKLE], 11)] },
      { id: 'bug_catcher_forest', name: 'CAZABICHOS RICKY', type: 'npc', position: w('VIRIDIAN_FOREST', 14, 16), direction: 'down', trainerClass: 'bugcatcher', dialogue: ["¡Mi POKÉMON bicho es el más fuerte!", "¡No podrás pasar de aquí!"], isTrainer: true, trainerTeam: [makePokemon('caterpie', 'CATERPIE', 9, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10), makePokemon('metapod', 'METAPOD', 9, 'bug', [MOVES.HARDEN, MOVES.TACKLE], 11)] },
      // ── Pewter City ──
      { id: 'pewter_citizen', name: 'CIUDADANO', type: 'npc', position: w('PEWTER_CITY', 23, 25), direction: 'down', trainerClass: 'citizen', dialogue: ["¡Bienvenido a Ciudad Plateada!", "Brock es el líder del gimnasio local. ¡Es muy duro!"] },
      // ── Route 3 ──
      { id: 'bug_catcher_rt3', name: 'CAZABICHOS RICK', type: 'npc', position: w('ROUTE_3', 5, 6), direction: 'right' as Direction, trainerClass: 'bugcatcher', dialogue: ["¡Los bichos son los mejores POKÉMON!", "¡Te voy a demostrar que soy el mejor!"], isTrainer: true, trainerTeam: [makePokemon('weedle', 'WEEDLE', 10, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] }), makePokemon('caterpie', 'CATERPIE', 10, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10)] },
      { id: 'lass_rt3', name: 'CHICA JANICE', type: 'npc', position: w('ROUTE_3', 13, 11), direction: 'left' as Direction, trainerClass: 'lass', dialogue: ["¡Oye tú! ¡No pases por aquí sin luchar!", "¡Mis PIDGEY son adorables Y fuertes!"], isTrainer: true, trainerTeam: [makePokemon('pidgey', 'PIDGEY', 11, 'flying', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] }), makePokemon('pidgey', 'PIDGEY', 11, 'flying', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] })] },
      { id: 'youngster_rt3', name: 'CHICO BEN', type: 'npc', position: w('ROUTE_3', 8, 14), direction: 'down' as Direction, trainerClass: 'youngster', dialogue: ["¡Llevo mis pantalones cortos todo el año!", "¡Eso me hace más fuerte!"], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 10, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19), makePokemon('ekans', 'EKANS', 10, 'poison', [MOVES.TACKLE, MOVES.GROWL], 23, { types: ['poison'] })] },
      { id: 'lass_rt3_2', name: 'CHICA HALEY', type: 'npc', position: w('ROUTE_3', 16, 7), direction: 'down' as Direction, trainerClass: 'lass', dialogue: ["¡Las flores son mis favoritas!", "¡Prepárate!"], isTrainer: true, trainerTeam: [makePokemon('oddish', 'ODDISH', 14, 'grass', [MOVES.POUND, MOVES.SLEEP_POWDER], 43, { types: ['grass', 'poison'] })] },
      // ── Cerulean City ──
      { id: 'cerulean_citizen', name: 'CIUDADANA', type: 'npc', position: w('CERULEAN_CITY', 20, 25), direction: 'down', trainerClass: 'citizen', dialogue: ["¡Bienvenido a Ciudad Celeste!", "¡La líder del gimnasio, MISTY, adora los POKÉMON de agua!"] },
      // ── Route 5 ──
      { id: 'saffron_guard_n', name: 'GUARDIA', type: 'npc', position: w('ROUTE_5', 4, 15), direction: 'up', trainerClass: 'citizen', dialogue: ["¡No puedes pasar! ¡Tengo mucha sed!", "Dicen que en CIUDAD CELESTE venden TÉ..."] },
      // ── Saffron City ──
      { id: 'saffron_citizen', name: 'CIUDADANO', type: 'npc', position: w('SAFFRON_CITY', 20, 18), direction: 'down', trainerClass: 'citizen', dialogue: ["¡Bienvenido a CIUDAD AZAFRÁN!", "Esta ciudad aún está en construcción..."] },
      // ── Vermilion City ──
      { id: 'vermilion_citizen', name: 'MARINO', type: 'npc', position: w('VERMILION_CITY', 20, 25), direction: 'down', trainerClass: 'sailor', dialogue: ["¡El S.S. ANNE llegará pronto a CIUDAD CARMÍN!", "¡El líder del gimnasio, TENIENTE SURGE, es un veterano!"] },
      // ── Lavender Town ──
      { id: 'lavender_citizen', name: 'CIUDADANA', type: 'npc', position: w('LAVENDER_TOWN', 14, 10), direction: 'down', trainerClass: 'citizen', dialogue: ["¡Bienvenido a PUEBLO LAVANDA!", "La TORRE POKÉMON está llena de fantasmas..."] },
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
      { id: 'rocket_mtmoon', name: 'SOLDADO ROCKET', type: 'npc', position: { x: 12, y: 5 }, direction: 'left', trainerClass: 'rocket', dialogue: ["¡El TEAM ROCKET se hará con todos los fósiles de MT MOON!"], isTrainer: true, trainerTeam: [makePokemon('rattata', 'RATTATA', 11, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19), makePokemon('zubat', 'ZUBAT', 11, 'poison', [MOVES.TACKLE], 41, { types: ['poison', 'flying'] })] }
    ],
    MT_MOON_B1F: [
      { id: 'supernerd_mtmoon', name: 'SABIONDO MIGUEL', type: 'npc', position: { x: 8, y: 15 }, direction: 'left', trainerClass: 'supernerd', dialogue: ["¡Yo domino los fósiles y la ciencia!", "¡Mis POKÉMON son experimentos!"], isTrainer: true, trainerTeam: [makePokemon('grimer', 'GRIMER', 11, 'poison', [MOVES.POUND, MOVES.POISON_POWDER], 88, { types: ['poison'] }), makePokemon('voltorb', 'VOLTORB', 11, 'electric', [MOVES.TACKLE, MOVES.THUNDERSHOCK], 100, { types: ['electric'] }), makePokemon('koffing', 'KOFFING', 11, 'poison', [MOVES.TACKLE, MOVES.POISON_POWDER], 109, { types: ['poison'] })] }
    ],
    MT_MOON_B2F: [
      { id: 'lass_mtmoon', name: 'CHICA IRIS', type: 'npc', position: { x: 15, y: 10 }, direction: 'down', trainerClass: 'lass', dialogue: ["¡Las plantas son preciosas!", "¡Pero también pican!"], isTrainer: true, trainerTeam: [makePokemon('oddish', 'ODDISH', 14, 'grass', [MOVES.POUND, MOVES.SLEEP_POWDER], 43, { types: ['grass', 'poison'] }), makePokemon('bellsprout', 'BELLSPROUT', 14, 'grass', [MOVES.VINE_WHIP, MOVES.GROWL], 69, { types: ['grass', 'poison'] })] }
    ],
    PEWTER_GYM: [
      { id: 'gym_trainer', name: 'ENTRENADOR GYM', type: 'npc', position: { x: 4, y: 7 }, direction: 'down', trainerClass: 'hiker', dialogue: ["¡Para llegar a BROCK tendrás que vencerme!", "¡Mis POKÉMON son duros!"], isTrainer: true, trainerTeam: [makePokemon('diglett', 'DIGLETT', 9, 'ground', [MOVES.SCRATCH, MOVES.GROWL], 50, { types: ['ground'] }), makePokemon('sandshrew', 'SANDSHREW', 9, 'ground', [MOVES.SCRATCH, MOVES.GROWL], 27, { types: ['ground'] })] },
      { id: 'brock', name: 'BROCK', type: 'npc', position: { x: 4, y: 2 }, direction: 'down', trainerClass: 'brock', dialogue: badges.includes('BOULDER') ? ["¡Eres un gran entrenador!", "¡Sigue así!"] : ["¡Soy BROCK! ¡El líder de este gimnasio!", "¡Mis POKÉMON son duros como la roca!", "¡Prepárate para perder!"], isTrainer: true, trainerTeam: [makePokemon('geodude', 'GEODUDE', 10, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 74, { types: ['rock', 'ground'] }), makePokemon('onix', 'ONIX', 12, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 95, { types: ['rock', 'ground'] })] }
    ],
    CERULEAN_GYM: [
      { id: 'swimmer_cerulean_1', name: 'NADADORA DIANA', type: 'npc', position: { x: 4, y: 8 }, direction: 'down', trainerClass: 'swimmer', dialogue: ["¡El agua es mi elemento!", "¡Mis POKÉMON nadan más rápido que tú!"], isTrainer: true, trainerTeam: [makePokemon('goldeen', 'GOLDEEN', 16, 'water', [MOVES.TACKLE, MOVES.WATER_GUN], 118, { types: ['water'] })] },
      { id: 'jr_trainer_cerulean', name: 'CHICO LUIS', type: 'npc', position: { x: 6, y: 5 }, direction: 'left', trainerClass: 'jr_trainer', dialogue: ["¡Mis POKÉMON son fuertes!", "¡No me subestimes!"], isTrainer: true, trainerTeam: [makePokemon('horsea', 'HORSEA', 17, 'water', [MOVES.TACKLE, MOVES.WATER_GUN], 116, { types: ['water'] })] },
      { id: 'misty', name: 'MISTY', type: 'npc', position: { x: 4, y: 2 }, direction: 'down', trainerClass: 'misty', dialogue: badges.includes('CASCADE') ? ["¡Sigues mejorando como entrenador!", "¡Los POKÉMON de agua son los mejores!"] : ["¡Soy MISTY, la líder del GIMNASIO!", "¡Mi especialidad son los POKÉMON de tipo AGUA!", "¡Prepárate para mojarte!"], isTrainer: true, trainerTeam: [makePokemon('staryu', 'STARYU', 18, 'water', [MOVES.TACKLE, MOVES.WATER_GUN, MOVES.HARDEN], 120, { types: ['water'] }), makePokemon('starmie', 'STARMIE', 21, 'water', [MOVES.TACKLE, MOVES.WATER_GUN, MOVES.HARDEN], 121, { types: ['water', 'psychic'] })] }
    ],
    VERMILION_GYM: [
      { id: 'rocker_vermilion_1', name: 'ROCKERO HORACIO', type: 'npc', position: { x: 4, y: 8 }, direction: 'down', trainerClass: 'rocker', dialogue: ["¡La electricidad mueve el rock!", "¡Te voy a sacudir!"], isTrainer: true, trainerTeam: [makePokemon('voltorb', 'VOLTORB', 20, 'electric', [MOVES.TACKLE, MOVES.THUNDERSHOCK], 100)] },
      { id: 'gentleman_vermilion', name: 'CABALLERO RAUL', type: 'npc', position: { x: 6, y: 5 }, direction: 'left', trainerClass: 'gentleman', dialogue: ["¡Mis POKÉMON tienen chispa!", "¡Siente el trueno!"], isTrainer: true, trainerTeam: [makePokemon('pikachu', 'PIKACHU', 21, 'electric', [MOVES.THUNDERSHOCK, MOVES.GROWL], 25)] },
      { id: 'surge', name: 'TTE. SURGE', type: 'npc', position: { x: 4, y: 2 }, direction: 'down', trainerClass: 'surge', dialogue: badges.includes('THUNDER') ? ["¡Tienes potencial, novato!", "¡Sigue entrenando con esa MEDALLA TRUENO!"] : ["¡EH! ¡Soy el TENIENTE SURGE!", "¡Mis POKÉMON eléctricos te van a electrocutar!", "¡Prepárate para el dolor!"], isTrainer: true, trainerTeam: [makePokemon('voltorb', 'VOLTORB', 21, 'electric', [MOVES.TACKLE, MOVES.THUNDERSHOCK], 100), makePokemon('pikachu', 'PIKACHU', 18, 'electric', [MOVES.THUNDERSHOCK, MOVES.GROWL], 25), makePokemon('raichu', 'RAICHU', 24, 'electric', [MOVES.THUNDERSHOCK, MOVES.GROWL], 26)] }
    ],
    ROCK_TUNNEL_1F: [],
    POKEMON_TOWER_1F: [],
  };
}

export function buildItemDatabase(pickedItemIds: string[], storyStep: string): Record<MapID, Entity[]> {
  const rawItems: Record<MapID, Entity[]> = {
    KANTO_OVERWORLD: [
      // ── Pallet Town ──
      { id: 'sign_home',  type: 'object', position: w('PALLET_TOWN', 3, 5),   direction: 'down', sprite: '🪧', dialogue: ['CASA DE RED'] },
      { id: 'sign_rival', type: 'object', position: w('PALLET_TOWN', 12, 5),  direction: 'down', sprite: '🪧', dialogue: ['CASA DE AZUL'] },
      { id: 'sign_lab',   type: 'object', position: w('PALLET_TOWN', 7, 12),  direction: 'down', sprite: '🪧', dialogue: ['LAB. POKÉMON DEL PROF. OAK'] },
      { id: 'sign_town',  type: 'object', position: w('PALLET_TOWN', 13, 14), direction: 'down', sprite: '🪧', dialogue: ['PUEBLO PALETA', 'Un lugar de sombra y tonos puros.'] },
      ...(storyStep === 'START' ? [
        { id: 'lab_locked', type: 'object' as const, position: w('PALLET_TOWN', 12, 13), direction: 'down' as const, sprite: '🚫' },
      ] : []),
      // ── Route 1 ──
      { id: 'sign_route1',    type: 'object', position: w('ROUTE_1', 3, 15), direction: 'down', sprite: '🪧' },
      { id: 'item_potion_1',  type: 'item',   position: w('ROUTE_1', 7, 5),  direction: 'down', sprite: '🧪' },
      // ── Viridian City ──
      { id: 'viridian_gym_locked', type: 'object', position: w('VIRIDIAN_CITY', 28, 28), direction: 'up', sprite: '🚪', dialogue: ['El GIMNASIO de CIUDAD VERDE está cerrado.', 'El LÍDER ha salido.'] },
      // ── Route 2 ──
      { id: 'sign_route2',    type: 'object', position: w('ROUTE_2', 3, 15), direction: 'down', sprite: '🪧', dialogue: ['RUTA 2: Al norte a CIUDAD PLATEADA.'] },
      { id: 'item_potion_rt2', type: 'item',  position: w('ROUTE_2', 7, 5),  direction: 'down', sprite: '🧪' },
      // ── Viridian Forest ──
      { id: 'item_pokeball_1',   type: 'item', position: w('VIRIDIAN_FOREST', 10, 11), direction: 'down', sprite: '🔴' },
      { id: 'item_potion_forest', type: 'item', position: w('VIRIDIAN_FOREST', 20, 21), direction: 'down', sprite: '🧪' },
      // ── Pewter City ──
      { id: 'door_locked_1',  type: 'object', position: w('PEWTER_CITY', 10, 13), direction: 'up',   sprite: '🚪', dialogue: ['La puerta está cerrada por dentro.'] },
      { id: 'door_locked_2',  type: 'object', position: w('PEWTER_CITY', 24, 13), direction: 'up',   sprite: '🚪', dialogue: ['La puerta está cerrada por dentro.'] },
      { id: 'museum_locked',  type: 'object', position: w('PEWTER_CITY', 6,  9),  direction: 'up',   sprite: '🚪', dialogue: ['MUSEO DE CIENCIAS DE PLATEADA', 'Cerrado por hoy.'] },
      { id: 'sign_museum',    type: 'object', position: w('PEWTER_CITY', 3,  9),  direction: 'down', sprite: '🪧', dialogue: ['MUSEO DE CIENCIAS DE PLATEADA'] },
      { id: 'sign_gym',       type: 'object', position: w('PEWTER_CITY', 13, 19), direction: 'down', sprite: '🪧', dialogue: ['GIMNASIO POKÉMON DE PLATEADA', 'LÍDER: BROCK', 'El Pilar de Roca.'] },
      { id: 'sign_city',      type: 'object', position: w('PEWTER_CITY', 19, 34), direction: 'down', sprite: '🪧', dialogue: ['CIUDAD PLATEADA', 'Una ciudad de piedra gris.'] },
      // ── Cerulean City ──
      { id: 'door_locked_cerulean_pc',   type: 'object', position: w('CERULEAN_CITY', 19, 17), direction: 'up', sprite: '🚪', dialogue: ['La puerta está cerrada por dentro.'] },
      { id: 'door_locked_cerulean_mart', type: 'object', position: w('CERULEAN_CITY', 32, 17), direction: 'up', sprite: '🚪', dialogue: ['La puerta está cerrada por dentro.'] },
      { id: 'bike_shop_locked',   type: 'object', position: w('CERULEAN_CITY', 28, 11), direction: 'up',   sprite: '🚪', dialogue: ['TIENDA DE BICICLETAS', 'Sin una TARJETA de oferta, no hay nada que hacer.'] },
      { id: 'sign_bike_shop',     type: 'object', position: w('CERULEAN_CITY', 25, 11), direction: 'down', sprite: '🪧', dialogue: ['TIENDA DE BICICLETAS DE CIUDAD CELESTE'] },
      { id: 'sign_bill_route',    type: 'object', position: w('CERULEAN_CITY', 37, 5),  direction: 'down', sprite: '🪧', dialogue: ['HACIA RUTA 24 y CABAÑA DE BILL', '(Próximamente.)'] },
      { id: 'sign_city_cerulean', type: 'object', position: w('CERULEAN_CITY', 19, 34), direction: 'down', sprite: '🪧', dialogue: ['CIUDAD CELESTE', 'Una ciudad misteriosa y azul.'] },
      // ── Vermilion City ──
      { id: 'door_locked_vermilion_pc',   type: 'object', position: w('VERMILION_CITY', 19, 17), direction: 'up', sprite: '🚪', dialogue: ['La puerta está cerrada por dentro.'] },
      { id: 'door_locked_vermilion_mart', type: 'object', position: w('VERMILION_CITY', 32, 17), direction: 'up', sprite: '🚪', dialogue: ['La puerta está cerrada por dentro.'] },
      // ── Lavender Town ──
      { id: 'lavender_pc_locked',  type: 'object', position: w('LAVENDER_TOWN', 4,  7),  direction: 'up',   sprite: '🚪', dialogue: ['La puerta está cerrada por dentro.'] },
      { id: 'lavender_mart_locked',type: 'object', position: w('LAVENDER_TOWN', 13, 7),  direction: 'up',   sprite: '🚪', dialogue: ['La puerta está cerrada por dentro.'] },
      { id: 'sign_tower',          type: 'object', position: w('LAVENDER_TOWN', 7,  13), direction: 'down', sprite: '🪧', dialogue: ['TORRE POKÉMON', 'Aquí descansan los POKÉMON fallecidos.'] },
      { id: 'sign_lavender',       type: 'object', position: w('LAVENDER_TOWN', 3,  15), direction: 'down', sprite: '🪧', dialogue: ['PUEBLO LAVANDA', 'El pueblo noble y púrpura.'] },
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
    MT_MOON:     [{ id: 'item_potion_mtmoon',     type: 'item', position: { x: 14, y: 14 }, direction: 'down', sprite: '🧪' }],
    MT_MOON_B1F: [{ id: 'item_potion_mtmoon_b1f', type: 'item', position: { x: 14, y: 14 }, direction: 'down', sprite: '🧪' }],
    MT_MOON_B2F: [{ id: 'item_moonstone_mtmoon',  type: 'item', position: { x: 10, y: 10 }, direction: 'down', sprite: '🌙' }],
    PEWTER_GYM:     [],
    CERULEAN_GYM:   [],
    VERMILION_GYM:  [],
    ROCK_TUNNEL_1F: [],
    POKEMON_TOWER_1F: [],
  };

  return Object.fromEntries(
    Object.entries(rawItems).map(([map, entities]) => [
      map, entities.filter(e => !pickedItemIds.includes(e.id))
    ])
  ) as Record<MapID, Entity[]>;
}
