import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Utensils, Carrot, Plus, Trash2, ShoppingCart, ChefHat, Wallet, Minus, CalendarDays, ShoppingBag, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

const Kitchen = () => {
  // --- STATE UTAMA ---
  const [viewMode, setViewMode] = useState('SCHEDULE'); // 'SCHEDULE' atau 'SHOPPING'
  
  // --- LOGIKA ROTASI JADWAL (ALGORITMA 10 HARI) ---
  // Kita set default ke hari ini berdasarkan tanggal
  const getCycleDay = () => {
      const date = new Date().getDate();
      // Rumus: (Tanggal - 1) Modulo 10. Hasilnya 0-9.
      // Contoh: Tgl 1 -> 0, Tgl 10 -> 9, Tgl 11 -> 0, Tgl 30 -> 9.
      return (date - 1) % 10;
  };

  const [selectedDayIndex, setSelectedDayIndex] = useState(getCycleDay());

  // --- DATA JADWAL (HARDCODED SESUAI EXCEL) ---
  const mealSchedule = [
    { id: 1, morning: 'Gado-gado', noon: 'Tempe + Tahu + Sayur Asem', night: 'Telur Omlette/Original', total: 67000 },
    { id: 2, morning: 'Mie Instan + Telur', noon: 'Karedok', night: 'Ayam De Kriuk (4) + Telur (2)', total: 91500 },
    { id: 3, morning: 'Nasi Uduk (4) + Mie + Telur', noon: 'Gado-gado', night: 'Tempe + Tahu + Sambelan', total: 77500 },
    { id: 4, morning: 'Tempe + Tahu + Sayur Asem', noon: 'Mie Instan (3) + Telur 1/4kg', night: 'Soto Mie', total: 66500 },
    { id: 5, morning: 'Sayur Bakso', noon: 'Tempe + Tahu + Sambelan', night: 'Nasi Uduk (2) + Mie Instan (3)', total: 70500 },
    { id: 6, morning: 'Nasgor Nyanyah + Telur 1/4kg', noon: 'Karedok', night: 'Soto Ayam (+Gas)', total: 74000 },
    { id: 7, morning: 'Tempe + Tahu + Sayur Bayam', noon: 'Sisa Pagi + Sambelan', night: 'Telur 1/4kg + Soto Mie (2)', total: 86000 },
    { id: 8, morning: 'Karedok', noon: 'Kentang Pedas + Tempe', night: 'Semur Tahu (Rempah + Kecap)', total: 62000 },
    { id: 9, morning: 'Semur Telur + Tahu', noon: 'Stok Pagi (Sisa)', night: 'Mie Instan (2) + Telur (2)', total: 74000 },
    { id: 10, morning: 'Nasgor Nyanyah + Telur (Sisa)', noon: 'Mie Instan (3)', night: 'Semur Kentang + Tempe (Sisa)', total: 53500 },
  ];

  // Helper untuk navigasi hari
  const changeDay = (direction) => {
      let newIndex = selectedDayIndex + direction;
      if (newIndex > 9) newIndex = 0; // Loop balik ke 1
      if (newIndex < 0) newIndex = 9; // Loop balik ke 10
      setSelectedDayIndex(newIndex);
  };

  const currentMenu = mealSchedule[selectedDayIndex];

  // --- STATE BELANJA (KODE LAMA - TIDAK DIGANGGU) ---
  const [activeTab, setActiveTab] = useState('MATANG'); 
  const [menuList, setMenuList] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [dailyCart, setDailyCart] = useState([]);
  const [dailyLimit, setDailyLimit] = useState(0); 
  const [remainingMonth, setRemainingMonth] = useState(0);
  const [daysLeft, setDaysLeft] = useState(30);

  useEffect(() => { fetchMenus(); calculateRollingForecast(); }, [activeTab]);

  const calculateRollingForecast = () => {
    const savedRemaining = localStorage.getItem('DAILY_FOOD_REMAINING_TOTAL'); 
    const remainingMoney = savedRemaining ? parseInt(savedRemaining) : 0;
    setRemainingMonth(remainingMoney);
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysRemaining = Math.max(1, lastDayOfMonth.getDate() - today.getDate());
    setDaysLeft(daysRemaining);
    setDailyLimit(remainingMoney > 0 ? Math.floor(remainingMoney / daysRemaining) : 0);
  };

  const fetchMenus = async () => {
    try { const { data } = await supabase.from('menus').select('*').eq('type', activeTab).order('name', { ascending: true }); if (data) setMenuList(data); } catch (e) {}
  };
  const handleAddMenu = async () => { if (!newItemName || !newItemPrice) return; const { error } = await supabase.from('menus').insert({ name: newItemName, price: parseInt(newItemPrice) || 0, type: activeTab }); if (!error) { setNewItemName(''); setNewItemPrice(''); fetchMenus(); }};
  const handleDeleteMenu = async (id) => { if(window.confirm("Hapus?")) { await supabase.from('menus').delete().eq('id', id); fetchMenus(); }};
  const addToCart = (item) => { const existing = dailyCart.find(i => i.id === item.id); if (existing) { setDailyCart(dailyCart.map(i => i.id === item.id ? { ...i, qty: (i.qty || 1) + 1 } : i)); } else { setDailyCart([...dailyCart, { ...item, qty: 1 }]); }};
  const decreaseQty = (id) => { const existing = dailyCart.find(i => i.id === id); if (existing && existing.qty > 1) { setDailyCart(dailyCart.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)); } else { removeFromCart(id); }};
  const removeFromCart = (id) => { setDailyCart(dailyCart.filter(i => i.id !== id)); };
  const totalCart = dailyCart.reduce((acc, curr) => acc + (curr.price * (curr.qty || 1)), 0);
  const remainingDaily = dailyLimit - totalCart;
  const formatRp = (num) => "Rp " + (parseInt(num) || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6 pb-24 md:pb-10 animate-fade-in">
      
      {/* HEADER & SWITCHER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div>
               <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center mb-1">
                   <ChefHat size={24} className="mr-2 text-yellow-500"/> Dapur & Logistik
               </h2>
               <p className="text-xs text-slate-500 dark:text-slate-400">Total Sisa Uang Belanja: <span className="font-bold text-slate-900 dark:text-white">{formatRp(remainingMonth)}</span></p>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
                <button 
                    onClick={() => setViewMode('SCHEDULE')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'SCHEDULE' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400'}`}
                >
                    <CalendarDays size={14}/> Rencana Makan
                </button>
                <button 
                    onClick={() => setViewMode('SHOPPING')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'SHOPPING' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400'}`}
                >
                    <ShoppingBag size={14}/> Simulasi Belanja
                </button>
            </div>
         </div>
      </div>

      {/* --- MODE 1: JADWAL MAKAN (FOCUS MODE) --- */}
      {viewMode === 'SCHEDULE' && (
          <div className="animate-fade-in">
              
              {/* NAVIGASI HARI */}
              <div className="flex justify-between items-center mb-6 px-2">
                  <button onClick={() => changeDay(-1)} className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-90 transition-transform">
                      <ChevronLeft size={20} className="text-slate-500"/>
                  </button>
                  
                  <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                          Siklus Hari Ke-{currentMenu.id}
                      </p>
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white flex flex-col">
                          {currentMenu.id === getCycleDay() + 1 ? "HARI INI" : `Menu #${currentMenu.id}`}
                      </h2>
                  </div>

                  <button onClick={() => changeDay(1)} className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-90 transition-transform">
                      <ChevronRight size={20} className="text-slate-500"/>
                  </button>
              </div>

              {/* KARTU MENU UTAMA */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>

                  <div className="relative z-10 space-y-6">
                      
                      {/* PAGI */}
                      <div className="flex gap-4 items-start pb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
                          <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl text-orange-600 dark:text-orange-400">
                              <Utensils size={24}/>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-slate-400 mb-1">PAGI (09:00)</p>
                              <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{currentMenu.morning}</p>
                          </div>
                      </div>

                      {/* SIANG */}
                      <div className="flex gap-4 items-start pb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
                          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl text-yellow-600 dark:text-yellow-400">
                              <Utensils size={24}/>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-slate-400 mb-1">SIANG (13:00)</p>
                              <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                  {currentMenu.noon.toLowerCase().includes('sisa') || currentMenu.noon.toLowerCase().includes('stok') ? (
                                      <span className="flex items-center gap-2">
                                          {currentMenu.noon} <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">HEMAT</span>
                                      </span>
                                  ) : currentMenu.noon}
                              </p>
                          </div>
                      </div>

                      {/* MALAM */}
                      <div className="flex gap-4 items-start">
                          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                              <Utensils size={24}/>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-slate-400 mb-1">MALAM (19:00)</p>
                              <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{currentMenu.night}</p>
                          </div>
                      </div>

                  </div>

                  {/* TOTAL BUDGET FOOTER */}
                  <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <AlertCircle size={14}/>
                          <span>Estimasi Belanja (5 Org)</span>
                      </div>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {formatRp(currentMenu.total)}
                      </div>
                  </div>
              </div>

              {/* INFO TAMBAHAN */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Beras / Hari</p>
                      <p className="font-bold text-slate-700 dark:text-white">1.5 Liter</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Fixed Cost</p>
                      <p className="font-bold text-slate-700 dark:text-white">Rp 16.000</p>
                  </div>
              </div>

          </div>
      )}

      {/* --- MODE 2: SIMULASI BELANJA (KODE LAMA - HIDDEN SAAT JADWAL AKTIF) --- */}
      <div className={viewMode === 'SHOPPING' ? 'block animate-fade-in' : 'hidden'}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* BAGIAN MENU (KIRI) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl flex">
                  <button onClick={() => setActiveTab('MATANG')} className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${activeTab === 'MATANG' ? 'bg-yellow-500 text-slate-900 shadow' : 'text-slate-400'}`}><Utensils size={16} className="mr-2"/> Matang</button>
                  <button onClick={() => setActiveTab('MENTAH')} className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${activeTab === 'MENTAH' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400'}`}><Carrot size={16} className="mr-2"/> Bahan Baku</button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-2">
                  <input type="text" placeholder="Nama Item Baru" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-3 text-sm dark:text-white"/>
                  <div className="flex gap-2">
                      <input type="number" placeholder="Rp" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="flex-1 md:w-32 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-3 text-sm dark:text-white"/>
                      <button onClick={handleAddMenu} className="px-6 rounded-lg font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 flex items-center justify-center"><Plus/></button>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {menuList.map(item => (
                      <div key={item.id} className="group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-all cursor-pointer relative shadow-sm" onClick={() => addToCart(item)}>
                          <p className="font-bold text-slate-800 dark:text-white text-sm mb-1">{item.name}</p>
                          <p className={`text-xs font-mono ${activeTab === 'MATANG' ? 'text-yellow-600' : 'text-emerald-600'}`}>{formatRp(item.price)}</p>
                          <button onClick={(e) => {e.stopPropagation(); handleDeleteMenu(item.id)}} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
            </div>

            {/* KERANJANG BELANJA (KANAN) */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sticky top-24 min-h-[400px] flex flex-col shadow-lg">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center mb-4"><ShoppingCart size={18} className="mr-2 text-blue-500"/> Simulasi Belanja</h3>
                <div className="flex-1 space-y-3 mb-6 overflow-y-auto custom-scrollbar max-h-[300px]">
                    {dailyCart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                            <div className="flex-1 pr-2">
                                <span className="text-slate-800 dark:text-white font-medium block truncate">{item.name}</span>
                                <span className="text-[10px] text-slate-400">{item.qty} x {parseInt(item.price).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-800 dark:text-white font-bold text-xs">{formatRp(item.price * item.qty)}</span>
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <button onClick={() => decreaseQty(item.id)} className="p-1 text-slate-400 hover:text-red-500"><Minus size={12}/></button>
                                    <button onClick={() => addToCart(item)} className="p-1 text-slate-400 hover:text-emerald-500"><Plus size={12}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {dailyCart.length === 0 && <p className="text-center text-slate-400 text-xs italic py-10">Keranjang kosong.</p>}
                </div>
                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs"><span>Jatah Hari Ini:</span><span>{formatRp(dailyLimit)}</span></div>
                    <div className="flex justify-between text-slate-900 dark:text-white font-bold text-lg"><span>Total:</span><span>{formatRp(totalCart)}</span></div>
                    <div className={`p-3 rounded-lg text-center text-xs font-bold border ${remainingDaily < 0 ? 'bg-red-50 text-red-500 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                        {remainingDaily < 0 ? `Over Budget: ${formatRp(Math.abs(remainingDaily))}` : `Sisa Aman: ${formatRp(remainingDaily)}`}
                    </div>
                    <button onClick={() => setDailyCart([])} className="w-full py-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors">Reset Keranjang</button>
                </div>
              </div>
            </div>
          </div>
      </div>

    </div>
  );
};
export default Kitchen;