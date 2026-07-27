'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AppLayout } from '../../components/AppLayout';
import { Billing } from '../../src/legacy-pages/Billing';

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'accounting', 'sales', 'acquisition']}>
      <AppLayout>
        <Billing />
      </AppLayout>
    </ProtectedRoute>
  );
}
