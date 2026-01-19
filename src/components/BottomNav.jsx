import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// TAMBAHAN: Import icon BarChart3 untuk menu Data/Analytics
import { LayoutDashboard, Wallet, ChefHat, LogOut, BarChart3 } from 'lucide-react';
import { supabase } from '../supabaseClient';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if(window.confirm("Keluar dari aplikasi?")) {
        await supabase.auth.signOut();
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    // Style tetap sama persis (Standard Solid Background)
    <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between items-center max-w-md mx-auto h-16 px-6">
        
        {/* 1. BERANDA */}
        <button 
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? 'text-yellow-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <LayoutDashboard size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Beranda</span>
        </button>

        {/* 2. TRANSAKSI */}
        <button 
          onClick={() => navigate('/transactions')}
          className={`flex flex-col items-center gap-1 transition-colors ${isActive('/transactions') ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <Wallet size={24} strokeWidth={isActive('/transactions') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Transaksi</span>
        </button>

        {/* 3. DAPUR */}
        <button 
          onClick={() => navigate('/kitchen')}
          className={`flex flex-col items-center gap-1 transition-colors ${isActive('/kitchen') ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <ChefHat size={24} strokeWidth={isActive('/kitchen') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Dapur</span>
        </button>

        {/* 4. [BARU] ANALYTICS / DATA (Disisipkan disini) */}
        <button 
          onClick={() => navigate('/analytics')}
          className={`flex flex-col items-center gap-1 transition-colors ${isActive('/analytics') ? 'text-purple-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <BarChart3 size={24} strokeWidth={isActive('/analytics') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Data</span>
        </button>

        {/* 5. KELUAR */}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={24} />
          <span className="text-[10px] font-bold">Keluar</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;