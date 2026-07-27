import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Leads } from './pages/Leads'
import { Opportunities } from './pages/Opportunities'
import { Commissions } from './pages/Commissions'
import { Accounts } from './pages/Accounts'
import { Billing } from './pages/Billing'
import { Reports } from './pages/Reports'
import { AdminUserMgmt } from './pages/AdminUserMgmt'
import { AuditLogs } from './pages/AuditLogs'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Pathway */}
          <Route path="/login" element={<Login />} />
          
          {/* Guarded CRM Pathway */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  {/* Common Dashboard */}
                  <Route path="/" element={<Dashboard />} />
                  
                  {/* Lead management - Sourcing Team */}
                  <Route path="/leads" element={
                    <ProtectedRoute allowedRoles={['admin', 'acquisition', 'sales', 'accounting']}>
                      <Leads />
                    </ProtectedRoute>
                  } />
                  
                  {/* Pipeline Kanban - Closer Team */}
                  <Route path="/opportunities" element={
                    <ProtectedRoute allowedRoles={['admin', 'acquisition', 'sales', 'accounting']}>
                      <Opportunities />
                    </ProtectedRoute>
                  } />
                  
                  {/* Commission ledger */}
                  <Route path="/commissions" element={
                    <ProtectedRoute allowedRoles={['admin', 'sales', 'accounting']}>
                      <Commissions />
                    </ProtectedRoute>
                  } />
                  
                  {/* Accounts / Companies list (with scoped read-only client logs) */}
                  <Route path="/accounts" element={<Accounts />} />
                  
                  {/* Billing, Invoices, Expenses */}
                  <Route path="/billing" element={
                    <ProtectedRoute allowedRoles={['admin', 'accounting', 'sales', 'acquisition']}>
                      <Billing />
                    </ProtectedRoute>
                  } />
                  
                  {/* Date range reporting - Executive Team */}
                  <Route path="/reports" element={
                    <ProtectedRoute allowedRoles={['admin', 'accounting']}>
                      <Reports />
                    </ProtectedRoute>
                  } />
                  
                  {/* User Roles & Permissions - Super Admin only */}
                  <Route path="/users" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminUserMgmt />
                    </ProtectedRoute>
                  } />
                  
                  {/* Mutation security log - Super Admin only */}
                  <Route path="/audit-logs" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AuditLogs />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
