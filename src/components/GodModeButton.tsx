import { useState } from 'react';
import { isGodMode, toggleGodMode } from '../lib/godMode';

export function GodModeButton() {
  const [active, setActive] = useState(isGodMode);

  const toggle = () => {
    const next = toggleGodMode();
    setActive(next);
    window.dispatchEvent(new CustomEvent('godModeToggled', { detail: next }));
  };

  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={toggle}
      className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
        active ? 'bg-yellow-400 hover:bg-yellow-300 text-black' : 'bg-slate-700 hover:bg-slate-600 text-white'
      }`}
    >
      {active ? 'GOD ON' : 'God'}
    </button>
  );
}
