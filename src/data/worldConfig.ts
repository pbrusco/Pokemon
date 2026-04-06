import { MAP_PALLET_TOWN, MAP_OAKS_LAB, MAP_ROUTE_1, MAP_VIRIDIAN_CITY, MAP_POKECENTER, MAP_POKEMART, MAP_VIRIDIAN_FOREST, MAP_PEWTER_CITY, MAP_PEWTER_GYM } from './maps';
import { MOVES, STARTERS, WILD_POKEMON_DATABASE, makePokemon } from '../constants';
import { NPC, Entity } from '../types';

export const INITIAL_MAPS = {
  PALLET_TOWN: MAP_PALLET_TOWN,
  OAKS_LAB: MAP_OAKS_LAB,
  ROUTE_1: MAP_ROUTE_1,
  VIRIDIAN_CITY: MAP_VIRIDIAN_CITY,
  POKECENTER: MAP_POKECENTER,
  POKEMART: MAP_POKEMART,
  VIRIDIAN_FOREST: MAP_VIRIDIAN_FOREST,
  PEWTER_CITY: MAP_PEWTER_CITY,
  PEWTER_GYM: MAP_PEWTER_GYM
};

// NPCs logic dynamically inject variables when instantiating the world if needed,
// but for now we create a generic builder function to supply player states like hasParcel.
export const generateWorldNPCs = (hasParcel: boolean, hasPokedex: boolean, badges: string[]): Record<string, NPC[]> => ({
  PALLET_TOWN: [
    { id: 'mom', name: 'MAMÁ', type: 'npc', position: { x: 7, y: 10 }, direction: 'down', dialogue: ["¡Ten cuidado ahí fuera, hijo!", "Recuerda que el Prof. Oak te está buscando."] },
    { id: 'oak_pallet', name: 'PROF. OAK', type: 'npc', position: { x: 10, y: 4 }, direction: 'down', dialogue: ["¡Espera! ¡No vayas por ahí!", "¡Es peligroso ir solo por la hierba alta!", "Ven conmigo a mi laboratorio."] }
  ],
  OAKS_LAB: [
    { 
      id: 'oak', 
      name: 'PROF. OAK', 
      type: 'npc', 
      position: { x: 10, y: 7 }, 
      direction: 'down', 
      dialogue: hasParcel 
        ? ["¡Oh! ¡Es el paquete que pedí!", "¡Gracias! Como recompensa, tomad esto: ¡Una POKÉDEX!", "¡Es un inventario de alta tecnología!"] 
        : hasPokedex 
          ? ["¡La POKÉDEX es un gran invento!", "¡Trata de capturarlos a todos!"]
          : ["¡Hola Pablo! Por fin llegas.", "Toma uno de estos POKÉMON, te ayudará en tu viaje."] 
    },
    { id: 'rival', name: 'AZUL', type: 'npc', position: { x: 11, y: 7 }, direction: 'left', dialogue: ["¡Abuelo! ¡Yo también quiero un POKÉMON!", "¡Ja! Mi POKÉMON es mucho más fuerte que el tuyo."], isRival: true }
  ],
  ROUTE_1: [
    { 
      id: 'youngster_chano', 
      name: 'JOVEN CHANO', 
      type: 'npc', 
      position: { x: 12, y: 10 }, 
      direction: 'left', 
      dialogue: ["¡Eh! ¡Tú! ¡Mis POKÉMON son de lo mejor!", "¡No me ignores cuando te hablo!"],
      isTrainer: true,
      trainerTeam: [
        makePokemon('rattata', 'RATTATA', 4, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19)
      ]
    },
    { 
      id: 'bug_catcher', 
      name: 'CAZABICHOS', 
      type: 'npc', 
      position: { x: 7, y: 5 }, 
      direction: 'right', 
      dialogue: ["¿Te gustan los POKÉMON bicho?", "¡Son los más guays del mundo!"],
      isTrainer: true,
      trainerTeam: [
        makePokemon('caterpie', 'CATERPIE', 3, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10)
      ]
    }
  ],
  VIRIDIAN_CITY: [
    { id: 'citizen', name: 'CIUDADANO', type: 'npc', position: { x: 10, y: 12 }, direction: 'down', dialogue: ["¡Bienvenido a Ciudad Verde!", "Aquí puedes curar a tus POKÉMON en el Centro."] }
  ],
  POKECENTER: [
    { id: 'joy', name: 'ENFERMERA JOY', type: 'npc', position: { x: 10, y: 7 }, direction: 'down', dialogue: ["¡Hola! Bienvenida al CENTRO POKÉMON.", "Curaremos a tus POKÉMON hasta que estén a tope."] }
  ],
  POKEMART: [
    { 
      id: 'clerk', 
      name: 'DEPENDIENTE', 
      type: 'npc', 
      position: { x: 7, y: 7 }, 
      direction: 'down', 
      dialogue: (!hasParcel && !hasPokedex) 
        ? ["¡Ah! ¡Tú vienes de PUEBLO PALETA!", "Tengo un paquete para el PROF. OAK. ¿Se lo llevarías?", "¡Gracias! Dile que es de parte de la TIENDA."] 
        : ["¡Hola! ¿En qué puedo ayudarte hoy?"] 
    },
  ],
  VIRIDIAN_FOREST: [
    { 
      id: 'bug_catcher_forest', 
      name: 'CAZABICHOS RICKY', 
      type: 'npc', 
      position: { x: 10, y: 10 }, 
      direction: 'down', 
      dialogue: ["¡Mi POKÉMON bicho es el más fuerte!", "¡No podrás pasar de aquí!"],
      isTrainer: true,
      trainerTeam: [
        makePokemon('metapod', 'METAPOD', 6, 'bug', [MOVES.HARDEN, MOVES.TACKLE], 11)
      ]
    }
  ],
  PEWTER_CITY: [
    { id: 'pewter_citizen', name: 'CIUDADANO', type: 'npc', position: { x: 10, y: 15 }, direction: 'down', dialogue: ["¡Bienvenido a Ciudad Plateada!", "Brock es el líder del gimnasio local. ¡Es muy duro!"] }
  ],
  PEWTER_GYM: [
    { 
      id: 'gym_trainer', 
      name: 'ENTRENADOR GYM', 
      type: 'npc', 
      position: { x: 10, y: 11 }, 
      direction: 'down', 
      dialogue: ["¡Para llegar a BROCK tendrás que vencerme!", "¡Mis POKÉMON son duros!"],
      isTrainer: true,
      trainerTeam: [
        makePokemon('geodude', 'GEODUDE', 10, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 74, { types: ['rock', 'ground'] })
      ]
    },
    { 
      id: 'brock', 
      name: 'BROCK', 
      type: 'npc', 
      position: { x: 10, y: 7 }, 
      direction: 'down', 
      dialogue: badges.includes('BOULDER') 
        ? ["¡Eres un gran entrenador!", "¡Sigue así!"] 
        : ["¡Soy BROCK! ¡El líder de este gimnasio!", "¡Mis POKÉMON son duros como la roca!", "¡Prepárate para perder!"],
      isTrainer: true,
      trainerTeam: [
        makePokemon('geodude', 'GEODUDE', 12, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 74, { types: ['rock', 'ground'] }),
        makePokemon('onix', 'ONIX', 14, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 95, { types: ['rock', 'ground'] })
      ]
    }
  ]
});

export const INITIAL_TELEPORTS: Record<string, Entity[]> = {
  PALLET_TOWN: [
    { id: 'to_lab', type: 'teleport', position: { x: 10, y: 14 }, direction: 'up', targetMap: 'OAKS_LAB', targetPos: { x: 10, y: 14 } },
    { id: 'to_route1', type: 'teleport', position: { x: 10, y: 5 }, direction: 'up', targetMap: 'ROUTE_1', targetPos: { x: 10, y: 19 } }
  ],
  OAKS_LAB: [
    { id: 'to_pallet', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'PALLET_TOWN', targetPos: { x: 10, y: 14 } }
  ],
  ROUTE_1: [
    { id: 'to_pallet_from_route1', type: 'teleport', position: { x: 10, y: 19 }, direction: 'down', targetMap: 'PALLET_TOWN', targetPos: { x: 10, y: 6 } },
    { id: 'to_viridian', type: 'teleport', position: { x: 10, y: 0 }, direction: 'up', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 10, y: 19 } }
  ],
  VIRIDIAN_CITY: [
    { id: 'to_route1_from_viridian', type: 'teleport', position: { x: 10, y: 19 }, direction: 'down', targetMap: 'ROUTE_1', targetPos: { x: 10, y: 1 } },
    { id: 'to_center', type: 'teleport', position: { x: 7, y: 8 }, direction: 'up', targetMap: 'POKECENTER', targetPos: { x: 10, y: 14 } },
    { id: 'to_mart', type: 'teleport', position: { x: 14, y: 8 }, direction: 'up', targetMap: 'POKEMART', targetPos: { x: 10, y: 14 } },
    { id: 'to_forest', type: 'teleport', position: { x: 10, y: 0 }, direction: 'up', targetMap: 'VIRIDIAN_FOREST', targetPos: { x: 10, y: 17 } }
  ],
  POKECENTER: [
    { id: 'to_viridian', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 7, y: 9 } }
  ],
  POKEMART: [
    { id: 'to_viridian', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 14, y: 9 } }
  ],
  VIRIDIAN_FOREST: [
    { id: 'to_viridian_from_forest', type: 'teleport', position: { x: 10, y: 18 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 10, y: 1 } },
    { id: 'to_pewter', type: 'teleport', position: { x: 10, y: 0 }, direction: 'up', targetMap: 'PEWTER_CITY', targetPos: { x: 10, y: 17 } }
  ],
  PEWTER_CITY: [
    { id: 'to_forest_from_pewter', type: 'teleport', position: { x: 10, y: 18 }, direction: 'down', targetMap: 'VIRIDIAN_FOREST', targetPos: { x: 10, y: 1 } },
    { id: 'to_gym', type: 'teleport', position: { x: 10, y: 13 }, direction: 'up', targetMap: 'PEWTER_GYM', targetPos: { x: 10, y: 14 } }
  ],
  PEWTER_GYM: [
    { id: 'to_pewter_from_gym', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'PEWTER_CITY', targetPos: { x: 10, y: 14 } }
  ]
};

export const INITIAL_ITEMS: Record<string, Entity[]> = {
  OAKS_LAB: [
    { id: 'starter_1', type: 'item', position: { x: 9, y: 8 }, direction: 'down', sprite: STARTERS[0].sprite },
    { id: 'starter_2', type: 'item', position: { x: 10, y: 8 }, direction: 'down', sprite: STARTERS[1].sprite },
    { id: 'starter_3', type: 'item', position: { x: 11, y: 8 }, direction: 'down', sprite: STARTERS[2].sprite },
  ],
  PALLET_TOWN: [
    { id: 'sign_home', type: 'object', position: { x: 8, y: 10 }, direction: 'down', sprite: '🪧' },
    { id: 'sign_rival', type: 'object', position: { x: 12, y: 10 }, direction: 'down', sprite: '🪧' },
    { id: 'sign_lab', type: 'object', position: { x: 11, y: 14 }, direction: 'down', sprite: '🪧' },
  ],
  ROUTE_1: [
    { id: 'sign_route1', type: 'object', position: { x: 8, y: 15 }, direction: 'down', sprite: '🪧' },
    { id: 'item_potion_1', type: 'item', position: { x: 12, y: 5 }, direction: 'down', sprite: '🧪' }
  ],
  VIRIDIAN_CITY: [],
  POKECENTER: [],
  POKEMART: [],
  VIRIDIAN_FOREST: [
    { id: 'item_pokeball_1', type: 'item', position: { x: 5, y: 5 }, direction: 'down', sprite: '🔴' },
    { id: 'item_potion_forest', type: 'item', position: { x: 15, y: 15 }, direction: 'down', sprite: '🧪' }
  ],
  PEWTER_CITY: [],
  PEWTER_GYM: []
};

// Central world config object holding the base state before mutations
export const worldConfig = {
  maps: INITIAL_MAPS,
  teleports: INITIAL_TELEPORTS,
  items: INITIAL_ITEMS,
  encounterZones: WILD_POKEMON_DATABASE
};
