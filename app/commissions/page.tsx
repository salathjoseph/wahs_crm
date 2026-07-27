'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AppLayout } from '../../components/AppLayout';
import { Commissions } from '../../src/legacy-pages/Commissions';

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'sales', 'accounting']}>
      <AppLayout>
        <Commissions />
      </AppLayout>
    </ProtectedRoute>
  );
}
