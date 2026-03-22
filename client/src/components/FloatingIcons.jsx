import React from 'react';
import { motion } from 'framer-motion';

const FloatingIcons = () => {
  const icons = Array.from({ length: 15 });

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {icons.map((_, i) => {
        const size = Math.random() * 20 + 10;
        const left = Math.random() * 100;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 10;

        return (
          <motion.div
            key={i}
            initial={{ y: '100vh', opacity: 0, x: `${left}vw` }}
            animate={{ 
               y: '-10vh', 
               opacity: [0, 0.5, 0],
               x: [`${left}vw`, `${left + (Math.random() * 10 - 5)}vw`]
            }}
            transition={{ 
               duration: duration, 
               repeat: Infinity, 
               delay: delay,
               ease: "linear"
            }}
            className="absolute text-pink-500/30"
            style={{ width: size, height: size }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
               <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FloatingIcons;
