import React, { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { mockDb } from '../mockData'
import { Company, Contact, UserRole, ContractStatus } from '../types'
import { Building2, Plus, Edit, DollarSign, AlertCircle, ExternalLink, Lock, CheckCircle2, RefreshCw, Mail, Phone, Search } from 'lucide-react'

export const Accounts = () => {
  const { profile, isDemoMode } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Modals & Panels
  const [selectedComp, setSelectedComp] = useState<Company | null>(null)
  const [showAddCompanyModal, setShowAddCompanyModal] = useState<boolean>(false)
  const [showEditContractModal, setShowEditContractModal] = useState<boolean>(false)
  const [showAddContactModal, setShowAddContactModal] = useState<boolean>(false)

  // Add Company Form State
  const [newCompName, setNewCompName] = useState<string>('')
  const [newCompIndustry, setNewCompIndustry] = useState<string>('')
  const [newCompWebsite, setNewCompWebsite] = useState<string>('')
  const [newCompIsClient, setNewCompIsClient] = useState<boolean>(false)
  const [newCompRetainer, setNewCompRetainer] = useState<string>('')
  const [newCompStartDate, setNewCompStartDate] = useState<string>('')

  // Edit Contract Form State
  const [editRetainer, setEditRetainer] = useState<string | number>('')
  const [editStartDate, setEditStartDate] = useState<string>('')
  const [editStatus, setEditStatus] = useState<ContractStatus>('active')
  const [editIsClient, setEditIsClient] = useState<boolean>(false)

  // Add Contact Form State
  const [newContactName, setNewContactName] = useState<string>('')
  const [newContactEmail, setNewContactEmail] = useState<string>('')
  const [newContactPhone, setNewContactPhone] = useState<string>('')
  const [newContactDesignation, setNewContactDesignation] = useState<string>('')

  const userRole: UserRole = profile?.role || 'client'
  const isClient = userRole === 'client'
  const isAccountingOrAdmin = userRole === 'accounting' || userRole === 'admin'
  const isAcqOrStaff = userRole === 'acquisition' || userRole === 'admin' || userRole === 'accounting'

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode) {
        const comps = mockDb.getCompanies()
        const conts = mockDb.getContacts()

        setContacts(conts)

        if (isClient) {
          const clientComps = comps.filter(c => c.id === profile?.company_id)
          setCompanies(clientComps)
          if (clientComps.length > 0) {
            setSelectedComp(clientComps[0])
          }
        } else {
          setCompanies(comps)
        }
      } else {
        const { data: comps } = await supabase.from('companies').select('*')
        const { data: conts } = await supabase.from('contacts').select('*')

        setContacts(conts || [])

        if (isClient) {
          const clientComps = (comps || []).filter(c => c.id === profile?.company_id)
          setCompanies(clientComps)
          if (clientComps.length > 0) {
            setSelectedComp(clientComps[0])
          }
        } else {
          setCompanies(comps || [])
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

  const handleAddCompany = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newCompName) return
    setLoading(true)

    try {
      const retAmt = newCompRetainer ? parseFloat(newCompRetainer) : null

      const compRecord = {
        name: newCompName,
        industry: newCompIndustry || null,
        website: newCompWebsite || null,
        is_client: newCompIsClient,
        monthly_retainer_amount: isNaN(retAmt as number) ? null : retAmt,
        contract_start_date: newCompStartDate || null,
        contract_status: 'active' as ContractStatus
      }

      if (isDemoMode) {
        mockDb.saveCompany(compRecord)
        setShowAddCompanyModal(false)
        resetCompanyForm()
        loadData()
      } else {
        const { error } = await supabase.from('companies').insert(compRecord)
        if (error) throw error
        setShowAddCompanyModal(false)
        resetCompanyForm()
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleUpdateContract = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedComp) return
    setLoading(true)

    try {
      const retAmt = editRetainer ? parseFloat(String(editRetainer)) : null
      const updatedComp = {
        ...selectedComp,
        is_client: editIsClient,
        monthly_retainer_amount: isNaN(retAmt as number) ? null : retAmt,
        contract_start_date: editStartDate || null,
        contract_status: editStatus
      }

      if (isDemoMode) {
        mockDb.saveCompany(updatedComp)
        setShowEditContractModal(false)
        setSelectedComp(updatedComp)
        loadData()
      } else {
        const { error } = await supabase
          .from('companies')
          .update({
            is_client: editIsClient,
            monthly_retainer_amount: isNaN(retAmt as number) ? null : retAmt,
            contract_start_date: editStartDate || null,
            contract_status: editStatus
          })
          .eq('id', selectedComp.id)

        if (error) throw error
        setShowEditContractModal(false)
        setSelectedComp(updatedComp)
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleAddContact = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedComp || !newContactName) return
    setLoading(true)

    try {
      const contactRecord = {
        company_id: selectedComp.id,
        name: newContactName,
        email: newContactEmail || null,
        phone: newContactPhone || null,
        designation: newContactDesignation || null
      }

      if (isDemoMode) {
        mockDb.saveContact(contactRecord)
        setShowAddContactModal(false)
        resetContactForm()
        loadData()
      } else {
        const { error } = await supabase.from('contacts').insert(contactRecord)
        if (error) throw error
        setShowAddContactModal(false)
        resetContactForm()
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const resetCompanyForm = () => {
    setNewCompName('')
    setNewCompIndustry('')
    setNewCompWebsite('')
    setNewCompIsClient(false)
    setNewCompRetainer('')
    setNewCompStartDate('')
  }

  const resetContactForm = () => {
    setNewContactName('')
    setNewContactEmail('')
    setNewContactPhone('')
    setNewContactDesignation('')
  }

  const openEditContract = () => {
    if (!selectedComp) return
    setEditIsClient(selectedComp.is_client)
    setEditRetainer(selectedComp.monthly_retainer_amount || '')
    setEditStartDate(selectedComp.contract_start_date || '')
    setEditStatus(selectedComp.contract_status)
    setShowEditContractModal(true)
  }

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          (c.industry || '').toLowerCase().includes(search.toLowerCase())
    
    if (typeFilter === 'clients') return matchesSearch && c.is_client
    if (typeFilter === 'targets') return matchesSearch && !c.is_client
    return matchesSearch
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Company Profiles</h1>
          <p className="text-slate-400 text-sm mt-1">Manage accounts, retainers, and key contact staff.</p>
        </div>
        {isAcqOrStaff && !isClient && (
          <button
            onClick={() => setShowAddCompanyModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-indigo hover:opacity-90 rounded-xl text-sm font-semibold text-white shadow shadow-indigo-500/10 transition-all"
          >
            <Plus size={18} /> Add Company
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-2 items-center">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {!isClient && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-crm-900/30 border border-slate-800/80 p-4 rounded-2xl">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Search size={14} /></span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter directory..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium glass-input"
                />
              </div>
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                >
                  <option value="all">Show All Profiles</option>
                  <option value="clients">Paying Clients</option>
                  <option value="targets">Sourcing Targets</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {filteredCompanies.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center text-xs text-slate-500 font-medium">
                No company records indexed.
              </div>
            ) : (
              filteredCompanies.map(c => {
                const isSelected = selectedComp?.id === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedComp(c)}
                    className={`
                      glass-card rounded-2xl p-5 border cursor-pointer flex justify-between items-center transition-all
                      ${isSelected 
                        ? 'border-indigo-500/40 bg-indigo-500/[0.03] shadow shadow-indigo-600/5' 
                        : 'border-slate-800/60 hover:border-slate-700/80'}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white
                        ${c.is_client ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-400'}
                      `}>
                        <Building2 size={18} />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-slate-200 block">{c.name}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-500 font-medium capitalize">{c.industry || 'No Industry'}</span>
                          {c.website && (
                            <a 
                              href={`https://${c.website}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-indigo-400/70 hover:underline flex items-center gap-0.5"
                            >
                              Visit <ExternalLink size={8} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {c.is_client ? (
                        <div className="flex flex-col items-end">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">Client</span>
                          <span className="text-xs font-bold text-slate-300 mt-1.5">${(c.monthly_retainer_amount || 0).toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[9px] font-bold uppercase tracking-wider">Target</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {selectedComp ? (
            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <div className="flex justify-between items-start border-b border-slate-850 pb-4 mb-6">
                <div>
                  <h3 className="font-bold text-slate-200 text-base">{selectedComp.name}</h3>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-1 capitalize">
                    Industry: {selectedComp.industry || 'Not Classified'}
                  </span>
                </div>
                {isAccountingOrAdmin && !isClient && (
                  <button
                    onClick={openEditContract}
                    className="p-1.5 bg-crm-800 hover:bg-crm-700 text-indigo-400 rounded-lg transition-all"
                    title="Edit Contract Terms"
                  >
                    <Edit size={14} />
                  </button>
                )}
              </div>

              <div className="p-4 bg-crm-900/50 rounded-xl border border-slate-900/80 mb-6 flex flex-col gap-3">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Retainer Parameters</span>
                {selectedComp.is_client ? (
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium leading-relaxed">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wide block">Rate</span>
                      <span className="text-slate-200">${(selectedComp.monthly_retainer_amount || 0).toLocaleString()}/mo</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wide block">Agreement Status</span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${selectedComp.contract_status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {selectedComp.contract_status}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wide block">Start Date</span>
                      <span className="text-slate-300">{selectedComp.contract_start_date || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 leading-relaxed">This company is marked as a target prospect and does not have an active billing contract.</p>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Key Contacts</span>
                  {!isClient && (
                    <button
                      onClick={() => setShowAddContactModal(true)}
                      className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase"
                    >
                      <Plus size={12} /> Add contact
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {contacts.filter(c => c.company_id === selectedComp.id).length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No contact personnel listed.</p>
                  ) : (
                    contacts
                      .filter(c => c.company_id === selectedComp.id)
                      .map(con => (
                        <div key={con.id} className="p-3.5 bg-crm-900/30 border border-slate-900 rounded-xl flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-semibold text-xs text-slate-200 block">{con.name}</span>
                              <span className="text-[9px] text-indigo-400 mt-0.5 block">{con.designation || 'No title'}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 mt-1 border-t border-slate-900/60 pt-2 text-[10px] text-slate-400 font-medium">
                            {con.email && <span className="flex items-center gap-1.5"><Mail size={10} className="text-slate-500" /> {con.email}</span>}
                            {con.phone && <span className="flex items-center gap-1.5"><Phone size={10} className="text-slate-500" /> {con.phone}</span>}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-10 border border-slate-800 text-center text-xs text-slate-500 font-medium">
              Select a company to view profiles and contact directory.
            </div>
          )}
        </div>
      </div>

      {showAddCompanyModal && (
        <div className="fixed inset-0 bg-crm-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-slate-800 p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Add Company Profile</h3>
            
            <form onSubmit={handleAddCompany} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Company Name</label>
                <input
                  type="text"
                  required
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="Globex Inc"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Industry</label>
                  <input
                    type="text"
                    value={newCompIndustry}
                    onChange={(e) => setNewCompIndustry(e.target.value)}
                    placeholder="Logistics"
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Website</label>
                  <input
                    type="text"
                    value={newCompWebsite}
                    onChange={(e) => setNewCompWebsite(e.target.value)}
                    placeholder="globex.com"
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="is_client"
                  checked={newCompIsClient}
                  onChange={(e) => setNewCompIsClient(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-crm-950 border-slate-800 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_client" className="text-xs text-slate-300 font-semibold select-none">Mark as Paying Client</label>
              </div>

              {newCompIsClient && (
                <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Monthly Retainer ($)</label>
                    <input
                      type="number"
                      value={newCompRetainer}
                      onChange={(e) => setNewCompRetainer(e.target.value)}
                      placeholder="5000"
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newCompStartDate}
                      onChange={(e) => setNewCompStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-crm-800 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-indigo hover:opacity-95 text-white text-xs font-semibold rounded-xl"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditContractModal && selectedComp && (
        <div className="fixed inset-0 bg-crm-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-slate-800 p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">Contract retainer Terms</h3>
            <p className="text-xs text-slate-400 mb-6">Modify details for **{selectedComp.name}**.</p>
            
            <form onSubmit={handleUpdateContract} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="edit_is_client"
                  checked={editIsClient}
                  onChange={(e) => setEditIsClient(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-crm-950 border-slate-800 rounded focus:ring-indigo-500"
                />
                <label htmlFor="edit_is_client" className="text-xs text-slate-300 font-semibold select-none">Mark as Paying Client</label>
              </div>

              {editIsClient && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Monthly Retainer ($)</label>
                      <input
                        type="number"
                        value={editRetainer}
                        onChange={(e) => setEditRetainer(e.target.value)}
                        placeholder="5000"
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Start Date</label>
                      <input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Retainer status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as ContractStatus)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                    >
                      <option value="active" className="bg-crm-950">Active</option>
                      <option value="paused" className="bg-crm-950">Paused</option>
                      <option value="ended" className="bg-crm-950">Ended</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditContractModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-crm-800 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-indigo hover:opacity-95 text-white text-xs font-semibold rounded-xl"
                >
                  Update Terms
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddContactModal && selectedComp && (
        <div className="fixed inset-0 bg-crm-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-slate-800 p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">Add Key Contact</h3>
            <p className="text-xs text-slate-400 mb-6">Create a contact linked to **{selectedComp.name}**.</p>
            
            <form onSubmit={handleAddContact} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Erlich Bachman"
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Designation</label>
                  <input
                    type="text"
                    value={newContactDesignation}
                    onChange={(e) => setNewContactDesignation(e.target.value)}
                    placeholder="Chief PR Officer"
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  placeholder="erlich@hooli.xyz"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Phone</label>
                <input
                  type="text"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="+1-555-0122"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddContactModal(false)
                    resetContactForm()
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-crm-800 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-indigo hover:opacity-95 text-white text-xs font-semibold rounded-xl"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
