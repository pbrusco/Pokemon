import { AnimatePresence } from 'motion/react';
import { Pokemon, MapID, InventoryCounts } from '../types';
import { GamePhase, BattlePhase, EXPLORING, battle, B_CHOOSING, B_FORCED_SWITCH } from '../types/gamePhase';
import { BattleAction } from '../lib/battleEngine';
import { BattleScreen } from './BattleScreen';
import { BattleTransition } from './BattleTransition';
import { DialogueBox } from './DialogueBox';
import { InventoryUI } from './InventoryUI';
import { TeamMenuUI } from './TeamMenuUI';
import { ShopUI } from './ShopUI';
import { SHOP_PRICES } from '../constants';
import { PokedexUI } from './PokedexUI';
import { PCStorageUI } from './PCStorageUI';
import { MapEditor } from './MapEditor';
import { useGameStore } from '../store/gameStore';
import { Dispatch, SetStateAction } from 'react';

interface GameModalsProps {
  phase: GamePhase;
  battlePhase: BattlePhase | null;
  inBattle: boolean;
  currentMap: MapID;
  battleShake: boolean;
  enemyPokemon: Pokemon | null;
  enemyAnim: 'idle' | 'attack' | 'hit' | 'faint';
  catchResult: boolean | null;
  playerTeam: Pokemon[];
  playerAnim: 'idle' | 'attack' | 'hit' | 'faint';
  battleLog: string;
  battleLogs: any[];
  showMoves: boolean;
  isTrainerBattle: boolean;
  dialogue: string | null;
  inventory: InventoryCounts;
  pcStorage: Pokemon[];
  money: number;
  pokedex: Record<string, { seen: boolean; caught: boolean }>;
  setShowMoves: Dispatch<SetStateAction<boolean>>;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
  setDialogue: (d: string | null) => void;
  setPlayerTeam: (fn: (prev: Pokemon[]) => Pokemon[]) => void;
  setMoney: (fn: (prev: number) => number) => void;
  addInventoryItem: (id: string) => void;
  handlePCSwap: (teamIdx: number, pcIdx: number) => void;
  handleUseItem: (itemId: string) => void;
  dispatchBattle: (action: BattleAction) => void;
}

export const GameModals = ({
  phase,
  battlePhase,
  inBattle,
  currentMap,
  battleShake,
  enemyPokemon,
  enemyAnim,
  catchResult,
  playerTeam,
  playerAnim,
  battleLog,
  battleLogs,
  showMoves,
  isTrainerBattle,
  dialogue,
  inventory,
  pcStorage,
  money,
  pokedex,
  setShowMoves,
  setPhase,
  setDialogue,
  setPlayerTeam,
  setMoney,
  addInventoryItem,
  handlePCSwap,
  handleUseItem,
  dispatchBattle,
}: GameModalsProps) => (
  <>
    {/* Battle View */}
    <AnimatePresence>
      {inBattle && (
        <BattleScreen
          currentMap={currentMap}
          battleShake={battleShake}
          enemyPokemon={enemyPokemon}
          enemyAnim={enemyAnim}
          isCatching={battlePhase?.type === 'CATCHING'}
          catchResult={catchResult}
          playerTeam={playerTeam}
          playerAnim={playerAnim}
          battleLog={battleLog}
          battleLogs={battleLogs}
          showMoves={showMoves}
          setShowMoves={setShowMoves}
          isTrainerBattle={isTrainerBattle}
          isPlayerTurn={battlePhase?.type === 'CHOOSING'}
          setIsBattle={(v) => { if (!v) setPhase(EXPLORING); }}
          onFlee={() => dispatchBattle({ type: 'FLEE' })}
          setShowInventory={() => { setShowMoves(false); setPhase(battle({ type: 'BATTLE_INVENTORY' })); }}
          setShowTeam={() => { setShowMoves(false); setPhase(battle({ type: 'BATTLE_TEAM' })); }}
          handleAttack={(move) => dispatchBattle({ type: 'ATTACK', move })}
        />
      )}
    </AnimatePresence>

    {/* Battle Transition */}
    <AnimatePresence>
      {phase.type === 'BATTLE_TRANSITION' && (
        <BattleTransition onComplete={() => {
          const ab = useGameStore.getState().activeBattle;
          setPhase(ab?.phase === 'FORCED_SWITCH' ? battle(B_FORCED_SWITCH) : battle(B_CHOOSING));
        }} />
      )}
    </AnimatePresence>

    {/* Map Editor */}
    {phase.type === 'EDITOR' && <MapEditor onClose={() => setPhase(EXPLORING)} />}

    {/* Dialogue */}
    <AnimatePresence>
      {dialogue && (
        <DialogueBox
          text={dialogue}
          onComplete={() => {
            const cb = useGameStore.getState().dialogueCallback;
            setDialogue(null);
            if (cb) cb();
          }}
        />
      )}
    </AnimatePresence>

    {/* Inventory */}
    <AnimatePresence>
      {(phase.type === 'INVENTORY' || battlePhase?.type === 'BATTLE_INVENTORY') && (
        <InventoryUI
          items={inventory}
          onClose={() => setPhase(inBattle ? battle(B_CHOOSING) : EXPLORING)}
          onUse={handleUseItem}
        />
      )}
    </AnimatePresence>

    {/* Team Menu */}
    <AnimatePresence>
      {(phase.type === 'TEAM' || battlePhase?.type === 'BATTLE_TEAM' || battlePhase?.type === 'FORCED_SWITCH') && (
        <TeamMenuUI
          team={playerTeam}
          forcedSwitch={battlePhase?.type === 'FORCED_SWITCH'}
          onClose={() => setPhase(battlePhase ? battle(B_CHOOSING) : EXPLORING)}
          onSwap={(index) => {
            if (battlePhase) {
              dispatchBattle({ type: 'SWITCH', index });
            } else {
              setPlayerTeam(prev => {
                const updated = [...prev];
                const [moved] = updated.splice(index, 1);
                updated.unshift(moved);
                return updated;
              });
              setPhase(EXPLORING);
            }
          }}
        />
      )}
    </AnimatePresence>

    {/* Shop */}
    <AnimatePresence>
      {phase.type === 'SHOP' && (
        <ShopUI
          money={money}
          onClose={() => setPhase(EXPLORING)}
          onBuy={(id) => {
            const price = SHOP_PRICES[id] ?? 200;
            setMoney(prev => prev - price);
            addInventoryItem(id);
          }}
        />
      )}
    </AnimatePresence>

    {/* Pokédex */}
    <AnimatePresence>
      {phase.type === 'POKEDEX' && (
        <PokedexUI pokedex={pokedex} onClose={() => setPhase(inBattle ? battle(B_CHOOSING) : EXPLORING)} />
      )}
    </AnimatePresence>

    {/* PC Storage */}
    <AnimatePresence>
      {phase.type === 'PC' && (
        <PCStorageUI
          team={playerTeam}
          pc={pcStorage}
          onClose={() => setPhase(inBattle ? battle(B_CHOOSING) : EXPLORING)}
          onSwap={handlePCSwap}
        />
      )}
    </AnimatePresence>
  </>
);
