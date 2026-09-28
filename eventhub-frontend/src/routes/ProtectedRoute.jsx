import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loader from '../components/common/Loader';
export default function ProtectedRoute({ roles }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return <Loader />;
  if (!auth.isAuthenticated)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(auth.user.role?.toUpperCase()))
    return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
