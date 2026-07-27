'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AppLayout } from '../../components/AppLayout';
import { AdminUserMgmt } from '../../src/legacy-pages/AdminUserMgmt';

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppLayout>
        <AdminUserMgmt />
      </AppLayout>
    </ProtectedRoute>
  );
}
