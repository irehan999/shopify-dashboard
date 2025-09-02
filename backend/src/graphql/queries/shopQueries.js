import { executeGraphQL } from '../graphqlClient.js';

/**
 * Shop GraphQL Queries for Shopify Admin API
 * Based on API Reference - Shop information and settings
 */

/**
 * Get shop details and resource limits
 * @param {Object} session - Shopify session
 * @returns {Promise<Object>} Shop information
 */
export const getShop = async (session) => {
  const query = `
    query shop {
      shop {
        id
        name
        email
        domain
        myshopifyDomain
        currencyCode
        weightUnit
        resourceLimits {
          maxProductVariants
          maxProductOptions
        }
        plan {
          displayName
          partnerDevelopment
          shopifyPlus
        }
        primaryDomain {
          host
          sslEnabled
        }
        billingAddress {
          country
          countryCodeV2
        }
      }
    }
  `;

  const data = await executeGraphQL(session, query);
  return data.shop;
};

/**
 * Get shop's available locations
 * @param {Object} session - Shopify session
 * @returns {Promise<Array>} Array of locations
 */
export const getLocations = async (session) => {
  const query = `
    query {
      locations(first: 100) {
        edges {
          node {
            id
            name
            address {
              address1
              city
              country
              countryCode
            }
            fulfillsOnlineOrders
            shipsInventory
          }
        }
      }
    }
  `;

  const data = await executeGraphQL(session, query);
  return data.locations.edges.map(edge => edge.node);
};
