import React, { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserRole } from '../types'

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-crm-950 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute w-10 h-10 border-4 border-purple-500/10 border-b-purple-500 rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]"></div>
        </div>
        <p className="mt-6 text-slate-400 text-sm font-medium tracking-widest uppercase animate-pulse">Loading WAHS CRM</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    console.warn(`Access denied for role: ${profile.role}. Required: ${allowedRoles.join(', ')}`)
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
