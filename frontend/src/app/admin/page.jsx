'use client';

import AdminDashboard from '../../pages/AdminDashboard';
import { AppProvider } from '../../context/AppContext';

export default function AdminPage() {
  return (
    <AppProvider>
      <AdminDashboard />
    </AppProvider>
  );
}
