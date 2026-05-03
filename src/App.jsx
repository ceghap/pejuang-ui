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
import ManageTournaments from './pages/ManageTournaments';
import ManageCawangan from './pages/ManageCawangan';
import CawanganDetail from './pages/CawanganDetail';
import Positions from './pages/Positions';
import Commissions from './pages/Commissions';
import TierConfigs from './pages/TierConfigs';
import FinancialDashboard from './pages/FinancialDashboard';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import TournamentPortal from './pages/TournamentPortal';
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

const StaffRoute = () => {
  const { isAuthenticated, user, requiresPasswordChange } = useAuthStore();

  if (requiresPasswordChange) return <Navigate to="/change-password" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // SuperAdmin, Admin OR BranchAdmin can hit these routes
  const isBranchAdmin = user?.isBranchAdmin === true;
  if (user?.role !== 'SuperAdmin' && user?.role !== 'Admin' && !isBranchAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};

const PasswordChangeRoute = () => {
  const { requiresPasswordChange, isAuthenticated } = useAuthStore();
  // Accessible if forced (requiresPasswordChange) OR if already logged in (isAuthenticated)
  if (!requiresPasswordChange && !isAuthenticated) return <Navigate to="/login" replace />;
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
          { path: '/tournaments', element: <TournamentPortal /> },
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
    element: <StaffRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <SidebarLayout />,
        children: [
          { path: '/admin/users', element: <AdminDashboard /> },
          { path: '/admin/users/:id', element: <UserDetail /> },
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
          { path: '/admin/hierarchy', element: <Hierarchy /> },
          { path: '/admin/commissions', element: <Commissions /> },
          { path: '/admin/memberships', element: <MembershipPrograms /> },
          { path: '/admin/memberships/:prefix', element: <MembershipProgramDetails /> },
          { path: '/admin/products', element: <Products /> },
          { path: '/admin/categories', element: <Categories /> },
          { path: '/admin/calendar', element: <ManageCalendar /> },
          { path: '/admin/tournaments', element: <ManageTournaments /> },
          { path: '/admin/cawangan', element: <ManageCawangan /> },
          { path: '/admin/cawangan/:id', element: <CawanganDetail /> },
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
