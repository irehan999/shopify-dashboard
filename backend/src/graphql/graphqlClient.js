import { GraphqlQueryError } from '@shopify/shopify-api';
import shopify from '../config/shopify.js';

/**
 * GraphQL Client for Shopify Admin API
 * Clean helper function for all GraphQL operations
 */

/**
 * Execute GraphQL query/mutation against Shopify Admin API
 * @param {Object} session - Shopify session with shop and accessToken
 * @param {string} query - GraphQL query/mutation string
 * @param {Object} variables - Variables for the query/mutation
 * @returns {Promise<Object>} Response data
 */
export const executeGraphQL = async (session, query, variables = {}) => {
  if (!session || !session.shop || !session.accessToken) {
    throw new Error('Invalid session: Missing shop or access token');
  }

  try {
    const client = new shopify.clients.Graphql({ session });
    const response = await client.query({ 
      data: { 
        query, 
        variables 
      } 
    });
    
    // Handle GraphQL errors
    if (response.body.errors && response.body.errors.length > 0) {
      console.error('GraphQL Errors:', response.body.errors);
      throw new GraphqlQueryError('GraphQL operation failed', response.body.errors);
    }
    
    return response.body.data;
  } catch (error) {
    console.error('GraphQL Operation Error:', {
      message: error.message,
      shop: session.shop,
      operation: query.substring(0, 100) + '...',
      variables: Object.keys(variables)
    });
    throw error;
  }
};

/**
 * Test GraphQL connection with a simple shop query
 * @param {Object} session - Shopify session
 * @returns {Promise<boolean>} Connection status
 */
export const testGraphQLConnection = async (session) => {
  try {
    const query = `
      query {
        shop {
          id
          name
        }
      }
    `;
    
    await executeGraphQL(session, query);
    return true;
  } catch (error) {
    console.error('GraphQL connection test failed:', error.message);
    return false;
  }
};
