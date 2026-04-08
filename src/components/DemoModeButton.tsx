import { useState, useEffect } from 'react';
import { startDemo, stopDemo, pauseDemo, resumeDemo, setSpeed, isDemoRunning, isDemoPaused, getDemoLog, exportDemoLog } from '../lib/demoMode';
import { getGameSpeed } from '../lib/gameSpeed';

export function DemoModeButton() {
  const [running, setRunning] = useState(isDemoRunning);
  const [paused, setPaused] = useState(isDemoPaused);
  const [logCount, setLogCount] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setRunning(isDemoRunning());
      setPaused(isDemoPaused());
      setLogCount(getDemoLog().length);
      setCurrentSpeed(getGameSpeed());
    }, 500);
    return () => clearInterval(id);
  }, []);

  const toggle = () => {
    if (running) { stopDemo(); setRunning(false); setPaused(false); }
    else { startDemo({ gameSpeed: currentSpeed || 1 }); setRunning(true); }
  };

  const togglePause = () => {
    if (paused) { resumeDemo(); setPaused(false); }
    else { pauseDemo(); setPaused(true); }
  };

  const changeSpeed = (speed: number) => {
    setCurrentSpeed(speed);
    setSpeed(speed);
  };

  const download = () => {
    const json = exportDemoLog();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demo-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-1.5">
      {running && (
        <div className="bg-black/85 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-mono flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'}`} />
          {paused ? 'PAUSA' : 'DEMO'} {logCount}ev

          <button onClick={togglePause}
            className="px-1.5 py-0.5 bg-white/20 rounded hover:bg-white/30">
            {paused ? '▶' : '⏸'}
          </button>

          {/* Speed controls */}
          {[['1x', 1], ['2x', 2], ['5x', 5], ['10x', 10], ['20x', 20]].map(([label, speed]) => (
            <button key={label as string}
              onClick={() => changeSpeed(speed as number)}
              className={`px-1.5 py-0.5 rounded text-[9px] ${currentSpeed === speed ? 'bg-white/40 font-bold' : 'bg-white/15 hover:bg-white/25'}`}>
              {label as string}
            </button>
          ))}

          <button onClick={download}
            className="px-1.5 py-0.5 bg-white/20 rounded hover:bg-white/30">
            DL
          </button>
        </div>
      )}
      <button onClick={toggle}
        className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
          running ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}>
        {running ? 'Detener' : 'Demo'}
      </button>
    </div>
  );
}
