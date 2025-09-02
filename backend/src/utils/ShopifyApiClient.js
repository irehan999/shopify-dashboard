import axios from 'axios';
import { shopify } from '../config/shopify.js';

/**
 * Shopify API Client - Handles authenticated requests to Shopify APIs
 * Supports both REST and GraphQL Admin API calls with proper session management
 */
class ShopifyApiClient {
  constructor() {
    this.restClient = null;
    this.graphqlClient = null;
  }

  /**
   * Get REST API client for a specific session
   * @param {Object} session - Shopify session object
   * @returns {Object} Configured axios instance for REST API
   */
  getRestClient(session) {
    if (!session || !session.shop || !session.accessToken) {
      throw new Error('Invalid session: Missing shop or access token');
    }

    return axios.create({
      baseURL: `https://${session.shop}/admin/api/${shopify.config.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': session.accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });
  }

  /**
   * Get GraphQL Admin API client for a specific session
   * @param {Object} session - Shopify session object
   * @returns {Object} Configured axios instance for GraphQL API
   */
  getGraphQLClient(session) {
    if (!session || !session.shop || !session.accessToken) {
      throw new Error('Invalid session: Missing shop or access token');
    }

    return axios.create({
      baseURL: `https://${session.shop}/admin/api/${shopify.config.apiVersion}/graphql.json`,
      headers: {
        'X-Shopify-Access-Token': session.accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });
  }

  /**
   * Make a REST API request
   * @param {Object} session - Shopify session object
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} endpoint - API endpoint (e.g., 'products', 'products/123')
   * @param {Object} data - Request data for POST/PUT requests
   * @returns {Promise} API response
   */
  async restRequest(session, method, endpoint, data = null) {
    try {
      const client = this.getRestClient(session);
      const config = {
        method: method.toLowerCase(),
        url: `/${endpoint}.json`,
      };

      if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        config.data = data;
      }

      const response = await client.request(config);
      return response.data;
    } catch (error) {
      this.handleError(error, 'REST');
      throw error;
    }
  }

  /**
   * Make a GraphQL API request
   * @param {Object} session - Shopify session object
   * @param {string} query - GraphQL query or mutation
   * @param {Object} variables - GraphQL variables
   * @returns {Promise} API response
   */
  async graphqlRequest(session, query, variables = {}) {
    try {
      const client = this.getGraphQLClient(session);
      
      const response = await client.post('', {
        query,
        variables,
      });

      // Check for GraphQL errors
      if (response.data.errors && response.data.errors.length > 0) {
        throw new Error(`GraphQL Error: ${response.data.errors.map(e => e.message).join(', ')}`);
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'GraphQL');
      throw error;
    }
  }

  /**
   * Get products using REST API
   * @param {Object} session - Shopify session object
   * @param {Object} params - Query parameters (limit, page_info, etc.)
   * @returns {Promise} Products data
   */
  async getProducts(session, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `products?${queryParams}` : 'products';
    return await this.restRequest(session, 'GET', endpoint);
  }

  /**
   * Get single product using REST API
   * @param {Object} session - Shopify session object
   * @param {string} productId - Product ID
   * @returns {Promise} Product data
   */
  async getProduct(session, productId) {
    return await this.restRequest(session, 'GET', `products/${productId}`);
  }

  /**
   * Create product using REST API
   * @param {Object} session - Shopify session object
   * @param {Object} productData - Product data
   * @returns {Promise} Created product data
   */
  async createProduct(session, productData) {
    return await this.restRequest(session, 'POST', 'products', { product: productData });
  }

  /**
   * Update product using REST API
   * @param {Object} session - Shopify session object
   * @param {string} productId - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise} Updated product data
   */
  async updateProduct(session, productId, productData) {
    return await this.restRequest(session, 'PUT', `products/${productId}`, { product: productData });
  }

  /**
   * Delete product using REST API
   * @param {Object} session - Shopify session object
   * @param {string} productId - Product ID
   * @returns {Promise} Deletion response
   */
  async deleteProduct(session, productId) {
    return await this.restRequest(session, 'DELETE', `products/${productId}`);
  }

  /**
   * Get orders using REST API
   * @param {Object} session - Shopify session object
   * @param {Object} params - Query parameters
   * @returns {Promise} Orders data
   */
  async getOrders(session, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `orders?${queryParams}` : 'orders';
    return await this.restRequest(session, 'GET', endpoint);
  }

  /**
   * Get products using GraphQL API (recommended for complex queries)
   * @param {Object} session - Shopify session object
   * @param {number} first - Number of products to fetch
   * @param {string} after - Cursor for pagination
   * @returns {Promise} Products data
   */
  async getProductsGraphQL(session, first = 10, after = null) {
    const query = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              title
              handle
              description
              status
              createdAt
              updatedAt
              images(first: 5) {
                edges {
                  node {
                    id
                    url
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    inventoryQuantity
                    sku
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const variables = { first };
    if (after) variables.after = after;

    return await this.graphqlRequest(session, query, variables);
  }

  /**
   * Create product using GraphQL API
   * @param {Object} session - Shopify session object
   * @param {Object} productInput - Product input data
   * @returns {Promise} Created product data
   */
  async createProductGraphQL(session, productInput) {
    const mutation = `
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    return await this.graphqlRequest(session, mutation, { input: productInput });
  }

  /**
   * Get shop information
   * @param {Object} session - Shopify session object
   * @returns {Promise} Shop data
   */
  async getShop(session) {
    return await this.restRequest(session, 'GET', 'shop');
  }

  /**
   * Get shop information using GraphQL
   * @param {Object} session - Shopify session object
   * @returns {Promise} Shop data
   */
  async getShopGraphQL(session) {
    const query = `
      query {
        shop {
          id
          name
          email
          domain
          myshopifyDomain
          plan {
            displayName
          }
          primaryDomain {
            host
            sslEnabled
          }
        }
      }
    `;

    return await this.graphqlRequest(session, query);
  }

  /**
   * Handle API errors with proper logging
   * @param {Error} error - Error object
   * @param {string} apiType - API type (REST/GraphQL)
   */
  handleError(error, apiType = 'API') {
    console.error(`Shopify ${apiType} Error:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      }
    });

    // Handle specific Shopify error responses
    if (error.response?.data) {
      const shopifyError = error.response.data;
      
      if (shopifyError.errors) {
        console.error('Shopify API Errors:', shopifyError.errors);
      }
      
      if (shopifyError.error_description) {
        console.error('Error Description:', shopifyError.error_description);
      }
    }
  }

  /**
   * Check if session is valid and has required permissions
   * @param {Object} session - Shopify session object
   * @param {Array} requiredScopes - Required scopes for the operation
   * @returns {boolean} Whether session is valid
   */
  isValidSession(session, requiredScopes = []) {
    if (!session || !session.shop || !session.accessToken) {
      return false;
    }

    // Check if session has required scopes
    if (requiredScopes.length > 0 && session.scope) {
      const sessionScopes = session.scope.split(',').map(s => s.trim());
      return requiredScopes.every(scope => sessionScopes.includes(scope));
    }

    return true;
  }

  /**
   * Test API connection with a simple shop query
   * @param {Object} session - Shopify session object
   * @returns {Promise<boolean>} Whether connection is successful
   */
  async testConnection(session) {
    try {
      await this.getShop(session);
      return true;
    } catch (error) {
      console.error('API connection test failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export default new ShopifyApiClient();
