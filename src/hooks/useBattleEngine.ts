import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { type GamePhase, battle, B_CHOOSING, B_PLAYER_ATTACK, B_ENEMY_ATTACK, B_PLAYER_FAINTED, B_FORCED_SWITCH, B_ENEMY_FAINTED, B_CATCHING, B_LEVEL_UP, B_EVOLVING, B_BATTLE_INVENTORY, B_BATTLE_TEAM, B_TRAINER_NEXT_POKEMON, EXPLORING, BLACKOUT, HEALING } from '../types/gamePhase';
import { stepBattle, type BattleState, type BattleAction, type BattleEffect } from '../lib/battleEngine';
import { sd } from '../lib/gameSpeed';
import { fullHeal } from '../lib/healUtils';
import { useGameStore } from '../store/gameStore';
import { logObservation } from '../lib/eventLog';
import type { CinematicEvent } from './useBattleVFX';
import { SfxController } from '../lib/sfx';
import { CINEMATIC_DURATION_MS } from './useBattleVFX';
import type { MapID } from '../types';

interface UseBattleEngineParams {
  battleStateRef: MutableRefObject<BattleState | null>;
  setPlayerAnim: (anim: 'idle' | 'attack' | 'hit' | 'faint') => void;
  setEnemyAnim: (anim: 'idle' | 'attack' | 'hit' | 'faint') => void;
  setBattleShake: (v: boolean) => void;
  setCinematicEvent: (e: CinematicEvent) => void;
}

function mapEnginePhase(p: string): GamePhase {
  switch (p) {
    case 'CHOOSING': return battle(B_CHOOSING);
    case 'PLAYER_ATTACK': return battle(B_PLAYER_ATTACK);
    case 'ENEMY_ATTACK': return battle(B_ENEMY_ATTACK);
    case 'PLAYER_FAINTED': return battle(B_PLAYER_FAINTED);
    case 'FORCED_SWITCH': return battle(B_FORCED_SWITCH);
    case 'ENEMY_FAINTED': return battle(B_ENEMY_FAINTED);
    case 'CATCHING': return battle(B_CATCHING);
    case 'LEVEL_UP': return battle(B_LEVEL_UP);
    case 'EVOLVING': return battle(B_EVOLVING);
    case 'BATTLE_INVENTORY': return battle(B_BATTLE_INVENTORY);
    case 'BATTLE_TEAM': return battle(B_BATTLE_TEAM);
    case 'TRAINER_NEXT_POKEMON': return battle(B_TRAINER_NEXT_POKEMON);
    default: return battle(B_CHOOSING);
  }
}

export function useBattleEngine({
  battleStateRef,
  setPlayerAnim,
  setEnemyAnim,
  setBattleShake,
  setCinematicEvent,
}: UseBattleEngineParams) {
  const store = useGameStore();
  const nextLogId = useRef(0);

  // Auto-sync: keep battleStateRef in step with the store's activeBattle.
  // Triggered when a cutscene's processBattle() sets activeBattle without
  // the React ref, and when a new battle starts after an old one finished
  // (stale finished state in the ref would block dispatchBattle).
  const activeBattle = store.activeBattle;
  useEffect(() => {
    if (activeBattle && battleStateRef.current !== activeBattle) {
      battleStateRef.current = activeBattle;
    } else if (!activeBattle) {
      battleStateRef.current = null;
    }
  }, [activeBattle, battleStateRef]);

  const playBattleEffects = (effects: BattleEffect[]): number => {
    let delay = 0;
    effects.forEach(effect => {
      const d = delay;
      switch (effect.type) {
        case 'log':
          setTimeout(() => {
            const text = effect.payload as string;
            useGameStore.getState().setBattleLog(text);
            if (text.trim() !== '') {
              useGameStore.getState().setBattleLogs(prev => {
                const newMsg = { text, speaker: effect.speaker || 'Sistema', id: nextLogId.current++ };
                return [newMsg, ...prev].slice(0, 5);
              });
            }
          }, d);
          delay += sd(500);
          break;
        case 'sound':
          if (effect.payload) {
            setTimeout(() => SfxController.play(String(effect.payload).toLowerCase()), d);
          }
          break;
        case 'player_anim':
          setTimeout(() => {
            setPlayerAnim(effect.payload as 'idle' | 'attack' | 'hit' | 'faint');
            if (effect.payload === 'attack' && effect.moveName) {
              setCinematicEvent({ attacker: 'player', moveName: effect.moveName, moveType: effect.moveType ?? 'normal' });
            }
            if (effect.payload === 'hit') SfxController.play('hit');
          }, d);
          if (effect.payload === 'attack') delay += sd(CINEMATIC_DURATION_MS);
          else if (effect.payload === 'hit' || effect.payload === 'faint') delay += sd(400);
          break;
        case 'enemy_anim':
          setTimeout(() => {
            setEnemyAnim(effect.payload as 'idle' | 'attack' | 'hit' | 'faint');
            if (effect.payload === 'attack' && effect.moveName) {
              setCinematicEvent({ attacker: 'enemy', moveName: effect.moveName, moveType: effect.moveType ?? 'normal' });
            }
            if (effect.payload === 'hit') SfxController.play('hit');
          }, d);
          if (effect.payload === 'attack') delay += sd(CINEMATIC_DURATION_MS);
          else if (effect.payload === 'hit' || effect.payload === 'faint') delay += sd(400);
          break;
        case 'battle_shake':
          setTimeout(() => { setBattleShake(true); setTimeout(() => setBattleShake(false), sd(400)); }, d);
          break;
      }
    });
    return delay;
  };

  const resolveBattleOutcome = (newState: BattleState) => {
    const s = useGameStore.getState();
    const npcs = s.getNPCs();

    if (newState.outcome !== 'ongoing') {
      logObservation({ k: 'obs_battle_outcome', outcome: newState.outcome });
    }
    if (newState.outcome === 'player_win') {
      const trainerId = newState.trainerName;
      if (newState.isTrainerBattle) {
        const trainer = npcs[s.currentMap]?.find(n => n.id === trainerId);
        if (trainer) {
          const moneyReward = newState.enemyPokemon.level * 20;
          s.setDefeatedTrainers(prev => [...prev, trainer.id]);
          if (moneyReward > 0) s.setMoney(prev => prev + moneyReward);

          const badgeAwards: Record<string, [string, string]> = {
            brock:      ['BOULDER',     'MEDALLA ROCA de BROCK'],
            misty:      ['CASCADE',     'MEDALLA CASCADA de MISTY'],
            lt_surge:   ['THUNDER',     'MEDALLA TRUENO del TENIENTE SURGE'],
            erika:      ['RAINBOW',     'MEDALLA ARCOÍRIS de ERIKA'],
            koga:       ['SOUL',        'MEDALLA ALMA de KOGA'],
            sabrina:    ['MARSH',       'MEDALLA PANTANO de SABRINA'],
            blaine:     ['VOLCANO',     'MEDALLA VOLCÁN de BLAINE'],
            giovanni:   ['EARTH',       'MEDALLA TIERRA de GIOVANNI'],
          };

          const award = badgeAwards[trainer.id];
          if (award) {
            const [badge, label] = award;
            s.setBadges(prev => [...prev, badge]);
            s.setBattleLog(`${s.battleLog}\n¡Recibiste la ${label}!`);
          }
        }
      }
      // Clear Snorlax from the map after defeat
      if (s.pendingSnorlaxId) {
        s.setClearedSnorlax([...s.clearedSnorlax, s.pendingSnorlaxId]);
        s.setPendingSnorlaxId(null);
      }
      setTimeout(() => {
        const fs = useGameStore.getState();
        fs.setInventory(newState.inventory);
        fs.setActiveBattle(null);
        setEnemyAnim('idle');

        const e4Next: Record<string, [MapID, number, number]> = {
          lorelei: ['ELITE_FOUR_BRUNO' as MapID, 6, 11],
          bruno:   ['ELITE_FOUR_AGATHA' as MapID, 6, 11],
          agatha:  ['ELITE_FOUR_LANCE' as MapID, 6, 11],
          lance:   ['ELITE_FOUR_CHAMPION' as MapID, 6, 11],
        };

        if (trainerId && e4Next[trainerId]) {
          const [nextMap, mx, my] = e4Next[trainerId];
          fs.setCurrentMap(nextMap);
          fs.setPlayerPos({ x: mx, y: my });
          fs.setDirection('up');
          fs.setPhase(EXPLORING);
          fs.setDialogue(`¡Has ganado! La puerta se abre hacia la siguiente sala...`);
        } else if (trainerId === 'rival_champion') {
          fs.setCurrentMap('HALL_OF_FAME' as MapID);
          fs.setPlayerPos({ x: 6, y: 9 });
          fs.setDirection('up');
          fs.setPhase(EXPLORING);
          fs.setDialogue('PROF. OAK: ¡Increíble! ¡Has derrotado al campeón!');
        } else {
          fs.setPhase(EXPLORING);
        }

        if (fs.storyStep === 'PICKED_STARTER') {
          fs.setStoryStep('RIVAL_BATTLE');
          fs.setDialogue('AZUL: ¡Maldición! ¡He perdido! Pero no volverá a pasar.');
        }
      }, sd(2000));
    } else if (newState.outcome === 'player_blackout') {
      s.setActiveBattle(null);
      s.setPhase(BLACKOUT);
      const healLocation = s.lastHealLocation;
      setTimeout(() => {
        const fs = useGameStore.getState();
        fs.setCurrentMap(healLocation.map);
        fs.setPlayerPos(healLocation.pos);
      }, sd(1200));
      setTimeout(() => { SfxController.play('heal'); useGameStore.getState().setPhase(HEALING); }, sd(2400));
      setTimeout(() => {
        useGameStore.getState().setPlayerTeam(t => t.map(fullHeal));
      }, sd(2400) + sd(800));
      setTimeout(() => {
        const fs = useGameStore.getState();
        fs.setPhase(EXPLORING);
        fs.setDialogue('¡Te has quedado sin POKÉMON! Fuiste llevado al último lugar de descanso.');
      }, sd(2400) + sd(1600));
    } else if (newState.outcome === 'fled') {
      s.setInventory(newState.inventory);
      s.setActiveBattle(null);
      s.setPhase(EXPLORING);
    }
  };

  /** Handle catch-specific animation flow (separate from normal attack flow). */
  const handleCatchAction = (newState: BattleState, effects: BattleEffect[]) => {
    const s = useGameStore.getState();
    s.setActiveBattle(newState);
    s.setEnemyPokemon(newState.enemyPokemon);

    // Catch failed and the fight continues (wild: enemy attacked back; trainer: can't catch).
    if (newState.outcome === 'ongoing' && newState.phase === 'CHOOSING') {
      logObservation({ k: 'obs_catch', result: newState.isTrainerBattle ? 'failed_in_trainer' : 'escaped' });
      const d = playBattleEffects(effects);
      setTimeout(() => {
        setPlayerAnim('idle');
        setEnemyAnim('idle');
        const fs = useGameStore.getState();
        fs.syncTeamStats(newState.playerTeam);
        fs.setPhase(battle(B_CHOOSING));
      }, d);
      return;
    }

    s.setPhase(battle(B_CATCHING));
    s.setCatchResult(null);
    s.setBattleLog('¡Pablo lanzó una POKÉ BALL!');
    SfxController.play('pokeball_throw');

    logObservation({ k: 'obs_catch', result: newState.outcome === 'caught' ? 'caught' : 'escaped' });
    if (newState.outcome === 'caught') {
      setTimeout(() => { SfxController.play('pokeball_catch'); useGameStore.getState().setCatchResult(true); }, sd(2800));
      setTimeout(() => {
        const fs = useGameStore.getState();
        fs.setCatchResult(null);
        fs.updatePokedex(newState.enemyPokemon.id, true);
        fs.setPcStorage(newState.pcStorage);
        fs.syncTeamStats(newState.playerTeam);
        // Clear Snorlax from the map after catching
        if (fs.pendingSnorlaxId) {
          fs.setClearedSnorlax([...fs.clearedSnorlax, fs.pendingSnorlaxId]);
          fs.setPendingSnorlaxId(null);
        }
        fs.setActiveBattle(null);
        fs.setPhase(EXPLORING);
      }, sd(4000));
    } else {
      setTimeout(() => useGameStore.getState().setCatchResult(false), sd(2800));
      setTimeout(() => {
        const fs = useGameStore.getState();
        fs.setCatchResult(null);
        fs.syncTeamStats(newState.playerTeam);
        fs.setEnemyPokemon(newState.enemyPokemon);
        fs.setPhase(mapEnginePhase(newState.phase));
      }, sd(4000));
    }
  };

  // Stable ref so the deferred setTimeout callbacks always call the latest
  // version of dispatchBattle without creating a circular useCallback dep.
  const dispatchBattleRef = useRef<((action: BattleAction) => void) | undefined>(undefined);

  const dispatchBattle = useCallback((action: BattleAction) => {
    if (!battleStateRef.current) return;
    if (battleStateRef.current.outcome !== 'ongoing') return;

    const ph = battleStateRef.current.phase;
    const validPhase = ph === 'CHOOSING' || (ph === 'FORCED_SWITCH' && action.type === 'SWITCH');
    if (!validPhase && action.type !== 'TICK') return;

    const prevPhase = battleStateRef.current.phase;
    const { state: newState, effects } = stepBattle(battleStateRef.current, action);
    battleStateRef.current = newState;

    if (action.type !== 'TICK') {
      const activePlayer = newState.playerTeam[0];
      logObservation({
        k: 'obs_battle_step',
        action,
        prevPhase,
        newPhase: newState.phase,
        enemyName: newState.enemyPokemon.name,
        enemyHp: newState.enemyPokemon.hp,
        enemyHpMax: newState.enemyPokemon.maxHp,
        playerName: activePlayer?.name ?? '',
        playerHp: activePlayer?.hp ?? 0,
        playerHpMax: activePlayer?.maxHp ?? 0,
        logs: effects.filter(e => e.type === 'log').map(e => String(e.payload)),
      });
    }

    const s = useGameStore.getState();
    s.setIsTrainerBattle(newState.isTrainerBattle);
    if (action.type !== 'TICK') {
      s.setInventory(newState.inventory);
    }

    if (action.type === 'CATCH') {
      handleCatchAction(newState, effects);
      return;
    }

    if (action.type === 'ATTACK') {
      setPlayerAnim('attack');
    }

    // Push HP changes to the store up-front so the HP bar animates down
    // BEFORE the faint sprite animation (which plays via playBattleEffects
    // a few hundred ms later).
    s.setEnemyPokemon(newState.enemyPokemon);
    s.syncTeamStats(newState.playerTeam);

    // When a trainer sends out their next Pokémon, reset the enemy animation
    // immediately so the new sprite renders fresh instead of stuck in faint/idle.
    if (prevPhase === 'TRAINER_NEXT_POKEMON') {
      setEnemyAnim('idle');
    }

    const aDuration = playBattleEffects(effects);
    const aDelay = Math.max(aDuration + sd(300), sd(800));

    setTimeout(() => {
      setPlayerAnim('idle');
      setEnemyAnim('idle');

      const fs = useGameStore.getState();
      fs.setActiveBattle(newState);
      fs.setEnemyPokemon(newState.enemyPokemon);
      fs.syncTeamStats(newState.playerTeam);

      if (newState.phase === 'ENEMY_ATTACK') {
        fs.setPhase(mapEnginePhase('ENEMY_ATTACK'));
        fs.setBattleLog('¡Turno del enemigo!');
        setTimeout(() => dispatchBattleRef.current?.({ type: 'TICK' }), sd(600));
      } else {
        fs.setPhase(mapEnginePhase(newState.phase));
        resolveBattleOutcome(newState);

        if (newState.phase === 'TRAINER_NEXT_POKEMON') {
          setTimeout(() => {
            if (!battleStateRef.current || battleStateRef.current.outcome !== 'ongoing') return;
            dispatchBattleRef.current?.({ type: 'TICK' });
          }, sd(1200));
        }
      }
    }, aDelay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleStateRef, setPlayerAnim, setEnemyAnim, setBattleShake]);

  dispatchBattleRef.current = dispatchBattle;

  return {
    dispatchBattle,
    catchResult: store.catchResult,
    setEnemyPokemon: store.setEnemyPokemon,
    setIsTrainerBattle: store.setIsTrainerBattle,
    setBattleLog: store.setBattleLog,
    setBattleLogs: store.setBattleLogs,
  };
}
