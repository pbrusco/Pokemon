import { useState, memo } from 'react';
import { useGameStore } from '../store/gameStore';

const TILE_TYPES = ['grass', 'path', 'wall', 'door', 'floor', 'carpet', 'table', 'tree', 'sign', 'cut_tree', 'boulder', 'water'];

export const MapEditor = memo(function MapEditor({ onClose }: { onClose: () => void }) {
  const store = useGameStore();
  const [selectedMapKey, setSelectedMapKey] = useState<string>(store.currentMap);
  const [activeTile, setActiveTile] = useState<string>('grass');
  const [localMapData, setLocalMapData] = useState(JSON.parse(JSON.stringify(store.worldMaps)));
  const [isDragging, setIsDragging] = useState(false);

  const mapData = localMapData[selectedMapKey] || { tiles: [], warps: [] };
  const currentGrid = mapData.tiles;

  const handleTileDraw = (y: number, x: number) => {
    const newGrid = [...currentGrid];
    const newRow = [...newGrid[y]];
    const nonWalkable = ['wall', 'tree', 'table', 'cut_tree', 'boulder', 'water'];
    const isWalkable = !nonWalkable.includes(activeTile);
    
    newRow[x] = { type: activeTile, walkable: isWalkable };
    newGrid[y] = newRow;
    
    setLocalMapData({
      ...localMapData,
      [selectedMapKey]: { ...mapData, tiles: newGrid }
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
      case 'cut_tree': return '#2e8b57';
      case 'boulder': return '#8b8b8b';
      case 'water': return '#58a8f8';
      default: return '#000';
    }
  };

  const copyToClipboard = () => {
    const tileToCode: Record<string, string> = {
      grass: 'G', path: 'P', wall: 'W', door: 'D', floor: 'F', carpet: 'C',
      table: 'X', tree: 'T', sign: 'S', cut_tree: 'H', boulder: 'B', water: '~'
    };

    const rows = currentGrid.map((row: any[]) =>
      row.map((tile: any) => tileToCode[tile.type] ?? 'G').join('')
    );

    const output = JSON.stringify({ rows, warps: mapData.warps }, null, 2);
    navigator.clipboard.writeText(output);
    alert('Map JSON copied to clipboard!');
  };

  const saveToLiveEngine = () => {
    useGameStore.setState({ worldMaps: localMapData });
    alert('Injected into live engine!');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex text-white font-sans">
      <div className="w-80 bg-slate-800 border-r-4 border-slate-700 p-4 flex flex-col gap-4 overflow-y-auto">
        <h2 className="text-2xl font-black text-emerald-400 italic">MAP EDITOR</h2>
        <button onClick={onClose} className="px-4 py-2 bg-red-500 rounded font-bold hover:bg-red-400 transition-colors">Exit Editor</button>
        
        <div>
          <label className="text-xs text-slate-400 font-bold uppercase">Current Map</label>
          <select 
            value={selectedMapKey} 
            onChange={e => setSelectedMapKey(e.target.value)}
            className="w-full bg-slate-900 border-2 border-slate-600 p-2 rounded mt-1 outline-none"
          >
            {Object.keys(localMapData).map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TILE_TYPES.map(type => (
            <button 
              key={type} 
              onClick={() => setActiveTile(type)}
              className={`flex flex-col items-center p-2 rounded border-2 ${activeTile === type ? 'border-emerald-400 bg-emerald-400/20' : 'border-slate-600 bg-slate-700'}`}
            >
              <div className="w-6 h-6 border border-black" style={{ backgroundColor: getTileColor(type) }} />
              <span className="text-[9px] mt-1 font-mono uppercase">{type}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2 border-t border-slate-700 pt-4">
           <button onClick={saveToLiveEngine} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded">TEST ENGINE</button>
           <button onClick={copyToClipboard} className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded">COPY JSON</button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-slate-950 p-8 overflow-hidden touch-none">
         <div 
           className="relative shadow-2xl border-4 border-slate-700 bg-black"
           onMouseDown={() => setIsDragging(true)}
           onMouseUp={() => setIsDragging(false)}
           onMouseLeave={() => setIsDragging(false)}
         >
           <div className="grid" style={{ gridTemplateColumns: `repeat(20, 32px)`, width: 640 }}>
             {currentGrid.map((row: any, y: number) => row.map((tile: any, x: number) => (
               <div 
                 key={`${x}-${y}`}
                 onMouseDown={() => handleTileDraw(y, x)}
                 onMouseEnter={() => isDragging && handleTileDraw(y, x)}
                 className="w-[32px] h-[32px] border-[0.5px] border-white/5 relative cursor-crosshair"
                 style={{ backgroundColor: getTileColor(tile.type) }}
               >
                 {!tile.walkable && <div className="absolute inset-0 flex items-center justify-center opacity-20 text-rose-500">X</div>}
               </div>
             )))}
           </div>
         </div>
      </div>
    </div>
  );
});