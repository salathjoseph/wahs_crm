import React, { useState, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserRole } from '../types'
import {
  LayoutDashboard,
  UserCheck,
  TrendingUp,
  Percent,
  Building2,
  Receipt,
  BarChart3,
  Users2,
  History,
  LogOut,
  Menu,
  X,
  Sparkles,
  User,
  ShieldCheck
} from 'lucide-react'

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
}

export const Layout = ({ children }: { children: ReactNode }) => {
  const { profile, signOut, isDemoMode, switchDemoRole } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

  const menuItems: MenuItem[] = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'acquisition', 'sales', 'accounting', 'client'] },
    { path: '/leads', label: 'Leads', icon: UserCheck, roles: ['admin', 'acquisition', 'sales', 'accounting'] },
    { path: '/opportunities', label: 'Opportunities', icon: TrendingUp, roles: ['admin', 'acquisition', 'sales', 'accounting'] },
    { path: '/commissions', label: 'Commissions', icon: Percent, roles: ['admin', 'sales', 'accounting'] },
    { path: '/accounts', label: 'Companies', icon: Building2, roles: ['admin', 'acquisition', 'sales', 'accounting', 'client'] },
    { path: '/billing', label: 'Billing', icon: Receipt, roles: ['admin', 'accounting', 'sales', 'acquisition'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'accounting'] },
    { path: '/users', label: 'Users', icon: Users2, roles: ['admin'] },
    { path: '/audit-logs', label: 'Audit Logs', icon: History, roles: ['admin'] },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const userRole: UserRole = profile?.role || 'client'
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole))

  return (
    <div className="min-h-screen bg-crm-950 flex flex-col md:flex-row text-slate-200">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-crm-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-indigo flex items-center justify-center font-bold text-white tracking-wider">W</div>
          <span className="font-semibold text-lg text-white tracking-tight">WAHS CRM</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (Desktop / Mobile Overlay) */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-crm-900/90 border-r border-slate-800/80 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:bg-crm-900/40
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-indigo flex items-center justify-center font-extrabold text-white text-lg tracking-wider shadow-lg shadow-indigo-500/20">W</div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight block leading-none">WAHS CRM</span>
              <span className="text-xs text-indigo-400 font-medium tracking-widest uppercase">Outsourcing</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-2 px-3">Navigation</span>
            {filteredMenuItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500 shadow-md shadow-indigo-600/5' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-400' : ''} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer / User Profile */}
        <div className="flex flex-col gap-4 mt-8 border-t border-slate-800/60 pt-6">
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-full bg-crm-800 border border-slate-700 flex items-center justify-center text-indigo-300 font-semibold uppercase">
              {profile?.name ? profile.name.slice(0, 2) : <User size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm text-slate-200 block truncate">{profile?.name || 'User'}</span>
              <span className="text-xs text-indigo-400 capitalize flex items-center gap-1 font-medium">
                <ShieldCheck size={12} />
                {profile?.role || 'Client'}
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Demo Mode Role Switcher header */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-indigo-950 via-crm-900 to-purple-950 px-6 py-2 border-b border-indigo-900/40 flex flex-wrap items-center justify-between gap-4 z-20">
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
              <Sparkles size={14} className="text-indigo-400 animate-spin [animation-duration:8s]" />
              <span>Previewing CRM in offline **Demo Mode**</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-xs font-semibold uppercase mr-1">Switch View:</span>
              {(['admin', 'acquisition', 'sales', 'accounting', 'client'] as UserRole[]).map(r => (
                <button
                  key={r}
                  onClick={() => {
                    switchDemoRole(r)
                    navigate('/')
                  }}
                  className={`
                    px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all duration-150
                    ${profile?.role === r 
                      ? 'bg-indigo-600 text-white shadow shadow-indigo-600/50 scale-105' 
                      : 'bg-crm-800 text-slate-400 hover:text-slate-200 hover:bg-crm-700'}
                  `}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Core Content Container */}
        <main className="p-6 md:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
