import { executeGraphQL } from '../graphqlClient.js';

/**
 * Collection GraphQL Mutations for Shopify Admin API
 * Based on API Reference - Collection management mutations
 */

/**
 * Create a new collection (manual or smart)
 * @param {Object} session - Shopify session
 * @param {Object} collectionInput - Collection data
 * @returns {Promise<Object>} Created collection data
 */
export const createCollection = async (session, collectionInput) => {
  const mutation = `
    mutation collectionCreate($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection {
          id
          title
          handle
          ruleSet {
            appliedDisjunctively
            rules {
              column
              relation
              condition
            }
          }
          productsCount
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await executeGraphQL(session, mutation, { input: collectionInput });
  
  if (data.collectionCreate.userErrors.length > 0) {
    throw new Error(`Collection creation failed: ${data.collectionCreate.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.collectionCreate;
};

/**
 * Update existing collection
 * @param {Object} session - Shopify session
 * @param {string} collectionId - Collection ID
 * @param {Object} collectionInput - Updated collection data
 * @returns {Promise<Object>} Updated collection data
 */
export const updateCollection = async (session, collectionId, collectionInput) => {
  const mutation = `
    mutation collectionUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection {
          id
          title
          handle
          updatedAt
          productsCount
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = { ...collectionInput, id: collectionId };
  const data = await executeGraphQL(session, mutation, { input });
  
  if (data.collectionUpdate.userErrors.length > 0) {
    throw new Error(`Collection update failed: ${data.collectionUpdate.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.collectionUpdate;
};

/**
 * Add products to manual collection
 * @param {Object} session - Shopify session
 * @param {string} collectionId - Collection ID
 * @param {Array<string>} productIds - Array of product IDs to add
 * @returns {Promise<Object>} Collection with added products
 */
export const addProductsToCollection = async (session, collectionId, productIds) => {
  const mutation = `
    mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        collection {
          id
          title
          productsCount
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await executeGraphQL(session, mutation, { 
    id: collectionId, 
    productIds 
  });
  
  if (data.collectionAddProducts.userErrors.length > 0) {
    throw new Error(`Adding products to collection failed: ${data.collectionAddProducts.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.collectionAddProducts;
};

/**
 * Remove products from manual collection
 * @param {Object} session - Shopify session
 * @param {string} collectionId - Collection ID
 * @param {Array<string>} productIds - Array of product IDs to remove
 * @returns {Promise<Object>} Removal job info
 */
export const removeProductsFromCollection = async (session, collectionId, productIds) => {
  const mutation = `
    mutation collectionRemoveProducts($id: ID!, $productIds: [ID!]!) {
      collectionRemoveProducts(id: $id, productIds: $productIds) {
        job {
          id
          done
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await executeGraphQL(session, mutation, { 
    id: collectionId, 
    productIds 
  });
  
  if (data.collectionRemoveProducts.userErrors.length > 0) {
    throw new Error(`Removing products from collection failed: ${data.collectionRemoveProducts.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.collectionRemoveProducts;
};
