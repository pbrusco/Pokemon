import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { type GamePhase, battle, B_CHOOSING, B_PLAYER_ATTACK, B_ENEMY_ATTACK, B_PLAYER_FAINTED, B_FORCED_SWITCH, B_ENEMY_FAINTED, B_CATCHING, B_LEVEL_UP, B_EVOLVING, B_BATTLE_INVENTORY, B_BATTLE_TEAM, B_TRAINER_NEXT_POKEMON, EXPLORING, BLACKOUT, HEALING } from '../types';
import { stepBattle, type BattleState, type BattleAction, type BattleEffect } from '../lib/battleEngine';
import { sd } from '../lib/gameSpeed';
import { fullHeal } from '../lib/healUtils';
import { useGameStore } from '../store/gameStore';
import { SfxController } from '../lib/sfx';
import type { MapID } from '../types';

// Sprite swing/recoil animations are short. We hold the engine just long
// enough to read the hit, then flow back to CHOOSING.
const ATTACK_ANIM_MS = 300;

interface UseBattleEngineParams {
  battleStateRef: MutableRefObject<BattleState | null>;
  setPlayerAnim: (anim: 'idle' | 'attack' | 'hit' | 'faint') => void;
  setEnemyAnim: (anim: 'idle' | 'attack' | 'hit' | 'faint') => void;
  setBattleShake: (v: boolean) => void;
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
}: UseBattleEngineParams) {
  const store = useGameStore();
  const nextLogId = useRef(0);
  // True while a dispatch's effect-queue + cascade is still playing. Blocks
  // re-entrant dispatches so a player can't queue a second attack on top of
  // an in-flight animation sequence.
  const animatingRef = useRef(false);

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

  /** Run a single effect, then call `next` once it has visually completed.
   *  Each step decides its own duration; the queue runner chains them. */
  const runOneEffect = (effect: BattleEffect, next: () => void): void => {
    switch (effect.type) {
      case 'log': {
        const text = effect.payload as string;
        useGameStore.getState().setBattleLog(text);
        if (text.trim() !== '') {
          useGameStore.getState().setBattleLogs(prev => {
            const newMsg = { text, speaker: effect.speaker || 'Sistema', id: nextLogId.current++ };
            return [newMsg, ...prev].slice(0, 5);
          });
        }
        setTimeout(next, sd(500));
        return;
      }
      case 'sound': {
        if (effect.payload) SfxController.play(String(effect.payload).toLowerCase());
        next();
        return;
      }
      case 'player_anim': {
        const a = effect.payload as 'idle' | 'attack' | 'hit' | 'faint';
        setPlayerAnim(a);
        if (a === 'hit') SfxController.play('hit');
        const dur = a === 'attack' ? sd(ATTACK_ANIM_MS)
                  : a === 'hit' || a === 'faint' ? sd(400)
                  : 0;
        if (dur > 0) setTimeout(next, dur);
        else next();
        return;
      }
      case 'enemy_anim': {
        const a = effect.payload as 'idle' | 'attack' | 'hit' | 'faint';
        setEnemyAnim(a);
        if (a === 'hit') SfxController.play('hit');
        const dur = a === 'attack' ? sd(ATTACK_ANIM_MS)
                  : a === 'hit' || a === 'faint' ? sd(400)
                  : 0;
        if (dur > 0) setTimeout(next, dur);
        else next();
        return;
      }
      case 'battle_shake': {
        // Shake is decorative; play it in parallel and proceed immediately so
        // we don't double-stack delays on top of the hit anim that emitted it.
        setBattleShake(true);
        setTimeout(() => setBattleShake(false), sd(400));
        next();
        return;
      }
      case 'screen_flash':
      default:
        next();
        return;
    }
  };

  /** Drain `effects` in order, calling `onDone` when the last effect has
   *  played. After each visible hit/faint anim, sync the corresponding
   *  side's HP from `newState` so the bar drops in lockstep with the
   *  animation rather than instantly when the action was dispatched. */
  const runEffectQueue = (effects: BattleEffect[], newState: BattleState, onDone: () => void): void => {
    let i = 0;
    const next = () => {
      if (i >= effects.length) { onDone(); return; }
      const e = effects[i++];
      runOneEffect(e, () => {
        if (e.type === 'enemy_anim' && (e.payload === 'hit' || e.payload === 'faint')) {
          useGameStore.getState().setEnemyPokemon(newState.enemyPokemon);
        }
        if (e.type === 'player_anim' && (e.payload === 'hit' || e.payload === 'faint')) {
          useGameStore.getState().syncTeamStats(newState.playerTeam);
        }
        next();
      });
    };
    next();
  };

  const resolveBattleOutcome = (newState: BattleState) => {
    const s = useGameStore.getState();
    const npcs = s.getNPCs();

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

          const award = badgeAwards[(trainer as { trainerClass?: string }).trainerClass ?? ''];
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
      runEffectQueue(effects, newState, () => {
        setPlayerAnim('idle');
        setEnemyAnim('idle');
        const fs = useGameStore.getState();
        fs.syncTeamStats(newState.playerTeam);
        fs.setPhase(battle(B_CHOOSING));
      });
      return;
    }

    s.setPhase(battle(B_CATCHING));
    s.setCatchResult(null);
    s.setBattleLog('¡Pablo lanzó una POKÉ BALL!');
    SfxController.play('pokeball_throw');

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

  /** Step the engine and play its effect queue. `onDone` is called after
   *  the entire visual sequence — including any chained ENEMY_ATTACK or
   *  TRAINER_NEXT_POKEMON cascade — has finished, so the caller can release
   *  the animation lock. */
  const runDispatch = (action: BattleAction, onDone: () => void): void => {
    if (!battleStateRef.current || battleStateRef.current.outcome !== 'ongoing') {
      onDone();
      return;
    }
    const ph = battleStateRef.current.phase;
    const validPhase = ph === 'CHOOSING' || (ph === 'FORCED_SWITCH' && action.type === 'SWITCH');
    if (!validPhase && action.type !== 'TICK') {
      onDone();
      return;
    }

    const prevPhase = battleStateRef.current.phase;
    const { state: newState, effects } = stepBattle(battleStateRef.current, action);
    battleStateRef.current = newState;

    const s = useGameStore.getState();
    s.setIsTrainerBattle(newState.isTrainerBattle);
    if (action.type !== 'TICK') {
      s.setInventory(newState.inventory);
    }

    if (action.type === 'CATCH') {
      // Catch flow has its own visual sequence (ball throw / wobble / result)
      // that runs in fixed timing. Hold the lock for its full duration so a
      // second action can't start mid-throw.
      handleCatchAction(newState, effects);
      setTimeout(onDone, sd(4000));
      return;
    }

    if (action.type === 'ATTACK') setPlayerAnim('attack');

    // When a trainer sends out their next Pokémon, reset the enemy animation
    // immediately so the new sprite renders fresh instead of stuck in faint/idle.
    if (prevPhase === 'TRAINER_NEXT_POKEMON') setEnemyAnim('idle');

    runEffectQueue(effects, newState, () => {
      setPlayerAnim('idle');
      setEnemyAnim('idle');

      const fs = useGameStore.getState();
      fs.setActiveBattle(newState);
      // Final sync — any HP not already pushed by an interleaved hit/faint
      // (e.g. switches, status-tick damage) lands here.
      fs.setEnemyPokemon(newState.enemyPokemon);
      fs.syncTeamStats(newState.playerTeam);

      if (newState.phase === 'ENEMY_ATTACK') {
        fs.setPhase(mapEnginePhase('ENEMY_ATTACK'));
        fs.setBattleLog('¡Turno del enemigo!');
        setTimeout(() => runDispatch({ type: 'TICK' }, onDone), sd(600));
        return;
      }

      fs.setPhase(mapEnginePhase(newState.phase));
      resolveBattleOutcome(newState);

      if (newState.phase === 'TRAINER_NEXT_POKEMON') {
        setTimeout(() => {
          if (battleStateRef.current?.outcome === 'ongoing') {
            runDispatch({ type: 'TICK' }, onDone);
          } else {
            onDone();
          }
        }, sd(1200));
        return;
      }

      onDone();
    });
  };

  const dispatchBattle = useCallback((action: BattleAction) => {
    // External callers wait for the in-flight sequence to finish. Internal
    // cascade calls go through runDispatch directly and bypass this guard.
    if (animatingRef.current) return;
    if (!battleStateRef.current || battleStateRef.current.outcome !== 'ongoing') return;

    const ph = battleStateRef.current.phase;
    const validPhase = ph === 'CHOOSING' || (ph === 'FORCED_SWITCH' && action.type === 'SWITCH');
    if (!validPhase && action.type !== 'TICK') return;

    animatingRef.current = true;
    runDispatch(action, () => { animatingRef.current = false; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleStateRef, setPlayerAnim, setEnemyAnim, setBattleShake]);

  return {
    dispatchBattle,
    catchResult: store.catchResult,
    setEnemyPokemon: store.setEnemyPokemon,
    setIsTrainerBattle: store.setIsTrainerBattle,
    setBattleLog: store.setBattleLog,
    setBattleLogs: store.setBattleLogs,
  };
}
