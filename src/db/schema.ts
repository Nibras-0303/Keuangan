import { pgTable, text, integer, boolean, real, timestamp, serial, json } from 'drizzle-orm/pg-core';

// 1. Users table (for Firebase Auth user synchronization)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Profile table (singular, retained for backward compatibility with existing features)
export const profile = pgTable('profile', {
  id: serial('id').primaryKey(),
  user1: text('user1').notNull(),
  user2: text('user2').notNull(),
  anniversaryDate: text('anniversary_date'),
  passcode: text('passcode').notNull(),
  monthlyBudget: integer('monthly_budget').notNull().default(3000000),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Profiles table (plural, newly requested)
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // Profile ID
  userId: text('user_id'), // Link to users table or Auth uid
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  currency: text('currency').notNull().default('IDR'), // IDR, USD, EUR, etc.
  theme: text('theme').notNull().default('light'), // light | dark
  monthlyBudget: integer('monthly_budget').notNull().default(0),
  passcode: text('passcode'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Accounts table (for bank, cash, savings, and investment accounts)
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'cash' | 'bank' | 'ewallet' | 'savings' | 'investment' | 'other'
  balance: integer('balance').notNull().default(0),
  color: text('color').notNull(),
  iconName: text('icon_name').notNull(),
  scope: text('scope').notNull().default('bersama'), // 'bersama' | 'pribadi'
  owner: text('owner'), // 'Nibras' | 'Zenita' | null
  isInvested: boolean('is_invested').notNull().default(false),
  investmentCategory: text('investment_category'), // 'rdpu' | 'sukuk' | 'saham' | 'emas'
  isSeaBank: boolean('is_seabank').notNull().default(false),
  seaBankInterestRate: real('seabank_interest_rate').notNull().default(3.75),
  seaBankInterestAccumulated: integer('seabank_interest_accumulated').notNull().default(0),
  currency: text('currency').notNull().default('IDR'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Categories table (for user-customized transaction categories)
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'income' | 'expense' | 'transfer'
  color: text('color').notNull().default('blue'),
  iconName: text('icon_name').notNull().default('Tag'),
  isDefault: boolean('is_default').notNull().default(false),
  scope: text('scope').notNull().default('bersama'), // 'bersama' | 'pribadi'
  owner: text('owner'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Transactions table (for tracking incomes, expenses, and transfers)
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'income' | 'expense' | 'transfer'
  amount: integer('amount').notNull(),
  accountId: text('account_id').notNull(),
  toAccountId: text('to_account_id'),
  category: text('category').notNull(), // Keep category string for backward compatibility
  categoryId: text('category_id'), // References categories table
  date: text('date').notNull(), // YYYY-MM-DD
  notes: text('notes').notNull().default(''),
  receiptId: text('receipt_id'),
  addedBy: text('added_by').notNull(),
  createdAt: text('created_at').notNull(),
  scope: text('scope').notNull().default('bersama'),
  owner: text('owner'),
  isCleared: boolean('is_cleared').notNull().default(true),
});

// 7. Budgets table (for setting spending limits on categories)
export const budgets = pgTable('budgets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  amount: integer('amount').notNull(),
  categoryId: text('category_id'), // Optional category limit link
  period: text('period').notNull().default('monthly'), // 'monthly' | 'weekly' | 'yearly'
  startDate: text('start_date').notNull(), // YYYY-MM-DD
  endDate: text('end_date').notNull(), // YYYY-MM-DD
  scope: text('scope').notNull().default('bersama'),
  owner: text('owner'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Goals table (for financial targets like buying a house, traveling, etc.)
export const goals = pgTable('goals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetAmount: integer('target_amount').notNull(),
  currentAmount: integer('current_amount').notNull().default(0),
  targetDate: text('target_date'), // YYYY-MM-DD
  color: text('color').notNull().default('green'),
  iconName: text('icon_name').notNull().default('Target'),
  status: text('status').notNull().default('active'), // 'active' | 'completed' | 'paused'
  scope: text('scope').notNull().default('bersama'),
  owner: text('owner'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Recurring Transactions table (for auto-logging regular transactions)
export const recurringTransactions = pgTable('recurring_transactions', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'income' | 'expense'
  amount: integer('amount').notNull(),
  accountId: text('account_id').notNull(),
  category: text('category').notNull(),
  categoryId: text('category_id'),
  notes: text('notes').notNull().default(''),
  frequency: text('frequency').notNull(), // 'daily' | 'weekly' | 'monthly' | 'yearly'
  nextDueDate: text('next_due_date').notNull(), // YYYY-MM-DD
  isActive: boolean('is_active').notNull().default(true),
  addedBy: text('added_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Notifications table (for user notifications regarding budget limits, goals, etc.)
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // 'budget_alert' | 'goal_reached' | 'recurring_reminder' | 'system'
  isRead: boolean('is_read').notNull().default(false),
  userId: text('user_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Receipts table (for storing parsed or uploaded receipt information)
export const receipts = pgTable('receipts', {
  id: text('id').primaryKey(),
  imageUrl: text('image_url').notNull(), // Base64 data URL
  merchantName: text('merchant_name').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  totalAmount: integer('total_amount').notNull(),
  items: json('items').notNull(), // ReceiptItem[]
  status: text('status').notNull(), // 'scanned' | 'saved'
  scannedAt: text('scanned_at').notNull(),
  addedBy: text('added_by').notNull(),
  category: text('category'),
  categoryId: text('category_id'),
});

// 12. Investments table (for tracking stocks, mutual funds, gold, etc.)
export const investments = pgTable('investments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'stock' | 'mutual_fund' | 'bond' | 'crypto' | 'gold' | 'other'
  accountId: text('account_id').notNull(),
  purchasePrice: integer('purchase_price').notNull(),
  currentPrice: integer('current_price').notNull(),
  quantity: real('quantity').notNull(),
  purchaseDate: text('purchase_date').notNull(), // YYYY-MM-DD
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. Audit Logs table (for tracking administrative actions and system actions)
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  action: text('action').notNull(), // 'CREATE_TRANSACTION' | 'UPDATE_PROFILE' | etc.
  entityType: text('entity_type').notNull(), // 'transaction' | 'account' | 'budget' | etc.
  entityId: text('entity_id'),
  details: json('details'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

// 14. Photos table (for couple shared gallery)
export const photos = pgTable('photos', {
  id: text('id').primaryKey(),
  imageUrl: text('image_url').notNull(), // Base64 data URL
  caption: text('caption').notNull().default(''),
  date: text('date').notNull(), // YYYY-MM-DD
  addedBy: text('added_by').notNull(),
  createdAt: text('created_at').notNull(),
});
