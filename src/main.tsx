import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { FireredPreview } from './components/FireredPreview.tsx';
import { FireredKantoPreview } from './components/FireredKantoPreview.tsx';
import './index.css';
// Side-effect import: installs window.__log + DEV crash auto-save.
import './lib/eventLogBrowser.ts';

// `?firered=<LAYOUT_ID>` mounts a standalone FireRed renderer preview that
// does not load the full game state — used to verify the new metatile
// pipeline visually without entangling battles/NPCs/save logic.
//
// Special value `?firered=KANTO` mounts the stitched-Kanto preview (all 38
// outdoor zones laid out per pokefirered's connection graph).
const fireredLayout = new URLSearchParams(window.location.search).get('firered');

function pickRoot() {
  if (fireredLayout === 'KANTO') return <FireredKantoPreview />;
  if (fireredLayout) return <FireredPreview layoutId={fireredLayout} />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {pickRoot()}
  </StrictMode>,
);
