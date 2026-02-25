import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, AdminRoute, ManagerRoute } from './router/Guards';

// Lazy imports để code-splitting (pages chưa implement = placeholder)
import LoginPage from './pages/auth/LoginPage';
import MainLayout from './layouts/MainLayout';

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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all authenticated users */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Navigate to="/receipt" replace />} />

              {/* Goods Receipt */}
              <Route path="receipt" element={<ReceiptListPage />} />
              <Route path="receipt/create" element={<ReceiptCreatePage />} />
              <Route path="receipt/:id" element={<ReceiptDetailPage />} />
              <Route path="receipt/:id/edit" element={<ReceiptEditPage />} />

              {/* Goods Issue */}
              <Route path="issue" element={<IssueListPage />} />
              <Route path="issue/create" element={<IssueCreatePage />} />
              <Route path="issue/:id" element={<IssueDetailPage />} />
              <Route path="issue/:id/edit" element={<IssueEditPage />} />

              {/* Inventory */}
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="inventory/history" element={<TransactionHistoryPage />} />

              {/* Reports — Manager+ */}
              <Route element={<ManagerRoute />}>
                <Route path="report/receipt" element={<ReportReceiptPage />} />
                <Route path="report/issue" element={<ReportIssuePage />} />
                <Route path="report/inventory" element={<ReportInventoryPage />} />
              </Route>

              {/* Master data */}
              <Route path="product" element={<ProductPage />} />
              <Route path="category" element={<CategoryPage />} />
              <Route path="vendor" element={<VendorPage />} />
              <Route path="customer" element={<CustomerPage />} />

              {/* Admin — Admin only */}
              <Route element={<AdminRoute />}>
                <Route path="admin/user" element={<UserPage />} />
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
