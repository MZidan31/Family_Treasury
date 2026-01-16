import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Avatar from '../components/Avatar'; // Komponen Avatar & Crop
import { User, Crown, Shield, Edit3, Save, X, LogOut } from 'lucide-react';

const Profiles = ({ session }) => {
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Form State untuk Edit Profil
  const [formData, setFormData] = useState({
    full_name: '',
    budget_limit: '',
    role: '',
    avatar_url: ''
  });

  // --- 1. FETCH DATA (READ) ---
  const getProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true }); // Admin di atas

      if (error) throw error;
      setProfiles(data);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProfiles();
  }, [session]);

  // --- 2. UPDATE DATA (UPDATE) ---
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const updates = {
        id: session.user.id, // Update ID sendiri
        full_name: formData.full_name,
        budget_limit: formData.budget_limit,
        role: formData.role, 
        avatar_url: formData.avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      setEditingId(null);
      getProfiles(); // Refresh data
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC: Tombol Edit ---
  const startEditing = (profile) => {
    if (profile.id !== session.user.id) {
      alert("Anda hanya bisa mengedit profil Anda sendiri!");
      return;
    }
    setFormData(profile);
    setEditingId(profile.id);
  };

  // --- LOGIC: Upload Avatar ---
  const handleAvatarUpload = (event, url) => {
    // Update state form
    setFormData({ ...formData, avatar_url: url });
    
    // Auto save ke database agar tidak hilang jika lupa klik Simpan
    updateAvatarOnly(url);
  };

  const updateAvatarOnly = async (url) => {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: session.user.id, avatar_url: url, updated_at: new Date() });
      if (!error) getProfiles();
  }

  // --- LOGIC: Logout ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const formatRp = (num) => "Rp " + parseInt(num || 0).toLocaleString('id-ID');

  if (loading && profiles.length === 0) return <div className="p-8 text-yellow-500">Memuat Data Keluarga...</div>;

  return (
    <div className="pb-24 md:pb-0 space-y-6">
      
      {/* HEADER */}
<div className="flex justify-between items-center mb-6">
  <div>
     {/* PERBAIKAN: Hapus semua class warna (text-slate-800 dll) */}
     {/* Biarkan dia polos agar mengikuti warna text dari App.jsx */}
     
     <h2 className="text-xl font-bold flex items-center gap-2 opacity-90">
       <User size={24} className="text-yellow-500"/> Personel Keluarga
     </h2>
     
     <p className="text-sm opacity-70">
       User Login: <span className="font-bold text-yellow-600">{session?.user?.email}</span>
     </p>
  </div>
  {/* ... tombol logout ... */}
</div>

      {/* GRID KARTU */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => {
          const isMe = session?.user?.id === profile.id;
          const isEditing = editingId === profile.id;

          return (
            // PERBAIKAN LIGHT MODE: Paksa bg-slate-900 dan text-white agar kartu selalu gelap
            <div key={profile.id} className={`relative bg-slate-900 text-white rounded-2xl p-6 border shadow-xl overflow-hidden transition-all
              ${isMe ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'border-slate-800'}`}>
              
              {/* --- MODE EDIT --- */}
              {isEditing ? (
                <div className="space-y-4 relative z-20">
                  <div className="flex justify-center mb-4">
                    {/* Komponen Avatar (Bisa Crop) */}
                    <Avatar
                      url={formData.avatar_url}
                      size={100}
                      onUpload={handleAvatarUpload}
                      editable={true}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={formData.full_name || ''} 
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Limit Budget (Rp)</label>
                    <input 
                      type="number" 
                      value={formData.budget_limit || ''} 
                      onChange={(e) => setFormData({...formData, budget_limit: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Peran</label>
                    <select 
                      value={formData.role || 'Member'} 
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                    >
                      <option value="Admin">Admin (Ayah/Bunda)</option>
                      <option value="Member">Member (Anak)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={handleUpdateProfile} className="flex-1 bg-yellow-500 text-black py-2 rounded font-bold flex justify-center items-center text-sm">
                      <Save size={16} className="mr-2"/> Simpan
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-3 bg-slate-700 text-white rounded flex items-center">
                      <X size={16}/>
                    </button>
                  </div>
                </div>
              ) : (
                // --- MODE LIHAT (VIEW) ---
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar Statis */}
                      <Avatar
                        url={profile.avatar_url}
                        size={60}
                        editable={false}
                      />
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{profile.full_name || 'Tanpa Nama'}</h3>
                        <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700 flex items-center w-fit mt-1">
                          {profile.role === 'Admin' ? <Crown size={10} className="mr-1 text-yellow-500"/> : <User size={10} className="mr-1 text-blue-500"/>} 
                          {profile.role || 'Member'}
                        </span>
                      </div>
                    </div>
                    {isMe && (
                      <button onClick={() => startEditing(profile)} className="text-slate-500 hover:text-yellow-500 transition-colors">
                        <Edit3 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 mt-4">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Limit Bulanan</p>
                    <p className="font-bold text-white">{formatRp(profile.budget_limit)}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Profiles;