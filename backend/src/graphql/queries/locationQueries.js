import { executeGraphQL } from '../graphqlClient.js';

/**
 * Location GraphQL Queries for Shopify Admin API
 * Used to fetch location IDs for proper inventory management
 */

/**
 * Get all locations for the store
 * @param {Object} session - Shopify session
 * @returns {Promise<Array>} Array of location objects with ID and name
 */
export const getLocations = async (session) => {
  const query = `
    query {
      locations(first: 10) {
        edges {
          node {
            id
            name
            isActive
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

/**
 * Get the primary location (first active location that fulfills online orders)
 * @param {Object} session - Shopify session
 * @returns {Promise<string>} Primary location ID (GID format)
 */
export const getPrimaryLocationId = async (session) => {
  const locations = await getLocations(session);
  
  // Find the first active location that fulfills online orders
  const primaryLocation = locations.find(location => 
    location.isActive && location.fulfillsOnlineOrders && location.shipsInventory
  );
  
  if (!primaryLocation) {
    // Fallback to first active location
    const activeLocation = locations.find(location => location.isActive);
    if (!activeLocation) {
      throw new Error('No active locations found in the store');
    }
    return activeLocation.id;
  }
  
  return primaryLocation.id;
};

/**
 * Get location by ID
 * @param {Object} session - Shopify session
 * @param {string} locationId - Location ID (GID format)
 * @returns {Promise<Object>} Location object
 */
export const getLocationById = async (session, locationId) => {
  const query = `
    query getLocation($id: ID!) {
      location(id: $id) {
        id
        name
        isActive
        fulfillsOnlineOrders
        shipsInventory
        address {
          formatted
        }
      }
    }
  `;

  const data = await executeGraphQL(session, query, { id: locationId });
  
  return data.location;
};
