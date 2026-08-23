import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import SellerDashboardLayout from './layouts/SellerDashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SellerRegister from './pages/seller/Register';
import OnboardingWizard from './pages/seller/OnboardingWizard';
import SellerDashboard from './pages/seller/Dashboard';
import SellerApprovals from './pages/admin/SellerApprovals';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/sell" element={<SellerRegister />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allow={['SELLER_STAFF']}>
              <SellerDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/seller/onboarding" element={<OnboardingWizard />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allow={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/sellers" element={<SellerApprovals />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
