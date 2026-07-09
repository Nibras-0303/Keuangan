import { useState, useEffect } from 'react';
import { Heart, Landmark, Coins, FileText, LayoutDashboard, User, LogOut, Loader2, Sparkles, Camera, LayoutGrid, TrendingUp } from 'lucide-react';
import { DatabaseSchema, Account, Transaction, Receipt, CoupleProfile } from './types';
import { supabase } from './lib/supabase';
import SupabaseAuth from './components/SupabaseAuth';
import PasscodeGate from './components/PasscodeGate';
import DashboardTab from './components/DashboardTab';
import AccountsTab from './components/AccountsTab';
import TransactionsTab from './components/TransactionsTab';
import ReceiptScannerTab from './components/ReceiptScannerTab';
import GalleryTab from './components/GalleryTab';
import PersonalFinanceTab from './components/PersonalFinanceTab';
import InvestmentTab from './components/InvestmentTab';

type TabType = 'dashboard' | 'accounts' | 'transactions' | 'scanner' | 'gallery' | 'investment';

export default function App() {
  const [dbData, setDbData] = useState<DatabaseSchema | null>(null);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [appMode, setAppMode] = useState<'selection' | 'finance' | 'gallery'>('selection');
  const [financeScope, setFinanceScope] = useState<'bersama' | 'pribadi_nibras' | 'pribadi_zenita'>('bersama');
  const [showFinanceSelector, setShowFinanceSelector] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoOpenUpload, setAutoOpenUpload] = useState(false);
  const [autoOpenTransaction, setAutoOpenTransaction] = useState(false);

  const handleSelectQuickAction = (action: 'photo' | 'finance') => {
    if (action === 'photo') {
      setAppMode('gallery');
      setActiveTab('gallery');
      setAutoOpenUpload(true);
    } else if (action === 'finance') {
      setFinanceScope('bersama');
      setAppMode('finance');
      setActiveTab('transactions');
      setAutoOpenTransaction(true);
    }
  };

  // 1. Load initial data from Express backend API
  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Gagal mengambil data dari server');
      const data = await res.json();
      setDbData(data);
      
      // Auto-load login session if persisted in session
      const savedUser = sessionStorage.getItem('kitapunya_user');
      if (savedUser) {
        setCurrentUser(savedUser);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Koneksi ke server terputus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
    // Poll the backend silently every 6 seconds to show live SeaBank interest and tickers ticking in real-time!
    const interval = setInterval(() => {
      fetch('/api/data')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Sync failed');
        })
        .then(data => {
          setDbData(prev => {
            if (!prev) return data;
            // Retain some local states if needed, but usually full sync is perfect
            return data;
          });
        })
        .catch(err => console.warn('Silent sync failed:', err));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // 2. Auth state initialization
  useEffect(() => {
    setAuthLoading(false);
  }, []);

  // 3. Authentication handlers
  const handleLoginSuccess = (selectedUser: string) => {
    setCurrentUser(selectedUser);
    sessionStorage.setItem('kitapunya_user', selectedUser);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setCurrentUser(null);
    setSession(null);
    sessionStorage.removeItem('kitapunya_user');
  };

  // 3. Backend API Communicators

  // Update Profile
  const handleUpdateProfile = async (profileData: Partial<CoupleProfile>) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (!res.ok) throw new Error('Gagal memperbarui profil');
      const updated = await res.json();
      setDbData(prev => prev ? { ...prev, profile: updated.profile } : null);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan');
      throw err;
    }
  };

  // Create or Update customized Account (Tempat Simpan Uang)
  const handleAddOrUpdateAccount = async (accountData: Partial<Account>) => {
    try {
      const finalAccountData = {
        ...accountData,
        scope: accountData.id ? accountData.scope : (financeScope === 'bersama' ? 'bersama' : 'pribadi'),
        owner: accountData.id ? accountData.owner : (financeScope === 'pribadi_nibras' ? 'Nibras' : financeScope === 'pribadi_zenita' ? 'Zenita' : '')
      };

      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalAccountData)
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal menyimpan tempat simpan uang');
      }
      const updated = await res.json();
      setDbData(prev => prev ? { ...prev, accounts: updated.accounts } : null);
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  // Delete Account
  const handleDeleteAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal menghapus tempat simpan uang');
      }
      const updated = await res.json();
      setDbData(prev => prev ? { ...prev, accounts: updated.accounts } : null);
    } catch (err: any) {
      throw err;
    }
  };

  // Add Income / Expense Transaction
  const handleAddTransaction = async (txData: Partial<Transaction>) => {
    try {
      const finalTxData = {
        ...txData,
        scope: financeScope === 'bersama' ? 'bersama' : 'pribadi',
        owner: financeScope === 'pribadi_nibras' ? 'Nibras' : financeScope === 'pribadi_zenita' ? 'Zenita' : ''
      };

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalTxData)
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal menambah transaksi');
      }
      const updated = await res.json();
      
      // Update local state with latest accounts and transactions
      setDbData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          accounts: updated.accounts,
          transactions: [...prev.transactions, updated.transaction]
        };
      });
    } catch (err: any) {
      throw err;
    }
  };

  // Delete Transaction (restores associated account balance)
  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal menghapus transaksi');
      }
      const updated = await res.json();
      setDbData(prev => prev ? { 
        ...prev, 
        accounts: updated.accounts, 
        transactions: updated.transactions 
      } : null);
    } catch (err: any) {
      throw err;
    }
  };

  // Transfer funds between wallets
  const handleAddTransfer = async (transferData: {
    amount: number;
    accountId: string;
    toAccountId: string;
    notes: string;
  }) => {
    try {
      const fromAcc = dbData?.accounts.find(a => a.id === transferData.accountId);
      const toAcc = dbData?.accounts.find(a => a.id === transferData.toAccountId);
      
      let finalScope: 'bersama' | 'pribadi' = 'bersama';
      let finalOwner = '';
      
      if (fromAcc && toAcc) {
        if (fromAcc.scope === 'pribadi' && toAcc.scope === 'pribadi') {
          finalScope = 'pribadi';
          finalOwner = fromAcc.owner || toAcc.owner || '';
        } else {
          // If either is "bersama", it belongs to the joint/bersama ledger
          finalScope = 'bersama';
        }
      } else {
        finalScope = financeScope === 'bersama' ? 'bersama' : 'pribadi';
        finalOwner = financeScope === 'pribadi_nibras' ? 'Nibras' : financeScope === 'pribadi_zenita' ? 'Zenita' : '';
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'transfer',
          amount: transferData.amount,
          accountId: transferData.accountId,
          toAccountId: transferData.toAccountId,
          category: 'Transfer',
          notes: transferData.notes,
          addedBy: currentUser || 'Nibras',
          scope: finalScope,
          owner: finalOwner
        })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal transfer saldo');
      }
      const updated = await res.json();
      setDbData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          accounts: updated.accounts,
          transactions: [...prev.transactions, updated.transaction]
        };
      });
    } catch (err: any) {
      throw err;
    }
  };

  // Send photo to Gemini for scanning total amount and extraction
  const handleScanReceipt = async (imageBase64: string): Promise<Receipt> => {
    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          addedBy: currentUser || 'Nibras'
        })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal memindai struk');
      }
      const result = await res.json();
      
      // Update local receipts list
      setDbData(prev => {
        if (!prev) return null;
        // Check if receipt already in state
        const exists = prev.receipts.some(r => r.id === result.receipt.id);
        if (exists) return prev;
        return {
          ...prev,
          receipts: [...prev.receipts, result.receipt]
        };
      });

      return result.receipt;
    } catch (err: any) {
      throw err;
    }
  };

  // Saves a parsed receipt as an logged expense transaction
  const handleSaveReceiptAsTransaction = async (txData: {
    amount: number;
    accountId: string;
    category: string;
    date: string;
    notes: string;
    receiptId: string;
  }) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          amount: txData.amount,
          accountId: txData.accountId,
          category: txData.category,
          date: txData.date,
          notes: txData.notes,
          receiptId: txData.receiptId,
          addedBy: currentUser || 'Nibras',
          scope: financeScope === 'bersama' ? 'bersama' : 'pribadi',
          owner: financeScope === 'pribadi_nibras' ? 'Nibras' : financeScope === 'pribadi_zenita' ? 'Zenita' : ''
        })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal menyimpan transaksi struk');
      }
      const updated = await res.json();

      // Update local state (accounts, transactions, and update the receipt status to 'saved')
      setDbData(prev => {
        if (!prev) return null;
        const updatedReceipts = prev.receipts.map(rc => {
          if (rc.id === txData.receiptId) {
            return { ...rc, status: 'saved' as const };
          }
          return rc;
        });
        return {
          ...prev,
          accounts: updated.accounts,
          transactions: [...prev.transactions, updated.transaction],
          receipts: updatedReceipts
        };
      });
    } catch (err: any) {
      throw err;
    }
  };

  // Delete scanned receipt from logs
  const handleDeleteReceipt = async (id: string) => {
    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus struk');
      setDbData(prev => prev ? { 
        ...prev, 
        receipts: prev.receipts.filter(r => r.id !== id) 
      } : null);
    } catch (err: any) {
      throw err;
    }
  };

  // Save photo to gallery
  const handleAddPhoto = async (photoData: { imageUrl: string; caption: string; date: string }) => {
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: photoData.imageUrl,
          caption: photoData.caption,
          date: photoData.date,
          addedBy: currentUser || 'Nibras'
        })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal menyimpan foto');
      }
      const updated = await res.json();
      setDbData(prev => prev ? { ...prev, photos: updated.photos } : null);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan foto');
      throw err;
    }
  };

  // Delete photo from gallery
  const handleDeletePhoto = async (id: string) => {
    try {
      const res = await fetch(`/api/photos/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus foto');
      const updated = await res.json();
      setDbData(prev => prev ? { ...prev, photos: updated.photos } : null);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus foto');
      throw err;
    }
  };

  // Reset database back to factory seed
  const handleResetDB = async () => {
    try {
      const res = await fetch('/api/data/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Gagal mereset database');
      const result = await res.json();
      setDbData(result.data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 4. Render Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto animate-spin" />
          <h2 className="text-xl font-bold font-display text-gray-800 animate-pulse">Menghubungkan Ruang Kita...</h2>
          <p className="text-sm text-gray-400">Sedang memuat catatan keuangan cinta kita berdua.</p>
        </div>
      </div>
    );
  }

  // 5. Render Connection Error state
  if (error || !dbData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md border border-rose-100 shadow-xl text-center space-y-4">
          <Heart className="w-12 h-12 text-rose-300 mx-auto animate-bounce" />
          <h2 className="text-xl font-bold font-display text-gray-800">Ups, Server Tertidur</h2>
          <p className="text-sm text-gray-500">
            Koneksi ke server keuangan KitaPunya terputus. Silakan klik tombol di bawah untuk menyegarkan halaman.
          </p>
          <button
            type="button"
            id="btn-retry-connection"
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Segarkan Halaman
          </button>
        </div>
      </div>
    );
  }

  // 6. Render Profile Gate (No password/passcode needed)
  if (!currentUser) {
    return (
      <PasscodeGate
        user1={dbData.profile.user1}
        user2={dbData.profile.user2}
        onSuccess={handleLoginSuccess}
      />
    );
  }

  // 7. Render Authentic Main Workspace Dashboard
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      {/* Aesthetic Top Navigation Bar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-rose-500 text-white rounded-xl flex items-center justify-center font-black shadow-sm">
              <Heart className="w-5 h-5" fill="currentColor" />
            </div>
            <div>
              <span className="font-black font-display text-lg tracking-tight text-gray-900 block leading-none">KitaPunya</span>
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-0.5 block leading-none">
                {appMode === 'gallery' ? 'Ruang Kenangan 💖' : appMode === 'finance' ? (financeScope === 'bersama' ? 'Keuangan Bersama 💸' : financeScope === 'pribadi_nibras' ? 'Saku Pribadi Nibras 👨' : 'Saku Pribadi Zenita 👩') : 'Portal Bersama 💕'}
              </span>
            </div>
          </div>

          {/* User Session Badge, Menu Back, and Logout */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {appMode !== 'selection' && (
              <button
                type="button"
                id="btn-back-to-selection"
                onClick={() => setAppMode('selection')}
                className="p-2 sm:p-2.5 px-3 sm:px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer border border-rose-100 shadow-2xs"
                title="Kembali ke Menu Utama"
              >
                <LayoutGrid className="w-4 h-4 text-rose-500" />
                <span>Menu Utama</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-rose-500" />
                <span>Profil: {currentUser}</span>
              </span>
            </div>

            <button
              type="button"
              id="btn-logout"
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-gray-200"
              title="Keluar / Ganti Akun"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Ganti Akun</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* APP MODE: 1 SCREEN PORTAL SELECTION */}
        {appMode === 'selection' && (
          <div className="max-w-4xl mx-auto space-y-8 py-4 sm:py-8 animate-fade-in" id="portal-selector">
            
            {/* Header / Intro inside selection */}
            <div className="text-center space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold border border-rose-100">
                <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Ruang Bersama KitaPunya</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-black font-display text-gray-900 tracking-tight leading-none">
                Pilih Ruang Aktivitas Anda 💕
              </h2>
              <p className="text-sm text-gray-500 max-w-xl mx-auto font-medium">
                Selamat datang kembali, <strong className="text-rose-600 font-extrabold">{currentUser}</strong>! Ke mana kita akan melangkah hari ini bersama pasangan tercinta?
              </p>
            </div>

            {/* Immersive 2 Choice Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              
              {/* Card 1: Ruang Kenangan (Galeri Foto) */}
              <button
                type="button"
                id="portal-card-gallery"
                onClick={() => {
                  setAppMode('gallery');
                  setActiveTab('gallery');
                }}
                className="group relative bg-white hover:bg-rose-50/20 border-2 border-rose-100 hover:border-rose-400 p-8 rounded-3xl text-left shadow-xs hover:shadow-xl hover:-translate-y-1 active:scale-98 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[340px]"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
                
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <Camera className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-extrabold font-display text-gray-900 leading-tight">Ruang Kenangan</h3>
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md uppercase">Galeri Foto</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Unggah, simpan, dan nikmati momen-momen manis berdua dalam kualitas foto maksimal. Tanggal foto dideteksi otomatis secara instan dari metadata file tanpa perlu repot!
                    </p>
                  </div>

                  {/* Highlight feature list */}
                  <div className="space-y-2 bg-rose-50/50 p-4 rounded-xl border border-rose-100/30 text-xs font-bold text-rose-700">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>Putar Kenangan Acak & Kata Romantis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>Deteksi Tanggal Otomatis (Anti Ribet)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 w-full flex items-center justify-between text-rose-600 font-extrabold text-sm border-t border-rose-50/80">
                  <span>Masuk Ruang Kenangan ✨</span>
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 group-hover:translate-x-1.5 transition-transform">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </div>
                </div>
              </button>

              {/* Card 2: Keuangan Bersama (Dompet Couple) */}
              <button
                type="button"
                id="portal-card-finance"
                onClick={() => {
                  setShowFinanceSelector(true);
                }}
                className="group relative bg-white hover:bg-emerald-50/20 border-2 border-emerald-100 hover:border-emerald-400 p-8 rounded-3xl text-left shadow-xs hover:shadow-xl hover:-translate-y-1 active:scale-98 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[340px]"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
                
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                    <Coins className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-extrabold font-display text-gray-900 leading-tight">Keuangan Bersama</h3>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md uppercase">Finansial</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Kelola rekening bersama secara transparan, catat pemasukan & pengeluaran belanja berdua, pantau sisa budget bulanan, serta unggah struk belanja pintar.
                    </p>
                  </div>

                  {/* Highlight feature list */}
                  <div className="space-y-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/30 text-xs font-bold text-emerald-700">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Pantau Budget & Target Bulanan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Scan Struk Otomatis (Receipt Scanner)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 w-full flex items-center justify-between text-emerald-600 font-extrabold text-sm border-t border-emerald-50/80">
                  <span>Mulai Catat Keuangan 💰</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:translate-x-1.5 transition-transform">
                    <Landmark className="w-4 h-4" />
                  </div>
                </div>
              </button>

            </div>
          </div>
        )}

        {/* Finance Selector Dialog Overlay */}
        {showFinanceSelector && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl p-6 sm:p-8 max-w-md w-full relative animate-slide-up">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-3">
                  <Coins className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-extrabold font-display text-gray-900">Pilih Akses Keuangan 💸</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  Mau mengelola dana bersama atau dompet pribadi? Pilih di bawah untuk memulai.
                </p>
              </div>

              {/* Selection list */}
              <div className="space-y-3.5">
                {/* 1. Keuangan Bersama */}
                <button
                  type="button"
                  onClick={() => {
                    setFinanceScope('bersama');
                    setAppMode('finance');
                    setActiveTab('dashboard');
                    setShowFinanceSelector(false);
                  }}
                  className="w-full group p-4 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100/50 hover:to-teal-100/50 border border-emerald-100 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-3xs"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                    💖
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5 leading-snug">
                      <span>Keuangan Bersama Kita</span>
                      <span className="text-[9px] bg-emerald-200 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Joint</span>
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium truncate">
                      Rekening berdua, sisa budget, dan pengeluaran belanja pasangan.
                    </p>
                  </div>
                </button>

                {/* 2. Keuangan Pribadi Nibras */}
                <button
                  type="button"
                  onClick={() => {
                    setFinanceScope('pribadi_nibras');
                    setAppMode('finance');
                    setActiveTab('dashboard');
                    setShowFinanceSelector(false);
                  }}
                  className="w-full group p-4 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100/50 hover:to-pink-100/50 border border-rose-100 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-3xs"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                    👨
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5 leading-snug">
                      <span>Keuangan Pribadi Nibras</span>
                      <span className="text-[9px] bg-rose-200 text-rose-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Nibras</span>
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium truncate">
                      Akses dompet pribadi, transaksi, dan kantong simpanan khusus Nibras.
                    </p>
                  </div>
                </button>

                {/* 3. Keuangan Pribadi Zenita */}
                <button
                  type="button"
                  onClick={() => {
                    setFinanceScope('pribadi_zenita');
                    setAppMode('finance');
                    setActiveTab('dashboard');
                    setShowFinanceSelector(false);
                  }}
                  className="w-full group p-4 bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100/50 hover:to-rose-100/50 border border-pink-100 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-3xs"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                    👩
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5 leading-snug">
                      <span>Keuangan Pribadi Zenita</span>
                      <span className="text-[9px] bg-pink-200 text-pink-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Zenita</span>
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium truncate">
                      Akses dompet pribadi, transaksi, dan kantong simpanan khusus Zenita.
                    </p>
                  </div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowFinanceSelector(false)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* APP MODE: FINANCE WORKSPACE */}
        {appMode === 'finance' && (() => {
          const filteredAccounts = dbData.accounts.filter(a => {
            if (financeScope === 'bersama') {
              return a.scope === 'bersama' || !a.scope;
            } else if (financeScope === 'pribadi_nibras') {
              return a.scope === 'pribadi' && a.owner === 'Nibras';
            } else {
              return a.scope === 'pribadi' && a.owner === 'Zenita';
            }
          });

          const filteredTransactions = dbData.transactions.filter(t => {
            if (financeScope === 'bersama') {
              return t.scope === 'bersama' || !t.scope;
            } else if (financeScope === 'pribadi_nibras') {
              return t.scope === 'pribadi' && t.owner === 'Nibras';
            } else {
              return t.scope === 'pribadi' && t.owner === 'Zenita';
            }
          });

          if (financeScope === 'pribadi_nibras' || financeScope === 'pribadi_zenita') {
            const owner = financeScope === 'pribadi_nibras' ? 'Nibras' : 'Zenita';
            return (
              <div className="animate-fade-in focus-target-container">
                <PersonalFinanceTab
                  owner={owner}
                  accounts={filteredAccounts}
                  transactions={filteredTransactions}
                  allAccounts={dbData.accounts}
                  onAddOrUpdateAccount={handleAddOrUpdateAccount}
                  onDeleteAccount={handleDeleteAccount}
                  onAddTransaction={handleAddTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  onAddTransfer={handleAddTransfer}
                  currentUser={currentUser}
                  onGoBack={() => setAppMode('selection')}
                  onSwitchScope={(scope) => setFinanceScope(scope)}
                />
              </div>
            );
          }

          return (
            <>
              {/* Scope Switcher Banner */}
              <div className="max-w-4xl mx-auto bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-100 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/10 shrink-0">
                    💖
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-gray-900 leading-tight">
                        Keuangan Bersama Kita
                      </h4>
                      <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Bersama
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      Menampilkan rekening bersama, budget belanja bulanan, dan pengeluaran berdua.
                    </p>
                  </div>
                </div>
                
                <div className="text-right hidden md:block">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                    💡 Gunakan tombol <strong>Menu Utama</strong> di atas untuk berpindah saku
                  </span>
                </div>
              </div>

              {/* Responsive Tab Bar (Bento Menu) - Filtered to Finance only */}
              <nav className="grid grid-cols-2 md:grid-cols-5 gap-1.5 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-xs max-w-4xl mx-auto">
                <button
                  type="button"
                  id="tab-dashboard"
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>

                <button
                  type="button"
                  id="tab-accounts"
                  onClick={() => setActiveTab('accounts')}
                  className={`py-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'accounts'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span className="hidden sm:inline">Rekening</span>
                </button>

                <button
                  type="button"
                  id="tab-transactions"
                  onClick={() => setActiveTab('transactions')}
                  className={`py-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'transactions'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span className="hidden sm:inline">Catat Manual</span>
                </button>

                <button
                  type="button"
                  id="tab-scanner"
                  onClick={() => setActiveTab('scanner')}
                  className={`py-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'scanner'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan Struk</span>
                </button>

                <button
                  type="button"
                  id="tab-investment"
                  onClick={() => setActiveTab('investment')}
                  className={`py-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer col-span-2 md:col-span-1 ${
                    activeTab === 'investment'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Investasi</span>
                </button>
              </nav>

              {/* Dynamic Inner Views for Finance */}
              <div className="focus-target-container">
                {activeTab === 'dashboard' && (
                  <DashboardTab
                    profile={dbData.profile}
                    accounts={filteredAccounts}
                    transactions={filteredTransactions}
                    allAccounts={dbData.accounts}
                    allTransactions={dbData.transactions}
                    onUpdateProfile={handleUpdateProfile}
                    onResetDB={handleResetDB}
                    onSelectQuickAction={handleSelectQuickAction}
                    financeScope={financeScope}
                  />
                )}

                {activeTab === 'accounts' && (
                  <AccountsTab
                    accounts={filteredAccounts}
                    allAccounts={dbData.accounts}
                    onAddOrUpdateAccount={handleAddOrUpdateAccount}
                    onDeleteAccount={handleDeleteAccount}
                    onAddTransfer={handleAddTransfer}
                    currentUser={currentUser}
                  />
                )}

                {activeTab === 'transactions' && (
                  <TransactionsTab
                    transactions={filteredTransactions}
                    accounts={filteredAccounts}
                    onAddTransaction={handleAddTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    currentUser={currentUser}
                    autoOpenAddModal={autoOpenTransaction}
                    onResetAutoOpen={() => setAutoOpenTransaction(false)}
                  />
                )}

                {activeTab === 'scanner' && (
                  <ReceiptScannerTab
                    receipts={dbData.receipts}
                    accounts={filteredAccounts}
                    onScanReceipt={handleScanReceipt}
                    onSaveReceiptAsTransaction={handleSaveReceiptAsTransaction}
                    onDeleteReceipt={handleDeleteReceipt}
                    currentUser={currentUser}
                  />
                )}

                {activeTab === 'investment' && (
                  <InvestmentTab 
                    accounts={dbData?.accounts || []}
                    onAddTransaction={handleAddTransaction}
                    currentUser={currentUser || 'Nibras'}
                  />
                )}
              </div>
            </>
          );
        })()}

        {/* APP MODE: IMMERSIVE GALLERY WORKSPACE */}
        {appMode === 'gallery' && (
          <div className="focus-target-container animate-fade-in">
            <GalleryTab
              photos={dbData.photos}
              onAddPhoto={handleAddPhoto}
              onDeletePhoto={handleDeletePhoto}
              currentUser={currentUser}
              autoOpenUploadModal={autoOpenUpload}
              onResetAutoOpen={() => setAutoOpenUpload(false)}
            />
          </div>
        )}
      </main>

      {/* Decorative Warm Footnote */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center">
        <p className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1">
          <span>Dibuat dengan penuh rasa sayang 💖 untuk mimpi masa depan bersama</span>
        </p>
      </footer>
    </div>
  );
}
