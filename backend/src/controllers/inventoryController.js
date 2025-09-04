/**
 * Inventory Management Controller
 * Handles inventory assignment, tracking, and synchronization between dashboard and stores
 */

import asyncHandler from '../utils/AsyncHanlde.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Product } from '../models/ProductOptimized.js';
import { ProductMap } from '../models/ProductMap.js';
import { getProductInventory } from '../graphql/queries/productQueries.js';
import { getStoreLocationsQuery } from '../graphql/queries/locationQueries.js';

/**
 * Get Store Locations
 * Fetches all locations for inventory management
 */
export const getStoreLocations = asyncHandler(async (req, res) => {
  try {
    const session = req.session;
    if (!session) {
      throw new ApiError(401, 'Shopify session required');
    }

    const locationsData = await getStoreLocationsQuery(session);
    
    const response = {
      success: true,
      locations: locationsData,
      count: locationsData.length,
      executionTime: new Date()
    };

    res.status(200).json(
      new ApiResponse(200, response, 'Store locations retrieved successfully')
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
