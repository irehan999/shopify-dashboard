import { api as apiClient } from '@/lib/api.js';

/**
 * Collection API Client
 * ====================
 * 
 * API client for collection operations using backend controllers
 * that interface with Shopify GraphQL API through the established
 * query helper system.
 * 
 * Backend Routes:
 * - GET /api/collections/:storeId - Get collections for specific store
 * - GET /api/collections/:storeId/:collectionId - Get collection details
 * - POST /api/collections/:storeId - Create collection
 * - POST /api/collections/:storeId/:collectionId/products - Add products
 * - DELETE /api/collections/:storeId/:collectionId/products - Remove products
 * - GET /api/collections/search - Search across all stores
 */

/**
 * Fetch collections for a specific store
 * @param {string} storeId - MongoDB store ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Collections response
 */
export const fetchStoreCollections = async (storeId, params = {}) => {
  const queryParams = new URLSearchParams({
    first: params.first || 50,
    ...(params.after && { after: params.after }),
    ...(params.search && { search: params.search }),
    ...(params.query && { query: params.query })
  });

  const response = await apiClient.get(`/collections/${storeId}?${queryParams}`);
  return response.data;
};

/**
 * Fetch detailed information about a specific collection
 * @param {string} storeId - MongoDB store ID
 * @param {string} collectionId - Shopify collection ID
 * @returns {Promise<Object>} Collection details response
 */
export const fetchCollectionDetails = async (storeId, collectionId) => {
  const response = await apiClient.get(`/collections/${storeId}/${collectionId}`);
  return response.data;
};

/**
 * Create a new collection in a specific store
 * @param {string} storeId - MongoDB store ID
 * @param {Object} collectionData - Collection creation data
 * @returns {Promise<Object>} Created collection response
 */
export const createStoreCollection = async (storeId, collectionData) => {
  const response = await apiClient.post(`/collections/${storeId}`, collectionData);
  return response.data;
};

/**
 * Add products to a specific collection
 * @param {string} storeId - MongoDB store ID
 * @param {string} collectionId - Shopify collection ID
 * @param {Array<string>} productIds - Array of Shopify product IDs
 * @returns {Promise<Object>} Operation result
 */
export const addProductsToCollection = async (storeId, collectionId, productIds) => {
  const response = await apiClient.post(`/collections/${storeId}/${collectionId}/products`, {
    productIds
  });
  return response.data;
};

/**
 * Remove products from a specific collection
 * @param {string} storeId - MongoDB store ID
 * @param {string} collectionId - Shopify collection ID
 * @param {Array<string>} productIds - Array of Shopify product IDs
 * @returns {Promise<Object>} Operation result
 */
export const removeProductsFromCollection = async (storeId, collectionId, productIds) => {
  const response = await apiClient.delete(`/collections/${storeId}/${collectionId}/products`, {
    data: { productIds }
  });
  return response.data;
};

/**
 * Search collections across all connected stores
 * @param {string} query - Search term
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Object>} Search results
 */
export const searchCollectionsAcrossStores = async (query, limit = 20) => {
  const queryParams = new URLSearchParams({
    query,
    limit: limit.toString()
  });

  const response = await apiClient.get(`/collections/search?${queryParams}`);
  return response.data;
};

// ==============================================
// UTILITY FUNCTIONS FOR FRONTEND
// ==============================================

/**
 * Format collections data for frontend display
 * @param {Array} collections - Raw collections array
 * @returns {Array} Formatted collections
 */
export const formatCollectionsForDisplay = (collections) => {
  return collections.map(collection => ({
    id: collection.id,
    displayName: collection.title || collection.displayName,
    title: collection.title,
    handle: collection.handle,
    productsCount: collection.productsCount || 0,
    isSmartCollection: collection.isSmartCollection || false,
    image: collection.image,
    updatedAt: collection.updatedAt,
    store: collection.store
  }));
};

/**
 * Filter collections by search term (client-side)
 * @param {Array} collections - Collections array
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered collections
 */
export const filterCollectionsBySearch = (collections, searchTerm) => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return collections;
  }

  const term = searchTerm.toLowerCase();
  return collections.filter(collection => 
    collection.title?.toLowerCase().includes(term) ||
    collection.displayName?.toLowerCase().includes(term) ||
    collection.handle?.toLowerCase().includes(term)
  );
};

/**
 * Sort collections by various criteria
 * @param {Array} collections - Collections array
 * @param {string} sortBy - Sort criteria ('title', 'productsCount', 'updatedAt')
 * @param {string} order - Sort order ('asc', 'desc')
 * @returns {Array} Sorted collections
 */
export const sortCollections = (collections, sortBy = 'title', order = 'asc') => {
  const sorted = [...collections].sort((a, b) => {
    let valueA, valueB;

    switch (sortBy) {
      case 'productsCount':
        valueA = a.productsCount || 0;
        valueB = b.productsCount || 0;
        break;
      case 'updatedAt':
        valueA = new Date(a.updatedAt || 0);
        valueB = new Date(b.updatedAt || 0);
        break;
      case 'title':
      default:
        valueA = (a.title || a.displayName || '').toLowerCase();
        valueB = (b.title || b.displayName || '').toLowerCase();
        break;
    }

    if (valueA < valueB) return order === 'asc' ? -1 : 1;
    if (valueA > valueB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

/**
 * Create collection selection options for dropdowns
 * @param {Array} collections - Collections array
 * @returns {Array} Options for select components
 */
export const createCollectionSelectOptions = (collections) => {
  return collections.map(collection => ({
    value: collection.id,
    label: collection.title || collection.displayName,
    subtitle: `${collection.productsCount || 0} products`,
    isSmartCollection: collection.isSmartCollection,
    store: collection.store
  }));
};

// Legacy API object for backward compatibility
export const collectionApi = {
  getStoreCollections: fetchStoreCollections,
  getCollection: fetchCollectionDetails,
  addProductToCollection: (storeId, collectionId, productId) => 
    addProductsToCollection(storeId, collectionId, [productId]),
  removeProductFromCollection: (storeId, collectionId, productId) => 
    removeProductsFromCollection(storeId, collectionId, [productId]),
  formatCollectionForDisplay: (collection) => formatCollectionsForDisplay([collection])[0],
  getCollectionSelectOptions: createCollectionSelectOptions,
  searchCollections: filterCollectionsBySearch
};
