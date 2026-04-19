import { motion } from 'motion/react';

export const DialogueBox = ({ text, onComplete }: { text: string, onComplete: () => void }) => {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-32 sm:bottom-12 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-black/70 backdrop-blur-2xl border-[1px] border-white/20 rounded-[1.5rem] sm:rounded-3xl p-6 sm:p-8 shadow-2xl z-50 cursor-pointer overflow-hidden ring-1 ring-white/10"
      onClick={() => {
        onComplete();
      }}
    >
      <div className="flex items-start gap-3 sm:gap-6 relative">
        <div className="flex-1">
          <p className="text-lg sm:text-2xl font-medium text-white leading-relaxed font-sans tracking-tight drop-shadow-md">
            {text}
          </p>
          <div className="mt-4 flex justify-end">
            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-red-500/80 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            >
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-current" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
