/**
 * Complete, idempotent SQL migration script for MaxPetZ Smart Management Portal
 * Includes 13 tables: profiles, clinics, staff, import_batches, invoices,
 * import_errors, ngo_master, tasks, task_categories, task_subtasks,
 * daily_notes, task_history, user_preferences.
 * Ready to execute in the Supabase SQL Editor.
 */

export const SUPABASE_MIGRATION_SQL = `-- ==============================================================================
-- MAXPETZ SMART MANAGEMENT PORTAL - COMPLETE DATABASE MIGRATION SCRIPT v2
-- Organization: MaxPetZ Hospitals Pvt. Ltd.
-- Safe, repeatable migration for PostgreSQL / Supabase
-- Includes: Client ID, NGO Master Management, 17-Column Billing Schema
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CREATE MASTER TABLES
-- ==============================================================================

-- Table 1: profiles (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    clinic_id UUID,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: clinics (Hospital Branches)
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    city TEXT DEFAULT 'Delhi NCR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 3: staff (Staff / Users associated with clinics)
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    designation TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 4: import_batches (Audit log for uploaded Excel/CSV files)
CREATE TABLE IF NOT EXISTS public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    total_rows INT NOT NULL DEFAULT 0,
    imported_rows INT NOT NULL DEFAULT 0,
    skipped_rows INT NOT NULL DEFAULT 0,
    updated_rows INT NOT NULL DEFAULT 0,
    ngo_count INT NOT NULL DEFAULT 0,
    non_ngo_count INT NOT NULL DEFAULT 0,
    unclassified_count INT NOT NULL DEFAULT 0,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    storage_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 5: ngo_master (Registered NGO Partner Clients)
CREATE TABLE IF NOT EXISTS public.ngo_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL UNIQUE, -- Preserves leading zeroes as TEXT
    ngo_name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 6: invoices (Financial dues records with 17-column support)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    invoice_no TEXT NOT NULL,
    client_id TEXT, -- Stored as TEXT
    client_name TEXT NOT NULL DEFAULT 'Unknown Client',
    client_type TEXT NOT NULL DEFAULT 'UNCLASSIFIED' CHECK (client_type IN ('NGO', 'NON_NGO', 'UNCLASSIFIED')),
    ngo_name TEXT,
    invoice_type TEXT NOT NULL DEFAULT 'Standard',
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    return_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sold_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Unpaid',
    mode_of_payment TEXT DEFAULT 'Pending',
    user_name TEXT NOT NULL DEFAULT 'Unassigned',
    clinic_name TEXT NOT NULL,
    inv_year INT,
    inv_month TEXT,
    email TEXT,
    mobile TEXT,
    home TEXT,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_invoice_clinic UNIQUE (invoice_no, clinic_name)
);

-- Safe migrations in case invoices already existed:
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'UNCLASSIFIED';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS ngo_name TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS return_amount NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS sold_amount NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS inv_year INT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS inv_month TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS home TEXT;

-- Table 7: import_errors (Invalid row audit logs)
CREATE TABLE IF NOT EXISTS public.import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.import_batches(id) ON DELETE CASCADE,
    row_index INT NOT NULL,
    invoice_no TEXT,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 8: task_categories (Configurable categories for tasks)
CREATE TABLE IF NOT EXISTS public.task_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'CheckSquare',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 9: tasks (Personal daily office task management)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_time TIME,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    category TEXT NOT NULL DEFAULT 'Daily Reporting',
    category_id UUID REFERENCES public.task_categories(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    has_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 10: task_subtasks (Actionable checklist items inside a task)
CREATE TABLE IF NOT EXISTS public.task_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 11: daily_notes (Personal daily scratchpad and operational notes)
CREATE TABLE IF NOT EXISTS public.daily_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_daily_note UNIQUE (user_id, note_date)
);

-- Table 12: task_history (Audit log of task status transitions)
CREATE TABLE IF NOT EXISTS public.task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'completed', 'reopened', 'updated', 'carried_forward')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 13: user_preferences (Theme, layout, and defaults)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
    default_dashboard TEXT NOT NULL DEFAULT 'dues' CHECK (default_dashboard IN ('dues', 'tasks')),
    currency TEXT NOT NULL DEFAULT 'INR',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. INDEXES FOR HIGH-PERFORMANCE ANALYTICS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_name ON public.invoices(clinic_name);
CREATE INDEX IF NOT EXISTS idx_invoices_user_name ON public.invoices(user_name);
CREATE INDEX IF NOT EXISTS idx_invoices_balance ON public.invoices(balance);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_no ON public.invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_type ON public.invoices(client_type);
CREATE INDEX IF NOT EXISTS idx_ngo_master_client_id ON public.ngo_master(client_id);
CREATE INDEX IF NOT EXISTS idx_ngo_master_status ON public.ngo_master(status);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON public.tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON public.task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.task_subtasks(task_id);

-- ==============================================================================
-- 4. AUTOMATIC updated_at TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_updated_at') THEN
        CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_invoices_updated_at') THEN
        CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ngo_master_updated_at') THEN
        CREATE TRIGGER trg_ngo_master_updated_at BEFORE UPDATE ON public.ngo_master FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tasks_updated_at') THEN
        CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_daily_notes_updated_at') THEN
        CREATE TRIGGER trg_daily_notes_updated_at BEFORE UPDATE ON public.daily_notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Automatic profile creation on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'staff'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles, but edit only their own
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Clinics & Staff: Readable and insertable by authenticated
DROP POLICY IF EXISTS "Clinics readable by authenticated" ON public.clinics;
CREATE POLICY "Clinics readable by authenticated" ON public.clinics FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Clinics insertable by authenticated" ON public.clinics;
CREATE POLICY "Clinics insertable by authenticated" ON public.clinics FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Staff readable by authenticated" ON public.staff;
CREATE POLICY "Staff readable by authenticated" ON public.staff FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff insertable by authenticated" ON public.staff;
CREATE POLICY "Staff insertable by authenticated" ON public.staff FOR INSERT TO authenticated WITH CHECK (true);

-- NGO Master: Accessible to all authenticated hospital staff
DROP POLICY IF EXISTS "NGO Master manageable by authenticated" ON public.ngo_master;
CREATE POLICY "NGO Master manageable by authenticated" ON public.ngo_master FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Invoices: All authenticated users can view; import/updates allowed
DROP POLICY IF EXISTS "Invoices manageable by authenticated" ON public.invoices;
CREATE POLICY "Invoices manageable by authenticated" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Import batches and errors:
DROP POLICY IF EXISTS "Batches readable by authenticated" ON public.import_batches;
CREATE POLICY "Batches readable by authenticated" ON public.import_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Import errors manageable" ON public.import_errors;
CREATE POLICY "Import errors manageable" ON public.import_errors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks: Strict user isolation! Users only access their own tasks
DROP POLICY IF EXISTS "Users own their tasks" ON public.tasks;
CREATE POLICY "Users own their tasks" ON public.tasks FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Task Subtasks: Cascades through task ownership
DROP POLICY IF EXISTS "Users own task subtasks" ON public.task_subtasks;
CREATE POLICY "Users own task subtasks" ON public.task_subtasks FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_subtasks.task_id AND t.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_subtasks.task_id AND t.user_id = auth.uid()));

-- Task Categories: Users own their custom categories or read global default ones
DROP POLICY IF EXISTS "Users view categories" ON public.task_categories;
CREATE POLICY "Users view categories" ON public.task_categories FOR SELECT TO authenticated
USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own categories" ON public.task_categories;
CREATE POLICY "Users manage own categories" ON public.task_categories FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Daily Notes: Strict user isolation!
DROP POLICY IF EXISTS "Users own daily notes" ON public.daily_notes;
CREATE POLICY "Users own daily notes" ON public.daily_notes FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Task History: Strict user isolation
DROP POLICY IF EXISTS "Users own task history" ON public.task_history;
CREATE POLICY "Users own task history" ON public.task_history FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User Preferences: Strict user isolation
DROP POLICY IF EXISTS "Users own preferences" ON public.user_preferences;
CREATE POLICY "Users own preferences" ON public.user_preferences FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 7. CART DUE DASHBOARD TABLES (COMPLETELY ISOLATED REVENUE & COLLECTIONS)
-- ==============================================================================

-- Table 14: cart_due_import_batches
CREATE TABLE IF NOT EXISTS public.cart_due_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    total_rows INT NOT NULL DEFAULT 0,
    imported_rows INT NOT NULL DEFAULT 0,
    skipped_rows INT NOT NULL DEFAULT 0,
    updated_rows INT NOT NULL DEFAULT 0,
    total_outstanding_imported NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 15: cart_due_records (Data source: cart due auto format.xlsx)
CREATE TABLE IF NOT EXISTS public.cart_due_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sr_no TEXT,
    client_id TEXT NOT NULL, -- Client ID stored strictly as TEXT preserving leading zeroes
    client_name TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    record_date DATE NOT NULL,
    original_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00, -- Mapped from Extension
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    remaining_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Partial', 'Paid')),
    import_batch_id UUID REFERENCES public.cart_due_import_batches(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 16: cart_due_import_errors
CREATE TABLE IF NOT EXISTS public.cart_due_import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.cart_due_import_batches(id) ON DELETE CASCADE,
    row_index INT NOT NULL,
    client_name TEXT,
    client_id TEXT,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 17: cart_due_payments (Independent Cart Payment Transactions)
CREATE TABLE IF NOT EXISTS public.cart_due_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id TEXT NOT NULL, -- references cart_due_records or 'advance-credit'
    client_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    reference_no TEXT,
    notes TEXT,
    is_advance_excess BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 18: cart_due_advance_credits (Available advance credit balances per client)
CREATE TABLE IF NOT EXISTS public.cart_due_advance_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    total_credit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    used_credit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    available_credit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 19: cart_due_advance_allocations (Audit trail of applied credits)
CREATE TABLE IF NOT EXISTS public.cart_due_advance_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advance_credit_id UUID REFERENCES public.cart_due_advance_credits(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    record_id UUID REFERENCES public.cart_due_records(id) ON DELETE CASCADE,
    allocated_amount NUMERIC(14, 2) NOT NULL,
    allocated_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 20: cart_due_followups (Call Due Follow-up CRM)
CREATE TABLE IF NOT EXISTS public.cart_due_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES public.cart_due_records(id) ON DELETE SET NULL,
    client_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    provider_name TEXT,
    contact_person TEXT,
    phone TEXT,
    contact_method TEXT NOT NULL DEFAULT 'Phone Call',
    contact_result TEXT NOT NULL DEFAULT 'Promise to Pay',
    notes TEXT NOT NULL,
    followup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_followup_date DATE,
    has_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Overdue')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 21: cart_due_followup_notes
CREATE TABLE IF NOT EXISTS public.cart_due_followup_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    followup_id UUID NOT NULL REFERENCES public.cart_due_followups(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 22: cart_due_reminders
CREATE TABLE IF NOT EXISTS public.cart_due_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    followup_id UUID NOT NULL REFERENCES public.cart_due_followups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_time TIMESTAMPTZ NOT NULL,
    is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 23: cart_due_ngo_master (Dedicated Cart Due NGO Master)
CREATE TABLE IF NOT EXISTS public.cart_due_ngo_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL UNIQUE, -- Client ID stored strictly as TEXT preserving leading zeroes
    ngo_name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe migrations in case cart_due_records already existed:
ALTER TABLE public.cart_due_records ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'NORMAL';
ALTER TABLE public.cart_due_records ADD COLUMN IF NOT EXISTS ngo_name TEXT;

-- Cart Due Indexes
CREATE INDEX IF NOT EXISTS idx_cart_due_records_client_id ON public.cart_due_records(client_id);
CREATE INDEX IF NOT EXISTS idx_cart_due_records_client_type ON public.cart_due_records(client_type);
CREATE INDEX IF NOT EXISTS idx_cart_due_records_provider ON public.cart_due_records(provider_name);
CREATE INDEX IF NOT EXISTS idx_cart_due_records_date ON public.cart_due_records(record_date);
CREATE INDEX IF NOT EXISTS idx_cart_due_records_status ON public.cart_due_records(status);
CREATE INDEX IF NOT EXISTS idx_cart_due_records_remaining ON public.cart_due_records(remaining_amount);
CREATE INDEX IF NOT EXISTS idx_cart_due_payments_client ON public.cart_due_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_cart_due_advances_client ON public.cart_due_advance_credits(client_id);
CREATE INDEX IF NOT EXISTS idx_cart_due_followups_client ON public.cart_due_followups(client_id);
CREATE INDEX IF NOT EXISTS idx_cart_due_followups_next_date ON public.cart_due_followups(next_followup_date);
CREATE INDEX IF NOT EXISTS idx_cart_due_ngo_client_id ON public.cart_due_ngo_master(client_id);
CREATE INDEX IF NOT EXISTS idx_cart_due_ngo_status ON public.cart_due_ngo_master(status);

-- Cart Due Triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cart_due_records_updated_at') THEN
        CREATE TRIGGER trg_cart_due_records_updated_at BEFORE UPDATE ON public.cart_due_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cart_due_advances_updated_at') THEN
        CREATE TRIGGER trg_cart_due_advances_updated_at BEFORE UPDATE ON public.cart_due_advance_credits FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cart_due_followups_updated_at') THEN
        CREATE TRIGGER trg_cart_due_followups_updated_at BEFORE UPDATE ON public.cart_due_followups FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cart_due_ngo_master_updated_at') THEN
        CREATE TRIGGER trg_cart_due_ngo_master_updated_at BEFORE UPDATE ON public.cart_due_ngo_master FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Cart Due RLS
ALTER TABLE public.cart_due_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_due_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_due_import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_due_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_due_advance_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_due_advance_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_due_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_due_followup_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_due_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_due_ngo_master ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cart Due batches manageable" ON public.cart_due_import_batches;
CREATE POLICY "Cart Due batches manageable" ON public.cart_due_import_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cart Due records manageable" ON public.cart_due_records;
CREATE POLICY "Cart Due records manageable" ON public.cart_due_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cart Due errors manageable" ON public.cart_due_import_errors;
CREATE POLICY "Cart Due errors manageable" ON public.cart_due_import_errors FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cart Due payments manageable" ON public.cart_due_payments;
CREATE POLICY "Cart Due payments manageable" ON public.cart_due_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cart Due advances manageable" ON public.cart_due_advance_credits;
CREATE POLICY "Cart Due advances manageable" ON public.cart_due_advance_credits FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cart Due allocations manageable" ON public.cart_due_advance_allocations;
CREATE POLICY "Cart Due allocations manageable" ON public.cart_due_advance_allocations FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cart Due followups manageable" ON public.cart_due_followups;
CREATE POLICY "Cart Due followups manageable" ON public.cart_due_followups FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cart Due followup notes manageable" ON public.cart_due_followup_notes;
CREATE POLICY "Cart Due followup notes manageable" ON public.cart_due_followup_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cart Due reminders manageable" ON public.cart_due_reminders;
CREATE POLICY "Cart Due reminders manageable" ON public.cart_due_reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cart Due NGO Master manageable" ON public.cart_due_ngo_master;
CREATE POLICY "Cart Due NGO Master manageable" ON public.cart_due_ngo_master FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;

