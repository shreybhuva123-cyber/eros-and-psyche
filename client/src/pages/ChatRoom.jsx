import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, XCircle, RotateCcw, AlertTriangle, ShieldAlert, X, Users, UserRound, Sparkles, Timer, MessageCircleHeart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ShreyMascot from '../components/ShreyMascot';
import clsx from 'clsx';

const playInteractionSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'message') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'match') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1); // C#
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2); // E
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (err) {}
};

const ChatRoom = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const { logout, user, token } = useAuth();
  
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, searching, animating_match, matched
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [partnerDetails, setPartnerDetails] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const animationTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey && e.shiftKey && ['3', '4', '5', 's', 'S'].includes(e.key)) || (e.ctrlKey && e.shiftKey && ['s', 'S'].includes(e.key))) {
        if (socket && status === 'matched') socket.emit('screenshot_taken');
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        if (socket && status === 'matched') socket.emit('screenshot_taken');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [socket, status]);

  useEffect(() => {
    let timer;
    if (status === 'matched' && timeLeft > 0) {
       timer = setInterval(() => {
          setTimeLeft((prev) => prev - 1);
       }, 1000);
    } else if (status !== 'matched') {
       setTimeLeft(600);
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (!token) return;
    
    const newSocket = io(apiUrl, {
       withCredentials: true,
       auth: { token }
    });

    setSocket(newSocket);

    newSocket.on('connect_error', (err) => {
       console.error("Socket error", err);
       if (err.message === 'Authentication error' || err.message === 'jwt malformed') {
          logout();
          navigate('/login');
       }
    });

    newSocket.on('online_count', (count) => setOnlineCount(count));

    newSocket.on('waiting_for_match', () => {
      setStatus('searching');
      setMessages([]);
      setPartnerDetails(null);
    });

    newSocket.on('match_found', (data) => {
      setStatus('animating_match');
      playInteractionSound('match');
      
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        setStatus('matched');
        setTimeLeft(600);
        setMessages([
          { system: true, text: 'You are now connected. Say Hi!' },
          { system: true, isIcebreaker: true, text: `🧊 Icebreaker: ${data.icebreaker}` }
        ]);
      }, 3500);
    });

    newSocket.on('match_details', (data) => setPartnerDetails(data));

    newSocket.on('receive_message', (msg) => {
      playInteractionSound('message');
      setMessages((prev) => [...prev, { ...msg, isPartner: true }]);
    });

    newSocket.on('screenshot_alert', (data) => {
      playInteractionSound('message');
      setMessages((prev) => [...prev, { system: true, isAlert: true, text: data.message }]);
    });

    newSocket.on('partner_typing', (data) => setIsTyping(data.isTyping));

    newSocket.on('time_up', () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      setStatus('idle');
      setMessages([]);
      setPartnerDetails(null);
      alert('Time is up! The 10-minute ephemeral session has ended. Rejoin the queue to meet someone new.');
    });

    newSocket.on('partner_disconnected', () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      setStatus('idle');
      setMessages((prev) => [...prev, { system: true, text: 'Partner disconnected.' }]);
      setPartnerDetails(null);
    });

    return () => {
       newSocket.close();
       if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, [logout, navigate, token]);

  useEffect(scrollToBottom, [messages, isTyping]);

  const joinQueue = () => {
    if (!socket) return;
    socket.emit('join_queue');
    setStatus('searching');
  };

  const endChat = () => {
    socket.emit('end_chat');
    setStatus('idle');
    setMessages((prev) => [...prev, { system: true, text: 'You left the chat.' }]);
    setPartnerDetails(null);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || status !== 'matched') return;
    
    socket.emit('send_message', { text: input });
    setMessages((prev) => [...prev, { text: input, isPartner: false, sender: 'You' }]);
    setInput('');
    socket.emit('stop_typing');
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (status !== 'matched') return;
    socket.emit('typing');
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing');
    }, 2000);
  };

  const handleReport = async () => {
    socket.emit('get_partner_id_for_report', async (data) => {
       if(data && data.reportedUserId) {
         try {
           await fetch(`${apiUrl}/api/reports/report`, {
             method: 'POST',
             headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}` 
             },
             body: JSON.stringify(data)
           });
           alert('User reported successfully.');
           setShowReport(false);
           endChat();
         } catch(e) {}
       }
    });
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, { 
         method: 'POST',
         headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 overflow-hidden font-sans relative text-slate-200">
      <ShreyMascot isGlobal={true} />
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="h-16 shrink-0 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6 shadow-sm z-20">
        <div className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center gap-2">
          <Sparkles className="text-pink-400" size={24} /> Eros & Psyche
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700/50">
             <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
             </span>
             <span className="text-sm font-semibold tracking-wide text-slate-300">
                {onlineCount} Online
             </span>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 font-medium transition-colors text-sm flex items-center gap-1">
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative flex flex-col items-center justify-center p-4 z-10">
        
        <AnimatePresence>
          {status === 'idle' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -50 }}
              className="flex flex-col items-center max-w-lg w-full z-10"
            >
              <div className="relative mb-10 w-48 h-48 flex items-center justify-center">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-pink-500/20 rounded-full blur-2xl animate-pulse"></div>
                 <div className="absolute inset-4 border-2 border-indigo-500/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
                 <div className="absolute inset-8 border-2 border-dashed border-pink-500/40 rounded-full animate-[spin_12s_linear_infinite_reverse]"></div>
                 <Users className="text-white w-16 h-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
              </div>
              
              <h2 className="text-4xl font-black mb-4 text-center text-white tracking-tight">Ready for a new connection?</h2>
              <p className="text-slate-400 mb-10 text-center text-lg max-w-sm">Tap the button below to randomly pair with someone from the opposite gender instantly.</p>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={joinQueue}
                className="w-full max-w-xs py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-bold text-xl shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:shadow-[0_0_60px_rgba(236,72,153,0.6)] transition-all flex items-center justify-center gap-3"
              >
                <Sparkles size={24} /> Match Now
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(status === 'searching' || status === 'animating_match') && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              className="flex flex-col items-center w-full max-w-2xl z-20 space-y-12"
            >
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400 text-center">
                {status === 'searching' ? 'Searching the crowds...' : 'Locking in connection!'}
              </h2>
              
              <div className="flex items-center justify-center gap-8 md:gap-16 w-full">
                 <div className="flex flex-col items-center gap-4">
                    <motion.div 
                       initial={{ x: -50, opacity: 0 }}
                       animate={{ x: 0, opacity: 1 }}
                       className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-800 border-2 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.3)] flex items-center justify-center relative overflow-hidden"
                    >
                       <UserRound className="text-indigo-400 w-12 h-12 md:w-16 md:h-16" />
                       <div className="absolute bottom-0 w-full h-1 bg-indigo-500"></div>
                    </motion.div>
                    <span className="font-bold text-indigo-300">YOU</span>
                 </div>
                 
                 <div className="relative flex items-center justify-center">
                    <motion.div 
                      animate={{ 
                         rotate: status === 'animating_match' ? [0, 360, 720, 1080] : [0, 360],
                         scale: status === 'animating_match' ? [1, 1.5, 1] : 1
                      }}
                      transition={{ 
                         duration: status === 'animating_match' ? 1.5 : 3, 
                         repeat: status === 'searching' ? Infinity : 0,
                         ease: "linear"
                      }}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center relative"
                    >
                       <ZapIcon className={clsx("w-8 h-8", status === 'animating_match' ? "text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,1)] animate-pulse" : "text-slate-500")} />
                    </motion.div>
                 </div>
                 
                 <div className="flex flex-col items-center gap-4">
                    <motion.div 
                       className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-800 border-2 shadow-[0_0_30px_rgba(236,72,153,0.3)] flex items-center justify-center relative overflow-hidden"
                       animate={{ borderColor: status === 'animating_match' ? 'rgba(236,72,153,1)' : 'rgba(236,72,153,0.2)' }}
                    >
                       <AnimatePresence mode="wait">
                          {status === 'searching' && (
                             <motion.div 
                               key="searching"
                               initial={{ y: 50, opacity: 0 }}
                               animate={{ y: [-50, 0, 50], opacity: [0, 1, 0] }}
                               transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }}
                               className="absolute inset-0 flex items-center justify-center"
                             >
                               <UserRound className="text-slate-500 w-12 h-12 md:w-16 md:h-16" />
                             </motion.div>
                          )}
                          {status === 'animating_match' && (
                             <motion.div 
                               key="found"
                               initial={{ scale: 3, opacity: 0, rotate: 180 }}
                               animate={{ scale: 1, opacity: 1, rotate: 0 }}
                               transition={{ type: "spring", stiffness: 100, damping: 10 }}
                               className="absolute inset-0 bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center"
                             >
                               <UserRound className="text-white w-12 h-12 md:w-16 md:h-16 drop-shadow-md" />
                             </motion.div>
                          )}
                       </AnimatePresence>
                    </motion.div>
                    <span className="font-bold text-pink-300">
                      {status === 'searching' ? '...???' : partnerDetails?.partnerName || 'MATCHED!'}
                    </span>
                 </div>
              </div>
              
              {status === 'searching' && (
                <button 
                  onClick={endChat}
                  className="mt-8 px-6 py-2 rounded-full border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel Search
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {status === 'matched' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-full max-w-5xl h-full flex flex-col bg-slate-900 md:rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 overflow-hidden relative z-30"
            >
              <div className="bg-slate-800/80 backdrop-blur pb-3 pt-4 px-6 border-b border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                         <UserRound className="text-white w-6 h-6" />
                      </div>
                      <div>
                         <h3 className="font-bold text-slate-100 text-lg leading-tight">{partnerDetails?.partnerName || 'Unknown'}</h3>
                         <p className="text-xs text-emerald-400 font-medium tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse"></span> Identity Secured
                         </p>
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3 w-full justify-between md:w-auto md:justify-end">
                    {/* Ephemeral Timer Bar */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-full border border-slate-700/50">
                       <Timer size={16} className={clsx("transition-colors", timeLeft < 60 ? "text-red-500 animate-pulse" : "text-indigo-400")} />
                       <span className={clsx("font-mono font-bold tracking-wider", timeLeft < 60 ? "text-red-400" : "text-indigo-200")}>
                         {formatTime(timeLeft)}
                       </span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowReport(true)}
                        className="p-2.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
                        title="Report & Block"
                      >
                        <ShieldAlert size={18} />
                      </button>
                      <button 
                        onClick={joinQueue}
                        className="p-2.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all"
                        title="Next Match"
                      >
                        <RotateCcw size={18} />
                      </button>
                      <button 
                        onClick={endChat}
                        className="p-2.5 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                        title="Leave Chat"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {messages.map((m, i) => (
                  <div key={i} className={clsx("flex flex-col w-full", m.system ? "items-center" : m.isPartner ? "items-start" : "items-end")}>
                    {m.system ? (
                      m.isIcebreaker ? (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }} 
                          className="px-6 py-4 bg-gradient-to-r from-indigo-500/10 to-pink-500/10 border border-indigo-500/30 text-indigo-200 rounded-3xl my-6 flex items-start gap-3 max-w-lg shadow-md"
                        >
                          <MessageCircleHeart className="text-pink-400 shrink-0" size={24} />
                          <div>
                            <p className="font-bold text-sm text-pink-300 mb-1 leading-tight uppercase tracking-wider">Icebreaker</p>
                            <p className="text-sm font-medium">{m.text.replace('🧊 Icebreaker: ', '')}</p>
                          </div>
                        </motion.div>
                      ) : m.isAlert ? (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }} 
                          className="px-6 py-3 bg-red-600/20 border border-red-500/50 text-red-200 rounded-2xl my-6 flex items-center gap-3 max-w-lg shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                        >
                          <AlertTriangle className="text-red-500 shrink-0" size={24} />
                          <p className="font-bold text-sm tracking-wide">{m.text}</p>
                        </motion.div>
                      ) : (
                        <span className="px-5 py-2 bg-slate-800 text-slate-400 text-xs rounded-full font-semibold border border-slate-700/50 my-4 shadow-inner tracking-wide">
                          {m.text}
                        </span>
                      )
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10, originX: m.isPartner ? 0 : 1 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className={clsx(
                          "max-w-[75%] px-5 py-3.5 rounded-3xl shadow-md relative group text-sm md:text-base",
                          m.isPartner 
                            ? "bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/50"
                            : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm shadow-indigo-500/20"
                        )}
                      >
                        <p className="leading-relaxed drop-shadow-sm">{m.text}</p>
                      </motion.div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start"
                  >
                    <div className="bg-slate-800 border border-slate-700/50 px-5 py-4 rounded-3xl rounded-tl-sm flex space-x-2 items-center shadow-md">
                       <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></span>
                       <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                       <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-end gap-3 backdrop-blur-md">
                <form onSubmit={handleSend} className="flex-1 flex items-center bg-slate-800 rounded-full border border-slate-700 shadow-inner px-2 py-1.5 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                  <input 
                    type="text"
                    value={input}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent px-4 py-2 outline-none text-slate-100 placeholder:text-slate-500 text-base"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2.5 rounded-full transition-colors shadow-lg active:scale-95 flex-shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border border-slate-700"
            >
              <div className="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 mx-auto border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                <ShieldAlert size={36} />
              </div>
              <h3 className="text-2xl font-bold text-center mb-3 text-white">Report User</h3>
              <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed">
                If this user is violating guidelines, confirm the report below. They will be blocked instantly.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowReport(false)}
                  className="flex-1 py-3.5 rounded-xl font-medium text-slate-300 hover:bg-slate-700 transition-colors border border-slate-600"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReport}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold shadow-lg shadow-rose-500/30 transition-colors border border-transparent"
                >
                  Report now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ZapIcon = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export default ChatRoom;
