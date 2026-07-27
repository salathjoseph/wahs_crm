import React, { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { mockDb } from '../mockData'
import { Invoice, Expense, Purchase, Company, Profile, UserRole, InvoiceStatus } from '../types'
import { Plus, RefreshCw, Clock, CheckCircle, AlertCircle, FileText, CreditCard } from 'lucide-react'

export const Billing = () => {
  const { profile, isDemoMode } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [salesReps, setSalesReps] = useState<Profile[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Tabs: 'invoices', 'expenses', 'purchases'
  const [activeTab, setActiveTab] = useState<string>('invoices')

  // Modal forms
  const [showAddInvoice, setShowAddInvoice] = useState<boolean>(false)
  const [showAddExpense, setShowAddExpense] = useState<boolean>(false)
  const [showAddPurchase, setShowAddPurchase] = useState<boolean>(false)

  // New Invoice State
  const [invCompany, setInvCompany] = useState<string>('')
  const [invAmount, setInvAmount] = useState<string>('')
  const [invStatus, setInvStatus] = useState<InvoiceStatus>('draft')

  // New Expense State
  const [expCategory, setExpCategory] = useState<string>('Software Subscriptions')
  const [expAmount, setExpAmount] = useState<string>('')

  // New Purchase State
  const [purVendor, setPurVendor] = useState<string>('')
  const [purAmount, setPurAmount] = useState<string>('')

  const userRole: UserRole = profile?.role || 'client'
  const isClient = userRole === 'client'
  const isAccountingOrAdmin = userRole === 'accounting' || userRole === 'admin'
  const isStaff = userRole === 'acquisition' || userRole === 'sales'

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode) {
        const invs = mockDb.getInvoices()
        const exps = mockDb.getExpenses()
        const purs = mockDb.getPurchases()
        const comps = mockDb.getCompanies()
        const reps = mockDb.getProfiles()

        setCompanies(comps)
        setSalesReps(reps)

        if (isClient) {
          setInvoices(invs.filter(i => i.company_id === profile?.company_id))
          setExpenses([])
          setPurchases([])
        } else if (isStaff) {
          setInvoices(invs)
          setExpenses(exps.filter(e => e.created_by === profile?.id))
          setPurchases([])
        } else {
          setInvoices(invs)
          setExpenses(exps)
          setPurchases(purs)
        }
      } else {
        const { data: comps } = await supabase.from('companies').select('*')
        const { data: reps } = await supabase.from('profiles').select('*')
        const { data: invs } = await supabase.from('invoices').select('*')
        const { data: exps } = await supabase.from('expenses').select('*')
        const { data: purs } = await supabase.from('purchases').select('*')

        setCompanies(comps || [])
        setSalesReps(reps || [])

        if (isClient) {
          setInvoices((invs || []).filter(i => i.company_id === profile?.company_id))
          setExpenses([])
          setPurchases([])
        } else if (isStaff) {
          setInvoices(invs || [])
          setExpenses((exps || []).filter(e => e.created_by === profile?.id))
          setPurchases([])
        } else {
          setInvoices(invs || [])
          setExpenses(exps || [])
          setPurchases(purs || [])
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [isDemoMode, userRole, profile])

  const handleAddInvoice = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!invCompany || !invAmount) return
    setLoading(true)

    try {
      const amt = parseFloat(invAmount)
      if (isNaN(amt)) throw new Error("Invalid invoice amount")

      const newInv = {
        company_id: invCompany,
        amount: amt,
        status: invStatus,
        date: new Date().toISOString().split('T')[0]
      }

      if (isDemoMode) {
        mockDb.saveInvoice(newInv)
        setShowAddInvoice(false)
        setInvAmount('')
        setInvCompany('')
        setInvStatus('draft')
        loadData()
      } else {
        const { error } = await supabase.from('invoices').insert(newInv)
        if (error) throw error
        setShowAddInvoice(false)
        setInvAmount('')
        setInvCompany('')
        setInvStatus('draft')
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleUpdateInvoiceStatus = async (invId: string, newStatus: InvoiceStatus) => {
    setLoading(true)
    try {
      const invItem = invoices.find(i => i.id === invId)
      if (!invItem) return

      const updatedInv = { ...invItem, status: newStatus }

      if (isDemoMode) {
        mockDb.saveInvoice(updatedInv)
        loadData()
      } else {
        const { error } = await supabase
          .from('invoices')
          .update({ status: newStatus })
          .eq('id', invId)

        if (error) throw error
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleAddExpense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!expAmount || !profile) return
    setLoading(true)

    try {
      const amt = parseFloat(expAmount)
      if (isNaN(amt)) throw new Error("Invalid expense amount")

      const newExp = {
        category: expCategory,
        amount: amt,
        date: new Date().toISOString().split('T')[0],
        created_by: profile.id
      }

      if (isDemoMode) {
        mockDb.saveExpense(newExp)
        setShowAddExpense(false)
        setExpAmount('')
        loadData()
      } else {
        const { error } = await supabase.from('expenses').insert(newExp)
        if (error) throw error
        setShowAddExpense(false)
        setExpAmount('')
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleAddPurchase = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!purVendor || !purAmount) return
    setLoading(true)

    try {
      const amt = parseFloat(purAmount)
      if (isNaN(amt)) throw new Error("Invalid purchase amount")

      const newPur = {
        vendor: purVendor,
        amount: amt,
        date: new Date().toISOString().split('T')[0],
        status: 'pending'
      }

      if (isDemoMode) {
        mockDb.savePurchase(newPur)
        setShowAddPurchase(false)
        setPurAmount('')
        setPurVendor('')
        loadData()
      } else {
        const { error } = await supabase.from('purchases').insert(newPur)
        if (error) throw error
        setShowAddPurchase(false)
        setPurAmount('')
        setPurVendor('')
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleUpdatePurchaseStatus = async (purId: string, newStatus: string) => {
    setLoading(true)
    try {
      const purItem = purchases.find(p => p.id === purId)
      if (!purItem) return

      const updatedPur = { ...purItem, status: newStatus }

      if (isDemoMode) {
        mockDb.savePurchase(updatedPur)
        loadData()
      } else {
        const { error } = await supabase
          .from('purchases')
          .update({ status: newStatus })
          .eq('id', purId)

        if (error) throw error
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading && invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm loading-pulse font-medium">Crunching ledger operations...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing & Ledger</h1>
          <p className="text-slate-400 text-sm mt-1">Manage client retainers, staff expense sheets, and corporate purchases.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-2 bg-crm-800 hover:bg-crm-700 text-slate-300 text-xs rounded-xl font-medium border border-slate-800 transition-all"
        >
          <RefreshCw size={14} /> Refresh ledger
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-2 items-center">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex border-b border-slate-850 gap-2 mb-2">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wider transition-all duration-200 border-b-2
            ${activeTab === 'invoices' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}
          `}
        >
          Invoices Directory
        </button>
        {!isClient && (
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wider transition-all duration-200 border-b-2
              ${activeTab === 'expenses' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}
            `}
          >
            Staff Expenses
          </button>
        )}
        {isAccountingOrAdmin && (
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wider transition-all duration-200 border-b-2
              ${activeTab === 'purchases' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}
            `}
          >
            Agency Purchases
          </button>
        )}
      </div>

      {/* INVOICES */}
      {activeTab === 'invoices' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoiced Retainers</span>
            {isAccountingOrAdmin && (
              <button
                onClick={() => setShowAddInvoice(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-indigo hover:opacity-90 rounded-xl text-xs font-semibold text-white transition-all shadow shadow-indigo-600/10"
              >
                <Plus size={14} /> Create Invoice
              </button>
            )}
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-slate-900 shadow">
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Company Account</th>
                    <th>Invoice ID</th>
                    <th>Total Retainer</th>
                    <th>Issue Date</th>
                    <th>Status</th>
                    {isAccountingOrAdmin && <th className="text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-xs text-slate-500 text-center py-10">No invoices generated.</td>
                    </tr>
                  ) : (
                    invoices.map(inv => {
                      const comp = companies.find(c => c.id === inv.company_id)
                      return (
                        <tr key={inv.id}>
                          <td>
                            <span className="font-semibold text-slate-200 block">{comp?.name || 'Loading Company...'}</span>
                            <span className="text-[9px] text-slate-500 font-medium capitalize">{comp?.industry || 'No Industry'}</span>
                          </td>
                          <td>
                            <span className="text-xs text-slate-400 font-mono">#{inv.id.slice(2, 8)}</span>
                          </td>
                          <td>
                            <span className="text-xs font-bold text-slate-200">${inv.amount.toLocaleString()}</span>
                          </td>
                          <td>
                            <span className="text-xs text-slate-400">{inv.date}</span>
                          </td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider
                              ${inv.status === 'draft' ? 'bg-slate-800 text-slate-500' : ''}
                              ${inv.status === 'sent' ? 'bg-amber-500/10 text-amber-400' : ''}
                              ${inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                              ${inv.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 font-bold' : ''}
                            `}>
                              {inv.status}
                            </span>
                          </td>
                          {isAccountingOrAdmin && (
                            <td className="text-right">
                              <div className="flex justify-end gap-1.5">
                                {inv.status === 'draft' && (
                                  <button
                                    onClick={() => handleUpdateInvoiceStatus(inv.id, 'sent')}
                                    className="px-2 py-1 bg-crm-800 hover:bg-crm-700 text-slate-300 text-[10px] rounded border border-slate-800"
                                  >
                                    Send
                                  </button>
                                )}
                                {inv.status !== 'paid' && (
                                  <button
                                    onClick={() => handleUpdateInvoiceStatus(inv.id, 'paid')}
                                    className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[10px] font-semibold rounded border border-emerald-955/20"
                                  >
                                    Collect
                                  </button>
                                )}
                                {inv.status === 'sent' && (
                                  <button
                                    onClick={() => handleUpdateInvoiceStatus(inv.id, 'overdue')}
                                    className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-[10px] font-semibold rounded border border-rose-955/20"
                                  >
                                    Overdue
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES */}
      {activeTab === 'expenses' && !isClient && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logged Overhead Expenses</span>
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-indigo hover:opacity-90 rounded-xl text-xs font-semibold text-white transition-all shadow shadow-indigo-600/10"
            >
              <Plus size={14} /> Log Expense
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-slate-900 shadow">
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Expense Category</th>
                    <th>Submitting Staff</th>
                    <th>Total Cost</th>
                    <th>Logged Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-xs text-slate-500 text-center py-10">No expenses recorded.</td>
                    </tr>
                  ) : (
                    expenses.map(exp => {
                      const rep = salesReps.find(u => u.id === exp.created_by)
                      return (
                        <tr key={exp.id}>
                          <td>
                            <span className="font-semibold text-slate-200 block text-xs">{exp.category}</span>
                          </td>
                          <td>
                            <span className="text-xs text-slate-300 font-medium">{rep ? rep.name : 'Unknown Rep'}</span>
                          </td>
                          <td>
                            <span className="text-xs font-bold text-rose-400">${exp.amount.toLocaleString()}</span>
                          </td>
                          <td>
                            <span className="text-xs text-slate-400">{exp.date}</span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PURCHASES */}
      {activeTab === 'purchases' && isAccountingOrAdmin && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hardware & Software Purchases</span>
            <button
              onClick={() => setShowAddPurchase(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-indigo hover:opacity-90 rounded-xl text-xs font-semibold text-white transition-all shadow shadow-indigo-600/10"
            >
              <Plus size={14} /> Log Purchase
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-slate-900 shadow">
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Purchase Cost</th>
                    <th>Date Logged</th>
                    <th>Shipping Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-xs text-slate-500 text-center py-10">No hardware/software purchases.</td>
                    </tr>
                  ) : (
                    purchases.map(pur => (
                      <tr key={pur.id}>
                        <td>
                          <span className="font-semibold text-slate-200 block text-xs">{pur.vendor}</span>
                        </td>
                        <td>
                          <span className="text-xs font-bold text-slate-300">${pur.amount.toLocaleString()}</span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-400">{pur.date}</span>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider
                            ${pur.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : ''}
                            ${pur.status === 'paid' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                            ${pur.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                          `}>
                            {pur.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {pur.status === 'pending' && (
                              <button
                                onClick={() => handleUpdatePurchaseStatus(pur.id, 'paid')}
                                className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[10px] rounded transition-all"
                              >
                                Pay
                              </button>
                            )}
                            {pur.status === 'paid' && (
                              <button
                                onClick={() => handleUpdatePurchaseStatus(pur.id, 'delivered')}
                                className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[10px] rounded transition-all"
                              >
                                Delivered
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAddInvoice && (
        <div className="fixed inset-0 bg-crm-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-slate-800 p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Generate Client Invoice</h3>
            
            <form onSubmit={handleAddInvoice} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Company Account</label>
                <select
                  required
                  value={invCompany}
                  onChange={(e) => setInvCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                >
                  <option value="" disabled className="bg-crm-950">Select Paying Client</option>
                  {companies.filter(c => c.is_client).map(c => (
                    <option key={c.id} value={c.id} className="bg-crm-950">{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Invoice Amount ($)</label>
                  <input
                    type="number"
                    required
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Initial Status</label>
                  <select
                    value={invStatus}
                    onChange={(e) => setInvStatus(e.target.value as InvoiceStatus)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                  >
                    <option value="draft" className="bg-crm-950">Draft</option>
                    <option value="sent" className="bg-crm-950">Sent</option>
                    <option value="paid" className="bg-crm-950">Paid</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddInvoice(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-crm-800 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-indigo hover:opacity-95 text-white text-xs font-semibold rounded-xl"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddExpense && (
        <div className="fixed inset-0 bg-crm-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-slate-800 p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Log Approach Expense</h3>
            
            <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                >
                  <option value="Software Subscriptions" className="bg-crm-950">Software Subscriptions</option>
                  <option value="Travel & Lodging" className="bg-crm-950">Travel & Lodging</option>
                  <option value="Advertising" className="bg-crm-950">Advertising</option>
                  <option value="Office Supplies" className="bg-crm-950">Office Supplies</option>
                  <option value="Client Dining" className="bg-crm-950">Client Dining</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Cost Amount ($)</label>
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="250.00"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-crm-800 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-indigo hover:opacity-95 text-white text-xs font-semibold rounded-xl"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPurchase && (
        <div className="fixed inset-0 bg-crm-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-slate-800 p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Log Agency Purchase</h3>
            
            <form onSubmit={handleAddPurchase} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Vendor</label>
                <input
                  type="text"
                  required
                  value={purVendor}
                  onChange={(e) => setPurVendor(e.target.value)}
                  placeholder="AWS Cloud"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Amount ($)</label>
                <input
                  type="number"
                  required
                  value={purAmount}
                  onChange={(e) => setPurAmount(e.target.value)}
                  placeholder="120.00"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddPurchase(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-crm-800 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-indigo hover:opacity-95 text-white text-xs font-semibold rounded-xl"
                >
                  Save Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
