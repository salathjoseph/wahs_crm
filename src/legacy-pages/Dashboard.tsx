import React, { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { mockDb } from '../mockData'
import { Company, Lead, Opportunity, Sale, Commission, Invoice, Expense, Activity, UserRole } from '../types'
import {
  TrendingUp,
  DollarSign,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Users,
  Briefcase,
  Plus
} from 'lucide-react'

export const Dashboard = () => {
  const { profile, isDemoMode } = useAuth()
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Combined State
  const [companies, setCompanies] = useState<Company[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  // Quick form state
  const [quickExpenseCat, setQuickExpenseCat] = useState<string>('')
  const [quickExpenseAmt, setQuickExpenseAmt] = useState<string>('')
  const [quickExpenseMsg, setQuickExpenseMsg] = useState<string>('')

  const userRole: UserRole = profile?.role || 'client'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        if (isDemoMode) {
          const comps = mockDb.getCompanies()
          const lds = mockDb.getLeads()
          const opps = mockDb.getOpportunities()
          const sls = mockDb.getSales()
          const comms = mockDb.getCommissions()
          const invs = mockDb.getInvoices()
          const exps = mockDb.getExpenses()
          const acts = mockDb.getActivities()

          if (userRole === 'client') {
            const clientCompanyId = profile?.company_id
            setCompanies(comps.filter(c => c.id === clientCompanyId))
            const filteredLeads = lds.filter(l => l.company_id === clientCompanyId)
            setLeads(filteredLeads)
            const leadIds = filteredLeads.map(l => l.id)
            setOpportunities(opps.filter(o => leadIds.includes(o.lead_id)))
            setActivities(acts.filter(a => leadIds.includes(a.lead_id)))
            setInvoices(invs.filter(i => i.company_id === clientCompanyId))
          } else if (userRole === 'sales') {
            const myLeads = lds.filter(l => l.assigned_to === profile?.id)
            setLeads(myLeads)
            const myLeadIds = myLeads.map(l => l.id)
            const myOpps = opps.filter(o => myLeadIds.includes(o.lead_id))
            setOpportunities(myOpps)
            const myOppIds = myOpps.map(o => o.id)
            setSales(sls.filter(s => myOppIds.includes(s.opportunity_id)))
            setCommissions(comms.filter(c => c.earned_by === profile?.id))
            setActivities(acts.filter(a => myLeadIds.includes(a.lead_id)))
            setCompanies(comps)
            setInvoices(invs)
          } else {
            setCompanies(comps)
            setLeads(lds)
            setOpportunities(opps)
            setSales(sls)
            setCommissions(comms)
            setInvoices(invs)
            setExpenses(exps)
            setActivities(acts)
          }
        } else {
          const { data: comps, error: e1 } = await supabase.from('companies').select('*')
          const { data: lds, error: e2 } = await supabase.from('leads').select('*')
          const { data: opps, error: e3 } = await supabase.from('opportunities').select('*')
          const { data: sls, error: e4 } = await supabase.from('sales').select('*')
          const { data: comms, error: e5 } = await supabase.from('commissions').select('*')
          const { data: invs, error: e6 } = await supabase.from('invoices').select('*')
          const { data: exps, error: e7 } = await supabase.from('expenses').select('*')
          const { data: acts, error: e8 } = await supabase.from('activities').select('*')

          if (e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8) {
            throw new Error("Failed to retrieve dashboard records. Verify your RLS settings.")
          }

          setCompanies(comps || [])
          setLeads(lds || [])
          setOpportunities(opps || [])
          setSales(sls || [])
          setCommissions(comms || [])
          setInvoices(invs || [])
          setExpenses(exps || [])
          setActivities(acts || [])
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isDemoMode, userRole, profile])

  const handleAddQuickExpense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!quickExpenseCat || !quickExpenseAmt || !profile) return
    const amt = parseFloat(quickExpenseAmt)
    if (isNaN(amt)) return

    const newExp = {
      category: quickExpenseCat,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      created_by: profile.id
    }

    if (isDemoMode) {
      mockDb.saveExpense(newExp)
      setExpenses(mockDb.getExpenses())
      setQuickExpenseMsg('Expense logged locally!')
      setQuickExpenseAmt('')
      setQuickExpenseCat('')
      setTimeout(() => setQuickExpenseMsg(''), 3000)
    } else {
      const { error } = await supabase.from('expenses').insert(newExp)
      if (error) {
        setError(error.message)
      } else {
        setQuickExpenseMsg('Expense submitted!')
        setQuickExpenseAmt('')
        setQuickExpenseCat('')
        const { data } = await supabase.from('expenses').select('*')
        setExpenses(data || [])
        setTimeout(() => setQuickExpenseMsg(''), 3000)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm loading-pulse font-medium">Crunching dashboard statistics...</p>
      </div>
    )
  }

  // Calculations
  const totalMonthlyRetainer = companies
    .filter(c => c.is_client && c.contract_status === 'active')
    .reduce((sum, c) => sum + (c.monthly_retainer_amount || 0), 0)

  const activePipelineValue = opportunities
    .filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost')
    .reduce((sum, o) => sum + (o.value || 0), 0)

  const totalRevenueSales = sales
    .filter(s => s.status === 'confirmed' || s.status === 'invoiced')
    .reduce((sum, s) => sum + (s.amount || 0), 0)

  const outstandingInvoices = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  const myPendingCommissions = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + (c.commission_amount || 0), 0)

  const myPaidCommissions = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + (c.commission_amount || 0), 0)

  const newLeadsCount = leads.filter(l => l.status === 'new').length
  const qualifiedLeadsCount = leads.filter(l => l.status === 'qualified').length
  const handoffLeadsCount = leads.filter(l => l.status === 'handed_off').length

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, {profile?.name || 'User'}</h1>
          <p className="text-slate-400 text-sm mt-1">Here is the latest data for your **{userRole}** dashboard.</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-crm-900 border border-slate-800 flex items-center gap-2 text-xs font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-300">Role: <span className="text-indigo-400 capitalize">{userRole}</span></span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-2 items-center">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. ADMIN VIEW */}
      {userRole === 'admin' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card rounded-2xl p-6 glass-card-hover">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">WAHS Monthly Retainer</span>
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400"><DollarSign size={18} /></div>
              </div>
              <p className="text-2xl font-bold text-white mt-4">${totalMonthlyRetainer.toLocaleString()}/mo</p>
              <div className="text-xs text-indigo-400 flex items-center gap-1 mt-2">
                <ArrowUpRight size={14} />
                <span>From active paying clients</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 glass-card-hover">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Deals Pipeline</span>
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400"><Layers size={18} /></div>
              </div>
              <p className="text-2xl font-bold text-white mt-4">${activePipelineValue.toLocaleString()}</p>
              <div className="text-xs text-purple-400 flex items-center gap-1 mt-2">
                <TrendingUp size={14} />
                <span>{opportunities.filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost').length} open negotiations</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 glass-card-hover">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Agency Revenue (Sales)</span>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400"><TrendingUp size={18} /></div>
              </div>
              <p className="text-2xl font-bold text-white mt-4">${totalRevenueSales.toLocaleString()}</p>
              <div className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                <CheckCircle2 size={14} />
                <span>Confirmed deals executed</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 glass-card-hover">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Agency Staff</span>
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400"><Users size={18} /></div>
              </div>
              <p className="text-2xl font-bold text-white mt-4">{companies.length > 0 ? 4 : 0} Members</p>
              <div className="text-xs text-cyan-400 flex items-center gap-1 mt-2">
                <Briefcase size={14} />
                <span>Spanning 4 operations departments</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-100 mb-6 uppercase tracking-wider">Client Value Breakdown</h3>
              <div className="h-64 flex flex-col justify-between">
                <div className="flex-1 flex items-end justify-around gap-4 pb-2 border-b border-slate-800">
                  {companies.filter(c => c.is_client).map(c => {
                    const maxVal = Math.max(...companies.map(co => co.monthly_retainer_amount || 1), 12000)
                    const percent = Math.round(((c.monthly_retainer_amount || 0) / maxVal) * 100)
                    return (
                      <div key={c.id} className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
                        <span className="text-[10px] font-semibold text-indigo-400">${c.monthly_retainer_amount || 0}</span>
                        <div 
                          style={{ height: `${percent || 10}%` }}
                          className="w-full bg-gradient-indigo rounded-t-lg transition-all duration-500 hover:opacity-80"
                        ></div>
                        <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center">{c.name}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="text-[10px] text-slate-500 text-center mt-2 font-medium">Monthly Retainers per WAHS Contract Account</div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wider">Deals Status Summary</h3>
                <div className="flex flex-col gap-4 mt-6">
                  {['discovery', 'demo', 'proposal', 'negotiation', 'closed_won', 'closed_lost'].map(stage => {
                    const count = opportunities.filter(o => o.stage === stage).length
                    const percent = opportunities.length > 0 ? (count / opportunities.length) * 100 : 0
                    return (
                      <div key={stage} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="capitalize text-slate-400">{stage.replace('_', ' ')}</span>
                          <span className="text-slate-200">{count} ({Math.round(percent)}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-crm-900 rounded-full overflow-hidden">
                          <div style={{ width: `${percent}%` }} className="h-full bg-indigo-500 rounded-full"></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. ACQUISITION VIEW */}
      {userRole === 'acquisition' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-5 text-center">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">New Targets</span>
                <span className="text-3xl font-extrabold text-white mt-2 block">{newLeadsCount}</span>
              </div>
              <div className="glass-card rounded-2xl p-5 text-center border-l-4 border-l-purple-500">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Qualified</span>
                <span className="text-3xl font-extrabold text-purple-400 mt-2 block">{qualifiedLeadsCount}</span>
              </div>
              <div className="glass-card rounded-2xl p-5 text-center border-l-4 border-l-indigo-500">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Handed Over</span>
                <span className="text-3xl font-extrabold text-indigo-400 mt-2 block">{handoffLeadsCount}</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-100 mb-6 uppercase tracking-wider">My Outbound Sourcing Efficiency</h3>
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                    <span>Contact to Lead Sourcing Ratio</span>
                    <span>75% Efficiency</span>
                  </div>
                  <div className="w-full h-2.5 bg-crm-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-indigo rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                    <span>Qualification to Handover rate</span>
                    <span>60% Handover Rate</span>
                  </div>
                  <div className="w-full h-2.5 bg-crm-900 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wider">Lead Ingestion Channel</h3>
              <div className="flex flex-col gap-4 mt-6">
                {[
                  { channel: 'LinkedIn Outbound', count: leads.filter(l => l.source === 'LinkedIn Outbound').length },
                  { channel: 'Cold Email Campaign', count: leads.filter(l => l.source === 'Cold Email Campaign').length },
                  { channel: 'Website Demo Request', count: leads.filter(l => l.source === 'Website Demo Request').length },
                  { channel: 'Partner Referral', count: leads.filter(l => l.source === 'Partner Referral').length }
                ].map(item => {
                  const percent = leads.length > 0 ? (item.count / leads.length) * 100 : 0
                  return (
                    <div key={item.channel} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400">{item.channel}</span>
                        <span className="text-slate-200">{item.count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-crm-900 rounded-full overflow-hidden">
                        <div style={{ width: `${percent}%` }} className="h-full bg-purple-500 rounded-full"></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SALES VIEW */}
      {userRole === 'sales' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Pending Commission</span>
              <span className="text-3xl font-extrabold text-slate-200 mt-2 block">${myPendingCommissions.toLocaleString()}</span>
              <span className="text-xs text-amber-400 font-semibold uppercase mt-2 inline-flex items-center gap-1">
                <Clock size={12} /> Pending Approval
              </span>
            </div>
            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-emerald-500">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Commission Paid</span>
              <span className="text-3xl font-extrabold text-emerald-400 mt-2 block">${myPaidCommissions.toLocaleString()}</span>
              <span className="text-xs text-emerald-400 font-semibold uppercase mt-2 inline-flex items-center gap-1">
                <CheckCircle2 size={12} /> Deposited
              </span>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">My Assigned Pipelines</span>
              <span className="text-3xl font-extrabold text-white mt-2 block">{opportunities.length} Deals</span>
              <span className="text-xs text-indigo-400 font-semibold mt-2 block">Value: ${activePipelineValue.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wider">My Active Opportunities</h3>
              <div className="flex flex-col gap-3 mt-4">
                {opportunities.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No active opportunities assigned to you.</p>
                ) : (
                  opportunities.map(o => {
                    const lead = leads.find(l => l.id === o.lead_id)
                    const comp = companies.find(c => c.id === lead?.company_id)
                    return (
                      <div key={o.id} className="p-3.5 bg-crm-900/50 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-sm text-slate-200">{comp?.name || 'Unknown Company'}</span>
                          <div className="text-[10px] text-slate-500 mt-1 capitalize">Stage: {o.stage.replace('_', ' ')}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm text-indigo-400">${(o.value || 0).toLocaleString()}</span>
                          <div className="text-[10px] text-slate-400 mt-1">{o.probability}% Probability</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wider">Recent Sourced Activities</h3>
              <div className="flex flex-col gap-4 mt-4">
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No logged activity log.</p>
                ) : (
                  activities.slice(0, 3).map(a => (
                    <div key={a.id} className="flex gap-3 text-xs leading-relaxed">
                      <div className="mt-0.5 text-indigo-400"><Calendar size={14} /></div>
                      <div>
                        <span className="font-semibold text-slate-300 block">{a.type.toUpperCase()} - {new Date(a.date).toLocaleDateString()}</span>
                        <p className="text-slate-400 mt-0.5">{a.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 4. ACCOUNTING VIEW */}
      {userRole === 'accounting' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-rose-500">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Outstanding Invoices</span>
              <span className="text-3xl font-extrabold text-rose-400 mt-2 block">${outstandingInvoices.toLocaleString()}</span>
              <span className="text-xs text-slate-500 mt-2 block">Awaiting collections</span>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Monthly Sourced Expenses</span>
              <span className="text-3xl font-extrabold text-slate-200 mt-2 block">${totalExpenses.toLocaleString()}</span>
              <span className="text-xs text-slate-500 mt-2 block">Total overhead bills</span>
            </div>
            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-emerald-500">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Net Retainer Runway</span>
              <span className="text-3xl font-extrabold text-emerald-400 mt-2 block">${(totalMonthlyRetainer - totalExpenses).toLocaleString()}</span>
              <span className="text-xs text-slate-500 mt-2 block">Retainers minus Sourced expenses</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wider">Quick Log Expense</h3>
                {quickExpenseMsg && (
                  <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    <span>{quickExpenseMsg}</span>
                  </div>
                )}
                <form onSubmit={handleAddQuickExpense} className="flex flex-col gap-4 mt-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">Category</label>
                    <select
                      value={quickExpenseCat}
                      onChange={(e) => setQuickExpenseCat(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                    >
                      <option value="" disabled className="bg-crm-950">Select Category</option>
                      <option value="Software Subscriptions" className="bg-crm-950">Software Subscriptions</option>
                      <option value="Travel & Lodging" className="bg-crm-950">Travel & Lodging</option>
                      <option value="Advertising" className="bg-crm-950">Advertising</option>
                      <option value="Office Supplies" className="bg-crm-950">Office Supplies</option>
                      <option value="Client Dining" className="bg-crm-950">Client Dining</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">Amount ($)</label>
                    <input
                      type="number"
                      value={quickExpenseAmt}
                      onChange={(e) => setQuickExpenseAmt(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-indigo hover:opacity-90 rounded-xl text-xs font-semibold text-white mt-2 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Log Expense
                  </button>
                </form>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wider">Awaiting Invoice Payouts</h3>
              <div className="overflow-x-auto mt-4">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-xs text-slate-500 text-center py-6">No outstanding invoices.</td>
                      </tr>
                    ) : (
                      invoices.filter(i => i.status === 'sent' || i.status === 'overdue').map(i => {
                        const comp = companies.find(c => c.id === i.company_id)
                        return (
                          <tr key={i.id}>
                            <td className="font-semibold text-slate-200">{comp?.name || 'Unknown'}</td>
                            <td className="text-slate-300 font-semibold">${i.amount}</td>
                            <td>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${i.status === 'overdue' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {i.status}
                              </span>
                            </td>
                            <td>{i.date}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 5. CLIENT VIEW */}
      {userRole === 'client' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-100 mb-6 uppercase tracking-wider">Active WAHS retainer contract</h3>
              {companies[0] ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Company</span>
                    <span className="block text-sm font-semibold text-slate-200 mt-1">{companies[0].name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Industry</span>
                    <span className="block text-sm font-semibold text-slate-200 mt-1">{companies[0].industry || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Retainer Rate</span>
                    <span className="block text-sm font-semibold text-indigo-400 mt-1">${(companies[0].monthly_retainer_amount || 0).toLocaleString()}/mo</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Contract Status</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1.5 ${companies[0].contract_status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {companies[0].contract_status}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No retainer contract mapped to your profile.</p>
              )}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wider">Our Outreach Pipeline Stage</h3>
              <div className="flex flex-col gap-3 mt-4">
                {opportunities.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No active lead conversions mapped to your company.</p>
                ) : (
                  opportunities.map(o => (
                    <div key={o.id} className="p-3.5 bg-crm-900/50 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-sm text-slate-200">Opportunity Reference #{o.id.slice(2, 6)}</span>
                        <div className="text-[10px] text-slate-500 mt-1 capitalize">Current Phase: {o.stage.replace('_', ' ')}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-indigo-400">${(o.value || 0).toLocaleString()}</span>
                        <div className="text-[10px] text-slate-400 mt-1">{o.probability}% Sourced Confidence</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-100 mb-6 uppercase tracking-wider">Outreach Activity Log</h3>
            <div className="flex flex-col gap-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 pl-4">No logged activity log.</p>
              ) : (
                activities.map(a => (
                  <div key={a.id} className="flex gap-4 text-xs leading-relaxed relative z-10 pl-1">
                    <div className="w-5 h-5 rounded-full bg-crm-800 border border-slate-700 flex items-center justify-center shrink-0 text-indigo-400">
                      <Clock size={10} />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-300 block capitalize">{a.type} - {new Date(a.date).toLocaleDateString()}</span>
                      <p className="text-slate-400 mt-1">{a.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
