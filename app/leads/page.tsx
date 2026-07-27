'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AppLayout } from '../../components/AppLayout';
import { Leads } from '../../src/legacy-pages/Leads';

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'acquisition', 'sales', 'accounting']}>
      <AppLayout>
        <Leads />
      </AppLayout>
    </ProtectedRoute>
  );
}
