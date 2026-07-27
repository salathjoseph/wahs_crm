'use client';

import React from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AppLayout } from '../components/AppLayout';
import { Dashboard } from '../src/legacy-pages/Dashboard';

export default function Page() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </ProtectedRoute>
  );
}
