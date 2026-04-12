import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/AdminDashboard';
import Hierarchy from './pages/Hierarchy';
import MembershipPrograms from './pages/MembershipPrograms';
import MembershipProgramDetails from './pages/MembershipProgramDetails';
import Profile from './pages/Profile';
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
          { path: '/profile', element: <Profile /> }
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
          { path: '/admin/hierarchy', element: <Hierarchy /> },
          { path: '/admin/memberships', element: <MembershipPrograms /> },
          { path: '/admin/memberships/:prefix', element: <MembershipProgramDetails /> }
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
