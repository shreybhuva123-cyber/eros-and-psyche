import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const IntroScreen = ({ onComplete }) => {
  useEffect(() => {
    const t = setTimeout(() => {
      onComplete();
    }, 3500); // 3.5s intro animation
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div 
       initial={{ opacity: 1 }}
       exit={{ opacity: 0, filter: "blur(10px)" }}
       transition={{ duration: 1 }}
       className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center overflow-hidden"
    >
        {/* Floating background heart symbols */}
        <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-wrap justify-between content-between p-10">
           {Array.from({length: 8}).map((_,i) => (
             <motion.div 
               key={i} 
               animate={{ y: [0, -20, 0], opacity: [0.2, 0.8, 0.2] }} 
               transition={{ duration: 2+Math.random()*2, repeat: Infinity }}
               className="text-pink-500 text-6xl"
             >
                ♥
             </motion.div>
           ))}
        </div>

        <motion.div 
           initial={{ scale: 0.5, opacity: 0, y: 50 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           transition={{ type: "spring", stiffness: 100, damping: 10 }}
           className="z-10 text-center flex flex-col items-center"
        >
            <div className="w-32 h-32 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-[2rem] rotate-12 mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(236,72,153,0.5)]">
               <motion.div 
                 animate={{ rotate: -12 }}
                 className="text-white font-extrabold text-5xl"
               >
                 E&P
               </motion.div>
            </div>
            <motion.h1 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.5, duration: 1 }}
               className="text-white text-5xl font-black mb-4 tracking-tight"
            >
               Hey there...
            </motion.h1>
            <motion.p 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 1.5, duration: 1.5 }}
               className="text-pink-400 text-xl font-bold bg-white/10 px-6 py-2 rounded-full border border-pink-500/30 shadow-inner"
            >
               welcome to the site ✨
            </motion.p>
        </motion.div>
    </motion.div>
  );
};

export default IntroScreen;
