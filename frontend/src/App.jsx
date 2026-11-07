import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import PageLoader from './components/PageLoader';
import CustomerLayout from './layouts/CustomerLayout';
const SellerDashboardLayout = lazy(() => import('./layouts/SellerDashboardLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/public/Home';
const SearchResults = lazy(() => import('./pages/public/SearchResults'));
const ProductDetail = lazy(() => import('./pages/public/ProductDetail'));
const Cart = lazy(() => import('./pages/public/Cart'));
const SellerStore = lazy(() => import('./pages/public/SellerStore'));
const Checkout = lazy(() => import('./pages/public/Checkout'));
const MyOrders = lazy(() => import('./pages/public/MyOrders'));
const OrderDetail = lazy(() => import('./pages/public/OrderDetail'));
const Wishlist = lazy(() => import('./pages/public/Wishlist'));
const Account = lazy(() => import('./pages/public/Account'));
const Addresses = lazy(() => import('./pages/public/Addresses'));
const CmsPage = lazy(() => import('./pages/public/CmsPage'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const SellerLoginPage = lazy(() => import('./pages/auth/SellerLogin'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));
const SuperAdminLogin = lazy(() => import('./pages/auth/SuperAdminLogin'));

const SellerRegister = lazy(() => import('./pages/seller/Register'));
const OnboardingWizard = lazy(() => import('./pages/seller/OnboardingWizard'));
const SellerDashboard = lazy(() => import('./pages/seller/Dashboard'));
const SellerProducts = lazy(() => import('./pages/seller/Products'));
const SellerProductForm = lazy(() => import('./pages/seller/ProductForm'));
const SellerOrders = lazy(() => import('./pages/seller/Orders'));
const SellerOrderDetail = lazy(() => import('./pages/seller/OrderDetail'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const SellerApprovals = lazy(() => import('./pages/admin/SellerApprovals'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminShipments = lazy(() => import('./pages/admin/Shipments'));
const AdminOrderDetail = lazy(() => import('./pages/admin/OrderDetail'));
const Categories = lazy(() => import('./pages/admin/Categories'));
const Brands = lazy(() => import('./pages/admin/Brands'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const RolesPermissions = lazy(() => import('./pages/admin/RolesPermissions'));
const ComingSoon = lazy(() => import('./pages/admin/ComingSoon'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const MyProfile = lazy(() => import('./pages/admin/Profile'));
const AdminCommission = lazy(() => import('./pages/admin/Commission'));
const SellerEarnings = lazy(() => import('./pages/seller/Earnings'));
const AdminSettlements = lazy(() => import('./pages/admin/Settlements'));
const AdminSellerPerformance = lazy(() => import('./pages/admin/SellerPerformance'));

function adminRoutes() {
  return (
    <>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="sellers" element={<ProtectedRoute permission="sellers.view"><SellerApprovals /></ProtectedRoute>} />
      <Route path="products" element={<ProtectedRoute permission="products.view"><AdminProducts /></ProtectedRoute>} />
      <Route path="categories" element={<ProtectedRoute permission="categories.view"><Categories /></ProtectedRoute>} />
      <Route path="brands" element={<ProtectedRoute permission="brands.view"><Brands /></ProtectedRoute>} />
      <Route path="attributes" element={<ProtectedRoute permission="attributes.view"><ComingSoon title="Attributes" /></ProtectedRoute>} />
      <Route path="customers" element={<ProtectedRoute permission="customers.view"><AdminCustomers /></ProtectedRoute>} />
      <Route path="orders" element={<ProtectedRoute permission="orders.view"><AdminOrders /></ProtectedRoute>} />
      <Route path="orders/:id" element={<ProtectedRoute permission="orders.view"><AdminOrderDetail /></ProtectedRoute>} />
      <Route path="shipments" element={<ProtectedRoute permission="orders.view"><AdminShipments /></ProtectedRoute>} />
      <Route path="returns" element={<ProtectedRoute permission="returns.view"><ComingSoon title="Returns" /></ProtectedRoute>} />
      <Route path="payments" element={<ProtectedRoute permission="payments.view"><ComingSoon title="Payments" /></ProtectedRoute>} />
      <Route path="refunds" element={<ProtectedRoute permission="refunds.view"><ComingSoon title="Refunds" /></ProtectedRoute>} />
      <Route path="commission" element={<ProtectedRoute permission="commission.view"><AdminCommission /></ProtectedRoute>} />
      <Route path="settlements" element={<ProtectedRoute permission="settlements.view"><AdminSettlements /></ProtectedRoute>} />
      <Route path="seller-performance" element={<ProtectedRoute permission="sellers.view"><AdminSellerPerformance /></ProtectedRoute>} />
      <Route path="coupons" element={<ProtectedRoute permission="coupons.view"><ComingSoon title="Coupons" /></ProtectedRoute>} />
      <Route path="offers" element={<ProtectedRoute permission="offers.view"><ComingSoon title="Offers" /></ProtectedRoute>} />
      <Route path="reviews" element={<ProtectedRoute permission="reviews.view"><ComingSoon title="Reviews" /></ProtectedRoute>} />
      <Route path="cms" element={<ProtectedRoute permission="cms.view"><ComingSoon title="CMS & Homepage" /></ProtectedRoute>} />
      <Route path="reports" element={<ProtectedRoute permission="reports.view"><ComingSoon title="Reports" /></ProtectedRoute>} />
      <Route path="admin-users" element={<ProtectedRoute permission="users.view"><AdminUsers /></ProtectedRoute>} />
      <Route path="roles" element={<ProtectedRoute permission="roles.view"><RolesPermissions /></ProtectedRoute>} />
      <Route path="notifications" element={<ProtectedRoute permission="notifications.view"><ComingSoon title="Notifications" /></ProtectedRoute>} />
      <Route path="settings" element={<ProtectedRoute permission="settings.view"><AdminSettings /></ProtectedRoute>} />
      <Route path="profile" element={<MyProfile />} />
      <Route path="audit-logs" element={<ProtectedRoute permission="audit_logs.view"><ComingSoon title="Audit Logs" /></ProtectedRoute>} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/store/:id" element={<SellerStore />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/sell" element={<SellerRegister />} />
          <Route path="/about" element={<CmsPage slug="about" />} />
          <Route path="/contact" element={<Contact />} />

          <Route element={<ProtectedRoute allow={['CUSTOMER']} loginPath="/login"><Outlet /></ProtectedRoute>}>
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/account" element={<Account />} />
            <Route path="/account/orders" element={<MyOrders />} />
            <Route path="/account/orders/:id" element={<OrderDetail />} />
            <Route path="/account/addresses" element={<Addresses />} />
            <Route path="/account/reviews" element={<ComingSoon title="My Reviews" />} />
          </Route>
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
          <Route path="/seller/products" element={<SellerProducts />} />
          <Route path="/seller/products/new" element={<SellerProductForm />} />
          <Route path="/seller/products/:id/edit" element={<SellerProductForm />} />
          <Route path="/seller/inventory" element={<ComingSoon title="Inventory" />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/orders/:id" element={<SellerOrderDetail />} />
          <Route path="/seller/profile" element={<MyProfile />} />
          <Route path="/seller/earnings" element={<SellerEarnings />} />
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
      </Suspense>
    </BrowserRouter>
  );
}
