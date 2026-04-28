import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { WILD_POKEMON_DATABASE, getKantoRegion } from '../constants';
import { type Position, type WildPokemonEntity, type Direction, type Pokemon } from '../types';
import { calcHp } from '../lib/damage';
import { launchBattle } from '../lib/launchBattle';
import { logObservation } from '../lib/eventLog';

const MAX_WILD_POKEMON = 5;
const SPAWN_CHANCE = 0.3;
const MOVE_CHANCE = 0.4;
const TICK_RATE = 3000;

function triggerBattle(pkmn: Pokemon) {
  logObservation({ k: 'obs_encounter', map: useGameStore.getState().currentMap, pokemon: pkmn.name, level: pkmn.level });
  launchBattle({
    enemy: pkmn,
    isTrainer: false,
    battleLog: `¡Un ${pkmn.name} salvaje apareció!`,
  });
}

export function useWildPokemonEngine() {
  const phaseType = useGameStore(s => s.phase.type);
  const currentMap = useGameStore(s => s.currentMap);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (phaseType !== 'EXPLORING' || currentMap === 'PLAYERS_HOUSE_2F') {
      const { wildPokemon, setWildPokemon } = useGameStore.getState();
      if (wildPokemon.length > 0) setWildPokemon([]);
      return;
    }

    const tick = () => {
      const s = useGameStore.getState();
      const mapData = s.worldMaps[s.currentMap];
      if (!mapData) return;

      const grid = mapData.tiles;
      const rows = grid.length;
      const cols = grid[0].length;
      const { playerPos, wildPokemon, ghostMode } = s;

      // 1. Clean up distant or out-of-bounds pokemon
      const kept = wildPokemon.filter(p => {
        const dist = Math.abs(p.position.x - playerPos.x) + Math.abs(p.position.y - playerPos.y);
        return dist < 20;
      });

      // 2. Spawn new pokemon if under limit
      if (kept.length < MAX_WILD_POKEMON && Math.random() < SPAWN_CHANCE) {
        const candidates: Position[] = [];
        const radius = 10;
        for (let y = Math.max(0, playerPos.y - radius); y < Math.min(rows, playerPos.y + radius); y++) {
          for (let x = Math.max(0, playerPos.x - radius); x < Math.min(cols, playerPos.x + radius); x++) {
            if (grid[y][x].type === 'grass') {
              if (x === playerPos.x && y === playerPos.y) continue;
              if (kept.some(p => p.position.x === x && p.position.y === y)) continue;
              candidates.push({ x, y });
            }
          }
        }

        if (candidates.length > 0) {
          const pos = candidates[Math.floor(Math.random() * candidates.length)];
          const zone = s.currentMap === 'KANTO_OVERWORLD' ? getKantoRegion(pos.x, pos.y) : s.currentMap;
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

        if (
          ny >= 0 && ny < rows && nx >= 0 && nx < cols &&
          grid[ny][nx].type === 'grass' &&
          !kept.some(other => other.id !== p.id && other.position.x === nx && other.position.y === ny)
        ) {
          if (nx === playerPos.x && ny === playerPos.y && !ghostMode) {
            triggerBattle(p.pokemon);
            return null;
          }
          return { ...p, position: { x: nx, y: ny }, direction: dir };
        }
        return p;
      }).filter((p): p is WildPokemonEntity => p !== null);

      s.setWildPokemon(moved);
    };

    timerRef.current = setInterval(tick, TICK_RATE);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phaseType, currentMap]);
}
