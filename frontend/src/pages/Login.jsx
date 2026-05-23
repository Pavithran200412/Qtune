import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Disc, Lock, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const { login, register, error, setError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let success;
      if (isRegister) {
        success = await register(username, email, password);
      } else {
        success = await login(email, password);
      }

      if (success) {
        navigate('/');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0f19] px-4 relative overflow-hidden">
      
      {/* Ambient background glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-purple-600/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-pink-600/10 rounded-full filter blur-[90px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl border-purple-500/10 shadow-[0_0_50px_rgba(147,51,234,0.08)] space-y-6 z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-purple-500/15 p-3 rounded-2xl border border-purple-500/20 shadow-inner">
            <Disc className="w-8 h-8 text-purple-400 animate-spin-slow" />
          </div>
          <h2 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mt-1">
            Qtune
          </h2>
          <p className="text-xs text-slate-400">
            {isRegister ? 'Compile your personal sonic node profile' : 'Reconnect to your acoustic frequencies'}
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Display server error feedback */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          )}

          {isRegister && (
            <div className="space-y-1 text-xs">
              <label className="text-slate-400 font-semibold pl-1">Username</label>
              <div className="relative flex items-center bg-slate-900 border border-white/5 focus-within:border-purple-500 rounded-xl px-3 transition-colors">
                <User className="w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. soundmaster"
                  className="flex-1 bg-transparent px-3 py-3 text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1 text-xs">
            <label className="text-slate-400 font-semibold pl-1">Email Address</label>
            <div className="relative flex items-center bg-slate-900 border border-white/5 focus-within:border-purple-500 rounded-xl px-3 transition-colors">
              <Mail className="w-4.5 h-4.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent px-3 py-3 text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-slate-400 font-semibold pl-1">Password</label>
            <div className="relative flex items-center bg-slate-900 border border-white/5 focus-within:border-purple-500 rounded-xl px-3 transition-colors">
              <Lock className="w-4.5 h-4.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent px-3 py-3 text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4.5 h-4.5" />
            <span>{loading ? 'Processing...' : isRegister ? 'Register Sonic Node' : 'Initialize Session'}</span>
          </button>
        </form>

        {/* Toggle sign in / sign up link row */}
        <div className="text-center pt-2 text-[11px] text-slate-400">
          <span>{isRegister ? 'Already registered a profile?' : 'New to Qtune?'} </span>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-purple-400 font-semibold hover:underline bg-transparent border-0 cursor-pointer"
          >
            {isRegister ? 'Sign In Instead' : 'Create an Account'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
