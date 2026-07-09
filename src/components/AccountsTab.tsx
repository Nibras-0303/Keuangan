import React, { useState } from 'react';
import { Plus, CreditCard, ArrowRightLeft, Trash2, Edit2, Check, X, Wallet, Smartphone, Sparkles, Heart } from 'lucide-react';
import { Account, AccountType } from '../types';
import { formatRupiah, getAccountIcon, getAccountColorClasses } from '../utils';

interface AccountsTabProps {
  accounts: Account[];
  allAccounts?: Account[];
  onAddOrUpdateAccount: (accountData: Partial<Account>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onAddTransfer: (transferData: {
    amount: number;
    accountId: string;
    toAccountId: string;
    notes: string;
  }) => Promise<void>;
  currentUser: string;
}

const AVAILABLE_ICONS = ['Wallet', 'CreditCard', 'Smartphone', 'Sparkles', 'Heart'];
const AVAILABLE_COLORS = ['emerald', 'blue', 'teal', 'purple', 'pink', 'orange'];

export default function AccountsTab({
  accounts,
  allAccounts,
  onAddOrUpdateAccount,
  onDeleteAccount,
  onAddTransfer,
  currentUser
}: AccountsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form State for Adding/Editing Account
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('cash');
  const [accBalance, setAccBalance] = useState('');
  const [accColor, setAccColor] = useState('blue');
  const [accIcon, setAccIcon] = useState('Wallet');
  const [accIsInvested, setAccIsInvested] = useState(false);
  const [accInvestmentCategory, setAccInvestmentCategory] = useState<'rdpu' | 'sukuk' | 'saham' | 'emas'>('rdpu');
  const [accIsSeaBank, setAccIsSeaBank] = useState(false);
  const [accSeaBankInterestRate, setAccSeaBankInterestRate] = useState('3.75');
  const [errorMessage, setErrorMessage] = useState('');

  // Form State for Transferring Funds
  const [txFromAccount, setTxFromAccount] = useState('');
  const [txToAccount, setTxToAccount] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);

  const resetAccountForm = () => {
    setAccName('');
    setAccType('cash');
    setAccBalance('');
    setAccColor('blue');
    setAccIcon('Wallet');
    setAccIsInvested(false);
    setAccInvestmentCategory('rdpu');
    setAccIsSeaBank(false);
    setAccSeaBankInterestRate('3.75');
    setEditingAccount(null);
    setErrorMessage('');
  };

  const handleEditClick = (account: Account) => {
    setEditingAccount(account);
    setAccName(account.name);
    setAccType(account.type);
    setAccBalance(account.balance.toString());
    setAccColor(account.color);
    setAccIcon(account.iconName);
    setAccIsInvested(account.isInvested || false);
    setAccInvestmentCategory(account.investmentCategory || 'rdpu');
    setAccIsSeaBank(account.isSeaBank || false);
    setAccSeaBankInterestRate((account.seaBankInterestRate || 3.75).toString());
    setShowAddModal(true);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) {
      setErrorMessage('Nama tempat simpan uang harus diisi!');
      return;
    }

    try {
      await onAddOrUpdateAccount({
        id: editingAccount?.id,
        name: accName,
        type: accType,
        balance: Number(accBalance) || 0,
        color: accColor,
        iconName: accIcon,
        isInvested: accIsInvested,
        investmentCategory: accIsInvested ? accInvestmentCategory : undefined,
        isSeaBank: accIsSeaBank,
        seaBankInterestRate: accIsSeaBank ? Number(accSeaBankInterestRate) : undefined,
        // Preserve existing accumulated if editing
        seaBankInterestAccumulated: editingAccount ? editingAccount.seaBankInterestAccumulated : 0
      });
      setShowAddModal(false);
      resetAccountForm();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data akun');
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess(false);

    if (!txFromAccount || !txToAccount) {
      setTransferError('Pilih akun asal dan akun tujuan transfer!');
      return;
    }

    if (txFromAccount === txToAccount) {
      setTransferError('Akun asal dan tujuan tidak boleh sama!');
      return;
    }

    const numAmount = Number(txAmount);
    if (!numAmount || numAmount <= 0) {
      setTransferError('Jumlah transfer harus lebih besar dari Rp 0!');
      return;
    }

    // Check balance
    const accountsToUseForTransfer = allAccounts || accounts;
    const fromAcc = accountsToUseForTransfer.find(a => a.id === txFromAccount);
    if (fromAcc && fromAcc.balance < numAmount) {
      setTransferError(`Saldo ${fromAcc.name} tidak mencukupi (Tersedia: ${formatRupiah(fromAcc.balance)})`);
      return;
    }

    try {
      await onAddTransfer({
        amount: numAmount,
        accountId: txFromAccount,
        toAccountId: txToAccount,
        notes: txNotes || `Transfer dana antar rekening`
      });
      setTransferSuccess(true);
      setTxAmount('');
      setTxNotes('');
      setTimeout(() => {
        setShowTransferModal(false);
        setTransferSuccess(false);
      }, 1000);
    } catch (err: any) {
      setTransferError(err.message || 'Gagal melakukan transfer');
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (confirm(`Apakah kamu yakin ingin menghapus tempat simpan "${name}"?`)) {
      try {
        await onDeleteAccount(id);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus tempat simpan uang.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900">Tempat Uang Disimpan (Rekening)</h2>
          <p className="text-sm text-gray-500">Kelola dompet fisik, rekening bank, maupun saldo e-wallet kalian berdua.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-open-transfer"
            onClick={() => {
              setTransferError('');
              setShowTransferModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 border border-rose-200 hover:border-rose-300 text-rose-600 font-medium rounded-xl text-sm transition-colors cursor-pointer bg-white"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer Saldo</span>
          </button>

          <button
            type="button"
            id="btn-open-add-account"
            onClick={() => {
              resetAccountForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl text-sm transition-colors shadow-sm shadow-rose-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tempat</span>
          </button>
        </div>
      </div>

      {/* Grid Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => {
          const classes = getAccountColorClasses(acc.color);
          const Icon = getAccountIcon(acc.iconName);
          return (
            <div
              key={acc.id}
              className={`rounded-3xl border ${classes.border} ${classes.bg} p-6 relative overflow-hidden flex flex-col justify-between min-h-[200px] h-auto group hover:shadow-lg hover:scale-[1.01] transition-all`}
            >
              {/* Background gradient graphic */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${classes.gradient} opacity-[0.06] rounded-bl-full pointer-events-none`}></div>
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl bg-white border ${classes.border} ${classes.text} shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base leading-tight">{acc.name}</h3>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{acc.type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    id={`btn-edit-account-${acc.id}`}
                    onClick={() => handleEditClick(acc)}
                    className="p-1.5 hover:bg-white/80 rounded-lg text-gray-500 hover:text-gray-800 transition-all border border-transparent hover:border-gray-200"
                    title="Edit Saldo/Akun"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    id={`btn-delete-account-${acc.id}`}
                    onClick={() => handleDeleteClick(acc.id, acc.name)}
                    className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-500 hover:text-rose-700 transition-all border border-transparent hover:border-rose-200"
                    title="Hapus Akun"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex-grow flex flex-col justify-end">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Saldo</p>
                  <p className="text-2xl font-black font-display text-gray-900 mt-0.5 tracking-tight">
                    {formatRupiah(acc.balance)}
                  </p>
                </div>
                
                {/* Investment and SeaBank indicators */}
                {(acc.isInvested || acc.isSeaBank) && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-gray-150/40">
                    {acc.isInvested && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                        📈 Investasi: {acc.investmentCategory === 'rdpu' ? 'RDPU' : acc.investmentCategory === 'sukuk' ? 'Sukuk' : acc.investmentCategory === 'saham' ? 'Saham' : 'Emas'}
                      </span>
                    )}
                    {acc.isSeaBank && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
                        🏦 SeaBank ({acc.seaBankInterestRate || 3.75}%)
                      </span>
                    )}
                  </div>
                )}

                {acc.isSeaBank && acc.seaBankInterestAccumulated !== undefined && acc.seaBankInterestAccumulated > 0 && (
                  <p className="text-[9px] font-extrabold text-orange-600 font-mono mt-1.5 flex items-center gap-1 bg-orange-50/50 px-1.5 py-0.5 rounded border border-orange-100/60 w-fit">
                    <span>✨ Untung Bunga:</span>
                    <span>+{formatRupiah(acc.seaBankInterestAccumulated)}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Account */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-100 shadow-2xl relative animate-slide-up">
            <button
              type="button"
              id="btn-close-account-modal"
              onClick={() => {
                setShowAddModal(false);
                resetAccountForm();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-display text-gray-900 mb-4">
              {editingAccount ? 'Edit Tempat Simpan Uang' : 'Tambah Tempat Simpan Uang'}
            </h3>

            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Tempat Simpan</label>
                <input
                  type="text"
                  id="acc-form-name"
                  placeholder="Contoh: Dompet Fisik, Bank BCA, Kantong GoPay"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tipe Akun</label>
                  <select
                    id="acc-form-type"
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as AccountType)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
                  >
                    <option value="cash">Uang Tunai (Cash)</option>
                    <option value="bank">Rekening Bank</option>
                    <option value="ewallet">E-Wallet (Gopay/OVO)</option>
                    <option value="savings">Tabungan Bersama</option>
                    <option value="other">Lain-lain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    id="acc-form-balance"
                    placeholder="0"
                    value={accBalance}
                    onChange={(e) => setAccBalance(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                  />
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pilih Warna Kartu</label>
                <div className="flex flex-wrap gap-2.5">
                  {AVAILABLE_COLORS.map(c => {
                    const sample = getAccountColorClasses(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        id={`btn-color-select-${c}`}
                        onClick={() => setAccColor(c)}
                        className={`w-8 h-8 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all ${
                          accColor === c ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent'
                        }`}
                        style={{
                          backgroundColor:
                            c === 'emerald' ? '#10b981' :
                            c === 'blue' ? '#3b82f6' :
                            c === 'teal' ? '#14b8a6' :
                            c === 'purple' ? '#a855f7' :
                            c === 'pink' ? '#ec4899' : '#f97316'
                        }}
                      >
                        {accColor === c && <Check className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pilih Ikon</label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map(i => {
                    const Icon = getAccountIcon(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        id={`btn-icon-select-${i}`}
                        onClick={() => setAccIcon(i)}
                        className={`p-3 rounded-xl border flex justify-center items-center transition-all ${
                          accIcon === i
                            ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-inner'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-gray-50/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* HUBUNGKAN KE INVESTASI & SEABANK */}
              <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-150 space-y-4">
                <span className="text-xs font-bold text-gray-700 block border-b border-gray-100 pb-1.5">🔗 Sinkronisasi Investasi & SeaBank</span>
                
                {/* Checkbox 1: Is Invested */}
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="acc-is-invested"
                    checked={accIsInvested}
                    onChange={(e) => setAccIsInvested(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500 cursor-pointer"
                  />
                  <div className="text-left">
                    <label htmlFor="acc-is-invested" className="text-xs font-extrabold text-gray-800 block cursor-pointer">Saku Investasi Aktif</label>
                    <p className="text-[10px] text-gray-500">Centang jika dana di saku ini dialokasikan penuh ke instrumen investasi syariah.</p>
                  </div>
                </div>

                {accIsInvested && (
                  <div className="pl-6 space-y-2 animate-fade-in">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pilih Instrumen Investasi Syariah</label>
                    <select
                      value={accInvestmentCategory}
                      onChange={(e) => setAccInvestmentCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs bg-white font-bold text-gray-700"
                    >
                      <option value="rdpu">🟢 RDPU Syariah (Reksadana Pasar Uang)</option>
                      <option value="sukuk">🔵 Sukuk Negara / Surat Berharga Syariah (SBSN)</option>
                      <option value="saham">🟣 Saham Syariah (Indeks JII / Blue Chip)</option>
                      <option value="emas">🟡 Emas (Fisik atau Tabungan Emas Digital)</option>
                    </select>
                  </div>
                )}

                {/* Checkbox 2: Is SeaBank */}
                <div className="flex items-start gap-2.5 border-t border-gray-150/60 pt-3">
                  <input
                    type="checkbox"
                    id="acc-is-seabank"
                    checked={accIsSeaBank}
                    onChange={(e) => setAccIsSeaBank(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500 cursor-pointer"
                  />
                  <div className="text-left">
                    <label htmlFor="acc-is-seabank" className="text-xs font-extrabold text-gray-800 block cursor-pointer">Rekening SeaBank (Bunga Harian)</label>
                    <p className="text-[10px] text-gray-500">Aktifkan untuk mensimulasikan bagi hasil/bunga SeaBank secara harian otomatis.</p>
                  </div>
                </div>

                {accIsSeaBank && (
                  <div className="pl-6 space-y-2 animate-fade-in">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Suku Bunga per Tahun (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Contoh: 3.75"
                        value={accSeaBankInterestRate}
                        onChange={(e) => setAccSeaBankInterestRate(e.target.value)}
                        className="w-full px-3 py-2 pr-8 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-bold text-gray-700"
                      />
                      <span className="absolute right-3 text-xs font-bold text-gray-400 top-1/2 -translate-y-1/2">% p.a.</span>
                    </div>
                  </div>
                )}
              </div>

              {errorMessage && (
                <p className="text-xs text-rose-600 font-semibold">{errorMessage}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  id="btn-cancel-account"
                  onClick={() => {
                    setShowAddModal(false);
                    resetAccountForm();
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-account"
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-rose-500/10 cursor-pointer"
                >
                  Simpan Tempat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transfer Funds */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-100 shadow-2xl relative animate-slide-up">
            <button
              type="button"
              id="btn-close-transfer-modal"
              onClick={() => {
                setShowTransferModal(false);
                setTxAmount('');
                setTxNotes('');
                setTransferError('');
                setTransferSuccess(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-display text-gray-900 mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-rose-500" />
              <span>Transfer Uang Antar Rekening</span>
            </h3>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              {(() => {
                const accountsToUseForTransfer = allAccounts || accounts;
                const bersamaAccountsList = accountsToUseForTransfer.filter(a => a.scope === 'bersama' || !a.scope);
                const nibrasAccountsList = accountsToUseForTransfer.filter(a => a.scope === 'pribadi' && a.owner === 'Nibras');
                const zenitaAccountsList = accountsToUseForTransfer.filter(a => a.scope === 'pribadi' && a.owner === 'Zenita');

                const selectedFromAcc = accountsToUseForTransfer.find(a => a.id === txFromAccount);
                const selectedToAcc = accountsToUseForTransfer.find(a => a.id === txToAccount);
                const isCrossScopeTransfer = selectedFromAcc && selectedToAcc && (selectedFromAcc.scope !== selectedToAcc.scope || selectedFromAcc.owner !== selectedToAcc.owner);

                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pindahkan Dari</label>
                        <select
                          id="tx-transfer-from"
                          value={txFromAccount}
                          onChange={(e) => setTxFromAccount(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
                        >
                          <option value="">-- Pilih Asal --</option>
                          {bersamaAccountsList.length > 0 && (
                            <optgroup label="✨ Keuangan Bersama">
                              {bersamaAccountsList.map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({formatRupiah(a.balance)})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {nibrasAccountsList.length > 0 && (
                            <optgroup label="👨 Pribadi Nibras">
                              {nibrasAccountsList.map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({formatRupiah(a.balance)})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {zenitaAccountsList.length > 0 && (
                            <optgroup label="👩 Pribadi Zenita">
                              {zenitaAccountsList.map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({formatRupiah(a.balance)})
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pindahkan Ke</label>
                        <select
                          id="tx-transfer-to"
                          value={txToAccount}
                          onChange={(e) => setTxToAccount(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
                        >
                          <option value="">-- Pilih Tujuan --</option>
                          {bersamaAccountsList.length > 0 && (
                            <optgroup label="✨ Keuangan Bersama">
                              {bersamaAccountsList.map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({formatRupiah(a.balance)})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {nibrasAccountsList.length > 0 && (
                            <optgroup label="👨 Pribadi Nibras">
                              {nibrasAccountsList.map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({formatRupiah(a.balance)})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {zenitaAccountsList.length > 0 && (
                            <optgroup label="👩 Pribadi Zenita">
                              {zenitaAccountsList.map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({formatRupiah(a.balance)})
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    </div>

                    {isCrossScopeTransfer && (
                      <div className="text-[11px] bg-rose-50 text-rose-700 p-3 rounded-xl border border-rose-100 font-medium leading-relaxed animate-fade-in">
                        ✨ <strong>Sinergi Keuangan:</strong> Kamu sedang memindahkan saldo lintas dompet ({selectedFromAcc?.name} → {selectedToAcc?.name}). Transaksi ini akan tercatat rapi secara berpasangan!
                      </div>
                    )}
                  </>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Jumlah Transfer (Rp)</label>
                <input
                  type="number"
                  id="tx-transfer-amount"
                  placeholder="0"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Catatan / Keterangan</label>
                <input
                  type="text"
                  id="tx-transfer-notes"
                  placeholder="Contoh: Top up jajan bulanan"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              {transferError && (
                <p className="text-xs text-rose-600 font-semibold">{transferError}</p>
              )}

              {transferSuccess && (
                <p className="text-xs text-emerald-600 font-semibold animate-pulse">🎉 Transfer berhasil disinkronkan!</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  id="btn-cancel-transfer"
                  onClick={() => {
                    setShowTransferModal(false);
                    setTxAmount('');
                    setTxNotes('');
                    setTransferError('');
                    setTransferSuccess(false);
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-transfer"
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-rose-500/10 cursor-pointer"
                >
                  Kirim Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
