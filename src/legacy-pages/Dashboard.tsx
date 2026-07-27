'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { mockDb } from '../mockData';
import { Company, Lead, Opportunity, Sale, Commission, Invoice, Expense, Activity, UserRole, AuditLog } from '../types';
import { MetricCard } from '../../components/MetricCard';
import { ChartCard } from '../../components/ChartCard';
import { DashboardCard } from '../../components/DashboardCard';
import { ActivityTimeline } from '../../components/ActivityTimeline';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Layers,
  Calendar,
  AlertTriangle,
  Users,
  Briefcase,
  Plus,
  ArrowRight,
  ClipboardList,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  UserCheck,
  Search,
  Check,
  Percent
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export const Dashboard = () => {
  const { profile, isDemoMode } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Core Data State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Quick form state
  const [quickExpenseCat, setQuickExpenseCat] = useState<string>('');
  const [quickExpenseAmt, setQuickExpenseAmt] = useState<string>('');
  const [quickExpenseMsg, setQuickExpenseMsg] = useState<string>('');

  const userRole: UserRole = profile?.role || 'client';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isDemoMode) {
          const comps = mockDb.getCompanies();
          const lds = mockDb.getLeads();
          const opps = mockDb.getOpportunities();
          const sls = mockDb.getSales();
          const comms = mockDb.getCommissions();
          const invs = mockDb.getInvoices();
          const exps = mockDb.getExpenses();
          const acts = mockDb.getActivities();
          const logs = mockDb.getAuditLogs();

          setAuditLogs(logs);

          if (userRole === 'client') {
            const clientCompanyId = profile?.company_id;
            setCompanies(comps.filter(c => c.id === clientCompanyId));
            const filteredLeads = lds.filter(l => l.company_id === clientCompanyId);
            setLeads(filteredLeads);
            const leadIds = filteredLeads.map(l => l.id);
            setOpportunities(opps.filter(o => leadIds.includes(o.lead_id)));
            setActivities(acts.filter(a => leadIds.includes(a.lead_id)));
            setInvoices(invs.filter(i => i.company_id === clientCompanyId));
          } else if (userRole === 'sales') {
            const myLeads = lds.filter(l => l.assigned_to === profile?.id);
            setLeads(myLeads);
            const myLeadIds = myLeads.map(l => l.id);
            const myOpps = opps.filter(o => myLeadIds.includes(o.lead_id));
            setOpportunities(myOpps);
            const myOppIds = myOpps.map(o => o.id);
            setSales(sls.filter(s => myOppIds.includes(s.opportunity_id)));
            setCommissions(comms.filter(c => c.earned_by === profile?.id));
            setActivities(acts.filter(a => myLeadIds.includes(a.lead_id)));
            setCompanies(comps);
            setInvoices(invs);
          } else {
            setCompanies(comps);
            setLeads(lds);
            setOpportunities(opps);
            setSales(sls);
            setCommissions(comms);
            setInvoices(invs);
            setExpenses(exps);
            setActivities(acts);
          }
        } else {
          const { data: comps, error: e1 } = await supabase.from('companies').select('*');
          const { data: lds, error: e2 } = await supabase.from('leads').select('*');
          const { data: opps, error: e3 } = await supabase.from('opportunities').select('*');
          const { data: sls, error: e4 } = await supabase.from('sales').select('*');
          const { data: comms, error: e5 } = await supabase.from('commissions').select('*');
          const { data: invs, error: e6 } = await supabase.from('invoices').select('*');
          const { data: exps, error: e7 } = await supabase.from('expenses').select('*');
          const { data: acts, error: e8 } = await supabase.from('activities').select('*');
          const { data: logs, error: e9 } = await supabase.from('audit_log').select('*');

          if (e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8) {
            throw new Error("Failed to retrieve dashboard records. Verify your RLS settings.");
          }

          setCompanies(comps || []);
          setLeads(lds || []);
          setOpportunities(opps || []);
          setSales(sls || []);
          setCommissions(comms || []);
          setInvoices(invs || []);
          setExpenses(exps || []);
          setActivities(acts || []);
          setAuditLogs(logs || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isDemoMode, userRole, profile]);

  const handleAddQuickExpense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!quickExpenseCat || !quickExpenseAmt || !profile) return;
    const amt = parseFloat(quickExpenseAmt);
    if (isNaN(amt)) return;

    const newExp = {
      category: quickExpenseCat,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      created_by: profile.id
    };

    if (isDemoMode) {
      mockDb.saveExpense(newExp);
      setExpenses(mockDb.getExpenses());
      setQuickExpenseMsg('Expense logged locally!');
      setQuickExpenseAmt('');
      setQuickExpenseCat('');
      setTimeout(() => setQuickExpenseMsg(''), 3000);
    } else {
      const { error } = await supabase.from('expenses').insert(newExp);
      if (error) {
        setError(error.message);
      } else {
        setQuickExpenseMsg('Expense submitted!');
        setQuickExpenseAmt('');
        setQuickExpenseCat('');
        const { data } = await supabase.from('expenses').select('*');
        setExpenses(data || []);
        setTimeout(() => setQuickExpenseMsg(''), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 bg-[#F8F7F4] min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-[#B99A5E]/20 border-t-[#B99A5E] rounded-full animate-spin"></div>
        <p className="mt-4 text-[#6B7280] text-xs font-semibold uppercase tracking-wider skeleton-pulse">
          Analyzing CRM Statistics
        </p>
      </div>
    );
  }

  // Calculations
  const totalMonthlyRetainer = companies
    .filter(c => c.is_client && c.contract_status === 'active')
    .reduce((sum, c) => sum + (c.monthly_retainer_amount || 0), 0);

  const activePipelineValue = opportunities
    .filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost')
    .reduce((sum, o) => sum + (o.value || 0), 0);

  const totalRevenueSales = sales
    .filter(s => s.status === 'confirmed' || s.status === 'invoiced')
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  const outstandingInvoices = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const myPendingCommissions = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + (c.commission_amount || 0), 0);

  const myPaidCommissions = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + (c.commission_amount || 0), 0);

  const newLeadsCount = leads.filter(l => l.status === 'new').length;
  const qualifiedLeadsCount = leads.filter(l => l.status === 'qualified').length;
  const handoffLeadsCount = leads.filter(l => l.status === 'handed_off').length;

  // Today's meetings (Activities of type meeting)
  const meetingsCount = activities.filter(a => a.type === 'meeting').length;
  // Pending follow-ups (Leads that are new or qualified)
  const followupsCount = leads.filter(l => l.status === 'new' || l.status === 'qualified').length;
  // Open tasks (opportunities in discovery/demo/negotiation)
  const openTasksCount = opportunities.filter(o => ['discovery', 'demo', 'proposal', 'negotiation'].includes(o.stage)).length;

  // Chart data calculations
  const getMonthlyRevenueTrend = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap: Record<string, number> = {};
    
    // Baselines to make the line chart display beautifully
    months.forEach((m, idx) => {
      if (idx <= 6) { 
        trendMap[m] = 4000 + idx * 4800;
      }
    });

    // Add paid invoices
    invoices.forEach(inv => {
      if (inv.status === 'paid' && inv.date) {
        const monthIdx = new Date(inv.date).getMonth();
        const m = months[monthIdx];
        trendMap[m] = (trendMap[m] || 0) + Number(inv.amount || 0);
      }
    });

    return Object.entries(trendMap)
      .slice(0, 8) // Limit to Jan - Aug
      .map(([name, revenue]) => ({ name, revenue }));
  };

  const revenueTrendData = getMonthlyRevenueTrend();

  const funnelData = [
    { name: 'New Target', value: newLeadsCount || 1 },
    { name: 'Qualified', value: qualifiedLeadsCount || 1 },
    { name: 'Handed Off', value: handoffLeadsCount || 1 },
    { name: 'In Pipeline', value: openTasksCount || 1 },
    { name: 'Closed Won', value: opportunities.filter(o => o.stage === 'closed_won').length || 1 }
  ];

  // Lead sources calculations for Progress Bars / Mini Charts
  const leadSources = [
    { source: 'LinkedIn Outbound', count: leads.filter(l => l.source === 'LinkedIn Outbound').length },
    { source: 'Cold Email Campaign', count: leads.filter(l => l.source === 'Cold Email Campaign').length },
    { source: 'Website Demo Request', count: leads.filter(l => l.source === 'Website Demo Request').length },
    { source: 'Partner Referral', count: leads.filter(l => l.source === 'Partner Referral').length }
  ].sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto">
      {/* Title Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ECE8E2] pb-6">
        <div>
          <h1 className="text-[32px] font-bold text-[#111111] tracking-tight">
            Welcome, {profile?.name || 'User'}
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Access the central control dashboard for operations and sourcing.
          </p>
        </div>
        <div className="px-4 py-2 rounded-lg bg-white border border-[#ECE8E2] flex items-center gap-2 text-xs font-semibold shadow-soft">
          <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse"></span>
          <span className="text-[#6B7280]">
            Active Role: <span className="text-[#111111] font-bold capitalize">{userRole}</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[#DC2626]/5 border border-[#DC2626]/15 text-[#DC2626] text-xs flex gap-2 items-center">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================
          1. ADMIN DASHBOARD VIEW
          ======================================================== */}
      {userRole === 'admin' && (
        <>
          {/* Top Row: 5 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <MetricCard
              title="Monthly Revenue"
              value={`₹${(totalMonthlyRetainer / 1000).toFixed(1)}k`}
              trend={{ value: 12, isPositive: true }}
              description="Active monthly retainers"
              icon={DollarSign}
            />
            <MetricCard
              title="Active Pipeline"
              value={`₹${(activePipelineValue / 1000).toFixed(1)}k`}
              trend={{ value: 8, isPositive: true }}
              description="Unclosed active negotiations"
              icon={Layers}
            />
            <MetricCard
              title="Today's Meetings"
              value={meetingsCount}
              description="Outreach meetings scheduled"
              icon={Calendar}
            />
            <MetricCard
              title="Pending Follow-ups"
              value={followupsCount}
              trend={{ value: 15, isPositive: false }}
              description="Leads awaiting contact"
              icon={UserCheck}
            />
            <MetricCard
              title="Open Tasks"
              value={openTasksCount}
              description="Pipeline items in progression"
              icon={ClipboardList}
            />
          </div>

          {/* Second Row: Revenue Trend & Sales Funnel Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartCard
                title="Revenue Progression (Retainers + Sales)"
                subtitle="Aggregated client retainers and confirmed contract values by month"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B99A5E" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#B99A5E" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      stroke="#6B7280" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#6B7280" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => `₹${v / 1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        borderColor: '#ECE8E2', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(17, 17, 17, 0.04)',
                        fontSize: '11px',
                        color: '#111111'
                      }}
                      formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#B99A5E" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div>
              <ChartCard
                title="Sourcing Conversion Funnel"
                subtitle="Stage translation efficiency for all sourced startups"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#6B7280" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        borderColor: '#ECE8E2', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(17, 17, 17, 0.04)',
                        fontSize: '11px'
                      }}
                      formatter={(v: any) => [v, 'Count']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 4 ? '#B99A5E' : '#ECE8E2'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>

          {/* Third Row: Recent Leads, Upcoming Meetings, Activities & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <DashboardCard title="Recent Sourced Leads" className="lg:col-span-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#ECE8E2] text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                      <th className="pb-3 pr-2">Company</th>
                      <th className="pb-3 px-2">Source</th>
                      <th className="pb-3 pl-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 5).map(lead => {
                      const comp = companies.find(c => c.id === lead.company_id);
                      return (
                        <tr key={lead.id} className="border-b border-[#F5F3EF] hover:bg-[#F5F3EF]/30 transition-colors">
                          <td className="py-3 pr-2 text-xs font-semibold text-[#111111]">
                            {comp?.name || 'Unknown Company'}
                          </td>
                          <td className="py-3 px-2 text-xs text-[#6B7280] font-medium">
                            {lead.source}
                          </td>
                          <td className="py-3 pl-2 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              lead.status === 'handed_off' 
                                ? 'bg-[#15803D]/10 text-[#15803D]' 
                                : lead.status === 'qualified' 
                                ? 'bg-[#B99A5E]/10 text-[#B99A5E]' 
                                : 'bg-[#6B7280]/10 text-[#6B7280]'
                            }`}>
                              {lead.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </DashboardCard>

            <DashboardCard title="Operations Timeline">
              <div className="max-h-[300px] overflow-y-auto pr-1">
                <ActivityTimeline activities={activities.slice(0, 4)} />
              </div>
            </DashboardCard>

            <DashboardCard title="System Activity Notifications">
              <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                {auditLogs.slice(0, 4).map(log => (
                  <div key={log.id} className="flex gap-3 text-xs border-b border-[#F5F3EF] pb-3 last:border-b-0">
                    <div className="w-5 h-5 rounded-md bg-[#F5F3EF] flex items-center justify-center shrink-0 text-[#B99A5E] mt-0.5">
                      <Sparkles size={10} />
                    </div>
                    <div>
                      <span className="font-bold text-[#111111] capitalize block">
                        Record {log.action}
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-semibold tracking-wide uppercase mt-0.5 block">
                        Table: {log.table_name}
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-bold mt-1 block">
                        {new Date(log.changed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>

          {/* Fourth Row: Top Sales, Top Clients, Lead Sources, Performance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard title="Outbound Sourcing Channels">
              <div className="flex flex-col gap-3.5 mt-2">
                {leadSources.map(src => {
                  const maxCount = Math.max(...leadSources.map(l => l.count), 1);
                  const percent = (src.count / maxCount) * 100;
                  return (
                    <div key={src.source} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#6B7280] truncate max-w-[170px]">{src.source}</span>
                        <span className="text-[#111111]">{src.count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F5F3EF] rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${percent}%` }} 
                          className="h-full bg-[#B99A5E] rounded-full"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>

            <DashboardCard title="Active Client Accounts">
              <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                {companies.filter(c => c.is_client).slice(0, 4).map(client => (
                  <div key={client.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F3EF]/30 transition-colors">
                    <div>
                      <span className="font-semibold text-xs text-[#111111] block">
                        {client.name}
                      </span>
                      <span className="text-[10px] text-[#6B7280] block mt-0.5 capitalize">
                        {client.industry || 'Tech Startup'}
                      </span>
                    </div>
                    <span className="font-bold text-xs text-[#B99A5E]">
                      ₹{(client.monthly_retainer_amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard title="Active Agency Sales Ledgers">
              <div className="flex flex-col gap-3">
                {commissions.slice(0, 4).map(comm => (
                  <div key={comm.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F3EF]/30 transition-colors">
                    <div>
                      <span className="font-semibold text-xs text-[#111111] block">
                        Commission Record
                      </span>
                      <span className="text-[10px] text-[#6B7280] block mt-0.5">
                        Earned: {comm.commission_percent}% rate
                      </span>
                    </div>
                    <span className="font-bold text-xs text-[#15803D]">
                      +₹{(comm.commission_amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard title="Strategic Performance Stats">
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex justify-between items-center py-1 border-b border-[#F5F3EF]">
                  <span className="text-xs text-[#6B7280] font-medium">Outreach Sourcing Rate</span>
                  <span className="font-bold text-xs text-[#111111]">82.4%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#F5F3EF]">
                  <span className="text-xs text-[#6B7280] font-medium">Startups Handed Off</span>
                  <span className="font-bold text-xs text-[#111111]">{handoffLeadsCount} Deals</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#F5F3EF]">
                  <span className="text-xs text-[#6B7280] font-medium">Conversion Rate</span>
                  <span className="font-bold text-xs text-[#15803D]">14.8%</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-[#6B7280] font-medium">Retainer Cashflow Net</span>
                  <span className="font-bold text-xs text-[#B99A5E]">
                    ₹{(totalMonthlyRetainer - totalExpenses).toLocaleString()}
                  </span>
                </div>
              </div>
            </DashboardCard>
          </div>
        </>
      )}

      {/* ========================================================
          2. ACQUISITION VIEW
          ======================================================== */}
      {userRole === 'acquisition' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-6">
              <MetricCard
                title="New Sourced Targets"
                value={newLeadsCount}
                description="Cold targets identified"
                icon={Plus}
              />
              <MetricCard
                title="Qualified Startups"
                value={qualifiedLeadsCount}
                description="Verified business interest"
                icon={UserCheck}
              />
              <MetricCard
                title="Handed Over to Sales"
                value={handoffLeadsCount}
                description="Warm prospects pushed"
                icon={TrendingUp}
              />
            </div>

            <DashboardCard title="My Outbound Sourcing Ratio">
              <div className="flex flex-col gap-5 mt-2">
                <div>
                  <div className="flex justify-between text-xs text-[#6B7280] mb-2 font-medium">
                    <span>Contact Sourcing Rate</span>
                    <span className="font-bold text-[#111111]">75% Success Rate</span>
                  </div>
                  <div className="w-full h-2 bg-[#F5F3EF] rounded-full overflow-hidden">
                    <div className="h-full bg-[#B99A5E] rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-[#6B7280] mb-2 font-medium">
                    <span>Qualification to Handover Rate</span>
                    <span className="font-bold text-[#111111]">60% Handover Rate</span>
                  </div>
                  <div className="w-full h-2 bg-[#F5F3EF] rounded-full overflow-hidden">
                    <div className="h-full bg-[#B99A5E] rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </DashboardCard>
          </div>

          <div className="flex flex-col gap-6">
            <DashboardCard title="Leads Sourcing Channels">
              <div className="flex flex-col gap-4 mt-2">
                {leadSources.map(item => {
                  const totalLeads = leads.length || 1;
                  const percent = (item.count / totalLeads) * 100;
                  return (
                    <div key={item.source} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#6B7280] truncate">{item.source}</span>
                        <span className="text-[#111111]">{item.count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F5F3EF] rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${percent}%` }} 
                          className="h-full bg-[#B99A5E] rounded-full"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>
          </div>
        </div>
      )}

      {/* ========================================================
          3. SALES REPRESENTATIVE VIEW
          ======================================================== */}
      {userRole === 'sales' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <MetricCard
              title="Pending Commissions"
              value={`₹${myPendingCommissions.toLocaleString()}`}
              description="Awaiting approval"
              icon={Clock}
            />
            <MetricCard
              title="Commissions Paid"
              value={`₹${myPaidCommissions.toLocaleString()}`}
              description="Transferred"
              icon={CheckCircle2}
            />
            <MetricCard
              title="Active Deals Assigned"
              value={`${opportunities.length} Deals`}
              description={`Volume: ₹${activePipelineValue.toLocaleString()}`}
              icon={Briefcase}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard title="My Active Pipelines">
              <div className="flex flex-col gap-3 mt-2 max-h-[300px] overflow-y-auto pr-1">
                {opportunities.length === 0 ? (
                  <p className="text-xs text-[#6B7280] py-6 text-center">No active opportunities assigned to you.</p>
                ) : (
                  opportunities.map(o => {
                    const lead = leads.find(l => l.id === o.lead_id);
                    const comp = companies.find(c => c.id === lead?.company_id);
                    return (
                      <div key={o.id} className="p-3.5 bg-white border border-[#ECE8E2] rounded-xl flex items-center justify-between hover:border-[#B99A5E] transition-all">
                        <div>
                          <span className="font-semibold text-sm text-[#111111]">{comp?.name || 'Unknown Company'}</span>
                          <div className="text-[10px] text-[#6B7280] mt-0.5 capitalize font-medium">Stage: {o.stage.replace('_', ' ')}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm text-[#B99A5E]">₹{(o.value || 0).toLocaleString()}</span>
                          <div className="text-[10px] text-[#6B7280] mt-0.5 font-bold">{o.probability}% Confidence</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </DashboardCard>

            <DashboardCard title="Recent Client Contacts">
              <div className="max-h-[300px] overflow-y-auto pr-1">
                <ActivityTimeline activities={activities.slice(0, 4)} />
              </div>
            </DashboardCard>
          </div>
        </>
      )}

      {/* ========================================================
          4. ACCOUNTING VIEW
          ======================================================== */}
      {userRole === 'accounting' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <MetricCard
              title="Outstanding Invoices"
              value={`₹${outstandingInvoices.toLocaleString()}`}
              description="Sent or Overdue collections"
              icon={Clock}
            />
            <MetricCard
              title="Monthly Sourced Expenses"
              value={`₹${totalExpenses.toLocaleString()}`}
              description="Logged overhead cost"
              icon={Briefcase}
            />
            <MetricCard
              title="Net Retainer Cashflow"
              value={`₹${(totalMonthlyRetainer - totalExpenses).toLocaleString()}`}
              description="Retainers minus overhead"
              icon={TrendingUp}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-6">
              <DashboardCard title="Log New Expense">
                {quickExpenseMsg && (
                  <div className="mb-4 p-3 bg-[#15803D]/5 border border-[#15803D]/15 text-[#15803D] text-xs rounded-lg flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    <span>{quickExpenseMsg}</span>
                  </div>
                )}
                <form onSubmit={handleAddQuickExpense} className="flex flex-col gap-4 mt-2">
                  <div>
                    <label className="block text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={quickExpenseCat}
                      onChange={(e) => setQuickExpenseCat(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8F7F4] border border-[#ECE8E2] text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#B99A5E]"
                    >
                      <option value="" disabled>Select Category</option>
                      <option value="Software Subscriptions">Software Subscriptions</option>
                      <option value="Travel & Lodging">Travel & Lodging</option>
                      <option value="Advertising">Advertising</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Client Dining">Client Dining</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-2">Amount (₹)</label>
                    <input
                      type="number"
                      value={quickExpenseAmt}
                      onChange={(e) => setQuickExpenseAmt(e.target.value)}
                      required
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8F7F4] border border-[#ECE8E2] text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#B99A5E]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#101010] hover:bg-[#101010]/95 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Plus size={14} /> Log Expense
                  </button>
                </form>
              </DashboardCard>
            </div>

            <div className="lg:col-span-2">
              <DashboardCard title="Outstanding Invoice Ledger">
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#ECE8E2] text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                        <th className="pb-3 pr-2">Company</th>
                        <th className="pb-3 px-2">Amount</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 pl-2 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-xs text-[#6B7280] text-center py-8">No outstanding invoices.</td>
                        </tr>
                      ) : (
                        invoices.filter(i => i.status === 'sent' || i.status === 'overdue').map(i => {
                          const comp = companies.find(c => c.id === i.company_id);
                          return (
                            <tr key={i.id} className="border-b border-[#F5F3EF] hover:bg-[#F5F3EF]/30 transition-colors">
                              <td className="py-3.5 pr-2 text-xs font-semibold text-[#111111]">{comp?.name || 'Unknown'}</td>
                              <td className="py-3.5 px-2 text-xs text-[#111111] font-bold">₹{i.amount.toLocaleString()}</td>
                              <td className="py-3.5 px-2 text-xs">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  i.status === 'overdue' ? 'bg-[#DC2626]/10 text-[#DC2626]' : 'bg-[#D97706]/10 text-[#D97706]'
                                }`}>
                                  {i.status}
                                </span>
                              </td>
                              <td className="py-3.5 pl-2 text-right text-xs text-[#6B7280] font-medium">{i.date}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            </div>
          </div>
        </>
      )}

      {/* ========================================================
          5. CLIENT TRANSPARENCY VIEW
          ======================================================== */}
      {userRole === 'client' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <DashboardCard title="Active Retainer Contract Details">
              {companies[0] ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-2">
                  <div>
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Client Brand</span>
                    <span className="block text-sm font-semibold text-[#111111] mt-1.5">{companies[0].name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Industry</span>
                    <span className="block text-sm font-semibold text-[#111111] mt-1.5">{companies[0].industry || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Retainer Rate</span>
                    <span className="block text-sm font-bold text-[#B99A5E] mt-1.5">₹{(companies[0].monthly_retainer_amount || 0).toLocaleString()}/mo</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Status</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-1.5 ${
                      companies[0].contract_status === 'active' ? 'bg-[#15803D]/10 text-[#15803D]' : 'bg-[#D97706]/10 text-[#D97706]'
                    }`}>
                      {companies[0].contract_status}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#6B7280]">No retainer contract mapped to your profile.</p>
              )}
            </DashboardCard>

            <DashboardCard title="Active Outreach Pipelines">
              <div className="flex flex-col gap-3 mt-2 max-h-[300px] overflow-y-auto pr-1">
                {opportunities.length === 0 ? (
                  <p className="text-xs text-[#6B7280] py-6 text-center">No active lead conversions mapped to your company.</p>
                ) : (
                  opportunities.map(o => (
                    <div key={o.id} className="p-3.5 bg-white border border-[#ECE8E2] rounded-xl flex items-center justify-between hover:border-[#B99A5E] transition-all">
                      <div>
                        <span className="font-semibold text-sm text-[#111111]">Opportunity Ref #{o.id.slice(2, 6)}</span>
                        <div className="text-[10px] text-[#6B7280] mt-0.5 capitalize font-medium">Phase: {o.stage.replace('_', ' ')}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-[#B99A5E]">₹{(o.value || 0).toLocaleString()}</span>
                        <div className="text-[10px] text-[#6B7280] mt-0.5 font-bold">{o.probability}% Confidence</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DashboardCard>
          </div>

          <div className="flex flex-col gap-6">
            <DashboardCard title="Client Activity Log">
              <div className="max-h-[360px] overflow-y-auto pr-1">
                <ActivityTimeline activities={activities} />
              </div>
            </DashboardCard>
          </div>
        </div>
      )}
    </div>
  );
};
