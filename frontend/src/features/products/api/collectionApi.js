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
   * GET /api/collections/:storeId
   */
  getStoreCollections: async (storeId, params = {}) => {
    const response = await api.get(`/api/collections/${storeId}`, { params });
    return response.data;
  },

  /**
   * Get collection details
   * GET /api/collections/:storeId/:collectionId
   */
  getCollectionDetails: async (storeId, collectionId) => {
    const response = await api.get(`/api/collections/${storeId}/${collectionId}`);
    return response.data;
  },

  /**
   * Create new collection
   * POST /api/collections/:storeId
   */
  createCollection: async (storeId, collectionData) => {
    const response = await api.post(`/api/collections/${storeId}`, collectionData);
    return response.data;
  },

  /**
   * Search collections in a store
   * GET /api/collections/:storeId
   */
  searchCollections: async (storeId, searchQuery, options = {}) => {
    const params = { search: searchQuery, ...options };
    const response = await api.get(`/api/collections/${storeId}`, { params });
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
