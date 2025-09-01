import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../api/userAPI.js';
import useAuthStore from '../../../stores/authStore.js';
import { toast } from 'react-hot-toast';

// Get user profile hook
export const useUserProfile = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: userAPI.getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update user profile hook
export const useUpdateProfile = () => {
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userAPI.updateProfile,
    onSuccess: (data) => {
      updateUser(data.data);
      toast.success(data.message || 'Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    },
  });
};

// Upload avatar hook
export const useUploadAvatar = () => {
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userAPI.uploadAvatar,
    onSuccess: (data) => {
      updateUser(data.data.user);
      toast.success(data.message || 'Avatar uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to upload avatar';
      toast.error(message);
    },
  });
};

// Delete avatar hook
export const useDeleteAvatar = () => {
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userAPI.deleteAvatar,
    onSuccess: (data) => {
      updateUser(data.data.user);
      toast.success(data.message || 'Avatar deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete avatar';
      toast.error(message);
    },
  });
};

// Get user stats hook
export const useUserStats = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['user', 'stats'],
    queryFn: userAPI.getStats,
    enabled: isAuthenticated,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Deactivate account hook
export const useDeactivateAccount = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ password, reason }) => userAPI.deactivateAccount(password, reason),
    onSuccess: (data) => {
      logout();
      queryClient.clear();
      toast.success(data.message || 'Account deactivated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to deactivate account';
      toast.error(message);
    },
  });
};
