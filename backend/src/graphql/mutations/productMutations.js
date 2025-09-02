import { executeGraphQL } from '../graphqlClient.js';

/**
 * Product GraphQL Mutations for Shopify Admin API
 * Based on API Reference - All verified mutations for Phase 1 & 2
 */

/**
 * Create a new product
 * @param {Object} session - Shopify session
 * @param {Object} productInput - Product data (ProductOptimized.toShopifyProductInput())
 * @param {Array} media - Optional media files
 * @returns {Promise<Object>} Created product data
 */
export const createProduct = async (session, productInput, media = null) => {
  const mutation = `
    mutation productCreate($input: ProductInput!, $media: [CreateMediaInput!]) {
      productCreate(input: $input, media: $media) {
        product {
          id
          title
          handle
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
          variants(first: 100) {
            edges {
              node {
                id
                title
                price
                sku
                inventoryQuantity
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          media(first: 10) {
            edges {
              node {
                id
                alt
                mediaContentType
                ... on MediaImage {
                  image {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = { input: productInput };
  if (media) variables.media = media;

  const data = await executeGraphQL(session, mutation, variables);
  
  if (data.productCreate.userErrors.length > 0) {
    throw new Error(`Product creation failed: ${data.productCreate.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.productCreate;
};

/**
 * Update existing product
 * @param {Object} session - Shopify session
 * @param {string} productId - Shopify product ID (GID format)
 * @param {Object} productInput - Updated product data
 * @returns {Promise<Object>} Updated product data
 */
export const updateProduct = async (session, productId, productInput) => {
  const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
          handle
          status
          updatedAt
          variants(first: 100) {
            edges {
              node {
                id
                title
                price
                sku
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = { ...productInput, id: productId };
  const data = await executeGraphQL(session, mutation, { input });
  
  if (data.productUpdate.userErrors.length > 0) {
    throw new Error(`Product update failed: ${data.productUpdate.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.productUpdate;
};

/**
 * Comprehensive product sync from external source (ProductOptimized)
 * @param {Object} session - Shopify session
 * @param {Object} productSetInput - Complete product data for sync
 * @returns {Promise<Object>} Synced product data
 */
export const syncProduct = async (session, productSetInput) => {
  const mutation = `
    mutation productSet($input: ProductSetInput!) {
      productSet(input: $input) {
        product {
          id
          title
          handle
          status
          updatedAt
          variants(first: 250) {
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
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await executeGraphQL(session, mutation, { input: productSetInput });
  
  if (data.productSet.userErrors.length > 0) {
    throw new Error(`Product sync failed: ${data.productSet.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.productSet;
};

/**
 * Create multiple variants for a product
 * @param {Object} session - Shopify session
 * @param {string} productId - Product ID
 * @param {Array} variants - Array of variant data
 * @returns {Promise<Object>} Created variants data
 */
export const createProductVariants = async (session, productId, variants) => {
  const mutation = `
    mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkCreate(productId: $productId, variants: $variants) {
        product {
          id
          title
        }
        productVariants {
          id
          title
          price
          sku
          inventoryQuantity
          selectedOptions {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await executeGraphQL(session, mutation, { productId, variants });
  
  if (data.productVariantsBulkCreate.userErrors.length > 0) {
    throw new Error(`Variants creation failed: ${data.productVariantsBulkCreate.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.productVariantsBulkCreate;
};

/**
 * Update multiple variants for a product
 * @param {Object} session - Shopify session
 * @param {string} productId - Product ID
 * @param {Array} variants - Array of variant updates
 * @returns {Promise<Object>} Updated variants data
 */
export const updateProductVariants = async (session, productId, variants) => {
  const mutation = `
    mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          title
          price
          sku
          inventoryQuantity
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await executeGraphQL(session, mutation, { productId, variants });
  
  if (data.productVariantsBulkUpdate.userErrors.length > 0) {
    throw new Error(`Variants update failed: ${data.productVariantsBulkUpdate.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.productVariantsBulkUpdate;
};

/**
 * Delete multiple variants from a product
 * @param {Object} session - Shopify session
 * @param {string} productId - Product ID
 * @param {Array<string>} variantIds - Array of variant IDs to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteProductVariants = async (session, productId, variantIds) => {
  const mutation = `
    mutation productVariantsBulkDelete($productId: ID!, $variantsIds: [ID!]!) {
      productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
        product {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await executeGraphQL(session, mutation, { productId, variantsIds: variantIds });
  
  if (data.productVariantsBulkDelete.userErrors.length > 0) {
    throw new Error(`Variants deletion failed: ${data.productVariantsBulkDelete.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.productVariantsBulkDelete;
};

/**
 * Create product options
 * @param {Object} session - Shopify session
 * @param {string} productId - Product ID
 * @param {Array} options - Array of option data
 * @returns {Promise<Object>} Created options data
 */
export const createProductOptions = async (session, productId, options) => {
  const mutation = `
    mutation productOptionsCreate($productId: ID!, $options: [OptionCreateInput!]!) {
      productOptionsCreate(productId: $productId, options: $options) {
        product {
          id
          title
          options {
            id
            name
            values
            optionValues {
              id
              name
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await executeGraphQL(session, mutation, { productId, options });
  
  if (data.productOptionsCreate.userErrors.length > 0) {
    throw new Error(`Options creation failed: ${data.productOptionsCreate.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.productOptionsCreate;
};

/**
 * Update product option
 * @param {Object} session - Shopify session
 * @param {string} productId - Product ID
 * @param {Object} option - Option update data
 * @returns {Promise<Object>} Updated option data
 */
export const updateProductOption = async (session, productId, option) => {
  const mutation = `
    mutation productOptionUpdate($productId: ID!, $option: OptionUpdateInput!) {
      productOptionUpdate(productId: $productId, option: $option) {
        product {
          id
          title
          options {
            id
            name
            optionValues {
              id
              name
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await executeGraphQL(session, mutation, { productId, option });
  
  if (data.productOptionUpdate.userErrors.length > 0) {
    throw new Error(`Option update failed: ${data.productOptionUpdate.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.productOptionUpdate;
};

/**
 * Delete product options
 * @param {Object} session - Shopify session
 * @param {string} productId - Product ID
 * @param {Array<string>} optionIds - Array of option IDs to delete
 * @returns {Promise<Object>} Deletion result
 */
/**
 * Delete a product
 * @param {Object} session - Shopify session
 * @param {string} productId - Shopify product ID (GID format)
 * @param {boolean} synchronous - Whether to run synchronously (default: true)
 * @returns {Promise<Object>} Deletion result
 */
export const deleteProduct = async (session, productId, synchronous = true) => {
  const mutation = `
    mutation productDelete($input: ProductDeleteInput!, $synchronous: Boolean) {
      productDelete(input: $input, synchronous: $synchronous) {
        deletedProductId
        productDeleteOperation {
          id
          status
          deletedProductId
          userErrors {
            field
            message
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = { id: productId };
  
  const data = await executeGraphQL(session, mutation, { 
    input: input,
    synchronous: synchronous 
  });
  
  if (data.productDelete.userErrors.length > 0) {
    throw new Error(`Product deletion failed: ${data.productDelete.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.productDelete;
};

export const deleteProductOptions = async (session, productId, optionIds) => {
  const mutation = `
    mutation productOptionsDelete($productId: ID!, $optionsIds: [ID!]!) {
      productOptionsDelete(productId: $productId, optionsIds: $optionsIds) {
        product {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await executeGraphQL(session, mutation, { productId, optionsIds: optionIds });
  
  if (data.productOptionsDelete.userErrors.length > 0) {
    throw new Error(`Options deletion failed: ${data.productOptionsDelete.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.productOptionsDelete;
};
