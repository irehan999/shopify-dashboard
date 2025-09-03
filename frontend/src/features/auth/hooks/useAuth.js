import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/features/auth/api/authAPI';
import useAuthStore from '@/stores/authStore';
import { toast } from 'react-hot-toast';

// Login hook
export const useLogin = () => {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      console.log('Login successful, user data:', data.data.user);
      login(data.data.user);
      toast.success(data.message || 'Login successful!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.log('Login failed:', error.response?.data?.message || error.message);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });
};

// Register hook
export const useRegister = () => {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.register,
    onSuccess: (data) => {
      login(data.data.user);
      toast.success(data.message || 'Registration successful!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    },
  });
};

// Logout hook
export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: (data) => {
      logout();
      queryClient.clear();
      toast.success(data.message || 'Logout successful!');
    },
    onError: () => {
      // Even if logout fails, clear local state
      logout();
      queryClient.clear();
      toast.success('Logout completed');
    },
  });
};

// Get current user hook
export const useCurrentUser = () => {
  const { isAuthenticated, updateUser, logout, user } = useAuthStore();

  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: authAPI.getCurrentUser,
    enabled: isAuthenticated && !!user, // Only run if authenticated AND user exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (auth failures)
      if (error.response?.status === 401) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    onSuccess: (data) => {
      updateUser(data.data);
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        // Token refresh will be handled by axios interceptor
        // If we get here, refresh failed and user should be logged out
        console.log('Current user fetch failed with 401, logging out');
        logout();
      }
    },
  });
};

// Change password hook
export const useChangePassword = () => {
  return useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: (data) => {
      toast.success(data.message || 'Password changed successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    },
  });
};

// Refresh token hook (for manual refresh if needed)
export const useRefreshToken = () => {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.refreshToken,
    onSuccess: (data) => {
      // Update user data with refreshed token
      if (data.data.user) {
        login(data.data.user);
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      // If refresh fails, log out the user
      useAuthStore.getState().logout();
      const message = error.response?.data?.message || 'Session expired. Please login again.';
      toast.error(message);
    },
  });
};
