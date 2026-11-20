import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { hasAdminAccess } from '@/lib/admin-access';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

// requireAdminAccess: the super admin, or a member the super admin gave admin access to (Admin → Assign roles).
export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement, requireRole, requireAdminAccess, unauthorizedElement }) {
  const { isAuthenticated, isLoadingAuth, authChecked, checkUserAuth, user } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  if (requireRole && user?.role !== requireRole) {
    return unauthorizedElement || unauthenticatedElement;
  }
  if (requireAdminAccess && !hasAdminAccess(user)) {
    return unauthorizedElement || unauthenticatedElement;
  }

  return <Outlet />;
}
