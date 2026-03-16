import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivateRoute, AdminRoute, PageRoute, GuestRoute } from './router/Guards';

// Pages
import LoginPage from './pages/auth/LoginPage';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/dashboard/DashboardPage';

// Receipt
import ReceiptListPage from './pages/receipt/ReceiptListPage';
import ReceiptCreatePage from './pages/receipt/ReceiptCreatePage';
import ReceiptDetailPage from './pages/receipt/ReceiptDetailPage';
import ReceiptEditPage from './pages/receipt/ReceiptEditPage';

// Issue
import IssueListPage from './pages/issue/IssueListPage';
import IssueCreatePage from './pages/issue/IssueCreatePage';
import IssueDetailPage from './pages/issue/IssueDetailPage';
import IssueEditPage from './pages/issue/IssueEditPage';

// Inventory
import InventoryPage from './pages/inventory/InventoryPage';
import TransactionHistoryPage from './pages/inventory/TransactionHistoryPage';

// Reports
import ReportReceiptPage from './pages/report/ReportReceiptPage';
import ReportIssuePage from './pages/report/ReportIssuePage';
import ReportInventoryPage from './pages/report/ReportInventoryPage';

// Master data
import ProductPage from './pages/master/ProductPage';
import CategoryPage from './pages/master/CategoryPage';
import VendorPage from './pages/master/VendorPage';
import CustomerPage from './pages/master/CustomerPage';

// Admin
import UserPage from './pages/admin/UserPage';
import RolePage from './pages/admin/RolePage';
import PagePermissionPage from './pages/admin/PagePermissionPage';

// Priority order for default redirect
const MENU_ROUTES = [
    '/dashboard',
    '/receipt', '/receipt/create',
    '/issue', '/issue/create',
    '/inventory', '/inventory/history',
    '/report/receipt', '/report/issue', '/report/inventory',
    '/product', '/category', '/vendor', '/customer',
    '/admin/user', '/admin/role', '/admin/page-permission',
];

/** Redirect to the first page the user has canView access to. */
function SmartRedirect() {
    const { pages, isAdmin } = useAuth();
    if (isAdmin()) return <Navigate to="/dashboard" replace />;
    
    const first = MENU_ROUTES.find((r) =>
        pages.some((p) => (p.pageUrl || '').replace(/^\//, '') === r.replace(/^\//, '') && p.canView)
    );
    
    if (!first) {
        return (
            <div className="flex h-full items-center justify-center text-slate-500">
                You do not have permission to access any pages. Contact an administrator.
            </div>
        );
    }
    
    return <Navigate to={first} replace />;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public */}
                    <Route element={<GuestRoute />}>
                        <Route path="/login" element={<LoginPage />} />
                    </Route>

                    {/* Protected */}
                    <Route element={<PrivateRoute />}>
                        <Route element={<MainLayout />}>
                            <Route index element={<SmartRedirect />} />

                            {/* Dashboard */}
                            <Route element={<PageRoute group="dashboard" />}>
                                <Route path="dashboard" element={<DashboardPage />} />
                            </Route>

                            {/* Goods Receipt */}
                            <Route element={<PageRoute group="receipt" />}>
                                <Route path="receipt"           element={<ReceiptListPage />} />
                                <Route path="receipt/create"    element={<ReceiptCreatePage />} />
                                <Route path="receipt/:id"       element={<ReceiptDetailPage />} />
                                <Route path="receipt/:id/edit"  element={<ReceiptEditPage />} />
                            </Route>

                            {/* Goods Issue */}
                            <Route element={<PageRoute group="issue" />}>
                                <Route path="issue"             element={<IssueListPage />} />
                                <Route path="issue/create"      element={<IssueCreatePage />} />
                                <Route path="issue/:id"         element={<IssueDetailPage />} />
                                <Route path="issue/:id/edit"    element={<IssueEditPage />} />
                            </Route>

                            {/* Inventory */}
                            <Route element={<PageRoute group="inventory" />}>
                                <Route path="inventory"         element={<InventoryPage />} />
                                <Route path="inventory/history" element={<TransactionHistoryPage />} />
                            </Route>

                            {/* Reports */}
                            <Route element={<PageRoute group="report" />}>
                                <Route path="report/receipt"    element={<ReportReceiptPage />} />
                                <Route path="report/issue"      element={<ReportIssuePage />} />
                                <Route path="report/inventory"  element={<ReportInventoryPage />} />
                            </Route>

                            {/* Master data */}
                            <Route element={<PageRoute group="master" />}>
                                <Route path="product"           element={<ProductPage />} />
                                <Route path="category"          element={<CategoryPage />} />
                                <Route path="vendor"            element={<VendorPage />} />
                                <Route path="customer"          element={<CustomerPage />} />
                            </Route>

                            {/* Admin — always Admin-only, no page permission needed */}
                            <Route element={<AdminRoute />}>
                                <Route path="admin/user"            element={<UserPage />} />
                                <Route path="admin/role"            element={<RolePage />} />
                                <Route path="admin/page-permission" element={<PagePermissionPage />} />
                            </Route>
                        </Route>
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>

            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />
        </AuthProvider>
    );
}
