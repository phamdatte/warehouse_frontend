import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PrivateRoute() {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AdminRoute() {
    const { isAuthenticated, isAdmin } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isAdmin()) return <Navigate to="/" replace />;
    return <Outlet />;
}

export function ManagerRoute() {
    const { isAuthenticated, isManager } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isManager()) return <Navigate to="/" replace />;
    return <Outlet />;
}
