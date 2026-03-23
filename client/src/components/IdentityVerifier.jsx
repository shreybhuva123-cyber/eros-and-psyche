import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCcw, CheckCircle, ShieldCheck, UserRound, CameraOff, Sparkles, ScanLine, BadgeCheck } from 'lucide-react';

const IdentityVerifier = ({ gender, onVerify }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, streaming, scanning, verified
  const [error, setError] = useState(null);
  const [photo, setPhoto] = useState(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setStatus('streaming');
      setError(null);
    } catch (err) {
      setError('Permission denied. Please enable your camera for gender verification.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setStatus('scanning');
    
    // Simulate AI scanning animation for 3 seconds
    setTimeout(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUrl);
        setStatus('verified');
        onVerify(dataUrl);
        stopCamera();
    }, 3000);
  };

  const reset = () => {
    setPhoto(null);
    setStatus('idle');
    startCamera();
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stream]);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <div className="relative aspect-video rounded-3xl overflow-hidden bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-inner flex items-center justify-center transition-colors duration-300">
        
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div 
               key="idle"
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="flex flex-col items-center gap-4 p-8 text-center"
            >
               <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Camera size={32} />
               </div>
               <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  To prevent scamming, we need a quick identification scan to confirm you are a {gender}.
               </p>
               <div className="flex flex-col gap-2 w-full px-4">
                 <button 
                    type="button"
                    onClick={startCamera}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-lg transition-all"
                 >
                    Verify Now
                 </button>
                 <button 
                    type="button"
                    onClick={() => onVerify(null)} 
                    className="text-slate-400 text-xs hover:text-slate-600 dark:hover:text-slate-200 underline"
                 >
                    Skip for now (No badge)
                 </button>
               </div>
            </motion.div>
          )}

          {status === 'streaming' && (
            <motion.div 
               key="streaming"
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               className="relative w-full h-full"
            >
               <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover mirror"
               />
               <div className="absolute inset-0 pointer-events-none border-[2rem] border-black/30 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-indigo-400/50 rounded-full animate-pulse-slow"></div>
               </div>
               
               <button 
                  type="button"
                  onClick={capturePhoto}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 p-4 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-indigo-500/20"
               >
                  <ScanLine size={32} className="animate-bounce" />
               </button>
            </motion.div>
          )}

          {status === 'scanning' && (
             <motion.div 
                key="scanning"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-50"
             >
                <motion.div 
                   animate={{ 
                      y: [-80, 80, -80],
                   }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                   className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                />
                <div className="flex flex-col items-center gap-4">
                   <div className="w-20 h-20 border-t-4 border-cyan-400 rounded-full animate-spin"></div>
                   <h3 className="font-bold text-lg tracking-widest uppercase text-cyan-400">Analyzing Identity...</h3>
                   <p className="text-white/70 text-xs font-mono">Cross-referencing {gender} identity</p>
                </div>
             </motion.div>
          )}

          {status === 'verified' && (
             <motion.div 
                key="verified"
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="absolute inset-0 bg-emerald-600/10 backdrop-blur-sm flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-500 p-6 text-center z-50 transition-colors duration-300"
             >
                <div className="mb-4">
                   <BadgeCheck size={64} className="drop-shadow-lg text-emerald-600" />
                </div>
                <h3 className="font-black text-2xl mb-1 tracking-tight">Access Granted</h3>
                <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">Verification Successful for this {gender}.</p>
                <button 
                  type="button"
                  onClick={reset}
                  className="mt-6 text-slate-500 text-xs hover:text-slate-800 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
                >
                  <RefreshCcw size={12} /> Retake
                </button>
             </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="absolute inset-0 bg-rose-50 dark:bg-rose-900/20 flex flex-col items-center justify-center p-6 text-center text-rose-600 z-50 transition-colors duration-300">
             <CameraOff size={48} className="mb-4 opacity-40" />
             <p className="text-sm font-bold">{error}</p>
             <button type="button" onClick={reset} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">Try Again</button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 p-3 rounded-2xl flex items-start gap-3 transition-colors duration-300">
         <ShieldCheck className="text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" size={18} />
         <div className="text-[0.7rem] text-indigo-700 dark:text-indigo-300/80 leading-relaxed italic">
            "Your photo is securely processed to verify your role. It is not shared with anyone."
         </div>
      </div>
    </div>
  );
};

export default IdentityVerifier;
