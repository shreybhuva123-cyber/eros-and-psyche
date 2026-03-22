import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { MascotProvider } from './context/MascotContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatRoom from './pages/ChatRoom';
import IntroScreen from './components/IntroScreen';
import AudioPlayer from './components/AudioPlayer';
import MascotSelector from './components/MascotSelector';
import FloatingIcons from './components/FloatingIcons';
import { Moon, Sun } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const App = () => {
  const { token } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('intro_seen');
  });

  const handleIntroComplete = () => {
    sessionStorage.setItem('intro_seen', 'true');
    setShowIntro(false);
  };

  return (
    <MascotProvider>
      <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300 text-slate-900 dark:text-slate-100 font-sans">
        <AnimatePresence>
          {showIntro && <IntroScreen onComplete={handleIntroComplete} />}
        </AnimatePresence>

        <FloatingIcons />
        <AudioPlayer />

        <button 
          onClick={toggleDark} 
          className="absolute top-4 right-4 p-2.5 rounded-full glass-card bg-white/20 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700 z-50 shadow-sm transition-all backdrop-blur-md border border-slate-500/20"
          title="Toggle Dark Mode"
        >
          {isDark ? <Sun className="text-yellow-400" size={20} /> : <Moon className="text-indigo-600" size={20} />}
        </button>
        
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={!token ? <Login /> : <Navigate to="/chat" />} />
            <Route path="/register" element={!token ? <Register /> : <Navigate to="/chat" />} />
            <Route path="/chat" element={token ? <ChatRoom /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </div>
    </MascotProvider>
  );
};

export default App;
