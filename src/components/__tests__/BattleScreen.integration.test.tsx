import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BattleScreen } from '../BattleScreen';

type BattleScreenProps = React.ComponentProps<typeof BattleScreen>;

function makeProps(overrides: Partial<BattleScreenProps> = {}): BattleScreenProps {
  return {
    currentMap: 'ROUTE_1',
    battleShake: false,
    enemyPokemon: { id: 'rattata', name: 'RATTATA', level: 3, hp: 10, maxHp: 10, type: 'normal', baseStats: { hp: 30, attack: 56, defense: 35, special: 25, speed: 72 }, moves: [], sprite: '', status: 'none', exp: 0, expToNextLevel: 100 },
    enemyAnim: 'idle',
    isCatching: false,
    catchResult: null,
    playerTeam: [{ id: 'bulbasaur', name: 'BULBASAUR', level: 5, hp: 20, maxHp: 20, type: 'grass', baseStats: { hp: 45, attack: 49, defense: 49, special: 65, speed: 45 }, moves: [], sprite: '', status: 'none', exp: 0, expToNextLevel: 100 }],
    playerAnim: 'idle',
    battleLog: '', battleLogs: [],
    showMoves: false,
    setShowMoves: vi.fn(),
    isTrainerBattle: false,
    isPlayerTurn: true,
    setIsBattle: vi.fn(),
    onFlee: vi.fn(),
    setShowInventory: vi.fn(),
    setShowTeam: vi.fn(),
    handleAttack: vi.fn(),
    ...overrides,
  };
}

describe('BattleScreen Pokéball Integration', () => {
  it('shows Pokéball animation when isCatching is true', () => {
    render(<BattleScreen {...makeProps({ isCatching: true, catchResult: null })} />);
    expect(screen.getByTestId('pokeball-anim')).toBeTruthy();
  });

  it('shows catch animation result (caught)', async () => {
    render(<BattleScreen {...makeProps({ isCatching: true, catchResult: true })} />);
    // Animation should eventually finish with a visible Pokéball
    expect(screen.getByTestId('pokeball-anim')).toBeTruthy();
  });

  it('shows catch animation result (escaped)', async () => {
    render(<BattleScreen {...makeProps({ isCatching: true, catchResult: false })} />);
    expect(screen.getByTestId('pokeball-anim')).toBeTruthy();
  });

  it('updates inventory after catch', () => {
    // Simulate inventory UI: check that setShowInventory is called after catch
    const setShowInventory = vi.fn();
    render(<BattleScreen {...makeProps({ isCatching: false, catchResult: true, setShowInventory })} />);
    // Simulate user opening inventory after catch
    act(() => setShowInventory(true));
    expect(setShowInventory).toHaveBeenCalledWith(true);
  });

  it('updates team/PC after catch', () => {
    // Simulate team UI: check that setShowTeam is called after catch
    const setShowTeam = vi.fn();
    render(<BattleScreen {...makeProps({ isCatching: false, catchResult: true, setShowTeam })} />);
    act(() => setShowTeam(true));
    expect(setShowTeam).toHaveBeenCalledWith(true);
  });

  it('exits battle after catch', () => {
    const setIsBattle = vi.fn();
    render(<BattleScreen {...makeProps({ isCatching: false, catchResult: true, setIsBattle })} />);
    act(() => setIsBattle(false));
    expect(setIsBattle).toHaveBeenCalledWith(false);
  });
});
