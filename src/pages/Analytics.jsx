import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PieChart, RefreshCw, Wallet, Utensils, Zap, GraduationCap, Bus, LayoutGrid, CheckCircle2, AlertTriangle, TrendingUp, AlertCircle } from 'lucide-react';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  
  // Data General
  const [totalIncome, setTotalIncome] = useState(0); // PEMBAGI UTAMA
  const [categoryStats, setCategoryStats] = useState([]);

  // Data Spesifik Dapur
  const [foodStats, setFoodStats] = useState({ raw: 0, cooked: 0, rawPct: 0, cookedPct: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
        // 1. AMBIL TOTAL PEMASUKAN (Sebagai Penyebut/Pembagi)
        // Kita ambil dari tabel 'incomes' (Gaji, dll)
        const { data: incomes } = await supabase.from('incomes').select('amount');
        const incomeTotal = incomes?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
        setTotalIncome(incomeTotal);

        // 2. AMBIL SEMUA PENGELUARAN
        const { data: transactions } = await supabase.from('transactions').select('*').eq('type', 'EXPENSE');
        
        if (!transactions) {
            setLoading(false);
            return;
        }

        let cats = {}; 
        let rTotal = 0; 
        let cTotal = 0; 

        transactions.forEach(t => {
            // Hitung per Kategori
            if (cats[t.category]) {
                cats[t.category] += t.amount;
            } else {
                cats[t.category] = t.amount;
            }

            // Hitung Detail Dapur
            if (t.category === 'Makan') {
                const desc = (t.description || "").toLowerCase();
                if (desc.includes('(mentah)')) {
                    rTotal += t.amount;
                } else if (desc.includes('(matang)')) {
                    cTotal += t.amount;
                } else {
                    cTotal += t.amount; // Default Jajan
                }
            }
        });

        // --- PERBAIKAN RUMUS PERSENTASE DISINI ---
        // Sekarang dibagi dengan 'incomeTotal', BUKAN total pengeluaran.
        const pembagi = incomeTotal > 0 ? incomeTotal : 1; // Cegah error bagi 0

        const sortedCats = Object.keys(cats)
            .map(key => ({ 
                name: key, 
                amount: cats[key], 
                // Rumus: (Pengeluaran Kategori / Total Gaji) * 100
                percent: incomeTotal > 0 ? ((cats[key] / incomeTotal) * 100).toFixed(1) : 0 
            }))
            .sort((a, b) => b.amount - a.amount);

        // Hitung Persen Dapur (Khusus ini tetap perbandingan antar makanan)
        const totalFood = rTotal + cTotal;
        const rPct = totalFood > 0 ? Math.round((rTotal / totalFood) * 100) : 0;
        const cPct = totalFood > 0 ? Math.round((cTotal / totalFood) * 100) : 0;

        setCategoryStats(sortedCats);
        setFoodStats({ raw: rTotal, cooked: cTotal, rawPct: rPct, cookedPct: cPct });

    } catch (err) {
        console.error("Error fetching data:", err);
    } finally {
        setLoading(false);
    }
  };

  const formatRp = (num) => "Rp " + (parseInt(num) || 0).toLocaleString('id-ID');

  const getIcon = (cat) => {
      switch(cat) {
          case 'Makan': return <Utensils size={16} className="text-orange-500"/>;
          case 'Listrik': return <Zap size={16} className="text-yellow-500"/>;
          case 'Saku Sekolah': return <GraduationCap size={16} className="text-blue-500"/>;
          case 'Mobilitas': return <Bus size={16} className="text-purple-500"/>;
          default: return <LayoutGrid size={16} className="text-slate-400"/>;
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-32 animate-fade-in p-6">
      
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <PieChart className="text-purple-500"/> Analisa Keuangan
            </h1>
            <p className="text-xs text-slate-500">Persentase terhadap Pemasukan ({formatRp(totalIncome)})</p>
        </div>
        <button onClick={fetchData} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 hover:text-purple-500 transition-colors">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""}/>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs italic">Sedang menghitung data...</div>
      ) : (
        <div className="space-y-8">
            
            {/* 1. TOP PENGELUARAN (Base on Income) */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                    <Wallet className="text-blue-500" size={18}/> Realisasi Anggaran
                </h3>
                
                {totalIncome === 0 ? (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle size={16}/> 
                        <span>Mohon input <b>Pemasukan</b> di Beranda agar persentase akurat.</span>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {categoryStats.map((cat, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between items-center text-xs mb-1">
                                    <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                                        {getIcon(cat.name)} {cat.name}
                                    </div>
                                    <div className="text-right">
                                        {/* Tampilkan Persen (dari Gaji) */}
                                        <span className={`font-mono font-bold ${parseFloat(cat.percent) > 30 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {cat.percent}%
                                        </span>
                                        <span className="text-slate-400 ml-2 text-[10px]">dari Pemasukan</span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden relative">
                                    {/* Bar Progress */}
                                    <div 
                                        className={`h-full rounded-full ${cat.name === 'Makan' ? 'bg-orange-500' : idx === 0 ? 'bg-red-500' : 'bg-blue-500'}`} 
                                        style={{ width: `${Math.min(parseFloat(cat.percent), 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-right text-[10px] text-slate-400 mt-1">{formatRp(cat.amount)}</p>
                            </div>
                        ))}
                        {categoryStats.length === 0 && <p className="text-center text-xs text-slate-400 py-4">Belum ada pengeluaran.</p>}
                    </div>
                )}
            </div>

            {/* 2. SPESIAL REPORT: DAPUR */}
            {(foodStats.raw > 0 || foodStats.cooked > 0) && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 rounded-3xl p-6 shadow-md border border-orange-100 dark:border-slate-700 relative overflow-hidden">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 relative z-10">
                        <Utensils className="text-orange-500" size={18}/> Rasio Dapur
                    </h3>

                    <div className="flex items-center gap-6">
                        <div className="relative shrink-0">
                            <div className="w-24 h-24 rounded-full" style={{ background: `conic-gradient(#10b981 0% ${foodStats.rawPct}%, #f59e0b ${foodStats.rawPct}% 100%)` }}></div>
                            <div className="absolute inset-3 bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center shadow-inner">
                                <span className="text-[10px] text-slate-400">Total Makan</span>
                                <span className="text-xs font-black dark:text-white">{formatRp(foodStats.raw + foodStats.cooked)}</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-center p-2 bg-white/60 dark:bg-slate-700/50 rounded-lg border border-orange-100 dark:border-slate-600">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Masak</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600">{foodStats.rawPct}%</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white/60 dark:bg-slate-700/50 rounded-lg border border-orange-100 dark:border-slate-600">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Jajan</span>
                                </div>
                                <span className="text-xs font-bold text-amber-600">{foodStats.cookedPct}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Analytics;