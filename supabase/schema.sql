-- WAHS CRM Database Schema
-- Run this in your Supabase SQL Editor to initialize the database tables and RLS rules.

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'acquisition', 'sales', 'accounting', 'client');
CREATE TYPE contract_status AS ENUM ('active', 'paused', 'ended');
CREATE TYPE lead_status AS ENUM ('new', 'qualified', 'handed_off', 'disqualified');
CREATE TYPE opportunity_stage AS ENUM ('discovery', 'demo', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'note');
CREATE TYPE sale_status AS ENUM ('pending', 'confirmed', 'invoiced');
CREATE TYPE commission_status AS ENUM ('pending', 'approved', 'paid');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');
CREATE TYPE audit_action AS ENUM ('insert', 'update', 'delete');

-- 2. Create Companies Table
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  website text,
  is_client boolean NOT NULL DEFAULT false,
  monthly_retainer_amount numeric(15,2),
  contract_start_date date,
  contract_status contract_status NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Profiles Table (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create Contacts Table
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  designation text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Create Leads Table
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  source text NOT NULL,
  status lead_status NOT NULL DEFAULT 'new',
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Create Opportunities Table
CREATE TABLE opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  value numeric(15,2) NOT NULL DEFAULT 0,
  stage opportunity_stage NOT NULL DEFAULT 'discovery',
  probability numeric(5,2) NOT NULL DEFAULT 0,
  expected_close_date date,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Create Activities Table
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  description text NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- 8. Create Sales Table
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT current_date,
  status sale_status NOT NULL DEFAULT 'pending'
);

-- 9. Create Commissions Table
CREATE TABLE commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  earned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  commission_percent numeric(5,2) NOT NULL DEFAULT 0,
  commission_amount numeric(15,2) NOT NULL DEFAULT 0,
  status commission_status NOT NULL DEFAULT 'pending',
  paid_date date
);

-- 10. Create Invoices Table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  date date NOT NULL DEFAULT current_date
);

-- 11. Create Expenses Table
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT current_date,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- 12. Create Purchases Table
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor text NOT NULL,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'pending'
);

-- 13. Create Reports Table
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. Create Audit Log Table
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action audit_action NOT NULL,
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  old_values jsonb,
  new_values jsonb,
  changed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. Helper Security Functions (to prevent infinite RLS recursion)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 16. Audit Log Trigger Function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id uuid;
  old_data jsonb := null;
  new_data jsonb := null;
  rec_id uuid;
BEGIN
  -- Get active user from auth.uid()
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := null;
  END;

  IF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
    rec_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    rec_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    rec_id := OLD.id;
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, changed_by, old_values, new_values)
  VALUES (TG_TABLE_NAME, rec_id, LOWER(TG_OP)::audit_action, current_user_id, old_data, new_data);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 17. Bind Audit Triggers
CREATE TRIGGER audit_leads_trigger AFTER INSERT OR UPDATE OR DELETE ON leads FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_opportunities_trigger AFTER INSERT OR UPDATE OR DELETE ON opportunities FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_sales_trigger AFTER INSERT OR UPDATE OR DELETE ON sales FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_commissions_trigger AFTER INSERT OR UPDATE OR DELETE ON commissions FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_invoices_trigger AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- 18. Sync Profiles on Auth Signup Trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, company_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'client'::user_role),
    (new.raw_user_meta_data->>'company_id')::uuid
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- 19. Configure Row Level Security (RLS) on Tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- == PROFILES RLS ==
CREATE POLICY admin_profiles ON profiles FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY read_profiles ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY update_own_profile ON profiles FOR UPDATE USING (auth.uid() = id);

-- == COMPANIES RLS ==
CREATE POLICY admin_companies ON companies FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY acq_companies ON companies FOR ALL USING (get_my_role() = 'acquisition');
CREATE POLICY acc_companies ON companies FOR ALL USING (get_my_role() = 'accounting');
CREATE POLICY sales_read_companies ON companies FOR SELECT USING (get_my_role() = 'sales');
CREATE POLICY client_read_companies ON companies FOR SELECT USING (get_my_role() = 'client' AND id = get_my_company_id());

-- == CONTACTS RLS ==
CREATE POLICY admin_contacts ON contacts FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY acq_contacts ON contacts FOR ALL USING (get_my_role() = 'acquisition');
CREATE POLICY acc_contacts ON contacts FOR ALL USING (get_my_role() = 'accounting');
CREATE POLICY sales_read_contacts ON contacts FOR SELECT USING (get_my_role() = 'sales');
CREATE POLICY client_read_contacts ON contacts FOR SELECT USING (get_my_role() = 'client' AND company_id = get_my_company_id());

-- == LEADS RLS ==
CREATE POLICY admin_leads ON leads FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY acq_leads ON leads FOR ALL USING (get_my_role() = 'acquisition');
CREATE POLICY acc_read_leads ON leads FOR SELECT USING (get_my_role() = 'accounting');
-- Sales can read leads assigned to them or unassigned (to let them pick or view assignments), and update if assigned to them
CREATE POLICY sales_all_leads ON leads FOR SELECT USING (get_my_role() = 'sales' AND (assigned_to = auth.uid() OR assigned_to IS NULL));
CREATE POLICY sales_update_leads ON leads FOR UPDATE USING (get_my_role() = 'sales' AND assigned_to = auth.uid());
-- Clients can only see their own company's leads
CREATE POLICY client_read_leads ON leads FOR SELECT USING (get_my_role() = 'client' AND company_id = get_my_company_id());

-- == OPPORTUNITIES RLS ==
CREATE POLICY admin_opportunities ON opportunities FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY acq_opportunities ON opportunities FOR ALL USING (get_my_role() = 'acquisition');
CREATE POLICY acc_read_opportunities ON opportunities FOR SELECT USING (get_my_role() = 'accounting');
-- Sales can view/update opportunities that map to their assigned leads
CREATE POLICY sales_select_opportunities ON opportunities FOR SELECT USING (
  get_my_role() = 'sales' AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = opportunities.lead_id AND l.assigned_to = auth.uid()
  )
);
CREATE POLICY sales_update_opportunities ON opportunities FOR UPDATE USING (
  get_my_role() = 'sales' AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = opportunities.lead_id AND l.assigned_to = auth.uid()
  )
);
-- Clients can read opportunities mapped to their company's leads
CREATE POLICY client_read_opportunities ON opportunities FOR SELECT USING (
  get_my_role() = 'client' AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = opportunities.lead_id AND l.company_id = get_my_company_id()
  )
);

-- == ACTIVITIES RLS ==
CREATE POLICY admin_activities ON activities FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY acq_activities ON activities FOR ALL USING (get_my_role() = 'acquisition');
CREATE POLICY acc_read_activities ON activities FOR SELECT USING (get_my_role() = 'accounting');
-- Sales can read/write activities for their assigned leads
CREATE POLICY sales_all_activities ON activities FOR ALL USING (
  get_my_role() = 'sales' AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = activities.lead_id AND l.assigned_to = auth.uid()
  )
);
-- Client can read activities mapped to their company's leads
CREATE POLICY client_read_activities ON activities FOR SELECT USING (
  get_my_role() = 'client' AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = activities.lead_id AND l.company_id = get_my_company_id()
  )
);

-- == SALES RLS ==
CREATE POLICY admin_sales ON sales FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY acc_sales ON sales FOR ALL USING (get_my_role() = 'accounting');
-- Sales reps can read sales belonging to their opportunities
CREATE POLICY sales_read_sales ON sales FOR SELECT USING (
  get_my_role() = 'sales' AND EXISTS (
    SELECT 1 FROM public.opportunities o
    JOIN public.leads l ON o.lead_id = l.id
    WHERE o.id = sales.opportunity_id AND l.assigned_to = auth.uid()
  )
);
-- Client can read sales belonging to their opportunities
CREATE POLICY client_read_sales ON sales FOR SELECT USING (
  get_my_role() = 'client' AND EXISTS (
    SELECT 1 FROM public.opportunities o
    JOIN public.leads l ON o.lead_id = l.id
    WHERE o.id = sales.opportunity_id AND l.company_id = get_my_company_id()
  )
);

-- == COMMISSIONS RLS ==
CREATE POLICY admin_commissions ON commissions FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY acc_commissions ON commissions FOR ALL USING (get_my_role() = 'accounting');
-- Sales reps can read their own commissions
CREATE POLICY sales_read_commissions ON commissions FOR SELECT USING (
  get_my_role() = 'sales' AND earned_by = auth.uid()
);
-- Clients have NO access (implicitly denied since no policy matches client role)

-- == INVOICES RLS ==
CREATE POLICY admin_invoices ON invoices FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY acc_invoices ON invoices FOR ALL USING (get_my_role() = 'accounting');
CREATE POLICY internal_read_invoices ON invoices FOR SELECT USING (
  get_my_role() IN ('acquisition', 'sales')
);
-- Client can read invoices for their company
CREATE POLICY client_read_invoices ON invoices FOR SELECT USING (
  get_my_role() = 'client' AND company_id = get_my_company_id()
);

-- == EXPENSES RLS ==
CREATE POLICY admin_expenses ON expenses FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY acc_expenses ON expenses FOR ALL USING (get_my_role() = 'accounting');
-- Internal staff can read/write their own expenses
CREATE POLICY staff_expenses ON expenses FOR ALL USING (
  get_my_role() IN ('acquisition', 'sales') AND created_by = auth.uid()
);
-- Clients have NO access

-- == PURCHASES RLS ==
CREATE POLICY admin_purchases ON purchases FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY acc_purchases ON purchases FOR ALL USING (get_my_role() = 'accounting');
-- Clients and sales/acquisition have NO access

-- == REPORTS RLS ==
CREATE POLICY admin_reports ON reports FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY acc_reports ON reports FOR ALL USING (get_my_role() = 'accounting');
-- Clients and sales/acquisition have NO access

-- == AUDIT LOG RLS ==
CREATE POLICY admin_audit_log ON audit_log FOR SELECT USING (get_my_role() = 'admin');
-- Only admin can read audit logs. No modifications allowed for anyone.
