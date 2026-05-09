import { useEffect, useRef, useState } from 'react';
import { useAnimate } from 'motion/react';
import { sd, sdur } from '../../lib/gameSpeed';

export function PokeballAnim({ isCatching, catchResult }: { isCatching: boolean; catchResult: boolean | null }) {
  const [scope, animate] = useAnimate();
  const [visible, setVisible] = useState(false);
  const catchResultRef = useRef<boolean | null>(null);
  const [caughtFinal, setCaughtFinal] = useState(false);

  useEffect(() => { catchResultRef.current = catchResult; }, [catchResult]);

  useEffect(() => {
    if (!isCatching) {
      setVisible(false);
      setCaughtFinal(false);
      return;
    }
    setVisible(true);
    setCaughtFinal(false);

    (async () => {
      await new Promise(r => setTimeout(r, sd(30)));
      if (!scope.current) return;

      await animate(scope.current, { x: 0, y: 0, rotate: 0, scale: 0.7, opacity: 1 }, { duration: 0 });

      await animate(scope.current,
        { x: [0, 260], y: [0, -190], rotate: [0, 540], scale: [0.7, 1.1, 1] },
        { duration: sdur(0.65), ease: 'easeOut' }
      );

      await animate(scope.current,
        { y: [-190, -110] },
        { duration: sdur(0.25), ease: 'easeIn' }
      );

      await animate(scope.current,
        { y: [-110, -130, -110] },
        { duration: sdur(0.2), ease: 'easeOut' }
      );

      const wobbleAngles = [[540, 516, 564, 540], [540, 520, 560, 540], [540, 524, 556, 540]];
      for (let i = 0; i < 3; i++) {
        await animate(scope.current, { rotate: wobbleAngles[i] }, { duration: sdur(0.45), ease: 'easeInOut' });
        if (i < 2) await new Promise(r => setTimeout(r, sd(120)));
      }

      await new Promise(r => setTimeout(r, sd(350)));

      const result = catchResultRef.current;
      if (result === true) {
        for (let i = 0; i < 3; i++) {
          await animate(scope.current, { opacity: [1, 0.1, 1] }, { duration: sdur(0.3) });
          await new Promise(r => setTimeout(r, sd(80)));
        }
        await animate(scope.current, { scale: [1, 1.2, 1] }, { duration: sdur(0.4) });
        setCaughtFinal(true);
      } else {
        await animate(scope.current,
          { scale: [1, 1.6], rotate: [540, 620], opacity: [1, 0] },
          { duration: sdur(0.45) }
        );
        setVisible(false);
      }
    })();
  }, [isCatching, animate, scope]);

  if (!visible) return null;

  return (
    <div
      ref={scope}
      data-testid="pokeball-anim"
      className="absolute z-[102] pointer-events-none"
      style={{ bottom: '30%', left: '22%' }}
    >
      <div className="relative w-10 h-10 sm:w-14 sm:h-14 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
        <div className="absolute inset-0 rounded-full border-[3px] border-black overflow-hidden">
          <div className="absolute top-0 w-full h-1/2 bg-red-500" />
          <div className="absolute bottom-0 w-full h-1/2 bg-white" />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-[3px] bg-black z-10" />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20
                        w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[2px] border-black
                        flex items-center justify-center transition-colors duration-200
                        ${caughtFinal ? 'bg-yellow-300' : 'bg-black'}`}>
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}
