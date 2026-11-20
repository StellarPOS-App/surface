import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import POSTerminal from '@/pages/pos/POSTerminal';
import { useAuthStore } from '@/stores/authStore';
import { useScheduleSettlementReport } from '@/hooks/useSettlementReport';

// The register loads with the app; back-office screens load on first visit.
// Reports pulls in the charting library (~370 KB), which most till sessions
// never need.
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Inventory = lazy(() => import('@/pages/inventory/Inventory'));
const Transactions = lazy(() => import('@/pages/transactions/Transactions'));
const Customers = lazy(() => import('@/pages/customers/Customers'));
const Settings = lazy(() => import('@/pages/settings/Settings'));

const pageFallback = (
  <div className="grid place-items-center py-24">
    <LoadingSpinner size="lg" label="Loading screen" />
  </div>
);

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();
  useScheduleSettlementReport();

  if (isLoading) {
    return (
      <div className="min-h-app flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth/*"
        element={
          isAuthenticated ? (
            <Navigate to="/pos" replace />
          ) : (
            <AuthLayout>
              <Routes>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="*" element={<Navigate to="login" replace />} />
              </Routes>
            </AuthLayout>
          )
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Suspense fallback={pageFallback}>
                <Routes>
                  <Route path="pos" element={<POSTerminal />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/pos" replace />} />
                </Routes>
              </Suspense>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
