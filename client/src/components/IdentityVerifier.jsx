import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCcw, CheckCircle, ShieldCheck, UserRound, CameraOff, Sparkles, ScanLine, BadgeCheck } from 'lucide-react';

const IdentityVerifier = ({ gender, onVerify }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, streaming, scanning, verified
  const [error, setError] = useState(null);
  const [photo, setPhoto] = useState(null);

  const loadModels = async () => {
    setStatus('loading');
    try {
      // Use the officially mirrored NPM package for models for maximum reliability
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      
      // Load only the essential models needed for gender detection
      console.log("Loading AI Models...");
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await window.faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
      
      console.log("AI Models Loaded Successfully");
      startCamera();
    } catch (err) {
      console.error("Critical Face-API Error:", err);
      setError('AI System could not reach the secure identity models. Please refresh your browser or check your connection.');
      setStatus('idle');
    }
  };

  const startCamera = async () => {
    if (!window.faceapi) {
        setError("AI Library not loaded correctly. Refreshing may help.");
        return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setStatus('streaming');
      setError(null);
    } catch (err) {
      setError('Camera access denied. Please enable your camera for gender verification.');
      setStatus('idle');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !window.faceapi) return;
    
    // CAPTURE BLOBS
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    setStatus('scanning');
    
    try {
        // REAL-TIME AI ANALYSIS WHILE VIDEO RUNS
        const detection = await window.faceapi.detectSingleFace(
            video, 
            new window.faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withAgeAndGender();

        if (detection) {
            const detectedGender = detection.gender;
            const confidence = detection.genderProbability;
            
            const isMatch = (gender === 'Boy' && detectedGender === 'male') || 
                          (gender === 'Girl' && detectedGender === 'female');

            if (isMatch && confidence > 0.6) {
                setTimeout(() => {
                    setPhoto(dataUrl);
                    setStatus('verified');
                    onVerify(dataUrl);
                    stopCamera();
                }, 2000); // 2 second scan animation
            } else {
                throw new Error(`Identity mismatch. System detected a different gender than ${gender}.`);
            }
        } else {
            throw new Error('No face detected. Please look directly at the camera in good lighting.');
        }
    } catch (err) {
        setError(err.message || 'AI Verification failed. Please reset and try again.');
        setStatus('idle');
        stopCamera();
    }
  };

  const reset = () => {
    stopCamera();
    setError(null);
    setStatus('idle');
  };

  useEffect(() => {
    if (stream && videoRef.current && (status === 'streaming' || status === 'scanning')) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Playback failed:", e));
    }
  }, [stream, status]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border-2 border-indigo-500/30 dark:border-slate-800 shadow-2xl flex items-center justify-center transition-all duration-500">
        
        {/* VIDEO PREVIEW - Always visible if streaming/scanning */}
        {(status === 'streaming' || status === 'scanning') && (
           <div className="absolute inset-0 w-full h-full bg-black">
               <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  onLoadedMetadata={(e) => e.target.play()}
                  className="w-full h-full object-cover mirror"
               />
               <div className="absolute inset-0 pointer-events-none border-[1.5rem] md:border-[3rem] border-black/40 flex items-center justify-center">
                  <div className={clsx(
                    "w-32 h-32 md:w-48 md:h-48 border-2 border-dashed rounded-full transition-colors duration-500",
                    status === 'scanning' ? "border-cyan-400 animate-pulse" : "border-indigo-400/50 animate-pulse-slow"
                  )}></div>
               </div>
           </div>
        )}

        <AnimatePresence mode="wait">
          {status === 'loading' && (
             <motion.div 
                key="loading"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-4 p-8 text-center z-50"
             >
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div>
                   <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      Preparing AI Brain
                   </p>
                   <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">Identity models arriving...</p>
                </div>
             </motion.div>
          )}

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
               <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  To keep the community safe, please complete a quick 3D identitity scan as a <span className="text-indigo-600 font-bold">{gender}</span>.
               </p>
               <div className="flex flex-col gap-3 w-full px-4">
                 <button 
                    type="button"
                    onClick={loadModels}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-sm"
                 >
                    Begin Live Scan
                 </button>
                 <button 
                    type="button"
                    onClick={() => onVerify(null)} 
                    className="text-slate-500 text-[10px] hover:text-indigo-600 transition-colors uppercase tracking-widest font-bold"
                 >
                    Skip & Lose Verified Badge
                 </button>
               </div>
            </motion.div>
          )}

          {status === 'streaming' && (
            <motion.div 
               key="streaming"
               exit={{ opacity: 0 }}
               className="absolute inset-0 z-10 pointer-events-none"
            >
               <button 
                  type="button"
                  onClick={capturePhoto}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 p-5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-full shadow-2xl hover:scale-110 active:scale-90 pointer-events-auto transition-all border-4 border-indigo-500/10"
               >
                  <ScanLine size={32} />
               </button>
            </motion.div>
          )}

          {status === 'scanning' && (
             <motion.div 
                key="scanning"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 bg-transparent flex flex-col items-center justify-center text-white z-50 pointer-events-none"
             >
                <div className="absolute inset-0 bg-indigo-900/10 backdrop-blur-[2px]"></div>
                <motion.div 
                   animate={{ 
                      y: [-120, 120, -120],
                   }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                   className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] z-50"
                />
                <div className="flex flex-col items-center gap-2 z-50">
                   <h3 className="font-black text-xl tracking-[0.3em] uppercase text-cyan-400 drop-shadow-md">Scanning...</h3>
                   <div className="px-4 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/20">
                      <p className="text-[10px] font-mono uppercase tracking-widest leading-none">Classifying {gender}</p>
                   </div>
                </div>
             </motion.div>
          )}

          {status === 'verified' && (
             <motion.div 
                key="verified"
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="absolute inset-0 bg-emerald-600/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center z-50 transition-all duration-300"
             >
                <div className="mb-4">
                   <BadgeCheck size={80} className="drop-shadow-2xl animate-bounce-slow" />
                </div>
                <h3 className="font-black text-3xl mb-1 tracking-tighter">Verified</h3>
                <p className="text-white/80 text-sm font-medium">Digital identity token secured.</p>
                <button 
                  type="button"
                  onClick={reset}
                  className="mt-8 text-white/60 text-[10px] hover:text-white transition-colors flex items-center gap-1 font-bold uppercase tracking-widest"
                >
                  <RefreshCcw size={12} /> Reset System
                </button>
             </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="absolute inset-0 bg-rose-600/95 flex flex-col items-center justify-center p-8 text-center text-white z-[60] backdrop-blur-md">
             <CameraOff size={48} className="mb-4 text-white/40" />
             <div className="space-y-4">
                <p className="text-sm font-black leading-tight tracking-tight uppercase">{error}</p>
                <button 
                  type="button" 
                  onClick={reset} 
                  className="px-6 py-2.5 bg-white text-rose-600 rounded-full text-xs font-black shadow-lg active:scale-95 transition-all"
                >
                   Try Scan Again
                </button>
             </div>
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
