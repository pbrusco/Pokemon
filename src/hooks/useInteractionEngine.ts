import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { STARTERS } from '../constants';
import { soundManager } from '../lib/sounds';

export const useInteractionEngine = () => {

  const handleAction = useCallback(() => {
    soundManager.play('SELECT');
    
    // Grab completely fresh state!
    const state = useGameStore.getState();
    const { 
      dialogue, isBattle, playerPos, direction, currentMap, 
      inventory, playerTeam, hasParcel, hasPokedex,
      getNPCs, items, worldMaps
    } = state;

    if (dialogue) {
      state.setDialogue(null);
      return;
    }
    if (isBattle) return;

    // What tile are we facing?
    let targetX = playerPos.x;
    let targetY = playerPos.y;
    switch (direction) {
      case 'up': targetY--; break;
      case 'down': targetY++; break;
      case 'left': targetX--; break;
      case 'right': targetX++; break;
    }

    const currentMapNPCs = getNPCs()[currentMap] || [];
    const npc = currentMapNPCs.find(n => n.position.x === targetX && n.position.y === targetY);
    
    if (npc) {
      if (npc.id === 'mom' || npc.id === 'joy') {
        const name = npc.id === 'mom' ? 'MAMÁ' : 'JOY';
        state.setDialogue(`${name}: ¡Hola! Pareces cansado. Deberías descansar un poco...`);
        
        setTimeout(() => {
          const s = useGameStore.getState();
          s.setDialogue("... ... ... ¡Tus POKÉMON están en plena forma!");
          
          const healed = s.playerTeam.map(p => ({ ...p, hp: p.maxHp, status: 'none' as const }));
          s.updateTeam(healed);
          s.setLastHealLocation({ map: s.currentMap, pos: s.playerPos });
          soundManager.play('SELECT');
        }, 2000);
      } else if (npc.id === 'clerk' && currentMap === 'POKEMART') {
        if (!hasParcel && !hasPokedex) {
          state.setDialogue("DEPENDIENTE: ¡Ah! ¡Tú vienes de PUEBLO PALETA! Tengo un paquete para el PROF. OAK. ¿Se lo llevarías?");
          state.addInventoryItem('OAK_PARCEL');
          useGameStore.setState({ hasParcel: true });
        } else {
          state.setDialogue("DEPENDIENTE: ¡Hola! ¿Quieres comprar algo?");
          // In the future: trigger shop menu boolean here
        }
      } else if (npc.id === 'oak' && hasParcel) {
        useGameStore.setState({ hasParcel: false, hasPokedex: true });
        state.removeInventoryItem('OAK_PARCEL');
        state.setDialogue("PROF. OAK: ¡Oh! ¡Es el paquete que pedí! ¡Gracias! Como recompensa, tomad esto: ¡Una POKÉDEX!");
      } else {
        state.setDialogue(npc.dialogue[0]);
      }
      
      if (npc.questId === 'parcel' && !inventory.includes('OAK_PARCEL')) {
        state.addInventoryItem('OAK_PARCEL');
        soundManager.play('SELECT');
        state.setDialogue("DEPENDIENTE: ¡Gracias! Por favor, entrégaselo al PROF. OAK.");
      }
      return;
    }

    const mapItems = items[currentMap] || [];
    const item = mapItems.find(i => i.position.x === targetX && i.position.y === targetY);
    
    if (item) {
      if (item.type === 'item' && currentMap === 'OAKS_LAB' && playerTeam.length === 0) {
        const starter = STARTERS.find(s => s.sprite === item.sprite);
        if (starter) {
          state.updateTeam([starter]);
          state.setDialogue(`¡Has elegido a ${starter.name}!`);
          state.setStoryStep('PICKED_STARTER');
          soundManager.play('SELECT');
          
          setTimeout(() => {
            const s = useGameStore.getState();
            s.setDialogue("AZUL: ¡Pues yo elijo a este! ¡Vamos a ver quién es más fuerte!");
            s.setEnemyPokemon({ ...STARTERS[1], name: 'RIVAL ' + STARTERS[1].name });
            soundManager.play('BATTLE_START');
            s.setShowBattleTransition(true);
            s.setIsLocked(true);
          }, 1500);
        }
      } else if (item.type === 'item') {
        if (item.id.startsWith('item_potion')) {
          state.addInventoryItem('POTION');
          state.setDialogue("¡Has encontrado una POCIÓN!");
        } else if (item.id.startsWith('item_pokeball')) {
          state.addInventoryItem('POKEBALL');
          state.setDialogue("¡Has encontrado una POKÉ BALL!");
        }
        soundManager.play('SELECT');
      } else if (item.type === 'object') {
        if (item.id === 'sign_home') state.setDialogue("CASA DE PABLO: Hogar, dulce hogar.");
        if (item.id === 'sign_rival') state.setDialogue("CASA DE AZUL: ¡No pasar!");
        if (item.id === 'sign_lab') state.setDialogue("LABORATORIO DEL PROF. OAK: Investigando POKÉMON.");
        if (item.id === 'sign_route1') state.setDialogue("RUTA 1: Hacia CIUDAD VERDE.");
      }
      return;
    }

    // Hidden Items
    const map = worldMaps[currentMap];
    if (targetX >= 0 && targetX < 20 && targetY >= 0 && targetY < 20) {
      const tile = map[targetY][targetX];
      if (tile.type === 'tree') {
        state.setDialogue("Es un árbol muy robusto.");
      } else if (tile.type === 'table') {
        state.setDialogue("Hay muchos libros sobre POKÉMON aquí.");
      } else if (tile.type === 'grass' && Math.random() < 0.05) {
        if (!inventory.includes('POTION')) {
          state.addInventoryItem('POTION');
          soundManager.play('SELECT');
          state.setDialogue("¡Has encontrado una POCIÓN escondida en la hierba!");
        }
      }
    }
  }, []);

  return { handleAction };
};
