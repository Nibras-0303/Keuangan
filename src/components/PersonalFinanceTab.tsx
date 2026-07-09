import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowLeftRight, 
  Sparkles, 
  ArrowLeft, 
  Search, 
  CreditCard, 
  Smartphone, 
  Coins, 
  Landmark, 
  AlertCircle,
  PiggyBank,
  Check,
  Calendar
} from 'lucide-react';
import { Account, Transaction, AccountType, TransactionType } from '../types';
import { formatRupiah, getAccountIcon, TRANSACTION_CATEGORIES, getCategoryColor } from '../utils';
import InvestmentTab from './InvestmentTab';

interface PersonalFinanceTabProps {
  owner: 'Nibras' | 'Zenita';
  accounts: Account[];
  transactions: Transaction[];
  allAccounts: Account[];
  onAddOrUpdateAccount: (accountData: Partial<Account>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onAddTransaction: (txData: Partial<Transaction>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onAddTransfer: (transferData: {
    amount: number;
    accountId: string;
    toAccountId: string;
    notes: string;
  }) => Promise<void>;
  currentUser: string | null;
  onGoBack: () => void;
  onSwitchScope: (scope: 'bersama' | 'pribadi_nibras' | 'pribadi_zenita') => void;
}

export default function PersonalFinanceTab({
  owner,
  accounts,
  transactions,
  allAccounts,
  onAddOrUpdateAccount,
  onDeleteAccount,
  onAddTransaction,
  onDeleteTransaction,
  onAddTransfer,
  currentUser,
  onGoBack,
  onSwitchScope
}: PersonalFinanceTabProps) {
  // Theme & Color styling
  const isNibras = owner === 'Nibras';
  
  // Tab within Personal Finance: cashflow (wallet/records) vs. investment
  const [activeSubTab, setActiveSubTab] = useState<'cashflow' | 'investment'>('cashflow');
  
  // Theme Colors
  const theme = {
    primary: isNibras ? 'indigo' : 'rose',
    accent: isNibras ? 'blue' : 'pink',
    primaryBg: isNibras ? 'bg-indigo-600' : 'bg-rose-500',
    primaryHover: isNibras ? 'hover:bg-indigo-700' : 'hover:bg-rose-600',
    accentBg: isNibras ? 'bg-blue-500' : 'bg-pink-500',
    lightBg: isNibras ? 'bg-indigo-50/60' : 'bg-rose-50/60',
    lightBorder: isNibras ? 'border-indigo-100' : 'border-rose-100',
    lightText: isNibras ? 'text-indigo-800' : 'text-rose-800',
    ring: isNibras ? 'focus:ring-indigo-500' : 'focus:ring-rose-500',
    gradient: isNibras ? 'from-indigo-600 to-blue-700' : 'from-rose-500 to-pink-600',
    badge: isNibras ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800',
    walletCard: isNibras ? 'from-indigo-500/10 to-indigo-600/5' : 'from-rose-500/10 to-pink-600/5',
    walletBorder: isNibras ? 'border-indigo-100/70' : 'border-rose-100/70',
    avatar: isNibras ? '👨' : '👩',
  };

  // Form State - Quick Transaction
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState(''); // Only for transfer
  const [category, setCategory] = useState('Makanan');
  const [notes, setNotes] = useState('');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [txSuccessMsg, setTxSuccessMsg] = useState('');
  const [txErrorMsg, setTxErrorMsg] = useState('');

  // Form State - New Wallet (Account)
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<AccountType>('cash');
  const [walletBalance, setWalletBalance] = useState('');
  const [walletColor, setWalletColor] = useState('emerald');
  const [walletIcon, setWalletIcon] = useState('Wallet');
  const [isSubmittingWallet, setIsSubmittingWallet] = useState(false);
  const [walletErrorMsg, setWalletErrorMsg] = useState('');

  // Search State for Transactions
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');

  // Calculations
  const totalAssets = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
  const totalIncome = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Filtered recent transactions for display
  const filteredTxs = transactions
    .filter(tx => {
      // Search Match
      const searchMatch = tx.notes.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.category.toLowerCase().includes(searchQuery.toLowerCase());
      // Type Match
      const typeMatch = filterType === 'all' || tx.type === filterType;
      
      return searchMatch && typeMatch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Handle transaction submission
  const handleSubmitTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxErrorMsg('');
    setTxSuccessMsg('');

    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      setTxErrorMsg('Masukkan nominal transaksi yang valid.');
      return;
    }

    if (!selectedAccountId) {
      setTxErrorMsg('Pilih dompet / rekening asal terlebih dahulu.');
      return;
    }

    if (txType === 'transfer' && !targetAccountId) {
      setTxErrorMsg('Pilih dompet / rekening tujuan transfer.');
      return;
    }

    if (txType === 'transfer' && selectedAccountId === targetAccountId) {
      setTxErrorMsg('Dompet asal dan tujuan tidak boleh sama.');
      return;
    }

    try {
      setIsSubmittingTx(true);

      if (txType === 'transfer') {
        await onAddTransfer({
          amount: numericAmount,
          accountId: selectedAccountId,
          toAccountId: targetAccountId,
          notes: notes.trim() || `Transfer dari ${accounts.find(a => a.id === selectedAccountId)?.name} ke ${allAccounts.find(a => a.id === targetAccountId)?.name}`
        });
        setTxSuccessMsg('Transfer saku berhasil dicatat! 💸');
      } else {
        await onAddTransaction({
          type: txType,
          amount: numericAmount,
          accountId: selectedAccountId,
          category,
          date: customDate,
          notes: notes.trim() || (txType === 'income' ? 'Pemasukan Saku' : 'Pengeluaran Saku'),
          addedBy: currentUser || owner
        });
        setTxSuccessMsg(txType === 'income' ? 'Pemasukan berhasil dicatat! 🟢' : 'Pengeluaran berhasil dicatat! 🔴');
      }

      // Reset transaction form
      setAmount('');
      setNotes('');
      setTimeout(() => setTxSuccessMsg(''), 3000);
    } catch (err: any) {
      setTxErrorMsg(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  // Handle Wallet submission
  const handleSubmitWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalletErrorMsg('');

    if (!walletName.trim()) {
      setWalletErrorMsg('Nama dompet / rekening wajib diisi.');
      return;
    }

    const numericBalance = parseFloat(walletBalance.replace(/[^0-9]/g, '')) || 0;

    try {
      setIsSubmittingWallet(true);
      await onAddOrUpdateAccount({
        name: walletName.trim(),
        type: walletType,
        balance: numericBalance,
        color: walletColor,
        iconName: walletIcon,
        scope: 'pribadi',
        owner: owner
      });

      // Reset Form
      setWalletName('');
      setWalletBalance('');
      setWalletColor('emerald');
      setWalletIcon('Wallet');
      setShowAddWallet(false);
    } catch (err: any) {
      setWalletErrorMsg(err.message || 'Gagal membuat dompet baru.');
    } finally {
      setIsSubmittingWallet(false);
    }
  };

  const handleDeleteWalletWithCheck = async (id: string, name: string) => {
    if (confirm(`⚠️ Hapus Dompet "${name}"?\n\nTindakan ini akan menghapus dompet dan catatan saldo terkait dompet ini.`)) {
      try {
        await onDeleteAccount(id);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus dompet');
      }
    }
  };

  const getIconForType = (type: AccountType) => {
    switch (type) {
      case 'cash': return <Coins className="w-4 h-4 text-emerald-500" />;
      case 'bank': return <Landmark className="w-4 h-4 text-indigo-500" />;
      case 'ewallet': return <Smartphone className="w-4 h-4 text-teal-500" />;
      case 'savings': return <PiggyBank className="w-4 h-4 text-pink-500" />;
      default: return <Wallet className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Top Banner */}
      <div className={`bg-gradient-to-r ${theme.gradient} rounded-3xl p-6 text-white shadow-xl relative overflow-hidden`}>
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-xl -ml-16 -mb-16"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>Dompet Saku Pribadi</span>
              </span>
              <span className="bg-white/35 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Sangat Praktis ✨
              </span>
            </div>
            
            <h2 className="text-3xl font-black font-display tracking-tight leading-tight flex items-center gap-2">
              <span>Saku {owner}</span>
              <span className="text-2xl">{theme.avatar}</span>
            </h2>
            <p className="text-xs text-white/85 max-w-md font-medium leading-relaxed">
              Catat uang saku jajan, kopi, dan dompet pribadi milik {owner} secara rapi dan instan di sini.
            </p>
          </div>

          {/* Balance Block */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4.5 border border-white/15 shadow-inner self-start md:self-auto min-w-[200px]">
            <span className="text-[10px] text-white/80 block uppercase font-bold tracking-wider">Total Saldo Saku Saya</span>
            <span className="text-2xl font-black font-display tracking-tight mt-1 block">
              {formatRupiah(totalAssets)}
            </span>
          </div>
        </div>

        {/* Quick Menu switcher tabs (Separate screen simulation) */}
        <div className="relative mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={onGoBack}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/10 shadow-3xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Menu Utama</span>
          </button>

          <div className="flex p-1 bg-white/10 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveSubTab('cashflow')}
              className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'cashflow'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Dompet & Arus Kas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('investment')}
              className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'investment'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Investasi Saya 📈</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Column Workspace */}
      {activeSubTab === 'cashflow' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN LEFT: QUICK ACTION LOG & MY WALLETS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick Entry Form (Catat Cepat - LEBIH PRAKTIS) */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                  <span className="w-2 h-4 rounded-xs bg-rose-500"></span>
                  Catat Transaksi Instan ⚡
                </h3>
                <p className="text-[11px] text-gray-400 font-medium">Log pengeluaran atau pemasukan saku kamu dalam sekali tekan.</p>
              </div>
            </div>

            {/* Quick transaction selector buttons */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-50 border border-gray-100 rounded-2xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setTxType('expense');
                  setCategory('Makanan');
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  txType === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Pengeluaran</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTxType('income');
                  setCategory('Lainnya');
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  txType === 'income'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Pemasukan</span>
              </button>
              <button
                type="button"
                onClick={() => setTxType('transfer')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  txType === 'transfer'
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Transfer Saku</span>
              </button>
            </div>

            <form onSubmit={handleSubmitTx} className="space-y-4">
              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Nominal Rupiah (Rp)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4.5 font-extrabold text-gray-400 text-sm">Rp</span>
                  <input
                    type="text"
                    required
                    value={amount}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                      if (cleanVal) {
                        setAmount(new Intl.NumberFormat('id-ID').format(parseInt(cleanVal)));
                      } else {
                        setAmount('');
                      }
                    }}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-150 rounded-2xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-mono font-black text-lg text-gray-900"
                  />
                </div>
              </div>

              {/* Wallet Selectors (From & To) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    {txType === 'transfer' ? 'Dari Rekening/Dompet' : 'Dompet / Rekening'}
                  </label>
                  <select
                    required
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">-- Pilih Rekening --</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({formatRupiah(acc.balance)})</option>
                    ))}
                  </select>
                </div>

                {txType === 'transfer' ? (
                  /* Target Account selector for Transfer */
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Kirim ke Rekening/Dompet</label>
                    <select
                      required
                      value={targetAccountId}
                      onChange={(e) => setTargetAccountId(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">-- Pilih Rekening --</option>
                      {/* Can transfer to ALL of their own personal accounts */}
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatRupiah(acc.balance)})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  /* Standard Category Selector */
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Kategori Belanja</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
                    >
                      {TRANSACTION_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Note / Caption (simplified and practical) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Keterangan / Catatan Singkat</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Beli kopi, jajan boba, dll..."
                    className="w-full p-3.5 bg-gray-50 border border-gray-150 rounded-2xl focus:bg-white text-xs font-medium outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Tanggal Transaksi</label>
                  <div className="relative flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-150 rounded-2xl focus:bg-white text-xs font-bold outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Error & Success Messages */}
              {txErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-2 text-xs font-bold animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <span>{txErrorMsg}</span>
                </div>
              )}

              {txSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-center gap-2 text-xs font-bold">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{txSuccessMsg}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmittingTx}
                className={`w-full py-3.5 ${txType === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : txType === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600'} disabled:bg-gray-200 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs`}
              >
                {isSubmittingTx ? 'Mencatat...' : `Simpan Catatan ${txType === 'transfer' ? 'Transfer' : txType === 'income' ? 'Pemasukan' : 'Pengeluaran'} ✨`}
              </button>
            </form>
          </div>

          {/* Wallets & Pocket Accounts Grid */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                  <span className="w-2 h-4 rounded-xs bg-emerald-500"></span>
                  Pilihan Dompet Saku saya 💼
                </h3>
                <p className="text-[11px] text-gray-400 font-medium">Rekening bank, e-wallet, atau saku tunai khusus kamu.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddWallet(!showAddWallet)}
                className={`px-3 py-1.5 bg-${theme.primary}-50 hover:bg-${theme.primary}-100 text-${theme.primary}-600 rounded-xl text-xs font-bold border border-${theme.primary}-200/50 cursor-pointer flex items-center gap-1 transition-colors`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddWallet ? 'Sembunyikan' : 'Tambah Dompet'}</span>
              </button>
            </div>

            {/* Inline Add Wallet Form */}
            {showAddWallet && (
              <div className={`p-4 rounded-2xl border ${theme.lightBorder} bg-${theme.primary}-50/35 mb-4 space-y-4 animate-slide-up`}>
                <h4 className="text-xs font-bold text-gray-800">✨ Tambah Dompet Baru</h4>
                <form onSubmit={handleSubmitWallet} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600">Nama Dompet / Rekening</label>
                      <input
                        type="text"
                        required
                        value={walletName}
                        onChange={(e) => setWalletName(e.target.value)}
                        placeholder="Contoh: BCA Pribadi, Tunai, Gopay"
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-rose-400 focus:border-rose-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600">Jenis Saku</label>
                      <select
                        value={walletType}
                        onChange={(e) => setWalletType(e.target.value as AccountType)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none"
                      >
                        <option value="cash">💵 Tunai / Cash</option>
                        <option value="bank">🏦 Bank Transfer</option>
                        <option value="ewallet">📱 Dompet Digital / E-Wallet</option>
                        <option value="savings">🐷 Kantong Tabungan</option>
                        <option value="other">📦 Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600">Saldo Awal (Rp)</label>
                      <input
                        type="text"
                        value={walletBalance}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setWalletBalance(val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '');
                        }}
                        placeholder="0"
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600">Aksen Warna Kartu</label>
                      <div className="flex items-center gap-1.5 pt-1.5">
                        {['emerald', 'blue', 'teal', 'purple', 'pink', 'orange'].map(col => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => {
                              setWalletColor(col);
                              // Assign reasonable icon names based on color defaults
                              if (col === 'emerald') setWalletIcon('Wallet');
                              else if (col === 'blue') setWalletIcon('CreditCard');
                              else if (col === 'teal') setWalletIcon('Smartphone');
                              else if (col === 'pink') setWalletIcon('PiggyBank');
                            }}
                            className={`w-6 h-6 rounded-full transition-all border-2 ${
                              col === 'emerald' ? 'bg-emerald-500' :
                              col === 'blue' ? 'bg-blue-500' :
                              col === 'teal' ? 'bg-teal-500' :
                              col === 'purple' ? 'bg-purple-500' :
                              col === 'pink' ? 'bg-pink-500' : 'bg-orange-500'
                            } ${walletColor === col ? 'scale-115 border-gray-900 shadow-xs' : 'border-transparent hover:scale-105'}`}
                          ></button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {walletErrorMsg && (
                    <p className="text-[10px] text-red-500 font-bold">{walletErrorMsg}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddWallet(false)}
                      className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingWallet}
                      className={`px-3 py-1.5 ${theme.primaryBg} ${theme.primaryHover} text-white rounded-lg text-[10px] font-bold transition-all`}
                    >
                      {isSubmittingWallet ? 'Menambahkan...' : 'Simpan Dompet 💼'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {accounts.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 italic bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                Kamu belum membuat dompet pribadi. Buat sekarang dengan menekan tombol 'Tambah Dompet'.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {accounts.map(acc => (
                  <div 
                    key={acc.id} 
                    className={`p-4 bg-gradient-to-br ${theme.walletCard} border ${theme.walletBorder} rounded-2xl text-left relative flex items-center justify-between shadow-2xs group hover:shadow-xs transition-all`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-3xs flex items-center justify-center border border-gray-100 shrink-0">
                        {getIconForType(acc.type)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-gray-900 block truncate leading-snug">{acc.name}</span>
                        <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md uppercase tracking-wide block mt-1 w-max">
                          {acc.type === 'cash' ? 'Tunai' : acc.type === 'bank' ? 'Bank' : acc.type === 'ewallet' ? 'E-Wallet' : 'Tabungan'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0 pl-2">
                      <span className="text-sm font-black text-gray-950 font-mono tracking-tight">{formatRupiah(acc.balance)}</span>
                      {/* Delete Wallet Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteWalletWithCheck(acc.id, acc.name)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-md transition-all cursor-pointer mt-1"
                        title="Hapus dompet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN RIGHT: RECENT LEDGER TRANSACTIONS (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Laporan Cepat Ringkasan */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs grid grid-cols-2 gap-4">
            <div className="bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-2xl text-left">
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">Pemasukan Bulan Ini</span>
              <span className="text-base font-black text-emerald-600 block font-mono mt-1.5">+{formatRupiah(totalIncome)}</span>
            </div>

            <div className="bg-rose-50/50 border border-rose-100/50 p-4 rounded-2xl text-left">
              <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider block">Pengeluaran Bulan Ini</span>
              <span className="text-base font-black text-rose-600 block font-mono mt-1.5">-{formatRupiah(totalExpense)}</span>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs flex flex-col h-[525px]">
            <div className="mb-4">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                <span className="w-2 h-4 rounded-xs bg-indigo-500"></span>
                Riwayat Catatan Saku 📅
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">Semua pengeluaran & pemasukan pribadi yang tercatat.</p>
            </div>

            {/* Filter & Search Bar */}
            <div className="space-y-2 mb-3 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari transaksi saku..."
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-150 rounded-xl focus:bg-white text-xs outline-none transition-all"
                />
              </div>

              {/* Type Filter Pill selectors */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                {(['all', 'expense', 'income', 'transfer'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold shrink-0 border capitalize cursor-pointer transition-colors ${
                      filterType === type
                        ? 'bg-gray-900 border-gray-900 text-white shadow-3xs'
                        : 'bg-white border-gray-150 text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {type === 'all' ? 'Semua' : type === 'expense' ? 'Pengeluaran' : type === 'income' ? 'Pemasukan' : 'Transfer'}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable list of transactions */}
            <div className="flex-grow overflow-y-auto space-y-2.5 pr-1 text-left">
              {filteredTxs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 italic py-12">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-2 border border-gray-100">
                    🔍
                  </div>
                  <span className="text-xs">Tidak ada transaksi saku yang ditemukan</span>
                </div>
              ) : (
                filteredTxs.map(tx => {
                  const sourceAcc = allAccounts.find(a => a.id === tx.accountId);
                  const targetAcc = tx.toAccountId ? allAccounts.find(a => a.id === tx.toAccountId) : null;

                  return (
                    <div 
                      key={tx.id} 
                      className="p-3 bg-gray-50/60 hover:bg-gray-50 border border-gray-150 rounded-xl flex items-center justify-between gap-3 group transition-all"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        {/* Circle Indicator */}
                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold border ${
                          tx.type === 'income' 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                            : tx.type === 'expense'
                              ? 'bg-rose-50 border-rose-100 text-rose-500'
                              : 'bg-blue-50 border-blue-100 text-blue-500'
                        }`}>
                          {tx.type === 'income' ? '↙' : tx.type === 'expense' ? '↗' : '⇄'}
                        </div>

                        <div className="min-w-0">
                          {/* Note / notes */}
                          <span className="text-xs font-extrabold text-gray-900 block truncate leading-tight">
                            {tx.notes}
                          </span>
                          
                          {/* Wallet & Date row */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[9px] font-bold text-gray-400">
                            <span className="text-gray-500 underline decoration-gray-200">
                              {tx.type === 'transfer' 
                                ? `${sourceAcc?.name} ➔ ${targetAcc?.name}` 
                                : sourceAcc?.name || 'Dompet Saku'}
                            </span>
                            <span>•</span>
                            <span>{tx.date}</span>
                            {tx.type !== 'transfer' && (
                              <>
                                <span>•</span>
                                <span className={`px-1 rounded-sm uppercase tracking-wide ${getCategoryColor(tx.category)}`}>
                                  {tx.category}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right action & amount */}
                      <div className="text-right flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-black font-mono tracking-tight ${
                          tx.type === 'income' 
                            ? 'text-emerald-600' 
                            : tx.type === 'expense' 
                              ? 'text-rose-600' 
                              : 'text-blue-600'
                        }`}>
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                          {formatRupiah(tx.amount)}
                        </span>

                        {/* Quick Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Hapus catatan transaksi saku ini? Saldo dompet akan disesuaikan otomatis.')) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-md transition-all cursor-pointer"
                          title="Hapus transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
      ) : (
        <div className="animate-fade-in">
          <InvestmentTab
            accounts={allAccounts}
            onAddTransaction={onAddTransaction}
            currentUser={currentUser || owner}
            lockedScope={owner === 'Nibras' ? 'pribadi_nibras' : 'pribadi_zenita'}
          />
        </div>
      )}
    </div>
  );
}
