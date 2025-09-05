import { api } from '@/lib/api.js';

/**
 * Collection Management API
 * Matches backend collectionController.js routes
 * All collection operations for Shopify stores
 */
export const collectionApi = {
  // ==============================================
  // COLLECTION OPERATIONS
  // ==============================================

  /**
   * Get collections for a specific store
   * GET /api/collections/stores/:storeId/collections
   */
  getStoreCollections: async (storeId, params = {}) => {
    const response = await api.get(`/api/collections/stores/${storeId}/collections`, { params });
    return response.data;
  },

  /**
   * Get collection details
   * GET /api/collections/stores/:storeId/collections/:collectionId
   */
  getCollectionDetails: async (storeId, collectionId) => {
    const response = await api.get(`/api/collections/stores/${storeId}/collections/${collectionId}`);
    return response.data;
  },

  /**
   * Create new collection
   * POST /api/collections/stores/:storeId/collections
   */
  createCollection: async (storeId, collectionData) => {
    const response = await api.post(`/api/collections/stores/${storeId}/collections`, collectionData);
    return response.data;
  },

  /**
   * Search collections in a store
   * GET /api/collections/stores/:storeId/collections/search
   */
  searchCollections: async (storeId, searchQuery, options = {}) => {
    const params = { query: searchQuery, ...options };
    const response = await api.get(`/api/collections/stores/${storeId}/collections/search`, { params });
    return response.data;
  },

  // ==============================================
  // UTILITY FUNCTIONS
  // ==============================================

  /**
   * Format collections for display in components
   */
  formatCollectionsForDisplay: (collections) => {
    return collections.map(collection => ({
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      productsCount: collection.productsCount || 0,
      description: collection.description,
      image: collection.image,
      updatedAt: collection.updatedAt,
      // For display in selectors
      label: collection.title,
      value: collection.id,
      subtitle: `${collection.productsCount || 0} products`
    }));
  },

  /**
   * Create collection selection options for dropdowns
   */
  getCollectionSelectOptions: (collections) => {
    return collectionApi.formatCollectionsForDisplay(collections).map(collection => ({
      value: collection.id,
      label: collection.title,
      subtitle: collection.subtitle
    }));
  },

  /**
   * Filter collections by search term (client-side)
   */
  filterCollectionsBySearch: (collections, searchTerm) => {
    if (!searchTerm?.trim()) return collections;
    
    const term = searchTerm.toLowerCase();
    return collections.filter(collection => 
      collection.title?.toLowerCase().includes(term) ||
      collection.handle?.toLowerCase().includes(term)
    );
  }
};
