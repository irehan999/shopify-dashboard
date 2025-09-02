import { executeGraphQL } from '../graphqlClient.js';

/**
 * Media GraphQL Mutations for Shopify Admin API
 * Based on API Reference - File and media handling
 */

/**
 * Upload files (images, videos, 3D models)
 * @param {Object} session - Shopify session
 * @param {Array} files - Array of file upload data
 * @returns {Promise<Object>} Created files data
 */
export const createFiles = async (session, files) => {
  const mutation = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          alt
          createdAt
          fileStatus
          ... on MediaImage {
            image {
              url
              width
              height
            }
          }
          ... on Video {
            filename
            sources {
              url
              mimeType
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

  const data = await executeGraphQL(session, mutation, { files });
  
  if (data.fileCreate.userErrors.length > 0) {
    throw new Error(`File creation failed: ${data.fileCreate.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.fileCreate;
};

/**
 * Associate media with products
 * @param {Object} session - Shopify session
 * @param {string} productId - Product ID
 * @param {Array} media - Array of media data
 * @returns {Promise<Object>} Created product media
 */
export const createProductMedia = async (session, productId, media) => {
  const mutation = `
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          id
          alt
          mediaContentType
          status
          ... on MediaImage {
            image {
              url
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
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await executeGraphQL(session, mutation, { productId, media });
  
  if (data.productCreateMedia.userErrors.length > 0) {
    throw new Error(`Product media creation failed: ${data.productCreateMedia.userErrors.map(e => e.message).join(', ')}`);
  }
  
  return data.productCreateMedia;
};
