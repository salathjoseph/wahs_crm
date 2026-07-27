import React, { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { mockDb } from '../mockData'
import { Opportunity, Lead, Company, Profile, Activity, OpportunityStage, ActivityType, UserRole } from '../types'
import {
  Clock,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Lock
} from 'lucide-react'

interface Stage {
  id: OpportunityStage;
  label: string;
  color: string;
}

const STAGES: Stage[] = [
  { id: 'discovery', label: 'Discovery', color: 'border-t-blue-500 bg-blue-500/5' },
  { id: 'demo', label: 'Demo Booked', color: 'border-t-indigo-500 bg-indigo-500/5' },
  { id: 'proposal', label: 'Proposal Sent', color: 'border-t-purple-500 bg-purple-500/5' },
  { id: 'negotiation', label: 'Negotiation', color: 'border-t-amber-500 bg-amber-500/5' },
  { id: 'closed_won', label: 'Closed Won', color: 'border-t-emerald-500 bg-emerald-500/5' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'border-t-rose-500 bg-rose-500/5' }
]

export const Opportunities = () => {
  const { profile, isDemoMode } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [salesReps, setSalesReps] = useState<Profile[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Detail Modal State
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false)

  // Quick activity log state
  const [actType, setActType] = useState<ActivityType>('call')
  const [actDesc, setActDesc] = useState<string>('')
  const [actSuccessMsg, setActSuccessMsg] = useState<string>('')

  // Edit deal state
  const [editValue, setEditValue] = useState<string | number>('')
  const [editProb, setEditProb] = useState<string | number>('')
  const [editStage, setEditStage] = useState<OpportunityStage>('discovery')
  const [editDate, setEditDate] = useState<string>('')

  const userRole: UserRole = profile?.role || 'client'
  const isClient = userRole === 'client'

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode) {
        const comps = mockDb.getCompanies()
        const lds = mockDb.getLeads()
        const opps = mockDb.getOpportunities()
        const reps = mockDb.getProfiles()
        const acts = mockDb.getActivities()

        setCompanies(comps)
        setLeads(lds)
        setSalesReps(reps)
        setActivities(acts)

        if (userRole === 'client') {
          const clientLeads = lds.filter(l => l.company_id === profile?.company_id)
          const clientLeadIds = clientLeads.map(l => l.id)
          setOpportunities(opps.filter(o => clientLeadIds.includes(o.lead_id)))
        } else if (userRole === 'sales') {
          const myLeads = lds.filter(l => l.assigned_to === profile?.id)
          const myLeadIds = myLeads.map(l => l.id)
          setOpportunities(opps.filter(o => myLeadIds.includes(o.lead_id)))
        } else {
          setOpportunities(opps)
        }
      } else {
        const { data: comps } = await supabase.from('companies').select('*')
        const { data: lds } = await supabase.from('leads').select('*')
        const { data: opps } = await supabase.from('opportunities').select('*')
        const { data: reps } = await supabase.from('profiles').select('*')
        const { data: acts } = await supabase.from('activities').select('*')

        setCompanies(comps || [])
        setLeads(lds || [])
        setOpportunities(opps || [])
        setSalesReps(reps || [])
        setActivities(acts || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    if (!isDemoMode) {
      const channel = supabase
        .channel('opportunities-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities' }, () => {
          loadData()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [isDemoMode, userRole, profile])

  const openOppDetails = (opp: Opportunity) => {
    setSelectedOpp(opp)
    setEditValue(opp.value)
    setEditProb(opp.probability)
    setEditStage(opp.stage)
    setEditDate(opp.expected_close_date || '')
    setShowDetailModal(true)
  }

  const handleUpdateOpp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedOpp || !profile) return
    setLoading(true)

    const val = parseFloat(String(editValue))
    const prob = parseFloat(String(editProb))

    try {
      const updatedRecord = {
        ...selectedOpp,
        value: isNaN(val) ? selectedOpp.value : val,
        probability: isNaN(prob) ? selectedOpp.probability : prob,
        stage: editStage,
        expected_close_date: editDate || null
      }

      if (isDemoMode) {
        mockDb.saveOpportunity(updatedRecord)

        if (editStage === 'closed_won' && selectedOpp.stage !== 'closed_won') {
          const sale = mockDb.saveSale({
            opportunity_id: selectedOpp.id,
            amount: val,
            date: new Date().toISOString().split('T')[0],
            status: 'confirmed'
          })

          const leadObj = leads.find(l => l.id === selectedOpp.lead_id)
          const repId = leadObj?.assigned_to || profile.id

          mockDb.saveCommission({
            sale_id: sale.id,
            earned_by: repId,
            commission_percent: 10,
            commission_amount: val * 0.1,
            status: 'pending'
          })
        }

        setShowDetailModal(false)
        setSelectedOpp(null)
        loadData()
      } else {
        const { error: oppErr } = await supabase
          .from('opportunities')
          .update({
            value: val,
            probability: prob,
            stage: editStage,
            expected_close_date: editDate || null
          })
          .eq('id', selectedOpp.id)

        if (oppErr) throw oppErr

        if (editStage === 'closed_won' && selectedOpp.stage !== 'closed_won') {
          const { data: sale, error: saleErr } = await supabase
            .from('sales')
            .insert({
              opportunity_id: selectedOpp.id,
              amount: val,
              status: 'confirmed'
            })
            .select()
            .single()

          if (saleErr) throw saleErr

          const leadObj = leads.find(l => l.id === selectedOpp.lead_id)
          const repId = leadObj?.assigned_to || profile.id

          const { error: commErr } = await supabase
            .from('commissions')
            .insert({
              sale_id: sale.id,
              earned_by: repId,
              commission_percent: 10,
              commission_amount: val * 0.1,
              status: 'pending'
            })

          if (commErr) throw commErr
        }

        setShowDetailModal(false)
        setSelectedOpp(null)
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleLogActivity = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!actDesc || !selectedOpp || !profile) return

    try {
      const newAct = {
        lead_id: selectedOpp.lead_id,
        type: actType,
        description: actDesc,
        created_by: profile.id
      }

      if (isDemoMode) {
        mockDb.saveActivity(newAct)
        setActivities(mockDb.getActivities())
        setActDesc('')
        setActSuccessMsg('Activity logged in CRM!')
        setTimeout(() => setActSuccessMsg(''), 3000)
      } else {
        const { error } = await supabase.from('activities').insert(newAct)
        if (error) throw error

        const { data: updatedActs } = await supabase.from('activities').select('*')
        setActivities(updatedActs || [])
        setActDesc('')
        setActSuccessMsg('Activity logged in CRM!')
        setTimeout(() => setActSuccessMsg(''), 3000)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const moveOppStage = async (opp: Opportunity, direction: number) => {
    const currentIdx = STAGES.findIndex(s => s.id === opp.stage)
    const nextIdx = currentIdx + direction
    if (nextIdx < 0 || nextIdx >= STAGES.length) return

    const nextStage = STAGES[nextIdx].id
    setLoading(true)
    try {
      const updatedOpp = { ...opp, stage: nextStage }
      if (isDemoMode) {
        mockDb.saveOpportunity(updatedOpp)
        if (nextStage === 'closed_won' && opp.stage !== 'closed_won') {
          const sale = mockDb.saveSale({
            opportunity_id: opp.id,
            amount: opp.value,
            date: new Date().toISOString().split('T')[0],
            status: 'confirmed'
          })
          const leadObj = leads.find(l => l.id === opp.lead_id)
          mockDb.saveCommission({
            sale_id: sale.id,
            earned_by: leadObj?.assigned_to || profile?.id || null,
            commission_percent: 10,
            commission_amount: opp.value * 0.1,
            status: 'pending'
          })
        }
        loadData()
      } else {
        await supabase.from('opportunities').update({ stage: nextStage }).eq('id', opp.id)
        if (nextStage === 'closed_won' && opp.stage !== 'closed_won') {
          const { data: sale } = await supabase
            .from('sales')
            .insert({ opportunity_id: opp.id, amount: opp.value, status: 'confirmed' })
            .select().single()

          const leadObj = leads.find(l => l.id === opp.lead_id)
          await supabase.from('commissions').insert({
            sale_id: sale?.id,
            earned_by: leadObj?.assigned_to || profile?.id || null,
            commission_percent: 10,
            commission_amount: opp.value * 0.1,
            status: 'pending'
          })
        }
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading && opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm loading-pulse font-medium">Querying negotiation pipeline...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Deals Pipeline</h1>
        <p className="text-slate-400 text-sm mt-1">Sourced contract values categorized by pipeline phases.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-2 items-center">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6 items-start">
        {STAGES.map(stage => {
          const stageOpps = opportunities.filter(o => o.stage === stage.id)
          const columnTotalValue = stageOpps.reduce((sum, o) => sum + (o.value || 0), 0)

          return (
            <div key={stage.id} className="flex flex-col gap-4 bg-crm-900/10 border border-slate-900 rounded-2xl p-4 min-h-[400px]">
              <div className={`border-t-4 ${stage.color} pt-3 pb-1 flex flex-col`}>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">{stage.label}</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-500 font-semibold">{stageOpps.length} deals</span>
                  <span className="text-xs font-bold text-indigo-400">${columnTotalValue.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[500px]">
                {stageOpps.length === 0 ? (
                  <div className="py-8 text-center text-[10px] text-slate-500 font-medium border border-dashed border-slate-850 rounded-xl">
                    No deals
                  </div>
                ) : (
                  stageOpps.map(opp => {
                    const lead = leads.find(l => l.id === opp.lead_id)
                    const comp = companies.find(c => c.id === lead?.company_id)
                    return (
                      <div
                        key={opp.id}
                        className="glass-card rounded-xl p-4 border border-slate-800/80 cursor-pointer hover:border-indigo-500/30 transition-all flex flex-col gap-3 group shadow"
                      >
                        <div onClick={() => openOppDetails(opp)}>
                          <span className="text-xs font-bold text-slate-200 block truncate group-hover:text-indigo-300 transition-colors">
                            {comp?.name || 'Loading Account'}
                          </span>
                          <span className="text-[10px] text-slate-500 capitalize block mt-0.5">{comp?.industry || 'No Industry'}</span>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-bold text-indigo-400">${(opp.value || 0).toLocaleString()}</span>
                          <span className="text-[10px] font-semibold text-slate-400">{opp.probability}% prob.</span>
                        </div>

                        {!isClient && (
                          <div className="flex justify-between items-center gap-1 border-t border-slate-800/60 pt-2.5 mt-1">
                            <button
                              disabled={opp.stage === 'discovery'}
                              onClick={(e) => { e.stopPropagation(); moveOppStage(opp, -1) }}
                              className="text-[10px] text-slate-500 hover:text-slate-300 disabled:opacity-30 px-1 py-0.5 bg-crm-800/40 rounded border border-slate-800"
                            >
                              Back
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openOppDetails(opp) }}
                              className="text-[10px] text-indigo-400 hover:underline font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              disabled={opp.stage === 'closed_lost'}
                              onClick={(e) => { e.stopPropagation(); moveOppStage(opp, 1) }}
                              className="text-[10px] text-slate-400 hover:text-white disabled:opacity-30 px-1 py-0.5 bg-indigo-600/10 hover:bg-indigo-600/20 rounded border border-indigo-900/30 font-semibold"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showDetailModal && selectedOpp && (
        <div className="fixed inset-0 bg-crm-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-4xl w-full rounded-2xl border border-slate-800 p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                  Opportunity Deal Room
                </h3>
                <span className="text-xs text-slate-400 mt-1 block">
                  Reference ID: #{selectedOpp.id}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedOpp(null)
                  setActSuccessMsg('')
                }}
                className="px-3 py-1.5 bg-crm-800 hover:bg-crm-700 rounded-lg text-slate-400 text-xs font-semibold"
              >
                Close Window
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col gap-6">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Update parameters</span>
                
                {isClient ? (
                  <div className="flex items-center gap-2 p-4 bg-crm-900 border border-slate-800 text-slate-400 text-xs rounded-xl">
                    <Lock size={14} />
                    <span>Client accounts are restricted to read-only Deal Room views.</span>
                  </div>
                ) : null}

                <form onSubmit={handleUpdateOpp} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Contract Value ($)</label>
                      <input
                        type="number"
                        disabled={isClient}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Probability (%)</label>
                      <input
                        type="number"
                        disabled={isClient}
                        value={editProb}
                        onChange={(e) => setEditProb(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Pipeline Stage</label>
                      <select
                        disabled={isClient}
                        value={editStage}
                        onChange={(e) => setEditStage(e.target.value as OpportunityStage)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input disabled:opacity-50"
                      >
                        {STAGES.map(s => (
                          <option key={s.id} value={s.id} className="bg-crm-950 capitalize">{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Exp Close Date</label>
                      <input
                        type="date"
                        disabled={isClient}
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {!isClient && (
                    <button
                      type="submit"
                      className="py-2.5 bg-gradient-indigo hover:opacity-95 text-xs font-semibold text-white rounded-xl transition-all shadow-md shadow-indigo-600/10 mt-3 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Commit Changes
                    </button>
                  )}
                </form>
              </div>

              <div className="flex flex-col gap-6 border-t lg:border-t-0 lg:border-l border-slate-850 pt-6 lg:pt-0 lg:pl-8">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Sourced Activity History</span>

                {!isClient && (
                  <form onSubmit={handleLogActivity} className="bg-crm-900/30 border border-slate-850 p-4 rounded-xl flex flex-col gap-3">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Add Approach Log</span>
                    {actSuccessMsg && (
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-lg">
                        {actSuccessMsg}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <select
                        value={actType}
                        onChange={(e) => setActType(e.target.value as ActivityType)}
                        className="px-2 py-1 bg-crm-800 border border-slate-700 text-slate-300 rounded text-[10px] font-semibold"
                      >
                        <option value="call">CALL</option>
                        <option value="email">EMAIL</option>
                        <option value="meeting">MEETING</option>
                        <option value="note">NOTE</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={actDesc}
                        onChange={(e) => setActDesc(e.target.value)}
                        placeholder="Log calling, follow ups, note detail..."
                        className="flex-1 px-3 py-1 bg-crm-950 border border-slate-850 text-[10px] text-slate-200 rounded focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold"
                      >
                        Log
                      </button>
                    </div>
                  </form>
                )}

                <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-2">
                  {activities.filter(a => a.lead_id === selectedOpp.lead_id).length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No approach logs recorded for this lead.</p>
                  ) : (
                    activities
                      .filter(a => a.lead_id === selectedOpp.lead_id)
                      .map(act => {
                        const reporter = salesReps.find(u => u.id === act.created_by)
                        return (
                          <div key={act.id} className="p-3 bg-crm-900/20 border border-slate-900 rounded-xl flex gap-3 text-xs leading-relaxed">
                            <div className="text-indigo-400 mt-0.5"><Clock size={14} /></div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-300 uppercase">{act.type}</span>
                                <span className="text-slate-500">{new Date(act.date).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-400 mt-1">{act.description}</p>
                              <span className="text-[10px] text-indigo-400/70 mt-1.5 block font-medium">Logged by: {reporter?.name || 'Unknown'}</span>
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
