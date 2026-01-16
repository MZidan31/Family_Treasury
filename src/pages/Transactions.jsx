import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Plus, Trash2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ date: new Date().toISOString().slice(0, 10), description: '', amount: '', category: 'Makan', type: 'EXPENSE' });
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!formData.amount || !formData.description) return;
    await supabase.from('transactions').insert({ ...formData, amount: parseInt(formData.amount) || 0 });
    setFormData({ ...formData, description: '', amount: '' });
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus transaksi?')) { await supabase.from('transactions').delete().eq('id', id); fetchTransactions(); }
  };

  const filtered = transactions.filter(t => t && (filter === 'ALL' || t.type === filter) && (t.description || '').toLowerCase().includes(search.toLowerCase()));
  const formatRp = (amount) => "Rp " + (amount || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6 pb-24 md:pb-10 animate-fade-in">
      {/* HEADER SOLID */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Jurnal Transaksi</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
           <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm dark:text-white dark:[color-scheme:dark]"/>
           <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm dark:text-white"><option value="EXPENSE">Pengeluaran</option><option value="INCOME">Pemasukan</option></select>
           <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm dark:text-white col-span-2 md:col-span-1">{['Makan','Mobilitas','Saku Sekolah','Listrik','Internet','Infaq','Lainnya','Investasi','Cicilan/Hutang'].map(c=><option key={c}>{c}</option>)}</select>
           <input type="number" placeholder="Rp" value={formData.amount} onChange={e=>setFormData({...formData, amount: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm dark:text-white col-span-2 md:col-span-1"/>
        </div>
        <div className="flex gap-2">
           <input type="text" placeholder="Keterangan..." value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm dark:text-white"/>
           <button onClick={handleSave} className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-6 rounded-lg font-bold"><Plus/></button>
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 min-h-[400px] shadow-sm">
         <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
               {['ALL','EXPENSE','INCOME'].map(f => (<button key={f} onClick={()=>setFilter(f)} className={`px-4 py-1 rounded text-xs font-bold ${filter===f ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400'}`}>{f==='ALL'?'Semua':f==='EXPENSE'?'Keluar':'Masuk'}</button>))}
            </div>
            <div className="relative w-1/3 hidden md:block"><Search size={14} className="absolute left-3 top-2.5 text-slate-400"/><input type="text" placeholder="Cari..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 py-2 text-xs dark:text-white"/></div>
         </div>
         <div className="space-y-3">
            {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-slate-400"/></div> : filtered.map(t => (
               <div key={t.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="flex items-center gap-4"><div className={`p-2 rounded-full ${t.type==='INCOME'?'bg-emerald-100 text-emerald-600':'bg-red-100 text-red-600'}`}>{t.type==='INCOME' ? <ArrowLeft size={16}/> : <ArrowRight size={16}/>}</div><div><p className="font-bold text-sm text-slate-800 dark:text-white">{t.description}</p><p className="text-xs text-slate-400">{t.date} • {t.category}</p></div></div>
                  <div className="flex items-center gap-4"><p className={`font-mono font-bold ${t.type==='INCOME'?'text-emerald-600':'text-red-500'}`}>{t.type==='INCOME'?'+':'-'} {formatRp(t.amount)}</p><button onClick={()=>handleDelete(t.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};
export default Transactions;