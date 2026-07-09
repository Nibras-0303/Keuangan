import React, { useState } from 'react';
import { Plus, Search, Filter, Trash2, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, X, Calendar, User, Tag } from 'lucide-react';
import { Transaction, Account } from '../types';
import { formatRupiah, TRANSACTION_CATEGORIES, getCategoryColor } from '../utils';

interface TransactionsTabProps {
  transactions: Transaction[];
  accounts: Account[];
  onAddTransaction: (txData: Partial<Transaction>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  currentUser: string;
  autoOpenAddModal?: boolean;
  onResetAutoOpen?: () => void;
}

export default function TransactionsTab({
  transactions,
  accounts,
  onAddTransaction,
  onDeleteTransaction,
  currentUser,
  autoOpenAddModal,
  onResetAutoOpen
}: TransactionsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txAccount, setTxAccount] = useState('');
  const [txCategory, setTxCategory] = useState('Makanan');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');
  const [txError, setTxError] = useState('');

  // Filters State
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const resetForm = () => {
    setTxType('expense');
    setTxAmount('');
    setTxAccount(accounts[0]?.id || '');
    setTxCategory('Makanan');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxNotes('');
    setTxError('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Listen for automatic trigger to open modal from dashboard launcher
  React.useEffect(() => {
    if (autoOpenAddModal) {
      handleOpenAddModal();
      if (onResetAutoOpen) {
        onResetAutoOpen();
      }
    }
  }, [autoOpenAddModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError('');

    const numAmount = Number(txAmount);
    if (!numAmount || numAmount <= 0) {
      setTxError('Jumlah uang harus lebih besar dari Rp 0!');
      return;
    }

    if (!txAccount) {
      setTxError('Pilih salah satu tempat simpan uang (rekening)!');
      return;
    }

    // Check account balance for expenses
    if (txType === 'expense') {
      const selectedAcc = accounts.find(a => a.id === txAccount);
      if (selectedAcc && selectedAcc.balance < numAmount) {
        setTxError(`Saldo tidak mencukupi di ${selectedAcc.name} (Tersedia: ${formatRupiah(selectedAcc.balance)})`);
        return;
      }
    }

    try {
      await onAddTransaction({
        type: txType,
        amount: numAmount,
        accountId: txAccount,
        category: txCategory,
        date: txDate,
        notes: txNotes,
        addedBy: currentUser
      });
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setTxError(err.message || 'Gagal menambahkan transaksi');
    }
  };

  const handleDelete = async (id: string, type: string, amount: number) => {
    const typeLabel = type === 'income' ? 'pemasukan' : type === 'expense' ? 'pengeluaran' : 'transfer';
    if (confirm(`Apakah kamu yakin ingin menghapus catatan ${typeLabel} sebesar ${formatRupiah(amount)}?\n\nSaldo rekening terkait akan dipulihkan secara otomatis!`)) {
      try {
        await onDeleteTransaction(id);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus transaksi');
      }
    }
  };

  // Filter & Search Logic
  const filteredTransactions = transactions
    .filter(tx => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (filterAccount !== 'all' && tx.accountId !== filterAccount && tx.toAccountId !== filterAccount) return false;
      
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesNotes = tx.notes.toLowerCase().includes(term);
        const matchesCategory = tx.category.toLowerCase().includes(term);
        const matchesUser = tx.addedBy.toLowerCase().includes(term);
        return matchesNotes || matchesCategory || matchesUser;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900">Catatan Transaksi Keuangan</h2>
          <p className="text-sm text-gray-500">Catat pemasukan dan pengeluaran harian kalian agar tetap terkontrol.</p>
        </div>

        <button
          type="button"
          id="btn-open-add-transaction"
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-rose-500/10 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Catatan Keuangan</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            id="input-tx-search"
            placeholder="Cari keterangan, kategori, pembuat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filter Type */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <span>Tipe:</span>
          </div>
          <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50/50">
            {['all', 'income', 'expense', 'transfer'].map(type => (
              <button
                key={type}
                type="button"
                id={`btn-filter-type-${type}`}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors ${
                  filterType === type
                    ? 'bg-white text-gray-800 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {type === 'all' ? 'Semua' : type === 'income' ? 'Masuk' : type === 'expense' ? 'Keluar' : 'Transfer'}
              </button>
            ))}
          </div>

          {/* Filter Account */}
          <select
            id="select-filter-account"
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold bg-white focus:outline-none"
          >
            <option value="all">Semua Rekening</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-rose-300" />
            <p className="font-semibold text-gray-600">Belum ada catatan transaksi</p>
            <p className="text-xs text-gray-400 mt-1">Coba sesuaikan filter atau tambah catatan keuangan pertama kalian!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/40 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">Transaksi</th>
                  <th className="py-4 px-6">Kategori</th>
                  <th className="py-4 px-6">Keterangan</th>
                  <th className="py-4 px-6">Rekening</th>
                  <th className="py-4 px-6">Pembuat</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredTransactions.map(tx => {
                  const sourceAcc = accounts.find(a => a.id === tx.accountId);
                  const targetAcc = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId) : null;

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-gray-500 font-medium whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {tx.type === 'income' ? (
                            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                              <ArrowUpRight className="w-4 h-4" />
                            </span>
                          ) : tx.type === 'expense' ? (
                            <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                              <ArrowDownLeft className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center font-bold">
                              <ArrowLeftRight className="w-4 h-4" />
                            </span>
                          )}
                          <span className={`font-black text-base tracking-tight ${
                            tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-rose-600' : 'text-stone-700'
                          }`}>
                            {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                            {formatRupiah(tx.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryColor(tx.category)}`}>
                          <Tag className="w-3 h-3 opacity-60" />
                          <span>{tx.category}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-700 max-w-xs truncate" title={tx.notes}>
                        {tx.notes || '-'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {tx.type === 'transfer' ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                            <span className="bg-gray-100 px-2 py-1 rounded-md">{sourceAcc?.name || 'Unknown'}</span>
                            <span className="text-gray-400">→</span>
                            <span className="bg-gray-100 px-2 py-1 rounded-md">{targetAcc?.name || 'Unknown'}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                            {sourceAcc?.name || 'Rekening Tidak Ditemukan'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full font-bold">
                          <User className="w-3 h-3" />
                          <span>{tx.addedBy}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          id={`btn-delete-tx-${tx.id}`}
                          onClick={() => handleDelete(tx.id, tx.type, tx.amount)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus / Batalkan Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add Income/Expense */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-100 shadow-2xl relative animate-slide-up">
            <button
              type="button"
              id="btn-close-tx-modal"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-display text-gray-900 mb-4">
              Tambah Catatan Keuangan Baru
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switch */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tipe Catatan</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 border border-gray-100 rounded-xl">
                  <button
                    type="button"
                    id="btn-tx-type-expense"
                    onClick={() => {
                      setTxType('expense');
                      setTxCategory('Makanan');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      txType === 'expense'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    💸 Pengeluaran (Keluar)
                  </button>
                  <button
                    type="button"
                    id="btn-tx-type-income"
                    onClick={() => {
                      setTxType('income');
                      setTxCategory('Gaji Bulanan');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      txType === 'income'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    💰 Pemasukan (Masuk)
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Jumlah Uang (Rupiah)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold text-gray-400">Rp</span>
                  <input
                    type="number"
                    id="input-tx-amount"
                    placeholder="0"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-bold"
                  />
                </div>
              </div>

              {/* Account and Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pilih Rekening</label>
                  <select
                    id="select-tx-account"
                    value={txAccount}
                    onChange={(e) => setTxAccount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
                  >
                    <option value="">-- Pilih --</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatRupiah(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal</label>
                  <input
                    type="date"
                    id="input-tx-date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2.2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kategori</label>
                {txType === 'expense' ? (
                  <select
                    id="select-tx-category"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
                  >
                    {TRANSACTION_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    id="select-tx-category-income"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
                  >
                    <option value="Gaji Bulanan">💰 Gaji Bulanan</option>
                    <option value="Investasi">📈 Investasi</option>
                    <option value="Hadiah / Bonus">🎁 Hadiah / Bonus</option>
                    <option value="Uang Jajan">🍿 Uang Jajan tambahan</option>
                    <option value="Lainnya">🧩 Lainnya</option>
                  </select>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Keterangan / Catatan</label>
                <input
                  type="text"
                  id="input-tx-notes"
                  placeholder="Contoh: Belanja mingguan di Alfamart"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              {txError && (
                <p className="text-xs text-rose-600 font-semibold">{txError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  id="btn-cancel-tx"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-tx"
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-rose-500/10 cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
