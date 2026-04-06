import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const TILE_TYPES = ['grass', 'path', 'wall', 'door', 'floor', 'carpet', 'table', 'tree', 'sign'];

export function MapEditor({ onClose }: { onClose: () => void }) {
  const store = useGameStore();
  const [selectedMapKey, setSelectedMapKey] = useState<string>(store.currentMap);
  const [activeTile, setActiveTile] = useState<string>('grass');
  const [localMapData, setLocalMapData] = useState(JSON.parse(JSON.stringify(store.worldMaps)));
  const [isDragging, setIsDragging] = useState(false);

  // Fallback if map missing
  if (!localMapData[selectedMapKey]) {
      localMapData[selectedMapKey] = Array(20).fill([]).map(() => Array(20).fill({ type: 'grass', walkable: true }));
  }

  const currentGrid = localMapData[selectedMapKey];

  const handleTileDraw = (y: number, x: number) => {
    const newGrid = [...currentGrid];
    const newRow = [...newGrid[y]];
    // Auto-determine walkability based on standard types
    const isWalkable = !['wall', 'tree', 'table'].includes(activeTile);
    newRow[x] = { type: activeTile, walkable: isWalkable };
    newGrid[y] = newRow;
    
    setLocalMapData({
      ...localMapData,
      [selectedMapKey]: newGrid
    });
  };

  const getTileColor = (type: string) => {
    switch(type) {
      case 'grass': return '#88d8b0';
      case 'path': return '#e0f8d0';
      case 'wall': return '#f8f8f8';
      case 'door': return '#a05030';
      case 'floor': return '#f0f0f0';
      case 'carpet': return '#f85858';
      case 'table': return '#d8d8d8';
      case 'tree': return '#1a7a40';
      case 'sign': return '#c8a020';
      default: return '#000';
    }
  };

  const copyToClipboard = () => {
    // Compact export as { rows: string[] } + legend for quick paste
    const tileToCode: Record<string, string> = {
      grass: 'G',
      path: 'P',
      wall: 'W',
      door: 'D',
      floor: 'F',
      carpet: 'C',
      table: 'T',
      tree: 'R',
      sign: 'S',
    };
    const rows = localMapData[selectedMapKey].map((row: any[]) =>
      row.map((tile: any) => tileToCode[tile.type] ?? 'G').join('')
    );
    const compact = {
      rows,
      legend: {
        G: 'grass',
        P: 'path',
        W: 'wall',
        D: 'door',
        F: 'floor',
        C: 'carpet',
        T: 'table',
        R: 'tree',
        S: 'sign',
      },
    };
    const fullReplacement = `export const ${selectedMapKey}_MAP = ${JSON.stringify(compact, null, 2)};`;
    navigator.clipboard.writeText(fullReplacement);
    alert('Compact map copied to clipboard as { rows: string[] }!');
  };

  const saveToLiveEngine = () => {
    // @ts-ignore
    useGameStore.setState({ worldMaps: localMapData });
    alert('Injected direct into Live Engine! You can now walk on it.');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex text-white font-sans">
      {/* Sidebar Tooling */}
      <div className="w-80 bg-slate-800 border-r-4 border-slate-700 p-4 flex flex-col gap-4 overflow-y-auto">
        <h2 className="text-2xl font-black text-emerald-400">MAP EDITOR</h2>
        <button onClick={onClose} className="px-4 py-2 bg-red-500 rounded font-bold hover:bg-red-400">Exit Editor</button>

        <div>
          <label className="text-xs text-slate-400 font-bold uppercase">Map Target</label>
          <select 
            value={selectedMapKey} 
            onChange={e => setSelectedMapKey(e.target.value)}
            className="w-full bg-slate-900 border-2 border-slate-600 p-2 rounded mt-1 outline-none"
          >
            {Object.keys(localMapData).map(mapName => (
              <option key={mapName} value={mapName}>{mapName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Tile Palette</label>
          <div className="grid grid-cols-3 gap-2">
            {TILE_TYPES.map(type => (
              <button 
                key={type}
                onClick={() => setActiveTile(type)}
                className={`flex flex-col items-center justify-center p-2 rounded border-2 ${activeTile === type ? 'border-emerald-400 bg-emerald-400/20' : 'border-slate-600 bg-slate-700'}`}
              >
                <div className="w-6 h-6 border border-black" style={{ backgroundColor: getTileColor(type) }} />
                <span className="text-[10px] mt-1 font-mono">{type}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-700 pt-4">
           <button onClick={saveToLiveEngine} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded shadow-lg">TEST IN ENGINE</button>
           <button onClick={copyToClipboard} className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded shadow-lg">COPY TO CLIPBOARD</button>
        </div>
      </div>

      {/* Editor Canvas Container */}
      <div className="flex-1 flex items-center justify-center bg-slate-950 p-8 overflow-hidden touch-none">
         <div 
           className="relative shadow-[0_0_50px_rgba(0,0,0,0.8)] border-4 border-slate-700 bg-black"
           onMouseDown={() => setIsDragging(true)}
           onMouseUp={() => setIsDragging(false)}
           onMouseLeave={() => setIsDragging(false)}
         >
           <div 
             className="grid" 
             style={{ 
               gridTemplateColumns: `repeat(${currentGrid[0].length}, 32px)`,
               width: currentGrid[0].length * 32,
             }}
           >
             {currentGrid.map((row: any, y: number) => (
                row.map((tile: any, x: number) => (
                   <div 
                     key={`${x}-${y}`}
                     onMouseDown={() => handleTileDraw(y, x)}
                     onMouseEnter={() => { if (isDragging) handleTileDraw(y, x) }}
                     className="w-[32px] h-[32px] border-[0.5px] border-white/5 hover:border-white/50 relative cursor-crosshair"
                     style={{ 
                        backgroundColor: getTileColor(tile.type),
                     }}
                   >
                     {/* Visual hints for collision */}
                     {!tile.walkable && <div className="absolute inset-0 flex items-center justify-center opacity-30 text-rose-500 font-bold">X</div>}
                   </div>
                ))
             ))}
           </div>
         </div>
      </div>
    </div>
  );
}
