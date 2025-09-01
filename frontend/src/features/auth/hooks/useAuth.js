import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../api/authAPI.js';
import useAuthStore from '../../../stores/authStore.js';
import { toast } from 'react-hot-toast';

// Login hook
export const useLogin = () => {
  const { setAuth, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.login,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      setAuth(data.data.user, {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      });
      toast.success(data.message || 'Login successful!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// Register hook
export const useRegister = () => {
  const { setAuth, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.register,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      setAuth(data.data.user, {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      });
      toast.success(data.message || 'Registration successful!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// Logout hook
export const useLogout = () => {
  const { logout, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.logout,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      logout();
      queryClient.clear(); // Clear all cached queries
      toast.success(data.message || 'Logout successful!');
    },
    onError: (error) => {
      // Even if logout fails, clear local state
      logout();
      queryClient.clear();
      const message = error.response?.data?.message || 'Logout completed';
      toast.success(message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// Get current user hook
export const useCurrentUser = () => {
  const { isAuthenticated, setUser } = useAuthStore();

  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: authAPI.getCurrentUser,
    enabled: isAuthenticated, // Only run if authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    onSuccess: (data) => {
      setUser(data.data);
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid, logout user
        useAuthStore.getState().logout();
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
