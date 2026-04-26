import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/AdminDashboard';
import UserDetail from './pages/UserDetail';
import Hierarchy from './pages/Hierarchy';
import MembershipPrograms from './pages/MembershipPrograms';
import MembershipProgramDetails from './pages/MembershipProgramDetails';
import Products from './pages/Products';
import Categories from './pages/Categories';
import ManageCalendar from './pages/ManageCalendar';
import ManageCawangan from './pages/ManageCawangan';
import Positions from './pages/Positions';
import Commissions from './pages/Commissions';
import TierConfigs from './pages/TierConfigs';
import FinancialDashboard from './pages/FinancialDashboard';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import MyCommissions from './pages/MyCommissions';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import MyGelanggang from './pages/MyGelanggang';
import GelanggangDetail from './pages/GelanggangDetail';
import ManageGelanggang from './pages/ManageGelanggang';
import BengkungManagement from './pages/BengkungManagement';
import UjianEvents from './pages/UjianEvents';
import JuryMarking from './pages/JuryMarking';
import ErrorPage from './pages/ErrorPage';
import SidebarLayout from './components/layout/SidebarLayout';
import { Toaster } from './components/ui/sonner';

// --- Guards ---

const PublicOnlyRoute = () => {
  const { isAuthenticated, requiresPasswordChange } = useAuthStore();
  
  if (requiresPasswordChange) return <Navigate to="/change-password" replace />;
  if (isAuthenticated) return <Navigate to="/profile" replace />;
  
  return <Outlet />;
};

const ProtectedRoute = () => {
  const { isAuthenticated, requiresPasswordChange } = useAuthStore();

  if (requiresPasswordChange) return <Navigate to="/change-password" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
};

const AdminRoute = () => {
  const { isAuthenticated, user, requiresPasswordChange } = useAuthStore();

  if (requiresPasswordChange) return <Navigate to="/change-password" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Only SuperAdmin or Admin can hit these routes
  if (user?.role !== 'SuperAdmin' && user?.role !== 'Admin') {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};

const PasswordChangeRoute = () => {
  const { requiresPasswordChange } = useAuthStore();
  // Only accessible if flagged by the 403 interceptor
  if (!requiresPasswordChange) return <Navigate to="/login" replace />;
  return <Outlet />;
};

// --- Router Definition ---

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
    errorElement: <ErrorPage />
  },
  {
    element: <PublicOnlyRoute />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/login', element: <Login /> }
    ]
  },
  {
    element: <PasswordChangeRoute />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/change-password', element: <ChangePassword /> }
    ]
  },
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <SidebarLayout />,
        children: [
          { path: '/profile', element: <Profile /> },
          { path: '/shop', element: <Shop /> },
          { path: '/orders', element: <Orders /> },
          { path: '/commissions', element: <MyCommissions /> },
          { path: '/orders/:id', element: <OrderDetails /> },
          { path: '/gelanggang', element: <MyGelanggang /> },
          { path: '/gelanggang/:id', element: <GelanggangDetail /> }
        ]
      }
    ]
  },
  {
    element: <AdminRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <SidebarLayout />,
        children: [
          { path: '/admin/users', element: <AdminDashboard /> },
          { path: '/admin/users/:id', element: <UserDetail /> },
          { path: '/admin/hierarchy', element: <Hierarchy /> },
          { path: '/admin/commissions', element: <Commissions /> },
          { path: '/admin/memberships', element: <MembershipPrograms /> },
          { path: '/admin/memberships/:prefix', element: <MembershipProgramDetails /> },
          { path: '/admin/products', element: <Products /> },
          { path: '/admin/categories', element: <Categories /> },
          { path: '/admin/calendar', element: <ManageCalendar /> },
          { path: '/admin/cawangan', element: <ManageCawangan /> },
          { path: '/admin/positions', element: <Positions /> },
          { path: '/admin/gelanggang', element: <ManageGelanggang /> },
          { path: '/admin/bengkung', element: <BengkungManagement /> },
          { path: '/admin/ujian-events', element: <UjianEvents /> },
          { path: '/admin/ujian-events/:eventId/markings', element: <JuryMarking /> },
          { path: '/admin/finance', element: <FinancialDashboard /> },
          { path: '/admin/tiers', element: <TierConfigs /> }
        ]
      }
    ]
  }
]);

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
