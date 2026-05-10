import { memo } from 'react';
import { AnimatePresence } from 'motion/react';
import { type BattlePhase, EXPLORING, battle, B_CHOOSING, B_FORCED_SWITCH } from '../types';
import { type BattleAction } from '../lib/battleEngine';
import { BattleScreen } from './BattleScreen';
import { BattleTransition } from './BattleTransition';
import { DialogueBox } from './DialogueBox';
import { InventoryUI } from './InventoryUI';
import { TeamMenuUI } from './TeamMenuUI';
import { ShopUI } from './ShopUI';
import { SHOP_PRICES, ITEMS_DATABASE } from '../constants/items';
import { PokedexUI } from './PokedexUI';
import { PCStorageUI } from './PCStorageUI';
import { HMForgetMenu } from './HMForgetMenu';
import { FlyTownSelect } from './FlyTownSelect';
import { PokemonSummary } from './PokemonSummary';
import { FlyAnimation } from './FlyAnimation';
import { ConfigPanel } from './ConfigPanel';
import { SfxController } from '../lib/sfx';
import { useGameStore } from '../store/gameStore';
interface GameModalsProps {
  battleShake: boolean;
  enemyAnim: 'idle' | 'attack' | 'hit' | 'faint';
  playerAnim: 'idle' | 'attack' | 'hit' | 'faint';
  handlePCSwap: (teamIdx: number, pcIdx: number) => void;
  handleUseItem: (itemId: string) => void;
  handleApplyItemToPokemon: (index: number) => void;
  handleHMForget: (forgetIndex: number) => void;
  handleFlySelect: (town: string) => void;
  onUseFieldMove: (moveName: string) => void;
  dispatchBattle: (action: BattleAction) => void;
}

export const GameModals = memo(({
  battleShake,
  enemyAnim,
  playerAnim,
  handlePCSwap,
  handleUseItem,
  handleApplyItemToPokemon,
  handleHMForget,
  handleFlySelect,
  onUseFieldMove,
  dispatchBattle,
}: GameModalsProps) => {
  const store = useGameStore();

  const phase = store.phase;
  const inBattle = phase.type === 'BATTLE' || ('returnTo' in phase && phase.returnTo?.type === 'BATTLE');
  const battlePhase: BattlePhase | null = phase.type === 'BATTLE'
    ? phase.sub
    : ('returnTo' in phase && phase.returnTo?.type === 'BATTLE' ? phase.returnTo.sub : null);
  const playerTeam = store.activeBattle ? store.activeBattle.playerTeam : store.playerTeam;

  return (
    <>
      {/* Battle View */}
      <AnimatePresence>
        {inBattle && (
          <BattleScreen
            currentMap={store.currentMap}
            battleShake={battleShake}
            enemyPokemon={store.enemyPokemon}
            enemyAnim={enemyAnim}
            isCatching={battlePhase?.type === 'CATCHING'}
            catchResult={store.catchResult}
            playerTeam={playerTeam}
            playerAnim={playerAnim}
            battleLog={store.battleLog}
            battleLogs={store.battleLogs}
            showMoves={store.showMoves}
            setShowMoves={store.setShowMoves}
            isTrainerBattle={store.isTrainerBattle}
            isPlayerTurn={battlePhase?.type === 'CHOOSING'}
            setIsBattle={(v) => { if (!v) store.setPhase(EXPLORING); }}
            onFlee={() => dispatchBattle({ type: 'FLEE' })}
            setShowInventory={() => { store.setShowMoves(false); store.setPhase(battle({ type: 'BATTLE_INVENTORY' })); }}
            setShowTeam={() => { store.setShowMoves(false); store.setPhase(battle({ type: 'BATTLE_TEAM' })); }}
            handleAttack={(move) => dispatchBattle({ type: 'ATTACK', move })}
          />
        )}
      </AnimatePresence>

      {/* Battle Transition */}
      <AnimatePresence>
        {phase.type === 'BATTLE_TRANSITION' && (
          <BattleTransition onComplete={() => {
            const ab = useGameStore.getState().activeBattle;
            store.setPhase(ab?.phase === 'FORCED_SWITCH' ? battle(B_FORCED_SWITCH) : battle(B_CHOOSING));
          }} />
        )}
      </AnimatePresence>

      {/* Dialogue / yes-no confirm */}
      <AnimatePresence>
        {store.confirm ? (
          <DialogueBox
            text={store.confirm.text}
            onComplete={() => { /* no-op: confirm closes via Sí/No buttons */ }}
            confirm={{
              onYes: () => {
                const c = useGameStore.getState().confirm;
                store.setConfirm(null);
                c?.onYes();
              },
              onNo: () => {
                const c = useGameStore.getState().confirm;
                store.setConfirm(null);
                c?.onNo();
              },
            }}
          />
        ) : store.dialogue && (
          <DialogueBox
            text={store.dialogue}
            onComplete={() => {
              const cb = useGameStore.getState().dialogueCallback;
              SfxController.play('dialog_advance');
              store.setDialogue(null);
              if (cb) cb();
            }}
          />
        )}
      </AnimatePresence>

      {/* Inventory */}
      <AnimatePresence>
        {(phase.type === 'INVENTORY' || battlePhase?.type === 'BATTLE_INVENTORY') && (
          <InventoryUI
            items={store.inventory}
            onClose={() => store.setPhase(inBattle ? battle(B_CHOOSING) : EXPLORING)}
            onUse={handleUseItem}
          />
        )}
      </AnimatePresence>

      {/* Team Menu */}
      <AnimatePresence>
        {(phase.type === 'TEAM' || battlePhase?.type === 'BATTLE_TEAM' || battlePhase?.type === 'FORCED_SWITCH' || phase.type === 'ITEM_TEAM_SELECT' || battlePhase?.type === 'BATTLE_ITEM_TEAM_SELECT') && (
          <TeamMenuUI
            team={playerTeam}
            forcedSwitch={battlePhase?.type === 'FORCED_SWITCH'}
            mode={(phase.type === 'ITEM_TEAM_SELECT' || battlePhase?.type === 'BATTLE_ITEM_TEAM_SELECT') ? 'use_item' : 'swap'}
            selectedItemId={phase.type === 'ITEM_TEAM_SELECT' ? phase.itemId : (battlePhase?.type === 'BATTLE_ITEM_TEAM_SELECT' ? battlePhase.itemId : undefined)}
            onClose={() => store.setPhase(battlePhase ? battle(B_CHOOSING) : EXPLORING)}
            onUseItem={handleApplyItemToPokemon}
            onSwap={(index) => {
              if (battlePhase) {
                dispatchBattle({ type: 'SWITCH', index });
              } else {
                store.setPlayerTeam(prev => {
                  const updated = [...prev];
                  const [moved] = updated.splice(index, 1);
                  updated.unshift(moved);
                  return updated;
                });
                store.setPhase(EXPLORING);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Shop */}
      <AnimatePresence>
        {phase.type === 'SHOP' && (
          <ShopUI
            shopId={phase.shopId ?? store.currentMap}
            money={store.money}
            onClose={() => store.setPhase(EXPLORING)}
            onBuy={(id) => {
              const price = SHOP_PRICES[id] ?? 200;
              store.setMoney(prev => prev - price);
              store.addInventoryItem(id);
            }}
          />
        )}
      </AnimatePresence>

      {/* Pokédex */}
      <AnimatePresence>
        {phase.type === 'POKEDEX' && (
          <PokedexUI pokedex={store.pokedex} onClose={() => store.setPhase(inBattle ? battle(B_CHOOSING) : EXPLORING)} />
        )}
      </AnimatePresence>

      {/* HM Forget Menu */}
      <AnimatePresence>
        {phase.type === 'HM_FORGET' && (
          <HMForgetMenu
            existingMoveNames={phase.existingMoveNames}
            itemName={ITEMS_DATABASE[phase.itemId]?.name ?? 'Objeto'}
            pokemonName={playerTeam[phase.teamIndex]?.name ?? '???'}
            onForget={handleHMForget}
            onCancel={() => store.setPhase(EXPLORING)}
          />
        )}
      </AnimatePresence>

      {/* Fly Town Select */}
      <AnimatePresence>
        {phase.type === 'FLY_TOWN_SELECT' && (
          <FlyTownSelect
            towns={store.visitedTowns}
            onSelect={handleFlySelect}
            onCancel={() => store.setPhase(EXPLORING)}
          />
        )}
      </AnimatePresence>

      {/* Pokemon Summary */}
      <AnimatePresence>
        {phase.type === 'POKEMON_SUMMARY' && (
          <PokemonSummary
            pokemon={playerTeam[phase.teamIndex]}
            index={phase.teamIndex}
            team={playerTeam}
            onClose={() => store.setPhase(EXPLORING)}
            onUseFieldMove={onUseFieldMove}
          />
        )}
      </AnimatePresence>

      {/* Fly Animation */}
      <AnimatePresence>
        {phase.type === 'FLY_ANIMATING' && (
          <FlyAnimation
            town={phase.town}
            pokemonName={phase.pokemonName}
            pokemonSprite={phase.pokemonSprite}
          />
        )}
      </AnimatePresence>

      {/* Config */}
      <AnimatePresence>
        {phase.type === 'CONFIG' && <ConfigPanel />}
      </AnimatePresence>

      {/* PC Storage */}
      <AnimatePresence>
        {phase.type === 'PC' && (
          <PCStorageUI
            team={playerTeam}
            pc={store.pcStorage}
            onClose={() => store.setPhase(inBattle ? battle(B_CHOOSING) : EXPLORING)}
            onSwap={handlePCSwap}
          />
        )}
      </AnimatePresence>

      {/* Teleport Error Modal */}
      <AnimatePresence>
        {store.teleportError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-red-900 border-4 border-red-500 rounded p-8 max-w-lg text-center shadow-[0_0_50px_rgba(239,68,68,0.5)]">
              <h2 className="text-3xl text-white font-bold mb-4">⚠️ SYSTEM ERROR</h2>
              <p className="text-red-100 text-lg mb-6 leading-relaxed">{store.teleportError}</p>
              <button
                className="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-8 rounded border-2 border-red-300 transition-colors"
                onClick={() => store.setTeleportError(null)}
              >
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});
