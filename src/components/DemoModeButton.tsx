import { useState, useEffect } from 'react';
import { startDemo, stopDemo, isDemoRunning, getDemoLog, exportDemoLog } from '../lib/demoMode';

export function DemoModeButton() {
  const [running, setRunning] = useState(false);
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLogCount(getDemoLog().length), 1000);
    return () => clearInterval(id);
  }, [running]);

  const toggle = () => {
    if (running) {
      stopDemo();
      setRunning(false);
    } else {
      startDemo();
      setRunning(true);
    }
  };

  const download = () => {
    const json = exportDemoLog();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demo-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-2">
      {running && (
        <div className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          DEMO — {logCount} eventos
          <button
            onClick={download}
            className="ml-2 px-2 py-0.5 bg-white/20 rounded hover:bg-white/30 text-[10px]"
          >
            Exportar
          </button>
        </div>
      )}
      <button
        onClick={toggle}
        className={`px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-all ${
          running
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
      >
        {running ? 'Detener Demo' : 'Iniciar Demo'}
      </button>
    </div>
  );
}
