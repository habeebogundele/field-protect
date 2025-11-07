'use client';

import { useAuth } from '@/hooks/useAuth';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <Dashboard />;
}
