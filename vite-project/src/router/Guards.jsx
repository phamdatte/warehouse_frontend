import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PrivateRoute() {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export function GuestRoute() {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
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

/**
 * PageRoute — guards a group of routes by page-permission system.
 *
 * Props:
 *   group (string) — pageGroup value from backend, e.g. "receipt", "report".
 *                    If provided, allows access when user has canView on ANY
 *                    page in that group. This covers sub-routes like /:id that
 *                    are NOT individually listed in pages[].
 *                    If omitted, falls back to exact path match.
 *
 * Admin bypasses all checks.
 */
export function PageRoute({ group }) {
    const { isAuthenticated, isAdmin, pages } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (isAdmin()) return <Outlet />;

    let allowed = false;

    if (group) {
        // Allow if user has canView for at least one page in this group
        allowed = pages.some((p) => p.pageGroup === group && p.canView);
    } else {
        // Exact path match
        const current = location.pathname.replace(/^\//, '');
        allowed = pages.some((p) => {
            const pageUrl = (p.pageUrl || '').replace(/^\//, '');
            return pageUrl === current && p.canView;
        });
    }

    if (!allowed) return <Navigate to="/" replace />;
    return <Outlet />;
}

