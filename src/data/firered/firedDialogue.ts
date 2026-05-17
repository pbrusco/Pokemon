/**
 * Spanish dialogue + custom-behavior overrides for FireRed-extracted NPCs.
 *
 * Keyed by FireRed `local_id` (e.g. LOCALID_PALLET_PROF_OAK,
 * LOCALID_MOM, LOCALID_PALLET_FAT_MAN). When a key is missing, the runtime
 * falls back to a placeholder so the game still boots — translations land
 * here incrementally.
 */

import type { NPC } from '../../types';

interface NpcOverride {
  name?: string;
  dialogue?: string[];
  onInteract?: NPC['onInteract'];
}

export const NPC_OVERRIDES: Record<string, NpcOverride> = {
  // ── Pallet Town ────────────────────────────────────────────────────────
  LOCALID_MOM: {
    name: 'MAMÁ',
    dialogue: ['¡Red! Pareces cansado. Deja que cuide de tus POKÉMON.'],
    onInteract: 'heal',
  },
  LOCALID_PALLET_PROF_OAK: {
    name: 'PROF. OAK',
    dialogue: [
      '¡Espera! ¡No vayas por ahí!',
      '¡Es peligroso ir solo por la hierba alta!',
      'Ven conmigo a mi laboratorio.',
    ],
  },
  LOCALID_PALLET_SIGN_LADY: {
    name: 'CHICA',
    dialogue: [
      '¡Yo también entreno POKÉMON!',
      '¡Cuando crezca, seré una gran entrenadora!',
    ],
  },
  LOCALID_PALLET_FAT_MAN: {
    name: 'PESCADOR',
    dialogue: [
      '¡La tecnología es increíble!',
      '¡Ahora puedes guardar POKÉMON y objetos como datos en el PC!',
    ],
  },

  // ── Oak's Lab ──────────────────────────────────────────────────────────
  LOCALID_OAKS_LAB_PROF_OAK: {
    name: 'PROF. OAK',
    dialogue: [
      'OAK: ¡Bienvenido al mundo POKÉMON!',
      'Toma uno de estos POKÉMON, te ayudará en tu viaje.',
    ],
    onInteract: 'oak_parcel_turnin',
  },
  LOCALID_PROF_OAK: {
    name: 'PROF. OAK',
    dialogue: [
      'OAK: ¡Bienvenido al mundo POKÉMON!',
      'Toma uno de estos POKÉMON, te ayudará en tu viaje.',
    ],
    onInteract: 'oak_parcel_turnin',
  },
  LOCALID_OAKS_LAB_RIVAL: {
    name: 'AZUL',
    dialogue: [
      '¡Te demostraré que mi POKÉMON es mejor!',
    ],
  },
  LOCALID_OAKS_LAB_SCIENTIST_1: {
    name: 'AYUDANTE',
    dialogue: ['¡Estoy estudiando los POKÉMON como un asistente del PROF. OAK!'],
  },

  // ── Rival's House ──────────────────────────────────────────────────────
  LOCALID_DAISY: {
    name: 'MARGARITA',
    dialogue: ['¡Hola Red! Mi hermano es bastante presumido, ¿verdad?'],
  },

  // ── Pokémon Center (any city — single shared map for now) ─────────────
  LOCALID_NURSE: {
    name: 'ENFERMERA JOY',
    dialogue: [
      '¡Bienvenido al CENTRO POKÉMON!',
      '¿Quieres que cuide de tus POKÉMON?',
    ],
    onInteract: 'heal',
  },
  LOCALID_POKEMON_CENTER_NURSE: {
    name: 'ENFERMERA JOY',
    dialogue: ['¡Bienvenido al CENTRO POKÉMON!'],
    onInteract: 'heal',
  },

  // ── Pokémart clerk ─────────────────────────────────────────────────────
  LOCALID_POKEMART_CLERK: {
    name: 'TENDERO',
    dialogue: ['¡Bienvenido a la TIENDA POKÉMON!'],
    onInteract: 'shop',
  },

  // ── Viridian City ──────────────────────────────────────────────────────
  LOCALID_VIRIDIAN_OLD_MAN: {
    name: 'ANCIANO',
    dialogue: [
      '¡Ah! ¡Veo que estás entrenando POKÉMON!',
      'Cuando te cansas de la batalla, la hierba alta puede ser un buen escape...',
      'Pero ten cuidado: ¡nunca se sabe qué POKÉMON salvaje aparecerá!',
    ],
  },
  LOCALID_TUTORIAL_MAN: {
    name: 'ANCIANO',
    dialogue: [
      '¡Ese OAK! Me pidió que te enseñara a atrapar POKÉMON...',
      'Pero ya sabes cómo, ¿verdad? ¡Buena suerte!',
    ],
  },
  LOCALID_VIRIDIAN_WOMAN: {
    name: 'CHICA',
    dialogue: [
      '¿Has oído hablar del GIMNASIO de CIUDAD VERDE?',
      'Dicen que nadie ha visto al LÍDER en años...',
    ],
  },

  // ── Pewter City ─────────────────────────────────────────────────────────
  LOCALID_PEWTER_MUSEUM_GUIDE: {
    name: 'GUÍA',
    dialogue: [
      '¡Bienvenido al MUSEO DE LA CIENCIA de CIUDAD PLATEADA!',
      'Aquí puedes ver fósiles de POKÉMON prehistóricos.',
      'La entrada es de 50 POKÉMONEDAS.',
    ],
  },
  LOCALID_PEWTER_GYM_GUIDE: {
    name: 'GUÍA',
    dialogue: [
      '¡Hola! ¿Es tu primera vez en el GIMNASIO?',
      'BROCK usa POKÉMON de tipo ROCA.',
      '¡Los ataques de AGUA o PLANTA son tu mejor opción!',
    ],
  },
  LOCALID_PEWTER_AIDE: {
    name: 'AYUDANTE',
    dialogue: [
      '¡Hola! Soy un ayudante del PROF. OAK.',
      'Toma estas ZAPATILLAS DE CORRER. Te permiten moverte más rápido.',
      'Solo tienes que mantener pulsada la tecla B.',
    ],
  },

  // ── Cerulean City ───────────────────────────────────────────────────────
  LOCALID_CERULEAN_POLICEMAN: {
    name: 'POLICÍA',
    dialogue: [
      '¿Has visto algún miembro del TEAM ROCKET por aquí?',
      'Recibí un aviso de que estaban robando en CIUDAD CELESTE.',
      'Si ves algo sospechoso, ¡avísame!',
    ],
  },
  LOCALID_CERULEAN_GRUNT: {
    name: 'RECLUTA ROCKET',
    dialogue: [
      '¡Ja! ¡El TEAM ROCKET no tiene tiempo para niñatos como tú!',
      'Estamos ocupados... ¡con operaciones importantes!',
      '¡Largo de aquí!',
    ],
  },
  LOCALID_CERULEAN_SLOWBRO: {
    name: 'SLOWBRO',
    dialogue: [
      '...Sloooow...',
      '...bro...',
    ],
  },
  LOCALID_CERULEAN_LASS: {
    name: 'CHICA',
    dialogue: [
      '¿Has estado en el CABO CELESTE?',
      '¡La vista desde el puente es preciosa!',
      'Pero ten cuidado con los entrenadores del camino.',
    ],
  },
  LOCALID_CERULEAN_RIVAL: {
    name: 'AZUL',
    dialogue: [
      '¡Oye, Red! ¿Pasaste por el CABO CELESTE?',
      'Yo ya derroté a todos los entrenadores de allí.',
      '¡A ver si puedes seguir mi ritmo!',
    ],
  },
  LOCALID_CERULEAN_WOMAN: {
    name: 'MUJER',
    dialogue: [
      'El GIMNASIO de CIUDAD CELESTE tiene una piscina en el centro.',
      '¡MISTY, la líder, es una experta en POKÉMON de AGUA!',
    ],
  },

  // ── Route 24 / Bill's House ─────────────────────────────────────────────
  LOCALID_ROUTE24_ROCKET: {
    name: 'RECLUTA ROCKET',
    dialogue: [
      '¡Alto! ¡Este es territorio del TEAM ROCKET!',
      '...Es broma. Solo estoy haciendo de guardia en este puente.',
      'Si quieres pasar, tendrás que derrotarme en combate.',
    ],
  },
  LOCALID_BILL_HUMAN: {
    name: 'BILL',
    dialogue: [
      '¡Hola! Soy BILL. ¡Encantado de conocerte!',
      'Soy un experto en almacenar POKÉMON en el PC.',
      'Si alguna vez necesitas ayuda con tu PC, ¡avísame!',
    ],
  },

  // ── Route 22 / Route 23 ─────────────────────────────────────────────────
  LOCALID_ROUTE22_RIVAL: {
    name: 'AZUL',
    dialogue: [
      '¡Red! ¿Qué haces tú por aquí?',
      'Estaba entrenando para la LIGA POKÉMON.',
      '¡Vamos a probar lo fuertes que somos ahora!',
    ],
  },
  LOCALID_CASCADE_BADGE_GUARD: {
    name: 'GUARDIA',
    dialogue: [
      '¡Alto! Solo los entrenadores con la MEDALLA CASCADA pueden pasar.',
      'Ve al GIMNASIO de CIUDAD CELESTE si aún no la tienes.',
    ],
  },
  LOCALID_THUNDER_BADGE_GUARD: {
    name: 'GUARDIA',
    dialogue: [
      'Para continuar necesitas la MEDALLA TRUENO.',
      'El TENIENTE SURGE te espera en CIUDAD CARMÍN.',
    ],
  },
  LOCALID_RAINBOW_BADGE_GUARD: {
    name: 'GUARDIA',
    dialogue: [
      'Solo los que tienen la MEDALLA ARCOÍRIS pasan.',
      'ERIKA en CIUDAD AZULONA puede ponerte a prueba.',
    ],
  },
  LOCALID_SOUL_BADGE_GUARD: {
    name: 'GUARDIA',
    dialogue: [
      'La MEDALLA ALMA es necesaria para avanzar.',
      'KOGA te espera en el GIMNASIO de CIUDAD FUCSIA.',
    ],
  },
  LOCALID_MARSH_BADGE_GUARD: {
    name: 'GUARDIA',
    dialogue: [
      '¡Necesitas la MEDALLA PANTANO para seguir!',
      'SABRINA, en CIUDAD AZAFRÁN, no te lo pondrá fácil.',
    ],
  },
  LOCALID_VOLCANO_BADGE_GUARD: {
    name: 'GUARDIA',
    dialogue: [
      'Solo con la MEDALLA VOLCÁN puedes continuar.',
      'BLAINE en ISLA CANELA es tu siguiente desafío.',
    ],
  },
  LOCALID_EARTH_BADGE_GUARD: {
    name: 'GUARDIA',
    dialogue: [
      'La última: la MEDALLA TIERRA.',
      'El LÍDER de CIUDAD VERDE te espera.',
      '¡Buena suerte, entrenador!',
    ],
  },

  // ── Vermilion City ──────────────────────────────────────────────────────
  LOCALID_VERMILION_FERRY_SAILOR: {
    name: 'MARINERO',
    dialogue: [
      '¡Bienvenido al PUERTO de CIUDAD CARMÍN!',
      'El S.S. ANNE atraca aquí una vez al año.',
      'Necesitas un BILLETE para abordar.',
    ],
  },

  // ── SS Anne ─────────────────────────────────────────────────────────────
  LOCALID_SS_ANNE_RIVAL: {
    name: 'AZUL',
    dialogue: [
      '¡Red! ¡Incluso en el S.S. ANNE nos encontramos!',
      'Ya he derrotado a todos los entrenadores del barco.',
      '¡Veamos si has mejorado desde la última vez!',
    ],
  },
  LOCALID_SS_ANNE_CAPTAIN: {
    name: 'CAPITÁN',
    dialogue: [
      '¡Uf! Estoy muy mareado...',
      'El mareo me está matando...',
      'Gracias por visitarme. Toma esto como agradecimiento por tu preocupación.',
    ],
  },

  // ── Celadon City ────────────────────────────────────────────────────────
  LOCALID_CELADON_FAT_MAN: {
    name: 'HOMBRE',
    dialogue: [
      '¡Este es el GRAN EDIFICIO CELESTE de CIUDAD AZULONA!',
      'En la azotea tienes máquinas expendedoras con bebidas.',
      'En el sótano encontrarás... bueno, mejor descúbrelo tú mismo.',
    ],
  },
  LOCALID_CELADON_POLIWRATH: {
    name: 'POLIWRATH',
    dialogue: [
      '¡Poli!',
      '...Poli poli poliwrath.',
    ],
  },

  // ── Pokemon Tower ───────────────────────────────────────────────────────
  LOCALID_POKEMON_TOWER_RIVAL: {
    name: 'AZUL',
    dialogue: [
      '¡Red! ¿También estás aquí por los POKÉMON fantasma?',
      'Sin el SCOPE SILPH no puedes ni tocarlos.',
      'Supongo que ya lo sabías... ¿verdad?',
    ],
  },
  LOCALID_POKEMON_TOWER_GRUNT1: {
    name: 'RECLUTA ROCKET',
    dialogue: [
      '¡Fuera de aquí! ¡Esta torre es territorio del TEAM ROCKET!',
      'Estamos buscando algo muy valioso...',
    ],
  },
  LOCALID_POKEMON_TOWER_GRUNT2: {
    name: 'RECLUTA ROCKET',
    dialogue: [
      'Todos estos POKÉMON fantasma nos están poniendo nerviosos...',
      '¡Pero nadie detiene al TEAM ROCKET!',
    ],
  },
  LOCALID_POKEMON_TOWER_GRUNT3: {
    name: 'RECLUTA ROCKET',
    dialogue: [
      '¡El jefe nos va a ascender después de esto!',
      '...Si es que encontramos lo que estamos buscando...',
    ],
  },

  // ── Saffron City ────────────────────────────────────────────────────────
  LOCALID_SAFFRON_DOOR_GUARD_GRUNT: {
    name: 'RECLUTA ROCKET',
    dialogue: [
      '¡Prohibido el paso! El TEAM ROCKET controla CIUDAD AZAFRÁN ahora.',
      'Si quieres entrar a SILPH S.A., tendrás que pasar por encima de mí.',
    ],
  },

  // ── Cinnabar Island ─────────────────────────────────────────────────────
  LOCALID_CINNABAR_BILL: {
    name: 'BILL',
    dialogue: [
      '¡Eh! ¡Qué sorpresa verte por ISLA CANELA!',
      'Estoy investigando los POKÉMON de la MANSION abandonada.',
      'Dicen que allí se esconden secretos sobre MEW...',
    ],
  },

  // ── Mt. Moon ────────────────────────────────────────────────────────────
  LOCALID_HELIX_FOSSIL: {
    name: 'FÓSIL HELIX',
    dialogue: [
      'Un fósil de un POKÉMON marino prehistórico.',
      'Si lo llevas al LABORATORIO de ISLA CANELA,',
      'pueden revivirlo...',
    ],
  },
  LOCALID_DOME_FOSSIL: {
    name: 'FÓSIL DOMO',
    dialogue: [
      'Un fósil con forma de cúpula.',
      'Contiene los restos de un POKÉMON extinto.',
      'El LABORATORIO de ISLA CANELA puede revivirlo.',
    ],
  },
  LOCALID_MIGUEL: {
    name: 'MIGUEL',
    dialogue: [
      '¡Eh! ¿También viniste a buscar fósiles?',
      'He estado investigando el MT. MOON durante meses.',
      'Estos fósiles contienen ADN de POKÉMON prehistóricos.',
    ],
  },

  // ── Cerulean Cave ───────────────────────────────────────────────────────
  LOCALID_CERULEAN_CAVE_GUARD: {
    name: 'GUARDIA',
    dialogue: [
      '¡Alto! Esta cueva es extremadamente peligrosa.',
      'Solo los entrenadores que han demostrado ser CAMPEONES pueden entrar.',
      'Si aún no has llegado al ALTO MANDO, te sugiero que sigas entrenando.',
    ],
    onInteract: 'cerulean_cave_guard',
  },

  // ── Gym Leaders (gfx-based overrides) ──────────────────────────────────
  LOCALID_LEADER_BROCK: {
    name: 'BROCK',
    dialogue: [
      '¡Soy BROCK!',
      '¡Líder del GIMNASIO de CIUDAD PLATEADA!',
      '¡Mis POKÉMON de roca son imparables!',
    ],
  },
  LOCALID_LEADER_MISTY: {
    name: 'MISTY',
    dialogue: [
      '¡Soy MISTY!',
      '¡Líder del GIMNASIO de CIUDAD CELESTE!',
      '¡Mis POKÉMON de agua son invencibles!',
    ],
  },
  LOCALID_LEADER_LT_SURGE: {
    name: 'TENIENTE SURGE',
    dialogue: [
      '¡Soy el TENIENTE SURGE!',
      '¡Líder del GIMNASIO de CIUDAD CARMÍN!',
      '¡Mis POKÉMON eléctricos te electrocutarán!',
    ],
  },
  LOCALID_LEADER_ERIKA: {
    name: 'ERIKA',
    dialogue: [
      '¡Soy ERIKA!',
      '¡Líder del GIMNASIO de CIUDAD AZULONA!',
      '¡Mis POKÉMON planta son hermosos y fuertes!',
    ],
  },
  LOCALID_LEADER_KOGA: {
    name: 'KOGA',
    dialogue: [
      '¡Soy KOGA!',
      '¡Líder del GIMNASIO de CIUDAD FUCSIA!',
      '¡Mis tácticas ninja y POKÉMON veneno te derrotarán!',
    ],
  },
  LOCALID_LEADER_SABRINA: {
    name: 'SABRINA',
    dialogue: [
      '...Soy SABRINA...',
      'Líder del GIMNASIO de CIUDAD AZAFRÁN.',
      '...Tu mente es débil...',
    ],
  },
  LOCALID_LEADER_BLAINE: {
    name: 'BLAINE',
    dialogue: [
      '¡Soy BLAINE!',
      '¡Líder del GIMNASIO de ISLA CANELA!',
      '¡Mis POKÉMON fuego arden con pasión!',
    ],
  },
  LOCALID_LEADER_GIOVANNI: {
    name: 'GIOVANNI',
    dialogue: [
      '...Bienvenido...',
      'Soy GIOVANNI, el líder de CIUDAD VERDE.',
      '¡Prepárate para perder!',
    ],
  },

  // ── Elite Four ──────────────────────────────────────────────────────────
  LOCALID_BRUNO: {
    name: 'BRUNO',
    dialogue: [
      '¡HUYAH! Soy BRUNO del ALTO MANDO.',
      'Mi cuerpo y mi mente son uno con mis POKÉMON.',
      '¡Veamos si tú puedes decir lo mismo!',
    ],
  },
  LOCALID_LANCE: {
    name: 'LANCE',
    dialogue: [
      'Soy LANCE, el último del ALTO MANDO.',
      'Mis DRAGONES han entrenado conmigo desde siempre.',
      '¡No tendrás piedad ni del primero!',
    ],
  },
  LOCALID_LEAGUE_DOOR_GUARD: {
    name: 'GUARDIA',
    dialogue: [
      '¿Las ocho MEDALLAS? Déjame ver...',
      'Mmm, ¡muy bien! Adelante, CAMPEÓN en potencia.',
    ],
  },

  // ── Champions Room / Hall of Fame ───────────────────────────────────────
  LOCALID_CHAMPIONS_ROOM_PROF_OAK: {
    name: 'PROF. OAK',
    dialogue: [
      '¡RED! ¡Sabía que llegarías hasta aquí!',
      'Has demostrado ser un entrenador excepcional.',
      '¡Es hora de coronarte como CAMPEÓN!',
    ],
  },
  LOCALID_CHAMPIONS_ROOM_RIVAL: {
    name: 'AZUL',
    dialogue: [
      '¡Llevo años esperando este momento!',
      'Yo soy el CAMPEÓN, RED. ¡Ven y demuéstrame lo contrario!',
    ],
  },
  LOCALID_HALL_OF_FAME_PROF_OAK: {
    name: 'PROF. OAK',
    dialogue: [
      'RED, ahora eres parte de la HISTORIA POKÉMON.',
      'Tus POKÉMON quedarán inmortalizados en el SALÓN DE LA FAMA.',
    ],
  },
  LOCALID_CREDITS_PROF_OAK: {
    name: 'PROF. OAK',
    dialogue: [
      '¡Gracias por jugar, entrenador!',
      'Que tu aventura POKÉMON nunca termine.',
    ],
  },
  LOCALID_CREDITS_RIVAL: {
    name: 'AZUL',
    dialogue: [
      'Bueno... esta vez has ganado tú.',
      '¡La próxima vez no será tan fácil!',
    ],
  },

  // ── Giovanni encounters ─────────────────────────────────────────────────
  LOCALID_HIDEOUT_GIOVANNI: {
    name: 'GIOVANNI',
    dialogue: [
      '¡Tú! ¿Cómo te atreves a entrar en mi escondite?',
      'Soy GIOVANNI, el JEFE del TEAM ROCKET.',
      '¡Te haré pagar por tu osadía!',
    ],
  },
  LOCALID_SILPH_CO_GIOVANNI: {
    name: 'GIOVANNI',
    dialogue: [
      '¡De nuevo TÚ! ¿Es que no te rindes?',
      '¡SILPH S.A. será mía y nadie me lo impedirá!',
    ],
  },
  LOCALID_VIRIDIAN_GIOVANNI: {
    name: 'GIOVANNI',
    dialogue: [
      'Así que llegaste hasta aquí...',
      'Soy GIOVANNI, el LÍDER del GIMNASIO de CIUDAD VERDE.',
      '¡Y también el JEFE del TEAM ROCKET! ¡Adelante, mocoso!',
    ],
  },

  // ── Silph Co. ───────────────────────────────────────────────────────────
  LOCALID_SILPH_CO_RIVAL: {
    name: 'AZUL',
    dialogue: [
      '¡Eh, RED! ¿Tú también vienes a meterte con el TEAM ROCKET?',
      '¡Bien! ¡Veamos quién es más fuerte primero!',
    ],
  },
  LOCALID_SILPH_CO_11F_GRUNT1: {
    name: 'RECLUTA ROCKET',
    dialogue: ['¡No pasarás más allá!', 'El JEFE está MUY ocupado.'],
  },
  LOCALID_SILPH_CO_11F_GRUNT2: {
    name: 'RECLUTA ROCKET',
    dialogue: ['¡SILPH S.A. nos pertenece!', '¡Lárgate, mocoso!'],
  },
  LOCALID_SILPH_CO_7F_WORKER_M2: {
    name: 'TRABAJADOR',
    dialogue: [
      '¡Gracias por salvarnos!',
      'Toma, te regalo este MASTER BALL... ¡es broma, eso lo da el PRESIDENTE!',
    ],
  },

  // ── Pokedex objects (Oak's Lab) ─────────────────────────────────────────
  LOCALID_POKEDEX_1: {
    name: 'POKÉDEX',
    dialogue: [
      'Es una POKÉDEX.',
      'Una enciclopedia POKÉMON de alta tecnología.',
    ],
  },
  LOCALID_POKEDEX_2: {
    name: 'POKÉDEX',
    dialogue: [
      'Otra POKÉDEX en su soporte.',
      '...Esta parece tener el polvo de la anterior.',
    ],
  },

  // ── Rival's house ───────────────────────────────────────────────────────
  LOCALID_TOWN_MAP: {
    name: 'MAPA DE PUEBLO',
    dialogue: [
      'Es el MAPA DE PUEBLO de AZUL.',
      '¡Échale un ojo si necesitas orientarte!',
    ],
  },

  // ── Pewter Museum ───────────────────────────────────────────────────────
  LOCALID_MUSEUM_SCIENTIST1: {
    name: 'CIENTÍFICO',
    dialogue: [
      '¡Bienvenido al MUSEO DE LA CIENCIA!',
      'Aquí investigamos fósiles de POKÉMON prehistóricos.',
      '...Y tomamos café. Mucho café.',
    ],
  },
  LOCALID_OLD_AMBER: {
    name: 'ÁMBAR ANTIGUO',
    dialogue: [
      'Un trozo de ÁMBAR ANTIGUO.',
      'Hay algo atrapado en su interior...',
      'Dicen que podría contener ADN POKÉMON.',
    ],
  },
  LOCALID_PEWTER_HOUSE_NIDORAN: {
    name: 'NIDORAN',
    dialogue: [
      '¡Nido-NIDO!',
      'Este NIDORAN parece muy mimado.',
    ],
  },

  // ── Viridian School ─────────────────────────────────────────────────────
  LOCALID_SCHOOL_LASS: {
    name: 'CHICA',
    dialogue: [
      '¡Bienvenido a la ACADEMIA POKÉMON!',
      'Aquí estudiamos cómo entrenar POKÉMON correctamente.',
      '¡Aunque hoy más bien dibujamos!',
    ],
  },
  LOCALID_SCHOOL_WOMAN: {
    name: 'MAESTRA',
    dialogue: [
      '¿Tomas notas en la pizarra?',
      'La información sobre estados alterados te será MUY útil.',
    ],
  },

  // ── Bill's Cottage ──────────────────────────────────────────────────────
  LOCALID_BILL_CLEFAIRY: {
    name: 'CLEFAIRY',
    dialogue: [
      '¡Cle-FAIRY!',
      'Espera... esa voz... ¡es BILL!',
    ],
  },
  LOCALID_WONDER_NEWS_BERRY_MAN: {
    name: 'ANCIANO',
    dialogue: [
      '¿Bayas? ¿Quieres bayas?',
      'Toma, llévate algunas. ¡Pero no le digas a mi nieta!',
    ],
  },

  // ── Vermilion Fan Club ──────────────────────────────────────────────────
  LOCALID_POKEMON_FAN_CLUB_FAT_MAN: {
    name: 'PRESIDENTE',
    dialogue: [
      '¡Bienvenido al CLUB DE FANS POKÉMON!',
      'Yo soy el PRESIDENTE.',
      '¡Mira mi RAPIDASH! ¡Mi orgullo y alegría!',
    ],
  },
  LOCALID_POKEMON_FAN_CLUB_WOMAN: {
    name: 'CHICA',
    dialogue: [
      '¡Mi SEAKING es PRECIOSO!',
      '¡A que sí, SEAKING? ¡A que sí, mi vida?',
    ],
  },

  // ── Saffron Trainer Fan Club ────────────────────────────────────────────
  LOCALID_TRAINER_FAN_CLUB_BATTLE_GIRL: {
    name: 'CHICA',
    dialogue: ['¡Adoro a los entrenadores fuertes!', '¡Como tú! ¿O no?'],
  },
  LOCALID_TRAINER_FAN_CLUB_BEAUTY: {
    name: 'CHICA',
    dialogue: ['Los entrenadores guapos son lo mejor.', '...Tú estás bien también.'],
  },
  LOCALID_TRAINER_FAN_CLUB_BLACK_BELT: {
    name: 'KARATEKA',
    dialogue: ['¡Aquí valoramos la fuerza!', '¡Demuéstrala con tus puños... digo, con tus POKÉMON!'],
  },
  LOCALID_TRAINER_FAN_CLUB_GENTLEMAN: {
    name: 'CABALLERO',
    dialogue: ['Ah, los buenos entrenadores...', '¡Toman su té y vencen sin sudar!'],
  },
  LOCALID_TRAINER_FAN_CLUB_LITTLE_GIRL: {
    name: 'NIÑA',
    dialogue: ['¡Quiero ser entrenadora como ellos!', '¿Tú me das un POKÉMON?'],
  },
  LOCALID_TRAINER_FAN_CLUB_ROCKER: {
    name: 'ROCKERO',
    dialogue: ['¡ROCK AND ROLL POKÉMON!', '¡RUEEEEDA!'],
  },
  LOCALID_TRAINER_FAN_CLUB_WOMAN: {
    name: 'MUJER',
    dialogue: ['Mi hijo es un entrenador estupendo.', '¡A ver cuándo gana algo!'],
  },
  LOCALID_TRAINER_FAN_CLUB_YOUNGSTER: {
    name: 'JOVEN',
    dialogue: ['¡Yo también seré famoso algún día!', '¡Pantalones cortos para siempre!'],
  },

  // ── Cinnabar Gym (Quiz NPCs) ────────────────────────────────────────────
  LOCALID_AVERY: {
    name: 'AVERY',
    dialogue: ['¡Soy AVERY! ¿Sabes responder a las preguntas de BLAINE?', '¡Si no, te tocará luchar contra mí!'],
  },
  LOCALID_DEREK: {
    name: 'DEREK',
    dialogue: ['Las preguntas son sobre POKÉMON.', '¡Si fallas, yo seré tu castigo!'],
  },
  LOCALID_DUSTY: {
    name: 'DUSTY',
    dialogue: ['¿Apostamos? Si fallas, ¡combatimos!', '¡Y nadie me ha ganado todavía!'],
  },
  LOCALID_QUINN: {
    name: 'QUINN',
    dialogue: ['¡BLAINE adora los acertijos!', '¿Te crees listo? ¡Pues a ver qué tal!'],
  },
  LOCALID_RAMON: {
    name: 'RAMON',
    dialogue: ['¡El fuego es mi pasión!', '¡Como las preguntas de BLAINE!'],
  },
  LOCALID_ZAC: {
    name: 'ZAC',
    dialogue: ['Cada puerta esconde una pregunta.', '¡Y un combate, si fallas!'],
  },

  // ── Saffron Dojo ────────────────────────────────────────────────────────
  LOCALID_KARATE_MASTER: {
    name: 'MAESTRO KARATE',
    dialogue: [
      '¡HIIIYAAA! Soy el MAESTRO del DOJO.',
      '¡Demuestra tu valor en combate!',
      'Si me ganas, te regalaré uno de mis POKÉMON.',
    ],
  },

  // ── Celadon Game Corner ─────────────────────────────────────────────────
  LOCALID_GAME_CORNER_GRUNT: {
    name: 'RECLUTA ROCKET',
    dialogue: [
      '¡No mires! ¡Aquí no pasa nada raro!',
      '...Sólo estoy mirando esta pared. Sí, esta pared.',
    ],
  },

  // ── SS Anne dock object ─────────────────────────────────────────────────
  LOCALID_SS_ANNE: {
    name: 'S.S. ANNE',
    dialogue: [
      'Es el majestuoso S.S. ANNE.',
      'Su pintura blanca brilla bajo el sol.',
    ],
  },
  LOCALID_VERMILION_HARBOR_SAILOR: {
    name: 'MARINERO',
    dialogue: ['¿Tu BILLETE? Vale, sube a bordo.', '¡Y no te marees!'],
  },

  // ── Cinnabar Pokémon Center / Bill ──────────────────────────────────────
  LOCALID_CINNABAR_POKEMON_CENTER_BILL: {
    name: 'BILL',
    dialogue: [
      '¡Otra vez tú, RED!',
      'Estoy de vacaciones... ¡bueno, casi!',
      'En la MANSION ABANDONADA hay diarios muy interesantes.',
    ],
  },
};

// Funny Spanish fallback lines keyed by FireRed `gfx` (sprite class). Used when
// no specific localId / pattern override matches — instead of dropping a
// "(Sin traducir: ...)" placeholder we give the NPC a class-flavoured chuckle
// so the world feels alive while translations land.
export const FUNNY_FALLBACK_BY_GFX: Record<string, string[]> = {
  YOUNGSTER: ['¡Llevo pantalones cortos porque son cómodos!', '¿Tú no llevas? ¡Pues te aguantas!'],
  BUG_CATCHER: ['¡He cazado seis CATERPIE!', '¿Te interesa intercambiar? ¿Hola? ¿Adónde vas?'],
  LASS: ['¡Mira mi POKÉMON, qué mono!', '¿No te dan ganas de hacerle cosquillas?'],
  HIKER: ['¡SOY ROBUSTO!', 'Como mi GEODUDE. Pero con menos pelo.'],
  FISHER: ['He pescado un MAGIKARP así de grande.', '...Vale, así de pequeño. Pero era MUY brillante.'],
  GAMER: ['¡Hoy me siento con suerte!', 'Llevo perdiendo desde el martes pasado.'],
  GENTLEMAN: ['Ejem. Buenos días, caballero.', '¿No le parece que hace un tiempo espléndido?'],
  WOMAN_1: ['¿Sabes? Mi hijo es entrenador POKÉMON.', 'Aún no ha llamado. Hace tres años.'],
  WOMAN_2: ['¡Qué bonita está hoy CIUDAD!', '¿Cuál ciudad? Da igual, todas son bonitas.'],
  WOMAN_3: ['Mi marido está enganchado al juego.', 'Si lo ves en el CASINO, dile que vuelva a casa.'],
  OLD_WOMAN: ['En mis tiempos, los POKÉMON eran más educados.', 'Ahora todos te muerden el tobillo.'],
  OLD_WOMAN_1: ['¿Has visto mi MEOWTH?', 'Se fue persiguiendo una moneda y aún no ha vuelto.'],
  OLD_WOMAN_2: ['¡Ay, mis lumbares!', 'Esto de viajar ya no es lo que era.'],
  MAN: ['¿Tú también andas perdido?', 'Pues somos dos.'],
  MAN_1: ['Hace tanto calor que mi PSYDUCK se ha dormido.', 'Otra vez.'],
  MAN_2: ['Estoy esperando a alguien.', '...Llevo aquí desde 1996.'],
  MAN_3: ['Mi mujer me ha mandado a comprar leche.', 'Eso fue ayer. Hoy he traído POKÉ BALLS. Se va a enfadar.'],
  OLD_MAN: ['¡Eh, joven! ¿Qué te trae por aquí?', 'Yo solo estoy descansando los huesos.'],
  OLD_MAN_1: ['Esto antes era todo campo.', 'Ahora son todo CENTROS POKÉMON.'],
  OLD_MAN_2: ['Mi nieto me regaló una POKÉDEX.', '...No tengo ni idea de cómo se enciende.'],
  FAT_MAN: ['¡La tecnología es increíble!', 'Acabo de guardar mi sándwich en el PC.'],
  BALDING_MAN: ['Hace años yo era todo un campeón.', 'Eso, o lo soñé. Ya no me acuerdo.'],
  LITTLE_BOY: ['¡Cuando sea mayor seré el MEJOR ENTRENADOR!', '¡Si me dejan...!'],
  LITTLE_GIRL: ['¿Has visto mi JIGGLYPUFF?', 'Se quedó dormido en mitad de su canción. Otra vez.'],
  BOY: ['Mi hermano dice que soy un fracasado.', '¡Cuando sea CAMPEÓN se va a enterar!'],
  GIRL: ['¿Cuál es tu POKÉMON favorito?', '¡El mío es CLEFAIRY! ¡Mira qué orejitas!'],
  BEAUTY: ['Hola, guapo. ¿Quieres combatir?', '...Lo digo por los POKÉMON. ¡Por los POKÉMON!'],
  ROCKET: ['¡El TEAM ROCKET dominará el mundo!', '...Después de la siesta.'],
  ROCKET_M: ['¡Soy malo, malísimo!', '¡Mírame qué mal me porto!'],
  ROCKET_F: ['¿El JEFE? Está reunido.', '...Comiéndose un bocadillo. Pero está MUY ocupado.'],
  BIKER: ['¡VROOOOM! ¡VROOOOOM!', '...Sólo tengo el casco. Aún no he ahorrado para la moto.'],
  CUE_BALL: ['¡Te voy a dar puré!', '...De patata. Que está muy bueno.'],
  BLACK_BELT: ['¡HIIIYAAA!', 'Mi cinturón negro es de cuando aprobé judo en el cole.'],
  CHANNELER: ['Veo POKÉMON... muertos...', '...Bueno, en realidad solo veo a mi GASTLY haciendo el tonto.'],
  COOL_TRAINER_M: ['Soy un entrenador profesional.', 'Esto era mi pasatiempo. Ahora es mi tristeza.'],
  COOL_TRAINER_F: ['¿Crees que puedes ganarme?', '¡JA! Adorable.'],
  CRUSH_GIRL: ['¡HUYAH!', '¡Mi PRIMEAPE y yo somos invencibles!'],
  JUGGLER: ['Hago malabares con POKÉ BALLS.', 'Una... dos... tres... ¡cuatro... ouch!'],
  POKE_MANIAC: ['¡SOY EL MAYOR FAN DE LOS POKÉMON!', '¡Tengo 73 figuritas en casa! ¡Y un calcetín de PIKACHU!'],
  PSYCHIC_M: ['Puedo leer tu mente...', 'Estás pensando en patatas fritas. Tenía razón.'],
  PSYCHIC_F: ['Las energías están... alteradas hoy.', 'O es que me he tomado tres cafés.'],
  SAILOR: ['¡El mar es mi vida!', '...Aunque me marea un poco. No se lo digas a nadie.'],
  SCIENTIST: ['Estoy investigando algo MUY importante.', '...No te lo puedo contar. Pero confía: es importantísimo.'],
  SUPER_NERD: ['¿Sabías que MAGNETON son tres MAGNEMITE pegados?', '¡FASCINANTE! ¿Adónde vas? ¡Espera, tengo más datos!'],
  SWIMMER_M: ['¡Brrr! ¡El agua está fría!', '¿Te animas a nadar?'],
  SWIMMER_F: ['¡El agua está deliciosa!', 'No, en serio, tiene un toque a sal MUY bueno.'],
  TAMER: ['Mis POKÉMON me adoran.', '...Casi siempre. Hay días.'],
  ROCKER: ['¡RUEEEEDA, GUITARRA!', '¡Mi banda se llama LOS ELECTRODE!'],
  PROF_OAK_AIDE: ['¡Hola! Soy ayudante del PROF. OAK.', '...En realidad le hago el café.'],
  POKEFAN_M: ['¡Adoro a los POKÉMON!', '¡Tengo un álbum con un cromo de cada uno!'],
  POKEFAN_F: ['¡Mira qué mono es mi POKÉMON!', '¿A que sí? ¿A que sí? ¡Dilo!'],
  WAITRESS: ['Bienvenido. ¿Qué le pongo?', 'Tenemos POKÉCAFÉ y POKÉCAFÉ con leche.'],
  BIRD_KEEPER: ['¡Mis aves cortan el viento!', '...Bueno, el PIDGEY más bien lo respira despacito.'],
  UNION_ROOM_RECEPTIONIST: ['Bienvenido. ¿Desea conectarse?', '...Yo todavía estoy intentando conectar el WiFi.'],
  CLERK: ['¡Bienvenido a la TIENDA POKÉMON!', '¿Hoy le envuelvo la POCIÓN para regalo?'],
  NURSE: ['¡Bienvenido al CENTRO POKÉMON!', '...Aunque hoy estamos sin café.'],
  WORKER_M: ['¡Cuidado con la zona de obras!', '...Y con mi MACHOP, que está repartiendo cemento.'],
  WORKER_F: ['Trabajando, trabajando, siempre trabajando.', 'A veces sueño con dormir.'],
  // Pokémon-as-NPC sprites (zoo, talking pets)
  CHANSEY: ['¡CHAN-sey!', '...¡CHAAAAAN!'],
  KANGASKHAN: ['¡Kang-as-KHAN!', 'Su crío se asoma desde la bolsa y bosteza.'],
  LAPRAS: ['¡Laaaa-pras!', 'Te mira con ojos enormes y tristones.'],
  MACHOP: ['¡Mach-CHOP!', 'Está haciendo flexiones... con un solo dedo.'],
  SLOWPOKE: ['...Slooo...', '...wpoke...'],
  POLIWRATH: ['¡Poli! ¡Poli-wrath!', '¡POLI!'],
  PIDGEOT: ['¡Piii-geoot!', 'Despliega las alas con orgullo.'],
  CLEFAIRY: ['¡Clefa! ¡Clefa-fairy!', 'Tararea una melodía marciana.'],
  NIDORAN_F: ['¡Nido-ran!', '¿Será peligrosa? Tiene pinchos por todas partes.'],
  NIDORAN_M: ['¡Nido-RAN!', 'El cuerno parece afilado. Mejor no acercarse.'],
  MEOWTH: ['¡Meeeowth!', '...¿Te ha mordido la cartera? ¡Comprueba la cartera!'],
  VOLTORB: ['¡Vol-TORB!', 'Está vibrando un poco. Quizás demasiado.'],
  CHARMANDER: ['¡Char! ¡Char-mander!', 'Mueve la cola con cuidado para no quemar nada.'],
  SQUIRTLE: ['¡Squir-tle!', 'Sonríe enseñando los dientes.'],
  BULBASAUR: ['¡Bulba!', 'El bulbo de la espalda parece a punto de florecer.'],
  PIKACHU: ['¡Pika-pika!', 'Suelta una chispita. ¡Eso pica!'],
  EEVEE: ['¡Vui!', '¡VUI-VUI!'],
  PUSHABLE_BOULDER: ['Es una roca enorme.', 'Quizás se podría empujar con FUERZA.'],
  METEORITE: ['Es un meteorito muy antiguo.', 'Vibra ligeramente al acercarse.'],
  HO_OH: ['¡KYAAAA!', 'El POKÉMON legendario te observa.'],
  LUGIA: ['¡GROOOO!', 'El guardián de los mares te mira fijamente.'],
  ZAPDOS: ['¡ZAP-DOOOS!', 'El aire chisporrotea a su alrededor.'],
  ARTICUNO: ['¡Articuno!', 'Una brisa helada recorre la sala.'],
  MOLTRES: ['¡Mol-tres!', 'Hace mucho calor cerca de él.'],
  MEWTWO: ['...', '...Su mirada te atraviesa el alma.'],
  SS_ANNE: ['Es un barco de lujo gigantesco.', 'Apesta a sal y a perfume caro.'],
  SEAGALLOP: ['Un barquito rápido y modernísimo.', '¿Te llevamos a otra isla?'],
  TOWN_MAP: ['Es el MAPA DE PUEBLO.', '¡Te servirá para no perderte... mucho!'],
  POKEDEX: ['Es una POKÉDEX.', '¡La enciclopedia POKÉMON definitiva!'],
  OLD_AMBER: ['Un trozo de ámbar muy antiguo.', 'Hay algo atrapado dentro...'],
  SAPPHIRE: ['Un zafiro pequeño y muy brillante.', '...y muy probablemente muy caro.'],
  CITIZEN: ['Buenas tardes.', '...¿O eran buenos días? He perdido la cuenta.'],
};
