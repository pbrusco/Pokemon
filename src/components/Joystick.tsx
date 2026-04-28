import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { type Direction } from '../types';

export const Joystick = ({ onMove }: { onMove: (dir: Direction | null) => void }) => {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    
    const distance = Math.sqrt(x * x + y * y);
    const maxDistance = 40; // radius of joystick
    
    const clampedX = Math.max(-maxDistance, Math.min(maxDistance, x));
    const clampedY = Math.max(-maxDistance, Math.min(maxDistance, y));
    
    setKnobPos({ x: clampedX, y: clampedY });

    // Determine direction
    if (distance > 10) {
      if (Math.abs(x) > Math.abs(y)) {
        onMove(x > 0 ? 'right' : 'left');
      } else {
        onMove(y > 0 ? 'down' : 'up');
      }
    } else {
      onMove(null);
    }
  };

  const handlePointerDown = () => {
    setIsDragging(true);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(null);
  };

  return (
    <div 
      ref={containerRef}
      className="w-32 h-32 bg-slate-800/50 rounded-full flex items-center justify-center relative touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <motion.div 
        animate={{ x: knobPos.x, y: knobPos.y }}
        className="w-12 h-12 bg-white rounded-full shadow-lg"
      />
    </div>
  );
};
