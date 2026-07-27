// WAHS CRM Types Definitions

export type UserRole = 'admin' | 'acquisition' | 'sales' | 'accounting' | 'client';

export type ContractStatus = 'active' | 'paused' | 'ended';

export type LeadStatus = 'new' | 'qualified' | 'handed_off' | 'disqualified';

export type OpportunityStage = 'discovery' | 'demo' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export type ActivityType = 'call' | 'email' | 'meeting' | 'note';

export type SaleStatus = 'pending' | 'confirmed' | 'invoiced';

export type CommissionStatus = 'pending' | 'approved' | 'paid';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export type AuditAction = 'insert' | 'update' | 'delete';

export interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  is_client: boolean;
  monthly_retainer_amount: number | null;
  contract_start_date: string | null;
  contract_status: ContractStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string | null;
  created_at: string;
  companies?: Company | null; // Joined profile details
}

export interface Contact {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  company_id: string;
  contact_id: string | null;
  source: string;
  status: LeadStatus;
  assigned_to: string | null;
  created_at: string;
}

export interface Opportunity {
  id: string;
  lead_id: string;
  value: number;
  stage: OpportunityStage;
  probability: number;
  expected_close_date: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  type: ActivityType;
  description: string;
  date: string;
  created_by: string | null;
}

export interface Sale {
  id: string;
  opportunity_id: string;
  amount: number;
  date: string;
  status: SaleStatus;
}

export interface Commission {
  id: string;
  sale_id: string;
  earned_by: string | null;
  commission_percent: number;
  commission_amount: number;
  status: CommissionStatus;
  paid_date: string | null;
}

export interface Invoice {
  id: string;
  company_id: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  created_by: string | null;
}

export interface Purchase {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  status: string;
}

export interface Report {
  id: string;
  report_type: string;
  filters: Record<string, any>;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: AuditAction;
  changed_by: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changed_at: string;
}
