import { motion, AnimatePresence } from 'motion/react';
import { TILE_SIZE } from '../../types';

interface TileProps {
  type: string;
  key?: string;
  hasEncounters?: boolean;
}

export const GameTile = ({ type, isGrassActive, hasEncounters }: TileProps & { isGrassActive?: boolean }) => {
  const isEncounterGrass = type === 'grass' && hasEncounters;
  const getTileStyle = () => {
    switch (type) {
      case 'grass': return isEncounterGrass ? 'bg-[#48a868] border-[#389858]/40' : 'bg-[#88d8b0] border-[#78c8a0]/30';
      case 'path': return 'bg-[#e0f8d0] border-[#d0e8c0]/50';
      case 'wall': return 'bg-[#f8f8f8] border-[#d8d8d8]';
      case 'door': return 'bg-[#a05030] border-[#803010]';
      case 'floor': return 'bg-[#f0f0f0] border-[#e0e0e0]';
      case 'carpet': return 'bg-[#f85858] border-[#d83838]';
      case 'table': return 'bg-[#d8d8d8] border-[#383838]';
      case 'tree': return 'bg-[#88d8b0] border-[#78c8a0]/30';
      case 'cut_tree': return 'bg-[#72c08f] border-[#4c9b6b]';
      case 'boulder': return 'bg-[#b8b8b8] border-[#8a8a8a]';
      case 'sign': return 'bg-[#e0f8d0] border-[#d0e8c0]/50';
      case 'bookshelf': return 'bg-[#9a6a4a] border-[#6b4a3a]';
      case 'machine': return 'bg-[#d0d8e0] border-[#8090a0]';
      default: return 'bg-white';
    }
  };

  return (
    <div
      className={`w-[${TILE_SIZE}px] h-[${TILE_SIZE}px] border-[0.5px] relative overflow-hidden transition-colors duration-500 ${getTileStyle()}`}
      style={{ width: TILE_SIZE, height: TILE_SIZE }}
    >
      {type === 'sign' && (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
          <div className="w-1 h-3 bg-[#a05030] border-x-2 border-[#383838] absolute bottom-2" />
          <div className="w-10 h-8 bg-[#d8b888] border-2 border-[#383838] rounded-sm absolute bottom-5 flex flex-col items-center justify-center gap-1">
            <div className="w-6 h-0.5 bg-[#383838]/20" />
            <div className="w-6 h-0.5 bg-[#383838]/20" />
          </div>
        </div>
      )}
      {type === 'tree' && (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
          <div className="absolute bottom-0 w-6 h-10 bg-[#a05030] border-2 border-[#383838] rounded-sm" />
        </div>
      )}
      {type === 'cut_tree' && (
        <div className="w-full h-full flex items-center justify-center relative">
          <div className="w-10 h-10 bg-[#3d8b5b] border-2 border-[#24563a] rounded-md shadow-sm" />
        </div>
      )}
      {type === 'boulder' && (
        <div className="w-full h-full flex items-center justify-center relative">
          <div className="w-10 h-10 bg-[#9a9a9a] border-2 border-[#6f6f6f] rounded-full shadow-sm" />
        </div>
      )}
      {type === 'grass' && !isEncounterGrass && (
        <div className="absolute inset-0 opacity-40">
          <div className="w-full h-full bg-[radial-gradient(circle,#58a880_1px,transparent_1px)] bg-[size:12px_12px]" />
          <div className="absolute top-2 left-2 w-1 h-2 bg-[#58a880] rounded-full rotate-12" />
          <div className="absolute bottom-3 right-4 w-1 h-3 bg-[#58a880] rounded-full -rotate-12" />
        </div>
      )}
      {isEncounterGrass && (
        <div className="absolute inset-0">
          {/* Tall grass blades */}
          <div className="absolute bottom-1 left-2 w-1 h-5 bg-[#2d7a48] rounded-t-full rotate-[-8deg] origin-bottom" />
          <div className="absolute bottom-1 left-4 w-1 h-7 bg-[#38904f] rounded-t-full rotate-[5deg] origin-bottom" />
          <div className="absolute bottom-1 left-6 w-1 h-5 bg-[#2d7a48] rounded-t-full rotate-[-3deg] origin-bottom" />
          <div className="absolute bottom-1 left-8 w-1 h-8 bg-[#227040] rounded-t-full rotate-[10deg] origin-bottom" />
          <div className="absolute bottom-1 left-10 w-1 h-6 bg-[#38904f] rounded-t-full rotate-[-6deg] origin-bottom" />
          <div className="absolute bottom-1 right-3 w-1 h-7 bg-[#2d7a48] rounded-t-full rotate-[4deg] origin-bottom" />
          <div className="absolute bottom-1 right-6 w-1 h-5 bg-[#38904f] rounded-t-full rotate-[-8deg] origin-bottom" />
        </div>
      )}
      <AnimatePresence>
        {type === 'grass' && isGrassActive && (
          <motion.div
            key="grass-rustle"
            initial={{ opacity: 0, scale: 0.6, y: 4 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.1, 1, 0.8], y: [4, -2, 0, 2] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none text-base"
          >
            🌿
          </motion.div>
        )}
      </AnimatePresence>
      {type === 'wall' && (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-full h-[40%] bg-[#f4a0a0] border-b-2 border-[#505050]" />
          <div className="w-full h-[60%] bg-[#efefef] flex items-center justify-center">
             <div className="w-3 h-3 bg-white border-b-2 border-[#d0d0d0] rounded-sm" />
          </div>
        </div>
      )}
      {type === 'floor' && (
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000),linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]" />
        </div>
      )}
      {type === 'bookshelf' && (
        <div className="w-full h-full flex flex-col gap-1 p-1 items-center justify-center">
          <div className="flex gap-0.5"><div className="w-1.5 h-3 bg-red-400 rounded-sm"/><div className="w-1.5 h-3 bg-blue-400 rounded-sm"/><div className="w-1.5 h-3 bg-green-400 rounded-sm"/></div>
          <div className="w-full h-1 bg-[#4a3020] rounded-sm" />
          <div className="flex gap-0.5"><div className="w-1.5 h-3 bg-yellow-400 rounded-sm"/><div className="w-1.5 h-3 bg-purple-400 rounded-sm"/></div>
        </div>
      )}
      {type === 'machine' && (
        <div className="w-full h-full flex flex-col p-1 items-center justify-between border-2 border-slate-400 bg-slate-300">
          <div className="w-full h-3 bg-slate-800 rounded-sm flex items-center justify-center gap-1">
             <div className="w-1 h-1 bg-green-500 rounded-full" />
             <div className="w-1 h-1 bg-red-500 rounded-full" />
          </div>
          <div className="w-full h-2 bg-slate-400" />
        </div>
      )}
      {type === 'door' && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-10 h-12 bg-[#a05030] border-2 border-[#383838] rounded-t-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-yellow-400 rounded-full ml-4" />
          </div>
        </div>
      )}
      {type === 'carpet' && (
        <div className="w-full h-full flex items-center justify-center opacity-40">
          <div className="w-8 h-2 bg-white/30 rounded-full" />
        </div>
      )}
      {type === 'table' && (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-full h-1/2 bg-[#d8d8d8] border-b-2 border-[#383838]" />
          <div className="w-full h-1/2 bg-[#b8b8b8]" />
        </div>
      )}
      {type === 'path' && (
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[radial-gradient(circle,#c0d8b0_1px,transparent_1px)] bg-[size:16px_16px]" />
        </div>
      )}
    </div>
  );
};
