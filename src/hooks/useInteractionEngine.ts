import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Direction, Entity, MapID, NPC, Pokemon, Position, Tile } from '../types';
import { STARTERS } from '../constants';
import { soundManager } from '../lib/sounds';
import {
  BATTLE_TRANSITION,
  EXPLORING,
  HEALING,
  SHOP,
  type GamePhase,
} from '../types/gamePhase';
import { GRID_SIZE } from '../types';

type HealLocation = { map: MapID; pos: Position };

interface UseInteractionEngineParams {
  dialogue: string | null;
  inBattle: boolean;
  playerPos: Position;
  direction: Direction;
  currentMap: MapID;
  hasParcel: boolean;
  hasPokedex: boolean;
  inventory: string[];
  playerTeam: Pokemon[];
  npcs: Record<MapID, NPC[]>;
  items: Record<MapID, Entity[]>;
  maps: Record<MapID, Tile[][]>;
  setDialogue: Dispatch<SetStateAction<string | null>>;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
  setPlayerTeam: Dispatch<SetStateAction<Pokemon[]>>;
  setLastHealLocation: Dispatch<SetStateAction<HealLocation>>;
  setHasParcel: Dispatch<SetStateAction<boolean>>;
  setHasPokedex: Dispatch<SetStateAction<boolean>>;
  setInventory: Dispatch<SetStateAction<string[]>>;
  setPickedItemIds: Dispatch<SetStateAction<string[]>>;
  setStoryStep: Dispatch<SetStateAction<string>>;
  setEnemyPokemon: Dispatch<SetStateAction<Pokemon | null>>;
  setIsTrainerBattle: Dispatch<SetStateAction<boolean>>;
}

export const useInteractionEngine = ({
  dialogue,
  inBattle,
  playerPos,
  direction,
  currentMap,
  hasParcel,
  hasPokedex,
  inventory,
  playerTeam,
  npcs,
  items,
  maps,
  setDialogue,
  setPhase,
  setPlayerTeam,
  setLastHealLocation,
  setHasParcel,
  setHasPokedex,
  setInventory,
  setPickedItemIds,
  setStoryStep,
  setEnemyPokemon,
  setIsTrainerBattle,
}: UseInteractionEngineParams) => {
  const handleAction = useCallback(() => {
    soundManager.play('SELECT');
    if (dialogue) {
      setDialogue(null);
      return;
    }
    if (inBattle) return;

    let targetX = playerPos.x;
    let targetY = playerPos.y;
    switch (direction) {
      case 'up': targetY--; break;
      case 'down': targetY++; break;
      case 'left': targetX--; break;
      case 'right': targetX++; break;
    }

    const npc = npcs[currentMap]?.find(n => n.position.x === targetX && n.position.y === targetY);
    if (npc) {
      if (npc.id === 'mom' || npc.id === 'joy') {
        const name = npc.id === 'mom' ? 'MAMÁ' : 'JOY';
        const healPos =
          npc.id === 'mom'
            ? { map: 'PALLET_TOWN', pos: { x: 7, y: 11 } }
            : { map: 'POKECENTER', pos: { x: 10, y: 14 } };
        setLastHealLocation(healPos);
        setDialogue(`${name}: ¡Hola! Pareces cansado. Deberías descansar un poco...`);

        setTimeout(() => {
          setPhase(HEALING);
          setTimeout(() => {
            setPlayerTeam(prev =>
              prev.map(p => ({
                ...p,
                hp: p.maxHp,
                status: 'none',
                moves: p.moves.map(m => ({ ...m, pp: m.maxPp })),
              })),
            );
            soundManager.play('SELECT');
          }, 800);
          setTimeout(() => {
            setPhase(EXPLORING);
            setDialogue("... ... ... ¡Tus POKÉMON están en plena forma!");
          }, 1600);
        }, 1500);
      } else if (npc.id === 'clerk' && currentMap === 'POKEMART') {
        if (!hasParcel && !hasPokedex) {
          setHasParcel(true);
          setInventory(prev => [...prev, 'OAK_PARCEL']);
          setDialogue("DEPENDIENTE: ¡Ah! ¡Tú vienes de PUEBLO PALETA! Tengo un paquete para el PROF. OAK. ¿Se lo llevarías?");
        } else {
          setDialogue("DEPENDIENTE: ¡Hola! ¿Quieres comprar algo?");
          setTimeout(() => setPhase(SHOP), 1000);
        }
      } else if (npc.id === 'oak' && hasParcel) {
        setHasParcel(false);
        setHasPokedex(true);
        setInventory(prev => prev.filter(id => id !== 'OAK_PARCEL'));
        setDialogue("PROF. OAK: ¡Oh! ¡Es el paquete que pedí! ¡Gracias! Como recompensa, tomad esto: ¡Una POKÉDEX!");
      } else {
        setDialogue(npc.dialogue[0]);
      }

      if (npc.questId === 'parcel' && !inventory.includes('OAK_PARCEL')) {
        setInventory(prev => [...prev, 'OAK_PARCEL']);
        soundManager.play('SELECT');
        setDialogue("DEPENDIENTE: ¡Gracias! Por favor, entrégaselo al PROF. OAK.");
      }
      return;
    }

    const item = items[currentMap]?.find(i => i.position.x === targetX && i.position.y === targetY);
    if (item) {
      if (item.type === 'item' && currentMap === 'OAKS_LAB' && playerTeam.length === 0) {
        const starter = STARTERS.find(s => s.sprite === item.sprite);
        if (starter) {
          setPickedItemIds(prev => [...prev, item.id]);
          setPlayerTeam([starter]);
          setDialogue(`¡Has elegido a ${starter.name}!`);
          setStoryStep('PICKED_STARTER');
          soundManager.play('SELECT');

          setTimeout(() => {
            setDialogue("AZUL: ¡Pues yo elijo a este! ¡Vamos a ver quién es más fuerte!");
            setEnemyPokemon({ ...STARTERS[1], name: 'RIVAL ' + STARTERS[1].name });
            setIsTrainerBattle(true);
            soundManager.play('BATTLE_START');
            setPhase(BATTLE_TRANSITION);
          }, 1500);
        }
      } else if (item.type === 'item') {
        if (item.id.startsWith('item_potion')) {
          setPickedItemIds(prev => [...prev, item.id]);
          setInventory(prev => [...prev, 'POTION']);
          setDialogue("¡Has encontrado una POCIÓN!");
        } else if (item.id.startsWith('item_pokeball')) {
          setPickedItemIds(prev => [...prev, item.id]);
          setInventory(prev => [...prev, 'POKEBALL']);
          setDialogue("¡Has encontrado una POKÉ BALL!");
        }
        soundManager.play('SELECT');
      } else if (item.type === 'object') {
        if (item.id === 'sign_home') setDialogue("CASA DE PABLO: Hogar, dulce hogar.");
        if (item.id === 'sign_rival') setDialogue("CASA DE AZUL: ¡No pasar!");
        if (item.id === 'sign_lab') setDialogue("LABORATORIO DEL PROF. OAK: Investigando POKÉMON.");
        if (item.id === 'sign_route1') setDialogue("RUTA 1: Hacia CIUDAD VERDE.");
      }
      return;
    }

    const map = maps[currentMap];
    if (map && targetX >= 0 && targetX < GRID_SIZE && targetY >= 0 && targetY < GRID_SIZE) {
      const tile = map[targetY][targetX];
      if (tile.type === 'tree') {
        setDialogue("Es un árbol muy robusto.");
      } else if (tile.type === 'table') {
        setDialogue("Hay muchos libros sobre POKÉMON aquí.");
      } else if (tile.type === 'grass' && Math.random() < 0.05) {
        if (!inventory.includes('POTION')) {
          setInventory(prev => [...prev, 'POTION']);
          soundManager.play('SELECT');
          setDialogue("¡Has encontrado una POCIÓN escondida en la hierba!");
        }
      }
    }
  }, [
    dialogue,
    inBattle,
    playerPos,
    direction,
    currentMap,
    hasParcel,
    hasPokedex,
    inventory,
    playerTeam,
    npcs,
    items,
    maps,
    setDialogue,
    setPhase,
    setPlayerTeam,
    setLastHealLocation,
    setHasParcel,
    setHasPokedex,
    setInventory,
    setPickedItemIds,
    setStoryStep,
    setEnemyPokemon,
    setIsTrainerBattle,
  ]);

  return { handleAction };
};
