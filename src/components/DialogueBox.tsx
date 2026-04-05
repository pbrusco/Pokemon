import { motion } from 'motion/react';
import { soundManager } from '../lib/sounds';

export const DialogueBox = ({ text, onComplete }: { text: string, onComplete: () => void }) => {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-40 sm:bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-white border-[4px] sm:border-[6px] border-[#58c8f8] rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-2xl z-50 cursor-pointer pk-dialogue-shadow"
      onClick={() => {
        soundManager.play('SELECT');
        onComplete();
      }}
    >
      <div className="flex items-start gap-3 sm:gap-6">
        <div className="flex-1">
          <p className="text-lg sm:text-2xl font-bold text-[#383838] leading-relaxed font-sans tracking-tight">
            {text}
          </p>
          <div className="mt-4 flex justify-end">
            <motion.div 
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-[#f85858]"
            >
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-current" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
