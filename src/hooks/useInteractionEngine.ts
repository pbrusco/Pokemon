import { useCallback } from 'react';
import type { Pokemon, MapID, Position, NPC } from '../types';
import { MOVES } from '../constants/moves';
import { STARTERS, makePokemon } from '../constants/pokemon';
import { HM_REQUIREMENTS, ITEMS_DATABASE } from '../constants/items';
import { sd } from '../lib/gameSpeed';
import { fullHeal } from '../lib/healUtils';
import { EXPLORING, HEALING, SHOP } from '../types/gamePhase';
import { SfxController } from '../lib/sfx';
import { useGameStore } from '../store/gameStore';

type HealLocation = { map: MapID; pos: Position };

interface UseInteractionEngineParams {
  initBattle: (enemyTeam: Pokemon[], isTrainer: boolean, trainerName?: string) => void;
}

/** Handle story-progression NPC interactions */
function handleStoryNPC(npc: NPC, inventory: Record<string, number>, store: ReturnType<typeof useGameStore.getState>): boolean {
  // Drink guard gate (Saffron Route 5 / Route 6 / Route 7 / Route 8)
  if (npc.questId === 'thirsty_guard') {
    if (inventory['FRESH_WATER'] || inventory['LEMONADE'] || inventory['SODA_POP']) {
      const drink = inventory['FRESH_WATER'] ? 'FRESH_WATER' : inventory['LEMONADE'] ? 'LEMONADE' : 'SODA_POP';
      store.removeInventoryItem(drink);
      store.setDialogue('GUARDIA: ¡Ahhh! ¡Qué fresca! ¡Gracias! Ya puedes pasar.');
      store.setEventFlag('BEAT_THIRSTY_GUARD');
    } else {
      store.setDialogue("GUARDIA: ¡Tengo mucha sed! Si me traes una bebida te dejaré pasar...");
    }
    return true;
  }
  // Route 23 badge check guards
  if (npc.questId === 'badge_check') {
    const badge = npc.requiredBadge ?? '';
    if (badge && store.badges.includes(badge)) {
      store.setDialogue('GUARDIA: ¡Puedes pasar, entrenador!');
    } else {
      store.setDialogue('GUARDIA: ¡Alto! Necesitas la MEDALLA ' + badge + ' para seguir.');
    }
    return true;
  }
  // Route 22 gate check (player needs at least one Pokemon)
  if (npc.questId === 'route22_check') {
    if (store.playerTeam.length === 0) {
      store.setDialogue('GUARDIA: ¡No puedes pasar sin POKÉMON! ¡Es demasiado peligroso!');
    } else {
      store.setDialogue('GUARDIA: ¡Puedes pasar, entrenador!');
    }
    return true;
  }
  return false;
}

export const useInteractionEngine = ({
  initBattle,
}: UseInteractionEngineParams) => {
  const handleAction = useCallback(() => {
    
    const store = useGameStore.getState();
    const { dialogue, phase, playerPos, direction, currentMap, hasParcel, hasPokedex, badges, inventory, playerTeam, pickedItemIds, worldMaps, isMoving, isLocked } = store;
    const inBattle = phase.type === 'BATTLE';
    
    if (dialogue) {
      const cb = store.dialogueCallback;
      SfxController.play('dialog_advance');
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

    // Pokemon Center / Mart counters block movement, but FireRed lets the player
    // talk to the NPC standing on the other side. If the player faces a counter
    // tile, pass the interaction through one more tile in the same direction.
    const currentMapData = worldMaps[currentMap];
    const facedTile = currentMapData?.tiles[targetY]?.[targetX];
    if (facedTile?.type === 'counter') {
      switch (direction) {
        case 'up': targetY--; break;
        case 'down': targetY++; break;
        case 'left': targetX--; break;
        case 'right': targetX++; break;
      }
    }

    const npc = npcs[currentMap]?.find(n => n.position.x === targetX && n.position.y === targetY) as NPC | undefined;
    if (npc) {
      if (handleStoryNPC(npc, inventory, store)) return;
      if (npc.isTrainer && npc.trainerTeam?.length && !store.defeatedTrainers.includes(npc.id)) {
        store.setDialogue(`${npc.name}: ${npc.dialogue[0]}`, () => {
          initBattle(npc.trainerTeam!, true, npc.id);
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
          ? { map: currentMap, pos: { x: 4, y: 2 } }
          : { map: 'PLAYERS_HOUSE_1F', pos: { x: 3, y: 6 } };
        store.setLastHealLocation(healPos);
        if (npc.name.includes('JOY')) {
          const town = currentMap.replace(/^POKECENTER_/, '');
          store.addVisitedTown(town);
        }
        store.setDialogue(`${name}: ¡Hola! Pareces cansado. Deberías descansar un poco...`);

        setTimeout(() => {
          SfxController.play('heal');
          useGameStore.getState().setPhase(HEALING);
          setTimeout(() => {
            useGameStore.getState().setPlayerTeam(prev => prev.map(fullHeal));
          }, sd(800));
          setTimeout(() => {
            useGameStore.getState().setPhase(EXPLORING);
            useGameStore.getState().setDialogue("... ... ... ¡Tus POKÉMON están en plena forma!");
          }, sd(1600));
        }, sd(1500));
      } else if (npc.onInteract === 'shop' && currentMap.startsWith('POKEMART')) {
        if (!hasParcel && !hasPokedex) {
          store.setHasParcel(true);
          store.addInventoryItem('OAK_PARCEL');
          SfxController.play('item_get');
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
          SfxController.play('item_get');
          store.setDialogue("MARGARITA: ¡Aquí tienes el MAPA CIUDAD! ¡Te servirá para orientarte por KANTO!");
        } else {
          store.setDialogue(`MARGARITA: ${npc.dialogue[0]}`);
        }
      } else if (npc.onInteract === 'give_poke_flute') {
        if (!inventory['POKE_FLUTE']) {
          store.addInventoryItem('POKE_FLUTE');
          store.setHasPokeFlute(true);
          SfxController.play('item_get');
          store.setDialogue('¡Recibiste la FLAUTA POKé!');
        } else {
          store.setDialogue('La FLAUTA POKé ya la tienes.');
        }
      } else if (npc.onInteract === 'give_ss_ticket') {
        if (!inventory['SS_TICKET']) {
          store.addInventoryItem('SS_TICKET');
          store.setHasSsTicket(true);
          SfxController.play('item_get');
          store.setDialogue('¡Recibiste el BILLETE SS!');
        } else {
          store.setDialogue('¡El barco SS ANNE está en el muelle de CIUDAD CARMÍN!');
        }
      } else if (npc.onInteract === 'wake_snorlax') {
        if (!inventory['POKE_FLUTE']) {
          store.setDialogue('Está dormido profundamente...');
        } else {
          store.setDialogue('¡La FLAUTA POKé despertó a SNORLAX!\n¡Quiere luchar!');
          store.setPendingSnorlaxId(npc.id);
          setTimeout(() => initBattle(
            [makePokemon('snorlax', 'SNORLAX', 30, 'normal', [MOVES.REST, MOVES.AMNESIA, MOVES.BODY_SLAM, MOVES.HEADBUTT], 143)],
            false
          ), sd(800));
        }
      } else {
        store.setDialogue(npc.dialogue[0]);
      }

      if (npc.questId === 'parcel' && !inventory['OAK_PARCEL']) {
        store.addInventoryItem('OAK_PARCEL');
        store.setDialogue("DEPENDIENTE: ¡Gracias! Por favor, entrégaselo al PROF. OAK.");
      }
      return;
    }

    const item = items[currentMap]?.find(i => i.position.x === targetX && i.position.y === targetY);
    if (item) {
      if (item.type === 'item' && currentMap === 'OAKS_LAB' && playerTeam.length === 0) {
        const starter = STARTERS.find(s => s.sprite === item.sprite);
        if (starter) {
          // Confirmation prompt before locking in the starter (canonical
          // FireRed flow). The player can back out and pick a different ball.
          store.setConfirm({
            text: `OAK: ¿Quieres elegir a ${starter.name} como tu primer POKÉMON?`,
            onYes: () => {
              const s = useGameStore.getState();
              s.setPickedItemIds(prev => [...prev, item.id]);
              s.setPlayerTeam([starter]);
              s.setDialogue(`¡Has elegido a ${starter.name}!`);
              s.setStoryStep('PICKED_STARTER');

              setTimeout(() => {
                if (useGameStore.getState().playerTeam.length === 0) return;
                const starterIndex = STARTERS.findIndex(p => p.sprite === item.sprite);
                const rivalIndex = (starterIndex + 1) % STARTERS.length;
                const rivalPkmn = { ...STARTERS[rivalIndex] };
                useGameStore.getState().setDialogue(
                  "AZUL: ¡Pues yo elijo a este! ¡Vamos a ver quién es más fuerte!",
                  () => initBattle([rivalPkmn], true, 'rival'),
                );
              }, sd(1500));
            },
            onNo: () => {
              useGameStore.getState().setDialogue(
                `OAK: Tómate tu tiempo. Mira los demás POKÉMON antes de decidir.`,
              );
            },
          });
        }
      } else if (item.type === 'item') {
        const itemKey = item.itemId || 
                       Object.keys(ITEMS_DATABASE).find(k => item.id.includes(k.toLowerCase())) || 
                       (item.id.includes('potion') ? 'POTION' : item.id.includes('pokeball') ? 'POKEBALL' : null);

        if (itemKey && ITEMS_DATABASE[itemKey]) {
          const dbItem = ITEMS_DATABASE[itemKey];
          store.setPickedItemIds(prev => [...prev, item.id]);
          store.addInventoryItem(itemKey);
          SfxController.play('item_get');
          if (itemKey === 'SILPH_SCOPE') store.setHasSilphScope(true);
          store.setDialogue(`¡Has encontrado: ${dbItem.name}!`);
        }
      } else if (item.type === 'object') {
        if (item.id === 'pc_reds_house') {
          if (!pickedItemIds.includes('item_potion_pc')) {
            store.setPickedItemIds(prev => [...prev, 'item_potion_pc']);
            store.addInventoryItem('POTION');
            SfxController.play('item_get');
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
      } else if (tile.type === 'water') {
        const surfReq = HM_REQUIREMENTS.surf;
        if (!badges.includes(surfReq.badge)) {
          store.setDialogue(`¡El agua parece profunda! Necesitas la medalla ${surfReq.badge} para navegar.`);
        } else {
          const surfMon = playerTeam.find(p => p.moves.some(m => m.name === surfReq.move));
          if (!surfMon) {
            store.setDialogue(`Ningún POKÉMON sabe ${surfReq.move}.`);
          } else if (!store.isSurfing) {
            store.setConfirm({
              text: `¿Usar ${surfReq.move}?`,
              onYes: () => { store.setIsSurfing(true); store.setConfirm(null); },
              onNo: () => { store.setConfirm(null); },
            });
            return;
          }
        }
      } else if (tile.type === 'cut_tree') {
        const leadMoves = playerTeam[0]?.moves.map(m => m.name) ?? [];
        if (!badges.includes(HM_REQUIREMENTS.cut.badge)) {
          store.setDialogue(`Necesitas la medalla ${HM_REQUIREMENTS.cut.badge} para usar ${HM_REQUIREMENTS.cut.move}.`);
        } else if (!leadMoves.includes(HM_REQUIREMENTS.cut.move)) {
          store.setDialogue(`Tu POKÉMON líder no conoce ${HM_REQUIREMENTS.cut.move}.`);
        } else {
          const pathTile = { type: 'path' as const, walkable: true };
          map.tiles[targetY][targetX] = pathTile;
          store.setModifiedTile(currentMap, targetX, targetY, pathTile);
          store.setDialogue("¡CORTAR despejó el camino!");
        }
      } else if (tile.type === 'boulder') {
        const leadMoves = playerTeam[0]?.moves.map(m => m.name) ?? [];
        if (!badges.includes(HM_REQUIREMENTS.strength.badge)) {
          store.setDialogue(`Necesitas la medalla ${HM_REQUIREMENTS.strength.badge} para usar ${HM_REQUIREMENTS.strength.move}.`);
        } else if (!leadMoves.includes(HM_REQUIREMENTS.strength.move)) {
          store.setDialogue(`Tu POKÉMON líder no conoce ${HM_REQUIREMENTS.strength.move}.`);
        } else {
          const pathTile = { type: 'path' as const, walkable: true };
          map.tiles[targetY][targetX] = pathTile;
          store.setModifiedTile(currentMap, targetX, targetY, pathTile);
          store.setDialogue("¡FUERZA movió el obstáculo!");
        }
      } else if (tile.type === 'table') {
        store.setDialogue("Hay muchos libros sobre POKÉMON aquí.");
      } else if (tile.type === 'door') {
        const hasWarp = map.warps.some(w => w.x === targetX && w.y === targetY);
        if (!hasWarp) {
          store.setDialogue("Está cerrado.");
        }
      } else if (tile.type === 'sign') {
        store.setDialogue("Es un cartel.");
      } else if (tile.type === 'grass' && Math.random() < 0.05) {
        if (!inventory['POTION']) {
          store.addInventoryItem('POTION');
          store.setDialogue("¡Has encontrado una POCIÓN escondida en la hierba!");
        }
      }
    }
  }, [initBattle]);

  return { handleAction };
};
