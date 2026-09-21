import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import styles from './RequireAuth.module.css';

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className={styles.loadingScreen}>Memuat…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ dari: location.pathname }} />;
  }

  return <Outlet />;
}
