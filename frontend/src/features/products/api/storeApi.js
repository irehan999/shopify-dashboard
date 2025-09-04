import { api } from '@/lib/api.js';

/**
 * Store Management API
 * Leverages existing Shopify store functionality
 * Used by product features to get store information for sync operations
 */
export const storeApi = {
  // ==============================================
  // STORE LISTING & DETAILS
  // ==============================================

  /**
   * Get all connected stores
   * Uses existing shopify feature endpoint
   * @returns {Promise<Object[]>} Array of connected stores
   */
  getConnectedStores: async () => {
    const response = await api.get('/api/shopify/stores');
    return response.data.data || response.data;
  },

  /**
   * Get store details by ID
   * @param {string} storeId - Store ID
   * @returns {Promise<Object>} Store details
   */
  getStoreDetails: async (storeId) => {
    const response = await api.get(`/api/shopify/stores/${storeId}`);
    return response.data.data || response.data;
  },

  /**
   * Get store analytics
   * @param {string} storeId - Store ID
   * @returns {Promise<Object>} Store analytics data
   */
  getStoreAnalytics: async (storeId) => {
    const response = await api.get(`/api/shopify/stores/${storeId}/analytics`);
    return response.data.data || response.data;
  },

  // ==============================================
  // STORE CONNECTION MANAGEMENT
  // ==============================================

  /**
   * Initiate OAuth flow for new store
   * @param {string} shopDomain - Shop domain (e.g., 'mystore.myshopify.com')
   * @returns {Promise<void>} Redirects to OAuth flow
   */
  initiateConnection: async (shopDomain) => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const oauthUrl = `${backendUrl}/api/shopify/auth?shop=${encodeURIComponent(shopDomain)}`;
    
    // Direct redirect to backend OAuth endpoint
    window.location.href = oauthUrl;
    
    return { success: true };
  },

  /**
   * Link store to current user using token from OAuth callback
   * @param {string} token - OAuth callback token
   * @returns {Promise<Object>} Link result
   */
  linkStore: async (token) => {
    const response = await api.post('/api/shopify/link-store', { token });
    return response.data;
  },

  /**
   * Disconnect store
   * @param {string} storeId - Store ID to disconnect
   * @returns {Promise<Object>} Disconnection result
   */
  disconnectStore: async (storeId) => {
    const response = await api.delete(`/api/shopify/stores/${storeId}`);
    return response.data;
  },

  // ==============================================
  // STORE UTILITY METHODS
  // ==============================================

  /**
   * Format store for display in components
   * @param {Object} store - Raw store data
   * @returns {Object} Formatted store data
   */
  formatStoreForDisplay: (store) => {
    return {
      id: store._id || store.id,
      name: store.name || store.shopName,
      shopifyDomain: store.shopifyDomain,
      email: store.email,
      plan: store.planName,
      isActive: store.isActive,
      country: store.country,
      currency: store.currency,
      timezone: store.timezone,
      logo: store.logo || null,
      connectedAt: store.createdAt || store.connectedAt,
      // Additional fields for sync UI
      displayName: store.name || store.shopifyDomain,
      status: store.isActive ? 'active' : 'inactive'
    };
  },

  /**
   * Check if store is available for sync
   * @param {Object} store - Store object
   * @returns {boolean} Whether store can be used for sync
   */
  isStoreAvailableForSync: (store) => {
    return store.isActive && store.accessToken && store.shopifyDomain;
  },

  /**
   * Get store selection options for forms
   * @param {Object[]} stores - Array of stores
   * @returns {Object[]} Store options for select components
   */
  getStoreSelectOptions: (stores) => {
    return stores
      .filter(storeApi.isStoreAvailableForSync)
      .map(store => ({
        value: store._id || store.id,
        label: store.name || store.shopifyDomain,
        disabled: !store.isActive,
        store: storeApi.formatStoreForDisplay(store)
      }));
  }
};
