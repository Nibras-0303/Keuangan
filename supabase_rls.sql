-- =========================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Project: KitaPunya Couple Finance App
-- Author: Lead Software Architect
-- Date: 2026-07-08
-- =========================================================================

-- This SQL script defines a comprehensive security model for the application.
-- 
-- Summary of Rules:
-- 1. Every authenticated user can only access (CRUD) their own records.
-- 2. user_id must always equal the current Supabase Auth UID (auth.uid()).
-- 3. The audit_logs table is set to READ-ONLY (SELECT only) for normal users.
-- 4. Missing user_id columns are added automatically to tables where missing.

BEGIN;

-- =========================================================================
-- SECTION 1: DATABASE SCHEMA ALIGNMENT (Missing Columns)
-- =========================================================================
-- Some tables in the schema use shared attributes (like scope/owner) but lack
-- a direct user_id column. To enforce robust user-level RLS, we ensure a 
-- user_id text column exists with a default value of the authenticated user's ID.

RAISE NOTICE 'Adding missing user_id columns...';

-- 1. accounts
ALTER TABLE public.accounts 
  ADD COLUMN IF NOT EXISTS user_id text DEFAULT auth.uid()::text;

-- 2. categories
ALTER TABLE public.categories 
  ADD COLUMN IF NOT EXISTS user_id text DEFAULT auth.uid()::text;

-- 3. transactions
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS user_id text DEFAULT auth.uid()::text;

-- 4. budgets
ALTER TABLE public.budgets 
  ADD COLUMN IF NOT EXISTS user_id text DEFAULT auth.uid()::text;

-- 5. goals
ALTER TABLE public.goals 
  ADD COLUMN IF NOT EXISTS user_id text DEFAULT auth.uid()::text;

-- 6. recurring_transactions
ALTER TABLE public.recurring_transactions 
  ADD COLUMN IF NOT EXISTS user_id text DEFAULT auth.uid()::text;

-- 7. receipts
ALTER TABLE public.receipts 
  ADD COLUMN IF NOT EXISTS user_id text DEFAULT auth.uid()::text;

-- 8. investments
ALTER TABLE public.investments 
  ADD COLUMN IF NOT EXISTS user_id text DEFAULT auth.uid()::text;

-- 9. photos
ALTER TABLE public.photos 
  ADD COLUMN IF NOT EXISTS user_id text DEFAULT auth.uid()::text;


-- =========================================================================
-- SECTION 2: ENABLING ROW LEVEL SECURITY (RLS)
-- =========================================================================
-- Explicitly enabling Row Level Security on all 12 target tables.
-- With RLS enabled, all operations will default to DENIED unless a policy permits them.

RAISE NOTICE 'Enabling Row Level Security on all tables...';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- SECTION 3: RE-CREATING POLICIES (Clean State Idempotence)
-- =========================================================================
-- Drop existing policies first to prevent duplication errors if re-run.

DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN (
            'profiles', 'accounts', 'categories', 'transactions', 'budgets', 
            'goals', 'recurring_transactions', 'notifications', 'receipts', 
            'investments', 'audit_logs', 'photos'
          )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, policy_record.tablename);
    END LOOP;
END $$;


-- =========================================================================
-- SECTION 4: SECURITY POLICIES DEFINITIONS
-- =========================================================================

-- ----------------------------------------------------
-- 1. profiles (User Profiles)
-- ----------------------------------------------------
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);


-- ----------------------------------------------------
-- 2. accounts (Financial Accounts)
-- ----------------------------------------------------
CREATE POLICY accounts_select_own ON public.accounts
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY accounts_insert_own ON public.accounts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY accounts_update_own ON public.accounts
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY accounts_delete_own ON public.accounts
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);


-- ----------------------------------------------------
-- 3. categories (Custom/Default Categories)
-- ----------------------------------------------------
CREATE POLICY categories_select_own ON public.categories
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY categories_insert_own ON public.categories
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY categories_update_own ON public.categories
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY categories_delete_own ON public.categories
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);


-- ----------------------------------------------------
-- 4. transactions (Financial Transactions)
-- ----------------------------------------------------
CREATE POLICY transactions_select_own ON public.transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY transactions_insert_own ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY transactions_update_own ON public.transactions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY transactions_delete_own ON public.transactions
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);


-- ----------------------------------------------------
-- 5. budgets (Spending Limits)
-- ----------------------------------------------------
CREATE POLICY budgets_select_own ON public.budgets
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY budgets_insert_own ON public.budgets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY budgets_update_own ON public.budgets
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY budgets_delete_own ON public.budgets
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);


-- ----------------------------------------------------
-- 6. goals (Savings Targets)
-- ----------------------------------------------------
CREATE POLICY goals_select_own ON public.goals
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY goals_insert_own ON public.goals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY goals_update_own ON public.goals
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY goals_delete_own ON public.goals
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);


-- ----------------------------------------------------
-- 7. recurring_transactions (Regular logs)
-- ----------------------------------------------------
CREATE POLICY recurring_transactions_select_own ON public.recurring_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY recurring_transactions_insert_own ON public.recurring_transactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY recurring_transactions_update_own ON public.recurring_transactions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY recurring_transactions_delete_own ON public.recurring_transactions
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);


-- ----------------------------------------------------
-- 8. notifications (In-app Alerts)
-- ----------------------------------------------------
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);


-- ----------------------------------------------------
-- 9. receipts (Uploaded Receipts)
-- ----------------------------------------------------
CREATE POLICY receipts_select_own ON public.receipts
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY receipts_insert_own ON public.receipts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY receipts_update_own ON public.receipts
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY receipts_delete_own ON public.receipts
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);


-- ----------------------------------------------------
-- 10. investments (Investment Assets)
-- ----------------------------------------------------
CREATE POLICY investments_select_own ON public.investments
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY investments_insert_own ON public.investments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY investments_update_own ON public.investments
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY investments_delete_own ON public.investments
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);


-- ----------------------------------------------------
-- 11. audit_logs (System Administrative Activity logs)
-- ----------------------------------------------------
-- This table is set up as READ-ONLY for standard authenticated users to protect integrity.
-- Only SELECT is permitted. No client-driven INSERT, UPDATE, or DELETE is allowed.

CREATE POLICY audit_logs_select_own ON public.audit_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);


-- ----------------------------------------------------
-- 12. photos (Couple Shared Gallery)
-- ----------------------------------------------------
CREATE POLICY photos_select_own ON public.photos
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY photos_insert_own ON public.photos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY photos_update_own ON public.photos
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY photos_delete_own ON public.photos
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);

COMMIT;
