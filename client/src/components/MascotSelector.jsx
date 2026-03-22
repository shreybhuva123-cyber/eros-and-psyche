import React, { useState, useRef, useEffect } from 'react';
import { useMascot } from '../context/MascotContext';
import { UserRoundCheck, ChevronDown } from 'lucide-react';

const MascotSelector = () => {
   const { mascots, activeMascotId, setActiveMascotId } = useMascot();
   const [isOpen, setIsOpen] = useState(false);
   const dropdownRef = useRef(null);

   // Close dropdown when clicking outside
   useEffect(() => {
     const handleClickOutside = (event) => {
       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
         setIsOpen(false);
       }
     };
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   return (
     <div className="fixed top-20 right-4 z-50" ref={dropdownRef}>
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className={`p-2.5 rounded-full flex items-center gap-2 outline-none backdrop-blur-xl border shadow-lg transition-all ${
           isOpen 
             ? 'bg-pink-500 text-white border-pink-400' 
             : 'bg-white/20 dark:bg-slate-800/80 text-pink-400 border-pink-500/20 hover:text-white hover:bg-pink-500'
         }`}
       >
         <UserRoundCheck size={20} />
       </button>
       
       <div className={`absolute right-0 mt-3 w-48 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-2xl transition-all duration-300 origin-top-right overflow-hidden flex flex-col ${
          isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
       }`}>
          <div className="p-3 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-800/20">
             <span className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest px-1">Mascot</span>
          </div>
          <div className="p-2 flex flex-col gap-1">
             {mascots.map(m => (
                <button 
                  key={m.id} 
                  onClick={() => { setActiveMascotId(m.id); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all ${
                     activeMascotId === m.id 
                       ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold shadow-md shadow-pink-500/20' 
                       : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  {m.name}
                </button>
             ))}
          </div>
       </div>
     </div>
   );
};

export default MascotSelector;
