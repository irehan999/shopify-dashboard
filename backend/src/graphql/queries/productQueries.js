import { executeGraphQL } from '../graphqlClient.js';

/**
 * Product GraphQL Queries for Shopify Admin API
 * Based on API Reference - All verified queries
 */

/**
 * Get paginated list of products
 * @param {Object} session - Shopify session
 * @param {Object} options - Query options
 * @param {number} options.first - Number of products to fetch (max 250)
 * @param {string} options.after - Cursor for pagination
 * @param {string} options.query - Search query
 * @returns {Promise<Object>} Products data with pagination info
 */
export const getProducts = async (session, options = {}) => {
  const { first = 50, after = null, query = null } = options;
  
  const graphqlQuery = `
    query products($first: Int, $after: String, $query: String) {
      products(first: $first, after: $after, query: $query) {
        edges {
          node {
            id
            title
            handle
            status
            vendor
            productType
            createdAt
            updatedAt
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price
                  sku
                  inventoryQuantity
                }
              }
            }
            featuredImage {
              id
              url
              altText
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;

  const variables = { first };
  if (after) variables.after = after;
  if (query) variables.query = query;

  return await executeGraphQL(session, graphqlQuery, variables);
};

/**
 * Get single product with full details
 * @param {Object} session - Shopify session
 * @param {string} productId - Shopify product ID (GID format)
 * @returns {Promise<Object>} Complete product data
 */
export const getProduct = async (session, productId) => {
  const query = `
    query product($id: ID!) {
      product(id: $id) {
        id
        title
        descriptionHtml
        handle
        vendor
        productType
        tags
        status
        createdAt
        updatedAt
        options {
          id
          name
          values
          optionValues {
            id
            name
          }
        }
        variants(first: 250) {
          edges {
            node {
              id
              title
              price
              compareAtPrice
              sku
              barcode
              inventoryQuantity
              selectedOptions {
                name
                value
              }
              inventoryItem {
                id
                tracked
              }
            }
          }
        }
        media(first: 250) {
          edges {
            node {
              id
              alt
              mediaContentType
              ... on MediaImage {
                image {
                  url
                  altText
                  width
                  height
                }
              }
              ... on Video {
                sources {
                  url
                  mimeType
                }
              }
            }
          }
        }
        seo {
          title
          description
        }
        metafields(first: 100) {
          edges {
            node {
              id
              namespace
              key
              value
              type
            }
          }
        }
      }
    }
  `;

  const data = await executeGraphQL(session, query, { id: productId });
  return data.product;
};

/**
 * Get products by handles (for mapping validation)
 * @param {Object} session - Shopify session
 * @param {Array<string>} handles - Product handles to search
 * @returns {Promise<Array>} Array of products found
 */
export const getProductsByHandles = async (session, handles) => {
  if (!handles || handles.length === 0) return [];
  
  // Build query for multiple handles
  const handleQuery = handles.map(handle => `handle:${handle}`).join(' OR ');
  
  const data = await getProducts(session, {
    first: 250,
    query: handleQuery
  });
  
  return data.products.edges.map(edge => edge.node);
};

/**
 * Search products by title, SKU, or other fields
 * @param {Object} session - Shopify session
 * @param {string} searchTerm - Search term
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Search results with pagination
 */
export const searchProducts = async (session, searchTerm, options = {}) => {
  const { first = 50, after = null } = options;
  
  // Shopify search query supports various filters
  const searchQuery = `title:*${searchTerm}* OR sku:*${searchTerm}* OR vendor:*${searchTerm}*`;
  
  return await getProducts(session, {
    first,
    after,
    query: searchQuery
  });
};

/**
 * Get product inventory levels
 * @param {Object} session - Shopify session
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Inventory information
 */
export const getProductInventory = async (session, productId) => {
  const query = `
    query product($id: ID!) {
      product(id: $id) {
        id
        title
        variants(first: 250) {
          edges {
            node {
              id
              title
              sku
              inventoryQuantity
              inventoryItem {
                id
                tracked
                inventoryLevels(first: 10) {
                  edges {
                    node {
                      available
                      location {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await executeGraphQL(session, query, { id: productId });
  return data.product;
};

/**
 * Get live inventory levels for specific location and variant
 * @param {Object} session - Shopify session
 * @param {string} inventoryItemId - Inventory Item ID (GID format)
 * @param {string} locationId - Location ID (GID format)
 * @returns {Promise<Object>} Inventory level details
 */
export const getLiveInventoryLevel = async (session, inventoryItemId, locationId) => {
  const query = `
    query getLiveInventoryLevel($inventoryItemId: ID!, $locationId: ID!) {
      inventoryLevel(inventoryItemId: $inventoryItemId, locationId: $locationId) {
        id
        available
        item {
          id
          sku
          variant {
            id
            title
            product {
              id
              title
            }
          }
        }
        location {
          id
          name
        }
      }
    }
  `;

  const data = await executeGraphQL(session, query, { 
    inventoryItemId, 
    locationId 
  });
  
  return data.inventoryLevel;
};

/**
 * Get live inventory levels across multiple locations for a product
 * @param {Object} session - Shopify session
 * @param {string} productId - Product ID (GID format)
 * @param {Array<string>} locationIds - Array of location IDs
 * @returns {Promise<Object>} Comprehensive inventory data
 */
export const getLiveProductInventoryByLocations = async (session, productId, locationIds) => {
  const query = `
    query getLiveProductInventory($id: ID!, $locationIds: [ID!]!) {
      product(id: $id) {
        id
        title
        totalInventory
        variants(first: 50) {
          edges {
            node {
              id
              title
              sku
              inventoryQuantity
              inventoryPolicy
              inventoryManagement
              inventoryItem {
                id
                inventoryLevels(locationIds: $locationIds, first: 50) {
                  edges {
                    node {
                      id
                      available
                      location {
                        id
                        name
                        isActive
                        fulfillsOnlineOrders
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await executeGraphQL(session, query, { 
    id: productId, 
    locationIds 
  });
  
  return data.product;
};

/**
 * Get inventory summary across all locations for allocation strategy
 * @param {Object} session - Shopify session
 * @param {Array<string>} productIds - Array of product IDs
 * @returns {Promise<Array>} Array of products with inventory allocation data
 */
export const getInventoryAllocationSummary = async (session, productIds) => {
  const query = `
    query getInventoryAllocationSummary($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          title
          totalInventory
          variants(first: 50) {
            edges {
              node {
                id
                title
                sku
                inventoryQuantity
                inventoryPolicy
                inventoryManagement
                inventoryItem {
                  id
                  inventoryLevels(first: 50) {
                    edges {
                      node {
                        id
                        available
                        location {
                          id
                          name
                          isActive
                          fulfillsOnlineOrders
                          shipsInventory
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await executeGraphQL(session, query, { ids: productIds });
  
  return data.nodes.filter(node => node !== null);
};

/**
 * Get real-time inventory availability for allocation decisions
 * @param {Object} session - Shopify session
 * @param {Array<string>} inventoryItemIds - Array of inventory item IDs
 * @param {Array<string>} locationIds - Array of location IDs
 * @returns {Promise<Array>} Detailed inventory levels for allocation
 */
export const getRealTimeInventoryForAllocation = async (session, inventoryItemIds, locationIds) => {
  const query = `
    query getRealTimeInventory($inventoryItemIds: [ID!]!, $locationIds: [ID!]!) {
      inventoryLevels(inventoryItemIds: $inventoryItemIds, locationIds: $locationIds, first: 250) {
        edges {
          node {
            id
            available
            item {
              id
              sku
              variant {
                id
                title
                displayName
                product {
                  id
                  title
                }
              }
            }
            location {
              id
              name
              isActive
              fulfillsOnlineOrders
              shipsInventory
            }
          }
        }
      }
    }
  `;

  const data = await executeGraphQL(session, query, { 
    inventoryItemIds, 
    locationIds 
  });
  
  return data.inventoryLevels.edges.map(edge => edge.node);
};
