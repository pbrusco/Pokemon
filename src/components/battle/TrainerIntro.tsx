import { useEffect, useState } from 'react';
import { useAnimate, motion } from 'motion/react';

export function TrainerIntro({ name, sprite }: { name: string; sprite: string | null }) {
  const [scope, animate] = useAnimate();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!scope.current) return;
      await animate(scope.current, { x: ['100%', '0%'] }, { duration: 0.3, ease: 'easeOut' });
      await new Promise(r => setTimeout(r, 1200));
      await animate(scope.current, { x: ['0%', '100%'] }, { duration: 0.25, ease: 'easeIn' });
      setShow(false);
    };
    run();
  }, [animate, scope]);

  if (!show) return null;

  return (
    <motion.div
      ref={scope}
      className="absolute top-4 right-4 z-[100] flex items-center gap-3 bg-[#1a1a2e]/90 border-2 border-[#f8d870] rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm"
      style={{ x: '100%' }}
    >
      {sprite && (
        <img src={sprite} alt={name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain pixelated" />
      )}
      <div>
        <p className="text-[#f8d870] font-bold text-xs tracking-widest uppercase">¡{name} te desafía!</p>
        <p className="text-white text-xs mt-0.5">
          {name} {name === 'AZUL' ? 'quiere luchar' : 'quiere luchar'}!
        </p>
      </div>
    </motion.div>
  );
}
