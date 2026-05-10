import { memo, useCallback } from 'react';
import { motion } from 'motion/react';
import { useGameStore } from '../store/gameStore';
import { SfxController } from '../lib/sfx';
import { setGameSpeed } from '../lib/gameSpeed';
import { EXPLORING } from '../types';

function ConfigSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="font-mono text-xs text-slate-500 uppercase tracking-wide block mb-2">{label}</span>
      {children}
    </div>
  );
}

function ToggleButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="font-mono text-xs px-3 py-0.5 rounded border transition-colors"
      style={{
        background: active ? '#f0fdf4' : '#fef2f2',
        borderColor: active ? '#86efac' : '#fca5a5',
        color: active ? '#16a34a' : '#dc2626',
      }}
    >
      {active ? 'ON' : 'OFF'}
    </button>
  );
}

function VolumeRow({ label, muted, volume, onToggle, onVolumeChange, testLabel, onTest }: {
  label: string;
  muted: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  testLabel?: string;
  onTest?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-sm text-slate-800 font-semibold">{label}</span>
        <div className="flex items-center gap-2">
          <ToggleButton active={!muted} onToggle={onToggle} />
          {onTest && (
            <button
              onClick={onTest}
              className="font-mono text-xs text-slate-500 hover:text-slate-800 border border-slate-300 rounded px-2 py-0.5 transition-colors"
            >
              {testLabel ?? 'Test'}
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={muted ? 0 : volume}
        onChange={onVolumeChange}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #4878D8 ${(muted ? 0 : volume) * 100}%, #e5e7eb ${(muted ? 0 : volume) * 100}%)`,
          accentColor: '#4878D8',
        }}
      />
      <div className="flex justify-between mt-0.5">
        <span className="font-mono text-[9px] text-slate-400">{Math.round((muted ? 0 : volume) * 100)}%</span>
      </div>
    </div>
  );
}

export const ConfigPanel = memo(() => {
  const phase = useGameStore(s => s.phase);
  const musicMuted = useGameStore(s => s.musicMuted);
  const musicVolume = useGameStore(s => s.musicVolume);
  const sfxMuted = useGameStore(s => s.sfxMuted);
  const sfxVolume = useGameStore(s => s.sfxVolume);
  const ghostMode = useGameStore(s => s.ghostMode);
  const showMinimap = useGameStore(s => s.showMinimap);
  const setMusicMuted = useGameStore(s => s.setMusicMuted);
  const setMusicVolume = useGameStore(s => s.setMusicVolume);
  const setSfxMuted = useGameStore(s => s.setSfxMuted);
  const setSfxVolume = useGameStore(s => s.setSfxVolume);
  const toggleGhostMode = useGameStore(s => s.toggleGhostMode);
  const toggleMinimap = useGameStore(s => s.toggleMinimap);

  const returnTo = phase.type === 'CONFIG' ? (phase.returnTo ?? EXPLORING) : EXPLORING;

  const handleMusicVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setMusicVolume(v);
    if (v === 0 && !musicMuted) setMusicMuted(true);
    else if (v > 0 && musicMuted) setMusicMuted(false);
  }, [setMusicVolume, setMusicMuted, musicMuted]);

  const handleSfxVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setSfxVolume(v);
    if (v === 0 && !sfxMuted) setSfxMuted(true);
    else if (v > 0 && sfxMuted) setSfxMuted(false);
  }, [setSfxVolume, setSfxMuted, sfxMuted]);

  const toggleMusic = useCallback(() => {
    setMusicMuted(!musicMuted);
    if (!musicMuted && musicVolume === 0) setMusicVolume(0.5);
  }, [musicMuted, musicVolume, setMusicMuted, setMusicVolume]);

  const toggleSfx = useCallback(() => {
    setSfxMuted(!sfxMuted);
    if (!sfxMuted && sfxVolume === 0) setSfxVolume(0.7);
  }, [sfxMuted, sfxVolume, setSfxMuted, setSfxVolume]);

  const testSfx = useCallback(() => { SfxController.play('menu_select'); }, []);

  const handleSpeed = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGameSpeed(parseFloat(e.target.value));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm max-h-[85vh] flex flex-col">
        <div className="bg-white border-[4px] border-slate-800 rounded-lg shadow-[6px_6px_0_rgba(0,0,0,0.15)] flex flex-col">
          {/* Header */}
          <div className="border-b-2 border-slate-300 px-4 py-2 bg-slate-50 rounded-t shrink-0">
            <span className="font-mono font-bold text-slate-800 text-sm tracking-wide uppercase">
              Configurar
            </span>
          </div>

          {/* Content — scrollable */}
          <div className="px-4 py-4 space-y-5 overflow-y-auto">
            <ConfigSection label="Audio">
              <VolumeRow
                label="Música"
                muted={musicMuted} volume={musicVolume}
                onToggle={toggleMusic} onVolumeChange={handleMusicVolume}
              />
              <div className="mt-3">
                <VolumeRow
                  label="Efectos"
                  muted={sfxMuted} volume={sfxVolume}
                  onToggle={toggleSfx} onVolumeChange={handleSfxVolume}
                  testLabel="Test" onTest={testSfx}
                />
              </div>
            </ConfigSection>

            <ConfigSection label="Utilidades">
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  <span className="font-mono text-sm text-slate-800">Modo fantasma</span>
                  <span className="font-mono text-[10px] text-slate-400">Atravesar paredes</span>
                </div>
                <ToggleButton active={ghostMode} onToggle={toggleGhostMode} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-mono text-sm text-slate-800">Minimapa</span>
                  <span className="font-mono text-[10px] text-slate-400">Superior izquierda</span>
                </div>
                <ToggleButton active={showMinimap} onToggle={toggleMinimap} />
              </div>
            </ConfigSection>

            <ConfigSection label="Velocidad del juego">
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                defaultValue="1"
                onChange={handleSpeed}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer mt-[-2px]"
                style={{
                  background: `linear-gradient(to right, #d03030 0%, #d03030 100%)`,
                  accentColor: '#d03030',
                }}
              />
              <div className="flex justify-between mt-0.5">
                <span className="font-mono text-[9px] text-slate-400">x1</span>
                <span className="font-mono text-[9px] text-slate-400">x8</span>
              </div>
            </ConfigSection>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-slate-300 px-4 py-3 bg-slate-50 rounded-b flex justify-between items-center shrink-0">
            <span className="font-mono text-[9px] text-slate-400">Atajos: G M 1 2</span>
            <button
              onClick={() => useGameStore.getState().setPhase(returnTo)}
              className="font-mono font-bold text-sm text-slate-800 border-2 border-slate-400 rounded px-5 py-1 hover:bg-slate-100 transition-colors"
            >
              CERRAR
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
