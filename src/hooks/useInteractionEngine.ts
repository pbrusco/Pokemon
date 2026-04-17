import { useCallback } from 'react';
import type { Pokemon, MapID, Position } from '../types';
import { HM_REQUIREMENTS, STARTERS } from '../constants';
import { soundManager } from '../lib/sounds';
import { sd } from '../lib/gameSpeed';
import { fullHeal } from '../lib/healUtils';
import { EXPLORING, HEALING, SHOP } from '../types/gamePhase';
import { useGameStore } from '../store/gameStore';

type HealLocation = { map: MapID; pos: Position };

interface UseInteractionEngineParams {
  initBattle: (enemyPokemon: Pokemon, isTrainer: boolean, trainerName?: string) => void;
}

export const useInteractionEngine = ({
  initBattle,
}: UseInteractionEngineParams) => {
  const handleAction = useCallback(() => {
    soundManager.play('SELECT');
    
    const store = useGameStore.getState();
    const { dialogue, phase, playerPos, direction, currentMap, hasParcel, hasPokedex, badges, inventory, playerTeam, pickedItemIds, worldMaps, isMoving, isLocked } = store;
    const inBattle = phase.type === 'BATTLE';
    
    if (dialogue) {
      const cb = store.dialogueCallback;
      store.setDialogue(null);
      if (cb) cb();
      return;
    }
    if (inBattle || isMoving || isLocked) return;

    let targetX = playerPos.x;
    let targetY = playerPos.y;
    switch (direction) {
      case 'up': targetY--; break;
      case 'down': targetY++; break;
      case 'left': targetX--; break;
      case 'right': targetX++; break;
    }

    const npcs = store.getNPCs();
    const items = store.getItems();

    const npc = npcs[currentMap]?.find(n => n.position.x === targetX && n.position.y === targetY);
    if (npc) {
      if (npc.isTrainer && npc.trainerTeam?.length && !store.defeatedTrainers.includes(npc.id)) {
        store.setDialogue(`${npc.name}: ${npc.dialogue[0]}`, () => {
          initBattle(npc.trainerTeam![0], true, npc.id);
        });
        return;
      }
      if (npc.onInteract === 'heal') {
        if (npc.id === 'mom' && playerTeam.length === 0) {
          store.setDialogue(`MAMÁ: ${npc.dialogue[0]}`);
          return;
        }
        const name = npc.name.includes('JOY') ? 'JOY' : 'MAMÁ';
        const healPos: HealLocation = npc.name.includes('JOY')
          ? { map: 'POKECENTER', pos: { x: 10, y: 14 } }
          : { map: 'PLAYERS_HOUSE_1F', pos: { x: 3, y: 6 } };
        store.setLastHealLocation(healPos);
        store.setDialogue(`${name}: ¡Hola! Pareces cansado. Deberías descansar un poco...`);

        setTimeout(() => {
          useGameStore.getState().setPhase(HEALING);
          setTimeout(() => {
            useGameStore.getState().setPlayerTeam(prev => prev.map(fullHeal));
            soundManager.play('SELECT');
          }, sd(800));
          setTimeout(() => {
            useGameStore.getState().setPhase(EXPLORING);
            useGameStore.getState().setDialogue("... ... ... ¡Tus POKÉMON están en plena forma!");
          }, sd(1600));
        }, sd(1500));
      } else if (npc.onInteract === 'shop' && currentMap === 'POKEMART') {
        if (!hasParcel && !hasPokedex) {
          store.setHasParcel(true);
          store.addInventoryItem('OAK_PARCEL');
          store.setDialogue("DEPENDIENTE: ¡Ah! ¡Tú vienes de PUEBLO PALETA! Tengo un paquete para el PROF. OAK. ¿Se lo llevarías?");
        } else {
          store.setDialogue("DEPENDIENTE: ¡Hola! ¿Quieres comprar algo?");
          setTimeout(() => useGameStore.getState().setPhase(SHOP), sd(1000));
        }
      } else if (npc.onInteract === 'oak_parcel_turnin' && hasParcel) {
        store.setHasParcel(false);
        store.setHasPokedex(true);
        store.removeInventoryItem('OAK_PARCEL');
        store.setDialogue("PROF. OAK: ¡Oh! ¡Es el paquete que pedí! ¡Gracias! Como recompensa, tomad esto: ¡Una POKÉDEX!");
      } else if (npc.onInteract === 'give_town_map') {
        if (!hasPokedex) {
          store.setDialogue(`MARGARITA: ${npc.dialogue[0]}`);
        } else if (!inventory['TOWN_MAP']) {
          store.addInventoryItem('TOWN_MAP');
          store.setDialogue("MARGARITA: ¡Aquí tienes el MAPA CIUDAD! ¡Te servirá para orientarte por KANTO!");
        } else {
          store.setDialogue(`MARGARITA: ${npc.dialogue[0]}`);
        }
      } else {
        store.setDialogue(npc.dialogue[0]);
      }

      if (npc.questId === 'parcel' && !inventory['OAK_PARCEL']) {
        store.addInventoryItem('OAK_PARCEL');
        soundManager.play('SELECT');
        store.setDialogue("DEPENDIENTE: ¡Gracias! Por favor, entrégaselo al PROF. OAK.");
      }
      return;
    }

    const item = items[currentMap]?.find(i => i.position.x === targetX && i.position.y === targetY);
    if (item) {
      if (item.type === 'item' && currentMap === 'OAKS_LAB' && playerTeam.length === 0) {
        const starter = STARTERS.find(s => s.sprite === item.sprite);
        if (starter) {
          store.setPickedItemIds(prev => [...prev, item.id]);
          store.setPlayerTeam([starter]);
          store.setDialogue(`¡Has elegido a ${starter.name}!`);
          store.setStoryStep('PICKED_STARTER');
          soundManager.play('SELECT');

          setTimeout(() => {
            if (useGameStore.getState().playerTeam.length === 0) return;
            useGameStore.getState().setDialogue("AZUL: ¡Pues yo elijo a este! ¡Vamos a ver quién es más fuerte!");
            const starterIndex = STARTERS.findIndex(s => s.sprite === item.sprite);
            const rivalIndex = (starterIndex + 1) % STARTERS.length;
            const rivalPkmn = { ...STARTERS[rivalIndex], name: 'RIVAL ' + STARTERS[rivalIndex].name };
            initBattle(rivalPkmn, true);
          }, sd(1500));
        }
      } else if (item.type === 'item') {
        if (item.id.startsWith('item_potion')) {
          store.setPickedItemIds(prev => [...prev, item.id]);
          store.addInventoryItem('POTION');
          store.setDialogue("¡Has encontrado una POCIÓN!");
        } else if (item.id.startsWith('item_pokeball')) {
          store.setPickedItemIds(prev => [...prev, item.id]);
          store.addInventoryItem('POKEBALL');
          store.setDialogue("¡Has encontrado una POKÉ BALL!");
        }
        soundManager.play('SELECT');
      } else if (item.type === 'object') {
        if (item.id === 'sign_home') store.setDialogue("CASA DE PABLO");
        else if (item.id === 'sign_rival') store.setDialogue("CASA DE AZUL");
        else if (item.id === 'sign_lab') store.setDialogue("LABORATORIO DEL PROF. OAK: Investigando POKÉMON.");
        else if (item.id === 'lab_locked') store.setDialogue("El laboratorio está cerrado. Parece que el PROF. OAK no está.");
        else if (item.id === 'sign_route1') store.setDialogue("RUTA 1: Hacia CIUDAD VERDE.");
        else if (item.id === 'snes') store.setDialogue("¡Red está jugando a la SNES! ... ¡Vale! ¡Es hora de irse!");
        else if (item.id === 'pc_reds_house') {
          if (!pickedItemIds.includes('item_potion_pc')) {
            store.setPickedItemIds(prev => [...prev, 'item_potion_pc']);
            store.addInventoryItem('POTION');
            store.setDialogue("¡Has sacado una POCIÓN del PC!");
          } else {
            store.setDialogue("El PC está encendido.");
          }
        } else if (item.dialogue && item.dialogue.length > 0) {
          store.setDialogue(item.dialogue[0]);
        }
      }
      return;
    }

    const map = worldMaps[currentMap];
    if (map && targetX >= 0 && targetX < map.tiles[0].length && targetY >= 0 && targetY < map.tiles.length) {
      const tile = map.tiles[targetY][targetX];
      if (tile.type === 'tree') {
        store.setDialogue("Es un árbol muy robusto.");
      } else if (tile.type === 'cut_tree') {
        const leadMoves = playerTeam[0]?.moves.map(m => m.name) ?? [];
        if (!badges.includes(HM_REQUIREMENTS.cut.badge)) {
          store.setDialogue(`Necesitas la medalla ${HM_REQUIREMENTS.cut.badge} para usar ${HM_REQUIREMENTS.cut.move}.`);
        } else if (!leadMoves.includes(HM_REQUIREMENTS.cut.move)) {
          store.setDialogue(`Tu POKÉMON líder no conoce ${HM_REQUIREMENTS.cut.move}.`);
        } else {
          map.tiles[targetY][targetX] = { type: 'path', walkable: true };
          store.setDialogue("¡CORTAR despejó el camino!");
        }
      } else if (tile.type === 'boulder') {
        const leadMoves = playerTeam[0]?.moves.map(m => m.name) ?? [];
        if (!badges.includes(HM_REQUIREMENTS.strength.badge)) {
          store.setDialogue(`Necesitas la medalla ${HM_REQUIREMENTS.strength.badge} para usar ${HM_REQUIREMENTS.strength.move}.`);
        } else if (!leadMoves.includes(HM_REQUIREMENTS.strength.move)) {
          store.setDialogue(`Tu POKÉMON líder no conoce ${HM_REQUIREMENTS.strength.move}.`);
        } else {
          map.tiles[targetY][targetX] = { type: 'path', walkable: true };
          store.setDialogue("¡FUERZA movió el obstáculo!");
        }
      } else if (tile.type === 'table') {
        store.setDialogue("Hay muchos libros sobre POKÉMON aquí.");
      } else if (tile.type === 'grass' && Math.random() < 0.05) {
        if (!inventory['POTION']) {
          store.addInventoryItem('POTION');
          soundManager.play('SELECT');
          store.setDialogue("¡Has encontrado una POCIÓN escondida en la hierba!");
        }
      }
    }
  }, [initBattle]);

  return { handleAction };
};
