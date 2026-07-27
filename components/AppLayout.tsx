'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../src/context/AuthContext';
import { UserRole } from '../src/types';
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
  ShieldCheck,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
}

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile, signOut, isDemoMode, switchDemoRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchFocused, setSearchFocused] = useState<boolean>(false);

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
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const userRole: UserRole = profile?.role || 'client';
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  // Breadcrumbs generation
  const getBreadcrumbs = () => {
    const currentPath = pathname || '/';
    if (currentPath === '/') return ['Dashboard'];
    const parts = currentPath.split('/').filter(Boolean);
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' '));
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col md:flex-row text-[#101010] font-sans antialiased selection:bg-[#B89C63]/10 selection:text-[#B89C63]">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#E8E5DF] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#101010] flex items-center justify-center font-bold text-white text-sm tracking-wider">
            W
          </div>
          <span className="font-semibold text-base text-[#101010] tracking-tight">WAHS Technologies</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#6E6E73] hover:text-[#101010] transition-colors"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar (Desktop / Mobile Overlay) */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 bg-white border-r border-[#E8E5DF] flex flex-col justify-between transition-all duration-300 ease-in-out md:static
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
        ${mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col gap-6 pt-6">
          {/* Logo / Workspace Switcher */}
          <div className={`flex items-center justify-between px-5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#101010] flex items-center justify-center font-bold text-white text-base tracking-widest shrink-0">
                W
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#101010] tracking-tight block leading-tight">WAHS CRM</span>
                  <span className="text-[10px] text-[#6E6E73] font-semibold tracking-widest uppercase">Technologies</span>
                </div>
              )}
            </div>
            
            {/* Collapse Toggle Button (Desktop Only) */}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-md hover:bg-[#F3EFE8] text-[#6E6E73] hover:text-[#101010] transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-3">
            {!sidebarCollapsed && (
              <span className="text-[10px] text-[#6E6E73] font-semibold tracking-widest uppercase mb-2 px-3">
                Workspace
              </span>
            )}
            {filteredMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive 
                      ? 'bg-[#F3EFE8] text-[#101010] font-semibold border-l-2 border-[#B89C63]' 
                      : 'text-[#6E6E73] hover:text-[#101010] hover:bg-[#FDFDFD]'}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-[#B89C63]' : 'text-[#6E6E73]'} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / User Profile */}
        <div className="flex flex-col gap-3 mt-auto p-4 border-t border-[#E8E5DF]">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : 'px-1'}`}>
            <div className="w-9 h-9 rounded-full bg-[#F3EFE8] border border-[#E8E5DF] flex items-center justify-center text-[#B89C63] font-semibold uppercase text-xs shrink-0">
              {profile?.name ? profile.name.slice(0, 2) : <User size={16} />}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-xs text-[#101010] block truncate leading-tight">{profile?.name || 'User'}</span>
                <span className="text-[10px] text-[#6E6E73] capitalize flex items-center gap-0.5 font-medium mt-0.5">
                  <ShieldCheck size={10} className="text-[#B89C63]" />
                  {profile?.role || 'Client'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-[#D14343] hover:bg-[#D14343]/5 transition-colors
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Demo Mode Role Switcher Bar */}
        {isDemoMode && (
          <div className="bg-[#101010] text-[#FFFFFF] px-6 py-2 flex flex-wrap items-center justify-between gap-4 z-20 text-xs">
            <div className="flex items-center gap-1.5 text-[#B89C63] font-medium">
              <Sparkles size={12} className="animate-pulse" />
              <span className="text-[#E8E5DF]">Previewing CRM in **Demo Mode**</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#6E6E73] text-[10px] font-bold uppercase mr-1.5">View As Role:</span>
              {(['admin', 'acquisition', 'sales', 'accounting', 'client'] as UserRole[]).map(r => (
                <button
                  key={r}
                  onClick={() => {
                    switchDemoRole(r);
                    router.push('/');
                  }}
                  className={`
                    px-2.5 py-0.5 rounded text-[10px] font-bold capitalize transition-all
                    ${profile?.role === r 
                      ? 'bg-[#B89C63] text-white' 
                      : 'bg-[#6E6E73]/20 text-[#E8E5DF] hover:text-white hover:bg-[#6E6E73]/45'}
                  `}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        <header className="bg-white border-b border-[#E8E5DF] h-16 flex items-center justify-between px-6 md:px-8 z-10 shrink-0">
          {/* Breadcrumbs / Page Title */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6E6E73]">
            <span>WAHS CRM</span>
            {getBreadcrumbs().map((crumb, idx) => (
              <React.Fragment key={crumb}>
                <span className="text-[#E8E5DF]">/</span>
                <span className={idx === getBreadcrumbs().length - 1 ? 'text-[#101010] font-bold' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Search, Notifications & Actions */}
          <div className="flex items-center gap-4">
            {/* Global Search Bar */}
            <div className="relative hidden md:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className={searchFocused ? 'text-[#101010]' : 'text-[#6E6E73]'} />
              </span>
              <input
                type="text"
                placeholder="Search leads, companies..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="pl-9 pr-4 py-1.5 w-64 bg-[#F7F5F2] border border-[#E8E5DF] rounded-md text-xs placeholder-[#6E6E73] focus:outline-none focus:bg-white focus:border-[#B89C63] transition-all"
              />
            </div>

            {/* Notification Bell */}
            <button className="p-2 text-[#6E6E73] hover:text-[#101010] hover:bg-[#F7F5F2] rounded-full transition-all relative">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#B89C63] rounded-full"></span>
            </button>

            {/* Accent Separator */}
            <div className="h-4 w-px bg-[#EFECE7]"></div>

            {/* Quick Access Profile icon */}
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-7 h-7 rounded-full bg-[#101010] flex items-center justify-center text-white text-[10px] uppercase font-bold">
                {profile?.name ? profile.name.slice(0, 1) : 'U'}
              </div>
              <span className="text-xs font-semibold text-[#6E6E73] group-hover:text-[#101010] transition-colors hidden sm:inline">
                {profile?.name ? profile.name.split(' ')[0] : 'Workspace'}
              </span>
            </div>
          </div>
        </header>

        {/* Core Content Container */}
        <main className="p-6 md:p-8 flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
};
