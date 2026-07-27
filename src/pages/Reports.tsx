import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { mockDb } from '../mockData'
import { Company, Lead, Opportunity, Sale, Invoice, Expense } from '../types'
import { Download, RefreshCw, AlertCircle } from 'lucide-react'

export const Reports = () => {
  const { profile, isDemoMode } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Report filters state
  const [startDate, setStartDate] = useState<string>('2026-01-01')
  const [endDate, setEndDate] = useState<string>('2026-12-31')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all')

  const isAuthorized = profile?.role === 'admin' || profile?.role === 'accounting'

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode) {
        setCompanies(mockDb.getCompanies())
        setLeads(mockDb.getLeads())
        setOpportunities(mockDb.getOpportunities())
        setSales(mockDb.getSales())
        setInvoices(mockDb.getInvoices())
        setExpenses(mockDb.getExpenses())
      } else {
        const { data: comps } = await supabase.from('companies').select('*')
        const { data: lds } = await supabase.from('leads').select('*')
        const { data: opps } = await supabase.from('opportunities').select('*')
        const { data: sls } = await supabase.from('sales').select('*')
        const { data: invs } = await supabase.from('invoices').select('*')
        const { data: exps } = await supabase.from('expenses').select('*')

        setCompanies(comps || [])
        setLeads(lds || [])
        setOpportunities(opps || [])
        setSales(sls || [])
        setInvoices(invs || [])
        setExpenses(exps || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      loadData()
    }
  }, [isDemoMode, profile])

  if (!isAuthorized) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-3 items-center">
        <AlertCircle size={20} />
        <span>Access Denied. Reporting modules are restricted to Admin and Accounting departments only.</span>
      </div>
    )
  }

  if (loading && companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm loading-pulse font-medium">Assembling executive reports...</p>
      </div>
    )
  }

  const checkDateInRange = (dateStr: string) => {
    if (!dateStr) return false
    const d = new Date(dateStr.split('T')[0])
    const start = new Date(startDate)
    const end = new Date(endDate)
    return d >= start && d <= end
  }

  const filteredLeads = leads.filter(l => {
    const matchesComp = selectedCompanyId === 'all' || l.company_id === selectedCompanyId
    const matchesDate = checkDateInRange(l.created_at)
    return matchesComp && matchesDate
  })

  const filteredOpps = opportunities.filter(o => {
    const leadObj = leads.find(l => l.id === o.lead_id)
    const matchesComp = selectedCompanyId === 'all' || leadObj?.company_id === selectedCompanyId
    const matchesDate = checkDateInRange(o.created_at)
    return matchesComp && matchesDate
  })

  const filteredSales = sales.filter(s => {
    const oppObj = opportunities.find(o => o.id === s.opportunity_id)
    const leadObj = leads.find(l => l.id === oppObj?.lead_id)
    const matchesComp = selectedCompanyId === 'all' || leadObj?.company_id === selectedCompanyId
    const matchesDate = checkDateInRange(s.date)
    return matchesComp && matchesDate
  })

  const filteredInvoices = invoices.filter(i => {
    const matchesComp = selectedCompanyId === 'all' || i.company_id === selectedCompanyId
    const matchesDate = checkDateInRange(i.date)
    return matchesComp && matchesDate
  })

  const filteredExpenses = expenses.filter(e => {
    return checkDateInRange(e.date)
  })

  const activePipelineValue = filteredOpps
    .filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost')
    .reduce((sum, o) => sum + (o.value || 0), 0)

  const confirmedSalesAmount = filteredSales
    .filter(s => s.status === 'confirmed' || s.status === 'invoiced')
    .reduce((sum, s) => sum + (s.amount || 0), 0)

  const collectedInvoiceAmount = filteredInvoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  const outstandingInvoiceAmount = filteredInvoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  const totalOverheadBills = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  const exportToCSV = (dataType: string) => {
    let headers: string[] = []
    let rows: any[][] = []
    let filename = `wahs_report_${dataType}.csv`

    if (dataType === 'leads') {
      headers = ['Lead ID', 'Company', 'Source', 'Status', 'Date Ingested']
      rows = filteredLeads.map(l => {
        const comp = companies.find(c => c.id === l.company_id)
        return [
          l.id,
          comp?.name || 'Unknown',
          l.source,
          l.status,
          l.created_at.split('T')[0]
        ]
      })
    } else if (dataType === 'opportunities') {
      headers = ['Deal ID', 'Lead Reference', 'Value ($)', 'Stage', 'Close Probability (%)', 'Expected Close Date']
      rows = filteredOpps.map(o => [
        o.id,
        o.lead_id,
        o.value,
        o.stage,
        o.probability,
        o.expected_close_date || 'N/A'
      ])
    } else if (dataType === 'financials') {
      headers = ['Transaction Type', 'Details', 'Amount ($)', 'Status', 'Date']
      
      filteredInvoices.forEach(i => {
        const comp = companies.find(c => c.id === i.company_id)
        rows.push(['Invoice Generated', `Client: ${comp?.name || 'Unknown'}`, i.amount, i.status, i.date])
      })
      filteredExpenses.forEach(e => {
        rows.push(['Expense Logged', e.category, e.amount, 'Paid', e.date])
      })
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => {
        const strVal = String(val === null || val === undefined ? '' : val)
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`
        }
        return strVal
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Financial summaries, funnel statistics, and CSV data extraction.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-2 bg-crm-800 hover:bg-crm-700 text-slate-300 text-xs rounded-xl font-medium border border-slate-800 transition-all"
        >
          <RefreshCw size={14} /> Refresh analytics
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-crm-900/30 border border-slate-800/80 p-5 rounded-2xl">
        <div>
          <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2">Scope Client Account</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
          >
            <option value="all">All Accounts</option>
            {companies.map(c => (
              <option key={c.id} value={c.id} className="bg-crm-950">{c.name} ({c.is_client ? 'Client' : 'Target'})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
          />
        </div>

        <div>
          <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
          />
        </div>

        <div className="flex flex-col justify-end">
          <span className="text-[10px] text-slate-500 font-semibold text-center sm:text-right block pb-2.5">
            Active Filter Scope: {filteredOpps.length} Opportunities
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Sourced Pipeline</span>
          <p className="text-2xl font-bold text-white mt-4">${activePipelineValue.toLocaleString()}</p>
          <span className="text-[10px] text-indigo-400 block mt-2 font-medium">Open deal opportunities value</span>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Confirmed Sales Contracted</span>
          <p className="text-2xl font-bold text-emerald-400 mt-4">${confirmedSalesAmount.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500 block mt-2 font-medium">Completed outreach acquisitions</span>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Collected Cash (Paid Invoices)</span>
          <p className="text-2xl font-bold text-white mt-4">${collectedInvoiceAmount.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500 block mt-2 font-medium">Outstanding receivables: ${outstandingInvoiceAmount.toLocaleString()}</span>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Operating overhead Bills</span>
          <p className="text-2xl font-bold text-rose-400 mt-4">${totalOverheadBills.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500 block mt-2 font-medium">Accumulated internal expenses</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-900 shadow mt-2">
        <h3 className="text-sm font-semibold text-slate-100 mb-2 uppercase tracking-wider">Extract Business Records (CSV)</h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Export filtered datasets directly to spreadsheet formats. All date ranges and company filter values applied above will be honored.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => exportToCSV('leads')}
            className="flex items-center justify-center gap-2.5 px-4 py-3 bg-crm-900 border border-slate-800 hover:border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-300 transition-all hover:bg-crm-800/80"
          >
            Export Leads Summary ({filteredLeads.length})
          </button>
          <button
            onClick={() => exportToCSV('opportunities')}
            className="flex items-center justify-center gap-2.5 px-4 py-3 bg-crm-900 border border-slate-800 hover:border-purple-500/30 rounded-xl text-xs font-bold text-purple-300 transition-all hover:bg-crm-800/80"
          >
            Export Deals Pipeline ({filteredOpps.length})
          </button>
          <button
            onClick={() => exportToCSV('financials')}
            className="flex items-center justify-center gap-2.5 px-4 py-3 bg-crm-900 border border-slate-800 hover:border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300 transition-all hover:bg-crm-800/80"
          >
            Export Financial Ledger ({filteredInvoices.length + filteredExpenses.length})
          </button>
        </div>
      </div>
    </div>
  )
}
