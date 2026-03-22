import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ShreyMascot = ({ focusedInput, isGlobal }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // mapping mouse from -1 (left/top) to +1 (right/bottom)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isPassword = focusedInput === 'password';
  const isId = focusedInput === 'userId';

  // Math calculated bounds to keep the exact pupils inside the eyes
  // When looking at the ID or Password box, we lock the eyes down or middle.
  // Otherwise, it dynamically tracks the exact mouse coordinates!
  const eyeOffsetX = isId ? 0 : isPassword ? 0 : mousePos.x * 12;
  const eyeOffsetY = isId ? 15 : isPassword ? -5 : mousePos.y * 12;

  // The actual 2D hands overlapping the eyes
  const leftHandVars = {
    idle: { x: -35, y: 35, rotate: -30, scale: 1 },
    password: { x: -10, y: -25, rotate: 10, scale: 1.1 }
  };
  
  const rightHandVars = {
    idle: { x: 35, y: 35, rotate: 30, scale: 1 },
    password: { x: 10, y: -25, rotate: -10, scale: 1.1 }
  };

  const handleMascotClick = (e) => {
    e.stopPropagation();
    setClicked(true);
    setTimeout(() => setClicked(false), 4000);
  };

  return (
    <div 
       className={`relative z-40 ${isGlobal ? 'fixed bottom-8 left-8 w-48 h-48 drop-shadow-2xl' : 'w-[14rem] h-[14rem] mx-auto -mt-6 mb-4 cursor-pointer hover:scale-105 transition-transform'}`} 
       onClick={handleMascotClick}
    >
      
      {/* Dynamic Popups Exactly as requested */}
      {isPassword && !clicked && (
         <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="absolute top-2 -right-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold py-2.5 px-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 whitespace-nowrap pointer-events-none"
         >
           ahh i'm just kidding 👀
           <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white dark:bg-slate-800 rotate-45 border-r border-b border-slate-200 dark:border-slate-700"></div>
         </motion.div>
      )}

      {clicked && (
         <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="absolute -top-4 -right-16 bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-sm font-black py-3 px-5 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.6)] z-50 whitespace-nowrap pointer-events-none"
         >
           heya i'm your matchmaker!!! ✨
           <div className="absolute -bottom-2 left-8 w-4 h-4 bg-pink-500 rotate-45 border-r border-b border-white/20"></div>
         </motion.div>
      )}

      {/* Floating SVG Body container */}
      <motion.div 
         animate={{ y: isGlobal ? [0, -15, 0] : 0 }} 
         transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
         className="w-full h-full relative"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl overflow-visible">
          {/* Main White Smooth Blob Body */}
          <motion.path 
            d="M 100, 20 C 170, 20 190, 80 190, 140 C 190, 190 140, 190 100, 190 C 60, 190 10, 190 10, 140 C 10, 80 30, 20 100, 20 Z" 
            fill="#ffffff"
            className="shadow-inner"
          />
          
          {/* Rosy Cheeks */}
          <ellipse cx="55" cy="115" rx="14" ry="7" fill="#ffb6c1" opacity="0.8"/>
          <ellipse cx="145" cy="115" rx="14" ry="7" fill="#ffb6c1" opacity="0.8"/>

          {/* Left Eye Base */}
          <g>
             <circle cx="70" cy="95" r="16" fill="#1e293b"/>
             {/* Left Pupil Tracking Mouse */}
             <motion.circle 
               cx="70" cy="95" r="5" fill="#ffffff"
               animate={{ x: eyeOffsetX, y: eyeOffsetY }}
               transition={{ type: "spring", stiffness: 400, damping: 25 }}
             />
          </g>
          
          {/* Right Eye Base */}
          <g>
             <circle cx="130" cy="95" r="16" fill="#1e293b"/>
             {/* Right Pupil Tracking Mouse */}
             <motion.circle 
               cx="130" cy="95" r="5" fill="#ffffff"
               animate={{ x: eyeOffsetX, y: eyeOffsetY }}
               transition={{ type: "spring", stiffness: 400, damping: 25 }}
             />
          </g>

          {/* Happy Mouth */}
          <path d="M 90 120 Q 100 135 110 120" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="transparent"/>

          {/* Left Hand / Arm */}
          <motion.g
            variants={leftHandVars}
            initial="idle"
            animate={isPassword ? "password" : "idle"}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
          >
             {/* Hand Shadow */}
             <ellipse cx="65" cy="140" rx="18" ry="26" fill="rgba(0,0,0,0.1)"/>
             {/* Actual Hand */}
             <ellipse cx="63" cy="138" rx="18" ry="26" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2.5"/>
          </motion.g>

          {/* Right Hand / Arm */}
          <motion.g
            variants={rightHandVars}
            initial="idle"
            animate={isPassword ? "password" : "idle"}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
          >
             {/* Hand Shadow */}
             <ellipse cx="135" cy="140" rx="18" ry="26" fill="rgba(0,0,0,0.1)"/>
             {/* Actual Hand */}
             <ellipse cx="137" cy="138" rx="18" ry="26" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2.5"/>
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
};

export default ShreyMascot;
