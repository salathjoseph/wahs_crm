'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AppLayout } from '../../components/AppLayout';
import { AuditLogs } from '../../src/legacy-pages/AuditLogs';

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppLayout>
        <AuditLogs />
      </AppLayout>
    </ProtectedRoute>
  );
}
