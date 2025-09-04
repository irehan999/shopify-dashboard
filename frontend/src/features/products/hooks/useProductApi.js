import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { productApi } from '../api/productApi.js';
import { shopifySyncApi } from '../api/shopifySyncApi.js';
import { storeApi } from '../api/storeApi.js';
import { 
  fetchStoreCollections,
  formatCollectionsForDisplay,
  createCollectionSelectOptions,
  filterCollectionsBySearch,
  collectionApi 
} from '../api/collectionApi.js';
import { toast } from 'react-hot-toast';

// Product CRUD hooks
export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (id) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully!');
      return data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    }
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => productApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
      toast.success('Product updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
    }
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  });
};

// Option management hooks
export const useProductOptions = (productId) => {
  return useQuery({
    queryKey: ['products', productId, 'options'],
    queryFn: () => productApi.getOptions(productId),
    enabled: !!productId,
  });
};

export const useCreateOption = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, ...data }) => productApi.createOption(productId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'options'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Option added successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add option');
    }
  });
};

export const useUpdateOption = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, optionId, ...data }) => 
      productApi.updateOption(productId, optionId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'options'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Option updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update option');
    }
  });
};

export const useDeleteOption = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, optionId }) => 
      productApi.deleteOption(productId, optionId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'options'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Option deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete option');
    }
  });
};

// Variant management hooks
export const useProductVariants = (productId) => {
  return useQuery({
    queryKey: ['products', productId, 'variants'],
    queryFn: () => productApi.getVariants(productId),
    enabled: !!productId,
  });
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, ...data }) => productApi.createVariant(productId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'variants'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Variant created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create variant');
    }
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, variantId, ...data }) => 
      productApi.updateVariant(productId, variantId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'variants'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Variant updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update variant');
    }
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, variantId }) => 
      productApi.deleteVariant(productId, variantId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'variants'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Variant deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete variant');
    }
  });
};

// Variant generation hook
export const useGenerateVariants = () => {
  return useMutation({
    mutationFn: ({ options }) => {
      // Client-side variant generation from options
      const generateVariantCombinations = (options) => {
        if (!options || options.length === 0) {
          return [];
        }

        const combinations = [];
        
        const generateCombos = (optionIndex, currentCombo) => {
          if (optionIndex >= options.length) {
            combinations.push([...currentCombo]);
            return;
          }

          const option = options[optionIndex];
          const values = option.optionValues || [];
          
          for (const value of values) {
            if (value.name) {
              currentCombo.push({
                optionName: option.name,
                name: value.name
              });
              generateCombos(optionIndex + 1, currentCombo);
              currentCombo.pop();
            }
          }
        };

        generateCombos(0, []);
        
        return combinations.map((combo, index) => ({
          position: index + 1,
          optionValues: combo,
          price: 0,
          compareAtPrice: undefined,
          sku: '',
          barcode: '',
          inventoryQuantity: 0,
          inventoryPolicy: 'deny',
          taxable: true,
          requiresShipping: true,
          weight: 0,
          weightUnit: 'g'
        }));
      };

      return Promise.resolve({
        variants: generateVariantCombinations(options)
      });
    },
    onError: (error) => {
      toast.error('Failed to generate variants');
    }
  });
};

// Media management hooks
export const useProductMedia = (productId) => {
  return useQuery({
    queryKey: ['products', productId, 'media'],
    queryFn: () => productApi.getMedia(productId),
    enabled: !!productId,
  });
};

// Media upload hooks
export const useUploadMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, files, altTexts = [] }) => 
      productApi.uploadMedia(productId, files, altTexts),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'media'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Media uploaded successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload media');
    }
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, mediaId }) => 
      productApi.deleteMedia(productId, mediaId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'media'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Media deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete media');
    }
  });
};

export const useReorderMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, mediaOrder }) => 
      productApi.reorderMedia(productId, mediaOrder),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'media'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Media reordered successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reorder media');
    }
  });
};

// Shopify Preview hook
export const useShopifyPreview = () => {
  return useMutation({
    mutationFn: ({ productId, storeId }) => 
      productApi.getShopifyPreview(productId, storeId),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate preview');
    }
  });
};

// ==============================================
// SHOPIFY SYNC HOOKS
// ==============================================



export const useUpdateInStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, storeId }) => 
      shopifySyncApi.updateInStore(productId, storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      toast.success('Product updated in store successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  });
};

export const useDeleteFromStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, storeId }) => 
      shopifySyncApi.deleteFromStore(productId, storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      toast.success('Product deleted from store successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Deletion failed');
    }
  });
};

export const useGetFromStore = () => {
  return useMutation({
    mutationFn: ({ productId, storeId }) => 
      shopifySyncApi.getFromStore(productId, storeId),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to fetch from store');
    }
  });
};

// Multi-store convenience hooks
export const useSyncToMultipleStores = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, storeIds }) => 
      shopifySyncApi.syncToMultipleStores(productId, storeIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      toast.success(`Product synced to ${data.successCount} stores`);
      if (data.failedCount > 0) {
        toast.error(`Failed to sync to ${data.failedCount} stores`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Multi-store sync failed');
    }
  });
};

export const useSyncToAllStores = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId) => shopifySyncApi.syncToAllStores(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      toast.success(`Product synced to ${data.successCount} stores`);
      if (data.failedCount > 0) {
        toast.error(`Failed to sync to ${data.failedCount} stores`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Sync to all stores failed');
    }
  });
};

// Bulk operations hooks
export const useBulkSyncProducts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productIds, storeIds }) => 
      shopifySyncApi.bulkSyncProducts(productIds, storeIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      toast.success(`Bulk sync completed: ${data.successCount} products synced`);
      if (data.failedCount > 0) {
        toast.error(`Failed to sync ${data.failedCount} products`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Bulk sync failed');
    }
  });
};

export const useBulkUpdateProducts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productIds, storeIds }) => 
      shopifySyncApi.bulkUpdateProducts(productIds, storeIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      toast.success(`Bulk update completed: ${data.successCount} products updated`);
      if (data.failedCount > 0) {
        toast.error(`Failed to update ${data.failedCount} products`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Bulk update failed');
    }
  });
};

// Sync status and health hooks
export const useSyncStatus = (productId) => {
  return useQuery({
    queryKey: ['sync-status', productId],
    queryFn: () => shopifySyncApi.getSyncStatus(productId),
    enabled: !!productId,
    refetchInterval: (data) => {
      // Stop polling if all syncs are complete
      const hasActiveSyncs = data?.some(sync => 
        sync.status === 'pending' || sync.status === 'syncing'
      );
      return hasActiveSyncs ? 2000 : false;
    }
  });
};

export const useSyncHealth = () => {
  return useQuery({
    queryKey: ['sync-health'],
    queryFn: shopifySyncApi.getSyncHealth,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// ==============================================
// STORE MANAGEMENT HOOKS
// ==============================================

export const useConnectedStores = () => {
  return useQuery({
    queryKey: ['connected-stores'],
    queryFn: storeApi.getConnectedStores,
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => {
      // Format stores for easier use in components
      return data.map(storeApi.formatStoreForDisplay);
    }
  });
};

export const useStoreDetails = (storeId) => {
  return useQuery({
    queryKey: ['stores', storeId],
    queryFn: () => storeApi.getStoreDetails(storeId),
    enabled: !!storeId,
    select: storeApi.formatStoreForDisplay
  });
};

export const useStoreAnalytics = (storeId) => {
  return useQuery({
    queryKey: ['stores', storeId, 'analytics'],
    queryFn: () => storeApi.getStoreAnalytics(storeId),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDisconnectStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: storeApi.disconnectStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected-stores'] });
      toast.success('Store disconnected successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to disconnect store');
    }
  });
};

// ==============================================
// COLLECTION HOOKS
// ==============================================

export const useStoreCollections = (storeId, options = {}) => {
  return useQuery({
    queryKey: ['collections', storeId, options],
    queryFn: () => fetchStoreCollections(storeId, options),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => {
      // Format collections for easier use in components
      return formatCollectionsForDisplay(data?.data?.collections || []);
    }
  });
};

export const useCollection = (storeId, collectionId) => {
  return useQuery({
    queryKey: ['collections', storeId, collectionId],
    queryFn: () => collectionApi.getCollection(storeId, collectionId),
    enabled: !!storeId && !!collectionId,
    select: collectionApi.formatCollectionForDisplay
  });
};

export const useAddProductToCollection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ storeId, collectionId, shopifyProductId }) => 
      collectionApi.addProductToCollection(storeId, collectionId, shopifyProductId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['collections', variables.storeId] 
      });
      toast.success('Product added to collection successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add product to collection');
    }
  });
};

export const useRemoveProductFromCollection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ storeId, collectionId, shopifyProductId }) => 
      collectionApi.removeProductFromCollection(storeId, collectionId, shopifyProductId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['collections', variables.storeId] 
      });
      toast.success('Product removed from collection successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove product from collection');
    }
  });
};

// Store selection utilities hook
export const useStoreSelection = () => {
  const { data: stores = [], isLoading } = useConnectedStores();
  
  return {
    stores,
    isLoading,
    availableStores: stores.filter(storeApi.isStoreAvailableForSync),
    storeOptions: storeApi.getStoreSelectOptions(stores),
    formatStoreForDisplay: storeApi.formatStoreForDisplay,
    isStoreAvailable: storeApi.isStoreAvailableForSync
  };
};

/**
 * Collection selection hook for store-specific collections
 * @param {string} storeId - Store ID to fetch collections for
 * @returns {Object} Collection data and utilities
 */
export const useCollectionSelection = (storeId) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch collections for the specific store
  const { 
    data: collectionsResponse, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['collections', storeId],
    queryFn: () => fetchStoreCollections(storeId),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });

  const collections = collectionsResponse?.data?.collections || [];
  
  // Format collections for display
  const formattedCollections = useMemo(() => 
    formatCollectionsForDisplay(collections), 
    [collections]
  );

  // Create collection options for selectors
  const collectionOptions = useMemo(() => 
    createCollectionSelectOptions(formattedCollections), 
    [formattedCollections]
  );

  // Search collections (client-side filtering)
  const searchCollections = useCallback((term) => {
    return filterCollectionsBySearch(formattedCollections, term);
  }, [formattedCollections]);

  return {
    collections: formattedCollections,
    isLoading,
    error,
    collectionOptions,
    searchCollections,
    setSearchTerm,
    searchTerm,
    // Utility methods
    formatCollections: formatCollectionsForDisplay,
    createOptions: createCollectionSelectOptions,
    filterBySearch: filterCollectionsBySearch
  };
};

// Product sync hooks for individual stores
export const useSyncToStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, storeId }) => 
      productApi.syncToStore(productId, storeId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products'] 
      });
      toast.success('Product synced to store successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to sync product to store');
    }
  });
};

// Bulk sync product to all stores
export const useBulkSyncProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId) => 
      productApi.bulkSync(productId),
    onSuccess: (data, productId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', productId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products'] 
      });
      toast.success('Product synced to all stores successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to sync product to all stores');
    }
  });
};
