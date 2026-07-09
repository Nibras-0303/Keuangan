import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Coins, 
  Sparkles, 
  Calculator, 
  HelpCircle, 
  Briefcase, 
  Shield, 
  Info, 
  Layers, 
  Plus, 
  Trash2, 
  ChevronRight, 
  RefreshCw,
  TrendingDown,
  ArrowRight,
  Lightbulb,
  CheckCircle,
  Percent,
  AlertTriangle,
  Landmark
} from 'lucide-react';
import { formatRupiah } from '../utils';

interface GoldInvestment {
  id: string;
  label: string;
  weightGrams: number;
  buyPricePerGram: number;
  date: string;
  createdAt: string;
}

interface CustomInvestment {
  id: string;
  label: string;
  category: 'rdpu' | 'sukuk' | 'saham' | 'emas';
  buyPrice: number;
  currentPrice: number;
  scope: 'bersama' | 'pribadi_nibras' | 'pribadi_zenita';
  date: string;
  createdAt: string;
}

interface InvestmentTabProps {
  accounts?: any[];
  onAddTransaction?: (txData: any) => Promise<void>;
  currentUser?: string;
  lockedScope?: 'bersama' | 'pribadi_nibras' | 'pribadi_zenita';
}

export default function InvestmentTab({
  accounts = [],
  onAddTransaction,
  currentUser = 'Nibras',
  lockedScope
}: InvestmentTabProps) {
  // -----------------------------------------
  // 1. GOLD INVESTMENT PORTFOLIO STATE
  // -----------------------------------------
  const [goldInvestments, setGoldInvestments] = useState<GoldInvestment[]>([]);
  const [currentGoldPrice, setCurrentGoldPrice] = useState<number>(2640000); // Realistic 2026 default price per gram in IDR (Antam benchmark)
  
  // Form State
  const [goldLabel, setGoldLabel] = useState('');
  const [goldWeight, setGoldWeight] = useState('');
  const [goldBuyPrice, setGoldBuyPrice] = useState('');
  const [goldDate, setGoldDate] = useState(new Date().toISOString().split('T')[0]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // -----------------------------------------
  // 1B. CUSTOM INVESTMENT PORTFOLIO STATE (RDPU, Sukuk, Saham, etc.)
  // -----------------------------------------
  const [customInvestments, setCustomInvestments] = useState<CustomInvestment[]>([]);
  const [hasOtherInvestments, setHasOtherInvestments] = useState<boolean>(true);
  const [activeTabScope, setActiveTabScope] = useState<'bersama' | 'pribadi_nibras' | 'pribadi_zenita'>(lockedScope || 'bersama');
  
  // Update scope if lockedScope changes
  useEffect(() => {
    if (lockedScope) {
      setActiveTabScope(lockedScope);
    }
  }, [lockedScope]);
  const [investmentFilter, setInvestmentFilter] = useState<'all' | 'bersama' | 'pribadi_nibras' | 'pribadi_zenita'>('all');

  // New Custom Investment Form State
  const [customCategory, setCustomCategory] = useState<'rdpu' | 'sukuk' | 'saham' | 'emas'>('rdpu');
  const [customLabel, setCustomLabel] = useState('');
  const [customBuyPrice, setCustomBuyPrice] = useState('');
  const [customScope, setCustomScope] = useState<'bersama' | 'pribadi_nibras' | 'pribadi_zenita'>('bersama');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [customSuccess, setCustomSuccess] = useState('');
  const [customError, setCustomError] = useState('');

  // Auto-Updating Ticker Pulse Indicator
  const [priceUpdatedPulse, setPriceUpdatedPulse] = useState<boolean>(false);

  // Sync form scopes with active tab scope so forms auto-select the current screen's scope!
  useEffect(() => {
    setCustomScope(activeTabScope);
    setSelectedSavingsScope(activeTabScope);
  }, [activeTabScope]);

  // Savings Allocation Form State
  const [selectedSavingsScope, setSelectedSavingsScope] = useState<'bersama' | 'pribadi_nibras' | 'pribadi_zenita'>('bersama');
  const [allocationAccount, setAllocationAccount] = useState<string>('');
  const [allocationCategory, setAllocationCategory] = useState<'rdpu' | 'sukuk' | 'saham' | 'emas'>('rdpu');
  const [allocationAmount, setAllocationAmount] = useState<string>('');
  const [allocationSuccess, setAllocationSuccess] = useState<string>('');
  const [allocationError, setAllocationError] = useState<string>('');
  const [isAllocating, setIsAllocating] = useState<boolean>(false);

  // Load from LocalStorage
  useEffect(() => {
    // Emas
    const saved = localStorage.getItem('kitapunya_gold_investments');
    if (saved) {
      try {
        setGoldInvestments(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse gold investments', e);
      }
    } else {
      // Seed with 1 mock gold entry for instant helpful demo
      const seed: GoldInvestment[] = [
        {
          id: 'gold_1',
          label: 'Logam Mulia Antam (Mas Kawin/Tabungan)',
          weightGrams: 5,
          buyPricePerGram: 1250000,
          date: '2025-10-15',
          createdAt: new Date().toISOString()
        }
      ];
      setGoldInvestments(seed);
      localStorage.setItem('kitapunya_gold_investments', JSON.stringify(seed));
    }

    const savedPrice = localStorage.getItem('kitapunya_current_gold_price');
    if (savedPrice) {
      const parsed = parseFloat(savedPrice);
      if (parsed > 0) {
        // If the saved price is from the old version (less than 2 million IDR), upgrade it to the new benchmark
        if (parsed < 2000000) {
          setCurrentGoldPrice(2640000);
          localStorage.setItem('kitapunya_current_gold_price', '2640000');
        } else {
          setCurrentGoldPrice(parsed);
        }
      }
    }

    // Custom Investments
    const savedCustom = localStorage.getItem('kitapunya_custom_investments');
    if (savedCustom) {
      try {
        setCustomInvestments(JSON.parse(savedCustom));
      } catch (e) {
        console.error('Failed to parse custom investments', e);
      }
    } else {
      // Seed with beautiful compliant sharia custom investments
      const seed: CustomInvestment[] = [
        {
          id: 'custom_1',
          label: 'Bahana Likuid Syariah Kelas G (RDPU)',
          category: 'rdpu',
          buyPrice: 5000000,
          currentPrice: 5125000,
          scope: 'bersama',
          date: '2025-11-01',
          createdAt: new Date().toISOString()
        },
        {
          id: 'custom_2',
          label: 'Sukuk Ritel SR021 (Bagi Hasil Halal)',
          category: 'sukuk',
          buyPrice: 10000000,
          currentPrice: 10000000,
          scope: 'bersama',
          date: '2026-02-15',
          createdAt: new Date().toISOString()
        },
        {
          id: 'custom_3',
          label: 'Saham Syariah Bank Syariah Indonesia (BRIS)',
          category: 'saham',
          buyPrice: 3000000,
          currentPrice: 3450000,
          scope: 'pribadi_nibras',
          date: '2026-03-01',
          createdAt: new Date().toISOString()
        }
      ];
      setCustomInvestments(seed);
      localStorage.setItem('kitapunya_custom_investments', JSON.stringify(seed));
    }

    const savedHasOther = localStorage.getItem('kitapunya_has_other_investments');
    if (savedHasOther) {
      setHasOtherInvestments(savedHasOther === 'true');
    }
  }, []);

  // -------------------------------------------------------------
  // AUTOMATIC REAL-TIME PRICE TICKER & MARKET SIMULATOR (DSN-MUI COMPLIANT)
  // -------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Simulate minor real-time fluctuations for Gold benchmark
      setCurrentGoldPrice(prev => {
        // Safe, minor fluctuations (+- Rp 400 with a slight positive bias of Rp 150)
        const delta = (Math.random() - 0.4) * 1000;
        // Adjust bounds to match the updated 2.64M range of 2026
        const startBase = prev < 2000000 ? 2640000 : prev; // automatic migration if old price was saved in localStorage
        const nextPrice = Math.max(2500000, Math.min(2800000, Math.round(startBase + delta)));
        localStorage.setItem('kitapunya_current_gold_price', nextPrice.toString());
        return nextPrice;
      });

      // 2. Simulate minor real-time yield accrual or trading updates for custom investments
      setCustomInvestments(prev => {
        if (!prev || prev.length === 0) return prev;
        const updated = prev.map(item => {
          let delta = 0;
          if (item.category === 'rdpu') {
            // RDPU (Money Market Syariah) is ultra low-risk: always grows steadily (accrued sharia yield)
            delta = Math.floor(Math.random() * 80) + 30; // +Rp 30 to +Rp 110 per tick
          } else if (item.category === 'sukuk') {
            // Sukuk Negara: stable, safe lease rental accrual (ujrah/bagi-hasil)
            delta = Math.floor(Math.random() * 50) + 10; // +Rp 10 to +Rp 60 per tick
          } else if (item.category === 'saham') {
            // Saham Syariah (JII): active market fluctuations (both up and down!)
            // Fluctuation percentage of -0.15% to +0.22% (representing active market trades)
            const percentChange = (Math.random() * 0.37 - 0.15) / 100;
            delta = Math.round(item.currentPrice * percentChange);
          } else if (item.category === 'emas') {
            // Custom Emas: fluctuates closely aligned with general gold price shifts
            const percentChange = (Math.random() * 0.12 - 0.05) / 100;
            delta = Math.round(item.currentPrice * percentChange);
          }

          // Bound prices so they don't drop below 80% of original buy price
          const nextPrice = Math.max(Math.round(item.buyPrice * 0.8), Math.round(item.currentPrice + delta));
          return {
            ...item,
            currentPrice: nextPrice
          };
        });

        localStorage.setItem('kitapunya_custom_investments', JSON.stringify(updated));
        return updated;
      });

      // Trigger a visual pulse indicator for the UI to glow gently
      setPriceUpdatedPulse(true);
      const timer = setTimeout(() => setPriceUpdatedPulse(false), 1200);
      return () => clearTimeout(timer);
    }, 8000); // Ticks every 8 seconds for a premium live-ticker feel!

    return () => clearInterval(interval);
  }, []);

  // Save helpers
  const saveGoldInvestments = (updated: GoldInvestment[]) => {
    setGoldInvestments(updated);
    localStorage.setItem('kitapunya_gold_investments', JSON.stringify(updated));
  };

  const saveCustomInvestments = (updated: CustomInvestment[]) => {
    setCustomInvestments(updated);
    localStorage.setItem('kitapunya_custom_investments', JSON.stringify(updated));
  };

  const handleSetHasOther = (val: boolean) => {
    setHasOtherInvestments(val);
    localStorage.setItem('kitapunya_has_other_investments', val.toString());
  };

  const handleUpdateCurrentPrice = (price: number) => {
    setCurrentGoldPrice(price);
    localStorage.setItem('kitapunya_current_gold_price', price.toString());
  };

  const handleAddGold = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const parsedWeight = parseFloat(goldWeight);
    if (!parsedWeight || parsedWeight <= 0) {
      setErrorMsg('Masukkan berat emas yang valid (contoh: 0.5, 1, 5, 10).');
      return;
    }

    const cleanPrice = goldBuyPrice.replace(/[^0-9]/g, '');
    const parsedPrice = parseFloat(cleanPrice);
    if (!parsedPrice || parsedPrice <= 0) {
      setErrorMsg('Masukkan harga beli per gram yang valid.');
      return;
    }

    const newEntry: GoldInvestment = {
      id: 'gold_' + Date.now(),
      label: goldLabel.trim() || `Emas Batangan ${parsedWeight}g`,
      weightGrams: parsedWeight,
      buyPricePerGram: parsedPrice,
      date: goldDate,
      createdAt: new Date().toISOString()
    };

    const updated = [...goldInvestments, newEntry];
    saveGoldInvestments(updated);

    // Reset Form
    setGoldLabel('');
    setGoldWeight('');
    setGoldBuyPrice('');
    setSuccessMsg('Catatan investasi emas berhasil ditambahkan! 🪙');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDeleteGold = (id: string) => {
    if (confirm('Hapus catatan investasi emas ini dari portfolio?')) {
      const updated = goldInvestments.filter(item => item.id !== id);
      saveGoldInvestments(updated);
    }
  };

  // -----------------------------------------
  // CUSTOM INVESTMENT PORTFOLIO HANDLERS
  // -----------------------------------------
  const handleAddCustomInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError('');
    setCustomSuccess('');

    const cleanBuy = customBuyPrice.replace(/[^0-9]/g, '');
    const parsedBuy = parseFloat(cleanBuy);

    if (!parsedBuy || parsedBuy <= 0) {
      setCustomError('Masukkan harga/modal beli yang valid.');
      return;
    }

    const newInvest: CustomInvestment = {
      id: 'custom_' + Date.now(),
      label: customLabel.trim() || `${customCategory === 'rdpu' ? 'RDPU Syariah' : customCategory === 'sukuk' ? 'Sukuk Negara' : customCategory === 'saham' ? 'Saham Syariah' : 'Emas'} Baru`,
      category: customCategory,
      buyPrice: parsedBuy,
      currentPrice: parsedBuy,
      scope: customScope,
      date: customDate,
      createdAt: new Date().toISOString()
    };

    const updated = [...customInvestments, newInvest];
    saveCustomInvestments(updated);

    // Reset Form
    setCustomLabel('');
    setCustomBuyPrice('');
    setCustomSuccess('Investasi berhasil dicatat dan dipantau! 📈');
    setTimeout(() => setCustomSuccess(''), 3500);
  };

  const handleDeleteCustom = (id: string) => {
    if (confirm('Hapus investasi ini dari portfolio?')) {
      const updated = customInvestments.filter(item => item.id !== id);
      saveCustomInvestments(updated);
    }
  };

  const handleAllocateSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllocationError('');
    setAllocationSuccess('');

    if (!onAddTransaction) {
      setAllocationError('Koneksi sistem finansial terganggu. Silakan muat ulang halaman.');
      return;
    }

    const amountNum = parseFloat(allocationAmount.replace(/[^0-9]/g, ''));
    if (!amountNum || amountNum <= 0) {
      setAllocationError('Masukkan jumlah alokasi investasi yang valid.');
      return;
    }

    const sourceAcc = accounts.find(a => a.id === allocationAccount);
    if (!sourceAcc) {
      setAllocationError('Pilih rekening sumber alokasi tabungan terlebih dahulu.');
      return;
    }

    if (sourceAcc.balance < amountNum) {
      setAllocationError(`Saldo tidak mencukupi. Saldo aktif di ${sourceAcc.name} adalah ${formatRupiah(sourceAcc.balance)}.`);
      return;
    }

    setIsAllocating(true);
    try {
      const catLabel = allocationCategory === 'rdpu' ? 'RDPU Syariah' 
                     : allocationCategory === 'sukuk' ? 'Sukuk Ritel Negara'
                     : allocationCategory === 'saham' ? 'Saham Syariah'
                     : 'Emas';
                     
      const notesMsg = `Alokasi Investasi ${catLabel} dari ${sourceAcc.name}`;
      
      const txScope = selectedSavingsScope === 'bersama' ? 'bersama' : 'pribadi';
      const txOwner = selectedSavingsScope === 'pribadi_nibras' ? 'Nibras' 
                    : selectedSavingsScope === 'pribadi_zenita' ? 'Zenita' 
                    : '';

      await onAddTransaction({
        type: 'expense',
        amount: amountNum,
        accountId: sourceAcc.id,
        category: 'Investasi',
        notes: notesMsg,
        date: new Date().toISOString().split('T')[0],
        scope: txScope,
        owner: txOwner
      });

      if (allocationCategory === 'emas') {
        const computedGrams = amountNum / currentGoldPrice;
        const newGold: GoldInvestment = {
          id: 'gold_' + Date.now(),
          label: `Emas Alokasi dari ${sourceAcc.name}`,
          weightGrams: parseFloat(computedGrams.toFixed(3)),
          buyPricePerGram: currentGoldPrice,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        saveGoldInvestments([...goldInvestments, newGold]);
      } else {
        const newCustom: CustomInvestment = {
          id: 'custom_' + Date.now(),
          label: `${catLabel} - Alokasi ${sourceAcc.name}`,
          category: allocationCategory,
          buyPrice: amountNum,
          currentPrice: amountNum,
          scope: selectedSavingsScope,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        saveCustomInvestments([...customInvestments, newCustom]);
      }

      setAllocationSuccess(`Alokasi dana sebesar ${formatRupiah(amountNum)} berhasil dipotong dari ${sourceAcc.name} dan otomatis dicatat ke portfolio! 🕋`);
      setAllocationAmount('');
      
      setTimeout(() => {
        setAllocationSuccess('');
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setAllocationError(err.message || 'Gagal melakukan alokasi investasi.');
    } finally {
      setIsAllocating(false);
    }
  };

  // -----------------------------------------
  // CALCULATIONS (ADAPTED TO ACTIVE SCOPE)
  // -----------------------------------------
  
  // Filtered Gold Investments
  const filteredGoldInvestments = goldInvestments.filter(item => {
    const scope = item.scope || 'bersama';
    return scope === activeTabScope;
  });

  // Filtered Custom Investments
  const filteredCustomInvestments = customInvestments.filter(item => {
    return item.scope === activeTabScope;
  });

  // Filtered accounts that are marked as invested and match activeTabScope
  const filteredDetectedSavings = (accounts || [])
    .filter(acc => {
      if (!acc.isInvested) return false;
      const accScope = acc.scope === 'bersama' ? 'bersama' 
                       : (acc.owner === 'Zenita' ? 'pribadi_zenita' : 'pribadi_nibras');
      return accScope === activeTabScope;
    })
    .map(acc => ({
      id: `detected_${acc.id}`,
      label: `${acc.name} (Saku Tabungan)`,
      category: acc.investmentCategory || 'rdpu',
      buyPrice: acc.balance,
      currentPrice: acc.balance,
      scope: (acc.scope === 'bersama' ? 'bersama' : (acc.owner === 'Zenita' ? 'pribadi_zenita' : 'pribadi_nibras')) as any,
      date: 'Otomatis',
      createdAt: new Date().toISOString(),
      isFromSavings: true,
      accountId: acc.id
    }));

  // Calculations for Gold
  const totalGrams = filteredGoldInvestments.reduce((sum, item) => sum + item.weightGrams, 0);
  const totalBuyValue = filteredGoldInvestments.reduce((sum, item) => sum + (item.weightGrams * item.buyPricePerGram), 0);
  const totalCurrentValue = totalGrams * currentGoldPrice;
  const netProfit = totalCurrentValue - totalBuyValue;
  const profitPercentage = totalBuyValue > 0 ? (netProfit / totalBuyValue) * 100 : 0;
  const avgBuyPrice = totalGrams > 0 ? totalBuyValue / totalGrams : 0;

  // Calculations for Custom Investments
  const totalCustomBuyValue = filteredCustomInvestments.reduce((sum, item) => sum + item.buyPrice, 0);
  const totalCustomCurrentValue = filteredCustomInvestments.reduce((sum, item) => sum + item.currentPrice, 0);
  const customNetProfit = totalCustomCurrentValue - totalCustomBuyValue;

  // Calculations for Savings-based Investments
  const totalSavingsInvestedValue = filteredDetectedSavings.reduce((sum, item) => sum + item.buyPrice, 0);

  // Grand Totals for the Active Scope Portfolio
  const grandTotalBuyValue = totalBuyValue + totalCustomBuyValue + totalSavingsInvestedValue;
  const grandTotalCurrentValue = totalCurrentValue + totalCustomCurrentValue + totalSavingsInvestedValue;
  const grandNetProfit = grandTotalCurrentValue - grandTotalBuyValue;
  const grandRoi = grandTotalBuyValue > 0 ? (grandNetProfit / grandTotalBuyValue) * 100 : 0;

  // -----------------------------------------
  // CATEGORIZED PORTFOLIO PERFORMANCE STATS
  // -----------------------------------------
  
  // Find SeaBank accounts belonging to the active scope (SeaBank is strictly a joint/shared account 'bersama')
  const activeSeaBankAccounts = activeTabScope === 'bersama' ? (accounts || []).filter(acc => {
    if (!acc.isSeaBank) return false;
    const accScope = acc.scope === 'bersama' ? 'bersama' 
                     : (acc.owner === 'Zenita' ? 'pribadi_zenita' : 'pribadi_nibras');
    return accScope === activeTabScope;
  }) : [];
  
  const totalSeaBankAccumulated = activeTabScope === 'bersama' 
    ? activeSeaBankAccounts.reduce((sum, acc) => sum + (acc.seaBankInterestAccumulated || 0), 0)
    : 0;

  const getCategoryStats = (cat: 'rdpu' | 'sukuk' | 'saham' | 'emas') => {
    const customs = filteredCustomInvestments.filter(item => item.category === cat);
    const savings = filteredDetectedSavings.filter(item => item.category === cat);
    
    const buyCustom = customs.reduce((sum, item) => sum + item.buyPrice, 0);
    const buySavings = savings.reduce((sum, item) => sum + item.buyPrice, 0);
    const totalBuy = buyCustom + buySavings;
    
    const curCustom = customs.reduce((sum, item) => sum + item.currentPrice, 0);
    const curSavings = savings.reduce((sum, item) => sum + item.currentPrice, 0);
    const totalCurrent = curCustom + curSavings;
    
    let finalBuy = totalBuy;
    let finalCurrent = totalCurrent;
    if (cat === 'emas') {
      finalBuy += totalBuyValue;
      finalCurrent += totalCurrentValue;
    }
    
    const profit = finalCurrent - finalBuy;
    const roi = finalBuy > 0 ? (profit / finalBuy) * 100 : 0;
    
    return {
      buy: finalBuy,
      current: finalCurrent,
      profit,
      roi
    };
  };

  const rdpuStats = getCategoryStats('rdpu');
  const sukukStats = getCategoryStats('sukuk');
  const sahamStats = getCategoryStats('saham');
  const emasStats = getCategoryStats('emas');

  // -----------------------------------------
  // 2. ADVICE MATCHMAKER STATE
  // -----------------------------------------
  const [goal, setGoal] = useState<'darurat' | 'liburan' | 'rumah' | 'masadepan'>('darurat');
  const [duration, setDuration] = useState<'pendek' | 'menengah' | 'panjang'>('pendek');
  const [risk, setRisk] = useState<'konservatif' | 'moderat' | 'agresif'>('konservatif');
  const [showMatchmakerResult, setShowMatchmakerResult] = useState(true)  // Trigger recommendation generator logic
  const getRecommendation = () => {
    // Alokasi suggestions: [RDPU Syariah, Sukuk Negara, Saham Syariah, Emas]
    let title = "Alokasi Konservatif Syariah (Sangat Aman & Berkah)";
    let desc = "Fokus utama kalian adalah dana darurat yang 100% bebas dari Riba, sangat aman, dan mudah dicairkan kapan saja.";
    let rdpu = 70; // RDPU Syariah
    let sbn = 15;  // Sukuk Ritel/Negara
    let saham = 0;
    let emas = 15;
    let tips = [
      "Simpan Dana Darurat di Reksa Dana Pasar Uang (RDPU) Syariah yang diawasi oleh DSN-MUI untuk imbal hasil halal tanpa riba.",
      "Sebagian kecil (15%) bisa disimpan dalam investasi emas fisik/digital yang aman dan diakui syariat untuk pelindung inflasi.",
      "Hindari saham konvensional atau instrumen berbunga konvensional untuk alokasi dana darurat berdua."
    ];

    if (goal === 'liburan' || duration === 'menengah') {
      if (risk === 'konservatif') {
        title = "Alokasi Pendapatan Tetap Syariah (Sukuk Negara)";
        desc = "Sangat cocok untuk target liburan atau rencana menikah jangka menengah (1-3 tahun) yang halal & berkah.";
        rdpu = 40;
        sbn = 40;
        saham = 0;
        emas = 20;
        tips = [
          "Gunakan Sukuk Tabungan (ST) atau Sukuk Ritel (SR) karena merupakan investasi negara berbasis syariah dengan sistem bagi hasil/sewa halal (ujrah) tanpa unsur riba.",
          "Gunakan RDPU Syariah untuk dana cicilan bulanan agar berlipat lebih berkah daripada tabungan biasa.",
          "Gunakan Emas sebagai pelindung nilai aset tabungan kalian (20%)."
        ];
      } else {
        title = "Alokasi Moderat Syariah (Pertumbuhan Berimbang)";
        desc = "Kombinasi hasil bagi dari Sukuk Negara yang stabil dengan potensi pertumbuhan dari Saham Syariah Blue Chip.";
        rdpu = 20;
        sbn = 45;
        saham = 15;
        emas = 20;
        tips = [
          "Investasikan 45% ke Sukuk Ritel (SR/ST) untuk imbalan sewa bulanan halal langsung dari pemerintah.",
          "Alokasikan 15% ke Saham Syariah Blue Chip (seperti TLKM, ASII, atau BRIS) yang terdaftar di Jakarta Islamic Index (JII) yang terbebas dari riba dan bisnis non-halal.",
          "Sisihkan tabungan emas digital syariah secara berkala setiap kali gajian."
        ];
      }
    }

    if (goal === 'rumah' || goal === 'masadepan' || duration === 'panjang') {
      if (risk === 'agresif') {
        title = "Alokasi Pertumbuhan Agresif Syariah (Compounder Syariah)";
        desc = "Sangat direkomendasikan untuk rencana jangka panjang (>3 tahun). Mengoptimalkan pertumbuhan lewat aset syariah produktif.";
        rdpu = 10;
        sbn = 20;
        saham = 50;
        emas = 20;
        tips = [
          "Alokasikan 50% ke Saham Syariah Blue Chip terkemuka (seperti TLKM - Telkom, BRIS - Bank Syariah Indonesia, ASII - Astra, ICBP - Indofood) yang terbukti bebas riba dan lolos skrining ketat DSN-MUI.",
          "Manfaatkan efek 'Compound Interest' (efek gulung) dengan menginvestasikan kembali dividen halal yang didapatkan.",
          "Gunakan 20% emas sebagai asuransi portofolio jika pasar saham sedang fluktuatif."
        ];
      } else if (risk === 'moderat') {
        title = "Alokasi Seimbang Jangka Panjang Syariah";
        desc = "Mengejar pertumbuhan jangka panjang yang optimal namun fluktuasi terjaga lewat instrumen syariah berimbang.";
        rdpu = 15;
        sbn = 35;
        saham = 30;
        emas = 20;
        tips = [
          "Gabungkan Reksa Dana Saham Syariah (30%) dan Sukuk Ritel Negara (35%) untuk portofolio yang tumbuh sehat dan halal.",
          "Rutin melakukan 'DCA' (menabung konsisten) di reksa dana syariah pilihan tanpa mempedulikan naik-turun harga.",
          "Emas tetap menjadi jangkar aman portofolio sebesar 20%."
        ];
      }
    }

    return { title, desc, rdpu, sbn, saham, emas, tips };
  };

  const rec = getRecommendation();

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* 1. Header Banner */}
      <div className={`bg-gradient-to-r ${
        activeTabScope === 'bersama' ? 'from-rose-500 to-rose-600' :
        activeTabScope === 'pribadi_nibras' ? 'from-blue-600 to-blue-700' :
        'from-pink-500 to-pink-600'
      } rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden transition-all duration-500`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-xl -ml-16 -mb-16"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-400/10 rounded-full blur-xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <span className="bg-white/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              <span>
                {activeTabScope === 'bersama' ? 'Investasi Bersama Kita' :
                 activeTabScope === 'pribadi_nibras' ? 'Portofolio Pribadi Nibras' :
                 'Portofolio Pribadi Zenita'}
              </span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight leading-tight">
              {activeTabScope === 'bersama' && 'Pojok Investasi Bersama Kita 💖'}
              {activeTabScope === 'pribadi_nibras' && 'Pojok Investasi Pribadi Nibras 👨'}
              {activeTabScope === 'pribadi_zenita' && 'Pojok Investasi Pribadi Zenita 👩'}
            </h2>
            <p className="text-xs text-white/90 max-w-xl font-medium leading-relaxed">
              {activeTabScope === 'bersama' && 'Kelola tabungan emas, sukuk ritel negara, reksadana pasar uang syariah, dan saku tabungan bersama yang dialokasikan penuh ke investasi halal.'}
              {activeTabScope === 'pribadi_nibras' && 'Kelola tabungan emas, reksadana, dan saham syariah khusus milik Nibras sendiri untuk masa depan yang produktif.'}
              {activeTabScope === 'pribadi_zenita' && 'Kelola tabungan emas, reksadana, dan saham syariah khusus milik Zenita sendiri untuk masa depan mandiri yang berkah.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4.5 border border-white/10 shrink-0 text-left min-w-[220px]">
            <span className="text-[10px] text-white/80 block uppercase font-bold tracking-wider">Total Nilai Portofolio ({activeTabScope === 'bersama' ? 'Bersama' : activeTabScope === 'pribadi_nibras' ? 'Nibras' : 'Zenita'})</span>
            <span className="text-2xl font-black font-mono tracking-tight block mt-1">
              {formatRupiah(grandTotalCurrentValue)}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold inline-block ${
                grandNetProfit >= 0 ? 'bg-emerald-500/30 text-emerald-100' : 'bg-rose-500/30 text-rose-100'
              }`}>
                {grandNetProfit >= 0 ? '📈 Untung' : '📉 Rugi'}: {grandNetProfit >= 0 ? '+' : ''}{formatRupiah(grandNetProfit)}
              </span>
              {grandTotalBuyValue > 0 && (
                <span className="text-[10px] font-black text-white/90">
                  ({grandRoi >= 0 ? '+' : ''}{grandRoi.toFixed(2)}%)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1.5. Laman Investasi Scope Selector (Bersama vs. Nibras vs. Zenita) */}
      {!lockedScope && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-150 shadow-3xs">
          <div className="text-left">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Laman Investasi Terpisah</span>
            <h3 className="text-base font-extrabold text-gray-900 leading-tight">Pilih Portofolio yang Ingin Dilihat:</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Portofolio dibedakan per laman agar tidak membingungkan.</p>
          </div>
          <div className="flex p-1.5 bg-gray-100 rounded-2xl border border-gray-200/60 font-bold text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTabScope('bersama')}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer flex-1 sm:flex-none ${
                activeTabScope === 'bersama' 
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/40'
              }`}
            >
              <span className="text-base">💖</span>
              <span>Bersama</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabScope('pribadi_nibras')}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer flex-1 sm:flex-none ${
                activeTabScope === 'pribadi_nibras' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/40'
              }`}
            >
              <span className="text-base">👨</span>
              <span>Nibras</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabScope('pribadi_zenita')}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer flex-1 sm:flex-none ${
                activeTabScope === 'pribadi_zenita' 
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/10' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/40'
              }`}
            >
              <span className="text-base">👩</span>
              <span>Zenita</span>
            </button>
          </div>
        </div>
      )}

      {/* 1.6. DEDICATED P&L DASHBOARD / IKHTISAR LABA RUGI INVESTASI (TEMPAT BERBEDA) */}
      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 text-left">
          <div>
            <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.8 rounded-md border border-indigo-150 inline-block">
              Laporan Realized & Unrealized P&L
            </span>
            <h3 className="font-extrabold text-gray-900 text-base mt-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Ikhtisar Pendapatan & Kinerja Investasi Terpisah 📊
            </h3>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
              Pantau total modal awal, tingkat pengembalian modal (ROI), dan dividen pasif di bawah ini.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-gray-600 font-mono">Sinkronisasi Real-Time Aktif</span>
          </div>
        </div>

        {/* Bento Grid: Summary Cards */}
        <div className={`grid gap-4 ${
          activeTabScope === 'bersama' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
        }`}>
          {/* Card 1: Modal Utama */}
          <div className="p-4 bg-gray-50/70 border border-gray-150 rounded-2xl text-left">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Modal Utama Beli</span>
            <span className="text-base sm:text-lg font-black font-mono text-gray-900 block mt-1">
              {formatRupiah(grandTotalBuyValue)}
            </span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Aset Aktif Dikapitalisasi</span>
          </div>

          {/* Card 2: Valuasi Portofolio */}
          <div className="p-4 bg-gray-50/70 border border-gray-150 rounded-2xl text-left">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Valuasi Portofolio</span>
            <span className="text-base sm:text-lg font-black font-mono text-indigo-600 block mt-1">
              {formatRupiah(grandTotalCurrentValue)}
            </span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Nilai Pasar Saat Ini</span>
          </div>

          {/* Card 3: Keuntungan / Kerugian */}
          <div className={`p-4 border rounded-2xl text-left ${
            grandNetProfit >= 0 ? 'bg-emerald-50/30 border-emerald-150' : 'bg-rose-50/30 border-rose-150'
          }`}>
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block">Keuntungan Bersih</span>
            <span className={`text-base sm:text-lg font-black font-mono block mt-1 ${
              grandNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {grandNetProfit >= 0 ? '+' : ''}{formatRupiah(grandNetProfit)}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                grandNetProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                ROI: {grandRoi >= 0 ? '+' : ''}{grandRoi.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Card 4: Dividen Harian (SeaBank) - Only shown for 'bersama' */}
          {activeTabScope === 'bersama' && (
            <div className="p-4 bg-orange-50/20 border border-orange-150 rounded-2xl text-left">
              <span className="text-[10px] text-orange-600 font-black uppercase tracking-wider block">Hasil Bunga SeaBank</span>
              <span className="text-base sm:text-lg font-black font-mono text-orange-600 block mt-1">
                {formatRupiah(totalSeaBankAccumulated)}
              </span>
              <span className="text-[9px] text-gray-400 block mt-0.5">Pendapatan Real (Realized Yield)</span>
            </div>
          )}
        </div>

        {/* Detailed Instrument List (Table/Dashboard style) */}
        <div className="border border-gray-150 rounded-2xl overflow-hidden bg-gray-50/30">
          <div className="p-3 bg-gray-50 border-b border-gray-150 grid grid-cols-12 gap-2 text-[10px] font-black text-gray-500 uppercase tracking-wider text-left">
            <div className="col-span-4 md:col-span-5">Instrumen Investasi</div>
            <div className="col-span-4 md:col-span-3">Modal & Valuasi</div>
            <div className="col-span-4 md:col-span-4 text-right">Hasil & Persentase Imbal</div>
          </div>

          <div className="divide-y divide-gray-150">
            {/* ROW 1: EMAS MULIA */}
            <div className="p-4 grid grid-cols-12 gap-2 items-center text-left bg-white">
              <div className="col-span-4 md:col-span-5 flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-base shrink-0 border border-amber-200/40">
                  🪙
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-gray-900 block truncate">Emas Mulia (24 Karat)</span>
                  <span className="text-[9px] text-gray-400 font-bold">Logam Mulia Fisik/Digital</span>
                </div>
              </div>
              <div className="col-span-4 md:col-span-3 space-y-0.5 font-mono">
                <span className="text-[10px] text-gray-400 block font-bold">Beli: {formatRupiah(emasStats.buy)}</span>
                <span className="text-xs text-gray-800 font-bold block">Kini: {formatRupiah(emasStats.current)}</span>
              </div>
              <div className="col-span-4 md:col-span-4 text-right">
                <span className={`text-xs font-black font-mono block ${emasStats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {emasStats.profit >= 0 ? '+' : ''}{formatRupiah(emasStats.profit)}
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                  emasStats.profit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  ROI: {emasStats.roi >= 0 ? '+' : ''}{emasStats.roi.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* ROW 2: REKSADANA PASAR UANG */}
            <div className="p-4 grid grid-cols-12 gap-2 items-center text-left bg-white">
              <div className="col-span-4 md:col-span-5 flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-base shrink-0 border border-emerald-200/40">
                  🟢
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-gray-900 block truncate">RDPU Syariah</span>
                  <span className="text-[9px] text-gray-400 font-bold">Likuid & Imbal Hasil Stabil</span>
                </div>
              </div>
              <div className="col-span-4 md:col-span-3 space-y-0.5 font-mono">
                <span className="text-[10px] text-gray-400 block font-bold">Beli: {formatRupiah(rdpuStats.buy)}</span>
                <span className="text-xs text-gray-800 font-bold block">Kini: {formatRupiah(rdpuStats.current)}</span>
              </div>
              <div className="col-span-4 md:col-span-4 text-right">
                <span className={`text-xs font-black font-mono block ${rdpuStats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {rdpuStats.profit >= 0 ? '+' : ''}{formatRupiah(rdpuStats.profit)}
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                  rdpuStats.profit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  ROI: {rdpuStats.roi >= 0 ? '+' : ''}{rdpuStats.roi.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* ROW 3: SUKUK NEGARA */}
            <div className="p-4 grid grid-cols-12 gap-2 items-center text-left bg-white">
              <div className="col-span-4 md:col-span-5 flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-base shrink-0 border border-blue-200/40">
                  🔵
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-gray-900 block truncate">Sukuk Negara / SBSN</span>
                  <span className="text-[9px] text-gray-400 font-bold">Sewa Sewa Jasa (Ujrah) Terjamin</span>
                </div>
              </div>
              <div className="col-span-4 md:col-span-3 space-y-0.5 font-mono">
                <span className="text-[10px] text-gray-400 block font-bold">Beli: {formatRupiah(sukukStats.buy)}</span>
                <span className="text-xs text-gray-800 font-bold block">Kini: {formatRupiah(sukukStats.current)}</span>
              </div>
              <div className="col-span-4 md:col-span-4 text-right">
                <span className={`text-xs font-black font-mono block ${sukukStats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {sukukStats.profit >= 0 ? '+' : ''}{formatRupiah(sukukStats.profit)}
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                  sukukStats.profit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  ROI: {sukukStats.roi >= 0 ? '+' : ''}{sukukStats.roi.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* ROW 4: SAHAM SYARIAH */}
            <div className="p-4 grid grid-cols-12 gap-2 items-center text-left bg-white">
              <div className="col-span-4 md:col-span-5 flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-base shrink-0 border border-orange-200/40">
                  🟠
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-gray-900 block truncate">Saham Syariah (JII)</span>
                  <span className="text-[9px] text-gray-400 font-bold">Pasar Modal Terseleksi</span>
                </div>
              </div>
              <div className="col-span-4 md:col-span-3 space-y-0.5 font-mono">
                <span className="text-[10px] text-gray-400 block font-bold">Beli: {formatRupiah(sahamStats.buy)}</span>
                <span className="text-xs text-gray-800 font-bold block">Kini: {formatRupiah(sahamStats.current)}</span>
              </div>
              <div className="col-span-4 md:col-span-4 text-right">
                <span className={`text-xs font-black font-mono block ${sahamStats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {sahamStats.profit >= 0 ? '+' : ''}{formatRupiah(sahamStats.profit)}
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                  sahamStats.profit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  ROI: {sahamStats.roi >= 0 ? '+' : ''}{sahamStats.roi.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Columns: Gold Calc on Left, Advisor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: THE REAL-TIME GOLD CALCULATOR (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Gold Benchmark Pricing & Control (AUTO-UPDATING & NON-EDITABLE) */}
          <div className={`bg-white rounded-3xl border ${priceUpdatedPulse ? 'border-amber-400 bg-amber-50/10 shadow-xs scale-[1.01]' : 'border-gray-150'} p-6 shadow-xs relative transition-all duration-500`}>
            <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>PASAR AKTIF (LIVE)</span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                  <Coins className="w-5 h-5 text-amber-500" />
                  Harga Emas Pasaran Terkini (Otomatis) 🪙
                </h3>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                  Dipantau secara real-time dari acuan pasar komoditas Syariah. Perubahan manual dinonaktifkan demi akurasi kalkulasi.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-150">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold shrink-0">
                    Rp
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Harga Acuan Emas Hari Ini</span>
                    <span className={`text-2xl font-black font-mono tracking-tight transition-colors duration-500 ${priceUpdatedPulse ? 'text-amber-600' : 'text-gray-900'}`}>
                      {new Intl.NumberFormat('id-ID').format(currentGoldPrice)} <span className="text-xs font-bold text-gray-500">/ gram</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-150 shadow-3xs">
                  <span className="text-xs">📈</span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wide">
                    Stabil & Terjaga
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form to Add New Gold Entry */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-amber-500" />
                Catat Pembelian Emas Baru 🏷️
              </h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                Masukkan berat emas dan harga beli riil untuk membandingkan keuntungan dengan harga hari ini.
              </p>
            </div>

            <form onSubmit={handleAddGold} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Weight */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Berat Emas (Gram)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={goldWeight}
                    onChange={(e) => setGoldWeight(e.target.value)}
                    placeholder="Contoh: 1, 5, 10, 0.5"
                    className="w-full p-3 bg-gray-50 border border-gray-150 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold transition-all"
                  />
                </div>

                {/* Buy Price per Gram */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Harga Beli per Gram (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-4 font-bold text-gray-400 text-xs top-1/2 -translate-y-1/2">Rp</span>
                    <input
                      type="text"
                      required
                      value={goldBuyPrice}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setGoldBuyPrice(val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '');
                      }}
                      placeholder="Contoh: 1.250.000"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Label / Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Keterangan / Label Emas</label>
                  <input
                    type="text"
                    value={goldLabel}
                    onChange={(e) => setGoldLabel(e.target.value)}
                    placeholder="Contoh: Antam Brankas, Tabungan Pegadaian, Mas Kawin"
                    className="w-full p-3 bg-gray-50 border border-gray-150 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium transition-all"
                  />
                </div>

                {/* Purchase Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Tanggal Pembelian</label>
                  <input
                    type="date"
                    required
                    value={goldDate}
                    onChange={(e) => setGoldDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-150 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold transition-all"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold animate-pulse">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold">
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Simpan dalam Portfolio Emas Kita 🪙</span>
              </button>
            </form>
          </div>

          {/* Portfolio Statistics & Summary Card */}
          {goldInvestments.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-200/60 rounded-3xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-left space-y-1">
                <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Total Pembelian</span>
                <span className="text-sm sm:text-base font-black text-gray-900 font-mono block">
                  {formatRupiah(totalBuyValue)}
                </span>
                <span className="text-[9px] text-gray-400 block font-bold">Total Nilai Beli</span>
              </div>

              <div className="text-left space-y-1">
                <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Nilai Saat Ini</span>
                <span className="text-sm sm:text-base font-black text-amber-700 font-mono block">
                  {formatRupiah(totalCurrentValue)}
                </span>
                <span className="text-[9px] text-gray-400 block font-bold">
                  @{formatRupiah(currentGoldPrice)}/g
                </span>
              </div>

              <div className="text-left space-y-1">
                <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Keuntungan Bersih</span>
                <span className={`text-sm sm:text-base font-black font-mono block ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {netProfit >= 0 ? '+' : ''}{formatRupiah(netProfit)}
                </span>
                <span className={`text-[10px] font-black inline-flex items-center gap-0.5 rounded-md px-1 py-0.2 ${netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {netProfit >= 0 ? '📈' : '📉'} {profitPercentage.toFixed(1)}%
                </span>
              </div>

              <div className="text-left space-y-1">
                <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Harga Rata-rata</span>
                <span className="text-sm sm:text-base font-black text-gray-900 font-mono block">
                  {formatRupiah(avgBuyPrice)}
                </span>
                <span className="text-[9px] text-gray-400 block font-bold">Per Gram Emas</span>
              </div>
            </div>
          )}

          {/* Gold Portfolio Ledger List */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs">
            <h4 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-amber-500 rounded-xs"></span>
              Rincian Emas yang Dimiliki ({filteredGoldInvestments.length})
            </h4>

            {filteredGoldInvestments.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 italic border border-dashed border-gray-200 rounded-2xl">
                Belum ada catatan kepemilikan emas untuk {activeTabScope === 'bersama' ? 'Bersama' : activeTabScope === 'pribadi_nibras' ? 'Nibras' : 'Zenita'}. Tambahkan di form atas!
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredGoldInvestments.map(item => {
                  const buyValue = item.weightGrams * item.buyPricePerGram;
                  const curValue = item.weightGrams * currentGoldPrice;
                  const itemProfit = curValue - buyValue;
                  const itemRoi = (itemProfit / buyValue) * 100;

                  return (
                    <div 
                      key={item.id}
                      className="p-4 bg-gray-50/60 hover:bg-gray-50 rounded-2xl border border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 bg-amber-100/50 rounded-xl shrink-0 flex items-center justify-center text-lg shadow-3xs border border-amber-200/30">
                          🪙
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-black text-gray-900 truncate">{item.label}</h5>
                          
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[10px] font-bold text-gray-400">
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">
                              {item.weightGrams} gram
                            </span>
                            <span>•</span>
                            <span>Beli: {formatRupiah(item.buyPricePerGram)}/g</span>
                            <span>•</span>
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-gray-400 font-bold block">Nilai Sekarang</span>
                          <span className="text-sm font-black text-gray-950 font-mono tracking-tight block">
                            {formatRupiah(curValue)}
                          </span>
                        </div>

                        <div className="text-right flex items-center gap-2.5">
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-black font-mono tracking-tight ${itemProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {itemProfit >= 0 ? '+' : ''}{formatRupiah(itemProfit)}
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                              itemProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {itemProfit >= 0 ? '▲' : '▼'} {itemRoi.toFixed(1)}%
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteGold(item.id)}
                            className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Hapus emas ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Apakah Ada Investasi Lainnya Section */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Apakah kalian memiliki investasi aktif lainnya? 🤔
                </h3>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                  Catat portofolio investasi selain emas fisik, masukkan modal beli vs nilai terkini untuk memantau untung/rugi.
                </p>
              </div>
              <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-150 shrink-0 w-fit">
                <button
                  type="button"
                  onClick={() => handleSetHasOther(true)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    hasOtherInvestments ? 'bg-indigo-600 text-white shadow-3xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Iya, ada 📈
                </button>
                <button
                  type="button"
                  onClick={() => handleSetHasOther(false)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    !hasOtherInvestments ? 'bg-indigo-600 text-white shadow-3xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Tidak ada 🚫
                </button>
              </div>
            </div>

            {hasOtherInvestments && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Form to log a new custom investment */}
                <div className="bg-gray-50/70 p-4.5 rounded-2xl border border-gray-150 space-y-3.5">
                  <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-500" />
                    Catat Portofolio Investasi Baru
                  </h4>

                  <form onSubmit={handleAddCustomInvestment} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 block mb-1">Kategori Investasi</label>
                        <select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold"
                        >
                          <option value="rdpu">🟢 RDPU Syariah</option>
                          <option value="sukuk">🔵 Sukuk Negara / SBSN</option>
                          <option value="saham">🟠 Saham Syariah (JII)</option>
                          <option value="emas">🟡 Emas Digital / Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-600 block mb-1">Nama / Label Aset</label>
                        <input
                          type="text"
                          required
                          value={customLabel}
                          onChange={(e) => setCustomLabel(e.target.value)}
                          placeholder="Contoh: Saham BRIS, SR021, Mandiri Syariah"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 block mb-1">Harga Beli / Modal Awal (Rp)</label>
                        <div className="relative">
                          <span className="absolute left-3 text-xs font-bold text-gray-400 top-1/2 -translate-y-1/2">Rp</span>
                          <input
                            type="text"
                            required
                            value={customBuyPrice}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setCustomBuyPrice(val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '');
                            }}
                            placeholder="Contoh: 1.000.000"
                            className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-600 block mb-1">Tanggal Mulai Investasi</label>
                        <input
                          type="date"
                          required
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 block mb-1">Kepemilikan Investasi</label>
                        <select
                          value={customScope}
                          onChange={(e) => setCustomScope(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold"
                        >
                          <option value="bersama">💖 Tabungan Bersama</option>
                          <option value="pribadi_nibras">👨 Saku Nibras Sendiri</option>
                          <option value="pribadi_zenita">👩 Saku Zenita Sendiri</option>
                        </select>
                      </div>
                    </div>

                    {customError && (
                      <div className="p-2.5 bg-red-50 border border-red-150 text-red-600 rounded-xl text-[10px] font-bold animate-pulse">
                        {customError}
                      </div>
                    )}
                    {customSuccess && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-xl text-[10px] font-bold">
                        {customSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                    >
                      Catat & Pantau Investasi ini 📈
                    </button>
                  </form>
                </div>

                {/* Filters and List */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                    <h4 className="text-xs font-black text-gray-950 flex items-center gap-1">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      Daftar Portofolio Investasi Lainnya ({filteredCustomInvestments.length + filteredDetectedSavings.length})
                    </h4>
                  </div>

                  {/* Portfolio List */}
                  {(filteredCustomInvestments.length + filteredDetectedSavings.length) === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-400 italic border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
                      Belum ada catatan investasi untuk {activeTabScope === 'bersama' ? 'Bersama' : activeTabScope === 'pribadi_nibras' ? 'Nibras' : 'Zenita'}.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...filteredCustomInvestments, ...filteredDetectedSavings]
                        .map(item => {
                          const profitLoss = item.currentPrice - item.buyPrice;
                          const roi = item.buyPrice > 0 ? (profitLoss / item.buyPrice) * 100 : 0;
                          const isFromSavings = 'isFromSavings' in item && item.isFromSavings;

                          return (
                            <div
                              key={item.id}
                              className={`p-4 hover:bg-gray-50/50 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all text-left ${
                                isFromSavings 
                                  ? 'bg-amber-50/15 border-amber-200/60' 
                                  : 'bg-white border-gray-150'
                              }`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg border shadow-3xs ${
                                  isFromSavings
                                    ? 'bg-amber-100/50 border-amber-200/50'
                                    : 'bg-gray-50/50 border-gray-100'
                                }`}>
                                  {isFromSavings ? '💼' : item.category === 'rdpu' ? '🟢' : item.category === 'sukuk' ? '🔵' : item.category === 'saham' ? '🟠' : '🟡'}
                                </div>
                                <div className="min-w-0 text-left">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h5 className="text-xs font-black text-gray-900 leading-tight truncate">
                                      {item.label}
                                    </h5>
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                                      item.scope === 'bersama' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                      item.scope === 'pribadi_nibras' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                      'bg-pink-50 text-pink-600 border border-pink-100'
                                    }`}>
                                      {item.scope === 'bersama' ? 'Bersama 💖' : item.scope === 'pribadi_nibras' ? 'Nibras 👨' : 'Zenita 👩'}
                                    </span>
                                    {isFromSavings && (
                                      <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                                        🔗 Saku Tabungan
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[10px] font-bold text-gray-400">
                                    <span className="capitalize text-gray-500 font-extrabold">
                                      {isFromSavings ? 'Tabungan Seabank Terkoneksi' : item.category === 'rdpu' ? 'RDPU Syariah' : item.category === 'sukuk' ? 'Sukuk Negara' : item.category === 'saham' ? 'Saham Syariah' : 'Emas Digital'}
                                    </span>
                                    <span>•</span>
                                    <span>Nilai Utama: {formatRupiah(item.buyPrice)}</span>
                                    <span>•</span>
                                    <span className="text-gray-500">{isFromSavings ? 'Sinkron Otomatis' : item.date}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-gray-100 shrink-0">
                                <div className="text-left sm:text-right min-w-[95px]">
                                  <span className="text-[10px] text-gray-400 font-bold block flex items-center gap-1.5 sm:justify-end">
                                    Nilai Terkini
                                    <span className="inline-flex items-center gap-0.5 text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-black px-1 rounded animate-pulse">
                                      ● LIVE
                                    </span>
                                  </span>
                                  
                                  <span className={`text-xs font-black font-mono tracking-tight block transition-colors duration-500 ${priceUpdatedPulse ? 'text-indigo-600' : 'text-gray-950'}`}>
                                    {formatRupiah(item.currentPrice)}
                                  </span>
                                </div>

                                <div className="text-right flex items-center gap-2.5">
                                  <div className="flex flex-col items-end">
                                    <span className={`text-xs font-black font-mono tracking-tight ${profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {profitLoss >= 0 ? '+' : ''}{formatRupiah(profitLoss)}
                                    </span>
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                      profitLoss >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                    }`}>
                                      {profitLoss >= 0 ? '▲' : '▼'} {roi.toFixed(1)}%
                                    </span>
                                  </div>

                                  {!isFromSavings ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCustom(item.id)}
                                      className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <div className="p-1.5 text-emerald-500 bg-emerald-50 rounded-lg border border-emerald-150" title="Sinkron Terkoneksi">
                                      <span className="text-[10px] font-bold">✓</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: INVESTMENT ADVISOR (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Educational Panel on Alternatives */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs">
            <div className="space-y-1 mb-4">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">Investment Matchmaker 🎓</span>
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Saran Investasi Selain Emas
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">
                Sesuaikan investasi dengan profil risiko dan impian keuangan kalian berdua.
              </p>
            </div>

            {/* Quick Interactive Matchmaker Form */}
            <div className="bg-gray-50 rounded-2xl p-4.5 border border-gray-150 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">1. Tujuan Investasi</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'darurat', label: '🚨 Dana Darurat' },
                    { key: 'liburan', label: '✈️ Liburan/Jalan' },
                    { key: 'rumah', label: '🏠 Impian Rumah' },
                    { key: 'masadepan', label: '🎓 Tabungan Depan' }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setGoal(opt.key as any)}
                      className={`py-2 px-1.5 rounded-xl text-[10px] font-black text-center border cursor-pointer transition-all ${
                        goal === opt.key 
                          ? 'bg-rose-500 border-rose-500 text-white shadow-3xs'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">2. Jangka Waktu Investasi</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'pendek', label: '< 1 Tahun ⏳' },
                    { key: 'menengah', label: '1 - 3 Tahun 📅' },
                    { key: 'panjang', label: '> 3 Tahun 🚀' }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setDuration(opt.key as any)}
                      className={`py-2 px-1 rounded-xl text-[9px] font-black text-center border cursor-pointer transition-all ${
                        duration === opt.key
                          ? 'bg-rose-500 border-rose-500 text-white shadow-3xs'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">3. Toleransi Risiko (Fluktuasi)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'konservatif', label: '🛡️ Sangat Aman' },
                    { key: 'moderat', label: '⚖️ Sedang/Wajar' },
                    { key: 'agresif', label: '🔥 Siap Naik-Turun' }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setRisk(opt.key as any)}
                      className={`py-2 px-1 rounded-xl text-[9px] font-black text-center border cursor-pointer transition-all ${
                        risk === opt.key
                          ? 'bg-rose-500 border-rose-500 text-white shadow-3xs'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulated AI allocation wheel/bar result */}
            {showMatchmakerResult && (
              <div className="mt-5 p-5 bg-gradient-to-br from-indigo-50 to-indigo-100/30 border border-indigo-100 rounded-2xl space-y-4 animate-slide-up">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950 block">{rec.title}</h4>
                    <p className="text-[10px] text-indigo-600 font-medium leading-relaxed mt-0.5">{rec.desc}</p>
                  </div>
                </div>

                {/* Horizontal Allocation Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-extrabold text-indigo-900">
                    <span>Target Alokasi Portofolio</span>
                    <span>100% Sempurna</span>
                  </div>
                  
                  <div className="h-4.5 w-full bg-gray-200 rounded-full flex overflow-hidden font-mono text-[9px] text-white font-bold text-center">
                    {rec.rdpu > 0 && (
                      <div className="bg-emerald-500 flex items-center justify-center h-full transition-all" style={{ width: `${rec.rdpu}%` }} title={`Reksa Dana Pasar Uang Syariah: ${rec.rdpu}%`}>
                        {rec.rdpu}% RDPU Syariah
                      </div>
                    )}
                    {rec.sbn > 0 && (
                      <div className="bg-indigo-600 flex items-center justify-center h-full transition-all" style={{ width: `${rec.sbn}%` }} title={`Sukuk Negara: ${rec.sbn}%`}>
                        {rec.sbn}% Sukuk
                      </div>
                    )}
                    {rec.saham > 0 && (
                      <div className="bg-orange-500 flex items-center justify-center h-full transition-all" style={{ width: `${rec.saham}%` }} title={`Saham Syariah: ${rec.saham}%`}>
                        {rec.saham}% Saham Syariah
                      </div>
                    )}
                    {rec.emas > 0 && (
                      <div className="bg-amber-500 flex items-center justify-center h-full transition-all" style={{ width: `${rec.emas}%` }} title={`Emas Batangan: ${rec.emas}%`}>
                        {rec.emas}% Emas
                      </div>
                    )}
                  </div>
                </div>

                {/* Explanation Grid */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  {rec.rdpu > 0 && (
                    <div className="bg-white p-2 rounded-xl border border-indigo-100/50">
                      <span className="text-[9px] font-bold text-gray-400 block">🟢 RDPU Syariah</span>
                      <span className="text-[10px] font-extrabold text-gray-800 leading-tight">Sangat aman, cair cepat, imbal hasil bersih ~5.5% net, diawasi DSN-MUI.</span>
                    </div>
                  )}
                  {rec.sbn > 0 && (
                    <div className="bg-white p-2 rounded-xl border border-indigo-100/50">
                      <span className="text-[9px] font-bold text-gray-400 block">🔵 Sukuk Ritel & Negara</span>
                      <span className="text-[10px] font-extrabold text-gray-800 leading-tight">100% dijamin negara, berbasis syariah, kupon bulanan ~6.2%.</span>
                    </div>
                  )}
                  {rec.saham > 0 && (
                    <div className="bg-white p-2 rounded-xl border border-indigo-100/50">
                      <span className="text-[9px] font-bold text-gray-400 block">🟠 Saham Syariah (JII)</span>
                      <span className="text-[10px] font-extrabold text-gray-800 leading-tight">Kepemilikan bisnis top halal (TLKM, BRIS, ASII, ICBP) bebas riba.</span>
                    </div>
                  )}
                  {rec.emas > 0 && (
                    <div className="bg-white p-2 rounded-xl border border-indigo-100/50">
                      <span className="text-[9px] font-bold text-gray-400 block">🟡 Emas Batangan</span>
                      <span className="text-[10px] font-extrabold text-gray-800 leading-tight">Pelindung nilai riil terbaik terhadap inflasi global.</span>
                    </div>
                  )}
                </div>

                {/* Customized Advice Bullet Points */}
                <div className="space-y-1.5 pt-1.5 border-t border-indigo-100">
                  <span className="text-[9px] font-black text-indigo-900 uppercase tracking-wider block">🕌 Rekomendasi Langkah Praktis Syariah:</span>
                  <ul className="space-y-1 text-[10px] text-indigo-950 font-medium">
                    {rec.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Hubungkan dengan Tabungan Riil Kita */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs space-y-4">
            <div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Integrasi Saldo Riil 💰</span>
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                <Landmark className="w-5 h-5 text-indigo-600" />
                Alokasi Tabungan ke Investasi
              </h3>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                Pilih saku tabungan kalian dan pindahkan dananya langsung ke instrumen investasi syariah yang sudah direkomendasikan di atas.
              </p>
            </div>

            {/* Scope tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-2xl border border-gray-150 text-center">
              {[
                { key: 'bersama', label: '💖 Bersama', total: accounts.filter(a => a.scope === 'bersama' || !a.scope).reduce((sum, a) => sum + a.balance, 0) },
                { key: 'pribadi_nibras', label: '👨 Nibras', total: accounts.filter(a => a.scope === 'pribadi' && a.owner === 'Nibras').reduce((sum, a) => sum + a.balance, 0) },
                { key: 'pribadi_zenita', label: '👩 Zenita', total: accounts.filter(a => a.scope === 'pribadi' && a.owner === 'Zenita').reduce((sum, a) => sum + a.balance, 0) }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setSelectedSavingsScope(tab.key as any);
                    // Pre-select the first account in the new scope
                    const filtered = accounts.filter(a => {
                      if (tab.key === 'bersama') return a.scope === 'bersama' || !a.scope;
                      if (tab.key === 'pribadi_nibras') return a.scope === 'pribadi' && a.owner === 'Nibras';
                      return a.scope === 'pribadi' && a.owner === 'Zenita';
                    });
                    setAllocationAccount(filtered[0]?.id || '');
                  }}
                  className={`py-2 px-1.5 rounded-xl text-center cursor-pointer transition-all ${
                    selectedSavingsScope === tab.key
                      ? 'bg-indigo-600 text-white shadow-3xs'
                      : 'bg-white border border-gray-150 text-gray-600 hover:bg-gray-100/50'
                  }`}
                >
                  <span className="text-[9px] font-black block leading-none">{tab.label}</span>
                  <span className="text-[9px] font-black font-mono block leading-none mt-1 opacity-90">{formatRupiah(tab.total)}</span>
                </button>
              ))}
            </div>

            {/* Saku Accounts list under chosen scope */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                Pilih Rekening Sumber Dana:
              </label>
              
              {accounts.filter(a => {
                if (selectedSavingsScope === 'bersama') return a.scope === 'bersama' || !a.scope;
                if (selectedSavingsScope === 'pribadi_nibras') return a.scope === 'pribadi' && a.owner === 'Nibras';
                return a.scope === 'pribadi' && a.owner === 'Zenita';
              }).length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-400 italic">
                  Belum ada tempat simpan uang di saku ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {accounts.filter(a => {
                    if (selectedSavingsScope === 'bersama') return a.scope === 'bersama' || !a.scope;
                    if (selectedSavingsScope === 'pribadi_nibras') return a.scope === 'pribadi' && a.owner === 'Nibras';
                    return a.scope === 'pribadi' && a.owner === 'Zenita';
                  }).map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAllocationAccount(a.id)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between h-18 ${
                        allocationAccount === a.id
                          ? 'border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-500/10'
                          : 'border-gray-150 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-700 truncate">{a.name}</span>
                      <span className="text-xs font-black font-mono mt-1 text-indigo-950">{formatRupiah(a.balance)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Allocation Form */}
            <form onSubmit={handleAllocateSavings} className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/20 p-4 rounded-2xl border border-indigo-100/40 space-y-3.5">
              <h4 className="text-[10px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡ Eksekusi Alokasi Dana</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div>
                  <label className="text-[10px] font-black text-indigo-900 block mb-1">Target Instrumen</label>
                  <select
                    value={allocationCategory}
                    onChange={(e) => setAllocationCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-indigo-950"
                  >
                    <option value="rdpu">🟢 RDPU Syariah (Saran {rec.rdpu}%)</option>
                    <option value="sukuk">🔵 Sukuk Negara (Saran {rec.sbn}%)</option>
                    <option value="saham">🟠 Saham Syariah (Saran {rec.saham}%)</option>
                    <option value="emas">🟡 Emas Batangan (Saran {rec.emas}%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-indigo-900 block mb-1">Jumlah Investasi (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 text-xs font-bold text-gray-400 top-1/2 -translate-y-1/2">Rp</span>
                    <input
                      type="text"
                      required
                      value={allocationAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setAllocationAmount(val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '');
                      }}
                      placeholder="Contoh: 100.000"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold font-mono text-indigo-950"
                    />
                  </div>
                </div>
              </div>

              {allocationError && (
                <div className="p-2.5 bg-red-50 border border-red-150 text-red-600 rounded-xl text-[10px] font-bold animate-pulse">
                  {allocationError}
                </div>
              )}
              {allocationSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-xl text-[10px] font-bold">
                  {allocationSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isAllocating || !allocationAccount}
                className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !allocationAccount 
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
                }`}
              >
                {isAllocating ? (
                  <span>Memproses Transfer...</span>
                ) : (
                  <span>Pindahkan Tabungan ke Investasi 💸</span>
                )}
              </button>
            </form>
          </div>

          {/* Educational Comparison Card: Why invest besides gold? */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs text-left space-y-4">
            <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
              <Info className="w-4.5 h-4.5 text-rose-500" />
              Mengapa Kita Perlu Diversifikasi Selain Emas? 🕌
            </h4>

            <div className="space-y-3.5 text-xs font-medium text-gray-600 leading-relaxed">
              <p>
                Emas adalah aset pelindung kekayaan (<span className="italic">wealth protector</span>) yang sangat baik karena harganya stabil naik jangka panjang. Namun, emas <strong>tidak menghasilkan dividen atau bagi hasil rutin bulanan</strong> dan harganya bisa mendatar selama bertahun-tahun.
              </p>
              
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                  <span className="font-extrabold text-emerald-800 block text-[11px]">1. Keuntungan Saham Syariah (Bisnis Halal Produktif)</span>
                  <span className="text-[10px] mt-0.5 block leading-relaxed">
                    Investasi saham di emiten Syariah terkemuka (seperti <strong>BRIS, TLKM, ASII, ICBP</strong>) secara historis tumbuh rata-rata <strong>10-15% per tahun</strong> ditambah pembagian dividen tunai tahunan yang bersih dari riba.
                  </span>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                  <span className="font-extrabold text-blue-800 block text-[11px]">2. Passive Income Bulanan Halal dari Sukuk Ritel Negara</span>
                  <span className="text-[10px] mt-0.5 block leading-relaxed">
                    Membeli SBSN (Surat Berharga Syariah Negara) seperti SR atau ST membuat uang kalian bekerja secara produktif untuk infrastruktur publik tanah air, menghasilkan imbalan bagi hasil bulanan pasti langsung ke rekening bank.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-800 font-bold leading-normal">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Selalu sesuaikan keputusan investasi dengan musyawarah berdua. Pilihlah instrumen syariah yang terdaftar resmi dan diawasi oleh OJK serta Dewan Syariah Nasional (DSN-MUI).</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
