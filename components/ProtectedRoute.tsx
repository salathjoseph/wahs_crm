'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/context/AuthContext';
import { UserRole } from '../src/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        console.warn(`Access denied for role: ${profile.role}. Required: ${allowedRoles.join(', ')}`);
        router.replace('/');
      }
    }
  }, [user, profile, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-[#B89C63]/20 border-t-[#B89C63] rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-[#6E6E73] text-xs font-semibold tracking-wider uppercase skeleton-pulse">Loading WAHS CRM</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
};
