import React, { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Sparkles, AlertCircle } from 'lucide-react'

export const Login = () => {
  const { signIn, isDemoMode, enableDemoMode } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Validation
  const [emailError, setEmailError] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')

  const validateForm = (): boolean => {
    let valid = true
    setEmailError('')
    setPasswordError('')

    if (!email) {
      setEmailError('Email address is required')
      valid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email')
      valid = false
    }

    if (!password) {
      setPasswordError('Password is required')
      valid = false
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      valid = false
    }

    return valid
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      await signIn(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (demoEmail: string) => {
    setLoading(true)
    setError(null)
    enableDemoMode(true)

    try {
      await signIn(demoEmail, 'password')
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-crm-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-indigo flex items-center justify-center font-extrabold text-white text-2xl tracking-wider shadow-lg shadow-indigo-500/25">W</div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-none">WAHS CRM</h1>
            <p className="text-xs text-indigo-400 font-semibold tracking-widest uppercase mt-1">Sales Outsourcing Portal</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full glass-card rounded-2xl border border-slate-800/80 p-8 shadow-2xl relative">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-3 items-start">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium glass-input ${emailError ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                  placeholder="name@company.com"
                />
              </div>
              {emailError && <p className="text-xs text-rose-400 mt-1.5">{emailError}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium glass-input ${passwordError ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                  placeholder="••••••••"
                />
              </div>
              {passwordError && <p className="text-xs text-rose-400 mt-1.5">{passwordError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-indigo hover:opacity-95 text-white text-sm font-semibold rounded-xl transition-all duration-200 mt-2 shadow-lg shadow-indigo-600/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Demo Mode Panel */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 tracking-wider uppercase mb-4">
              <Sparkles size={14} className="animate-pulse" />
              <span>Developer Quick Access (Demo Mode)</span>
            </div>
            
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Skip Supabase setup and preview the CRM roles instantly using mock database views.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickLogin('admin@wahs.co')}
                className="px-3 py-2 bg-crm-800/50 hover:bg-crm-700/60 rounded-xl text-xs font-medium text-indigo-300 text-left border border-slate-800 hover:border-indigo-500/20 transition-all"
              >
                <div className="font-semibold text-slate-200">Admin View</div>
                <div className="text-[10px] text-slate-500">Full operations access</div>
              </button>
              <button
                onClick={() => handleQuickLogin('acq@wahs.co')}
                className="px-3 py-2 bg-crm-800/50 hover:bg-crm-700/60 rounded-xl text-xs font-medium text-purple-300 text-left border border-slate-800 hover:border-purple-500/20 transition-all"
              >
                <div className="font-semibold text-slate-200">Acquisition</div>
                <div className="text-[10px] text-slate-500">Lead generation focus</div>
              </button>
              <button
                onClick={() => handleQuickLogin('sales@wahs.co')}
                className="px-3 py-2 bg-crm-800/50 hover:bg-crm-700/60 rounded-xl text-xs font-medium text-emerald-300 text-left border border-slate-800 hover:border-emerald-500/20 transition-all"
              >
                <div className="font-semibold text-slate-200">Sales rep</div>
                <div className="text-[10px] text-slate-500">My deals & commissions</div>
              </button>
              <button
                onClick={() => handleQuickLogin('accounting@wahs.co')}
                className="px-3 py-2 bg-crm-800/50 hover:bg-crm-700/60 rounded-xl text-xs font-medium text-amber-300 text-left border border-slate-800 hover:border-amber-500/20 transition-all"
              >
                <div className="font-semibold text-slate-200">Accounting</div>
                <div className="text-[10px] text-slate-500">Invoices & cash flow</div>
              </button>
            </div>
            
            <button
              onClick={() => handleQuickLogin('richard@hooli.xyz')}
              className="w-full mt-2 px-3 py-2 bg-crm-800/30 hover:bg-crm-700/40 rounded-xl text-xs font-medium text-cyan-300 text-center border border-slate-800/80 hover:border-cyan-500/20 transition-all block"
            >
              <div className="font-semibold text-slate-200">Log in as Client (Richard Hendricks @ Hooli)</div>
              <div className="text-[10px] text-slate-500">Secure client transparency dashboard for Acme Corp</div>
            </button>

            {isDemoMode && (
              <button
                onClick={() => {
                  enableDemoMode(false);
                  setError("Switched back to live Supabase Auth. Enter credentials below.");
                }}
                className="w-full mt-4 text-[10px] text-center text-slate-500 hover:text-slate-400 underline transition-all font-semibold uppercase tracking-wider block"
              >
                Switch back to Live Supabase Connection
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          WAHS CRM &copy; 2026. All rights reserved.
        </p>
      </div>
    </div>
  )
}
