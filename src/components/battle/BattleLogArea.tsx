import { useEffect, useState, useCallback, useRef } from 'react';
import type { BattleLogEntry } from '../../types';

function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [visible, setVisible] = useState('');
  const charsPerTick = 2;

  useEffect(() => {
    setVisible('');
    if (!text) return;

    let pos = 0;
    const interval = setInterval(() => {
      pos = Math.min(pos + charsPerTick, text.length);
      setVisible(text.slice(0, pos));
      if (pos >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 22);

    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <span>{visible}</span>;
}

export function BattleLogArea({ battleLogs, battleLog }: { battleLogs: BattleLogEntry[]; battleLog: string }) {
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const lastTextRef = useRef('');

  const latestMsg = battleLogs.length > 0 ? battleLogs[0] : null;

  useEffect(() => {
    const candidate = latestMsg?.text ?? battleLog;
    if (candidate === lastTextRef.current) return;
    lastTextRef.current = candidate;
    setTypingText(candidate);
    setIsTyping(true);
  }, [latestMsg?.text, battleLog]);

  const handleTypingDone = useCallback(() => {
    setIsTyping(false);
  }, []);

  return (
    <div className="flex-grow border-4 border-[#f8d870] bg-[#1f3558] rounded-sm p-3 sm:p-4 relative shadow-[inset_0_0_0_2px_#0f1f38] flex flex-col justify-start overflow-hidden">
      <div className="flex flex-col-reverse gap-1 overflow-y-auto">
        {battleLogs.length > 0 ? (
          battleLogs.map((msg, i) => {
            const isLatest = i === 0;
            return (
              <div key={msg.id}>
                {!isLatest && <hr className="border-t border-white/10 my-1" />}
                <div className={`${isLatest ? 'text-white' : 'text-slate-400'}`}>
                  {msg.speaker !== 'Sistema' && (
                    <p className="font-game text-[#f8d870] text-[10px] leading-tight mb-0.5">{msg.speaker}</p>
                  )}
                  <p className={`font-game text-[10px] leading-relaxed ${isLatest ? 'text-white' : 'text-slate-400 opacity-80'}`}>
                    {isLatest && isTyping ? (
                      <TypewriterText text={typingText} onComplete={handleTypingDone} />
                    ) : (
                      msg.text
                    )}
                    {isLatest && !isTyping && (
                      <span className="inline-block text-red-400 ml-1 animate-pulse">◆</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="font-game text-white text-[10px] leading-relaxed">
            {isTyping ? (
              <TypewriterText text={typingText} onComplete={handleTypingDone} />
            ) : (
              battleLog
            )}
            {isTyping && (
              <span className="inline-block w-1.5 h-3 bg-white ml-0.5 align-text-bottom animate-pulse" />
            )}
          </p>
        )}
      </div>
    </div>
  );
}
