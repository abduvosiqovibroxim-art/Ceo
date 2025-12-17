import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ArtistsPage from './pages/artists/ArtistsPage';
import ArtistDetailPage from './pages/artists/ArtistDetailPage';
import ArtistVerificationPage from './pages/artists/ArtistVerificationPage';
import UsersPage from './pages/users/UsersPage';
import OrdersPage from './pages/orders/OrdersPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import ContentModerationPage from './pages/moderation/ContentModerationPage';
import ModerationQueuePage from './pages/moderation/ModerationQueuePage';
import MerchPage from './pages/merch/MerchPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import SettingsPage from './pages/settings/SettingsPage';
import AuditLogsPage from './pages/audit/AuditLogsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Admin routes */}
      <Route
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Artists */}
        <Route path="/artists" element={<ArtistsPage />} />
        <Route path="/artists/:id" element={<ArtistDetailPage />} />
        <Route path="/artists/verification" element={<ArtistVerificationPage />} />

        {/* Users */}
        <Route path="/users" element={<UsersPage />} />

        {/* Orders */}
        <Route path="/orders" element={<OrdersPage />} />

        {/* Payments */}
        <Route path="/payments" element={<PaymentsPage />} />

        {/* Moderation */}
        <Route path="/moderation" element={<ContentModerationPage />} />
        <Route path="/moderation/queue" element={<ModerationQueuePage />} />

        {/* Merch */}
        <Route path="/merch" element={<MerchPage />} />

        {/* Analytics */}
        <Route path="/analytics" element={<AnalyticsPage />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Audit Logs */}
        <Route path="/audit" element={<AuditLogsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
