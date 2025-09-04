import { api } from '@/lib/api.js';

/**
 * Dashboard Product API
 * Matches backend productRoutesNew.js exactly (16 routes)
 * All operations for managing products in the dashboard
 */
export const productApi = {
  // ==============================================
  // CORE PRODUCT OPERATIONS (6 routes)
  // ==============================================

  /**
   * Create new product in dashboard
   * POST /api/products
   * @param {Object} productData - Product data with optional media files
   * @param {File[]} [media] - Optional media files to upload
   * @returns {Promise<Object>} Created product with ID
   */
  create: async (productData, media = []) => {
    const formData = new FormData();
    
    // Append product data as JSON
    formData.append('productData', JSON.stringify(productData));
    
    // Append media files if provided
    media.forEach((file, index) => {
      formData.append('media', file);
    });

    const response = await api.post('/api/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Get all user's products with filtering
   * GET /api/products
   * @param {Object} params - Query parameters for filtering
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=20] - Items per page
   * @param {string} [params.status] - Product status filter
   * @param {string} [params.vendor] - Vendor filter
   * @param {string} [params.productType] - Product type filter
   * @param {string} [params.tags] - Tags filter (comma-separated)
   * @param {string} [params.search] - Search term
   * @param {string} [params.category] - Category filter
   * @param {string} [params.syncStatus] - Sync status filter
   * @param {boolean} [params.hasImages] - Filter by media presence
   * @param {string} [params.sortBy] - Sort field
   * @param {string} [params.sortOrder] - Sort order (asc/desc)
   * @returns {Promise<Object>} Paginated products list
   */
  getAll: async (params = {}) => {
    const response = await api.get('/api/products', { params });
    return response.data;
  },

  /**
   * Get single product by ID
   * GET /api/products/:id
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Product details
   */
  getById: async (id) => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  },

  /**
   * Update existing product
   * PUT /api/products/:id
   * @param {string} id - Product ID
   * @param {Object} productData - Updated product data
   * @param {File[]} [media] - Optional new media files
   * @returns {Promise<Object>} Updated product
   */
  update: async (id, productData, media = []) => {
    const formData = new FormData();
    
    formData.append('productData', JSON.stringify(productData));
    
    media.forEach((file) => {
      formData.append('media', file);
    });

    const response = await api.put(`/api/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Duplicate existing product
   * POST /api/products/:id/duplicate
   * @param {string} id - Product ID to duplicate
   * @param {Object} options - Duplication options
   * @param {string} [options.title] - New title for duplicate
   * @param {string} [options.handle] - New handle for duplicate
   * @returns {Promise<Object>} Duplicated product
   */
  duplicate: async (id, options = {}) => {
    const response = await api.post(`/api/products/${id}/duplicate`, options);
    return response.data;
  },

  /**
   * Delete product (only if not synced to stores)
   * DELETE /api/products/:id
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  delete: async (id) => {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  },

  // ==============================================
  // PRODUCT OPTIONS MANAGEMENT (3 routes)
  // ==============================================

  /**
   * Add product option (Color, Size, etc.)
   * POST /api/products/:id/options
   * @param {string} productId - Product ID
   * @param {Object} optionData - Option data
   * @param {string} optionData.name - Option name (e.g., "Color")
   * @param {Array} optionData.optionValues - Array of option values
   * @returns {Promise<Object>} Updated product with new option
   */
  addOption: async (productId, optionData) => {
    const response = await api.post(`/api/products/${productId}/options`, optionData);
    return response.data;
  },

  /**
   * Update product option
   * PUT /api/products/:id/options/:optionIndex
   * @param {string} productId - Product ID
   * @param {number} optionIndex - Option index to update
   * @param {Object} optionData - Updated option data
   * @returns {Promise<Object>} Updated product
   */
  updateOption: async (productId, optionIndex, optionData) => {
    const response = await api.put(`/api/products/${productId}/options/${optionIndex}`, optionData);
    return response.data;
  },

  /**
   * Delete product option
   * DELETE /api/products/:id/options/:optionIndex
   * @param {string} productId - Product ID
   * @param {number} optionIndex - Option index to delete
   * @returns {Promise<Object>} Updated product
   */
  deleteOption: async (productId, optionIndex) => {
    const response = await api.delete(`/api/products/${productId}/options/${optionIndex}`);
    return response.data;
  },

  // ==============================================
  // PRODUCT VARIANTS MANAGEMENT (3 routes)
  // ==============================================

  /**
   * Add product variant
   * POST /api/products/:id/variants
   * @param {string} productId - Product ID
   * @param {Object} variantData - Variant data
   * @returns {Promise<Object>} Updated product with new variant
   */
  addVariant: async (productId, variantData) => {
    const response = await api.post(`/api/products/${productId}/variants`, variantData);
    return response.data;
  },

  /**
   * Update product variant
   * PUT /api/products/:id/variants/:variantIndex
   * @param {string} productId - Product ID
   * @param {number} variantIndex - Variant index to update
   * @param {Object} variantData - Updated variant data
   * @returns {Promise<Object>} Updated product
   */
  updateVariant: async (productId, variantIndex, variantData) => {
    const response = await api.put(`/api/products/${productId}/variants/${variantIndex}`, variantData);
    return response.data;
  },

  /**
   * Delete product variant
   * DELETE /api/products/:id/variants/:variantIndex
   * @param {string} productId - Product ID
   * @param {number} variantIndex - Variant index to delete
   * @returns {Promise<Object>} Updated product
   */
  deleteVariant: async (productId, variantIndex) => {
    const response = await api.delete(`/api/products/${productId}/variants/${variantIndex}`);
    return response.data;
  },

  // ==============================================
  // MEDIA MANAGEMENT (3 routes)
  // ==============================================

  /**
   * Upload media files to product
   * POST /api/products/:id/media
   * @param {string} productId - Product ID
   * @param {File[]} mediaFiles - Media files to upload (max 10)
   * @returns {Promise<Object>} Updated product with new media
   */
  uploadMedia: async (productId, mediaFiles) => {
    const formData = new FormData();
    
    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    const response = await api.post(`/api/products/${productId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Delete media from product
   * DELETE /api/products/:id/media/:mediaIndex
   * @param {string} productId - Product ID
   * @param {number} mediaIndex - Media index to delete
   * @returns {Promise<Object>} Updated product
   */
  deleteMedia: async (productId, mediaIndex) => {
    const response = await api.delete(`/api/products/${productId}/media/${mediaIndex}`);
    return response.data;
  },

  /**
   * Reorder product media
   * PUT /api/products/:id/media/reorder
   * @param {string} productId - Product ID
   * @param {number[]} mediaOrder - Array of media indices in new order
   * @returns {Promise<Object>} Updated product with reordered media
   */
  reorderMedia: async (productId, mediaOrder) => {
    const response = await api.put(`/api/products/${productId}/media/reorder`, { mediaOrder });
    return response.data;
  },

  // ==============================================
  // SHOPIFY INTEGRATION (1 route)
  // ==============================================

  /**
   * Preview product in Shopify GraphQL format
   * GET /api/products/:id/shopify-preview
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Shopify-formatted product data
   */
  getShopifyPreview: async (productId) => {
    const response = await api.get(`/api/products/${productId}/shopify-preview`);
    return response.data;
  },

  // ==============================================
  // STORE SYNC OPERATIONS (Phase 4)
  // ==============================================

  /**
   * Sync product to specific store
   * POST /api/products/:id/sync/:storeId
   * @param {string} productId - Product ID
   * @param {string} storeId - Store ID to sync to
   * @returns {Promise<Object>} Sync result
   */
  syncToStore: async (productId, storeId) => {
    const response = await api.post(`/api/products/${productId}/sync/${storeId}`);
    return response.data;
  },

  /**
   * Bulk sync product to all connected stores
   * POST /api/products/:id/bulk-sync
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Bulk sync result
   */
  bulkSync: async (productId) => {
    const response = await api.post(`/api/products/${productId}/bulk-sync`);
    return response.data;
  }
};
