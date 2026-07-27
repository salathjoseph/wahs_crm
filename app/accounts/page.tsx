'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AppLayout } from '../../components/AppLayout';
import { Accounts } from '../../src/legacy-pages/Accounts';

export default function Page() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Accounts />
      </AppLayout>
    </ProtectedRoute>
  );
}
