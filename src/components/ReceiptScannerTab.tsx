import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, RefreshCw, ShoppingBag, Eye, Trash2, Calendar, Landmark, Coins, Tag, Plus, CheckCircle, X } from 'lucide-react';
import { Receipt, Account } from '../types';
import { formatRupiah, TRANSACTION_CATEGORIES } from '../utils';

interface ReceiptScannerTabProps {
  receipts: Receipt[];
  accounts: Account[];
  onScanReceipt: (imageBase64: string) => Promise<Receipt>;
  onSaveReceiptAsTransaction: (txData: {
    amount: number;
    accountId: string;
    category: string;
    date: string;
    notes: string;
    receiptId: string;
  }) => Promise<void>;
  onDeleteReceipt: (id: string) => Promise<void>;
  currentUser: string;
}

export default function ReceiptScannerTab({
  receipts,
  accounts,
  onScanReceipt,
  onSaveReceiptAsTransaction,
  onDeleteReceipt,
  currentUser
}: ReceiptScannerTabProps) {
  const [dragActive, setDragActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState('');
  
  // Scanned Preview Modal State
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Form State for saving receipt as expense
  const [payAccount, setPayAccount] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editCategory, setEditCategory] = useState('Jajan');
  const [editDate, setEditDate] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cycling scanning messages for friendly UX
  const startScanningMessageCycle = () => {
    const messages = [
      'Menghubungkan ke Gemini AI untuk analisis gambar... 💖',
      'Membaca total keuangan dan nama toko... 🧐',
      'Mengekstrak rincian barang dan harganya... 🧾',
      'Mencocokkan kategori pengeluaran yang tepat... ✨',
      'Hampir selesai! Menghitung kebenaran matematika struk... ☕'
    ];
    let idx = 0;
    setScanMessage(messages[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setScanMessage(messages[idx]);
    }, 2500);
    return interval;
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScanError('Format file harus berupa gambar (PNG, JPG, JPEG)');
      return;
    }

    setScanning(true);
    setScanError('');
    const interval = startScanningMessageCycle();

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        try {
          const newReceipt = await onScanReceipt(base64data);
          clearInterval(interval);
          setScanning(false);
          
          // Open preview modal immediately to review and save
          openReceiptPreview(newReceipt);
        } catch (err: any) {
          clearInterval(interval);
          setScanning(false);
          setScanError(err.message || 'Gagal memproses struk belanja. Pastikan API Key di Secrets benar.');
        }
      };
    } catch (err: any) {
      clearInterval(interval);
      setScanning(false);
      setScanError('Gagal membaca gambar nota');
    }
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const openReceiptPreview = (rc: Receipt) => {
    setActiveReceipt(rc);
    setEditMerchant(rc.merchantName);
    setEditTotal(rc.totalAmount.toString());
    setEditCategory('Jajan');
    setEditDate(rc.date);
    
    // Auto-select Belanja Bersama joint account or default to the first available joint account
    const defaultAccount = accounts.find(a => a.name.toLowerCase().includes('belanja bersama') || a.id === 'acc_4') || accounts[0];
    setPayAccount(defaultAccount?.id || '');
    
    setSaveError('');
    setSaveSuccess(false);
    setShowPreviewModal(true);
  };

  const handleSaveAsExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    if (!activeReceipt) return;

    if (!payAccount) {
      setSaveError('Pilih rekening pembayaran terlebih dahulu!');
      return;
    }

    const finalAmount = Number(editTotal);
    if (!finalAmount || finalAmount <= 0) {
      setSaveError('Jumlah pengeluaran harus lebih besar dari Rp 0!');
      return;
    }

    // Verify account balance
    const payAcc = accounts.find(a => a.id === payAccount);
    if (payAcc && payAcc.balance < finalAmount) {
      setSaveError(`Saldo ${payAcc.name} tidak mencukupi (Tersedia: ${formatRupiah(payAcc.balance)})`);
      return;
    }

    try {
      await onSaveReceiptAsTransaction({
        amount: finalAmount,
        accountId: payAccount,
        category: editCategory,
        date: editDate,
        notes: `Nota ${editMerchant}` + (activeReceipt.items.length > 0 ? ` (${activeReceipt.items.length} item)` : ''),
        receiptId: activeReceipt.id
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setShowPreviewModal(false);
        setSaveSuccess(false);
      }, 1000);
    } catch (err: any) {
      setSaveError(err.message || 'Gagal menyimpan transaksi');
    }
  };

  const handleDeleteReceipt = async (id: string, name: string) => {
    if (confirm(`Hapus catatan struk "${name}" dari riwayat?`)) {
      try {
        await onDeleteReceipt(id);
      } catch (err: any) {
        alert('Gagal menghapus struk');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900">Pindai Foto Nota Otomatis (AI Scanner)</h2>
        <p className="text-sm text-gray-500">Unggah foto struk belanjaanmu. AI Gemini akan otomatis menghitung total belanjaan dan rincian barangnya!</p>
      </div>

      {/* Upload Zone & Loading States */}
      {scanning ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-80 animate-pulse">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
            <FileText className="w-8 h-8 text-rose-500 absolute inset-0 m-auto animate-bounce" />
          </div>
          <h3 className="text-lg font-bold font-display text-gray-900">Sedang Menganalisis...</h3>
          <p className="text-sm text-gray-500 max-w-sm mt-2 font-medium text-rose-600 animate-pulse">
            {scanMessage}
          </p>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-3 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-64 ${
            dragActive
              ? 'border-rose-500 bg-rose-50/50 scale-[1.01]'
              : 'border-rose-200 hover:border-rose-400 bg-white hover:shadow-md'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="input-file-receipt"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 shadow-inner">
            <Upload className="w-6 h-6 animate-pulse" />
          </div>

          <h3 className="text-base font-bold font-display text-gray-900">
            Tarik & Lepaskan atau Klik untuk Unggah Nota
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Mendukung file gambar PNG, JPG, JPEG. Sempurna untuk struk belanja supermarket, makan malam, bioskop, atau bon belanjaan berdua.
          </p>

          {scanError && (
            <div className="mt-4 flex items-center gap-1.5 bg-rose-50 text-rose-700 px-4 py-2 rounded-xl text-xs font-semibold border border-rose-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{scanError}</span>
            </div>
          )}
        </div>
      )}

      {/* Receipts Logs List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-display text-gray-900">Riwayat Unggah Nota</h3>
        
        {receipts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-rose-300" />
            <p className="font-semibold text-gray-600">Belum ada struk yang diunggah</p>
            <p className="text-xs text-gray-400 mt-1">Gunakan scanner di atas untuk otomatis mengekstrak nota pertamamu!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {receipts.map(rc => (
              <div
                key={rc.id}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                        {rc.imageUrl ? (
                          <img referrerPolicy="no-referrer" src={rc.imageUrl} alt="receipt" className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-tight truncate max-w-[160px]">{rc.merchantName}</h4>
                        <span className="text-[10px] text-gray-400 block font-medium mt-0.5">{rc.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {rc.status === 'saved' ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Check className="w-3 h-3" />
                          <span>Tersimpan</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          <span>Belum Dicatat</span>
                        </span>
                      )}

                      <button
                        type="button"
                        id={`btn-delete-receipt-${rc.id}`}
                        onClick={() => handleDeleteReceipt(rc.id, rc.merchantName)}
                        className="p-1 text-gray-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Hapus struk"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Items list preview */}
                  {rc.items.length > 0 && (
                    <div className="mt-4 bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        <span>Daftar rincian barang ({rc.items.length} item):</span>
                      </p>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {rc.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-gray-600">
                            <span className="truncate max-w-[150px]">{item.name} x{item.quantity}</span>
                            <span className="font-semibold text-gray-800">{formatRupiah(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        {rc.items.length > 3 && (
                          <p className="text-[10px] text-gray-400 font-medium italic text-right">dan {rc.items.length - 3} barang lainnya...</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Total Struk</span>
                    <span className="text-lg font-black font-display text-gray-900 leading-none">
                      {formatRupiah(rc.totalAmount)}
                    </span>
                  </div>

                  <button
                    type="button"
                    id={`btn-open-preview-${rc.id}`}
                    onClick={() => openReceiptPreview(rc)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{rc.status === 'saved' ? 'Lihat Detail' : 'Catat Pengeluaran'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Preview & Save Modal */}
      {showPreviewModal && activeReceipt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 border border-gray-100 shadow-2xl relative my-8 animate-slide-up">
            <button
              type="button"
              id="btn-close-preview-modal"
              onClick={() => {
                setShowPreviewModal(false);
                setActiveReceipt(null);
                setSaveError('');
                setSaveSuccess(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-500" />
              <span>Konfirmasi & Catat Pengeluaran Struk</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Image & Basic Scan details */}
              <div className="space-y-3">
                {activeReceipt.imageUrl && (
                  <div className="rounded-2xl border border-gray-100 overflow-hidden h-40 bg-gray-50 flex items-center justify-center">
                    <img referrerPolicy="no-referrer" src={activeReceipt.imageUrl} alt="Nota scan" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="bg-rose-50/50 rounded-2xl p-3.5 border border-rose-100">
                  <span className="text-[10px] font-bold uppercase text-rose-500 tracking-wider">Hasil Ekstraksi AI</span>
                  <p className="text-sm font-semibold text-gray-800 mt-1">Pembuat: <span className="text-rose-600 font-bold">{activeReceipt.addedBy}</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">Discan pada: {new Date(activeReceipt.scannedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Right Column: Editable form details */}
              <form onSubmit={handleSaveAsExpense} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Toko (Merchant)</label>
                  <input
                    type="text"
                    id="edit-rc-merchant"
                    value={editMerchant}
                    onChange={(e) => setEditMerchant(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Belanja</label>
                    <input
                      type="number"
                      id="edit-rc-total"
                      value={editTotal}
                      onChange={(e) => setEditTotal(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tanggal</label>
                    <input
                      type="date"
                      id="edit-rc-date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kategori Pengeluaran</label>
                  <div className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-rose-100 bg-rose-50 text-rose-700 flex items-center gap-1.5 shadow-3xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>Jajan 🍿</span>
                  </div>
                </div>

                {activeReceipt.status !== 'saved' && (
                  <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Bayar Menggunakan</label>
                    <select
                      id="select-pay-account"
                      value={payAccount}
                      onChange={(e) => setPayAccount(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    >
                      <option value="">-- Pilih Rekening --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({formatRupiah(acc.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </form>
            </div>

            {/* Items display breakdown */}
            {activeReceipt.items.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-rose-500" />
                  <span>Rincian Barang yang Dibeli:</span>
                </p>
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 max-h-36 overflow-y-auto space-y-2">
                  <div className="grid grid-cols-12 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-200 pb-1">
                    <span className="col-span-6">Nama Barang</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-4 text-right">Total Harga</span>
                  </div>
                  {activeReceipt.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-xs text-gray-700">
                      <span className="col-span-6 truncate font-medium">{item.name}</span>
                      <span className="col-span-2 text-center text-gray-400">{item.quantity}</span>
                      <span className="col-span-4 text-right font-semibold text-gray-800">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {saveError && (
              <p className="text-xs text-rose-600 font-bold mt-3 text-center">{saveError}</p>
            )}

            {saveSuccess && (
              <p className="text-xs text-emerald-600 font-bold mt-3 text-center flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 animate-bounce" />
                <span>Transaksi tersimpan dan rekening berhasil di-update!</span>
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                id="btn-close-receipt-preview"
                onClick={() => {
                  setShowPreviewModal(false);
                  setActiveReceipt(null);
                  setSaveError('');
                  setSaveSuccess(false);
                }}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>

              {activeReceipt.status !== 'saved' && (
                <button
                  type="button"
                  id="btn-confirm-save-expense"
                  onClick={handleSaveAsExpense}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-rose-500/10 cursor-pointer"
                >
                  Catat Pengeluaran
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
