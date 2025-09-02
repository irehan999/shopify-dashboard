import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Initiate OAuth flow
export const useInitiateShopifyAuth = () => {
  return useMutation({
    mutationFn: async (shop) => {
      const response = await api.post('/shopify/auth', { shop });
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to Shopify OAuth URL
      window.location.href = data.data.authUrl;
    },
    onError: (error) => {
      console.error('OAuth initiation failed:', error);
    }
  });
};

// Get connected stores
export const useConnectedStores = () => {
  return useQuery({
    queryKey: ['connected-stores'],
    queryFn: async () => {
      const response = await api.get('/shopify/stores');
      return response.data.data;
    }
  });
};

// Disconnect store
export const useDisconnectStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (storeId) => {
      const response = await api.delete(`/shopify/stores/${storeId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate connected stores query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['connected-stores'] });
    }
  });
};

// Get store analytics
export const useStoreAnalytics = (storeId) => {
  return useQuery({
    queryKey: ['store-analytics', storeId],
    queryFn: async () => {
      const response = await api.get(`/shopify/stores/${storeId}/analytics`);
      return response.data.data;
    },
    enabled: !!storeId
  });
};
