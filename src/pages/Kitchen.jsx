import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Utensils, Carrot, Plus, Trash2, ShoppingCart, X, ChefHat, Wallet } from 'lucide-react';

const Kitchen = () => {
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
  const addToCart = (item) => { setDailyCart([...dailyCart, { ...item, cartId: Date.now() }]); };
  const removeFromCart = (cartId) => { setDailyCart(dailyCart.filter(i => i.cartId !== cartId)); };
  const totalCart = dailyCart.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const remainingDaily = dailyLimit - totalCart;
  const formatRp = (num) => "Rp " + (parseInt(num) || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6 pb-24 md:pb-10 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <div><h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center mb-1"><ChefHat size={24} className="mr-2 text-yellow-500"/> Dapur & Logistik</h2><p className="text-xs text-slate-500 dark:text-slate-400">Total Sisa Uang Belanja: <span className="font-bold text-slate-900 dark:text-white">{formatRp(remainingMonth)}</span></p></div>
           <div className={`flex items-center gap-4 px-6 py-3 rounded-xl border ${dailyLimit < 20000 ? 'bg-red-50 border-red-200 text-red-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}><div className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"><Wallet size={20}/></div><div className="text-right"><p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Jatah Hari Ini ({daysLeft} hari lg)</p><p className="text-xl font-black">{formatRp(dailyLimit)}</p></div></div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl flex"><button onClick={() => setActiveTab('MATANG')} className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${activeTab === 'MATANG' ? 'bg-yellow-500 text-slate-900 shadow' : 'text-slate-400'}`}><Utensils size={16} className="mr-2"/> Matang</button><button onClick={() => setActiveTab('MENTAH')} className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${activeTab === 'MENTAH' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400'}`}><Carrot size={16} className="mr-2"/> Bahan Baku</button></div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex gap-2 items-center"><input type="text" placeholder="Nama Item" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm dark:text-white"/><input type="number" placeholder="Rp" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-28 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm dark:text-white"/><button onClick={handleAddMenu} className="h-[38px] px-6 rounded-lg font-bold text-white bg-slate-800 dark:bg-slate-700"><Plus/></button></div>
          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">{menuList.map(item => (<div key={item.id} className="group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-all cursor-pointer relative shadow-sm" onClick={() => addToCart(item)}><p className="font-bold text-slate-800 dark:text-white text-sm mb-1">{item.name}</p><p className={`text-xs font-mono ${activeTab === 'MATANG' ? 'text-yellow-600' : 'text-emerald-600'}`}>{formatRp(item.price)}</p><button onClick={(e) => {e.stopPropagation(); handleDeleteMenu(item.id)}} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></div>))}</div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sticky top-24 min-h-[400px] flex flex-col shadow-lg">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center mb-4"><ShoppingCart size={18} className="mr-2 text-blue-500"/> Simulasi Belanja</h3>
            <div className="flex-1 space-y-3 mb-6 overflow-y-auto custom-scrollbar max-h-[300px]">{dailyCart.map((item) => (<div key={item.cartId} className="flex justify-between items-center text-sm border-b border-dashed border-slate-200 dark:border-slate-700 pb-2"><span className="text-slate-600 dark:text-slate-300 truncate w-32">{item.name}</span><div className="flex items-center gap-2"><span className="font-mono text-slate-800 dark:text-white">{formatRp(item.price)}</span><button onClick={() => removeFromCart(item.cartId)} className="text-red-400 hover:text-red-600"><X size={14}/></button></div></div>))}{dailyCart.length === 0 && <p className="text-center text-slate-400 text-xs italic py-10">Keranjang kosong.</p>}</div>
            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3"><div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs"><span>Jatah Hari Ini:</span><span>{formatRp(dailyLimit)}</span></div><div className="flex justify-between text-slate-900 dark:text-white font-bold text-lg"><span>Total:</span><span>{formatRp(totalCart)}</span></div><div className={`p-3 rounded-lg text-center text-xs font-bold border ${remainingDaily < 0 ? 'bg-red-50 text-red-500 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{remainingDaily < 0 ? `Over Budget: ${formatRp(Math.abs(remainingDaily))}` : `Sisa Aman: ${formatRp(remainingDaily)}`}</div><button onClick={() => setDailyCart([])} className="w-full py-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors">Reset Keranjang</button></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Kitchen;