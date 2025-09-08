import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../api/dashboardAPI.js';
import useAuthStore from '../../../stores/authStore.js';

// Get dashboard statistics
export const useDashboardStats = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardAPI.getDashboardStats,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Get unpushed products
export const useUnpushedProducts = (limit = 10) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'unpushed-products', limit],
    queryFn: () => dashboardAPI.getUnpushedProducts(limit),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};
