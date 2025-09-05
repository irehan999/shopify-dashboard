import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shopifySyncApi } from '../api/shopifySyncApi.js';
import { toast } from 'react-hot-toast';

/**
 * Shopify Sync Hooks
 * Product synchronization operations between dashboard and Shopify stores
 * For store management hooks, use features/shopify/hooks/useShopify.js
 * For collection hooks, use features/products/hooks/useCollectionApi.js
 */

// ==============================================
// INDIVIDUAL STORE SYNC HOOKS
// ==============================================

/**
 * Create product in specific store
 * @returns {Object} Mutation object for product creation
 */
export const useCreateInStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, storeId, options }) => 
      shopifySyncApi.createProduct(productId, storeId, options),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Product created in store successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create product in store');
    }
  });
};

/**
 * Update product in specific store
 * @returns {Object} Mutation object for product update
 */
export const useUpdateInStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, storeId, updateData }) => 
      shopifySyncApi.updateProduct(productId, storeId, updateData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Product updated in store successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update product in store');
    }
  });
};

/**
 * Enhanced sync to store with collections and inventory support
 * @returns {Object} Mutation object for product sync
 */
export const useSyncToStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, storeId, syncOptions }) => 
      shopifySyncApi.syncProduct(productId, storeId, syncOptions),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['inventory', 'summary', variables.productId] 
      });
      
      const hasCollections = variables.syncOptions?.collectionsToJoin?.length > 0;
      const message = hasCollections 
        ? 'Product synced to store with collections successfully!'
        : 'Product synced to store successfully!';
      
      toast.success(message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to sync product to store');
    }
  });
};

/**
 * Delete product from specific store
 * @returns {Object} Mutation object for product deletion
 */
export const useDeleteFromStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, storeId }) => 
      shopifySyncApi.deleteProduct(productId, storeId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Product deleted from store successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete product from store');
    }
  });
};

// ==============================================
// MULTI-STORE SYNC HOOKS
// ==============================================

/**
 * Enhanced sync to multiple stores with collection support
 * @returns {Object} Mutation object for multi-store sync
 */
export const useSyncToMultipleStores = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, storeIds, syncOptions }) => 
      shopifySyncApi.syncToMultipleStores(productId, storeIds, syncOptions),
    onSuccess: (results, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['inventory', 'summary', variables.productId] 
      });
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;
      
      toast.success(`Product synced to ${successCount} stores successfully!`);
      if (failedCount > 0) {
        toast.error(`Failed to sync to ${failedCount} stores`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Multi-store sync failed');
    }
  });
};

/**
 * Bulk sync multiple products to store
 * @returns {Object} Mutation object for bulk sync
 */
export const useBulkSyncToStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ storeId, productIds, options }) => 
      shopifySyncApi.bulkSyncProducts(storeId, productIds, options),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      const { successful = 0, failed = 0 } = data?.data?.summary || {};
      toast.success(`Bulk sync completed: ${successful} successful, ${failed} failed`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Bulk sync failed');
    }
  });
};

// ==============================================
// STORE DATA HOOKS
// ==============================================

/**
 * Get Shopify product data from store
 * @param {string} productId - Product ID
 * @param {string} storeId - Store ID
 * @returns {Object} Query object with store product data
 */
export const useStoreProduct = (productId, storeId) => {
  return useQuery({
    queryKey: ['store-product', productId, storeId],
    queryFn: () => shopifySyncApi.getShopifyProduct(productId, storeId),
    enabled: !!productId && !!storeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data) => data?.data
  });
};

/**
 * Get store inventory for product
 * @param {string} productId - Product ID
 * @param {string} storeId - Store ID
 * @returns {Object} Query object with inventory data
 */
export const useStoreInventory = (productId, storeId) => {
  return useQuery({
    queryKey: ['store-inventory', productId, storeId],
    queryFn: () => shopifySyncApi.getProductInventory(productId, storeId),
    enabled: !!productId && !!storeId,
    staleTime: 1 * 60 * 1000, // 1 minute
    select: (data) => data?.data
  });
};

/**
 * Search products in store
 * @returns {Object} Mutation object for store product search
 */
export const useSearchStoreProducts = () => {
  return useMutation({
    mutationFn: ({ storeId, searchParams }) => 
      shopifySyncApi.searchStoreProducts(storeId, searchParams),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to search store products');
    }
  });
};

// ==============================================
// COMPREHENSIVE SYNC MANAGEMENT HOOK
// ==============================================

/**
 * Comprehensive product sync management hook
 * Combines all sync operations for a specific product
 * @param {string} productId - Product ID to manage sync for
 * @returns {Object} Complete sync management utilities
 */
export const useProductSyncManagement = (productId) => {
  const syncToStore = useSyncToStore();
  const syncToMultiple = useSyncToMultipleStores();
  const createInStore = useCreateInStore();
  const updateInStore = useUpdateInStore();
  const deleteFromStore = useDeleteFromStore();
  
  return {
    // Individual store actions
    syncToStore: (storeId, syncOptions) => 
      syncToStore.mutate({ productId, storeId, syncOptions }),
    createInStore: (storeId, options) => 
      createInStore.mutate({ productId, storeId, options }),
    updateInStore: (storeId, updateData) => 
      updateInStore.mutate({ productId, storeId, updateData }),
    deleteFromStore: (storeId) => 
      deleteFromStore.mutate({ productId, storeId }),
    
    // Multi-store actions
    syncToMultiple: (storeIds, syncOptions) => 
      syncToMultiple.mutate({ productId, storeIds, syncOptions }),
    
    // Action states
    isSyncing: syncToStore.isPending || syncToMultiple.isPending,
    isCreating: createInStore.isPending,
    isUpdating: updateInStore.isPending,
    isDeleting: deleteFromStore.isPending,
    
    // Error states
    syncError: syncToStore.error || syncToMultiple.error,
    createError: createInStore.error,
    updateError: updateInStore.error,
    deleteError: deleteFromStore.error
  };
};
