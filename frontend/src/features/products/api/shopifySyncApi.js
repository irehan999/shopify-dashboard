import { api } from '@/lib/api.js';

/**
 * Shopify GraphQL Sync API
 * Matches backend shopifyGraphQLRoutesNew.js exactly (8 routes)
 * All operations for syncing products to Shopify stores
 */
export const shopifySyncApi = {
  // ==============================================
  // INDIVIDUAL STORE OPERATIONS (4 routes)
  // ==============================================

  /**
   * Create product in specific store
   * POST /api/shopify-admin/products/:productId/stores/:storeId/create
   * @param {string} productId - Dashboard product ID
   * @param {string} storeId - Target store ID
   * @param {Object} [options] - Additional creation options
   * @returns {Promise<Object>} Created Shopify product data
   */
  createInStore: async (productId, storeId, options = {}) => {
    const response = await api.post(
      `/api/shopify-admin/products/${productId}/stores/${storeId}/create`,
      options
    );
    return response.data;
  },

  /**
   * Update product in specific store
   * PUT /api/shopify-admin/products/:productId/stores/:storeId/update
   * @param {string} productId - Dashboard product ID
   * @param {string} storeId - Target store ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated Shopify product data
   */
  updateInStore: async (productId, storeId, updateData) => {
    const response = await api.put(
      `/api/shopify-admin/products/${productId}/stores/${storeId}/update`,
      updateData
    );
    return response.data;
  },

  /**
   * Sync product to specific store (create or update)
   * POST /api/shopify-admin/products/:productId/stores/:storeId/sync
   * @param {string} productId - Dashboard product ID
   * @param {string} storeId - Target store ID
   * @param {Object} [syncOptions] - Sync configuration options
   * @param {boolean} [syncOptions.forceUpdate] - Force update even if no changes
   * @param {string[]} [syncOptions.fieldsToSync] - Specific fields to sync
   * @returns {Promise<Object>} Sync result with status
   */
  syncToStore: async (productId, storeId, syncOptions = {}) => {
    const response = await api.post(
      `/api/shopify-admin/products/${productId}/stores/${storeId}/sync`,
      syncOptions
    );
    return response.data;
  },

  /**
   * Delete product from specific store
   * DELETE /api/shopify-admin/products/:productId/stores/:storeId
   * @param {string} productId - Dashboard product ID
   * @param {string} storeId - Target store ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  deleteFromStore: async (productId, storeId) => {
    const response = await api.delete(
      `/api/shopify-admin/products/${productId}/stores/${storeId}`
    );
    return response.data;
  },

  // ==============================================
  // STORE DATA OPERATIONS (3 routes)
  // ==============================================

  /**
   * Get Shopify product data from store
   * GET /api/shopify-admin/products/:productId/stores/:storeId
   * @param {string} productId - Dashboard product ID
   * @param {string} storeId - Target store ID
   * @returns {Promise<Object>} Shopify product data
   */
  getStoreProduct: async (productId, storeId) => {
    const response = await api.get(
      `/api/shopify-admin/products/${productId}/stores/${storeId}`
    );
    return response.data;
  },

  /**
   * Get inventory data for product in store
   * GET /api/shopify-admin/products/:productId/stores/:storeId/inventory
   * @param {string} productId - Dashboard product ID
   * @param {string} storeId - Target store ID
   * @returns {Promise<Object>} Inventory levels and locations
   */
  getStoreInventory: async (productId, storeId) => {
    const response = await api.get(
      `/api/shopify-admin/products/${productId}/stores/${storeId}/inventory`
    );
    return response.data;
  },

  /**
   * Search products in specific store
   * GET /api/shopify-admin/stores/:storeId/products/search
   * @param {string} storeId - Store ID to search in
   * @param {Object} searchParams - Search parameters
   * @param {string} [searchParams.query] - Search query string
   * @param {number} [searchParams.limit] - Results limit
   * @param {string} [searchParams.status] - Product status filter
   * @returns {Promise<Object>} Search results
   */
  searchStoreProducts: async (storeId, searchParams = {}) => {
    const response = await api.get(
      `/api/shopify-admin/stores/${storeId}/products/search`,
      { params: searchParams }
    );
    return response.data;
  },

  // ==============================================
  // BULK OPERATIONS (1 route)
  // ==============================================

  /**
   * Bulk sync multiple products to store
   * POST /api/shopify-admin/stores/:storeId/products/bulk-sync
   * @param {string} storeId - Target store ID
   * @param {Object} bulkData - Bulk sync configuration
   * @param {string[]} bulkData.productIds - Array of product IDs to sync
   * @param {Object} [bulkData.options] - Bulk sync options
   * @param {boolean} [bulkData.options.forceUpdate] - Force update all
   * @param {string[]} [bulkData.options.fieldsToSync] - Fields to sync
   * @returns {Promise<Object>} Bulk sync results
   */
  bulkSyncToStore: async (storeId, bulkData) => {
    const response = await api.post(
      `/api/shopify-admin/stores/${storeId}/products/bulk-sync`,
      bulkData
    );
    return response.data;
  },

  // ==============================================
  // MULTI-STORE CONVENIENCE METHODS
  // ==============================================

  /**
   * Sync product to multiple stores
   * Convenience method that calls individual store sync endpoints
   * @param {string} productId - Dashboard product ID
   * @param {string[]} storeIds - Array of store IDs
   * @param {Object} [options] - Sync options
   * @returns {Promise<Object[]>} Array of sync results
   */
  syncToMultipleStores: async (productId, storeIds, options = {}) => {
    const syncPromises = storeIds.map(storeId => 
      shopifySyncApi.syncToStore(productId, storeId, options)
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
   * Create product in multiple stores
   * Convenience method that calls individual store create endpoints
   * @param {string} productId - Dashboard product ID
   * @param {string[]} storeIds - Array of store IDs
   * @param {Object} [options] - Creation options
   * @returns {Promise<Object[]>} Array of creation results
   */
  createInMultipleStores: async (productId, storeIds, options = {}) => {
    const createPromises = storeIds.map(storeId => 
      shopifySyncApi.createInStore(productId, storeId, options)
    );
    
    const results = await Promise.allSettled(createPromises);
    
    return results.map((result, index) => ({
      storeId: storeIds[index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  },

  /**
   * Delete product from multiple stores
   * Convenience method that calls individual store delete endpoints
   * @param {string} productId - Dashboard product ID
   * @param {string[]} storeIds - Array of store IDs
   * @returns {Promise<Object[]>} Array of deletion results
   */
  deleteFromMultipleStores: async (productId, storeIds) => {
    const deletePromises = storeIds.map(storeId => 
      shopifySyncApi.deleteFromStore(productId, storeId)
    );
    
    const results = await Promise.allSettled(deletePromises);
    
    return results.map((result, index) => ({
      storeId: storeIds[index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  },

  // ==============================================
  // HEALTH CHECK
  // ==============================================

  /**
   * Check Shopify GraphQL service health
   * GET /api/shopify/health
   * @returns {Promise<Object>} Service health status
   */
  checkHealth: async () => {
    const response = await api.get('/api/shopify/health');
    return response.data;
  }
};
