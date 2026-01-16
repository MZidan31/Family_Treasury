import React from 'react';
import { LayoutDashboard, Wallet, UtensilsCrossed, Users, LogOut, Sun, Moon, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Import Supabase untuk Logout

const Sidebar = ({ isDarkMode, toggleTheme, session }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Ambil inisial email user
  const userEmail = session?.user?.email;
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : '?';

  // --- FUNGSI LOGOUT AMAN ---
  const handleLogout = async () => {
    const confirm = window.confirm("Anda yakin ingin keluar sistem?");
    if (confirm) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Wallet, label: 'Transaksi', path: '/transactions' },
    { icon: UtensilsCrossed, label: 'Dapur & Menu', path: '/kitchen' },
    { icon: Users, label: 'Anggota', path: '/profiles' },
  ];

  return (
    <>
      {/* SIDEBAR DESKTOP */}
      <aside className={`fixed left-0 top-0 h-screen w-64 border-r hidden md:flex flex-col z-50 transition-colors duration-500
        ${isDarkMode 
          ? 'bg-slate-900/95 backdrop-blur-xl border-slate-800 text-white' 
          : 'bg-white/95 backdrop-blur-xl border-slate-200 text-slate-800 shadow-xl'
        }`}
      >
        <div className={`p-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            THE TREASURY
          </h1>
        </div>

        {/* MENU UTAMA */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`flex items-center w-full p-3 rounded-xl transition-all duration-300 group
                  ${isActive 
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' 
                    : isDarkMode 
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <item.icon size={20} className="mr-3" />
                <span className="font-medium">{item.label}</span>
                {isActive && <div className="absolute right-0 w-1 h-8 bg-yellow-500 rounded-l-full" />}
              </button>
            );
          })}
        </nav>

        {/* FOOTER USER & LOGOUT */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} space-y-2`}>
          
          {/* Info User */}
          {session ? (
            <div className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-slate-900 font-bold overflow-hidden shadow-md">
                 {initial}
              </div>
              <div className="overflow-hidden">
                <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {userEmail}
                </p>
                <p className="text-[10px] text-green-500 flex items-center gap-1">● Online</p>
              </div>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="w-full bg-yellow-500 text-black p-2 rounded-xl text-sm font-bold flex items-center justify-center mb-2">
              <LogIn size={16} className="mr-2"/> Login
            </button>
          )}

          {/* Tombol Tema */}
          <button 
            onClick={toggleTheme}
            className={`flex items-center w-full p-3 rounded-xl transition-colors
              ${isDarkMode 
                ? 'bg-slate-800 text-slate-300 hover:text-white' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'}`}
          >
            {isDarkMode ? <Sun size={20} className="mr-3 text-yellow-400"/> : <Moon size={20} className="mr-3 text-indigo-500"/>}
            <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          {/* Tombol Logout (PASTI MUNCUL SEKARANG) */}
          {session && (
            <button 
              onClick={handleLogout}
              className="flex items-center w-full p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
            >
              <LogOut size={20} className="mr-3" />
              <span className="font-medium">Logout System</span>
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE NAV (Bawah) */}
      <div className={`fixed bottom-0 left-0 w-full md:hidden flex justify-around p-4 z-50 safe-area-bottom border-t backdrop-blur-lg
         ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-up'}`}
      >
        {menuItems.map((item, index) => (
          <button 
            key={index} 
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center ${location.pathname === item.path ? 'text-yellow-500' : 'text-slate-400'}`}
          >
            <item.icon size={24} />
          </button>
        ))}
        {/* Logout Mobile */}
        <button onClick={handleLogout} className="flex flex-col items-center text-red-500">
           <LogOut size={24}/>
        </button>
      </div>
    </>
  );
};

export default Sidebar;