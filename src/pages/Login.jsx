import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  
  // State untuk form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle antara Login / Register
  const [errorMsg, setErrorMsg] = useState('');

  // --- LOGIKA LOGIN / REGISTER ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        // --- PROSES DAFTAR (REGISTER) ---
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            // Simpan nama awal sebagai metadata
            data: { full_name: email.split('@')[0] }, 
          },
        });
        if (error) throw error;
        alert("Pendaftaran berhasil! Silakan cek email untuk konfirmasi, atau langsung login jika auto-confirm aktif.");
        setIsSignUp(false); // Kembali ke mode login
      } else {
        // --- PROSES MASUK (LOGIN) ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (error) throw error;
        navigate('/'); // Lempar ke Dashboard
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-fade-in-up">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            THE TREASURY
          </h1>
          <p className="text-slate-400 text-sm mt-2 tracking-widest uppercase">
            {isSignUp ? 'Registrasi Personel Baru' : 'Akses Komandan'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-start">
            <AlertCircle size={18} className="mr-2 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        
        {/* FORM */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Input Email */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 ml-1">Email Militer</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder:text-slate-600"
                placeholder="nama@keluarga.com"
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 ml-1">Kode Akses</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          {/* Tombol Aksi */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-900 font-bold py-3 rounded-xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center mt-6"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : isSignUp ? (
              <><UserPlus size={20} className="mr-2" /> DAFTAR AKUN</>
            ) : (
              <><LogIn size={20} className="mr-2" /> MASUK SISTEM</>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            {isSignUp ? "Sudah punya akun?" : "Belum punya akses?"}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="ml-2 text-yellow-500 hover:text-yellow-400 font-bold underline decoration-yellow-500/30 hover:decoration-yellow-500 transition-all"
            >
              {isSignUp ? "Login di sini" : "Daftar sekarang"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;