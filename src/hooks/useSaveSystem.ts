import { useState, useRef, useEffect } from 'react';
import { InventoryCounts, MapID, Position, Pokemon, MAP_IDS } from '../types';
import type { PokedexState } from './usePokedex';

interface SaveSystemParams {
  // State setters needed for load
  setPlayerPos: (pos: Position) => void;
  setCurrentMap: (map: MapID) => void;
  setPlayerTeam: (team: Pokemon[]) => void;
  setInventory: (inv: InventoryCounts) => void;
  setDefeatedTrainers: (ids: string[]) => void;
  setHasPokedex: (v: boolean) => void;
  setHasParcel: (v: boolean) => void;
  setStoryStep: (step: any) => void;
  setLastHealLocation: (loc: { map: MapID; pos: Position }) => void;
  setPokedex: (p: PokedexState) => void;
  setMoney: (m: number) => void;
  // State values needed for auto-save
  playerTeam: Pokemon[];
  playerPos: Position;
  currentMap: MapID;
  inventory: InventoryCounts;
  defeatedTrainers: string[];
  hasPokedex: boolean;
  hasParcel: boolean;
  storyStep: string;
  lastHealLocation: { map: MapID; pos: Position };
  pokedex: PokedexState;
  money: number;
}

export function useSaveSystem(params: SaveSystemParams) {
  const [activeSaveSlot, setActiveSaveSlot] = useState('slot1');
  const [playTimeMs, setPlayTimeMs] = useState(0);
  const sessionStartMs = useRef(Date.now());

  // Load on mount
  useEffect(() => {
    const {
      setPlayerPos, setCurrentMap, setPlayerTeam, setInventory, setDefeatedTrainers,
      setHasPokedex, setHasParcel, setStoryStep, setLastHealLocation, setPokedex, setMoney,
    } = params;

    const slotsRaw = localStorage.getItem('pokemon_save_slots');
    const activeSlot = localStorage.getItem('pokemon_active_slot') || 'slot1';
    setActiveSaveSlot(activeSlot);

    const loadData = (data: any) => {
      setPlayerPos(data.pos);
      if (MAP_IDS.includes(data.map)) setCurrentMap(data.map);
      setPlayerTeam(data.team);
      const invData = data.inventory;
      if (Array.isArray(invData)) {
        const migrated: InventoryCounts = {};
        for (const id of invData) migrated[id] = (migrated[id] ?? 0) + 1;
        setInventory(migrated);
      } else {
        setInventory(invData ?? {});
      }
      setDefeatedTrainers(data.defeatedTrainers);
      setHasPokedex(data.hasPokedex);
      setHasParcel(data.hasParcel);
      setStoryStep(data.storyStep);
      if (data.lastHealLocation) setLastHealLocation(data.lastHealLocation);
      if (data.pokedex) setPokedex(data.pokedex);
      if (data.money != null) setMoney(data.money);
    };

    if (slotsRaw) {
      try {
        const slotsPayload = JSON.parse(slotsRaw) as Record<string, { data: any; updatedAt: number; playTimeMs: number }>;
        const selected = slotsPayload[activeSlot]?.data;
        if (!selected) return;
        loadData(selected);
        if (slotsPayload[activeSlot]?.playTimeMs != null) setPlayTimeMs(slotsPayload[activeSlot].playTimeMs);
      } catch (e) {
        console.error("Error loading save", e);
      }
      return;
    }

    // Backward compat: migrate old single-slot save
    const savedData = localStorage.getItem('pokemon_save');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (!data?.team) return;
        loadData(data);
      } catch (e) {
        console.error("Error loading legacy save", e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save on state change
  const {
    playerTeam, playerPos, currentMap, inventory, defeatedTrainers, hasPokedex,
    hasParcel, storyStep, lastHealLocation, pokedex, money,
  } = params;

  useEffect(() => {
    if (playerTeam.length > 0) {
      const saveData = {
        pos: playerPos, map: currentMap, team: playerTeam, inventory,
        defeatedTrainers, hasPokedex, hasParcel, storyStep, lastHealLocation, pokedex, money,
      };
      const slotsRaw = localStorage.getItem('pokemon_save_slots');
      const slotsPayload = slotsRaw
        ? JSON.parse(slotsRaw) as Record<string, { data: any; updatedAt: number; playTimeMs: number }>
        : {};
      const totalPlayTime = playTimeMs + (Date.now() - sessionStartMs.current);
      slotsPayload[activeSaveSlot] = { data: saveData, updatedAt: Date.now(), playTimeMs: totalPlayTime };
      localStorage.setItem('pokemon_save_slots', JSON.stringify(slotsPayload));
      localStorage.setItem('pokemon_active_slot', activeSaveSlot);
    }
  }, [activeSaveSlot, playerPos, currentMap, playerTeam, inventory, defeatedTrainers, hasPokedex, hasParcel, storyStep, lastHealLocation, pokedex, money, playTimeMs]);

  return { activeSaveSlot, setActiveSaveSlot, playTimeMs, setPlayTimeMs, sessionStartMs };
}
