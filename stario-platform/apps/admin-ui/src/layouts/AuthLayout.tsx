import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Stario Admin</h1>
          <p className="mt-2 text-sm text-gray-600">AI Emotion Platform</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
