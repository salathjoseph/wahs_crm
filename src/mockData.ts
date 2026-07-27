import {
  Company,
  Contact,
  Lead,
  Opportunity,
  Activity,
  Sale,
  Commission,
  Invoice,
  Expense,
  Purchase,
  AuditLog,
  Profile,
  AuditAction
} from './types'

const SEED_COMPANIES: Company[] = [
  { id: 'c1', name: 'Acme Corp', industry: 'SaaS Development', website: 'acme.com', is_client: true, monthly_retainer_amount: 5000, contract_start_date: '2026-01-15', contract_status: 'active', created_at: '2026-01-15T09:00:00Z' },
  { id: 'c2', name: 'Globex Inc', industry: 'Global Logistics', website: 'globex.com', is_client: true, monthly_retainer_amount: 7500, contract_start_date: '2026-03-01', contract_status: 'active', created_at: '2026-03-01T10:00:00Z' },
  { id: 'c3', name: 'Initech Systems', industry: 'Corporate Software', website: 'initech.com', is_client: false, monthly_retainer_amount: null, contract_start_date: null, contract_status: 'active', created_at: '2026-05-12T11:30:00Z' },
  { id: 'c4', name: 'Umbrella Corporation', industry: 'BioTech Engineering', website: 'umbrella.org', is_client: true, monthly_retainer_amount: 12000, contract_start_date: '2025-10-10', contract_status: 'paused', created_at: '2025-10-10T08:00:00Z' },
  { id: 'c5', name: 'Hooli Group', industry: 'Search & Cloud Services', website: 'hooli.xyz', is_client: false, monthly_retainer_amount: null, contract_start_date: null, contract_status: 'active', created_at: '2026-06-20T14:15:00Z' },
  { id: 'c6', name: 'Soylent Green Co', industry: 'Food Production', website: 'soylent.com', is_client: false, monthly_retainer_amount: null, contract_start_date: null, contract_status: 'active', created_at: '2026-07-02T16:00:00Z' }
]

const SEED_CONTACTS: Contact[] = [
  { id: 'con1', company_id: 'c1', name: 'Jane Smith', email: 'jane.smith@acme.com', phone: '+1-555-0199', designation: 'VP of Marketing', created_at: '2026-01-15T09:10:00Z' },
  { id: 'con2', company_id: 'c2', name: 'Hank Scorpio', email: 'h.scorpio@globex.com', phone: '+1-555-0188', designation: 'CEO', created_at: '2026-03-01T10:05:00Z' },
  { id: 'con3', company_id: 'c3', name: 'Peter Gibbons', email: 'peter@initech.com', phone: '+1-555-0177', designation: 'Engineering Lead', created_at: '2026-05-12T11:40:00Z' },
  { id: 'con4', company_id: 'c4', name: 'Albert Wesker', email: 'a.wesker@umbrella.org', phone: '+1-555-0166', designation: 'Head of R&D', created_at: '2025-10-10T08:15:00Z' },
  { id: 'con5', company_id: 'c5', name: 'Richard Hendricks', email: 'richard@hooli.xyz', phone: '+1-555-0155', designation: 'Tech Consultant', created_at: '2026-06-20T14:20:00Z' },
  { id: 'con6', company_id: 'c6', name: 'Robert Thorn', email: 'r.thorn@soylent.com', phone: '+1-555-0144', designation: 'Director of Ops', created_at: '2026-07-02T16:05:00Z' }
]

const SEED_LEADS: Lead[] = [
  { id: 'l1', company_id: 'c1', contact_id: 'con1', source: 'LinkedIn Outbound', status: 'handed_off', assigned_to: 'u-sales', created_at: '2026-01-10T10:00:00Z' },
  { id: 'l2', company_id: 'c2', contact_id: 'con2', source: 'Cold Email Campaign', status: 'handed_off', assigned_to: 'u-sales', created_at: '2026-02-18T14:30:00Z' },
  { id: 'l3', company_id: 'c3', contact_id: 'con3', source: 'Website Demo Request', status: 'qualified', assigned_to: 'u-acq', created_at: '2026-05-12T11:35:00Z' },
  { id: 'l4', company_id: 'c5', contact_id: 'con5', source: 'Partner Referral', status: 'new', assigned_to: 'u-acq', created_at: '2026-06-20T14:18:00Z' },
  { id: 'l5', company_id: 'c6', contact_id: 'con6', source: 'LinkedIn Outbound', status: 'disqualified', assigned_to: 'u-acq', created_at: '2026-07-02T16:02:00Z' }
]

const SEED_OPPORTUNITIES: Opportunity[] = [
  { id: 'o1', lead_id: 'l1', value: 15000, stage: 'closed_won', probability: 100, expected_close_date: '2026-02-05', created_at: '2026-01-12T11:00:00Z' },
  { id: 'o2', lead_id: 'l2', value: 35000, stage: 'proposal', probability: 70, expected_close_date: '2026-08-15', created_at: '2026-02-22T09:00:00Z' },
  { id: 'o3', lead_id: 'l3', value: 8500, stage: 'discovery', probability: 20, expected_close_date: '2026-09-01', created_at: '2026-05-15T10:00:00Z' }
]

const SEED_ACTIVITIES: Activity[] = [
  { id: 'a1', lead_id: 'l1', type: 'call', description: 'Initial qualification call. Client interested in outsourcing B2B appointment setting.', date: '2026-01-11T11:00:00Z', created_by: 'u-acq' },
  { id: 'a2', lead_id: 'l1', type: 'meeting', description: 'Sales presentation and proposal review. Retainer discussed.', date: '2026-01-20T15:00:00Z', created_by: 'u-sales' },
  { id: 'a3', lead_id: 'l2', type: 'email', description: 'Sent follow-up proposal detailing pricing and cold caller allocation.', date: '2026-03-10T09:30:00Z', created_by: 'u-sales' },
  { id: 'a4', lead_id: 'l3', type: 'note', description: 'Lead indicates budget will be approved in Q3. Re-qualify in early August.', date: '2026-05-18T16:45:00Z', created_by: 'u-acq' }
]

const SEED_SALES: Sale[] = [
  { id: 's1', opportunity_id: 'o1', amount: 15000, date: '2026-02-05', status: 'confirmed' }
]

const SEED_COMMISSIONS: Commission[] = [
  { id: 'com1', sale_id: 's1', earned_by: 'u-sales', commission_percent: 10, commission_amount: 1500, status: 'approved', paid_date: null }
]

const SEED_INVOICES: Invoice[] = [
  { id: 'i1', company_id: 'c1', amount: 5000, status: 'paid', date: '2026-02-01' },
  { id: 'i2', company_id: 'c1', amount: 5000, status: 'paid', date: '2026-03-01' },
  { id: 'i3', company_id: 'c1', amount: 5000, status: 'sent', date: '2026-07-01' },
  { id: 'i4', company_id: 'c2', amount: 7500, status: 'overdue', date: '2026-06-01' },
  { id: 'i5', company_id: 'c4', amount: 12000, status: 'draft', date: '2026-07-25' }
]

const SEED_EXPENSES: Expense[] = [
  { id: 'e1', category: 'Software Subscriptions', amount: 480, date: '2026-07-01', created_by: 'u-admin' },
  { id: 'e2', category: 'Travel & Lodging', amount: 1250, date: '2026-07-15', created_by: 'u-sales' },
  { id: 'e3', category: 'Advertising', amount: 3000, date: '2026-07-10', created_by: 'u-acq' }
]

const SEED_PURCHASES: Purchase[] = [
  { id: 'p1', vendor: 'Apple Inc', amount: 2499, date: '2026-02-10', status: 'delivered' },
  { id: 'p2', vendor: 'Amazon Web Services', amount: 350, date: '2026-07-01', status: 'paid' },
  { id: 'p3', vendor: 'IKEA Office Supplies', amount: 800, date: '2026-03-15', status: 'delivered' }
]

const SEED_AUDIT_LOGS: AuditLog[] = [
  { id: 'al1', table_name: 'leads', record_id: 'l1', action: 'insert', changed_by: 'u-acq', old_values: null, new_values: { id: 'l1', company_id: 'c1', status: 'new' }, changed_at: '2026-01-10T10:00:00Z' },
  { id: 'al2', table_name: 'leads', record_id: 'l1', action: 'update', changed_by: 'u-acq', old_values: { status: 'new' }, new_values: { status: 'qualified', assigned_to: 'u-sales' }, changed_at: '2026-01-11T12:00:00Z' },
  { id: 'al3', table_name: 'opportunities', record_id: 'o1', action: 'insert', changed_by: 'u-sales', old_values: null, new_values: { id: 'o1', value: 15000, stage: 'discovery' }, changed_at: '2026-01-12T11:00:00Z' }
]

const SEED_PROFILES: Profile[] = [
  { id: 'u-admin', name: 'Alex Thompson', email: 'admin@wahs.co', role: 'admin', company_id: null },
  { id: 'u-acq', name: 'Sarah Jenkins', email: 'acq@wahs.co', role: 'acquisition', company_id: null },
  { id: 'u-sales', name: 'Michael Scott', email: 'sales@wahs.co', role: 'sales', company_id: null },
  { id: 'u-accounting', name: 'Oscar Martinez', email: 'accounting@wahs.co', role: 'accounting', company_id: null },
  { id: 'u-client', name: 'Richard Hendricks', email: 'richard@hooli.xyz', role: 'client', company_id: 'c1' }
]

const getStorageArray = <T>(key: string, seedData: T[]): T[] => {
  const data = localStorage.getItem(key)
  if (!data) {
    localStorage.setItem(key, JSON.stringify(seedData))
    return seedData
  }
  return JSON.parse(data) as T[]
}

const saveStorageArray = <T>(key: string, arr: T[]): void => {
  localStorage.setItem(key, JSON.stringify(arr))
}

const getActiveUser = (): string => {
  const activeRole = localStorage.getItem('wahs_crm_demo_role') || 'admin'
  const user = SEED_PROFILES.find(p => p.role === activeRole)
  return user ? user.id : 'u-admin'
}

const mockTriggerAudit = (
  tableName: string,
  recordId: string,
  action: AuditAction,
  oldValues: Record<string, any> | null,
  newValues: Record<string, any> | null
): void => {
  const logs = getStorageArray<AuditLog>('wahs_audit_logs', SEED_AUDIT_LOGS)
  const newLog: AuditLog = {
    id: 'al_' + Math.random().toString(36).substr(2, 9),
    table_name: tableName,
    record_id: recordId,
    action,
    changed_by: getActiveUser(),
    old_values: oldValues,
    new_values: newValues,
    changed_at: new Date().toISOString()
  }
  logs.unshift(newLog)
  saveStorageArray('wahs_audit_logs', logs)
}

export const mockDb = {
  // --- Profiles ---
  getProfiles: (): Profile[] => getStorageArray<Profile>('wahs_profiles', SEED_PROFILES),
  saveProfile: (profile: Partial<Profile> & { id: string }): Profile => {
    const list = getStorageArray<Profile>('wahs_profiles', SEED_PROFILES)
    const idx = list.findIndex(p => p.id === profile.id)
    let finalProfile: Profile
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...profile } as Profile
      finalProfile = list[idx]
    } else {
      finalProfile = {
        id: profile.id,
        name: profile.name || 'Anonymous',
        email: profile.email || '',
        role: profile.role || 'client',
        company_id: profile.company_id || null,
        created_at: new Date().toISOString()
      }
      list.push(finalProfile)
    }
    saveStorageArray('wahs_profiles', list)
    return finalProfile
  },

  // --- Companies ---
  getCompanies: (): Company[] => getStorageArray<Company>('wahs_companies', SEED_COMPANIES),
  saveCompany: (company: Partial<Company>): Company => {
    const list = getStorageArray<Company>('wahs_companies', SEED_COMPANIES)
    let finalCompany: Company
    if (!company.id) {
      finalCompany = {
        id: 'c_' + Math.random().toString(36).substr(2, 9),
        name: company.name || 'Unnamed',
        industry: company.industry || null,
        website: company.website || null,
        is_client: company.is_client || false,
        monthly_retainer_amount: company.monthly_retainer_amount || null,
        contract_start_date: company.contract_start_date || null,
        contract_status: company.contract_status || 'active',
        created_at: new Date().toISOString()
      }
      list.push(finalCompany)
    } else {
      const idx = list.findIndex(c => c.id === company.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...company } as Company
        finalCompany = list[idx]
      } else {
        finalCompany = company as Company
      }
    }
    saveStorageArray('wahs_companies', list)
    return finalCompany
  },

  // --- Contacts ---
  getContacts: (): Contact[] => getStorageArray<Contact>('wahs_contacts', SEED_CONTACTS),
  saveContact: (contact: Partial<Contact> & { company_id: string }): Contact => {
    const list = getStorageArray<Contact>('wahs_contacts', SEED_CONTACTS)
    let finalContact: Contact
    if (!contact.id) {
      finalContact = {
        id: 'con_' + Math.random().toString(36).substr(2, 9),
        company_id: contact.company_id,
        name: contact.name || 'Unnamed',
        email: contact.email || null,
        phone: contact.phone || null,
        designation: contact.designation || null,
        created_at: new Date().toISOString()
      }
      list.push(finalContact)
    } else {
      const idx = list.findIndex(c => c.id === contact.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...contact } as Contact
        finalContact = list[idx]
      } else {
        finalContact = contact as Contact
      }
    }
    saveStorageArray('wahs_contacts', list)
    return finalContact
  },

  // --- Leads ---
  getLeads: (): Lead[] => getStorageArray<Lead>('wahs_leads', SEED_LEADS),
  saveLead: (lead: Partial<Lead> & { company_id: string }): Lead => {
    const list = getStorageArray<Lead>('wahs_leads', SEED_LEADS)
    let action: AuditAction = 'update'
    let oldVal: Record<string, any> | null = null
    let newVal: Record<string, any> = { ...lead }
    let finalLead: Lead

    if (!lead.id) {
      action = 'insert'
      finalLead = {
        id: 'l_' + Math.random().toString(36).substr(2, 9),
        company_id: lead.company_id,
        contact_id: lead.contact_id || null,
        source: lead.source || 'Direct',
        status: lead.status || 'new',
        assigned_to: lead.assigned_to || null,
        created_at: new Date().toISOString()
      }
      list.push(finalLead)
      newVal = { ...finalLead }
    } else {
      const idx = list.findIndex(l => l.id === lead.id)
      if (idx !== -1) {
        oldVal = { ...list[idx] }
        list[idx] = { ...list[idx], ...lead } as Lead
        finalLead = list[idx]
      } else {
        finalLead = lead as Lead
      }
    }
    saveStorageArray('wahs_leads', list)
    mockTriggerAudit('leads', finalLead.id, action, oldVal, newVal)
    return finalLead
  },

  // --- Opportunities ---
  getOpportunities: (): Opportunity[] => getStorageArray<Opportunity>('wahs_opportunities', SEED_OPPORTUNITIES),
  saveOpportunity: (opp: Partial<Opportunity> & { lead_id: string }): Opportunity => {
    const list = getStorageArray<Opportunity>('wahs_opportunities', SEED_OPPORTUNITIES)
    let action: AuditAction = 'update'
    let oldVal: Record<string, any> | null = null
    let newVal: Record<string, any> = { ...opp }
    let finalOpp: Opportunity

    if (!opp.id) {
      action = 'insert'
      finalOpp = {
        id: 'o_' + Math.random().toString(36).substr(2, 9),
        lead_id: opp.lead_id,
        value: opp.value || 0,
        stage: opp.stage || 'discovery',
        probability: opp.probability || 0,
        expected_close_date: opp.expected_close_date || null,
        created_at: new Date().toISOString()
      }
      list.push(finalOpp)
      newVal = { ...finalOpp }
    } else {
      const idx = list.findIndex(o => o.id === opp.id)
      if (idx !== -1) {
        oldVal = { ...list[idx] }
        list[idx] = { ...list[idx], ...opp } as Opportunity
        finalOpp = list[idx]
      } else {
        finalOpp = opp as Opportunity
      }
    }
    saveStorageArray('wahs_opportunities', list)
    mockTriggerAudit('opportunities', finalOpp.id, action, oldVal, newVal)
    return finalOpp
  },

  // --- Activities ---
  getActivities: (): Activity[] => getStorageArray<Activity>('wahs_activities', SEED_ACTIVITIES),
  saveActivity: (act: Partial<Activity> & { lead_id: string }): Activity => {
    const list = getStorageArray<Activity>('wahs_activities', SEED_ACTIVITIES)
    let finalAct: Activity
    if (!act.id) {
      finalAct = {
        id: 'a_' + Math.random().toString(36).substr(2, 9),
        lead_id: act.lead_id,
        type: act.type || 'note',
        description: act.description || '',
        date: new Date().toISOString(),
        created_by: act.created_by || getActiveUser()
      }
      list.push(finalAct)
    } else {
      const idx = list.findIndex(a => a.id === act.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...act } as Activity
        finalAct = list[idx]
      } else {
        finalAct = act as Activity
      }
    }
    saveStorageArray('wahs_activities', list)
    return finalAct
  },

  // --- Sales ---
  getSales: (): Sale[] => getStorageArray<Sale>('wahs_sales', SEED_SALES),
  saveSale: (sale: Partial<Sale> & { opportunity_id: string }): Sale => {
    const list = getStorageArray<Sale>('wahs_sales', SEED_SALES)
    let action: AuditAction = 'update'
    let oldVal: Record<string, any> | null = null
    let newVal: Record<string, any> = { ...sale }
    let finalSale: Sale

    if (!sale.id) {
      action = 'insert'
      finalSale = {
        id: 's_' + Math.random().toString(36).substr(2, 9),
        opportunity_id: sale.opportunity_id,
        amount: sale.amount || 0,
        date: sale.date || new Date().toISOString().split('T')[0],
        status: sale.status || 'pending'
      }
      list.push(finalSale)
      newVal = { ...finalSale }
    } else {
      const idx = list.findIndex(s => s.id === sale.id)
      if (idx !== -1) {
        oldVal = { ...list[idx] }
        list[idx] = { ...list[idx], ...sale } as Sale
        finalSale = list[idx]
      } else {
        finalSale = sale as Sale
      }
    }
    saveStorageArray('wahs_sales', list)
    mockTriggerAudit('sales', finalSale.id, action, oldVal, newVal)
    return finalSale
  },

  // --- Commissions ---
  getCommissions: (): Commission[] => getStorageArray<Commission>('wahs_commissions', SEED_COMMISSIONS),
  saveCommission: (comm: Partial<Commission> & { sale_id: string }): Commission => {
    const list = getStorageArray<Commission>('wahs_commissions', SEED_COMMISSIONS)
    let action: AuditAction = 'update'
    let oldVal: Record<string, any> | null = null
    let newVal: Record<string, any> = { ...comm }
    let finalComm: Commission

    if (!comm.id) {
      action = 'insert'
      finalComm = {
        id: 'com_' + Math.random().toString(36).substr(2, 9),
        sale_id: comm.sale_id,
        earned_by: comm.earned_by || null,
        commission_percent: comm.commission_percent || 0,
        commission_amount: comm.commission_amount || 0,
        status: comm.status || 'pending',
        paid_date: comm.paid_date || null
      }
      list.push(finalComm)
      newVal = { ...finalComm }
    } else {
      const idx = list.findIndex(c => c.id === comm.id)
      if (idx !== -1) {
        oldVal = { ...list[idx] }
        list[idx] = { ...list[idx], ...comm } as Commission
        finalComm = list[idx]
      } else {
        finalComm = comm as Commission
      }
    }
    saveStorageArray('wahs_commissions', list)
    mockTriggerAudit('commissions', finalComm.id, action, oldVal, newVal)
    return finalComm
  },

  // --- Invoices ---
  getInvoices: (): Invoice[] => getStorageArray<Invoice>('wahs_invoices', SEED_INVOICES),
  saveInvoice: (inv: Partial<Invoice> & { company_id: string }): Invoice => {
    const list = getStorageArray<Invoice>('wahs_invoices', SEED_INVOICES)
    let action: AuditAction = 'update'
    let oldVal: Record<string, any> | null = null
    let newVal: Record<string, any> = { ...inv }
    let finalInv: Invoice

    if (!inv.id) {
      action = 'insert'
      finalInv = {
        id: 'i_' + Math.random().toString(36).substr(2, 9),
        company_id: inv.company_id,
        amount: inv.amount || 0,
        status: inv.status || 'draft',
        date: inv.date || new Date().toISOString().split('T')[0]
      }
      list.push(finalInv)
      newVal = { ...finalInv }
    } else {
      const idx = list.findIndex(i => i.id === inv.id)
      if (idx !== -1) {
        oldVal = { ...list[idx] }
        list[idx] = { ...list[idx], ...inv } as Invoice
        finalInv = list[idx]
      } else {
        finalInv = inv as Invoice
      }
    }
    saveStorageArray('wahs_invoices', list)
    mockTriggerAudit('invoices', finalInv.id, action, oldVal, newVal)
    return finalInv
  },

  // --- Expenses ---
  getExpenses: (): Expense[] => getStorageArray<Expense>('wahs_expenses', SEED_EXPENSES),
  saveExpense: (exp: Partial<Expense>): Expense => {
    const list = getStorageArray<Expense>('wahs_expenses', SEED_EXPENSES)
    let finalExp: Expense
    if (!exp.id) {
      finalExp = {
        id: 'e_' + Math.random().toString(36).substr(2, 9),
        category: exp.category || 'Other',
        amount: exp.amount || 0,
        date: exp.date || new Date().toISOString().split('T')[0],
        created_by: exp.created_by || getActiveUser()
      }
      list.push(finalExp)
    } else {
      const idx = list.findIndex(e => e.id === exp.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...exp } as Expense
        finalExp = list[idx]
      } else {
        finalExp = exp as Expense
      }
    }
    saveStorageArray('wahs_expenses', list)
    return finalExp
  },

  // --- Purchases ---
  getPurchases: (): Purchase[] => getStorageArray<Purchase>('wahs_purchases', SEED_PURCHASES),
  savePurchase: (pur: Partial<Purchase>): Purchase => {
    const list = getStorageArray<Purchase>('wahs_purchases', SEED_PURCHASES)
    let finalPur: Purchase
    if (!pur.id) {
      finalPur = {
        id: 'p_' + Math.random().toString(36).substr(2, 9),
        vendor: pur.vendor || 'Unnamed',
        amount: pur.amount || 0,
        date: pur.date || new Date().toISOString().split('T')[0],
        status: pur.status || 'pending'
      }
      list.push(finalPur)
    } else {
      const idx = list.findIndex(p => p.id === pur.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...pur } as Purchase
        finalPur = list[idx]
      } else {
        finalPur = pur as Purchase
      }
    }
    saveStorageArray('wahs_purchases', list)
    return finalPur
  },

  // --- Audit Logs ---
  getAuditLogs: (): AuditLog[] => getStorageArray<AuditLog>('wahs_audit_logs', SEED_AUDIT_LOGS)
}
