import { MOVES, STARTERS, makePokemon } from '../constants';
import { NPC, Entity, MapID, Direction, Pokemon, Position } from '../types';

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
    PALLET_TOWN: [
      ...(playerTeam.length === 0 ? [{ id: 'oak_pallet', name: 'PROF. OAK', type: 'npc' as const, position: oakCutscenePos || { x: 10, y: 4 }, direction: oakCutsceneDir || ('down' as const), dialogue: ["¡Espera! ¡No vayas por ahí!", "¡Es peligroso ir solo por la hierba alta!", "Ven conmigo a mi laboratorio."] }] : []),
      { id: 'fat_man', name: 'SEÑOR GORDO', type: 'npc', position: { x: 16, y: 10 }, direction: 'left', dialogue: ["¡La tecnología es increíble!", "¡Ahora puedes guardar POKÉMON y objetos como datos en el PC!"] }
    ],
    PLAYERS_HOUSE_1F: [
      {
        id: 'mom',
        name: 'MAMÁ',
        type: 'npc',
        onInteract: 'heal',
        position: { x: 10, y: 8 },
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
        position: { x: 10, y: 8 },
        direction: 'down',
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
        position: { x: 10, y: 7 },
        direction: 'down' as const,
        dialogue: hasParcel
          ? ["¡Oh! ¡Es el paquete que pedí!", "¡Gracias! Como recompensa, tomad esto: ¡Una POKÉDEX!", "¡Es un inventario de alta tecnología!"]
          : hasPokedex
            ? ["¡La POKÉDEX es un gran invento!", "¡Trata de capturarlos a todos!"]
            : ["¡Hola Pablo! Por fin llegas.", "Toma uno de estos POKÉMON, te ayudará en tu viaje."]
      }] : []),
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
          makePokemon('rattata', 'RATTATA', 4, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19),
          makePokemon('spearow', 'SPEAROW', 4, 'flying', [MOVES.PECK, MOVES.GROWL], 21, { types: ['normal', 'flying'] })
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
          makePokemon('caterpie', 'CATERPIE', 3, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10),
          makePokemon('weedle', 'WEEDLE', 4, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] })
        ]
      }
    ],
    VIRIDIAN_CITY: [
      { id: 'citizen', name: 'CIUDADANO', type: 'npc', position: { x: 10, y: 12 }, direction: 'down', dialogue: ["¡Bienvenido a Ciudad Verde!", "Aquí puedes curar a tus POKÉMON en el Centro."] }
    ],
    POKECENTER: [
      { id: 'joy', name: 'ENFERMERA JOY', type: 'npc', onInteract: 'heal', position: { x: 10, y: 7 }, direction: 'down', dialogue: ["¡Hola! Bienvenida al CENTRO POKÉMON.", "Curaremos a tus POKÉMON hasta que estén a tope."] }
    ],
    POKEMART: [
      {
        id: 'clerk',
        name: 'DEPENDIENTE',
        type: 'npc',
        position: { x: 7, y: 7 },
        direction: 'down',
        onInteract: 'shop',
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
          makePokemon('caterpie', 'CATERPIE', 5, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10),
          makePokemon('metapod', 'METAPOD', 6, 'bug', [MOVES.HARDEN, MOVES.TACKLE], 11),
          makePokemon('weedle', 'WEEDLE', 5, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] })
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
          makePokemon('geodude', 'GEODUDE', 9, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 74, { types: ['rock', 'ground'] }),
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
    ],
    ROUTE_3: [
      {
        id: 'bug_catcher_rt3',
        name: 'CAZABICHOS LUIS',
        type: 'npc',
        position: { x: 5, y: 6 },
        direction: 'right' as Direction,
        dialogue: ["¡Los bichos son los mejores POKÉMON!", "¡Te voy a demostrar que soy el mejor!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('caterpie', 'CATERPIE', 9, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10),
          makePokemon('weedle', 'WEEDLE', 9, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] })
        ]
      },
      {
        id: 'lass_rt3',
        name: 'CHICA ELENA',
        type: 'npc',
        position: { x: 13, y: 11 },
        direction: 'left' as Direction,
        dialogue: ["¡Oye tú! ¡No pases por aquí sin luchar!", "¡Mis POKÉMON son adorables Y fuertes!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('jigglypuff', 'JIGGLYPUFF', 11, 'normal', [MOVES.TACKLE, MOVES.GROWL], 39),
          makePokemon('pidgey', 'PIDGEY', 11, 'flying', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] })
        ]
      },
      {
        id: 'youngster_rt3',
        name: 'CHICO ROBERTO',
        type: 'npc',
        position: { x: 8, y: 14 },
        direction: 'down' as Direction,
        dialogue: ["¡Llevo mis pantalones cortos todo el año!", "¡Eso me hace más fuerte!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('rattata', 'RATTATA', 11, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19),
          makePokemon('mankey', 'MANKEY', 12, 'fighting', [MOVES.SCRATCH, MOVES.TACKLE], 56)
        ]
      }
    ],
    MT_MOON: [
      {
        id: 'hiker_mtmoon',
        name: 'MONTAÑERO MARCOS',
        type: 'npc',
        position: { x: 6, y: 10 },
        direction: 'down',
        dialogue: ["¡Cuidado! ¡Aquí abundan los ZUBAT!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('geodude', 'GEODUDE', 10, 'rock', [MOVES.TACKLE], 74, { types: ['rock', 'ground'] }),
          makePokemon('zubat', 'ZUBAT', 10, 'poison', [MOVES.TACKLE], 41, { types: ['poison', 'flying'] })
        ]
      },
      {
        id: 'rocket_mtmoon',
        name: 'SOLDADO ROCKET',
        type: 'npc',
        position: { x: 12, y: 5 },
        direction: 'left',
        dialogue: ["¡El TEAM ROCKET se hará con todos los fósiles de MT MOON!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('rattata', 'RATTATA', 11, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19),
          makePokemon('zubat', 'ZUBAT', 11, 'poison', [MOVES.TACKLE], 41, { types: ['poison', 'flying'] })
        ]
      }
    ],
    ROUTE_2: [
      {
        id: 'bug_catcher_rt2',
        name: 'CAZABICHOS TOMY',
        type: 'npc',
        position: { x: 9, y: 12 },
        direction: 'right',
        dialogue: ["¡Atrapé estos bichos en el Bosque Verde!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('caterpie', 'CATERPIE', 4, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10),
          makePokemon('weedle', 'WEEDLE', 4, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] })
        ]
      }
    ],
  };
}

export function buildItemDatabase(pickedItemIds: string[], storyStep: string): Record<MapID, Entity[]> {
  const rawItems: Record<MapID, Entity[]> = {
    OAKS_LAB: [
      { id: 'starter_1', type: 'item', position: { x: 9, y: 8 }, direction: 'down', sprite: STARTERS[0].sprite },
      { id: 'starter_2', type: 'item', position: { x: 10, y: 8 }, direction: 'down', sprite: STARTERS[1].sprite },
      { id: 'starter_3', type: 'item', position: { x: 11, y: 8 }, direction: 'down', sprite: STARTERS[2].sprite },
    ],
    PALLET_TOWN: [
      { id: 'sign_home', type: 'object', position: { x: 8, y: 10 }, direction: 'down', sprite: '🪧' },
      { id: 'sign_rival', type: 'object', position: { x: 12, y: 10 }, direction: 'down', sprite: '🪧' },
      { id: 'sign_lab', type: 'object', position: { x: 11, y: 14 }, direction: 'down', sprite: '🪧' },
      ...(storyStep === 'START' ? [
        { id: 'lab_locked', type: 'object' as const, position: { x: 10, y: 14 }, direction: 'down' as const, sprite: '🚫' },
      ] : []),
    ],
    PLAYERS_HOUSE_1F: [],
    PLAYERS_HOUSE_2F: [
      { id: 'snes', type: 'object', position: { x: 5, y: 5 }, direction: 'down', sprite: '🎮' },
      { id: 'pc_reds_house', type: 'object', position: { x: 15, y: 5 }, direction: 'down', sprite: '💻' },
    ],
    RIVALS_HOUSE: [],
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
    PEWTER_CITY: [
      { id: 'door_locked_1', type: 'object', position: { x: 6, y: 9 }, direction: 'up', sprite: '🚪', dialogue: ['La puerta está cerrada por dentro.'] },
      { id: 'door_locked_2', type: 'object', position: { x: 14, y: 9 }, direction: 'up', sprite: '🚪', dialogue: ['La puerta está cerrada por dentro.'] }
    ],
    PEWTER_GYM: [],
    ROUTE_3: [],
    MT_MOON: [
      { id: 'item_potion_mtmoon', type: 'item', position: { x: 14, y: 14 }, direction: 'down', sprite: '🧪' }
    ],
    ROUTE_2: [
      { id: 'sign_route2', type: 'object', position: { x: 4, y: 15 }, direction: 'down', sprite: '🪧', dialogue: ['RUTA 2: Al norte a CIUDAD PLATEADA.'] },
      { id: 'item_potion_rt2', type: 'item', position: { x: 10, y: 5 }, direction: 'down', sprite: '🧪' }
    ],
  };

  return Object.fromEntries(
    Object.entries(rawItems).map(([map, entities]) => [
      map, entities.filter(e => !pickedItemIds.includes(e.id))
    ])
  ) as Record<MapID, Entity[]>;
}
