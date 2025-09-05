import { api } from '@/lib/api.js';

/**
 * Shopify Sync API
 * Matches backend shopifyGraphQLControllerNew.js routes exactly
 * All product sync operations between dashboard and Shopify stores
 */
export const shopifySyncApi = {
  // ==============================================
  // MAIN SYNC OPERATIONS (matches backend routes)
  // ==============================================

  /**
   * Sync product to specific store (create or update)
   * POST /api/shopify-admin/products/sync
   */
  syncProduct: async (productId, storeId, syncOptions = {}) => {
    const response = await api.post('/api/shopify-admin/products/sync', {
      productId,
      storeId,
      forceSync: syncOptions.forceSync || false,
      collectionsToJoin: syncOptions.collectionsToJoin || [],
      inventoryData: syncOptions.inventoryData || {},
      locationId: syncOptions.locationId || null
    });
    return response.data;
  },

  /**
   * Create product in specific store
   * POST /api/shopify-admin/products/:productId/stores/:storeId/create
   */
  createProduct: async (productId, storeId, options = {}) => {
    const response = await api.post(
      `/api/shopify-admin/products/${productId}/stores/${storeId}/create`,
      options
    );
    return response.data;
  },

  /**
   * Update product in specific store
   * PUT /api/shopify-admin/products/:productId/stores/:storeId/update
   */
  updateProduct: async (productId, storeId, updateData) => {
    const response = await api.put(
      `/api/shopify-admin/products/${productId}/stores/${storeId}/update`,
      updateData
    );
    return response.data;
  },

  /**
   * Delete product from specific store
   * DELETE /api/shopify-admin/products/:productId/stores/:storeId
   */
  deleteProduct: async (productId, storeId) => {
    const response = await api.delete(
      `/api/shopify-admin/products/${productId}/stores/${storeId}`
    );
    return response.data;
  },

  /**
   * Get Shopify product data from store
   * GET /api/shopify-admin/products/:productId/stores/:storeId
   */
  getShopifyProduct: async (productId, storeId) => {
    const response = await api.get(
      `/api/shopify-admin/products/${productId}/stores/${storeId}`
    );
    return response.data;
  },

  /**
   * Search products in specific store
   * GET /api/shopify-admin/stores/:storeId/products/search
   */
  searchStoreProducts: async (storeId, searchParams = {}) => {
    const response = await api.get(
      `/api/shopify-admin/stores/${storeId}/products/search`,
      { params: searchParams }
    );
    return response.data;
  },

  /**
   * Get inventory data for product in store
   * GET /api/shopify-admin/products/:productId/stores/:storeId/inventory
   */
  getProductInventory: async (productId, storeId) => {
    const response = await api.get(
      `/api/shopify-admin/products/${productId}/stores/${storeId}/inventory`
    );
    return response.data;
  },

  /**
   * Get sync status for a product across all stores
   * GET /api/shopify-admin/products/:productId/sync-status
   */
  getSyncStatus: async (productId) => {
    const response = await api.get(
      `/api/shopify-admin/products/${productId}/sync-status`
    );
    return response.data;
  },

  /**
   * Bulk sync multiple products to store
   * POST /api/shopify-admin/stores/:storeId/products/bulk-sync
   */
  bulkSyncProducts: async (storeId, productIds, options = {}) => {
    const response = await api.post(
      `/api/shopify-admin/stores/${storeId}/products/bulk-sync`,
      { productIds, options }
    );
    return response.data;
  },

  // ==============================================
  // CONVENIENCE METHODS
  // ==============================================

  /**
   * Sync product to multiple stores
   */
  syncToMultipleStores: async (productId, storeIds, options = {}) => {
    const syncPromises = storeIds.map(storeId => 
      shopifySyncApi.syncProduct(productId, storeId, options)
    );
    
    const results = await Promise.allSettled(syncPromises);
    
    return results.map((result, index) => ({
      storeId: storeIds[index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  },

  /**
   * Format sync options for the backend
   */
  formatSyncOptions: (options) => {
    return {
      forceSync: options.forceUpdate || false,
      collectionsToJoin: options.selectedCollections || [],
      inventoryData: options.inventoryAssignments || {},
      locationId: options.selectedLocation || null
    };
  }
};
