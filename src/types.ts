export type AccountType = 'cash' | 'bank' | 'ewallet' | 'savings' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string; // Tailwind color string, e.g., 'emerald', 'blue', 'pink', etc.
  iconName: string; // Lucide icon name, e.g., 'Wallet', 'CreditCard', 'Smartphone'
  scope?: 'bersama' | 'pribadi';
  owner?: string; // name of the owner, e.g., 'Nibras' or 'Zenita'
  isInvested?: boolean;
  investmentCategory?: 'rdpu' | 'sukuk' | 'saham' | 'emas';
  isSeaBank?: boolean;
  seaBankInterestRate?: number; // e.g. 5.0 for 5% p.a.
  seaBankInterestAccumulated?: number; // accrued sharia yield / interest in Rp
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string; // Source account (for income, expense, and transfer source)
  toAccountId?: string; // Target account (only for transfer type)
  category: string;
  date: string; // YYYY-MM-DD
  notes: string;
  receiptId?: string; // Optional reference to scanned receipt
  addedBy: string; // E.g., 'Nibras' or partner's name
  createdAt: string; // ISO String
  scope?: 'bersama' | 'pribadi';
  owner?: string; // name of owner
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Receipt {
  id: string;
  imageUrl: string; // Base64 data URI
  merchantName: string;
  date: string; // YYYY-MM-DD
  totalAmount: number;
  items: ReceiptItem[];
  status: 'scanned' | 'saved';
  scannedAt: string; // ISO String
  addedBy: string;
  category?: string;
}

export interface CoupleProfile {
  user1: string;
  user2: string;
  anniversaryDate: string; // YYYY-MM-DD
  passcode: string;
  monthlyBudget: number;
}

export interface Photo {
  id: string;
  imageUrl: string; // Base64 Data URI of high-quality image
  caption: string;
  date: string; // YYYY-MM-DD
  addedBy: string;
  createdAt: string; // ISO String
}

export interface DatabaseSchema {
  accounts: Account[];
  transactions: Transaction[];
  receipts: Receipt[];
  profile: CoupleProfile;
  photos: Photo[];
}
