import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { mockDb } from '../mockData'
import { Commission, Sale, Opportunity, Company, Lead, Profile, UserRole, CommissionStatus } from '../types'
import {
  Clock,
  CheckCircle,
  DollarSign,
  AlertCircle,
  RefreshCw,
  User
} from 'lucide-react'

export const Commissions = () => {
  const { profile, isDemoMode } = useAuth()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [salesReps, setSalesReps] = useState<Profile[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const userRole: UserRole = profile?.role || 'client'
  const isSales = userRole === 'sales'
  const isApprover = userRole === 'admin' || userRole === 'accounting'

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode) {
        const comms = mockDb.getCommissions()
        const sls = mockDb.getSales()
        const opps = mockDb.getOpportunities()
        const comps = mockDb.getCompanies()
        const lds = mockDb.getLeads()
        const reps = mockDb.getProfiles().filter(p => p.role === 'sales' || p.role === 'admin')

        setSales(sls)
        setOpportunities(opps)
        setCompanies(comps)
        setLeads(lds)
        setSalesReps(reps)

        if (isSales) {
          setCommissions(comms.filter(c => c.earned_by === profile?.id))
        } else {
          setCommissions(comms)
        }
      } else {
        const { data: comms } = await supabase.from('commissions').select('*')
        const { data: sls } = await supabase.from('sales').select('*')
        const { data: opps } = await supabase.from('opportunities').select('*')
        const { data: comps } = await supabase.from('companies').select('*')
        const { data: lds } = await supabase.from('leads').select('*')
        const { data: reps } = await supabase.from('profiles').select('*')

        setSales(sls || [])
        setOpportunities(opps || [])
        setCompanies(comps || [])
        setLeads(lds || [])
        setSalesReps(reps || [])

        if (isSales) {
          setCommissions((comms || []).filter(c => c.earned_by === profile?.id))
        } else {
          setCommissions(comms || [])
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

  const handleUpdateStatus = async (commId: string, newStatus: CommissionStatus) => {
    setLoading(true)
    try {
      const commItem = commissions.find(c => c.id === commId)
      if (!commItem) return

      const paidDate = newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
      const updatedComm = { ...commItem, status: newStatus, paid_date: paidDate }

      if (isDemoMode) {
        mockDb.saveCommission(updatedComm)
        loadData()
      } else {
        const { error } = await supabase
          .from('commissions')
          .update({ status: newStatus, paid_date: paidDate })
          .eq('id', commId)

        if (error) throw error
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading && commissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm loading-pulse font-medium">Crunching commission ledger...</p>
      </div>
    )
  }

  // Statistics
  const pendingAmount = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + (c.commission_amount || 0), 0)

  const approvedAmount = commissions
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + (c.commission_amount || 0), 0)

  const paidAmount = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + (c.commission_amount || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Commissions Ledger</h1>
          <p className="text-slate-400 text-sm mt-1">Track payout rates and commission approvals for closed deals.</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending payouts</span>
            <span className="text-2xl font-extrabold text-white mt-2 block">${pendingAmount.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock size={20} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Approved payouts</span>
            <span className="text-2xl font-extrabold text-indigo-400 mt-2 block">${approvedAmount.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Paid/Deposited</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-2 block">${paidAmount.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-900 shadow">
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Deal Reference</th>
                <th>Representative</th>
                <th>Sale Amount</th>
                <th>Commission Rate</th>
                <th>Payout Value</th>
                <th>Payout Status</th>
                {isApprover && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-xs text-slate-500 text-center py-10">No commission records registered. Closing a deal won automatically logs a commission.</td>
                </tr>
              ) : (
                commissions.map(c => {
                  const sale = sales.find(s => s.id === c.sale_id)
                  const opp = opportunities.find(o => o.id === sale?.opportunity_id)
                  const lead = leads.find(l => l.id === opp?.lead_id)
                  const comp = companies.find(co => co.id === lead?.company_id)
                  const rep = salesReps.find(u => u.id === c.earned_by)

                  return (
                    <tr key={c.id}>
                      <td>
                        <span className="font-semibold text-slate-200 block">{comp?.name || 'Loading Account...'}</span>
                        <span className="text-[9px] text-slate-500 font-medium">Deal Room ID: #{opp?.id.slice(2, 8) || 'N/A'}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-crm-800 border border-slate-700 text-slate-300 flex items-center justify-center text-[10px] uppercase font-bold">
                            {rep ? rep.name.slice(0, 2) : <User size={10} />}
                          </div>
                          <span className="text-xs text-slate-300 font-medium">{rep ? rep.name : 'Unknown Rep'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-slate-300">${sale ? sale.amount.toLocaleString() : '0'}</span>
                      </td>
                      <td>
                        <span className="text-xs text-indigo-400 font-semibold">{c.commission_percent}%</span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-200 font-bold">${c.commission_amount.toLocaleString()}</span>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider
                          ${c.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : ''}
                          ${c.status === 'approved' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                          ${c.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                        `}>
                          {c.status}
                        </span>
                        {c.status === 'paid' && c.paid_date && (
                          <span className="text-[9px] text-slate-500 block mt-1">Paid on: {c.paid_date}</span>
                        )}
                      </td>
                      {isApprover && (
                        <td className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {c.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(c.id, 'approved')}
                                className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[10px] font-semibold rounded border border-indigo-900/30 transition-all"
                              >
                                Approve
                              </button>
                            )}
                            {c.status === 'approved' && (
                              <button
                                onClick={() => handleUpdateStatus(c.id, 'paid')}
                                className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[10px] font-semibold rounded border border-emerald-900/30 transition-all"
                              >
                                Mark Paid
                              </button>
                            )}
                            {c.status === 'paid' && (
                              <span className="text-[10px] text-slate-500 font-semibold pr-2">Cleared</span>
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
  )
}
