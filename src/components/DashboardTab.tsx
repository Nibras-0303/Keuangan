import React, { useState } from 'react';
import { Heart, Wallet, TrendingUp, TrendingDown, Award, Calendar, Settings, Sparkles, Check, Edit3, ShieldAlert, BadgeInfo, Camera, BarChart3, Users, User, ArrowLeftRight, ArrowUpRight, ArrowDownLeft, Coins, Receipt, ShoppingBag } from 'lucide-react';
import { Account, Transaction, CoupleProfile } from '../types';
import { formatRupiah, getAccountColorClasses, getCategoryColor } from '../utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface DashboardTabProps {
  profile: CoupleProfile;
  accounts: Account[];
  transactions: Transaction[];
  allAccounts?: Account[];
  allTransactions?: Transaction[];
  onUpdateProfile: (profileData: Partial<CoupleProfile>) => Promise<void>;
  onResetDB: () => Promise<void>;
  onSelectQuickAction?: (action: 'photo' | 'finance') => void;
  financeScope?: 'bersama' | 'pribadi_nibras' | 'pribadi_zenita';
}

export default function DashboardTab({
  profile,
  accounts,
  transactions,
  allAccounts,
  allTransactions,
  onUpdateProfile,
  onResetDB,
  onSelectQuickAction,
  financeScope = 'bersama'
}: DashboardTabProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [personalReportTab, setPersonalReportTab] = useState<'nibras' | 'zenita' | 'comparison'>('comparison');
  
  // Settings Form State
  const [editUser1, setEditUser1] = useState(profile.user1);
  const [editUser2, setEditUser2] = useState(profile.user2);
  const [editAnniversary, setEditAnniversary] = useState(profile.anniversaryDate);
  const [editPasscode, setEditPasscode] = useState(profile.passcode);
  const [editBudget, setEditBudget] = useState(profile.monthlyBudget.toString());
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  // 1. Calculations
  const totalAssets = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Filter current month transactions
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthTxs = transactions.filter(tx => tx.date.startsWith(currentMonth));

  // Personal finance calculations
  const fallbackAccounts = allAccounts || accounts;
  const fallbackTransactions = allTransactions || transactions;

  // Nibras
  const nPersonalAccounts = fallbackAccounts.filter(a => a.scope === 'pribadi' && a.owner === 'Nibras');
  const nPersonalAssets = nPersonalAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const nPersonalTxs = fallbackTransactions.filter(t => t.scope === 'pribadi' && t.owner === 'Nibras' && t.date.startsWith(currentMonth));
  const nPersonalIncome = nPersonalTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const nPersonalExpense = nPersonalTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const nCatSpends: { [key: string]: number } = {};
  nPersonalTxs.filter(t => t.type === 'expense').forEach(t => {
    nCatSpends[t.category] = (nCatSpends[t.category] || 0) + t.amount;
  });
  const nSortedCats = Object.entries(nCatSpends).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Zenita
  const zPersonalAccounts = fallbackAccounts.filter(a => a.scope === 'pribadi' && a.owner === 'Zenita');
  const zPersonalAssets = zPersonalAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const zPersonalTxs = fallbackTransactions.filter(t => t.scope === 'pribadi' && t.owner === 'Zenita' && t.date.startsWith(currentMonth));
  const zPersonalIncome = zPersonalTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const zPersonalExpense = zPersonalTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const zCatSpends: { [key: string]: number } = {};
  zPersonalTxs.filter(t => t.type === 'expense').forEach(t => {
    zCatSpends[t.category] = (zCatSpends[t.category] || 0) + t.amount;
  });
  const zSortedCats = Object.entries(zCatSpends).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const getSynergyStatusMessage = () => {
    if (nPersonalExpense > zPersonalExpense && nPersonalExpense > 0) {
      return `Bulan ini Nibras jajan lebih banyak dari Zenita nih! Selisihnya ${formatRupiah(nPersonalExpense - zPersonalExpense)}. Zenita, ingatkan Nibras buat hemat ya! 😉`;
    } else if (zPersonalExpense > nPersonalExpense && zPersonalExpense > 0) {
      return `Bulan ini Zenita jajan lebih banyak dari Nibras nih! Selisihnya ${formatRupiah(zPersonalExpense - nPersonalExpense)}. Nibras sayang, jangan lupa traktir boba ya! 🧋`;
    } else if (nPersonalExpense === 0 && zPersonalExpense === 0) {
      return `Belum ada pengeluaran pribadi dari Nibras maupun Zenita bulan ini. Luar biasa hemat, teruskan pertahanan dompet ini! 🛡️`;
    } else {
      return `Wah, pengeluaran pribadi kalian berdua persis seimbang! Benar-benar sehati dalam segala hal, termasuk jajan! 💕`;
    }
  };

  const totalIncome = currentMonthTxs
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = currentMonthTxs
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Budget calculations
  const budgetRatio = profile.monthlyBudget > 0 ? (totalExpense / profile.monthlyBudget) * 100 : 0;
  
  // Determine budget warnings & cute notes
  let budgetColor = 'bg-emerald-500';
  let budgetTextColor = 'text-emerald-700';
  let budgetBg = 'bg-emerald-50';
  let budgetMessage = 'Keuangan aman! Jajan pecel lele atau boba berdua yuk! 🍢🥛';

  if (budgetRatio >= 90) {
    budgetColor = 'bg-rose-500';
    budgetTextColor = 'text-rose-700';
    budgetBg = 'bg-rose-50';
    budgetMessage = 'ALARM SIAGA! Kantong kita kritis! Stop checkout keranjang belanja dulu ya! 🚨🛒';
  } else if (budgetRatio >= 70) {
    budgetColor = 'bg-amber-500';
    budgetTextColor = 'text-amber-700';
    budgetBg = 'bg-amber-50';
    budgetMessage = 'Hemat-hemat sedikit sayang, sebentar lagi gajian kok! Semangat! 😉💪';
  }

  // Calculate Days Together
  const getDaysTogether = () => {
    try {
      const anniv = new Date(profile.anniversaryDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - anniv.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  const daysTogether = getDaysTogether();

  // Category wise spend breakdown
  const categorySpends: { [key: string]: number } = {};
  currentMonthTxs
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      categorySpends[tx.category] = (categorySpends[tx.category] || 0) + tx.amount;
    });

  const sortedCategories = Object.entries(categorySpends)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // 5 Most recent transactions
  const recentTransactions = [...(allTransactions || transactions)]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // Group transactions by month for the chart
  const fullTxList = allTransactions || transactions;
  const monthlyDataMap: { [key: string]: { income: number; expense: number } } = {};

  fullTxList.forEach(tx => {
    const monthKey = tx.date.slice(0, 7); // "YYYY-MM"
    if (!monthlyDataMap[monthKey]) {
      monthlyDataMap[monthKey] = { income: 0, expense: 0 };
    }
    if (tx.type === 'income') {
      monthlyDataMap[monthKey].income += tx.amount;
    } else if (tx.type === 'expense') {
      monthlyDataMap[monthKey].expense += tx.amount;
    }
  });

  // Convert map to array, and sort chronologically
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  let monthlyChartData = Object.entries(monthlyDataMap)
    .map(([month, data]) => {
      const [year, monthNum] = month.split('-');
      const monthName = monthNames[parseInt(monthNum, 10) - 1] || monthNum;
      return {
        month: `${monthName} ${year.slice(2)}`,
        income: data.income,
        expense: data.expense,
        rawMonth: month
      };
    })
    .sort((a, b) => a.rawMonth.localeCompare(b.rawMonth));

  // Fallback if no monthly chart data exists to prevent empty states
  if (monthlyChartData.length === 0) {
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyChartData.push({
        month: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        income: 0,
        expense: 0,
        rawMonth: mStr
      });
    }
  } else if (monthlyChartData.length < 6) {
    // Pad with previous months if we have fewer than 6 months
    const firstMonthStr = monthlyChartData[0].rawMonth;
    const [firstYear, firstMonthNum] = firstMonthStr.split('-').map(Number);
    const needed = 6 - monthlyChartData.length;
    const padded: typeof monthlyChartData = [];
    for (let i = needed; i > 0; i--) {
      const d = new Date(firstYear, firstMonthNum - 1 - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      padded.push({
        month: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        income: 0,
        expense: 0,
        rawMonth: mStr
      });
    }
    monthlyChartData = [...padded, ...monthlyChartData];
  } else {
    // Only show last 6 months
    monthlyChartData = monthlyChartData.slice(-6);
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess(false);

    if (!editUser1.trim() || !editUser2.trim()) {
      setSettingsError('Nama pasangan tidak boleh kosong!');
      return;
    }

    if (!editPasscode.trim() || editPasscode.length < 4) {
      setSettingsError('Passcode harus diisi minimal 4 karakter!');
      return;
    }

    try {
      await onUpdateProfile({
        user1: editUser1,
        user2: editUser2,
        anniversaryDate: editAnniversary,
        passcode: editPasscode,
        monthlyBudget: Number(editBudget) || 0
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2000);
    } catch (err: any) {
      setSettingsError(err.message || 'Gagal menyimpan profil');
    }
  };

  const handleResetData = async () => {
    if (confirm('⚠️ PERINGATAN KERAS!\n\nApakah kamu yakin ingin mereset seluruh database keuangan kalian kembali ke bawaan pabrik?\nTindakan ini akan menghapus semua catatan baru Anda!')) {
      await onResetDB();
      alert('Database berhasil direset.');
      window.location.reload();
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-lg text-xs space-y-1.5 font-medium">
          <p className="font-extrabold text-gray-900 mb-1">{label}</p>
          <p className="text-emerald-600 flex items-center justify-between gap-4">
            <span>Pemasukan:</span>
            <span className="font-bold">{formatRupiah(payload[0].value)}</span>
          </p>
          {payload[1] && (
            <p className="text-rose-500 flex items-center justify-between gap-4">
              <span>Pengeluaran:</span>
              <span className="font-bold">{formatRupiah(payload[1].value)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-400/20 rounded-full blur-2xl -ml-20 -mb-20"></div>

        <div className="relative space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              <span>Cinta & Keuangan</span>
            </span>
          </div>
          <h2 className="text-3xl font-black font-display tracking-tight leading-tight">
            Hai, {profile.user1} & {profile.user2}! 💕
          </h2>
          <p className="text-sm text-rose-100 max-w-md font-medium">
            Ini adalah dashboard keuangan pribadi kalian berdua. Jaga impian masa depan kalian tetap menyala dengan menabung teratur!
          </p>
        </div>

        {/* Anniversary Countdown */}
        <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4.5 self-start md:self-auto shadow-inner">
          <div className="w-12 h-12 bg-white rounded-xl text-rose-600 flex items-center justify-center font-bold shadow-sm">
            <Heart className="w-6 h-6 animate-pulse text-rose-500" fill="currentColor" />
          </div>
          <div>
            <span className="text-[10px] text-rose-100 block uppercase font-bold tracking-wider">Sudah Bersama Selama</span>
            <span className="text-2xl font-black font-display tracking-tight leading-none block mt-1">
              {daysTogether} Hari 🎉
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Assets */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Total Simpanan Uang</span>
            <span className="text-2xl font-black font-display text-gray-950 mt-1 tracking-tight block">
              {formatRupiah(totalAssets)}
            </span>
          </div>
        </div>

        {/* Month Expense */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <TrendingDown className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Pengeluaran Bulan Ini</span>
            <span className="text-2xl font-black font-display text-rose-600 mt-1 tracking-tight block">
              {formatRupiah(totalExpense)}
            </span>
          </div>
        </div>

        {/* Month Income */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Pemasukan Bulan Ini</span>
            <span className="text-2xl font-black font-display text-emerald-600 mt-1 tracking-tight block">
              {formatRupiah(totalIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* Budget & Category Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Budget Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold font-display text-gray-900 text-base">Alokasi Anggaran Belanja Bulanan</h3>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              Batas Maksimal
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-gray-400">Penggunaan Anggaran</span>
              <span className="text-base font-black text-gray-900">
                {formatRupiah(totalExpense)} <span className="text-xs text-gray-400 font-medium">dari {formatRupiah(profile.monthlyBudget)}</span>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${budgetColor}`}
                style={{ width: `${Math.min(budgetRatio, 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 font-bold">
              <span>0%</span>
              <span>{budgetRatio.toFixed(1)}% Terpakai</span>
              <span>100%</span>
            </div>
          </div>

          {/* Sweet couple notification bubble */}
          <div className={`p-4 rounded-2xl border ${budgetBg} flex items-start gap-3`}>
            <BadgeInfo className={`w-5 h-5 flex-shrink-0 mt-0.5 ${budgetTextColor}`} />
            <p className={`text-xs font-medium leading-relaxed ${budgetTextColor}`}>
              {budgetMessage}
            </p>
          </div>
        </div>

        {/* Top Category Spending Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold font-display text-gray-900 text-base flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
              <span>Pengeluaran Berdasarkan Kategori</span>
            </h3>
            <p className="text-xs text-gray-400 font-medium">Kategori belanja yang paling banyak memakan dana bulan ini.</p>
          </div>

          {sortedCategories.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 italic">
              Belum ada data pengeluaran bulan ini.
            </div>
          ) : (
            <div className="space-y-3.5">
              {sortedCategories.map(([cat, amount]) => {
                const ratio = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-gray-700">
                      <span>{cat}</span>
                      <span className="font-bold text-gray-900">{formatRupiah(amount)} ({ratio.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-50 rounded-full h-2">
                      <div
                        className="bg-rose-400 h-full rounded-full"
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 📊 Trends Chart & Recent Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recharts Monthly Chart Card - 7 columns */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col space-y-4">
          <div>
            <h3 className="font-bold font-display text-gray-900 text-base flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-rose-500" />
              <span>Tren Keuangan Bulanan</span>
            </h3>
            <p className="text-xs text-gray-400 font-medium">Perbandingan pemasukan dan pengeluaran cinta kita selama 6 bulan terakhir.</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area 
                  name="Pemasukan" 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
                <Area 
                  name="Pengeluaran" 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#f43f5e" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List Card - 5 columns */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold font-display text-gray-900 text-base flex items-center gap-2 mb-1">
              <Coins className="w-5 h-5 text-emerald-500" />
              <span>Catatan Transaksi Terakhir</span>
            </h3>
            <p className="text-xs text-gray-400 font-medium">5 aktivitas pengeluaran atau pemasukan terbaru dari kita berdua.</p>
          </div>

          <div className="divide-y divide-gray-50 flex-1 my-3 overflow-hidden">
            {recentTransactions.length === 0 ? (
              <div className="h-full flex items-center justify-center py-12 text-center text-xs text-gray-400 italic">
                Belum ada transaksi tercatat.
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';
                
                let iconBg = 'bg-rose-50 text-rose-600 border border-rose-100';
                let iconElement = <ArrowDownLeft className="w-4 h-4" />;
                if (isIncome) {
                  iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                  iconElement = <ArrowUpRight className="w-4 h-4" />;
                } else if (isTransfer) {
                  iconBg = 'bg-blue-50 text-blue-600 border border-blue-100';
                  iconElement = <ArrowLeftRight className="w-4 h-4" />;
                }

                // Format friendly date
                const txDate = new Date(tx.date);
                const formattedDate = txDate.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit'
                });

                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-4 group transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${iconBg}`}>
                        {iconElement}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {tx.notes || tx.category}
                          </p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            tx.addedBy === 'Nibras' ? 'bg-indigo-50 text-indigo-600' : 'bg-pink-50 text-pink-600'
                          }`}>
                            {tx.addedBy}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {tx.category} • {formattedDate}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-black font-display ${
                        isIncome ? 'text-emerald-600' : isTransfer ? 'text-blue-600' : 'text-rose-500'
                      }`}>
                        {isIncome ? '+' : isTransfer ? '' : '-'}{formatRupiah(tx.amount)}
                      </p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                        {tx.scope === 'pribadi' ? 'Pribadi' : 'Bersama'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="text-center pt-2">
            <span className="text-[10px] text-gray-400 font-medium">
              Gunakan tab <strong className="text-rose-500 font-bold">Transaksi</strong> untuk melihat selengkapnya atau menambahkan data.
            </span>
          </div>
        </div>
      </div>

      {/* 📊 LAPORAN SINERGI FINANSIAL PRIBADI */}
      <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="font-extrabold font-display text-gray-950 text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <span>Laporan Sinergi Finansial Pribadi 📈</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">Laporan & analisis komparatif saku pribadi Nibras vs Zenita bulan ini.</p>
          </div>

          {/* Tab buttons */}
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-100 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setPersonalReportTab('comparison')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                personalReportTab === 'comparison'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Bersanding</span>
            </button>
            <button
              type="button"
              onClick={() => setPersonalReportTab('nibras')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                personalReportTab === 'nibras'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              <span>Nibras 👨</span>
            </button>
            <button
              type="button"
              onClick={() => setPersonalReportTab('zenita')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                personalReportTab === 'zenita'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              <span>Zenita 👩</span>
            </button>
          </div>
        </div>

        {/* Tab contents */}
        {personalReportTab === 'comparison' && (
          <div className="space-y-6 animate-fade-in">
            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Compare Assets */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-gray-100 p-4.5 space-y-3 shadow-3xs">
                <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider font-semibold">Simpanan Pribadi</span>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">👨 Nibras</span>
                    <span className="text-xs font-black text-gray-900">{formatRupiah(nPersonalAssets)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">👩 Zenita</span>
                    <span className="text-xs font-black text-gray-900">{formatRupiah(zPersonalAssets)}</span>
                  </div>
                  {/* Visual comparison bar */}
                  <div className="pt-1.5">
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-indigo-400 h-full transition-all" 
                        style={{ width: `${nPersonalAssets + zPersonalAssets > 0 ? (nPersonalAssets / (nPersonalAssets + zPersonalAssets)) * 100 : 50}%` }}
                      ></div>
                      <div 
                        className="bg-pink-400 h-full transition-all" 
                        style={{ width: `${nPersonalAssets + zPersonalAssets > 0 ? (zPersonalAssets / (nPersonalAssets + zPersonalAssets)) * 100 : 50}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compare Incomes */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-gray-100 p-4.5 space-y-3 shadow-3xs">
                <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider font-semibold">Pemasukan Pribadi</span>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">👨 Nibras</span>
                    <span className="text-xs font-black text-emerald-600">{formatRupiah(nPersonalIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">👩 Zenita</span>
                    <span className="text-xs font-black text-emerald-600">{formatRupiah(zPersonalIncome)}</span>
                  </div>
                  {/* Visual comparison bar */}
                  <div className="pt-1.5">
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-indigo-400 h-full transition-all" 
                        style={{ width: `${nPersonalIncome + zPersonalIncome > 0 ? (nPersonalIncome / (nPersonalIncome + zPersonalIncome)) * 100 : 50}%` }}
                      ></div>
                      <div 
                        className="bg-pink-400 h-full transition-all" 
                        style={{ width: `${nPersonalIncome + zPersonalIncome > 0 ? (zPersonalIncome / (nPersonalIncome + zPersonalIncome)) * 100 : 50}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compare Expenses */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-gray-100 p-4.5 space-y-3 shadow-3xs">
                <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider font-semibold">Pengeluaran Pribadi</span>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">👨 Nibras</span>
                    <span className="text-xs font-black text-rose-500">{formatRupiah(nPersonalExpense)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">👩 Zenita</span>
                    <span className="text-xs font-black text-rose-500">{formatRupiah(zPersonalExpense)}</span>
                  </div>
                  {/* Visual comparison bar */}
                  <div className="pt-1.5">
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-indigo-400 h-full transition-all" 
                        style={{ width: `${nPersonalExpense + zPersonalExpense > 0 ? (nPersonalExpense / (nPersonalExpense + zPersonalExpense)) * 100 : 50}%` }}
                      ></div>
                      <div 
                        className="bg-pink-400 h-full transition-all" 
                        style={{ width: `${nPersonalExpense + zPersonalExpense > 0 ? (zPersonalExpense / (nPersonalExpense + zPersonalExpense)) * 100 : 50}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Synergy bubble */}
            <div className="bg-emerald-50/50 border border-emerald-100/75 p-4 rounded-2xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900">Catatan Sinergi Cinta Kita 💖</h4>
                <p className="text-xs text-emerald-800 font-medium leading-relaxed mt-1">
                  {getSynergyStatusMessage()}
                </p>
              </div>
            </div>
          </div>
        )}

        {personalReportTab === 'nibras' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Stats */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Saku Pribadi Nibras</span>
              </h4>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium font-semibold">Total Simpanan Uang:</span>
                  <span className="font-extrabold text-gray-950">{formatRupiah(nPersonalAssets)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium font-semibold">Pemasukan Bulan Ini:</span>
                  <span className="font-extrabold text-emerald-600">{formatRupiah(nPersonalIncome)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium font-semibold">Pengeluaran Bulan Ini:</span>
                  <span className="font-extrabold text-rose-500">{formatRupiah(nPersonalExpense)}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium font-semibold">Sisa Saku (Net):</span>
                  <span className={`font-extrabold ${nPersonalIncome - nPersonalExpense >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {formatRupiah(nPersonalIncome - nPersonalExpense)}
                  </span>
                </div>
              </div>

              {/* Wallets lists */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider font-semibold">Rekening Pribadi Nibras</span>
                {nPersonalAccounts.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Belum ada rekening pribadi Nibras yang dibuat.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {nPersonalAccounts.map(a => (
                      <div key={a.id} className="p-3 bg-white rounded-xl border border-gray-100 text-left shadow-3xs">
                        <span className="text-[10px] font-bold text-indigo-500 block truncate">{a.name}</span>
                        <span className="text-xs font-black text-gray-900 block mt-1">{formatRupiah(a.balance)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Top Pengeluaran Nibras</h4>
                {nSortedCats.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-6 text-center">Belum ada pengeluaran belanja bulan ini.</p>
                ) : (
                  <div className="space-y-3">
                    {nSortedCats.map(([cat, amount]) => {
                      const ratio = nPersonalExpense > 0 ? (amount / nPersonalExpense) * 100 : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-gray-700">
                            <span>{cat}</span>
                            <span className="font-bold text-gray-950">{formatRupiah(amount)} ({ratio.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${ratio}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="text-[11px] bg-indigo-50 text-indigo-800 p-3 rounded-xl border border-indigo-100 font-medium mt-4">
                💡 <strong>Tips Hemat Nibras:</strong> {nPersonalExpense > nPersonalIncome ? 'Wah, jajan melebihi pemasukan saku nih! Rem dikit ya Nibras!' : 'Kerja bagus! Pengeluaran saku masih sehat dan aman.'}
              </div>
            </div>
          </div>
        )}

        {personalReportTab === 'zenita' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Stats */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                <span>Saku Pribadi Zenita</span>
              </h4>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium font-semibold">Total Simpanan Uang:</span>
                  <span className="font-extrabold text-gray-950">{formatRupiah(zPersonalAssets)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium font-semibold">Pemasukan Bulan Ini:</span>
                  <span className="font-extrabold text-emerald-600">{formatRupiah(zPersonalIncome)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium font-semibold">Pengeluaran Bulan Ini:</span>
                  <span className="font-extrabold text-rose-500">{formatRupiah(zPersonalExpense)}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium font-semibold">Sisa Saku (Net):</span>
                  <span className={`font-extrabold ${zPersonalIncome - zPersonalExpense >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {formatRupiah(zPersonalIncome - zPersonalExpense)}
                  </span>
                </div>
              </div>

              {/* Wallets lists */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider font-semibold">Rekening Pribadi Zenita</span>
                {zPersonalAccounts.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Belum ada rekening pribadi Zenita yang dibuat.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {zPersonalAccounts.map(a => (
                      <div key={a.id} className="p-3 bg-white rounded-xl border border-gray-100 text-left shadow-3xs">
                        <span className="text-[10px] font-bold text-pink-500 block truncate">{a.name}</span>
                        <span className="text-xs font-black text-gray-900 block mt-1">{formatRupiah(a.balance)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Top Pengeluaran Zenita</h4>
                {zSortedCats.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-6 text-center">Belum ada pengeluaran belanja bulan ini.</p>
                ) : (
                  <div className="space-y-3">
                    {zSortedCats.map(([cat, amount]) => {
                      const ratio = zPersonalExpense > 0 ? (amount / zPersonalExpense) * 100 : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-gray-700">
                            <span>{cat}</span>
                            <span className="font-bold text-gray-950">{formatRupiah(amount)} ({ratio.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-pink-400 h-full rounded-full" style={{ width: `${ratio}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="text-[11px] bg-pink-50 text-pink-800 p-3 rounded-xl border border-pink-100 font-medium mt-4">
                💡 <strong>Tips Hemat Zenita:</strong> {zPersonalExpense > zPersonalIncome ? 'Wah, pengeluaran saku lebih besar dari pemasukan nih. Jangan lupa batasi checkout online ya Zenita!' : 'Hebat! Zenita sanggup memantau dompet dengan bijak.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Couple Profile & App Settings Toggle */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          id="btn-toggle-settings"
          onClick={() => setShowSettings(!showSettings)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-display text-gray-900 text-base">Pengaturan Ruang & Profil Pasangan</h3>
              <p className="text-xs text-gray-400 font-medium">Ubah nama panggilan, budget bulanan, atau reset data.</p>
            </div>
          </div>
          <span className="text-xs text-rose-500 font-semibold hover:underline">
            {showSettings ? 'Tutup Pengaturan' : 'Buka Pengaturan'}
          </span>
        </button>

        {showSettings && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-50 bg-gray-50/30 animate-fade-in">
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User Names */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Panggilan Kamu</label>
                  <input
                    type="text"
                    id="settings-user1"
                    value={editUser1}
                    onChange={(e) => setEditUser1(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Panggilan Pasanganmu</label>
                  <input
                    type="text"
                    id="settings-user2"
                    value={editUser2}
                    onChange={(e) => setEditUser2(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Anniversary Date */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal Jadian (Anniversary)</label>
                  <input
                    type="date"
                    id="settings-anniversary"
                    value={editAnniversary}
                    onChange={(e) => setEditAnniversary(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none"
                  />
                </div>

                {/* Monthly Budget */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Anggaran Belanja Bulanan (Rp)</label>
                  <input
                    type="number"
                    id="settings-budget"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none"
                  />
                </div>
              </div>

              {settingsError && (
                <p className="text-xs text-rose-600 font-semibold">{settingsError}</p>
              )}

              {settingsSuccess && (
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4" />
                  <span>Profil dan pengaturan berhasil diperbarui!</span>
                </p>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <button
                  type="button"
                  id="btn-factory-reset"
                  onClick={handleResetData}
                  className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Reset Database</span>
                </button>

                <button
                  type="submit"
                  id="btn-save-settings"
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-rose-500/10 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
