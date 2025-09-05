/**
 * Shopify API Functions
 * Store management, OAuth, and store-related operations
 */
import { api } from '@/lib/api';

/**
 * Initiate OAuth flow with Shopify
 * @param {string} shop - Shop domain to connect
 * @returns {Promise} - OAuth initiation response
 */
export const initiateShopifyAuth = async (shop) => {
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const oauthUrl = `${backendUrl}/api/shopify/auth?shop=${encodeURIComponent(shop)}`;
  
  // Direct redirect to backend OAuth endpoint
  window.location.href = oauthUrl;
  
  return { success: true };
};

/**
 * Get connected stores for current user
 * @returns {Promise} - List of connected stores
 */
export const getConnectedStores = async () => {
  const response = await api.get('/api/shopify/stores');
  return response.data.data;
};

/**
 * Disconnect a store from current user
 * @param {string} storeId - Store ID to disconnect
 * @returns {Promise} - Disconnect response
 */
export const disconnectStore = async (storeId) => {
  const response = await api.delete(`/api/shopify/stores/${storeId}`);
  return response.data;
};

/**
 * Get store analytics data
 * @param {string} storeId - Store ID to get analytics for
 * @returns {Promise} - Store analytics data
 */
export const getStoreAnalytics = async (storeId) => {
  const response = await api.get(`/api/shopify/stores/${storeId}/analytics`);
  return response.data.data;
};

/**
 * Get store summary with key metrics
 * @param {string} storeId - Store ID to get summary for
 * @returns {Promise} - Store summary data
 */
export const getStoreSummary = async (storeId) => {
  const response = await api.get(`/api/shopify/stores/${storeId}/summary`);
  return response.data.data;
};

/**
 * Get store collections for collection management
 * @param {string} storeId - Store ID to get collections for
 * @returns {Promise} - Store collections list
 */
export const getStoreCollections = async (storeId) => {
  const response = await api.get(`/api/collections/stores/${storeId}/collections`);
  return response.data.data;
};

/**
 * Get store locations for inventory management
 * @returns {Promise} - Store locations list
 */
export const getStoreLocations = async () => {
  const response = await api.get('/api/inventory/stores/locations');
  return response.data.data;
};

/**
 * Link store to current user using token from OAuth callback
 * @param {string} token - Link token from OAuth callback
 * @returns {Promise} - Link response
 */
export const linkStoreToUser = async (token) => {
  const response = await api.post('/api/shopify/link-store', { token });
  return response.data;
};
