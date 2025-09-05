import { api } from '@/lib/api.js';

/**
 * Inventory Management API
 * Matches backend inventoryController.js routes
 * All inventory assignment, tracking, and location operations
 */
export const inventoryApi = {
  // ==============================================
  // STORE LOCATIONS
  // ==============================================

  /**
   * Get store locations for inventory management
   * GET /api/inventory/stores/locations
   */
  getStoreLocations: async () => {
  const response = await api.get('/api/inventory/stores/locations');
  return response.data?.data;
  },

  // ==============================================
  // INVENTORY ASSIGNMENT
  // ==============================================

  /**
   * Assign inventory from master product to store
   * POST /api/inventory/products/:productId/stores/:storeId/inventory/assign
   */
  assignInventoryToStore: async (productId, storeId, inventoryData) => {
  const response = await api.post(
      `/api/inventory/products/${productId}/stores/${storeId}/inventory/assign`,
      inventoryData
    );
  return response.data?.data;
  },

  /**
   * Sync inventory from Shopify store
   * POST /api/inventory/products/:productId/stores/:storeId/inventory/sync
   */
  syncInventoryFromShopify: async (productId, storeId) => {
  const response = await api.post(
      `/api/inventory/products/${productId}/stores/${storeId}/inventory/sync`
    );
  return response.data?.data;
  },

  // ==============================================
  // INVENTORY TRACKING
  // ==============================================

  /**
   * Get inventory summary for a product
   * GET /api/inventory/products/:productId/inventory/summary
   */
  getInventorySummary: async (productId, storeId = null) => {
    const params = storeId ? { storeId } : {};
  const response = await api.get(
      `/api/inventory/products/${productId}/inventory/summary`,
      { params }
    );
  return response.data?.data;
  },

  /**
   * Get inventory history
   * GET /api/inventory/products/:productId/stores/:storeId/inventory/history
   */
  getInventoryHistory: async (productId, storeId, options = {}) => {
  const response = await api.get(
      `/api/inventory/products/${productId}/stores/${storeId}/inventory/history`,
      { params: options }
    );
  return response.data?.data;
  },

  // ==============================================
  // UTILITY FUNCTIONS
  // ==============================================

  /**
   * Format inventory data for display
   */
  formatInventoryForDisplay: (inventoryData) => {
    return {
      productId: inventoryData.productId,
      productTitle: inventoryData.productTitle,
      masterInventory: inventoryData.masterInventory || [],
      storeInventory: inventoryData.storeInventory || [],
      totalMasterQuantity: inventoryData.masterInventory?.reduce(
        (sum, variant) => sum + (variant.masterQuantity || 0), 0
      ) || 0,
      totalAssignedQuantity: inventoryData.storeInventory?.reduce(
        (sum, store) => sum + (store.totalAssigned || 0), 0
      ) || 0
    };
  },

  /**
   * Check if product has available inventory to assign
   */
  hasAvailableInventory: (inventoryData) => {
    const formatted = inventoryApi.formatInventoryForDisplay(inventoryData);
    return formatted.totalMasterQuantity > formatted.totalAssignedQuantity;
  },

  /**
   * Get available quantity for a specific variant
   */
  getAvailableQuantity: (inventoryData, variantIndex) => {
    const masterVariant = inventoryData.masterInventory?.[variantIndex];
    if (!masterVariant) return 0;

    const totalAssigned = inventoryData.storeInventory?.reduce((sum, store) => {
      const storeVariant = store.inventory?.find(inv => inv.variantIndex === variantIndex);
      return sum + (storeVariant?.assignedQuantity || 0);
    }, 0) || 0;

    return Math.max(0, (masterVariant.masterQuantity || 0) - totalAssigned);
  },

  // ==============================================
  // LIVE SHOPIFY INVENTORY
  // ==============================================

  /**
   * Get live Shopify inventory data
   * POST /api/inventory/live-inventory
   */
  getLiveShopifyInventory: async (productId, locationIds = null) => {
  const response = await api.post('/api/inventory/live-inventory', {
      productId,
      locationIds
    });
  return response.data?.data;
  },

  /**
   * Get inventory allocation recommendations
   * POST /api/inventory/allocation/recommendations
   */
  getInventoryAllocationRecommendations: async (productIds, allocationStrategy = 'balanced') => {
  const response = await api.post('/api/inventory/allocation/recommendations', {
      productIds,
      allocationStrategy
    });
  return response.data?.data;
  },

  /**
   * Get real-time allocation data
   * POST /api/inventory/allocation/real-time
   */
  getRealTimeAllocationData: async (inventoryItemIds, locationIds = null) => {
  const response = await api.post('/api/inventory/allocation/real-time', {
      inventoryItemIds,
      locationIds
    });
  return response.data?.data;
  }
};
