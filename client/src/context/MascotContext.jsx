import React, { createContext, useContext, useState, useEffect } from 'react';

const MascotContext = createContext();

export const MascotProvider = ({ children }) => {
  const [mascots] = useState([
    { id: 'none', name: '⛔ No Character', file: null },
    { id: 'mahiro', name: '✨ Mahiro', file: '/model.glb' },
    { id: 'custom1', name: '💖 Character 2', file: '/model12.glb' }, 
    { id: 'custom2', name: '🌟 Character 3', file: '/model13.glb' }
  ]);

  const [activeMascotId, setActiveMascotId] = useState(() => {
    return localStorage.getItem('activeMascot') || 'mahiro';
  });

  useEffect(() => {
    localStorage.setItem('activeMascot', activeMascotId);
  }, [activeMascotId]);

  const activeMascot = mascots.find(m => m.id === activeMascotId) || mascots[0];

  return (
    <MascotContext.Provider value={{ mascots, activeMascotId, setActiveMascotId, activeMascot }}>
      {children}
    </MascotContext.Provider>
  );
};

export const useMascot = () => useContext(MascotContext);
