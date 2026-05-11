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
};
