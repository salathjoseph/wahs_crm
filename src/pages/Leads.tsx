import React, { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { mockDb } from '../mockData'
import { Lead, Company, Contact, Profile, LeadStatus, UserRole } from '../types'
import { Plus, Search, UserCheck, Trash2, ArrowUpRight, AlertCircle, RefreshCw, DollarSign, Calendar } from 'lucide-react'

export const Leads = () => {
  const { profile, isDemoMode } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [salesReps, setSalesReps] = useState<Profile[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals & Forms
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [showQualifyModal, setShowQualifyModal] = useState<boolean>(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // New Lead Form State
  const [newCompName, setNewCompName] = useState<string>('')
  const [newCompIndustry, setNewCompIndustry] = useState<string>('')
  const [newContactName, setNewContactName] = useState<string>('')
  const [newContactEmail, setNewContactEmail] = useState<string>('')
  const [newContactPhone, setNewContactPhone] = useState<string>('')
  const [newContactDesignation, setNewContactDesignation] = useState<string>('')
  const [leadSource, setLeadSource] = useState<string>('LinkedIn Outbound')
  const [assignedTo, setAssignedTo] = useState<string>('')

  // Conversion Form State
  const [dealValue, setDealValue] = useState<string>('')
  const [closeDate, setCloseDate] = useState<string>('')

  const userRole: UserRole = profile?.role || 'client'
  const isAcqOrAdmin = userRole === 'acquisition' || userRole === 'admin'

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode) {
        const comps = mockDb.getCompanies()
        const conts = mockDb.getContacts()
        const lds = mockDb.getLeads()
        const users = mockDb.getProfiles().filter(u => u.role === 'sales' || u.role === 'admin')

        setCompanies(comps)
        setContacts(conts)
        setSalesReps(users)

        if (userRole === 'client') {
          setLeads(lds.filter(l => l.company_id === profile?.company_id))
        } else if (userRole === 'sales') {
          setLeads(lds.filter(l => l.assigned_to === profile?.id || l.assigned_to === null))
        } else {
          setLeads(lds)
        }
      } else {
        const { data: comps } = await supabase.from('companies').select('*')
        const { data: conts } = await supabase.from('contacts').select('*')
        const { data: lds } = await supabase.from('leads').select('*')
        const { data: users } = await supabase.from('profiles').select('*').in('role', ['sales', 'admin'])

        setCompanies(comps || [])
        setContacts(conts || [])
        setSalesReps(users || [])
        setLeads(lds || [])
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

  const handleAddLead = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newCompName || !newContactName) return

    setLoading(true)
    try {
      if (isDemoMode) {
        const comp = mockDb.saveCompany({
          name: newCompName,
          industry: newCompIndustry,
          is_client: false
        })

        const contact = mockDb.saveContact({
          company_id: comp.id,
          name: newContactName,
          email: newContactEmail,
          phone: newContactPhone,
          designation: newContactDesignation
        })

        mockDb.saveLead({
          company_id: comp.id,
          contact_id: contact.id,
          source: leadSource,
          status: 'new',
          assigned_to: assignedTo || null
        })

        setShowAddModal(false)
        resetForm()
        loadData()
      } else {
        const { data: comp, error: compErr } = await supabase
          .from('companies')
          .insert({ name: newCompName, industry: newCompIndustry, is_client: false })
          .select()
          .single()

        if (compErr) throw compErr

        const { data: contact, error: contactErr } = await supabase
          .from('contacts')
          .insert({
            company_id: comp.id,
            name: newContactName,
            email: newContactEmail,
            phone: newContactPhone,
            designation: newContactDesignation
          })
          .select()
          .single()

        if (contactErr) throw contactErr

        const { error: leadErr } = await supabase
          .from('leads')
          .insert({
            company_id: comp.id,
            contact_id: contact.id,
            source: leadSource,
            status: 'new',
            assigned_to: assignedTo || null
          })

        if (leadErr) throw leadErr

        setShowAddModal(false)
        resetForm()
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleConvertLead = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedLead || !dealValue || !closeDate) return

    setLoading(true)
    try {
      const val = parseFloat(dealValue)
      if (isNaN(val)) throw new Error("Invalid deal value")

      if (isDemoMode) {
        const updatedLead = { ...selectedLead, status: 'handed_off' as LeadStatus }
        mockDb.saveLead(updatedLead)

        mockDb.saveOpportunity({
          lead_id: selectedLead.id,
          value: val,
          stage: 'discovery',
          probability: 10,
          expected_close_date: closeDate
        })

        setShowQualifyModal(false)
        setSelectedLead(null)
        setDealValue('')
        setCloseDate('')
        loadData()
      } else {
        const { error: leadErr } = await supabase
          .from('leads')
          .update({ status: 'handed_off' })
          .eq('id', selectedLead.id)

        if (leadErr) throw leadErr

        const { error: oppErr } = await supabase
          .from('opportunities')
          .insert({
            lead_id: selectedLead.id,
            value: val,
            stage: 'discovery',
            probability: 10,
            expected_close_date: closeDate
          })

        if (oppErr) throw oppErr

        setShowQualifyModal(false)
        setSelectedLead(null)
        setDealValue('')
        setCloseDate('')
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleDisqualifyLead = async (leadId: string) => {
    if (!window.confirm("Are you sure you want to disqualify this lead?")) return
    setLoading(true)
    try {
      if (isDemoMode) {
        const lead = leads.find(l => l.id === leadId)
        if (lead) {
          mockDb.saveLead({ ...lead, status: 'disqualified' as LeadStatus })
        }
        loadData()
      } else {
        const { error } = await supabase
          .from('leads')
          .update({ status: 'disqualified' })
          .eq('id', leadId)

        if (error) throw error
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewCompName('')
    setNewCompIndustry('')
    setNewContactName('')
    setNewContactEmail('')
    setNewContactPhone('')
    setNewContactDesignation('')
    setLeadSource('LinkedIn Outbound')
    setAssignedTo('')
  }

  const filteredLeads = leads.filter(l => {
    const comp = companies.find(c => c.id === l.company_id)
    const contact = contacts.find(c => c.id === l.contact_id)
    const matchesSearch = 
      (comp?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (contact?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.source || '').toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leads & Ingestion</h1>
          <p className="text-slate-400 text-sm mt-1">Manage target outreach leads and qualify opportunities.</p>
        </div>
        {isAcqOrAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-indigo hover:opacity-90 rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus size={18} /> Ingest Lead
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-2 items-center">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-crm-900/30 border border-slate-800/80 p-4 rounded-2xl">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Search size={16} /></span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or contact..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium glass-input"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="qualified">Qualified</option>
            <option value="handed_off">Handed Off</option>
            <option value="disqualified">Disqualified</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button 
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 bg-crm-800 hover:bg-crm-700 text-slate-300 text-xs rounded-xl font-medium border border-slate-800 hover:border-slate-700 transition-all"
          >
            <RefreshCw size={14} /> Refresh Leads
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-850">
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Source</th>
                <th>Status</th>
                <th>Assigned Rep</th>
                {userRole !== 'client' && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-xs text-slate-500 text-center py-10">No leads found. Select another filter or ingest a new target.</td>
                </tr>
              ) : (
                filteredLeads.map(l => {
                  const comp = companies.find(c => c.id === l.company_id)
                  const contact = contacts.find(c => c.id === l.contact_id)
                  const rep = salesReps.find(u => u.id === l.assigned_to)

                  return (
                    <tr key={l.id}>
                      <td>
                        <span className="font-semibold text-slate-200 block">{comp?.name || 'Loading...'}</span>
                        <span className="text-[10px] text-slate-500 capitalize">{comp?.industry || 'No Industry'}</span>
                      </td>
                      <td>
                        <span className="font-medium text-slate-300 block">{contact?.name || '—'}</span>
                        <span className="text-[10px] text-slate-500">{contact?.designation || 'No designation'}</span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-400">{l.source}</span>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider
                          ${l.status === 'new' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                          ${l.status === 'qualified' ? 'bg-purple-500/10 text-purple-400' : ''}
                          ${l.status === 'handed_off' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                          ${l.status === 'disqualified' ? 'bg-rose-500/10 text-rose-400' : ''}
                        `}>
                          {l.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-slate-400">{rep ? rep.name : 'Unassigned'}</span>
                      </td>
                      {userRole !== 'client' && (
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            {l.status === 'new' && (
                              <button
                                onClick={async () => {
                                  if (isDemoMode) {
                                    mockDb.saveLead({ ...l, status: 'qualified' as LeadStatus })
                                    loadData()
                                  } else {
                                    await supabase.from('leads').update({ status: 'qualified' }).eq('id', l.id)
                                    loadData()
                                  }
                                }}
                                title="Mark Qualified"
                                className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-all"
                              >
                                <UserCheck size={14} />
                              </button>
                            )}
                            {l.status === 'qualified' && (
                              <button
                                onClick={() => {
                                  setSelectedLead(l)
                                  setShowQualifyModal(true)
                                }}
                                title="Convert to Opportunity"
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                              >
                                <ArrowUpRight size={14} />
                              </button>
                            )}
                            {l.status !== 'disqualified' && l.status !== 'handed_off' && (
                              <button
                                onClick={() => handleDisqualifyLead(l.id)}
                                title="Disqualify Lead"
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
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

      {showAddModal && (
        <div className="fixed inset-0 bg-crm-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full rounded-2xl border border-slate-800 p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Ingest New Target Lead</h3>
            
            <form onSubmit={handleAddLead} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Company Name</label>
                  <input
                    type="text"
                    required
                    value={newCompName}
                    onChange={(e) => setNewCompName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Industry</label>
                  <input
                    type="text"
                    value={newCompIndustry}
                    onChange={(e) => setNewCompIndustry(e.target.value)}
                    placeholder="Technology"
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4">
                <span className="block text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-4">Contact Profile</span>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Contact Name</label>
                    <input
                      type="text"
                      required
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Designation</label>
                    <input
                      type="text"
                      value={newContactDesignation}
                      onChange={(e) => setNewContactDesignation(e.target.value)}
                      placeholder="VP of Growth"
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Email</label>
                    <input
                      type="email"
                      value={newContactEmail}
                      onChange={(e) => setNewContactEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Phone</label>
                    <input
                      type="text"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      placeholder="+1 (555) 0123"
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Lead Source</label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                  >
                    <option value="LinkedIn Outbound" className="bg-crm-950">LinkedIn Outbound</option>
                    <option value="Cold Email Campaign" className="bg-crm-950">Cold Email Campaign</option>
                    <option value="Website Demo Request" className="bg-crm-950">Website Demo Request</option>
                    <option value="Partner Referral" className="bg-crm-950">Partner Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Assign Sales Rep</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                  >
                    <option value="" className="bg-crm-950">Keep Unassigned</option>
                    {salesReps.map(rep => (
                      <option key={rep.id} value={rep.id} className="bg-crm-950">{rep.name} ({rep.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-crm-800 text-slate-400 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-indigo hover:opacity-95 text-white text-xs font-semibold rounded-xl transition-all"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQualifyModal && selectedLead && (
        <div className="fixed inset-0 bg-crm-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-slate-800 p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">Qualify & Handover to Sales</h3>
            <p className="text-xs text-slate-400 mb-6">
              Create an opportunity pipeline entry for **{companies.find(c => c.id === selectedLead.company_id)?.name}**. This changes status to Handed Off.
            </p>
            
            <form onSubmit={handleConvertLead} className="flex flex-col gap-5">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Deal Contract Value ($)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><DollarSign size={14} /></span>
                  <input
                    type="number"
                    required
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder="15000"
                    className="w-full pl-8 pr-4 py-2 rounded-xl text-xs font-medium glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Expected Close Date</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Calendar size={14} /></span>
                  <input
                    type="date"
                    required
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-xl text-xs font-medium glass-input"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowQualifyModal(false)
                    setSelectedLead(null)
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-crm-800 text-slate-400 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-indigo hover:opacity-95 text-white text-xs font-semibold rounded-xl transition-all"
                >
                  Convert & Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
