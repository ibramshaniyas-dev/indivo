import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import SellerDashboardLayout from './layouts/SellerDashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/public/Home';
import SearchResults from './pages/public/SearchResults';
import ProductDetail from './pages/public/ProductDetail';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SellerLoginPage from './pages/auth/SellerLogin';
import AdminLogin from './pages/auth/AdminLogin';
import SuperAdminLogin from './pages/auth/SuperAdminLogin';

import SellerRegister from './pages/seller/Register';
import OnboardingWizard from './pages/seller/OnboardingWizard';
import SellerDashboard from './pages/seller/Dashboard';

import AdminDashboard from './pages/admin/Dashboard';
import SellerApprovals from './pages/admin/SellerApprovals';
import Categories from './pages/admin/Categories';
import Brands from './pages/admin/Brands';
import AdminUsers from './pages/admin/AdminUsers';
import RolesPermissions from './pages/admin/RolesPermissions';
import ComingSoon from './pages/admin/ComingSoon';

function adminRoutes() {
  return (
    <>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="sellers" element={<ProtectedRoute permission="sellers.view"><SellerApprovals /></ProtectedRoute>} />
      <Route path="products" element={<ProtectedRoute permission="products.view"><ComingSoon title="Product Management" /></ProtectedRoute>} />
      <Route path="categories" element={<ProtectedRoute permission="categories.view"><Categories /></ProtectedRoute>} />
      <Route path="brands" element={<ProtectedRoute permission="brands.view"><Brands /></ProtectedRoute>} />
      <Route path="attributes" element={<ProtectedRoute permission="attributes.view"><ComingSoon title="Attributes" /></ProtectedRoute>} />
      <Route path="customers" element={<ProtectedRoute permission="customers.view"><ComingSoon title="Customers" /></ProtectedRoute>} />
      <Route path="orders" element={<ProtectedRoute permission="orders.view"><ComingSoon title="Orders" /></ProtectedRoute>} />
      <Route path="returns" element={<ProtectedRoute permission="returns.view"><ComingSoon title="Returns" /></ProtectedRoute>} />
      <Route path="payments" element={<ProtectedRoute permission="payments.view"><ComingSoon title="Payments" /></ProtectedRoute>} />
      <Route path="refunds" element={<ProtectedRoute permission="refunds.view"><ComingSoon title="Refunds" /></ProtectedRoute>} />
      <Route path="commission" element={<ProtectedRoute permission="commission.view"><ComingSoon title="Commission" /></ProtectedRoute>} />
      <Route path="settlements" element={<ProtectedRoute permission="settlements.view"><ComingSoon title="Settlements" /></ProtectedRoute>} />
      <Route path="coupons" element={<ProtectedRoute permission="coupons.view"><ComingSoon title="Coupons" /></ProtectedRoute>} />
      <Route path="offers" element={<ProtectedRoute permission="offers.view"><ComingSoon title="Offers" /></ProtectedRoute>} />
      <Route path="reviews" element={<ProtectedRoute permission="reviews.view"><ComingSoon title="Reviews" /></ProtectedRoute>} />
      <Route path="cms" element={<ProtectedRoute permission="cms.view"><ComingSoon title="CMS & Homepage" /></ProtectedRoute>} />
      <Route path="reports" element={<ProtectedRoute permission="reports.view"><ComingSoon title="Reports" /></ProtectedRoute>} />
      <Route path="admin-users" element={<ProtectedRoute permission="users.view"><AdminUsers /></ProtectedRoute>} />
      <Route path="roles" element={<ProtectedRoute permission="roles.view"><RolesPermissions /></ProtectedRoute>} />
      <Route path="notifications" element={<ProtectedRoute permission="notifications.view"><ComingSoon title="Notifications" /></ProtectedRoute>} />
      <Route path="settings" element={<ProtectedRoute permission="settings.view"><ComingSoon title="Settings" /></ProtectedRoute>} />
      <Route path="audit-logs" element={<ProtectedRoute permission="audit_logs.view"><ComingSoon title="Audit Logs" /></ProtectedRoute>} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/sell" element={<SellerRegister />} />
        </Route>

        <Route path="/seller/login" element={<SellerLoginPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />

        <Route
          element={
            <ProtectedRoute allow={['SELLER_STAFF']} loginPath="/seller/login">
              <SellerDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/seller/onboarding" element={<OnboardingWizard />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allow={['ADMIN']} loginPath="/admin/login">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {adminRoutes()}
        </Route>

        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allow={['ADMIN']} requireSuperAdmin loginPath="/super-admin/login">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {adminRoutes()}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
