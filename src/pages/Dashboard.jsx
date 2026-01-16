import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, ShieldCheck, Banknote, Calculator, Save, Wallet, Plus, Trash2, X, Calendar, History, ArrowRight, CheckCircle, Info, Siren, FileText, PiggyBank, Target, Lock, Building, Landmark, ChefHat } from 'lucide-react';

// --- ENGINE: OTAK PINTAR (ORIGINAL STABLE) ---
const calculateBudget = (fixedIncome, additionalIncomes = [], debtList = [], sinkingFunds = [], transactions = []) => {
  const totalFixed = parseInt(fixedIncome) || 0;
  const totalAdditional = additionalIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = totalFixed + totalAdditional;
  if (totalIncome === 0) return null;

  const currentMonth = new Date().toISOString().slice(0, 7); 
  const monthTrx = transactions.filter(t => t.date && t.date.startsWith(currentMonth) && t.type === 'EXPENSE');
  const spending = { makan: 0, mobilitas: 0, saku_sekolah: 0, listrik: 0, internet: 0, infaq: 0, lainnya: 0, investasi: 0, hutang_extra: 0 };
  monthTrx.forEach(t => {
    const cat = t.category;
    if (spending[cat.toLowerCase().replace(' ', '_')] !== undefined) { spending[cat.toLowerCase().replace(' ', '_')] += t.amount; } 
    else if (cat === 'Makan') spending.makan += t.amount;
    else if (cat === 'Mobilitas') spending.mobilitas += t.amount;
    else if (cat === 'Saku Sekolah') spending.saku_sekolah += t.amount;
    else if (cat === 'Listrik') spending.listrik += t.amount;
    else if (cat === 'Internet') spending.internet += t.amount;
    else if (cat === 'Infaq') spending.infaq += t.amount;
    else if (cat === 'Lainnya') spending.lainnya += t.amount;
    else if (cat === 'Investasi') spending.investasi += t.amount;
  });

  const activeDebts = debtList.filter(d => !d.is_paid);
  const totalDebtObligation = activeDebts.reduce((acc, curr) => acc + curr.amount, 0);
  let totalSinkingFundMonthly = 0;
  let sinkingFundAllocations = {};
  const today = new Date();
  sinkingFunds.forEach(fund => {
    const due = new Date(fund.due_date);
    let monthsLeft = (due.getFullYear() - today.getFullYear()) * 12 + (due.getMonth() - today.getMonth());
    if (monthsLeft <= 0) monthsLeft = 1;
    const monthlyNeed = Math.ceil((fund.target_amount - (fund.current_amount || 0)) / monthsLeft);
    totalSinkingFundMonthly += monthlyNeed;
    sinkingFundAllocations[fund.id] = { name: fund.name, amount: monthlyNeed, monthsLeft: monthsLeft, target: fund.target_amount };
  });

  const operationalTargets = { listrik: 150000, internet: 100000, infaq: 50000, makan: 1650000, mobilitas: 375000, saku_sekolah: 300000, lainnya: 250000, investasi: 0, hutang_extra: 0 };
  const hardFixedCost = totalDebtObligation + totalSinkingFundMonthly + operationalTargets.listrik;
  const totalOperational = Object.values(operationalTargets).reduce((a, b) => a + b, 0);
  const totalNeeds = totalDebtObligation + totalSinkingFundMonthly + totalOperational;
  const balance = totalIncome - totalNeeds;

  let allocations = { ...operationalTargets };
  let notes = {};
  let statusMessage = "";
  let isDanger = false;
  let actionNeeded = null;
  let surplusLevel = null;
  let advice = [];

  Object.keys(allocations).forEach(key => { notes[key] = { source: "Target RABK", formula: "Standar kebutuhan.", status: "Normal" }; });
  Object.keys(sinkingFundAllocations).forEach(id => { const sf = sinkingFundAllocations[id]; notes[`sf_${id}`] = { source: "Sinking Fund", formula: `Target / ${sf.monthsLeft} bln`, status: "Saved" }; });

  if (balance >= 0) {
    const surplusStr = parseInt(balance).toLocaleString('id-ID');
    let remainingSurplus = balance;
    if (balance >= 2000000) {
      surplusLevel = 'SANGAT_BAIK'; statusMessage = `LEVEL SANGAT BAIK (Surplus Rp ${surplusStr})`;
      allocations.infaq = 100000; remainingSurplus -= 50000; notes.infaq = { source: "Upgrade Level", formula: "Cap Max 100rb", status: "Boosted" };
      allocations.makan = 2100000; remainingSurplus -= 450000; notes.makan = { source: "Upgrade Level", formula: "Limit Rp 70.000", status: "Boosted" };
      const invest = remainingSurplus * 0.40; const debtPayoff = remainingSurplus * 0.30; const overhead = remainingSurplus * 0.30;
      allocations.investasi += invest; allocations.hutang_extra += debtPayoff; allocations.lainnya += overhead;
      notes.investasi = { source: "Surplus", formula: "40% Sisa", status: "New" }; notes.hutang_extra = { source: "Surplus", formula: "30% Sisa", status: "New" }; notes.lainnya = { source: "Surplus", formula: "30% Sisa", status: "Saved" };
      advice.push({ title: "Isi Brankas", amount: invest + overhead, note: "Masuk ke Goals." });
    } else if (balance >= 500000) {
      surplusLevel = 'CUKUP_BAIK'; statusMessage = `LEVEL CUKUP BAIK (Surplus Rp ${surplusStr})`;
      allocations.infaq = 75000; remainingSurplus -= 25000; notes.infaq = { source: "Upgrade Level", formula: "Bonus 25rb", status: "Boosted" };
      allocations.makan = 1950000; remainingSurplus -= 300000; notes.makan = { source: "Upgrade Level", formula: "Limit Rp 65rb", status: "Boosted" };
      allocations.lainnya += remainingSurplus; notes.lainnya = { source: "Surplus", formula: "Masuk Overhead", status: "Saved" };
    } else {
      surplusLevel = 'BAIK'; statusMessage = `LEVEL BAIK (Surplus Rp ${surplusStr})`;
      allocations.lainnya += balance; notes.lainnya = { source: "Surplus", formula: "Masuk Overhead", status: "Saved" };
    }
  } else {
    isDanger = true; const deficit = Math.abs(balance); const deficitStr = parseInt(deficit).toLocaleString('id-ID');
    if (totalIncome < hardFixedCost) { actionNeeded = 'SELL_ASSET'; statusMessage = `KRITIS! Defisit Rp ${deficitStr}`; } else { actionNeeded = 'SEARCH_INCOME'; statusMessage = `BAHAYA! Defisit Rp ${deficitStr}`; }
    let remainingDeficit = deficit;
    if (remainingDeficit > 0) { const cut = Math.min(remainingDeficit, operationalTargets.lainnya); allocations.lainnya -= cut; notes.lainnya = { source: "Defisit", formula: "Dipotong.", status: "Cut" }; remainingDeficit -= cut; }
    if (remainingDeficit > 0) { const target = operationalTargets.internet; const cut = Math.min(remainingDeficit, target); allocations.internet -= cut; notes.internet = { source: "Defisit", formula: "Internet diputus.", status: "Cut" }; remainingDeficit -= cut; }
    if (remainingDeficit > 0) { const cut = Math.min(remainingDeficit, operationalTargets.infaq); allocations.infaq -= cut; notes.infaq = { source: "Defisit", formula: "Ditiadakan.", status: "Cut" }; remainingDeficit -= cut; }
    if (remainingDeficit > 0) { const maxCutSaku = operationalTargets.saku_sekolah - 150000; const cut = Math.min(remainingDeficit, maxCutSaku); allocations.saku_sekolah -= Math.max(0, cut); notes.saku_sekolah = { source: "Defisit", formula: "Ditekan 50%.", status: "Cut" }; remainingDeficit -= Math.max(0, cut); }
    if (remainingDeficit > 0) { const maxCutMakan = operationalTargets.makan - 1000000; const cut = Math.min(remainingDeficit, maxCutMakan); allocations.makan -= cut; notes.makan = { source: "Defisit", formula: "Menu darurat.", status: "Cut" }; remainingDeficit -= cut; }
    if (remainingDeficit > 0) { allocations.mobilitas -= remainingDeficit; notes.mobilitas = { source: "Defisit", formula: "Terpaksa dipotong.", status: "Critical" }; }
  }
  return { operationalTargets, allocations, spending, totalDebtObligation, activeDebts, notes, sinkingFundAllocations, totalSinkingFundMonthly, summary: { income: totalIncome, totalNeeds, balance, isDanger, message: statusMessage, actionNeeded, surplusLevel, advice } };
};

// --- POPUP DETAIL (KEMBALI KE ORIGINAL - NO FULLSCREEN) ---
const DetailModal = ({ item, onClose, onOpenKitchen }) => {
  if (!item) return null;
  const days = item.key === 'saku_sekolah' ? 20 : item.key === 'mobilitas' ? 25 : 30;
  const isMonthly = item.isDebt || item.isSinkingFund || item.isGoal || ['listrik', 'internet', 'infaq', 'investasi', 'hutang_extra', 'lainnya'].includes(item.key);
  const amount = parseInt(item.amount) || 0; 
  const spent = parseInt(item.spent) || 0; 
  const remaining = amount - spent; 
  const percentUsed = amount > 0 ? (spent / amount) * 100 : 0;
  
  // Forecast Logic
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysLeft = Math.max(1, lastDayOfMonth.getDate() - today.getDate());
  const dailyRemaining = remaining > 0 ? remaining / daysLeft : 0;

  const note = item.note || { source: "System", formula: "-", status: "Normal" };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-sm rounded-2xl p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20}/></button>
        <div className="flex items-center gap-2 mb-1"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${note.status==='Cut'||note.status==='Critical'?'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-600 dark:text-red-400':note.status==='Boosted'||note.status==='New'?'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400':note.status==='Saved'?'bg-blue-100 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400':'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>{note.status}</span></div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">{item.label}</h3>
        <p className={`text-3xl font-bold mb-1 ${remaining < 0 ? 'text-red-500' : 'text-yellow-500'}`}>Rp {parseInt(remaining).toLocaleString('id-ID')}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Sisa Dana Real-Time (Dari Target {parseInt(amount).toLocaleString('id-ID')})</p>
        
        {!item.isGoal && !item.isSinkingFund && (
          <div className="mb-6">
             <div className="flex justify-between text-xs mb-1 text-slate-500 dark:text-slate-400"><span>Terpakai: {parseInt(spent).toLocaleString('id-ID')}</span><span>{Math.round(percentUsed)}%</span></div>
             <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden"><div className={`h-full ${remaining < 0 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(percentUsed, 100)}%` }}></div></div>
          </div>
        )}

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
           {item.isGoal ? (
              <div className="text-center">
                 <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Target Pencapaian</p>
                 <p className="text-xl font-bold text-slate-800 dark:text-white mb-2">{item.goalTarget}</p>
                 <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: `${item.progress}%` }}></div></div>
                 <p className="text-[10px] text-emerald-500 mt-1">{item.progress}% Terkumpul</p>
              </div>
           ) : (
              <>
                <div><div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1 font-bold"><FileText size={12}/> SUMBER DANA</div><p className="text-sm text-slate-700 dark:text-white font-medium">{note.source}</p></div>
                {item.key === 'makan' && (<div className="pt-2"><button onClick={() => { onClose(); onOpenKitchen(); }} className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"><ChefHat size={16}/> Buka Menu Dapur & Belanja</button></div>)}
                {!isMonthly && (<div className="pt-3 border-t border-slate-200 dark:border-slate-700"><div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase mb-2"><Calculator size={10}/> FORECAST HARIAN ({daysLeft} hari lg)</div><div className="flex justify-between items-center mt-1"><span className="text-xs text-slate-500 dark:text-slate-400">Limit Aman:</span><span className="text-emerald-500 font-bold text-lg">Rp {parseInt(dailyRemaining).toLocaleString('id-ID')}</span></div></div>)}
              </>
           )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---
const Dashboard = ({ session }) => {
  const navigate = useNavigate();
  const [fixedIncomeId, setFixedIncomeId] = useState(null); const [fixedIncome, setFixedIncome] = useState(''); const [additionalIncomes, setAdditionalIncomes] = useState([]); const [newAddName, setNewAddName] = useState(''); const [newAddAmount, setNewAddAmount] = useState(''); const [budgetPlan, setBudgetPlan] = useState(null); const [debtList, setDebtList] = useState([]); const [debtForm, setDebtForm] = useState({ name: '', amount: '', type: 'Cicilan', due_date: '', description: '' }); const [selectedItem, setSelectedItem] = useState(null); const [sinkingFunds, setSinkingFunds] = useState([]); const [newSFName, setNewSFName] = useState(''); const [newSFTarget, setNewSFTarget] = useState(''); const [newSFDate, setNewSFDate] = useState(''); const [financialGoals, setFinancialGoals] = useState([]); const [newGoalName, setNewGoalName] = useState(''); const [newGoalTarget, setNewGoalTarget] = useState(''); const [newGoalCurrent, setNewGoalCurrent] = useState(''); const [assets, setAssets] = useState([]); const [newAssetName, setNewAssetName] = useState(''); const [newAssetValue, setNewAssetValue] = useState(''); const [transactions, setTransactions] = useState([]);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (fixedIncome || additionalIncomes.length > 0 || debtList.length > 0 || sinkingFunds.length > 0 || transactions.length > 0) handleCalculate(); }, [fixedIncome, additionalIncomes, debtList, sinkingFunds, transactions]);
  useEffect(() => { if (budgetPlan) { const foodTarget = budgetPlan.allocations.makan; const foodSpent = budgetPlan.spending.makan; const foodRemaining = foodTarget - foodSpent; localStorage.setItem('DAILY_FOOD_REMAINING_TOTAL', foodRemaining); localStorage.setItem('DAILY_FOOD_TARGET_TOTAL', foodTarget); } }, [budgetPlan]);

  const fetchData = async () => {
    const { data: incomes } = await supabase.from('incomes').select('*'); if (incomes) { const fixed = incomes.find(i => i.type === 'FIXED'); if (fixed) { setFixedIncome(fixed.amount); setFixedIncomeId(fixed.id); } setAdditionalIncomes(incomes.filter(i => i.type === 'ADDITIONAL')); }
    const { data: debts } = await supabase.from('debts').select('*').order('is_paid', { ascending: true }); if (debts) setDebtList(debts); const { data: sf } = await supabase.from('sinking_funds').select('*'); if (sf) setSinkingFunds(sf); const { data: goals } = await supabase.from('financial_goals').select('*'); if (goals) setFinancialGoals(goals); const { data: ast } = await supabase.from('assets').select('*'); if (ast) setAssets(ast); const { data: trx } = await supabase.from('transactions').select('*'); if (trx) setTransactions(trx);
  };

  const handleSaveFixedIncome = async (val) => { setFixedIncome(val); if (fixedIncomeId) await supabase.from('incomes').update({ amount: val }).eq('id', fixedIncomeId); else { const { data } = await supabase.from('incomes').insert({ type: 'FIXED', name: 'Fixed Income', amount: val }).select(); if(data) setFixedIncomeId(data[0].id); }};
  const handleAddAdditional = async () => { if (!newAddName || !newAddAmount) return; await supabase.from('incomes').insert({ type: 'ADDITIONAL', name: newAddName, amount: parseInt(newAddAmount), date: new Date().toLocaleDateString() }); setNewAddName(''); setNewAddAmount(''); fetchData(); };
  const handleDeleteIncome = async (id) => { await supabase.from('incomes').delete().eq('id', id); fetchData(); };
  const handleAddDebt = async () => { if (!debtForm.name || !debtForm.amount) return; await supabase.from('debts').insert({ ...debtForm, amount: parseInt(debtForm.amount), is_paid: false }); setDebtForm({ name: '', amount: '', type: 'Cicilan', due_date: '', description: '' }); fetchData(); };
  const handleToggleDebtPaid = async (debt) => { await supabase.from('debts').update({ is_paid: !debt.is_paid }).eq('id', debt.id); fetchData(); };
  const handleDeleteDebt = async (id) => { if(window.confirm("Hapus?")) { await supabase.from('debts').delete().eq('id', id); fetchData(); }};
  const handleAddSinkingFund = async () => { if (!newSFName || !newSFTarget || !newSFDate) return; await supabase.from('sinking_funds').insert({ name: newSFName, target_amount: parseInt(newSFTarget), due_date: newSFDate }); setNewSFName(''); setNewSFTarget(''); setNewSFDate(''); fetchData(); };
  const handleDeleteSinkingFund = async (id) => { if(window.confirm("Hapus?")) { await supabase.from('sinking_funds').delete().eq('id', id); fetchData(); }};
  const handleAddGoal = async () => { if (!newGoalName || !newGoalTarget) return; await supabase.from('financial_goals').insert({ name: newGoalName, target_amount: parseInt(newGoalTarget), current_amount: parseInt(newGoalCurrent) || 0 }); setNewGoalName(''); setNewGoalTarget(''); setNewGoalCurrent(''); fetchData(); };
  const handleDeleteGoal = async (id) => { if(window.confirm("Hapus?")) { await supabase.from('financial_goals').delete().eq('id', id); fetchData(); }};
  const handleUpdateGoal = async (id, currentVal) => { const newVal = parseInt(window.prompt("Update Saldo:", currentVal)); if (!isNaN(newVal)) { await supabase.from('financial_goals').update({ current_amount: newVal }).eq('id', id); fetchData(); }};
  const handleAddAsset = async () => { if (!newAssetName || !newAssetValue) return; await supabase.from('assets').insert({ name: newAssetName, value: parseInt(newAssetValue) }); setNewAssetName(''); setNewAssetValue(''); fetchData(); };
  const handleDeleteAsset = async (id) => { if(window.confirm("Hapus Aset?")) { await supabase.from('assets').delete().eq('id', id); fetchData(); }};
  const handleCalculate = () => { const result = calculateBudget(fixedIncome, additionalIncomes, debtList, sinkingFunds, transactions); setBudgetPlan(result); };
  
  // FIX: Kembalikan fungsi click handler lama yang memanggil Modal, bukan buka kitchen langsung (kecuali lewat modal)
  const handleCardClick = (item) => { 
    let note = null; let spent = 0; 
    if (item.isSinkingFund) note = budgetPlan?.notes?.[`sf_${item.id}`]; 
    else { note = budgetPlan?.notes?.[item.key]; spent = budgetPlan?.spending?.[item.key] || 0; } 
    
    // Khusus Goal, tambahkan progress bar data
    let progress = 0;
    let goalTarget = '';
    if (item.isGoal) {
        progress = Math.min(100, Math.round((item.current_amount / item.target_amount) * 100));
        goalTarget = formatRp(item.target_amount);
    }

    setSelectedItem({ ...item, note, spent, progress, goalTarget }); 
  };
  
  const formatRp = (num) => "Rp " + parseInt(num).toLocaleString('id-ID');
  const totalAssets = assets.reduce((acc, curr) => acc + curr.value, 0) + financialGoals.reduce((acc, curr) => acc + curr.current_amount, 0); const totalLiabilities = debtList.filter(d => !d.is_paid).reduce((acc, curr) => acc + curr.amount, 0); const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="space-y-8 pb-24 md:pb-10 relative animate-fade-in">
      <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onOpenKitchen={() => navigate('/kitchen')} />
      
      {/* 1. INCOME */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-yellow-500/30 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center"><Banknote size={24} className="mr-2 text-yellow-500"/> Manajemen Pemasukan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block font-bold">Gaji Tetap (Bulanan)</label>
            <input type="number" value={fixedIncome} onBlur={(e) => handleSaveFixedIncome(e.target.value)} onChange={(e) => setFixedIncome(e.target.value)} placeholder="0" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white p-3 rounded-xl font-bold text-2xl"/>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block font-bold">Tambahan (Harian)</label>
            <div className="flex gap-2 mb-2"><input type="text" placeholder="Sumber" value={newAddName} onChange={e=>setNewAddName(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-3 text-sm text-slate-900 dark:text-white"/><input type="number" placeholder="Rp" value={newAddAmount} onChange={e=>setNewAddAmount(e.target.value)} className="w-1/3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-3 text-sm text-slate-900 dark:text-white"/><button onClick={handleAddAdditional} className="bg-emerald-500 text-white rounded px-3 font-bold"><Plus size={18}/></button></div>
            <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1">{additionalIncomes.map(inc => (<div key={inc.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-1"><span>{inc.name} ({formatRp(inc.amount)})</span><button onClick={()=>handleDeleteIncome(inc.id)}><Trash2 size={12}/></button></div>))}</div>
          </div>
        </div>
      </div>

      {/* 2. THE VAULT (KEMBALI KE ORIGINAL) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-lg">
        <h3 className="font-bold text-lg flex items-center text-emerald-600 dark:text-emerald-400 mb-4"><Lock size={20} className="mr-2"/> Brankas & Tujuan Keuangan</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Tempat menyimpan 'Surplus Overhead' dan 'Investasi'.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
           {financialGoals.map(goal => {
             const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
             return (
               <div key={goal.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group shadow-sm">
                 <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2"><div className="p-1.5 bg-white dark:bg-slate-700 rounded text-emerald-500 dark:text-emerald-400 shadow-sm"><Target size={16}/></div><p className="font-bold text-sm text-slate-700 dark:text-white truncate">{goal.name}</p></div><button onClick={() => handleDeleteGoal(goal.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></div>
                 <p className="text-2xl font-bold text-slate-800 dark:text-white mb-1 cursor-pointer hover:text-yellow-500" onClick={() => handleUpdateGoal(goal.id, goal.current_amount)} title="Klik untuk update saldo">{formatRp(goal.current_amount)}</p>
                 <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1"><span>Target: {formatRp(goal.target_amount)}</span><span>{progress}%</span></div>
                 <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
               </div>
             )
           })}
           <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-300 dark:border-slate-700 border-dashed flex flex-col justify-center space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase text-center">Buat Brankas Baru</p>
              <input type="text" placeholder="Nama" value={newGoalName} onChange={e=>setNewGoalName(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs text-center"/>
              <input type="number" placeholder="Target" value={newGoalTarget} onChange={e=>setNewGoalTarget(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs text-center"/>
              <button onClick={handleAddGoal} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded p-1.5 text-xs font-bold w-full">Simpan</button>
           </div>
        </div>
      </div>

      {/* 3. SINKING FUNDS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-lg">
        <h3 className="font-bold text-lg flex items-center text-cyan-600 dark:text-cyan-400 mb-4"><PiggyBank size={20} className="mr-2"/> Sinking Funds (Dana Tahunan)</h3>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
           <div><label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Nama Dana</label><input type="text" placeholder="Ex: Pajak" value={newSFName} onChange={e=>setNewSFName(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm"/></div>
           <div><label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Target</label><input type="number" placeholder="Rp" value={newSFTarget} onChange={e=>setNewSFTarget(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm"/></div>
           <div><label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Tempo</label><input type="date" value={newSFDate} onChange={e=>setNewSFDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:[color-scheme:dark]"/></div>
           <button onClick={handleAddSinkingFund} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded p-2 font-bold text-sm shadow-lg h-[38px]"><Plus size={18} className="mx-auto"/></button>
        </div>
        <div className="space-y-2">{sinkingFunds.map(sf => (<div key={sf.id} className="flex justify-between items-center p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"><div><p className="text-sm font-bold text-slate-800 dark:text-white">{sf.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">Target: {formatRp(sf.target_amount)} • Tempo: {sf.due_date}</p></div><button onClick={()=>handleDeleteSinkingFund(sf.id)}><Trash2 size={16} className="text-slate-400 hover:text-red-500"/></button></div>))}</div>
      </div>

      {/* 4. KEWAJIBAN */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-lg">
          <h3 className="font-bold text-lg flex items-center text-red-500 dark:text-red-400 mb-4"><Wallet size={20} className="mr-2"/> Kewajiban & Hutang</h3>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
             <div className="md:col-span-3"><input type="text" placeholder="Nama Kewajiban" value={debtForm.name} onChange={e=>setDebtForm({...debtForm, name: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm"/></div>
             <div className="md:col-span-2"><input type="number" placeholder="Rp" value={debtForm.amount} onChange={e=>setDebtForm({...debtForm, amount: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm"/></div>
             <div className="md:col-span-2"><select value={debtForm.type} onChange={e=>setDebtForm({...debtForm, type: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm"><option>Cicilan Tetap</option><option>Hutang Kas</option><option>Tagihan Wajib</option></select></div>
             <div className="md:col-span-2"><input type="text" placeholder="Tenggat" value={debtForm.due_date} onChange={e=>setDebtForm({...debtForm, due_date: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm"/></div>
             <div className="md:col-span-2"><input type="text" placeholder="Ket" value={debtForm.description} onChange={e=>setDebtForm({...debtForm, description: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm"/></div>
             <div className="md:col-span-1"><button onClick={handleAddDebt} className="w-full bg-red-500 text-white rounded p-2 font-bold shadow-lg"><Plus size={18} className="mx-auto"/></button></div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">{debtList.map(d => (<div key={d.id} className={`flex justify-between items-center p-3 rounded-xl border ${d.is_paid ? 'bg-slate-100 dark:bg-slate-900 opacity-50' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}><div className="flex items-center gap-4"><button onClick={()=>handleToggleDebtPaid(d)} className={`p-2 rounded-full ${d.is_paid ? 'text-emerald-500 bg-emerald-100 dark:bg-transparent' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}><CheckCircle size={18}/></button><div><p className={`text-sm font-bold ${d.is_paid?'line-through text-slate-500':''}`}>{d.name} <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded font-normal">{d.type}</span></p><p className="text-xs text-slate-500 dark:text-slate-400">{formatRp(d.amount)} • <span className="text-red-500 dark:text-red-400">{d.due_date}</span></p></div></div><button onClick={()=>handleDeleteDebt(d.id)}><Trash2 size={16} className="text-slate-400 hover:text-red-500"/></button></div>))}</div>
      </div>

      {/* 5. HASIL ALOKASI */}
      {budgetPlan && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 relative shadow-lg">
          <div className={`p-6 rounded-xl border flex flex-col md:flex-row items-start gap-4 mb-8 ${budgetPlan.summary.isDanger ? (budgetPlan.summary.actionNeeded === 'SELL_ASSET' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-500' : 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/50') : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/50'}`}>
              <div className={`p-3 rounded-full ${budgetPlan.summary.isDanger ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>{budgetPlan.summary.isDanger ? <Siren size={32}/> : <TrendingUp size={32}/>}</div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg uppercase ${budgetPlan.summary.isDanger ? 'text-red-600 dark:text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{budgetPlan.summary.message}</h3>
                {budgetPlan.summary.surplusLevel && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">{budgetPlan.summary.advice.map((tip, idx) => (<div key={idx} className="bg-white/50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col"><p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1">{tip.title}</p><p className="text-lg font-bold text-slate-800 dark:text-white mb-1">{formatRp(tip.amount)}</p><p className="text-[10px] text-slate-500 dark:text-slate-400 italic leading-tight">{tip.note}</p></div>))}</div>
                )}
                <div className="mt-2 text-sm text-slate-500 dark:text-slate-300 grid grid-cols-2 gap-x-4">
                   <span>Pemasukan: {formatRp(budgetPlan.summary.income)}</span>
                   <span>Kewajiban DB: {formatRp(budgetPlan.totalDebtObligation)}</span>
                   {budgetPlan.totalSinkingFundMonthly > 0 && <span className="text-cyan-600 dark:text-cyan-400">Sinking Funds: {formatRp(budgetPlan.totalSinkingFundMonthly)}</span>}
                </div>
              </div>
          </div>

          <h3 className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 font-bold flex items-center gap-2"><Calculator size={14}/> Pos Operasional (Sisa Real-Time)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             {Object.keys(budgetPlan.sinkingFundAllocations).map(key => { const sf = budgetPlan.sinkingFundAllocations[key]; return <BudgetCard key={key} label={sf.name} amount={sf.amount} color="text-cyan-600 dark:text-cyan-400" icon="🐷" onClick={() => handleCardClick({key: key, id: key, label: sf.name, amount: sf.amount, isSinkingFund: true})} /> })}
             {budgetPlan.activeDebts.map(d => (<BudgetCard key={d.id} label={d.name} amount={d.amount} color="text-red-500 dark:text-red-400" icon="🛑" onClick={() => handleCardClick({key: 'db_debt', label: d.name, amount: d.amount, isDebt: true, details: d})} />))}
             {budgetPlan.allocations.hutang_extra > 0 && <BudgetCard onClick={() => handleCardClick({key: 'hutang_extra', label: 'Pelunasan Hutang', amount: budgetPlan.allocations.hutang_extra})} label="Pelunasan Hutang" amount={budgetPlan.allocations.hutang_extra} color="text-emerald-500 dark:text-emerald-400" icon="💸" />}
             {budgetPlan.allocations.investasi > 0 && <BudgetCard onClick={() => handleCardClick({key: 'investasi', label: 'Investasi (Emas/RDPU)', amount: budgetPlan.allocations.investasi})} label="Investasi (Low Risk)" amount={budgetPlan.allocations.investasi} color="text-emerald-500 dark:text-emerald-400" icon="📈" />}
             <BudgetCard onClick={() => handleCardClick({key: 'listrik', label: 'Listrik', amount: budgetPlan.allocations.listrik})} label="Listrik" amount={budgetPlan.allocations.listrik - budgetPlan.spending.listrik} color="text-orange-500 dark:text-orange-400" icon="⚡" />
             <BudgetCard onClick={() => handleCardClick({key: 'internet', label: 'Internet', amount: budgetPlan.allocations.internet})} label="Internet" amount={budgetPlan.allocations.internet - budgetPlan.spending.internet} color="text-orange-500 dark:text-orange-400" icon="🌐" />
             <BudgetCard onClick={() => handleCardClick({key: 'infaq', label: 'Infaq & Sedekah', amount: budgetPlan.allocations.infaq})} label="Infaq & Sedekah" amount={budgetPlan.allocations.infaq - budgetPlan.spending.infaq} color={budgetPlan.allocations.infaq > 50000 ? "text-emerald-600 dark:text-emerald-400" : "text-orange-500 dark:text-orange-400"} icon="❤️" />
             <div onClick={() => handleCardClick({key: 'makan', label: 'Makan (30 Hr)', amount: budgetPlan.allocations.makan, spent: budgetPlan.spending.makan})} className="cursor-pointer p-3 rounded-xl border flex flex-col justify-between h-24 shadow-lg bg-yellow-100 border-yellow-300 dark:bg-yellow-500/10 dark:border-yellow-500/50 hover:bg-yellow-200 dark:hover:bg-yellow-500/20 transition-all group"><div className="flex justify-between items-start"><p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">Makan (Sisa)</p><ArrowRight size={14} className="text-yellow-600 dark:text-yellow-500 group-hover:translate-x-1 transition-transform"/></div><p className={`font-bold text-sm md:text-lg truncate ${budgetPlan.allocations.makan - budgetPlan.spending.makan < 0 ? 'text-red-500' : 'text-yellow-600 dark:text-yellow-400'}`}>{formatRp(budgetPlan.allocations.makan - budgetPlan.spending.makan)}</p></div>
             <BudgetCard onClick={() => handleCardClick({key: 'mobilitas', label: 'Mobilitas', amount: budgetPlan.allocations.mobilitas})} label="Mobilitas (Sisa)" amount={budgetPlan.allocations.mobilitas - budgetPlan.spending.mobilitas} color="text-blue-500 dark:text-blue-400" icon="⛽" />
             <BudgetCard onClick={() => handleCardClick({key: 'saku_sekolah', label: 'Saku Sekolah', amount: budgetPlan.allocations.saku_sekolah})} label="Saku Sekolah" amount={budgetPlan.allocations.saku_sekolah - budgetPlan.spending.saku_sekolah} color="text-purple-500 dark:text-purple-400" icon="🎓" />
             <BudgetCard onClick={() => handleCardClick({key: 'lainnya', label: 'Overhead / Lainnya', amount: budgetPlan.allocations.lainnya})} label="Overhead (Sisa)" amount={budgetPlan.allocations.lainnya - budgetPlan.spending.lainnya} color="text-emerald-500 dark:text-emerald-400" icon="📦" />
          </div>
        </div>
      )}

      {/* 6. NET WORTH */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white relative overflow-hidden shadow-lg">
         <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10"><div><h3 className="font-bold text-lg flex items-center text-purple-600 dark:text-purple-400 mb-1"><Landmark size={20} className="mr-2"/> Neraca Kekayaan</h3><p className="text-xs text-slate-500 dark:text-slate-400">Total Harta (Aset + Tabungan) dikurangi Total Hutang.</p></div><div className={`mt-4 md:mt-0 px-4 py-2 rounded-xl border flex items-center ${netWorth >= 0 ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-500/50' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-500/50'}`}><div className="text-right"><p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Kekayaan Bersih</p><p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-500 dark:text-red-400'}`}>{formatRp(netWorth)}</p></div></div></div>
         <div className="grid grid-cols-3 gap-2 text-center mb-6 text-xs md:text-sm"><div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700"><p className="text-slate-500 dark:text-slate-400 mb-1">Total Aset</p><p className="font-bold text-emerald-600 dark:text-emerald-400">{formatRp(totalAssets)}</p></div><div className="flex items-center justify-center text-slate-600 font-bold text-lg">-</div><div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700"><p className="text-slate-500 dark:text-slate-400 mb-1">Total Hutang</p><p className="font-bold text-red-500 dark:text-red-400">{formatRp(totalLiabilities)}</p></div></div>
         <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-2 items-center mb-4"><input type="text" placeholder="Nama Aset (Rumah/Emas)" value={newAssetName} onChange={e=>setNewAssetName(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm"/><input type="number" placeholder="Nilai (Rp)" value={newAssetValue} onChange={e=>setNewAssetValue(e.target.value)} className="w-1/3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm"/><button onClick={handleAddAsset} className="bg-purple-600 hover:bg-purple-500 text-white rounded p-2 font-bold shadow-lg"><Plus size={18}/></button></div>
         <div className="space-y-2">{assets.map(ast => (<div key={ast.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"><div className="flex items-center gap-3"><div className="p-2 bg-white dark:bg-slate-700 rounded text-purple-600 dark:text-purple-400 shadow-sm"><Building size={16}/></div><div><p className="text-sm font-bold text-slate-800 dark:text-white">{ast.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">Aset</p></div></div><div className="flex items-center gap-3"><span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatRp(ast.value)}</span><button onClick={()=>handleDeleteAsset(ast.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button></div></div>))}{financialGoals.map(goal => (<div key={`g-${goal.id}`} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 border-dashed"><div className="flex items-center gap-3"><div className="p-2 bg-white dark:bg-slate-700/50 rounded text-emerald-600 dark:text-emerald-400"><Lock size={16}/></div><div><p className="text-sm font-bold text-slate-500 dark:text-slate-300">{goal.name} (Brankas)</p></div></div><span className="font-mono text-emerald-600/70 dark:text-emerald-400/70 font-bold">{formatRp(goal.current_amount)}</span></div>))}</div>
      </div>
    </div>
  );
};
const BudgetCard = ({ label, amount, color, icon, onClick }) => (<div onClick={onClick} className="cursor-pointer p-3 rounded-xl border flex flex-col justify-between h-24 shadow-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all"><div className="flex justify-between items-start"><p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider truncate w-full" title={label}>{label}</p><span className="text-xs opacity-50 filter grayscale">{icon}</span></div><p className={`font-bold text-sm md:text-lg ${color} truncate`}>Rp {parseInt(amount).toLocaleString('id-ID')}</p></div>);
export default Dashboard;