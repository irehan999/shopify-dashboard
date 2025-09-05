/**
 * Shopify Store Management Hooks
 * React Query hooks for store operations using shopify API functions
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib';
import {
  initiateShopifyAuth,
  getConnectedStores,
  disconnectStore,
  getStoreAnalytics,
  getStoreSummary,
  getStoreCollections,
  getStoreLocations,
  linkStoreToUser
} from '../api/shopifyApi';

/**
 * Hook to initiate Shopify OAuth flow
 * @returns {Object} Mutation object for OAuth initiation
 */
export const useInitiateShopifyAuth = () => {
  return useMutation({
    mutationFn: initiateShopifyAuth,
    onError: (error) => {
      console.error('OAuth initiation failed:', error);
    }
  });
};

/**
 * Hook to get connected stores for current user
 * @returns {Object} Query object with stores data
 */
export const useConnectedStores = () => {
  return useQuery({
    queryKey: queryKeys.stores.list('connected'),
    queryFn: getConnectedStores
  });
};

/**
 * Hook to disconnect a store
 * @returns {Object} Mutation object for store disconnection
 */
export const useDisconnectStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: disconnectStore,
    onSuccess: () => {
      // Invalidate connected stores query to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.list('connected') });
    }
  });
};

/**
 * Hook to get store analytics
 * @param {string} storeId - Store ID to get analytics for
 * @returns {Object} Query object with analytics data
 */
export const useStoreAnalytics = (storeId) => {
  return useQuery({
    queryKey: ['store-analytics', storeId],
    queryFn: () => getStoreAnalytics(storeId),
    enabled: !!storeId
  });
};

/**
 * Hook to get store summary
 * @param {string} storeId - Store ID to get summary for
 * @returns {Object} Query object with summary data
 */
export const useStoreSummary = (storeId) => {
  return useQuery({
    queryKey: ['store-summary', storeId],
    queryFn: () => getStoreSummary(storeId),
    enabled: !!storeId
  });
};

/**
 * Hook to get store collections
 * @param {string} storeId - Store ID to get collections for
 * @returns {Object} Query object with collections data
 */
export const useStoreCollections = (storeId) => {
  return useQuery({
    queryKey: ['store-collections', storeId],
    queryFn: () => getStoreCollections(storeId),
    enabled: !!storeId
  });
};

/**
 * Hook to get store locations for inventory management
 * @returns {Object} Query object with locations data
 */
export const useStoreLocations = () => {
  return useQuery({
    queryKey: ['store-locations'],
    queryFn: getStoreLocations
  });
};

/**
 * Hook to link store to current user
 * @returns {Object} Mutation object for store linking
 */
export const useLinkStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: linkStoreToUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.list('connected') });
    },
  });
};
