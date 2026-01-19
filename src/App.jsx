import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Sun, Moon, UserCircle, LogOut, ChevronDown, Camera, X, Save, Check, Loader2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from './utils/cropImage';

import Dashboard from './pages/Dashboard';
import Kitchen from './pages/Kitchen';
import Analytics from './pages/Analytics';
import Transactions from './pages/Transactions';
import Auth from './pages/Auth';
import BottomNav from './components/BottomNav';

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Profile & Crop State
  const [profile, setProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    return () => subscription.unsubscribe();
  }, [theme]);

  const fetchProfile = async (userId) => {
    let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!data && !error) {
        const newProfile = { id: userId, full_name: 'Keluarga', avatar_url: '' };
        await supabase.from('profiles').insert(newProfile);
        setProfile(newProfile);
    } else if (data) {
        setProfile(data);
        setEditName(data.full_name);
        setPreviewAvatar(data.avatar_url);
    }
  };

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => { setImageSrc(reader.result); setZoom(1); setCrop({ x: 0, y: 0 }); });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => { setCroppedAreaPixels(croppedAreaPixels); }, []);

  const showCroppedImage = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      setPreviewAvatar(URL.createObjectURL(croppedBlob));
      setFileToUpload(croppedBlob);
      setImageSrc(null);
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async () => {
    if (!session) return;
    setUploading(true);
    try {
        let finalAvatarUrl = profile.avatar_url;
        if (fileToUpload) {
            const fileName = `${session.user.id}-${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, fileToUpload);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            finalAvatarUrl = data.publicUrl;
        }
        const updates = { id: session.user.id, full_name: editName, avatar_url: finalAvatarUrl, updated_at: new Date() };
        const { error } = await supabase.from('profiles').upsert(updates);
        if (error) throw error;
        setProfile(updates);
        setIsEditingProfile(false);
        setIsProfileOpen(false);
        setFileToUpload(null);
    } catch (error) { alert("Gagal update: " + error.message); } finally { setUploading(false); }
  };

  const toggleTheme = () => {
    const root = window.document.documentElement;
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  };

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center dark:text-white font-bold">Memuat Sistem...</div>;

  return (
    <Router>
      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
        
        {/* MODAL EDIT PROFILE */}
        {isEditingProfile && (
            <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Edit Identitas</h3>
                        <button onClick={() => { setIsEditingProfile(false); setImageSrc(null); }}><X size={20}/></button>
                    </div>
                    {imageSrc ? (
                        <div className="flex flex-col h-[400px]">
                            <div className="relative flex-1 bg-black rounded-xl overflow-hidden mb-4 border-2 border-yellow-500">
                                <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} showGrid={false} />
                            </div>
                            <div className="flex items-center gap-2 px-2 mb-4"><span className="text-xs font-bold text-slate-500">Zoom</span><input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} className="w-full h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer"/></div>
                            <button onClick={showCroppedImage} className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Check size={18}/> Potong & Pakai</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-center mb-4">
                                <div className="relative group cursor-pointer">
                                    {previewAvatar ? (<img src={previewAvatar} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-yellow-500 shadow-lg"/>) : (<div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-4 border-slate-300 dark:border-slate-700"><UserCircle size={48}/></div>)}
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Camera className="text-white"/><input type="file" accept="image/*" onChange={onFileChange} className="hidden" /></label>
                                </div>
                            </div>
                            <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nama Keluarga</label><input type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-yellow-500"/></div>
                            <button onClick={handleSaveProfile} disabled={uploading} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2 mt-4 disabled:opacity-50">{uploading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} {uploading ? 'Menyimpan...' : 'Simpan Profil'}</button>
                        </div>
                    )}
                </div>
            </div>
        )}

        <div className="w-full md:max-w-4xl mx-auto min-h-screen flex flex-col relative shadow-2xl bg-white dark:bg-slate-950 transition-colors duration-300">
          {session && (
            <div className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
              <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group">
                  {profile?.avatar_url ? (<img src={profile.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500"/>) : (<div className="p-2 bg-yellow-500/20 rounded-full group-hover:bg-yellow-500/30"><UserCircle size={24} className="text-yellow-600 dark:text-yellow-500" /></div>)}
                  <div className="text-left"><h1 className="text-sm font-bold leading-tight flex items-center gap-2">{profile?.full_name || "Keluarga"}<ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`}/></h1><p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider">TREASURY ADMIN</p></div>
                </button>
                {isProfileOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Email Terdaftar</p><p className="text-sm font-medium truncate text-slate-900 dark:text-white">{session.user.email}</p></div>
                    <button onClick={() => { setIsEditingProfile(true); setIsProfileOpen(false); }} className="w-full text-left p-4 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-bold transition-colors"><Camera size={16}/> Ubah Profil & Foto</button>
                  </div>
                )}
              </div>
              <button onClick={toggleTheme} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:scale-110 active:scale-95 transition-transform">{theme === 'dark' ? <Sun size={20} className="text-yellow-400 fill-yellow-400"/> : <Moon size={20} className="text-slate-600 fill-slate-600"/>}</button>
            </div>
          )}

          <main className="flex-1 p-4 md:p-6 pb-24">
            <Routes>
              <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
              <Route path="/" element={session ? <Dashboard session={session} /> : <Navigate to="/auth" />} />
              <Route path="/kitchen" element={session ? <Kitchen /> : <Navigate to="/auth" />} />
              <Route path="/transactions" element={session ? <Transactions /> : <Navigate to="/auth" />} />
              <Route path="*" element={<Navigate to="/" />} />
              <Route path="/analytics" element={<Analytics session={session} />} />
            </Routes>
          </main>

          {session && <BottomNav />}
        </div>
      </div>
    </Router>
  );
};

export default App;