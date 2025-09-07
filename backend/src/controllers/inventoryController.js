/**
 * Inventory Management Controller
 * Handles inventory assignment, tracking, and synchronization between dashboard and stores
 */

import asyncHandler from '../utils/AsyncHanlde.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Product } from '../models/ProductOptimized.js';
import { ProductMap } from '../models/ProductMap.js';
import { Store } from '../models/Store.js';
import { 
  getProductInventory,
  getLiveInventoryLevel, 
  getLiveProductInventoryByLocations, 
  getInventoryAllocationSummary, 
  getRealTimeInventoryForAllocation 
} from '../graphql/queries/productQueries.js';
import { getLocations } from '../graphql/queries/locationQueries.js';

/**
 * Get Store Locations for Specific Store
 * Fetches all locations for a specific store - REQUIRES storeId
 */
export const getStoreLocations = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  
  if (!storeId) {
    throw new ApiError(400, 'Store ID is required');
  }

  try {
    // Get the store to verify it exists and belongs to user
    const store = await Store.findOne({
      _id: storeId,
      userId: req.user._id,
      isActive: true
    });

    if (!store) {
      throw new ApiError(404, 'Store not found or inactive');
    }

    // Create session for this specific store
    const session = {
      shop: store.shopDomain,
      accessToken: store.accessToken,
      state: undefined,
      isOnline: false,
      scope: store.scopes.join(',')
    };

    const locationsData = await getLocations(session);
    
    const response = {
      success: true,
      storeId: storeId,
      storeName: store.shopName,
      shopDomain: store.shopDomain,
      locations: locationsData,
      count: locationsData.length,
      executionTime: new Date()
    };

    res.status(200).json(
      new ApiResponse(200, response, `Store locations for ${store.shopName} retrieved successfully`)
    );

  } catch (error) {
    console.error('Store locations fetch failed:', error);
    throw new ApiError(
      error.status || 500,
      `Failed to get store locations: ${error.message}`
    );
  }
});

/**
 * Assign Inventory to Store
 * Assigns inventory from master product to specific store
 */
export const assignInventoryToStore = asyncHandler(async (req, res) => {
  const { productId, storeId } = req.params;
  const { variantInventory, locationId } = req.body;

  // variantInventory format: [{ variantIndex: 0, assignedQuantity: 100 }, ...]

  if (!variantInventory || !Array.isArray(variantInventory)) {
    throw new ApiError(400, 'Variant inventory data is required');
  }

  try {
    // Get product mapping
    const mapping = await ProductMap.findOne({
      dashboardProduct: productId,
      'storeMappings.store': storeId
    });

    if (!mapping) {
      throw new ApiError(404, 'Product mapping not found. Product must be synced to store first.');
    }

    // Get master product to check available inventory
    const product = await Product.findById(productId).populate('variants');
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Validate and assign inventory
    const assignments = [];
    for (const varInv of variantInventory) {
      const { variantIndex, assignedQuantity } = varInv;
      
      // Validate variant exists
      if (!product.variants[variantIndex]) {
        throw new ApiError(400, `Variant at index ${variantIndex} not found`);
      }

      const masterVariant = product.variants[variantIndex];
      
      // Check if master has enough inventory (if tracked)
      if (masterVariant.inventoryQuantity !== undefined && 
          assignedQuantity > masterVariant.inventoryQuantity) {
        throw new ApiError(400, 
          `Cannot assign ${assignedQuantity} units. Master variant only has ${masterVariant.inventoryQuantity} available.`);
      }

      // Assign inventory to store
      await mapping.assignInventoryToStore(
        storeId, 
        variantIndex, 
        assignedQuantity, 
        locationId, 
        req.user?.id
      );

      assignments.push({
        variantIndex,
        variantSku: masterVariant.sku,
        assignedQuantity,
        masterQuantity: masterVariant.inventoryQuantity
      });
    }

    // Get updated inventory summary
    const inventorySummary = mapping.getInventorySummary(storeId);

    const response = {
      success: true,
      assignments: assignments,
      summary: inventorySummary,
      storeId: storeId,
      productId: productId,
      executionTime: new Date()
    };

    res.status(200).json(
      new ApiResponse(200, response, 'Inventory assigned to store successfully')
    );

  } catch (error) {
    console.error('Inventory assignment failed:', error);
    throw new ApiError(
      error.status || 500,
      `Failed to assign inventory: ${error.message}`
    );
  }
});

/**
 * Sync Inventory from Shopify
 * Fetches current inventory levels from Shopify and updates our records
 */
export const syncInventoryFromShopify = asyncHandler(async (req, res) => {
  const { productId, storeId } = req.params;

  try {
    // Get product mapping
    const mapping = await ProductMap.findOne({
      dashboardProduct: productId,
      'storeMappings.store': storeId
    });

    if (!mapping) {
      throw new ApiError(404, 'Product mapping not found');
    }

    const storeMapping = mapping.getStoreMapping(storeId);
    if (!storeMapping || !storeMapping.shopifyProductId) {
      throw new ApiError(404, 'Shopify product ID not found in mapping');
    }

    const session = req.session;
    if (!session) {
      throw new ApiError(401, 'Shopify session required');
    }

    // Fetch current inventory from Shopify
    const inventoryData = await getProductInventory(session, storeMapping.shopifyProductId);

    // Update our records with Shopify data
    const syncResults = [];
    if (inventoryData.variants) {
      inventoryData.variants.edges.forEach((variantEdge, index) => {
        const variant = variantEdge.node;
        const inventoryQuantity = variant.inventoryQuantity || 0;
        
        // Update our mapping
        mapping.syncInventoryFromShopify(storeId, index, inventoryQuantity);
        
        syncResults.push({
          variantIndex: index,
          shopifyVariantId: variant.id,
          currentQuantity: inventoryQuantity,
          sku: variant.sku
        });
      });
    }

    await mapping.save();

    // Get updated inventory summary
    const inventorySummary = mapping.getInventorySummary(storeId);

    const response = {
      success: true,
      syncResults: syncResults,
      summary: inventorySummary,
      storeId: storeId,
      productId: productId,
      lastSyncAt: new Date(),
      executionTime: new Date()
    };

    res.status(200).json(
      new ApiResponse(200, response, 'Inventory synced from Shopify successfully')
    );

  } catch (error) {
    console.error('Inventory sync failed:', error);
    throw new ApiError(
      error.status || 500,
      `Failed to sync inventory: ${error.message}`
    );
  }
});

/**
 * Get Inventory Summary
 * Returns comprehensive inventory status for a product across stores
 */
export const getInventorySummary = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { storeId } = req.query;

  try {
    const query = { dashboardProduct: productId };
    if (storeId) {
      query['storeMappings.store'] = storeId;
    }

    const mappings = await ProductMap.find(query)
      .populate('dashboardProduct')
      .populate('storeMappings.store');

    if (!mappings || mappings.length === 0) {
      throw new ApiError(404, 'No product mappings found');
    }

    // Get master product
    const product = await Product.findById(productId).populate('variants');
    
    const inventorySummary = {
      productId: productId,
      productTitle: product.title,
      masterInventory: product.variants.map((variant, index) => ({
        variantIndex: index,
        sku: variant.sku,
        masterQuantity: variant.inventoryQuantity || 0,
        price: variant.price
      })),
      storeInventory: []
    };

    // Compile inventory for each store
    mappings.forEach(mapping => {
      mapping.storeMappings.forEach(storeMapping => {
        if (!storeId || storeMapping.store._id.toString() === storeId) {
          const storeSummary = mapping.getInventorySummary(storeMapping.store._id);
          if (storeSummary) {
            inventorySummary.storeInventory.push({
              ...storeSummary,
              storeName: storeMapping.store.name || storeMapping.store._id,
              storeUrl: storeMapping.store.shopDomain
            });
          }
        }
      });
    });

    const response = {
      success: true,
      inventory: inventorySummary,
      executionTime: new Date()
    };

    res.status(200).json(
      new ApiResponse(200, response, 'Inventory summary retrieved successfully')
    );

  } catch (error) {
    console.error('Inventory summary fetch failed:', error);
    throw new ApiError(
      error.status || 500,
      `Failed to get inventory summary: ${error.message}`
    );
  }
});

/**
 * Get Inventory History
 * Returns inventory change history for a product in a store
 */
export const getInventoryHistory = asyncHandler(async (req, res) => {
  const { productId, storeId } = req.params;
  const { variantIndex, limit = 50 } = req.query;

  try {
    const mapping = await ProductMap.findOne({
      dashboardProduct: productId,
      'storeMappings.store': storeId
    });

    if (!mapping) {
      throw new ApiError(404, 'Product mapping not found');
    }

    const storeMapping = mapping.getStoreMapping(storeId);
    if (!storeMapping) {
      throw new ApiError(404, 'Store mapping not found');
    }

    let history = [];

    if (variantIndex !== undefined) {
      // Get history for specific variant
      const variant = storeMapping.variantMappings.find(
        vm => vm.dashboardVariantIndex === parseInt(variantIndex)
      );
      
      if (variant && variant.inventoryTracking.inventoryHistory) {
        history = variant.inventoryTracking.inventoryHistory
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, parseInt(limit));
      }
    } else {
      // Get history for all variants
      storeMapping.variantMappings.forEach(variant => {
        if (variant.inventoryTracking.inventoryHistory) {
          history.push(...variant.inventoryTracking.inventoryHistory.map(h => ({
            ...h.toObject(),
            variantIndex: variant.dashboardVariantIndex
          })));
        }
      });
      
      history = history
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, parseInt(limit));
    }

    const response = {
      success: true,
      history: history,
      productId: productId,
      storeId: storeId,
      variantIndex: variantIndex,
      totalRecords: history.length,
      executionTime: new Date()
    };

    res.status(200).json(
      new ApiResponse(200, response, 'Inventory history retrieved successfully')
    );

  } catch (error) {
    console.error('Inventory history fetch failed:', error);
    throw new ApiError(
      error.status || 500,
      `Failed to get inventory history: ${error.message}`
    );
  }
});

/**
 * Get Live Shopify Inventory Data
 * Fetches real-time inventory levels from Shopify for allocation decisions
 */
export const getLiveShopifyInventory = asyncHandler(async (req, res) => {
  try {
    const { productId, storeId } = req.params;
    const { locationIds } = req.body;
    const userId = req.user._id;

    if (!productId) {
      throw new ApiError(400, 'Product ID is required');
    }

    if (!storeId) {
      throw new ApiError(400, 'Store ID is required');
    }

    // Get store information to create session
    const Store = (await import('../models/Store.js')).Store;
    const store = await Store.findOne({ _id: storeId, userId: userId });
    
    if (!store) {
      throw new ApiError(404, 'Store not found');
    }

    // Create Shopify session using the correct field
    const session = {
      shop: store.shopDomain,
      accessToken: store.accessToken
    };

    let locations = locationIds;
    
    // If no specific locations provided, get all store locations
    if (!locations || locations.length === 0) {
      try {
        const allLocations = await getLocations(session);
        locations = allLocations.map(loc => loc.id);
      } catch (error) {
        console.warn('Could not fetch locations, proceeding without location filter:', error.message);
        locations = [];
      }
    }

    // Get live inventory data from Shopify
    // Handle case where we don't have locations - get general inventory
    let liveInventoryData;
    if (locations && locations.length > 0) {
      liveInventoryData = await getLiveProductInventoryByLocations(
        session, 
        productId, 
        locations
      );
    } else {
      // Fall back to basic product inventory if no locations available
      liveInventoryData = await getProductInventory(session, productId);
    }

    // Format the response for frontend consumption
    const formattedInventory = {
      productId: liveInventoryData.id,
      productTitle: liveInventoryData.title,
      totalInventory: liveInventoryData.totalInventory || 0,
      variants: liveInventoryData.variants.edges.map(({ node: variant }) => {
        const baseVariant = {
          variantId: variant.id,
          variantTitle: variant.title,
          sku: variant.sku,
          totalQuantity: variant.inventoryQuantity || 0,
          inventoryPolicy: variant.inventoryPolicy,
          inventoryManagement: variant.inventoryManagement
        };

        // Add location breakdown if available
        if (variant.inventoryItem && variant.inventoryItem.inventoryLevels) {
          baseVariant.locationBreakdown = variant.inventoryItem.inventoryLevels.edges.map(({ node: level }) => ({
            locationId: level.location.id,
            locationName: level.location.name,
            available: level.available,
            isActive: level.location.isActive,
            fulfillsOnlineOrders: level.location.fulfillsOnlineOrders
          }));
        } else {
          // No location data available
          baseVariant.locationBreakdown = [];
        }

        return baseVariant;
      })
    };

    res.status(200).json(
      new ApiResponse(200, formattedInventory, 'Live inventory data retrieved successfully')
    );

  } catch (error) {
    console.error('Live inventory fetch failed:', error);
    throw new ApiError(
      error.status || 500,
      `Failed to get live inventory: ${error.message}`
    );
  }
});

/**
 * Get Inventory Allocation Recommendations
 * Analyzes current inventory levels and provides allocation suggestions
 */
export const getInventoryAllocationRecommendations = asyncHandler(async (req, res) => {
  try {
    const { productIds, allocationStrategy = 'balanced' } = req.body;
    const session = req.session;

    if (!session) {
      throw new ApiError(401, 'Shopify session required');
    }

    if (!productIds || productIds.length === 0) {
      throw new ApiError(400, 'Product IDs are required');
    }

    // Get comprehensive inventory data for all products
    const inventoryData = await getInventoryAllocationSummary(session, productIds);
    
    // Get all locations for context
    const allLocations = await getLocations(session);
    const activeLocations = allLocations.filter(loc => 
      loc.isActive && loc.fulfillsOnlineOrders && loc.shipsInventory
    );

    // Generate allocation recommendations based on strategy
    const recommendations = inventoryData.map(product => {
      const productRecommendations = {
        productId: product.id,
        productTitle: product.title,
        totalInventory: product.totalInventory || 0,
        variants: product.variants.edges.map(({ node: variant }) => {
          const totalAvailable = variant.inventoryItem.inventoryLevels.edges
            .reduce((sum, { node: level }) => sum + level.available, 0);

          let allocationSuggestions = [];

          if (allocationStrategy === 'balanced') {
            // Distribute evenly across active locations
            const perLocationAmount = Math.floor(totalAvailable / activeLocations.length);
            const remainder = totalAvailable % activeLocations.length;

            allocationSuggestions = activeLocations.map((location, index) => ({
              locationId: location.id,
              locationName: location.name,
              suggestedAllocation: perLocationAmount + (index < remainder ? 1 : 0),
              currentAvailable: variant.inventoryItem.inventoryLevels.edges
                .find(({ node: level }) => level.location.id === location.id)?.node.available || 0
            }));
          } else if (allocationStrategy === 'priority') {
            // Prioritize primary fulfillment locations
            const primaryLocations = activeLocations.filter(loc => loc.fulfillsOnlineOrders);
            const halfInventory = Math.floor(totalAvailable / 2);
            
            allocationSuggestions = activeLocations.map(location => {
              const isPrimary = primaryLocations.includes(location);
              const baseAllocation = isPrimary ? 
                Math.floor(halfInventory / primaryLocations.length) : 
                Math.floor((totalAvailable - halfInventory) / (activeLocations.length - primaryLocations.length));

              return {
                locationId: location.id,
                locationName: location.name,
                suggestedAllocation: Math.max(0, baseAllocation),
                currentAvailable: variant.inventoryItem.inventoryLevels.edges
                  .find(({ node: level }) => level.location.id === location.id)?.node.available || 0,
                isPriority: isPrimary
              };
            });
          }

          return {
            variantId: variant.id,
            variantTitle: variant.title,
            sku: variant.sku,
            totalAvailable,
            currentDistribution: variant.inventoryItem.inventoryLevels.edges.map(({ node: level }) => ({
              locationId: level.location.id,
              locationName: level.location.name,
              available: level.available
            })),
            recommendedAllocation: allocationSuggestions,
            allocationEfficiency: calculateAllocationEfficiency(variant.inventoryItem.inventoryLevels.edges, activeLocations)
          };
        })
      };

      return productRecommendations;
    });

    res.status(200).json(
      new ApiResponse(200, {
        recommendations,
        allocationStrategy,
        activeLocations: activeLocations.length,
        totalProducts: productIds.length,
        generatedAt: new Date().toISOString()
      }, 'Inventory allocation recommendations generated successfully')
    );

  } catch (error) {
    console.error('Allocation recommendations failed:', error);
    throw new ApiError(
      error.status || 500,
      `Failed to generate allocation recommendations: ${error.message}`
    );
  }
});

/**
 * Get Real-Time Inventory for Allocation Dashboard
 * Provides comprehensive real-time data for allocation interface
 */
export const getRealTimeAllocationData = asyncHandler(async (req, res) => {
  try {
    const { inventoryItemIds, locationIds } = req.body;
    const session = req.session;

    if (!session) {
      throw new ApiError(401, 'Shopify session required');
    }

    if (!inventoryItemIds || inventoryItemIds.length === 0) {
      throw new ApiError(400, 'Inventory item IDs are required');
    }

    // Get real-time inventory levels
    const realTimeData = await getRealTimeInventoryForAllocation(
      session, 
      inventoryItemIds, 
      locationIds || []
    );

    // Group by product and variant for easier frontend consumption
    const organizedData = realTimeData.reduce((acc, level) => {
      const productId = level.item.variant.product.id;
      const variantId = level.item.variant.id;

      if (!acc[productId]) {
        acc[productId] = {
          productId,
          productTitle: level.item.variant.product.title,
          variants: {}
        };
      }

      if (!acc[productId].variants[variantId]) {
        acc[productId].variants[variantId] = {
          variantId,
          variantTitle: level.item.variant.title,
          sku: level.item.sku,
          inventoryItemId: level.item.id,
          locations: []
        };
      }

      acc[productId].variants[variantId].locations.push({
        locationId: level.location.id,
        locationName: level.location.name,
        available: level.available,
        isActive: level.location.isActive,
        fulfillsOnlineOrders: level.location.fulfillsOnlineOrders,
        shipsInventory: level.location.shipsInventory
      });

      return acc;
    }, {});

    // Convert to array format and add summary statistics
    const allocationData = Object.values(organizedData).map(product => ({
      ...product,
      variants: Object.values(product.variants).map(variant => ({
        ...variant,
        totalAvailable: variant.locations.reduce((sum, loc) => sum + loc.available, 0),
        activeLocations: variant.locations.filter(loc => loc.isActive).length,
        fulfillmentLocations: variant.locations.filter(loc => loc.fulfillsOnlineOrders).length
      }))
    }));

    res.status(200).json(
      new ApiResponse(200, {
        allocationData,
        summary: {
          totalProducts: allocationData.length,
          totalVariants: allocationData.reduce((sum, p) => sum + p.variants.length, 0),
          totalLocations: [...new Set(realTimeData.map(level => level.location.id))].length,
          lastUpdated: new Date().toISOString()
        }
      }, 'Real-time allocation data retrieved successfully')
    );

  } catch (error) {
    console.error('Real-time allocation data fetch failed:', error);
    throw new ApiError(
      error.status || 500,
      `Failed to get real-time allocation data: ${error.message}`
    );
  }
});

/**
 * Helper function to calculate allocation efficiency
 * @param {Array} inventoryLevels - Current inventory levels
 * @param {Array} activeLocations - Active locations
 * @returns {number} Efficiency score (0-100)
 */
function calculateAllocationEfficiency(inventoryLevels, activeLocations) {
  const totalInventory = inventoryLevels.reduce((sum, { node: level }) => sum + level.available, 0);
  
  if (totalInventory === 0) return 0;
  
  const locationsWithInventory = inventoryLevels.filter(({ node: level }) => level.available > 0).length;
  const activeLocationCount = activeLocations.length;
  
  // Efficiency based on distribution across locations
  const distributionScore = (locationsWithInventory / activeLocationCount) * 100;
  
  // Bonus for balanced distribution
  const quantities = inventoryLevels.map(({ node: level }) => level.available);
  const avg = totalInventory / quantities.length;
  const variance = quantities.reduce((sum, qty) => sum + Math.pow(qty - avg, 2), 0) / quantities.length;
  const balanceScore = Math.max(0, 100 - (variance / avg) * 10);
  
  return Math.round((distributionScore * 0.7) + (balanceScore * 0.3));
}
