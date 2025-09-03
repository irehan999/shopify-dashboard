import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib';

// Initiate OAuth flow  
export const useInitiateShopifyAuth = () => {
  return useMutation({
    mutationFn: async (shop) => {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const oauthUrl = `${backendUrl}/api/shopify/auth?shop=${encodeURIComponent(shop)}`;
      
      // Direct redirect to backend OAuth endpoint
      window.location.href = oauthUrl;
      
      return { success: true };
    },
    onError: (error) => {
      console.error('OAuth initiation failed:', error);
    }
  });
};


// Get connected stores
export const useConnectedStores = () => {
  return useQuery({
  queryKey: queryKeys.stores.list('connected'),
    queryFn: async () => {
      const response = await api.get('/api/shopify/stores');
      return response.data.data;
    }
  });
};

// Disconnect store
export const useDisconnectStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (storeId) => {
      const response = await api.delete(`/api/shopify/stores/${storeId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate connected stores query to refresh the list
  queryClient.invalidateQueries({ queryKey: queryKeys.stores.list('connected') });
    }
  });
};

// Get store analytics
export const useStoreAnalytics = (storeId) => {
  return useQuery({
    queryKey: ['store-analytics', storeId],
    queryFn: async () => {
      const response = await api.get(`/api/shopify/stores/${storeId}/analytics`);
      return response.data.data;
    },
    enabled: !!storeId
  });
};

// Link store to current user using token from OAuth callback guest flow
export const useLinkStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token) => {
      const response = await api.post('/api/shopify/link-store', { token });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.list('connected') });
    },
  });
};
