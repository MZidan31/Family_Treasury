import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldCheck, Loader2, Lock, Mail } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Ganti ke SignInWithPassword
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (error) {
      alert("Login Gagal: " + error.message);
    } 
    // Jika sukses, session otomatis terupdate di App.jsx
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-center p-6">
      <div className="w-full max-w-sm bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="mb-6 flex justify-center relative">
          <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 rounded-full"></div>
          <ShieldCheck size={56} className="text-yellow-500 relative z-10" />
        </div>
        
        <h1 className="text-2xl font-black text-white mb-1">LOGIN AKSES</h1>
        <p className="text-slate-400 mb-6 text-xs uppercase tracking-widest">The Treasury Family ERP</p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="text-xs text-slate-500 font-bold ml-1 mb-1 block">EMAIL</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3.5 text-slate-500"/>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500 transition-all"
                type="email"
                placeholder="email@keluarga.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-slate-500 font-bold ml-1 mb-1 block">PASSWORD</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-slate-500"/>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500 transition-all"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-xl transition-all active:scale-95 flex justify-center items-center shadow-lg shadow-yellow-500/20 mt-4"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Buka Brankas'}
          </button>
        </form>
      </div>
    </div>
  );
}