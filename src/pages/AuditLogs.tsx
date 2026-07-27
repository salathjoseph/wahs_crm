import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { mockDb } from '../mockData'
import { AuditLog, Profile } from '../types'
import { AlertCircle, RefreshCw, Eye, ArrowRight, Database } from 'lucide-react'

export const AuditLogs = () => {
  const { profile, isDemoMode } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [salesReps, setSalesReps] = useState<Profile[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Selected Log for details
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const isAdmin = profile?.role === 'admin'

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode) {
        setLogs(mockDb.getAuditLogs())
        setSalesReps(mockDb.getProfiles())
      } else {
        const { data: pLogs, error: lErr } = await supabase
          .from('audit_log')
          .select('*')
          .order('changed_at', { ascending: false })
        
        const { data: reps, error: rErr } = await supabase.from('profiles').select('*')

        if (lErr || rErr) throw new Error("Failed to load security audit trail. Verify admin RLS policies.")

        setLogs(pLogs as AuditLog[] || [])
        setSalesReps(reps || [])
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
        <span>Access Denied. System audit logs are restricted to system Administrators only.</span>
      </div>
    )
  }

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm loading-pulse font-medium">Acquiring database mutation logs...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit Trail</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time ledger of mutations on critical CRM records.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-2 bg-crm-800 hover:bg-crm-700 text-slate-300 text-xs rounded-xl font-medium border border-slate-800 transition-all"
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-2 items-center">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-900 shadow">
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Record Table</th>
                    <th>Action</th>
                    <th>Modified By</th>
                    <th>Timestamp</th>
                    <th className="text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-xs text-slate-500 text-center py-10">No mutation logs logged yet.</td>
                    </tr>
                  ) : (
                    logs.map(log => {
                      const rep = salesReps.find(u => u.id === log.changed_by)
                      const isSelected = selectedLog?.id === log.id
                      return (
                        <tr 
                          key={log.id}
                          className={isSelected ? 'bg-indigo-500/[0.02]' : ''}
                        >
                          <td>
                            <span className="font-semibold text-slate-200 block text-xs capitalize flex items-center gap-1.5">
                              <Database size={12} className="text-slate-500" />
                              {log.table_name}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">ID: #{log.record_id.slice(0, 8)}</span>
                          </td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest
                              ${log.action === 'insert' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                              ${log.action === 'update' ? 'bg-amber-500/10 text-amber-400' : ''}
                              ${log.action === 'delete' ? 'bg-rose-500/10 text-rose-400' : ''}
                            `}>
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs text-slate-300 font-medium">{rep ? rep.name : 'System/Anonymous'}</span>
                          </td>
                          <td>
                            <span className="text-xs text-slate-400">{new Date(log.changed_at).toLocaleString()}</span>
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-1 bg-crm-850 hover:bg-crm-750 text-indigo-400 rounded border border-slate-800 transition-all inline-flex items-center justify-center"
                              title="Compare values"
                            >
                              <Eye size={14} />
                            </button>
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

        <div className="flex flex-col gap-6">
          {selectedLog ? (
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col gap-5">
              <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Mutation Details</span>
                <span className="text-[10px] text-slate-500 font-mono">#{selectedLog.id.slice(0, 8)}</span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider">Before Change</span>
                <div className="bg-crm-950 p-4 rounded-xl border border-rose-900/15 overflow-x-auto text-[10px] font-mono text-slate-400 max-h-[200px]">
                  {selectedLog.old_values ? (
                    <pre>{JSON.stringify(selectedLog.old_values, null, 2)}</pre>
                  ) : (
                    <span className="italic text-slate-600">Null record (Insert Operation)</span>
                  )}
                </div>
              </div>

              <div className="flex justify-center text-indigo-500">
                <ArrowRight size={18} className="transform rotate-90" />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">After Change</span>
                <div className="bg-crm-950 p-4 rounded-xl border border-emerald-900/15 overflow-x-auto text-[10px] font-mono text-slate-300 max-h-[200px]">
                  {selectedLog.new_values ? (
                    <pre>{JSON.stringify(selectedLog.new_values, null, 2)}</pre>
                  ) : (
                    <span className="italic text-slate-600">Record Purged (Delete Operation)</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-10 border border-slate-800 text-center text-xs text-slate-500 font-medium">
              Select an audit entry from the ledger to perform state comparisons.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
