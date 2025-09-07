import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi.js';
import { toast } from 'react-hot-toast';

/**
 * Custom hooks for inventory management
 * Uses consolidated inventory API from backend inventoryController.js
 */

// ==============================================
// LOCATION MANAGEMENT HOOKS
// ==============================================

/**
 * Get store locations for specific store (used in store push)
 */
export const useStoreLocationsForStore = (storeId) => {
  return useQuery({
    queryKey: ['inventory', 'locations', storeId],
    queryFn: async () => {
      try {
        return await inventoryApi.getStoreLocations(storeId);
      } catch (e) {
        if (e?.response?.status === 401) {
          // No session; return empty list
          return { data: { locations: [] } };
        }
        throw e;
      }
    },
    enabled: !!storeId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
    select: (data) => {
      // Format locations for easier use in components
      return data?.data?.locations || data?.locations || [];
    }
  });
};

/**
 * Get store locations (legacy function for backward compatibility)
 * @deprecated Use useStoreLocationsForStore instead
 */
export const useStoreLocations = (storeId) => {
  return useStoreLocationsForStore(storeId);
};

// ==============================================
// INVENTORY ASSIGNMENT HOOKS
// ==============================================

/**
 * Assign inventory from master product to store
 */
export const useAssignInventoryToStore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, storeId, inventoryData }) => 
      inventoryApi.assignInventoryToStore(productId, storeId, inventoryData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['inventory', 'summary', variables.productId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['inventory', variables.productId, variables.storeId] 
      });
      toast.success('Inventory assigned to store successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign inventory');
    }
  });
};

/**
 * Sync inventory from Shopify store
 */
export const useSyncInventoryFromShopify = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, storeId }) => 
      inventoryApi.syncInventoryFromShopify(productId, storeId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['inventory', 'summary', variables.productId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['inventory', variables.productId, variables.storeId] 
      });
      toast.success('Inventory synced from Shopify successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to sync inventory');
    }
  });
};

// ==============================================
// INVENTORY DATA HOOKS
// ==============================================

/**
 * Get inventory summary for a product
 */
export const useInventorySummary = (productId, storeId = null, options = {}) => {
  return useQuery({
    queryKey: ['inventory', 'summary', productId, storeId],
    queryFn: async () => {
      try {
        return await inventoryApi.getInventorySummary(productId, storeId);
      } catch (e) {
        if (e?.response?.status === 404) {
          // No product mappings yet; return null summary
          return { data: { inventory: null } };
        }
        throw e;
      }
    },
    enabled: !!productId && (options.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
    select: (data) => {
      return data?.data?.inventory || null;
    }
  });
};

/**
 * Get inventory history for a product in a store
 */
export const useInventoryHistory = (productId, storeId, options = {}) => {
  return useQuery({
    queryKey: ['inventory', 'history', productId, storeId, options],
    queryFn: () => inventoryApi.getInventoryHistory(productId, storeId, options),
    enabled: !!productId && !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => {
      return data?.data?.history || [];
    }
  });
};

// ==============================================
// UTILITY HOOKS
// ==============================================

/**
 * Comprehensive inventory management hook for a specific product
 */
export const useProductInventoryManagement = (productId) => {
  const { data: inventorySummary, isLoading: summaryLoading } = useInventorySummary(productId);
  
  const assignInventory = useAssignInventoryToStore();
  const syncInventory = useSyncInventoryFromShopify();
  
  return {
    // Data
    inventorySummary,
    
    // Loading states
    isLoading: summaryLoading,
    summaryLoading,
    
    // Actions
    assignInventory: assignInventory.mutate,
    syncInventory: syncInventory.mutate,
    
    // Action states
    isAssigning: assignInventory.isPending,
    isSyncing: syncInventory.isPending,
    
    // Error states
    assignError: assignInventory.error,
    syncError: syncInventory.error
  };
};

/**
 * Store-specific inventory management hook
 */
export const useStoreInventoryManagement = (productId, storeId) => {
  const { data: storeSummary, isLoading: summaryLoading } = useInventorySummary(productId, storeId);
  const { data: history, isLoading: historyLoading } = useInventoryHistory(productId, storeId);
  
  const assignInventory = useAssignInventoryToStore();
  const syncInventory = useSyncInventoryFromShopify();
  
  return {
    // Data
    storeSummary,
    history,
    
    // Loading states
    isLoading: summaryLoading || historyLoading,
    summaryLoading,
    historyLoading,
    
    // Actions
    assignInventory: (inventoryData) => 
      assignInventory.mutate({ productId, storeId, inventoryData }),
    syncInventory: () => 
      syncInventory.mutate({ productId, storeId }),
    
    // Action states
    isAssigning: assignInventory.isPending,
    isSyncing: syncInventory.isPending,
    
    // Error states
    assignError: assignInventory.error,
    syncError: syncInventory.error
  };
};

/**
 * Hook for inventory location selection utilities - Enhanced for store-specific locations
 */
export const useLocationSelection = (storeId = null) => {
  // Use store-specific locations if storeId is provided, otherwise use generic locations
  const { data: locations = [], isLoading } = storeId 
    ? useStoreLocationsForStore(storeId)
    : { data: [], isLoading: false }; // No generic locations anymore
  
  return {
    locations,
    isLoading,
    
    // Utility functions
    getPrimaryLocation: () => locations.find(loc => 
      loc.isActive && loc.fulfillsOnlineOrders && loc.shipsInventory
    ) || locations.find(loc => loc.isActive) || locations[0],
    getLocationById: (locationId) => locations.find(loc => loc.id === locationId),
    
    // Location options for forms
    locationOptions: locations.map(location => ({
      value: location.id,
      label: location.name,
      subtitle: location.isActive 
        ? (location.fulfillsOnlineOrders ? 'Primary Location' : 'Active') 
        : 'Inactive',
      isPrimary: location.isActive && location.fulfillsOnlineOrders,
      disabled: !location.isActive
    })),
    
    // Format location for display
    formatLocationForDisplay: (location) => ({
      id: location.id,
      name: location.name,
      isPrimary: location.isActive && location.fulfillsOnlineOrders,
      isActive: location.isActive,
      fulfillsOnlineOrders: location.fulfillsOnlineOrders,
      shipsInventory: location.shipsInventory,
      displayName: location.isActive && location.fulfillsOnlineOrders 
        ? `${location.name} (Primary)` 
        : location.name
    }),

    // Check if store has any active locations
    hasActiveLocations: locations.some(loc => loc.isActive),
    activeLocationCount: locations.filter(loc => loc.isActive).length,
    totalLocationCount: locations.length
  };
};

// ==============================================
// LIVE SHOPIFY INVENTORY HOOKS
// ==============================================

/**
 * Get live Shopify inventory data for a product
 */
export const useLiveShopifyInventory = (productId, storeId, locationIds = null) => {
  return useQuery({
    queryKey: ['inventory', 'live', productId, storeId, locationIds],
    queryFn: () => inventoryApi.getLiveShopifyInventory(productId, storeId, locationIds),
    enabled: !!productId && !!storeId,
    staleTime: 30 * 1000, // 30 seconds (for real-time feel)
    refetchInterval: 60 * 1000, // Refetch every minute
    select: (data) => data?.data || null
  });
};

/**
 * Get inventory allocation recommendations
 */
export const useInventoryAllocationRecommendations = () => {
  return useMutation({
    mutationFn: ({ productIds, allocationStrategy = 'balanced' }) => 
      inventoryApi.getInventoryAllocationRecommendations(productIds, allocationStrategy),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate allocation recommendations');
    }
  });
};

/**
 * Get real-time allocation data for allocation dashboard
 */
export const useRealTimeAllocationData = (inventoryItemIds, locationIds = null) => {
  return useQuery({
    queryKey: ['inventory', 'real-time-allocation', inventoryItemIds, locationIds],
    queryFn: () => inventoryApi.getRealTimeAllocationData(inventoryItemIds, locationIds),
    enabled: !!inventoryItemIds && inventoryItemIds.length > 0,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    select: (data) => data?.data || null
  });
};

/**
 * Live inventory allocation management hook
 * Combines live data with allocation recommendations
 */
export const useLiveInventoryAllocation = (productId) => {
  const { data: liveInventory, isLoading: liveLoading } = useLiveShopifyInventory(productId);
  const getAllocationRecommendations = useInventoryAllocationRecommendations();
  
  // Extract inventory item IDs for real-time data
  const inventoryItemIds = liveInventory?.variants?.map(v => v.inventoryItemId).filter(Boolean) || [];
  const { data: realTimeData, isLoading: realTimeLoading } = useRealTimeAllocationData(inventoryItemIds);
  
  return {
    // Live data
    liveInventory,
    realTimeData,
    
    // Loading states
    isLoading: liveLoading || realTimeLoading,
    liveLoading,
    realTimeLoading,
    
    // Actions
    getRecommendations: (allocationStrategy = 'balanced') => 
      getAllocationRecommendations.mutate({
        productIds: [productId],
        allocationStrategy
      }),
    
    // Action states
    isGeneratingRecommendations: getAllocationRecommendations.isPending,
    recommendations: getAllocationRecommendations.data?.data?.recommendations || [],
    
    // Error states
    recommendationError: getAllocationRecommendations.error,
    
    // Computed data
    totalAvailableInventory: liveInventory?.totalInventory || 0,
    variantCount: liveInventory?.variants?.length || 0,
    locationCount: liveInventory?.variants?.[0]?.locationBreakdown?.length || 0
  };
};

/**
 * Multi-product allocation management hook
 */
export const useMultiProductAllocation = (productIds) => {
  const getAllocationRecommendations = useInventoryAllocationRecommendations();
  
  // Get live data for all products
  const liveQueries = productIds.map(productId => 
    useLiveShopifyInventory(productId)
  );
  
  const allInventoryItemIds = liveQueries
    .flatMap(query => query.data?.variants?.map(v => v.inventoryItemId) || [])
    .filter(Boolean);
    
  const { data: realTimeData, isLoading: realTimeLoading } = useRealTimeAllocationData(allInventoryItemIds);
  
  return {
    // Combined data
    liveInventoryData: liveQueries.map(query => query.data).filter(Boolean),
    realTimeData,
    
    // Loading states
    isLoading: liveQueries.some(query => query.isLoading) || realTimeLoading,
    
    // Actions
    getRecommendations: (allocationStrategy = 'balanced') => 
      getAllocationRecommendations.mutate({
        productIds,
        allocationStrategy
      }),
    
    // Action states and data
    isGeneratingRecommendations: getAllocationRecommendations.isPending,
    recommendations: getAllocationRecommendations.data?.data?.recommendations || [],
    recommendationError: getAllocationRecommendations.error,
    
    // Summary data
    totalProducts: productIds.length,
    totalInventoryValue: liveQueries.reduce((sum, query) => 
      sum + (query.data?.totalInventory || 0), 0
    )
  };
};

/**
 * Real-time inventory monitoring hook
 * For live dashboards and allocation interfaces
 */
export const useRealTimeInventoryMonitor = (config = {}) => {
  const { 
    productIds = [], 
    locationIds = [], 
    refreshInterval = 30000, // 30 seconds
    enableNotifications = false 
  } = config;
  
  const queryClient = useQueryClient();
  
  // Monitor multiple products
  const liveQueries = productIds.map(productId => 
    useLiveShopifyInventory(productId, locationIds)
  );
  
  // Force refresh function
  const forceRefresh = () => {
    liveQueries.forEach((_, index) => {
      queryClient.invalidateQueries({
        queryKey: ['inventory', 'live', productIds[index], locationIds]
      });
    });
  };
  
  return {
    // Data
    inventoryData: liveQueries.map(query => query.data).filter(Boolean),
    
    // Loading states
    isLoading: liveQueries.some(query => query.isLoading),
    
    // Actions
    forceRefresh,
    
    // Monitoring utilities
    getInventoryForProduct: (productId) => 
      liveQueries.find((_, index) => productIds[index] === productId)?.data,
    
    getInventoryAlerts: () => {
      // Generate alerts for low stock, etc.
      return liveQueries.flatMap((query, index) => {
        if (!query.data) return [];
        
        return query.data.variants.flatMap(variant => {
          const lowStockThreshold = 10; // Configure as needed
          const alerts = [];
          
          variant.locationBreakdown.forEach(location => {
            if (location.available <= lowStockThreshold) {
              alerts.push({
                type: 'low_stock',
                productId: productIds[index],
                variantId: variant.variantId,
                locationId: location.locationId,
                locationName: location.locationName,
                available: location.available,
                severity: location.available === 0 ? 'critical' : 'warning'
              });
            }
          });
          
          return alerts;
        });
      });
    },
    
    // Summary statistics
    getTotalInventoryAcrossProducts: () => 
      liveQueries.reduce((sum, query) => sum + (query.data?.totalInventory || 0), 0),
    
    getLocationInventorySummary: () => {
      const locationMap = new Map();
      
      liveQueries.forEach(query => {
        query.data?.variants?.forEach(variant => {
          variant.locationBreakdown?.forEach(location => {
            const existing = locationMap.get(location.locationId) || {
              locationId: location.locationId,
              locationName: location.locationName,
              totalInventory: 0,
              productCount: 0
            };
            
            existing.totalInventory += location.available;
            existing.productCount += 1;
            locationMap.set(location.locationId, existing);
          });
        });
      });
      
      return Array.from(locationMap.values());
    }
  };
};
