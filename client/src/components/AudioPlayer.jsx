import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef(null);

  useEffect(() => {
    // We create a new audio object
    audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    // We can't auto-play without user interaction usually, so we'll wait for them to click it or try to play
    audioRef.current.play().then(() => {
       setIsPlaying(true);
    }).catch(() => {
       setIsPlaying(false);
    });

    return () => {
      audioRef.current.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
       audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-3 rounded-full shadow-2xl transition-all group hover:bg-slate-800/90">
      <button 
        onClick={togglePlay}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
      >
        {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
      
      <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300 flex items-center pr-2">
         <input 
           type="range" 
           min="0" 
           max="1" 
           step="0.01" 
           value={volume} 
           onChange={(e) => setVolume(parseFloat(e.target.value))}
           className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
         />
      </div>
      <Music className={`text-pink-500/50 absolute -top-4 -left-2 ${isPlaying ? 'animate-bounce' : 'hidden'}`} size={16} />
    </div>
  );
};

export default AudioPlayer;
