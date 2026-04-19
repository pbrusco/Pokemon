import { useEffect, useRef, useState } from 'react';
import { startRecord, stopRecord, downloadLog, isRecording, getLog, saveLogToDisk } from '../lib/eventLog';

export function RecorderButton() {
  const [recording, setRecording] = useState(isRecording);
  const [count, setCount] = useState(0);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const lastSavedCountRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      setRecording(isRecording());
      setCount(getLog()?.events.length ?? 0);
    }, 300);
    return () => clearInterval(id);
  }, []);

  const hasLog = count > 0;
  const unsaved = hasLog && count !== lastSavedCountRef.current;

  const save = async () => {
    if (!hasLog || saving) return;
    setSaving(true);
    try {
      const p = await saveLogToDisk();
      if (p) {
        setSavedPath(p);
        lastSavedCountRef.current = count;
        console.info(`[log] saved → ${p}`);
      }
    } catch (err) {
      console.error('[log] save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const start = () => {
    if (unsaved) {
      const ok = window.confirm(
        `Hay ${count} eventos sin guardar. ¿Descartar y empezar una nueva grabación?`
      );
      if (!ok) return;
    }
    startRecord();
    setSavedPath(null);
    lastSavedCountRef.current = 0;
    setRecording(true);
  };

  const stop = async () => {
    stopRecord();
    setRecording(false);
    // Autosave so the user never loses a recording by clicking Stop.
    await save();
  };

  return (
    <div className="fixed bottom-20 right-4 z-[200] flex flex-col items-end gap-1.5">
      {hasLog && (
        <div className="bg-black/85 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-mono flex items-center gap-2 max-w-[90vw]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              recording ? 'bg-red-500 animate-pulse' : unsaved ? 'bg-yellow-400' : 'bg-emerald-400'
            }`}
          />
          <span>{recording ? 'REC' : unsaved ? 'STOPPED' : 'SAVED'}</span>
          <span>{count}ev</span>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={save}
            disabled={saving || (!unsaved && !recording)}
            className="px-1.5 py-0.5 bg-white/20 rounded hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Guardar en ./logs"
          >
            {saving ? '…' : 'Save'}
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={downloadLog}
            className="px-1.5 py-0.5 bg-white/20 rounded hover:bg-white/30"
            title="Descargar log"
          >
            DL
          </button>
          {savedPath && (
            <span className="text-emerald-300 truncate max-w-[200px]" title={savedPath}>
              ✓ {savedPath}
            </span>
          )}
        </div>
      )}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={recording ? stop : start}
        className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
          recording ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {recording ? 'Stop & Save' : 'Rec'}
      </button>
    </div>
  );
}
