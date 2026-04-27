import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { WILD_POKEMON_DATABASE, getKantoRegion } from '../constants';
import { Position, WildPokemonEntity, Direction, Pokemon } from '../types';
import { calcHp } from '../lib/damage';
import { launchBattle } from '../lib/launchBattle';
import { logObservation } from '../lib/eventLog';

const MAX_WILD_POKEMON = 5;
const SPAWN_CHANCE = 0.3;
const MOVE_CHANCE = 0.4;
const TICK_RATE = 3000; // 3 seconds

export function useWildPokemonEngine() {
  const store = useGameStore();
  const { currentMap, playerPos, worldMaps, wildPokemon, setWildPokemon, phase, ghostMode } = store;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (phase.type !== 'EXPLORING' || currentMap === 'PLAYERS_HOUSE_2F') {
        if (wildPokemon.length > 0) setWildPokemon([]);
        return;
    }

    const tick = () => {
      const mapData = worldMaps[currentMap];
      if (!mapData) return;

      const grid = mapData.tiles;
      const rows = grid.length;
      const cols = grid[0].length;

      // 1. Clean up distant or out-of-bounds pokemon
      const kept = wildPokemon.filter(p => {
        const dist = Math.abs(p.position.x - playerPos.x) + Math.abs(p.position.y - playerPos.y);
        return dist < 20;
      });

      // 2. Spawn new pokemon if under limit
      if (kept.length < MAX_WILD_POKEMON && Math.random() < SPAWN_CHANCE) {
        // Find grass tiles near player
        const candidates: Position[] = [];
        const radius = 10;
        for (let y = Math.max(0, playerPos.y - radius); y < Math.min(rows, playerPos.y + radius); y++) {
          for (let x = Math.max(0, playerPos.x - radius); x < Math.min(cols, playerPos.x + radius); x++) {
            if (grid[y][x].type === 'grass') {
              // Don't spawn on player or existing pokemon
              if (x === playerPos.x && y === playerPos.y) continue;
              if (kept.some(p => p.position.x === x && p.position.y === y)) continue;
              candidates.push({ x, y });
            }
          }
        }

        if (candidates.length > 0) {
          const pos = candidates[Math.floor(Math.random() * candidates.length)];
          const zone = currentMap === 'KANTO_OVERWORLD' ? getKantoRegion(pos.x, pos.y) : currentMap;
          const speciesList = WILD_POKEMON_DATABASE[zone];

          if (speciesList && speciesList.length > 0) {
            const base = speciesList[Math.floor(Math.random() * speciesList.length)];
            const level = base.level + Math.floor(Math.random() * 3) - 1;
            const maxHp = calcHp(base.baseStats.hp, level);
            
            const pkmn: Pokemon = {
              ...base,
              uid: Math.random().toString(36).substring(2, 9),
              level,
              hp: maxHp,
              maxHp,
            };

            const newWild: WildPokemonEntity = {
              id: `wild_${pkmn.uid}`,
              type: 'wild_pokemon',
              position: pos,
              direction: 'down',
              pokemon: pkmn,
              sprite: pkmn.sprite,
            };
            kept.push(newWild);
          }
        }
      }

      // 3. Move existing pokemon
      const moved = kept.map(p => {
        if (Math.random() > MOVE_CHANCE) return p;

        const dirs: Direction[] = ['up', 'down', 'left', 'right'];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        let nx = p.position.x;
        let ny = p.position.y;
        if (dir === 'up') ny--;
        if (dir === 'down') ny++;
        if (dir === 'left') nx--;
        if (dir === 'right') nx++;

        // Can only move into grass tiles
        if (
          ny >= 0 && ny < rows && nx >= 0 && nx < cols &&
          grid[ny][nx].type === 'grass' &&
          !kept.some(other => other.id !== p.id && other.position.x === nx && other.position.y === ny)
        ) {
          // Check collision with player
          if (nx === playerPos.x && ny === playerPos.y && !ghostMode) {
            // Trigger battle!
            triggerBattle(p.pokemon);
            return null; // Remove from overworld
          }
          return { ...p, position: { x: nx, y: ny }, direction: dir };
        }
        return p;
      }).filter((p): p is WildPokemonEntity => p !== null);

      setWildPokemon(moved);
    };

    timerRef.current = setInterval(tick, TICK_RATE);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentMap, playerPos, worldMaps, wildPokemon, phase.type, ghostMode]);

  function triggerBattle(pkmn: Pokemon) {
    logObservation({ k: 'obs_encounter', map: currentMap, pokemon: pkmn.name, level: pkmn.level });
    launchBattle({
      enemy: pkmn,
      isTrainer: false,
      battleLog: `¡Un ${pkmn.name} salvaje apareció!`,
    });
    // The hook will clear the pokemon in the next tick or via setWildPokemon([]) if phase changes
  }
}
