import { Navigate, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import useAuthStore from '@/stores/authStore';

// Protected route wrapper
export const AuthGuard = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const didLogoutRef = useRef(false);

  // Check both authentication status and user data
  if (!isAuthenticated || !user) {
    console.log('AuthGuard: User not authenticated, redirecting to login');
    // Ensure store is cleared before redirect to avoid UI glitches
    if (!didLogoutRef.current) {
      didLogoutRef.current = true;
      logout();
    }
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public route wrapper (redirects to dashboard if already authenticated)
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  // Only redirect if both authenticated and user data exists
  if (isAuthenticated && user) {
    console.log('PublicRoute: User already authenticated, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  return children;
};

// Legacy exports for backward compatibility
export const ProtectedRoute = AuthGuard;
