'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AppLayout } from '../../components/AppLayout';
import { Reports } from '../../src/legacy-pages/Reports';

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'accounting']}>
      <AppLayout>
        <Reports />
      </AppLayout>
    </ProtectedRoute>
  );
}
