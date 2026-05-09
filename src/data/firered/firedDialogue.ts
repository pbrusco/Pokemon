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
