import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import clsx from 'clsx';
import ShreyMascot from '../components/ShreyMascot';
import IdentityVerifier from '../components/IdentityVerifier';

const Register = () => {
  const navigate = useNavigate();
  const [gender, setGender] = useState('Boy');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [verificationPhoto, setVerificationPhoto] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationSkipped, setVerificationSkipped] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isAgeConfirmed) return setError('You must confirm you are 18+');
    // if (!isVerified && !verificationSkipped) return setError('Please complete identity verification');
    if (password.length < 6) return setError('Password must be at least 6 characters');

    try {
      setLoading(true);
      setError('');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender, password, isAgeConfirmed, verificationPhoto, isVerified })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      // Navigate to login securely
      navigate('/login', { state: { message: `Your Login ID is: ${data.userId}. Please save it!`, userId: data.userId } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden relative transition-colors duration-300">
      {/* Animated Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-40 dark:opacity-100">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 -right-40 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md p-8 glass-card bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl shadow-2xl m-4"
      >
        <ShreyMascot focusedInput={focusedInput} />
        
        <div className="text-center mb-8 pt-2">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Join <span className="gradient-text">Eros & Psyche</span></h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Anonymous connections await. No real identity needed.</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="flex justify-center space-x-4 mb-6">
            {['Boy', 'Girl'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={clsx(
                  "w-1/2 py-3 rounded-2xl font-semibold transition-all duration-300",
                  gender === g 
                    ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg scale-105"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                )}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex items-center space-x-3 bg-slate-100 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
            <input 
              type="checkbox" 
              id="age"
              checked={isAgeConfirmed}
              onChange={(e) => setIsAgeConfirmed(e.target.checked)}
              className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
            />
            <label htmlFor="age" className="text-sm text-slate-600 dark:text-slate-300 cursor-pointer flex-1">
              I confirm I am 18+ and agree to the anonymous chat rules.
            </label>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl flex items-start space-x-3 mb-6">
             <ShieldAlert className="text-yellow-600 dark:text-yellow-500 mt-1 flex-shrink-0" size={18} />
             <p className="text-xs text-yellow-700 dark:text-yellow-200/80 leading-relaxed">
               Identity check required to proceed as a <b>{gender}</b>. This helps us stop scammers.
             </p>
          </div>

          <IdentityVerifier 
            gender={gender} 
            onVerify={(photoData) => {
               if (photoData) {
                  setVerificationPhoto(photoData);
                  setIsVerified(true);
                  setVerificationSkipped(false);
               } else {
                  setVerificationSkipped(true);
                  setIsVerified(false);
               }
            }} 
          />

          <motion.button 
            whileHover={(isVerified || verificationSkipped) ? { scale: 1.02 } : {}}
            whileTap={(isVerified || verificationSkipped) ? { scale: 0.98 } : {}}
            type="submit"
            disabled={loading || (!isVerified && !verificationSkipped)}
            className={clsx(
              "w-full py-4 rounded-2xl font-bold text-lg transition-all mt-8 shadow-lg",
              (isVerified || verificationSkipped) 
                ? "bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50" 
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50"
            )}
          >
            {loading ? 'Creating Identity...' : 'Generate Anonymous Identity'}
          </motion.button>
        </form>

        <p className="text-center text-slate-500 dark:text-slate-400 mt-6 text-sm">
          Already have an identity? <Link to="/login" className="text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 font-medium">Login here</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
