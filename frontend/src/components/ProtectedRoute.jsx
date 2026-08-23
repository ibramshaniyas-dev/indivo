import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ allow, requireSuperAdmin, permission, loginPath = '/login', children }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();
  const portalDashboard = location.pathname.startsWith('/super-admin') ? '/super-admin/dashboard' : '/admin/dashboard';

  if (!isAuthenticated) return <Navigate to={loginPath} replace />;
  if (allow && !allow.includes(user?.userType)) return <Navigate to={loginPath} replace />;
  if (requireSuperAdmin && !user?.isSuperAdmin) return <Navigate to={loginPath} replace />;
  if (permission && !user?.isSuperAdmin && !user?.permissions?.includes(permission)) {
    return <Navigate to={portalDashboard} replace />;
  }
  return children;
}
