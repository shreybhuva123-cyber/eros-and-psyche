import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ShreyMascot from '../components/ShreyMascot';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [userId, setUserId] = useState(location.state?.userId || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId || !password) return setError('Both fields are required');

    try {
      setLoading(true);
      setError('');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      // Store token securely or use context
      // Note: Backend sets httpOnly cookie, which is used for requests
      login({ userId: data.userId, gender: data.gender }, data.token);
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden relative transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-40 dark:opacity-100">
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-pink-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="z-10 w-full max-w-md p-8 glass-card bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl m-4"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-2xl rotate-12 mb-[1rem] flex items-center justify-center shadow-lg hidden">
             <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg -rotate-12"></div>
          </div>
          <ShreyMascot focusedInput={focusedInput} />
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 pt-2">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Enter your anonymous ID to connect</p>
        </div>

        <AnimatePresence>
          {location.state?.message && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-4 rounded-2xl mb-6 text-center shadow-[0_0_15px_rgba(16,185,129,0.1)] font-medium"
            >
              {location.state.message}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-2xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <input 
              type="text"
              placeholder="Your ID (e.g. Eros_12345)"
              value={userId}
              onFocus={() => setFocusedInput('userId')}
              onBlur={() => setFocusedInput(null)}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all disabled:opacity-50 mt-6"
          >
            {loading ? 'Entering...' : 'Start Chatting'}
          </motion.button>
        </form>

        <p className="text-center text-slate-400 mt-8 text-sm">
          New here? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Create Identity</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
