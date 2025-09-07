import { executeGraphQL } from '../graphqlClient.js';

/**
 * Collection GraphQL Queries for Shopify Admin API
 * Based on API Reference - Collection management queries
 */

/**
 * Get paginated list of collections
 * @param {Object} session - Shopify session
 * @param {Object} options - Query options
 * @param {number} options.first - Number of collections to fetch
 * @param {string} options.after - Cursor for pagination
 * @param {string} options.query - Search query
 * @returns {Promise<Object>} Collections data with pagination info
 */
export const getCollections = async (session, options = {}) => {
  const { first = 50, after = null, query = null } = options;
  
  const graphqlQuery = `
    query collections($first: Int, $after: String, $query: String) {
      collections(first: $first, after: $after, query: $query) {
        edges {
          node {
            id
            title
            handle
            updatedAt
            productsCount {
              count
              precision
            }
            ruleSet {
              appliedDisjunctively
              rules {
                column
                relation
                condition
              }
            }
            image {
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
 * Get single collection with products
 * @param {Object} session - Shopify session
 * @param {string} collectionId - Collection ID
 * @returns {Promise<Object>} Complete collection data
 */
export const getCollection = async (session, collectionId) => {
  const query = `
    query collection($id: ID!) {
      collection(id: $id) {
        id
        title
        descriptionHtml
        handle
        sortOrder
        ruleSet {
          appliedDisjunctively
          rules {
            column
            relation
            condition
            conditionObjectId
          }
        }
        products(first: 250) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
                altText
              }
            }
          }
        }
        image {
          id
          url
          altText
        }
        seo {
          title
          description
        }
      }
    }
  `;

  const data = await executeGraphQL(session, query, { id: collectionId });
  return data.collection;
};
