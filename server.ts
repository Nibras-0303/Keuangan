import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { DatabaseSchema, Account, Transaction, Receipt, CoupleProfile } from './src/types.js';
import { db } from './src/db/index.ts';
import { accounts, transactions, receipts, profile, photos } from './src/db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';

const app = express();
const PORT = 3000;

// Determine whether to run on PostgreSQL or fallback to local JSON database
let usePostgres = !!(process.env.DATABASE_URL || process.env.SQL_HOST);
console.log(`KitaPunya: usePostgres is set to ${usePostgres}`);

// Support larger payloads for uploading receipt images (base64)
app.use(express.json({ limit: '15mb' }));

// Helper to get initial seed data
function getInitialData(): DatabaseSchema {
  const today = new Date().toISOString().split('T')[0];
  
  const initialAccounts: Account[] = [
    {
      id: 'acc_1',
      name: 'Kantong Nibras',
      type: 'bank',
      balance: 1500000,
      color: 'emerald',
      iconName: 'Wallet',
      scope: 'pribadi',
      owner: 'Nibras'
    },
    {
      id: 'acc_2',
      name: 'Kantong Zenita',
      type: 'bank',
      balance: 1500000,
      color: 'pink',
      iconName: 'Wallet',
      scope: 'pribadi',
      owner: 'Zenita'
    },
    {
      id: 'acc_3',
      name: 'SeaBank - Nabung Bersama',
      type: 'savings',
      balance: 5000000,
      color: 'orange',
      iconName: 'Heart',
      scope: 'bersama'
    },
    {
      id: 'acc_4',
      name: 'SeaBank - Belanja Bersama',
      type: 'bank',
      balance: 2000000,
      color: 'orange',
      iconName: 'CreditCard',
      scope: 'bersama'
    }
  ];

  const initialTransactions: Transaction[] = [
    {
      id: 'tx_1',
      type: 'income',
      amount: 4500000,
      accountId: 'acc_1',
      category: 'Gaji Bulanan',
      date: today,
      notes: 'Gaji bulanan masuk ke Kantong Nibras',
      addedBy: 'Nibras',
      createdAt: new Date().toISOString(),
      scope: 'pribadi',
      owner: 'Nibras'
    },
    {
      id: 'tx_2',
      type: 'income',
      amount: 4000000,
      accountId: 'acc_2',
      category: 'Gaji Bulanan',
      date: today,
      notes: 'Gaji bulanan masuk ke Kantong Zenita',
      addedBy: 'Zenita',
      createdAt: new Date().toISOString(),
      scope: 'pribadi',
      owner: 'Zenita'
    },
    {
      id: 'tx_3',
      type: 'expense',
      amount: 150000,
      accountId: 'acc_4',
      category: 'Makanan',
      date: today,
      notes: 'Makan pecel lele romantis berdua Zenita',
      addedBy: 'Nibras',
      createdAt: new Date().toISOString(),
      scope: 'bersama'
    },
    {
      id: 'tx_4',
      type: 'transfer',
      amount: 500000,
      accountId: 'acc_1',
      toAccountId: 'acc_3',
      category: 'Transfer',
      date: today,
      notes: 'Nabung bareng bulanan ke SeaBank',
      addedBy: 'Nibras',
      createdAt: new Date().toISOString(),
      scope: 'bersama'
    }
  ];

  const initialReceipts: Receipt[] = [
    {
      id: 'rc_1',
      imageUrl: '', // Blank for seed
      merchantName: 'Superindo Kemang',
      date: today,
      totalAmount: 145000,
      items: [
        { name: 'Ayam Potong 1kg', price: 42000, quantity: 1 },
        { name: 'Minyak Goreng 2L', price: 36000, quantity: 1 },
        { name: 'Indomie Goreng Pack', price: 15000, quantity: 1 },
        { name: 'Susu UHT 1L', price: 18000, quantity: 2 },
        { name: 'Bumbu Dapur Lengkap', price: 16000, quantity: 1 }
      ],
      status: 'saved',
      scannedAt: new Date().toISOString(),
      addedBy: 'Nibras'
    }
  ];

  const initialProfile: CoupleProfile = {
    user1: 'Nibras',
    user2: 'Zenita',
    anniversaryDate: '2026-02-06',
    passcode: '1234',
    monthlyBudget: 3000000
  };

  return {
    accounts: initialAccounts,
    transactions: initialTransactions,
    receipts: initialReceipts,
    profile: initialProfile,
    photos: []
  };
}

// Check if Database is empty on start, and seed initial data if needed
const dbFilePath = process.env.VERCEL 
  ? path.join('/tmp', 'database.json') 
  : path.join(process.cwd(), 'database.json');

function readLocalFileDB(): DatabaseSchema {
  try {
    if (fs.existsSync(dbFilePath)) {
      const content = fs.readFileSync(dbFilePath, 'utf-8');
      const data = JSON.parse(content);
      return {
        accounts: data.accounts || [],
        transactions: data.transactions || [],
        receipts: data.receipts || [],
        profile: data.profile || getInitialData().profile,
        photos: data.photos || []
      };
    } else if (process.env.VERCEL) {
      // On Vercel, if the /tmp file does not exist yet, read the read-only file from process.cwd()
      const fallbackPath = path.join(process.cwd(), 'database.json');
      if (fs.existsSync(fallbackPath)) {
        const content = fs.readFileSync(fallbackPath, 'utf-8');
        const data = JSON.parse(content);
        return {
          accounts: data.accounts || [],
          transactions: data.transactions || [],
          receipts: data.receipts || [],
          profile: data.profile || getInitialData().profile,
          photos: data.photos || []
        };
      }
    }
  } catch (err) {
    console.error('Failed to read from local database.json:', err);
  }
  return getInitialData();
}

function writeLocalFileDB(data: DatabaseSchema) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write to local database.json:', err);
  }
}

async function checkAndSeedDatabase() {
  let postgresOk = false;
  if (usePostgres) {
    try {
      console.log('Checking if PostgreSQL database is seeded...');
      const profiles = await db.select().from(profile).limit(1);
      if (profiles.length === 0) {
        console.log('PostgreSQL is empty. Seeding initial financial data...');
        const initial = getInitialData();
        
        // Seed profile
        await db.insert(profile).values({
          user1: initial.profile.user1,
          user2: initial.profile.user2,
          anniversaryDate: initial.profile.anniversaryDate,
          passcode: initial.profile.passcode,
          monthlyBudget: initial.profile.monthlyBudget,
        });

        // Seed accounts
        if (initial.accounts.length > 0) {
          await db.insert(accounts).values(initial.accounts.map(acc => ({
            id: acc.id,
            name: acc.name,
            type: acc.type,
            balance: acc.balance,
            color: acc.color,
            iconName: acc.iconName,
            scope: acc.scope || 'bersama',
            owner: acc.owner || null,
            isInvested: acc.isInvested || false,
            investmentCategory: acc.investmentCategory || null,
            isSeaBank: acc.isSeaBank || false,
            seaBankInterestRate: acc.seaBankInterestRate !== undefined ? acc.seaBankInterestRate : 3.75,
            seaBankInterestAccumulated: acc.seaBankInterestAccumulated || 0,
          })));
        }

        // Seed transactions
        if (initial.transactions.length > 0) {
          await db.insert(transactions).values(initial.transactions.map(tx => ({
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            accountId: tx.accountId,
            toAccountId: tx.toAccountId || null,
            category: tx.category,
            date: tx.date,
            notes: tx.notes || '',
            receiptId: tx.receiptId || null,
            addedBy: tx.addedBy,
            createdAt: tx.createdAt,
            scope: tx.scope || 'bersama',
            owner: tx.owner || null,
          })));
        }

        // Seed receipts
        if (initial.receipts.length > 0) {
          await db.insert(receipts).values(initial.receipts.map(rc => ({
            id: rc.id,
            imageUrl: rc.imageUrl || '',
            merchantName: rc.merchantName,
            date: rc.date,
            totalAmount: rc.totalAmount,
            items: rc.items,
            status: rc.status,
            scannedAt: rc.scannedAt,
            addedBy: rc.addedBy,
            category: rc.category || null,
          })));
        }
        console.log('PostgreSQL seeding completed successfully!');
      } else {
        console.log('PostgreSQL database already has data. Skipping seed.');
      }
      postgresOk = true;
    } catch (err) {
      console.error('Error checking/seeding PostgreSQL. Disabling PostgreSQL and falling back to local DB:', err);
      usePostgres = false;
    }
  }

  // If postgres is not used or failed, try local file DB
  if (!postgresOk) {
    try {
      const localData = readLocalFileDB();
      if (!localData.accounts || localData.accounts.length === 0) {
        console.log('Local database.json is empty or doesn\'t exist. Seeding local database...');
        writeLocalFileDB(getInitialData());
      }
    } catch (err) {
      console.error('Error seeding local database.json:', err);
    }
  }
}

// PostgreSQL Database helper operations
async function readPostgresDB(): Promise<DatabaseSchema> {
  const [accs, txs, rcs, profs, phs] = await Promise.all([
    db.select().from(accounts),
    db.select().from(transactions),
    db.select().from(receipts),
    db.select().from(profile),
    db.select().from(photos)
  ]);

  let currentProfile: CoupleProfile = profs.length > 0 ? {
    user1: profs[0].user1,
    user2: profs[0].user2,
    anniversaryDate: profs[0].anniversaryDate || '2026-02-06',
    passcode: profs[0].passcode,
    monthlyBudget: profs[0].monthlyBudget
  } : getInitialData().profile;

  return {
    accounts: accs.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type as any,
      balance: a.balance,
      color: a.color,
      iconName: a.iconName,
      scope: a.scope as any,
      owner: a.owner || undefined,
      isInvested: a.isInvested,
      investmentCategory: a.investmentCategory as any,
      isSeaBank: a.isSeaBank,
      seaBankInterestRate: a.seaBankInterestRate,
      seaBankInterestAccumulated: a.seaBankInterestAccumulated
    })),
    transactions: txs.map(t => ({
      id: t.id,
      type: t.type as any,
      amount: t.amount,
      accountId: t.accountId,
      toAccountId: t.toAccountId || undefined,
      category: t.category,
      date: t.date,
      notes: t.notes,
      receiptId: t.receiptId || undefined,
      addedBy: t.addedBy,
      createdAt: t.createdAt,
      scope: t.scope as any,
      owner: t.owner || undefined
    })),
    receipts: rcs.map(r => ({
      id: r.id,
      imageUrl: r.imageUrl,
      merchantName: r.merchantName,
      date: r.date,
      totalAmount: r.totalAmount,
      items: r.items as any,
      status: r.status as any,
      scannedAt: r.scannedAt,
      addedBy: r.addedBy,
      category: r.category || undefined
    })),
    profile: currentProfile,
    photos: phs.map(p => ({
      id: p.id,
      imageUrl: p.imageUrl,
      caption: p.caption,
      date: p.date,
      addedBy: p.addedBy,
      createdAt: p.createdAt
    }))
  };
}

// Master DB read operation
async function readDB(): Promise<DatabaseSchema> {
  if (usePostgres) {
    try {
      return await readPostgresDB();
    } catch (error) {
      console.error('Failed to read from PostgreSQL database, falling back to local DB:', error);
    }
  }
  return readLocalFileDB();
}


// -------------------------------------------------------------
// SEABANK AUTOMATIC DAILY INTEREST SIMULATOR (1 tick = 1 day)
// -------------------------------------------------------------
setInterval(async () => {
  try {
    let done = false;
    if (usePostgres) {
      try {
        const accs = await db.select().from(accounts);
        let updated = false;
        for (const acc of accs) {
          if (acc.isSeaBank && acc.balance > 0) {
            const rate = acc.seaBankInterestRate || 3.75;
            const dailyInterest = (acc.balance * (rate / 100)) / 365;
            const roundedInterest = Math.max(1, Math.round(dailyInterest));
            await db.update(accounts).set({
              balance: acc.balance + roundedInterest,
              seaBankInterestAccumulated: (acc.seaBankInterestAccumulated || 0) + roundedInterest
            }).where(eq(accounts.id, acc.id));
            updated = true;
          }
        }
        if (updated) {
          console.log('SeaBank automatic daily interest simulated on PostgreSQL.');
        }
        done = true;
      } catch (pgErr) {
        console.error('PostgreSQL SeaBank simulation failed, falling back:', pgErr);
      }
    }

    if (!done) {
      const data = readLocalFileDB();
      let updated = false;
      data.accounts = data.accounts.map(acc => {
        if (acc.isSeaBank && acc.balance > 0) {
          const rate = acc.seaBankInterestRate || 3.75;
          const dailyInterest = (acc.balance * (rate / 100)) / 365;
          const roundedInterest = Math.max(1, Math.round(dailyInterest));
          updated = true;
          return {
            ...acc,
            balance: acc.balance + roundedInterest,
            seaBankInterestAccumulated: (acc.seaBankInterestAccumulated || 0) + roundedInterest
          };
        }
        return acc;
      });
      if (updated) {
        writeLocalFileDB(data);
        console.log('SeaBank automatic daily interest simulated on local database.json.');
      }
    }
  } catch (err) {
    console.error('Failed to run SeaBank interest simulator:', err);
  }
}, 12000); // Runs every 12 seconds to simulate daily interest distribution!

// REST API Endpoints

// 1. Get complete financial data
app.get('/api/data', async (req, res) => {
  const dbData = await readDB();
  res.json(dbData);
});

// 2. Reset database to initial seed
app.post('/api/data/reset', async (req, res) => {
  const initial = getInitialData();
  try {
    let success = false;

    if (usePostgres) {
      try {
        // Clear all existing data
        await db.delete(accounts);
        await db.delete(transactions);
        await db.delete(receipts);
        await db.delete(photos);
        await db.delete(profile);

        // Re-seed profile
        await db.insert(profile).values({
          user1: initial.profile.user1,
          user2: initial.profile.user2,
          anniversaryDate: initial.profile.anniversaryDate,
          passcode: initial.profile.passcode,
          monthlyBudget: initial.profile.monthlyBudget,
        });

        // Re-seed accounts
        if (initial.accounts.length > 0) {
          await db.insert(accounts).values(initial.accounts.map(acc => ({
            id: acc.id,
            name: acc.name,
            type: acc.type,
            balance: acc.balance,
            color: acc.color,
            iconName: acc.iconName,
            scope: acc.scope || 'bersama',
            owner: acc.owner || null,
            isInvested: acc.isInvested || false,
            investmentCategory: acc.investmentCategory || null,
            isSeaBank: acc.isSeaBank || false,
            seaBankInterestRate: acc.seaBankInterestRate !== undefined ? acc.seaBankInterestRate : 3.75,
            seaBankInterestAccumulated: acc.seaBankInterestAccumulated || 0,
          })));
        }

        // Re-seed transactions
        if (initial.transactions.length > 0) {
          await db.insert(transactions).values(initial.transactions.map(tx => ({
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            accountId: tx.accountId,
            toAccountId: tx.toAccountId || null,
            category: tx.category,
            date: tx.date,
            notes: tx.notes || '',
            receiptId: tx.receiptId || null,
            addedBy: tx.addedBy,
            createdAt: tx.createdAt,
            scope: tx.scope || 'bersama',
            owner: tx.owner || null,
          })));
        }

        // Re-seed receipts
        if (initial.receipts.length > 0) {
          await db.insert(receipts).values(initial.receipts.map(rc => ({
            id: rc.id,
            imageUrl: rc.imageUrl || '',
            merchantName: rc.merchantName,
            date: rc.date,
            totalAmount: rc.totalAmount,
            items: rc.items,
            status: rc.status,
            scannedAt: rc.scannedAt,
            addedBy: rc.addedBy,
            category: rc.category || null,
          })));
        }
        console.log('PostgreSQL database reset successfully!');
        success = true;
      } catch (err) {
        console.error('PostgreSQL database reset failed, falling back:', err);
      }
    }

    // Always reset local file DB to initial seed
    writeLocalFileDB(initial);

    res.json({ status: 'ok', data: initial });
  } catch (err) {
    console.error('Failed to reset DB:', err);
    res.status(500).json({ error: 'Gagal melakukan reset database' });
  }
});

// 3. Update couple profile
app.post('/api/profile', async (req, res) => {
  const { user1, user2, anniversaryDate, passcode, monthlyBudget } = req.body;
  try {
    let success = false;
    let updatedProfile: CoupleProfile = {
      user1: user1 || 'Nibras',
      user2: user2 || 'Zenita',
      anniversaryDate: anniversaryDate || '2026-02-06',
      passcode: passcode || '1234',
      monthlyBudget: monthlyBudget !== undefined ? Number(monthlyBudget) : 3000000
    };

    if (usePostgres) {
      try {
        const profs = await db.select().from(profile).limit(1);
        const currentProfile = profs.length > 0 ? profs[0] : getInitialData().profile;

        updatedProfile = {
          user1: user1 || currentProfile.user1,
          user2: user2 || currentProfile.user2,
          anniversaryDate: anniversaryDate || currentProfile.anniversaryDate,
          passcode: passcode || currentProfile.passcode,
          monthlyBudget: monthlyBudget !== undefined ? Number(monthlyBudget) : currentProfile.monthlyBudget
        };

        if (profs.length > 0) {
          await db.update(profile).set({
            user1: updatedProfile.user1,
            user2: updatedProfile.user2,
            anniversaryDate: updatedProfile.anniversaryDate,
            passcode: updatedProfile.passcode,
            monthlyBudget: updatedProfile.monthlyBudget,
            updatedAt: new Date()
          }).where(eq(profile.id, profs[0].id));
        } else {
          await db.insert(profile).values({
            user1: updatedProfile.user1,
            user2: updatedProfile.user2,
            anniversaryDate: updatedProfile.anniversaryDate,
            passcode: updatedProfile.passcode,
            monthlyBudget: updatedProfile.monthlyBudget
          });
        }
        success = true;
      } catch (err) {
        console.error('PostgreSQL profile update failed, falling back:', err);
      }
    }



    // Always mirror to / update local file DB
    const localData = readLocalFileDB();
    updatedProfile = {
      user1: user1 || localData.profile.user1,
      user2: user2 || localData.profile.user2,
      anniversaryDate: anniversaryDate || localData.profile.anniversaryDate,
      passcode: passcode || localData.profile.passcode,
      monthlyBudget: monthlyBudget !== undefined ? Number(monthlyBudget) : localData.profile.monthlyBudget
    };
    localData.profile = updatedProfile;
    writeLocalFileDB(localData);

    res.json({ status: 'ok', profile: updatedProfile });
  } catch (err) {
    console.error('Failed to update profile:', err);
    res.status(500).json({ error: 'Gagal memperbarui profil' });
  }
});

// 4. Create or update financial account (tempat simpan uang)
app.post('/api/accounts', async (req, res) => {
  const { id, name, type, balance, color, iconName, scope, owner, isInvested, investmentCategory, isSeaBank, seaBankInterestRate, seaBankInterestAccumulated } = req.body;
  try {
    let success = false;
    let targetId = id;

    if (usePostgres) {
      try {
        if (id) {
          // Update existing account
          await db.update(accounts).set({
            name: name || undefined,
            type: type || undefined,
            balance: balance !== undefined ? Number(balance) : undefined,
            color: color || undefined,
            iconName: iconName || undefined,
            scope: scope || undefined,
            owner: owner !== undefined ? (owner || null) : undefined,
            isInvested: isInvested !== undefined ? Boolean(isInvested) : undefined,
            investmentCategory: investmentCategory !== undefined ? (investmentCategory || null) : undefined,
            isSeaBank: isSeaBank !== undefined ? Boolean(isSeaBank) : undefined,
            seaBankInterestRate: seaBankInterestRate !== undefined ? Number(seaBankInterestRate) : undefined,
            seaBankInterestAccumulated: seaBankInterestAccumulated !== undefined ? Number(seaBankInterestAccumulated) : undefined
          }).where(eq(accounts.id, id));
        } else {
          // Create new account
          targetId = 'acc_' + Math.random().toString(36).substr(2, 9);
          await db.insert(accounts).values({
            id: targetId,
            name: name || 'Akun Baru',
            type: type || 'cash',
            balance: Number(balance) || 0,
            color: color || 'blue',
            iconName: iconName || 'Wallet',
            scope: scope || 'bersama',
            owner: owner || null,
            isInvested: isInvested !== undefined ? Boolean(isInvested) : false,
            investmentCategory: investmentCategory || null,
            isSeaBank: isSeaBank !== undefined ? Boolean(isSeaBank) : false,
            seaBankInterestRate: seaBankInterestRate !== undefined ? Number(seaBankInterestRate) : 3.75,
            seaBankInterestAccumulated: seaBankInterestAccumulated !== undefined ? Number(seaBankInterestAccumulated) : 0
          });
        }
        success = true;
      } catch (err) {
        console.error('PostgreSQL account update failed, falling back:', err);
      }
    }



    // Always mirror to / update local file DB
    const localData = readLocalFileDB();
    if (id) {
      localData.accounts = localData.accounts.map(acc => {
        if (acc.id === id) {
          return {
            ...acc,
            name: name || acc.name,
            type: type || acc.type,
            balance: balance !== undefined ? Number(balance) : acc.balance,
            color: color || acc.color,
            iconName: iconName || acc.iconName,
            scope: scope || acc.scope,
            owner: owner !== undefined ? (owner || undefined) : acc.owner,
            isInvested: isInvested !== undefined ? Boolean(isInvested) : acc.isInvested,
            investmentCategory: investmentCategory !== undefined ? (investmentCategory || undefined) : acc.investmentCategory,
            isSeaBank: isSeaBank !== undefined ? Boolean(isSeaBank) : acc.isSeaBank,
            seaBankInterestRate: seaBankInterestRate !== undefined ? Number(seaBankInterestRate) : acc.seaBankInterestRate,
            seaBankInterestAccumulated: seaBankInterestAccumulated !== undefined ? Number(seaBankInterestAccumulated) : acc.seaBankInterestAccumulated
          };
        }
        return acc;
      });
    } else {
      if (!targetId) targetId = 'acc_' + Math.random().toString(36).substr(2, 9);
      localData.accounts.push({
        id: targetId,
        name: name || 'Akun Baru',
        type: type || 'cash',
        balance: Number(balance) || 0,
        color: color || 'blue',
        iconName: iconName || 'Wallet',
        scope: scope || 'bersama',
        owner: owner || undefined,
        isInvested: isInvested !== undefined ? Boolean(isInvested) : false,
        investmentCategory: investmentCategory || undefined,
        isSeaBank: isSeaBank !== undefined ? Boolean(isSeaBank) : false,
        seaBankInterestRate: seaBankInterestRate !== undefined ? Number(seaBankInterestRate) : 3.75,
        seaBankInterestAccumulated: seaBankInterestAccumulated !== undefined ? Number(seaBankInterestAccumulated) : 0
      });
    }
    writeLocalFileDB(localData);

    const dbData = await readDB();
    res.json({ status: 'ok', accounts: dbData.accounts });
  } catch (err) {
    console.error('Failed to create/update account:', err);
    res.status(500).json({ error: 'Gagal menyimpan tempat simpan uang' });
  }
});

// Delete an account
app.delete('/api/accounts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let success = false;

    // Check transactions first (using master readDB to be accurate)
    const dbDataBefore = await readDB();
    const hasTransactions = dbDataBefore.transactions.some(t => t.accountId === id || t.toAccountId === id);
    if (hasTransactions) {
      return res.status(400).json({ 
        error: 'Cannot delete account. There are active transactions linked to this account. Please delete or reassign them first.' 
      });
    }

    if (usePostgres) {
      try {
        await db.delete(accounts).where(eq(accounts.id, id));
        success = true;
      } catch (err) {
        console.error('PostgreSQL account delete failed, falling back:', err);
      }
    }



    // Always mirror to / delete from local file DB
    const localData = readLocalFileDB();
    localData.accounts = localData.accounts.filter(acc => acc.id !== id);
    writeLocalFileDB(localData);

    const dbData = await readDB();
    res.json({ status: 'ok', accounts: dbData.accounts });
  } catch (err) {
    console.error('Failed to delete account:', err);
    res.status(500).json({ error: 'Gagal menghapus tempat simpan uang' });
  }
});

// 5. Add Transaction (and dynamically adjust account balances inside a secure transaction block)
app.post('/api/transactions', async (req, res) => {
  const { type, amount, accountId, toAccountId, category, date, notes, receiptId, addedBy, scope, owner } = req.body;

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Jumlah uang harus lebih besar dari 0' });
  }

  try {
    let success = false;
    const newTxId = 'tx_' + Math.random().toString(36).substr(2, 9);
    const createdTx: Transaction = {
      id: newTxId,
      type,
      amount: numAmount,
      accountId,
      toAccountId,
      category: category || (type === 'transfer' ? 'Transfer' : 'Lainnya'),
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      receiptId,
      addedBy: addedBy || 'Nibras',
      createdAt: new Date().toISOString(),
      scope: scope || 'bersama',
      owner: owner || ''
    };

    if (usePostgres) {
      try {
        await db.transaction(async (tx) => {
          let fromAccObj: any = null;
          let toAccObj: any = null;

          if (accountId) {
            const fromAccs = await tx.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
            if (fromAccs.length === 0) throw new Error('Akun sumber tidak ditemukan');
            fromAccObj = fromAccs[0];
          }

          if (toAccountId) {
            const toAccs = await tx.select().from(accounts).where(eq(accounts.id, toAccountId)).limit(1);
            if (toAccs.length === 0) throw new Error('Akun tujuan tidak ditemukan');
            toAccObj = toAccs[0];
          }

          if (type === 'income') {
            if (!fromAccObj) throw new Error('Akun penerima tidak ditemukan');
            await tx.update(accounts).set({ balance: fromAccObj.balance + numAmount }).where(eq(accounts.id, accountId));
          } else if (type === 'expense') {
            if (!fromAccObj) throw new Error('Akun pengirim tidak ditemukan');
            await tx.update(accounts).set({ balance: fromAccObj.balance - numAmount }).where(eq(accounts.id, accountId));
          } else if (type === 'transfer') {
            if (!fromAccObj || !toAccObj) throw new Error('Akun sumber atau tujuan tidak ditemukan');
            await tx.update(accounts).set({ balance: fromAccObj.balance - numAmount }).where(eq(accounts.id, accountId));
            await tx.update(accounts).set({ balance: toAccObj.balance + numAmount }).where(eq(accounts.id, toAccountId));
          } else {
            throw new Error('Tipe transaksi tidak valid');
          }

          await tx.insert(transactions).values({
            id: newTxId,
            type,
            amount: numAmount,
            accountId,
            toAccountId,
            category: createdTx.category,
            date: createdTx.date,
            notes: createdTx.notes,
            receiptId,
            addedBy: createdTx.addedBy,
            createdAt: createdTx.createdAt,
            scope: createdTx.scope,
            owner: createdTx.owner || null,
          });

          if (receiptId) {
            await tx.update(receipts).set({ status: 'saved' }).where(eq(receipts.id, receiptId));
          }
        });
        success = true;
      } catch (err) {
        console.error('PostgreSQL transaction save failed, falling back:', err);
      }
    }



    // Always mirror to / update local file DB
    const localData = readLocalFileDB();
    if (type === 'income') {
      localData.accounts = localData.accounts.map(acc => {
        if (acc.id === accountId) return { ...acc, balance: acc.balance + numAmount };
        return acc;
      });
    } else if (type === 'expense') {
      localData.accounts = localData.accounts.map(acc => {
        if (acc.id === accountId) return { ...acc, balance: acc.balance - numAmount };
        return acc;
      });
    } else if (type === 'transfer') {
      localData.accounts = localData.accounts.map(acc => {
        if (acc.id === accountId) return { ...acc, balance: acc.balance - numAmount };
        if (acc.id === toAccountId) return { ...acc, balance: acc.balance + numAmount };
        return acc;
      });
    }
    
    // Add transaction
    localData.transactions.push(createdTx);
    
    // Update receipt status if needed
    if (receiptId) {
      localData.receipts = localData.receipts.map(rc => {
        if (rc.id === receiptId) return { ...rc, status: 'saved' };
        return rc;
      });
    }
    
    writeLocalFileDB(localData);

    const dbData = await readDB();
    res.json({ status: 'ok', transaction: createdTx, accounts: dbData.accounts });
  } catch (err: any) {
    console.error('Failed to save transaction:', err);
    res.status(400).json({ error: err.message || 'Gagal menyimpan transaksi' });
  }
});

// Delete a transaction (reverts account balance adjustment!)
app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let success = false;

    if (usePostgres) {
      try {
        await db.transaction(async (tx) => {
          const txs = await tx.select().from(transactions).where(eq(transactions.id, id)).limit(1);
          if (txs.length === 0) throw new Error('Transaksi tidak ditemukan');
          const t = txs[0];

          // Revert balances
          if (t.type === 'income') {
            if (t.accountId) {
              const accs = await tx.select().from(accounts).where(eq(accounts.id, t.accountId)).limit(1);
              if (accs.length > 0) {
                await tx.update(accounts).set({ balance: accs[0].balance - t.amount }).where(eq(accounts.id, t.accountId));
              }
            }
          } else if (t.type === 'expense') {
            if (t.accountId) {
              const accs = await tx.select().from(accounts).where(eq(accounts.id, t.accountId)).limit(1);
              if (accs.length > 0) {
                await tx.update(accounts).set({ balance: accs[0].balance + t.amount }).where(eq(accounts.id, t.accountId));
              }
            }
          } else if (t.type === 'transfer') {
            if (t.accountId) {
              const fromAccs = await tx.select().from(accounts).where(eq(accounts.id, t.accountId)).limit(1);
              if (fromAccs.length > 0) {
                await tx.update(accounts).set({ balance: fromAccs[0].balance + t.amount }).where(eq(accounts.id, t.accountId));
              }
            }
            if (t.toAccountId) {
              const toAccs = await tx.select().from(accounts).where(eq(accounts.id, t.toAccountId)).limit(1);
              if (toAccs.length > 0) {
                await tx.update(accounts).set({ balance: toAccs[0].balance - t.amount }).where(eq(accounts.id, t.toAccountId));
              }
            }
          }

          // If receipt ref exists, reset status
          if (t.receiptId) {
            await tx.update(receipts).set({ status: 'scanned' }).where(eq(receipts.id, t.receiptId));
          }

          await tx.delete(transactions).where(eq(transactions.id, id));
        });
        success = true;
      } catch (err) {
        console.error('PostgreSQL transaction delete failed, falling back:', err);
      }
    }



    // Always mirror to / delete from local file DB
    const localData = readLocalFileDB();
    const t = localData.transactions.find(tx => tx.id === id);
    if (t) {
      if (t.type === 'income') {
        localData.accounts = localData.accounts.map(acc => {
          if (acc.id === t.accountId) return { ...acc, balance: acc.balance - t.amount };
          return acc;
        });
      } else if (t.type === 'expense') {
        localData.accounts = localData.accounts.map(acc => {
          if (acc.id === t.accountId) return { ...acc, balance: acc.balance + t.amount };
          return acc;
        });
      } else if (t.type === 'transfer') {
        localData.accounts = localData.accounts.map(acc => {
          if (acc.id === t.accountId) return { ...acc, balance: acc.balance + t.amount };
          if (acc.id === t.toAccountId) return { ...acc, balance: acc.balance - t.amount };
          return acc;
        });
      }

      // If receipt ref exists, reset status
      if (t.receiptId) {
        localData.receipts = localData.receipts.map(rc => {
          if (rc.id === t.receiptId) return { ...rc, status: 'scanned' };
          return rc;
        });
      }

      localData.transactions = localData.transactions.filter(tx => tx.id !== id);
      writeLocalFileDB(localData);
    }

    const dbData = await readDB();
    res.json({ status: 'ok', accounts: dbData.accounts, transactions: dbData.transactions });
  } catch (err: any) {
    console.error('Failed to delete transaction:', err);
    res.status(400).json({ error: err.message || 'Gagal menghapus transaksi' });
  }
});

// 6. Gemini-powered receipt photo scanning API
app.post('/api/scan-receipt', async (req, res) => {
  const { imageBase64, addedBy } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Data foto nota (base64) tidak boleh kosong' });
  }

  let creator = addedBy;
  if (!creator) {
    try {
      const dbData = await readDB();
      creator = dbData.profile ? dbData.profile.user1 : 'Nibras';
    } catch (err) {
      creator = 'Nibras';
    }
  }

  // Clean raw base64 data to get content type & pure base64 payload
  let mimeType = 'image/jpeg';
  let pureBase64 = imageBase64;
  
  if (imageBase64.includes(';base64,')) {
    const parts = imageBase64.split(';base64,');
    mimeType = parts[0].replace('data:', '');
    pureBase64 = parts[1];
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // FALLBACK SIMULATION: In case API key is missing or not configured yet
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.warn('GEMINI_API_KEY not configured. Falling back to simulated smart scanning.');
    
    // Create a rich, highly authentic mock response mimicking OCR extraction
    const mockScannerResult = {
      merchantName: 'Alfamart Ampera',
      date: new Date().toISOString().split('T')[0],
      totalAmount: 76500,
      category: 'Belanja',
      items: [
        { name: 'Susu Cair Coklat 1L', price: 21500, quantity: 1 },
        { name: 'Cemilan Keripik Kentang', price: 14000, quantity: 2 },
        { name: 'Roti Tawar Serba Guna', price: 17000, quantity: 1 },
        { name: 'Tisu Basah Antiseptik', price: 10000, quantity: 1 }
      ]
    };

    const newReceiptId = 'rc_' + Math.random().toString(36).substr(2, 9);
    const newReceipt: Receipt = {
      id: newReceiptId,
      imageUrl: imageBase64, // Keep base64 for display
      merchantName: mockScannerResult.merchantName,
      date: mockScannerResult.date,
      totalAmount: mockScannerResult.totalAmount,
      items: mockScannerResult.items,
      status: 'scanned',
      scannedAt: new Date().toISOString(),
      addedBy: creator
    };

    let success = false;
    if (usePostgres) {
      try {
        await db.insert(receipts).values({
          id: newReceiptId,
          imageUrl: imageBase64,
          merchantName: newReceipt.merchantName,
          date: newReceipt.date,
          totalAmount: newReceipt.totalAmount,
          items: newReceipt.items,
          status: newReceipt.status as any,
          scannedAt: newReceipt.scannedAt,
          addedBy: newReceipt.addedBy,
          category: mockScannerResult.category || null
        });
        success = true;
      } catch (err) {
        console.error('Failed to save simulated receipt to PostgreSQL, falling back:', err);
      }
    }



    // Always mirror to / update local file DB
    const localData = readLocalFileDB();
    localData.receipts.push(newReceipt);
    writeLocalFileDB(localData);

    return res.json({
      status: 'simulated',
      message: 'Nota berhasil discan secara lokal (Simulasi AI). Tambahkan API key Anda di Secrets untuk memindai aslinya!',
      receipt: newReceipt
    });
  }

  try {
    // Instantiate server-side Google GenAI client according to instructions
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: pureBase64
      }
    };

    const promptText = `Lakukan analisis lengkap dan ekstrak informasi keuangan dari gambar nota, bon, struk belanja, atau catatan keuangan ini.
Ekstrak dan kembalikan data dalam format JSON murni bahasa Indonesia dengan skema terstruktur.
Gunakam panduan berikut:
- merchantName: Nama toko/supermarket/merchant yang tertera di nota. Jika berupa bon catatan pribadi, isi dengan "Catatan Pengeluaran".
- date: Tanggal belanja dalam format YYYY-MM-DD. Jika tidak terbaca, gunakan tanggal hari ini.
- totalAmount: Total nominal uang yang dibayar (angka bulat rupiah, tanpa desimal).
- category: Pilih kategori yang paling cocok: 'Makanan', 'Belanja', 'Transportasi', 'Hiburan', 'Utilitas', 'Kesehatan', 'Lainnya'.
- items: Daftar rincian barang yang dibeli (nama barang, harga satuan rupiah, jumlah kuantitas). Jika tidak ada rincian barang, buat 1 item dengan nama nota tersebut.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        imagePart,
        { text: promptText }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchantName: { type: Type.STRING, description: 'Nama toko atau merchant' },
            date: { type: Type.STRING, description: 'Tanggal transaksi dengan format YYYY-MM-DD' },
            totalAmount: { type: Type.INTEGER, description: 'Total seluruh pengeluaran/belanja dalam Rupiah' },
            category: { type: Type.STRING, description: 'Kategori pengeluaran: Makanan, Belanja, Transportasi, Hiburan, Utilitas, Kesehatan, Lainnya' },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Nama barang yang dibeli' },
                  price: { type: Type.INTEGER, description: 'Harga per satuan barang' },
                  quantity: { type: Type.INTEGER, description: 'Jumlah barang yang dibeli' }
                },
                required: ['name', 'price', 'quantity']
              }
            }
          },
          required: ['merchantName', 'date', 'totalAmount', 'category', 'items']
        }
      }
    });

    const textOutput = response.text || '{}';
    const parsedResult = JSON.parse(textOutput);

    const newReceiptId = 'rc_' + Math.random().toString(36).substr(2, 9);
    const newReceipt: Receipt = {
      id: newReceiptId,
      imageUrl: imageBase64,
      merchantName: parsedResult.merchantName || 'Struk Belanja',
      date: parsedResult.date || new Date().toISOString().split('T')[0],
      totalAmount: Number(parsedResult.totalAmount) || 0,
      items: parsedResult.items || [],
      status: 'scanned',
      scannedAt: new Date().toISOString(),
      addedBy: creator
    };

    let success = false;
    if (usePostgres) {
      try {
        await db.insert(receipts).values({
          id: newReceiptId,
          imageUrl: imageBase64,
          merchantName: newReceipt.merchantName,
          date: newReceipt.date,
          totalAmount: newReceipt.totalAmount,
          items: newReceipt.items,
          status: newReceipt.status as any,
          scannedAt: newReceipt.scannedAt,
          addedBy: newReceipt.addedBy,
          category: parsedResult.category || null
        });
        success = true;
      } catch (err) {
        console.error('Failed to save scanned receipt to PostgreSQL, falling back:', err);
      }
    }



    // Always mirror to / update local file DB
    const localData = readLocalFileDB();
    localData.receipts.push(newReceipt);
    writeLocalFileDB(localData);

    res.json({
      status: 'ok',
      message: 'Nota berhasil dipindai otomatis oleh Gemini AI!',
      receipt: newReceipt
    });

  } catch (error) {
    console.error('Gemini Scanning Error:', error);
    res.status(500).json({ 
      error: 'Gagal memindai nota menggunakan Gemini AI. Pastikan format gambar terbaca dengan jelas.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Delete a receipt log
app.delete('/api/receipts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let success = false;
    if (usePostgres) {
      try {
        await db.delete(receipts).where(eq(receipts.id, id));
        success = true;
      } catch (err) {
        console.error('PostgreSQL receipt delete failed, falling back:', err);
      }
    }



    // Always mirror to / delete from local file DB
    const localData = readLocalFileDB();
    localData.receipts = localData.receipts.filter(rc => rc.id !== id);
    writeLocalFileDB(localData);

    const dbData = await readDB();
    res.json({ status: 'ok', receipts: dbData.receipts });
  } catch (err) {
    console.error('Failed to delete receipt:', err);
    res.status(500).json({ error: 'Gagal menghapus nota' });
  }
});

// 7. Photos API Endpoints
app.post('/api/photos', async (req, res) => {
  const { imageUrl, caption, date, addedBy } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Foto tidak boleh kosong!' });
  }

  try {
    let creator = addedBy;
    if (!creator) {
      try {
        const dbData = await readDB();
        creator = dbData.profile ? dbData.profile.user1 : 'Nibras';
      } catch (err) {
        creator = 'Nibras';
      }
    }

    const photoId = 'ph_' + Math.random().toString(36).substr(2, 9);
    const newPhoto = {
      id: photoId,
      imageUrl,
      caption: caption || '',
      date: date || new Date().toISOString().split('T')[0],
      addedBy: creator,
      createdAt: new Date().toISOString()
    };

    let success = false;
    if (usePostgres) {
      try {
        await db.insert(photos).values(newPhoto);
        success = true;
      } catch (err) {
        console.error('PostgreSQL photo save failed, falling back:', err);
      }
    }



    // Always mirror to / update local file DB
    const localData = readLocalFileDB();
    localData.photos.push(newPhoto);
    writeLocalFileDB(localData);

    const dbData = await readDB();
    res.json({ status: 'ok', photo: newPhoto, photos: dbData.photos });
  } catch (err) {
    console.error('Failed to add photo:', err);
    res.status(500).json({ error: 'Gagal menyimpan foto' });
  }
});

app.delete('/api/photos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let success = false;
    if (usePostgres) {
      try {
        await db.delete(photos).where(eq(photos.id, id));
        success = true;
      } catch (err) {
        console.error('PostgreSQL photo delete failed, falling back:', err);
      }
    }



    // Always mirror to / delete from local file DB
    const localData = readLocalFileDB();
    localData.photos = localData.photos.filter(p => p.id !== id);
    writeLocalFileDB(localData);

    const dbData = await readDB();
    res.json({ status: 'ok', photos: dbData.photos });
  } catch (err) {
    console.error('Failed to delete photo:', err);
    res.status(500).json({ error: 'Gagal menghapus foto' });
  }
});

// Serve static assets and bundle SPA
async function startServer() {
  // Ensure seed is checked and run at startup
  await checkAndSeedDatabase();

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen to port if not running in Vercel serverless environment
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`KitaPunya server running online at http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;

