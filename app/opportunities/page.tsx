'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AppLayout } from '../../components/AppLayout';
import { Opportunities } from '../../src/legacy-pages/Opportunities';

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'acquisition', 'sales', 'accounting']}>
      <AppLayout>
        <Opportunities />
      </AppLayout>
    </ProtectedRoute>
  );
}
