import React, { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { mockDb } from '../mockData'
import { Profile, Company, UserRole } from '../types'
import { Plus, Edit, AlertCircle, RefreshCw, Mail } from 'lucide-react'

export const AdminUserMgmt = () => {
  const { profile, isDemoMode } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Forms State
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  // Add User Fields
  const [newName, setNewName] = useState<string>('')
  const [newEmail, setNewEmail] = useState<string>('')
  const [newRole, setNewRole] = useState<UserRole>('sales')
  const [newCompanyId, setNewCompanyId] = useState<string>('')

  // Edit User Fields
  const [editName, setEditName] = useState<string>('')
  const [editRole, setEditRole] = useState<UserRole>('sales')
  const [editCompanyId, setEditCompanyId] = useState<string>('')

  const isAdmin = profile?.role === 'admin'

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode) {
        setUsers(mockDb.getProfiles())
        setCompanies(mockDb.getCompanies())
      } else {
        const { data: profiles, error: pErr } = await supabase.from('profiles').select('*')
        const { data: comps, error: cErr } = await supabase.from('companies').select('*')

        if (pErr || cErr) throw new Error("Failed to load user directories. RLS permission error.")

        setUsers(profiles as Profile[] || [])
        setCompanies(comps || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isDemoMode, profile])

  if (!isAdmin) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-3 items-center">
        <AlertCircle size={20} />
        <span>Access Denied. User management panels are restricted to system Administrators only.</span>
      </div>
    )
  }

  const handleAddUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newName || !newEmail) return
    setLoading(true)

    try {
      const newUser = {
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        name: newName,
        email: newEmail,
        role: newRole,
        company_id: newRole === 'client' && newCompanyId ? newCompanyId : null,
        created_at: new Date().toISOString()
      }

      if (isDemoMode) {
        mockDb.saveProfile(newUser)
        setShowAddModal(false)
        resetAddForm()
        loadData()
      } else {
        const { error } = await supabase.from('profiles').insert({
          id: newUser.id,
          name: newName,
          email: newEmail,
          role: newRole,
          company_id: newRole === 'client' && newCompanyId ? newCompanyId : null
        })
        if (error) throw error
        setShowAddModal(false)
        resetAddForm()
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleUpdateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser) return
    setLoading(true)

    try {
      const updatedUser = {
        ...selectedUser,
        name: editName,
        role: editRole,
        company_id: editRole === 'client' && editCompanyId ? editCompanyId : null
      }

      if (isDemoMode) {
        mockDb.saveProfile(updatedUser)
        setShowEditModal(false)
        setSelectedUser(null)
        loadData()
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: editName,
            role: editRole,
            company_id: editRole === 'client' && editCompanyId ? editCompanyId : null
          })
          .eq('id', selectedUser.id)

        if (error) throw error
        setShowEditModal(false)
        setSelectedUser(null)
        loadData()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const resetAddForm = () => {
    setNewName('')
    setNewEmail('')
    setNewRole('sales')
    setNewCompanyId('')
  }

  const openEditModal = (user: Profile) => {
    setSelectedUser(user)
    setEditName(user.name)
    setEditRole(user.role)
    setEditCompanyId(user.company_id || '')
    setShowEditModal(true)
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm loading-pulse font-medium">Querying active team registries...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Staff & Permissions</h1>
          <p className="text-slate-400 text-sm mt-1">Manage staff roles, client links, and administrative profiles.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-indigo hover:opacity-90 rounded-xl text-sm font-semibold text-white shadow shadow-indigo-500/10 transition-all"
          >
            <Plus size={18} /> Invite User
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-2 items-center">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-900 shadow">
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Profile Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Company Link (Clients only)</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const comp = companies.find(c => c.id === u.company_id)
                return (
                  <tr key={u.id}>
                    <td>
                      <span className="font-semibold text-slate-200 block text-xs">{u.name}</span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5"><Mail size={12} className="text-slate-500" /> {u.email}</span>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider
                        ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                        ${u.role === 'acquisition' ? 'bg-purple-500/10 text-purple-400' : ''}
                        ${u.role === 'sales' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                        ${u.role === 'accounting' ? 'bg-amber-500/10 text-amber-400' : ''}
                        ${u.role === 'client' ? 'bg-cyan-500/10 text-cyan-400 font-bold' : ''}
                      `}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-400">
                        {u.role === 'client' ? (comp?.name || 'Unlinked Company') : 'Internal Department'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1 bg-crm-850 hover:bg-crm-750 text-indigo-400 hover:text-indigo-300 rounded border border-slate-800 transition-all inline-flex items-center justify-center"
                        title="Edit Roles/Properties"
                      >
                        <Edit size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-crm-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-slate-800 p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Invite Sourced Staff</h3>
            
            <form onSubmit={handleAddUser} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Display Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Gilfoyle"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="gilfoyle@wahs.co"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Operational Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                  >
                    <option value="admin" className="bg-crm-950">Admin</option>
                    <option value="acquisition" className="bg-crm-950">Acquisition</option>
                    <option value="sales" className="bg-crm-950">Sales</option>
                    <option value="accounting" className="bg-crm-950">Accounting</option>
                    <option value="client" className="bg-crm-950">Client</option>
                  </select>
                </div>

                {newRole === 'client' && (
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Link Company</label>
                    <select
                      required
                      value={newCompanyId}
                      onChange={(e) => setNewCompanyId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                    >
                      <option value="" disabled className="bg-crm-950">Select Client</option>
                      {companies.filter(c => c.is_client).map(c => (
                        <option key={c.id} value={c.id} className="bg-crm-950">{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-crm-800 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-indigo hover:opacity-95 text-white text-xs font-semibold rounded-xl"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-crm-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-slate-800 p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">Modify User Role</h3>
            <p className="text-xs text-slate-400 mb-6">Updating details for **{selectedUser.email}**.</p>
            
            <form onSubmit={handleUpdateUser} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Operational Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                  >
                    <option value="admin" className="bg-crm-950">Admin</option>
                    <option value="acquisition" className="bg-crm-950">Acquisition</option>
                    <option value="sales" className="bg-crm-950">Sales</option>
                    <option value="accounting" className="bg-crm-950">Accounting</option>
                    <option value="client" className="bg-crm-950">Client</option>
                  </select>
                </div>

                {editRole === 'client' && (
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Link Company</label>
                    <select
                      required
                      value={editCompanyId}
                      onChange={(e) => setEditCompanyId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glass-input"
                    >
                      <option value="" disabled className="bg-crm-950">Select Client</option>
                      {companies.filter(c => c.is_client).map(c => (
                        <option key={c.id} value={c.id} className="bg-crm-950">{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-crm-800 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-indigo hover:opacity-95 text-white text-xs font-semibold rounded-xl"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
