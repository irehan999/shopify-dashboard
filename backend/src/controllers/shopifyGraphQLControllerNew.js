/**
 * New Shopify GraphQL Controller
 * Clean, efficient controller that properly shapes Product data for Shopify mutations
 * Uses existing validated GraphQL operations with proper error handling
 */

import asyncHandler from '../utils/AsyncHanlde.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Product } from '../models/ProductOptimized.js';
import { ProductMap } from '../models/ProductMap.js';

// GraphQL Operations - All validated mutations and queries
import {
  createProduct,
  updateProduct,
  deleteProduct,
  syncProduct,
  createProductVariants,
  updateProductVariants,
  deleteProductVariants,
  createProductOptions,
  updateProductOption,
  deleteProductOptions
} from '../graphql/mutations/productMutations.js';

import {
  createFiles,
  createProductMedia
} from '../graphql/mutations/mediaMutations.js';

import {
  getPrimaryLocationId
} from '../graphql/queries/locationQueries.js';

import {
  getProducts,
  getProduct,
  getProductsByHandles,
  searchProducts,
  getProductInventory
} from '../graphql/queries/productQueries.js';

/**
 * Execute Shopify Product Creation
 * Efficiently shapes Product data and handles complete product creation workflow
 */
export const executeCreateProduct = asyncHandler(async (req, res) => {
  const { productId, storeId } = req.params;
  const { syncVariants = true, syncMedia = true, syncOptions = true } = req.body;

  if (!productId || !storeId) {
    throw new ApiError(400, 'Product ID and Store ID are required');
  }

  try {
    // Get Product with all relations
    const product = await Product.findById(productId)
      .populate('variants')
      .populate('media')
      .populate('options');

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Get Shopify session from validated middleware
    const session = req.session;
    if (!session) {
      throw new ApiError(401, 'Shopify session required');
    }

    // Shape data efficiently for Shopify
    const productInput = product.toShopifyProductInput();
    
    // Execute product creation
    const result = await createProduct(session, productInput);
    const shopifyProductId = result.product.id;

    // Save mapping
    await ProductMap.create({
      dashboardProductId: productId,
      shopifyProductId: shopifyProductId,
      storeId: storeId,
      handle: result.product.handle,
      lastSyncAt: new Date(),
      syncStatus: 'active'
    });

    let variantsResult = null;
    let mediaResult = null;
    let optionsResult = null;

    // Sync variants if requested and available
    if (syncVariants && product.variants?.length > 0) {
      const variantsInput = product.toShopifyVariantsInput(shopifyProductId);
      variantsResult = await createProductVariants(session, shopifyProductId, variantsInput);
    }

    // Sync media if requested and available
    if (syncMedia && product.media?.length > 0) {
      const mediaInput = product.toShopifyMediaInput();
      
      // First create files in Shopify
      const filesResult = await createFiles(session, mediaInput);
      
      // Then associate with product
      const productMediaInput = filesResult.files.map(file => ({
        originalSource: file.image?.url || file.sources?.[0]?.url,
        alt: file.alt
      }));
      
      mediaResult = await createProductMedia(session, shopifyProductId, productMediaInput);
    }

    // Sync options if requested and available
    if (syncOptions && product.options?.length > 0) {
      const optionsInput = product.options;
      optionsResult = await createProductOptions(session, shopifyProductId, optionsInput);
    }

    // Compile comprehensive response
    const response = {
      success: true,
      shopifyProduct: result.product,
      mapping: {
        dashboardProductId: productId,
        shopifyProductId: shopifyProductId,
        storeId: storeId
      },
      syncResults: {
        variants: variantsResult,
        media: mediaResult,
        options: optionsResult
      },
      executionTime: new Date()
    };

    res.status(201).json(
      new ApiResponse(201, response, 'Product successfully created in Shopify')
    );

  } catch (error) {
    console.error('Shopify product creation failed:', error);
    throw new ApiError(
      error.status || 500,
      `Shopify product creation failed: ${error.message}`
    );
  }
});

/**
 * Execute Shopify Product Update
 * Efficiently updates existing Shopify product with new data
 */
export const executeUpdateProduct = asyncHandler(async (req, res) => {
  const { productId, storeId } = req.params;
  const { updateVariants = true, updateMedia = false, updateOptions = false } = req.body;

  // Get product mapping
  const mapping = await ProductMap.findOne({
    dashboardProductId: productId,
    storeId: storeId
  });

  if (!mapping) {
    throw new ApiError(404, 'Product mapping not found. Product may not be synced to this store.');
  }

  try {
    // Get updated product data
    const product = await Product.findById(productId)
      .populate('variants')
      .populate('media')
      .populate('options');

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const session = req.session;
    if (!session) {
      throw new ApiError(401, 'Shopify session required');
    }

    // Shape data for update
    const updateInput = {
      id: mapping.shopifyProductId,
      ...product.toShopifyProductInput()
    };

    // Execute update
    const result = await updateProduct(session, updateInput);

    let variantsResult = null;
    let mediaResult = null;
    let optionsResult = null;

    // Update variants if requested
    if (updateVariants && product.variants?.length > 0) {
      const variantsInput = product.toShopifyVariantsInput(mapping.shopifyProductId);
      variantsResult = await updateProductVariants(session, mapping.shopifyProductId, variantsInput);
    }

    // Update media if requested (careful - this can be expensive)
    if (updateMedia && product.media?.length > 0) {
      const mediaInput = product.toShopifyMediaInput();
      const filesResult = await createFiles(session, mediaInput);
      
      const productMediaInput = filesResult.files.map(file => ({
        originalSource: file.image?.url || file.sources?.[0]?.url,
        alt: file.alt
      }));
      
      mediaResult = await createProductMedia(session, mapping.shopifyProductId, productMediaInput);
    }

    // Update options if requested
    if (updateOptions && product.options?.length > 0) {
      const optionsInput = product.options;
      optionsResult = await createProductOptions(session, mapping.shopifyProductId, optionsInput);
    }

    // Update mapping sync status
    await ProductMap.findByIdAndUpdate(mapping._id, {
      lastSyncAt: new Date(),
      syncStatus: 'active'
    });

    const response = {
      success: true,
      shopifyProduct: result.product,
      mapping: {
        dashboardProductId: productId,
        shopifyProductId: mapping.shopifyProductId,
        storeId: storeId
      },
      updateResults: {
        variants: variantsResult,
        media: mediaResult,
        options: optionsResult
      },
      executionTime: new Date()
    };

    res.status(200).json(
      new ApiResponse(200, response, 'Product successfully updated in Shopify')
    );

  } catch (error) {
    console.error('Shopify product update failed:', error);
    throw new ApiError(
      error.status || 500,
      `Shopify product update failed: ${error.message}`
    );
  }
});

/**
 * Execute Shopify Product Sync
 * Comprehensive sync operation that handles all aspects
 */
export const executeSyncProduct = asyncHandler(async (req, res) => {
  const { productId, storeId } = req.params;
  const { 
    forceSync = false, 
  variantOverrides = {}, // { [variantIndex]: { price?, compareAtPrice?, sku? } }
  assignedInventory = {} // { [variantIndex]: number }
  } = req.body;

  try {
    // Debug input for StorePush
    console.log('StorePush Debug: executeSyncProduct payload ->', {
      productId,
      storeId,
      forceSync,
      hasVariantOverrides: !!variantOverrides && Object.keys(variantOverrides).length > 0,
      hasAssignedInventory: !!assignedInventory && Object.keys(assignedInventory).length > 0
    });
    // Get product with all relations
    const product = await Product.findById(productId)
      .populate('variants')
      .populate('media')
      .populate('options');

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const session = req.session;
    if (!session) {
      throw new ApiError(401, 'Shopify session required');
    }

    // Check if mapping exists
    let mapping = await ProductMap.findOne({
      dashboardProduct: productId,
      'storeMappings.store': storeId
    });

    let result;
    let operation;

  // Inventory/location: keep simple for now; do not require location.
  const targetLocationId = null; // TODO: Re-enable location resolution when permissions are granted

  // Use productSet mutation for upsert functionality (Shopify recommended approach)
  // Merge variant overrides into the productSet input
  const productSetInput = product.toShopifyProductSetInput(targetLocationId, [], variantOverrides);
  // Debug: show the exact ProductSetInput we will send
  console.log('StorePush Debug: productSetInput ->', JSON.stringify(productSetInput, null, 2));
    result = await syncProduct(session, productSetInput);
    
    // Determine operation based on whether mapping existed
    operation = mapping ? 'updated' : 'created';

    // Create or update mapping
    if (mapping) {
      // Update existing store mapping
      const storeMapping = mapping.getStoreMapping(storeId);
      if (storeMapping) {
        storeMapping.shopifyProductId = result.product.id;
        storeMapping.shopifyHandle = result.product.handle;
        storeMapping.lastSyncAt = new Date();
        storeMapping.status = 'active';
        storeMapping.updatedAt = new Date();
        
        // Update variant mappings with new Shopify variant IDs
        if (result.product.variants) {
          result.product.variants.edges.forEach((variantEdge, index) => {
            const variant = variantEdge.node;
            const override = variantOverrides?.[index] || {};
            mapping.updateVariantMapping(storeId, index, variant.id, {
              ...(override.price ? { customPrice: Number(override.price) } : {}),
              ...(override.compareAtPrice ? { customCompareAtPrice: Number(override.compareAtPrice) } : {})
            });

            // Assign inventory if provided
            const qty = assignedInventory?.[index];
            if (typeof qty === 'number' && qty >= 0) {
              mapping.assignInventoryToStore(
                storeId,
                index,
                qty,
                null,
                req.user?.id
              );
            }
          });
        }
        
        await mapping.save();
      }
    } else {
      // Create new mapping using the complex schema
      mapping = new ProductMap({
        dashboardProduct: productId,
        createdBy: req.user?.id, // Assuming user is in request
        storeMappings: [{
          store: storeId,
          shopifyProductId: result.product.id,
          shopifyHandle: result.product.handle,
          status: 'active',
          syncSettings: {
            autoSync: true,
            syncTitle: true,
            syncDescription: true,
            syncPrice: true,
            syncInventory: true,
            syncMedia: true,
            syncSEO: true,
            syncTags: true,
            syncVariants: true,
            syncStatus: true
          },
          variantMappings: [],
          lastSyncAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        mappingStats: {
          totalStores: 1,
          activeStores: 1,
          totalSyncs: 1,
          successfulSyncs: 1,
          failedSyncs: 0
        }
      });
      
      // Add variant mappings with inventory tracking
      if (result.product.variants) {
        result.product.variants.edges.forEach((variantEdge, index) => {
          const variant = variantEdge.node;
          const override = variantOverrides?.[index] || {};
          const qty = assignedInventory?.[index];
          mapping.storeMappings[0].variantMappings.push({
            dashboardVariantIndex: index,
            shopifyVariantId: variant.id,
            isActive: true,
            ...(override.price ? { customPrice: Number(override.price) } : {}),
            ...(override.compareAtPrice ? { customCompareAtPrice: Number(override.compareAtPrice) } : {}),
            inventoryTracking: {
              assignedQuantity: typeof qty === 'number' ? qty : 0,
              assignedAt: typeof qty === 'number' ? new Date() : null,
              assignedBy: typeof qty === 'number' ? req.user?.id : null,
              lastKnownShopifyQuantity: 0,
              inventoryPolicy: 'deny',
              trackQuantity: true,
              locationInventory: [],
              inventoryHistory: typeof qty === 'number' ? [{
                action: 'assigned',
                quantity: qty,
                previousQuantity: 0,
                reason: 'Initial assignment during sync',
                timestamp: new Date(),
                syncedBy: req.user?.id,
                locationId: null
              }] : []
            }
          });
        });
      }
      
      await mapping.save();
    }

    // Get inventory summary for response
    const inventorySummary = mapping.getInventorySummary(storeId);

    const response = {
      success: true,
      operation: operation,
      shopifyProduct: result.product,
      mapping: {
        dashboardProductId: productId,
        shopifyProductId: result.product.id,
        storeId: storeId,
        handle: result.product.handle
      },
      inventory: inventorySummary,
      executionTime: new Date()
    };

    res.status(200).json(
  new ApiResponse(200, response, `Product successfully ${operation} in Shopify with overrides and inventory assignment stored`)
    );

  } catch (error) {
    console.error('Shopify product sync failed:', error);
    throw new ApiError(
      error.status || 500,
      `Shopify product sync failed: ${error.message}`
    );
  }
});

/**
 * Execute Shopify Product Deletion
 * Safely removes product and updates mapping
 */
export const executeDeleteProduct = asyncHandler(async (req, res) => {
  const { productId, storeId } = req.params;

  // Get mapping
  const mapping = await ProductMap.findOne({
    dashboardProductId: productId,
    storeId: storeId
  });

  if (!mapping) {
    throw new ApiError(404, 'Product mapping not found');
  }

  try {
    const session = req.session;
    if (!session) {
      throw new ApiError(401, 'Shopify session required');
    }

    // Delete from Shopify
    const result = await deleteProduct(session, mapping.shopifyProductId);

    // Update mapping status (keep for history)
    await ProductMap.findByIdAndUpdate(mapping._id, {
      syncStatus: 'deleted',
      lastSyncAt: new Date()
    });

    const response = {
      success: true,
      deletedProductId: mapping.shopifyProductId,
      mapping: {
        dashboardProductId: productId,
        storeId: storeId,
        status: 'deleted'
      },
      executionTime: new Date()
    };

    res.status(200).json(
      new ApiResponse(200, response, 'Product successfully deleted from Shopify')
    );

  } catch (error) {
    console.error('Shopify product deletion failed:', error);
    throw new ApiError(
      error.status || 500,
      `Shopify product deletion failed: ${error.message}`
    );
  }
});

/**
 * Get Shopify Product Data
 * Retrieves current product data from Shopify
 */
export const getShopifyProduct = asyncHandler(async (req, res) => {
  const { productId, storeId } = req.params;

  // Get mapping
  const mapping = await ProductMap.findOne({
    dashboardProductId: productId,
    storeId: storeId,
    syncStatus: { $ne: 'deleted' }
  });

  if (!mapping) {
    throw new ApiError(404, 'Product not found in Shopify store');
  }

  try {
    const session = req.session;
    if (!session) {
      throw new ApiError(401, 'Shopify session required');
    }

    // Get full product data from Shopify
    const shopifyProduct = await getProduct(session, mapping.shopifyProductId);

    if (!shopifyProduct) {
      // Update mapping status
      await ProductMap.findByIdAndUpdate(mapping._id, {
        syncStatus: 'not_found'
      });
      throw new ApiError(404, 'Product not found in Shopify');
    }

    const response = {
      success: true,
      shopifyProduct: shopifyProduct,
      mapping: {
        dashboardProductId: productId,
        shopifyProductId: mapping.shopifyProductId,
        storeId: storeId,
        handle: mapping.handle,
        lastSyncAt: mapping.lastSyncAt
      },
      executionTime: new Date()
    };

    res.status(200).json(
      new ApiResponse(200, response, 'Shopify product retrieved successfully')
    );

  } catch (error) {
    console.error('Shopify product retrieval failed:', error);
    throw new ApiError(
      error.status || 500,
      `Failed to retrieve Shopify product: ${error.message}`
    );
  }
});

/**
 * Search Shopify Products
 * Search products in connected Shopify store
 */
export const searchShopifyProducts = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { query, limit = 50, cursor } = req.query;

  try {
    const session = req.session;
    if (!session) {
      throw new ApiError(401, 'Shopify session required');
    }

    // Execute search
    const results = await searchProducts(session, query, {
      first: parseInt(limit),
      after: cursor
    });

    // Get mappings for found products
    const shopifyIds = results.products.edges.map(edge => edge.node.id);
    const mappings = await ProductMap.find({
      shopifyProductId: { $in: shopifyIds },
      storeId: storeId
    });

    // Enhance results with mapping info
    const enhancedProducts = results.products.edges.map(edge => ({
      ...edge.node,
      dashboardMapping: mappings.find(m => m.shopifyProductId === edge.node.id) || null
    }));

    const response = {
      success: true,
      products: enhancedProducts,
      pageInfo: results.products.pageInfo,
      storeId: storeId,
      searchQuery: query,
      executionTime: new Date()
    };

    res.status(200).json(
      new ApiResponse(200, response, 'Shopify products search completed')
    );

  } catch (error) {
    console.error('Shopify products search failed:', error);
    throw new ApiError(
      error.status || 500,
      `Shopify products search failed: ${error.message}`
    );
  }
});

/**
 * Get Store Product Inventory
 * Retrieve inventory levels for Shopify products
 */
export const getStoreInventory = asyncHandler(async (req, res) => {
  const { productId, storeId } = req.params;

  // Get mapping
  const mapping = await ProductMap.findOne({
    dashboardProductId: productId,
    storeId: storeId,
    syncStatus: 'active'
  });

  if (!mapping) {
    throw new ApiError(404, 'Active product mapping not found');
  }

  try {
    const session = req.session;
    if (!session) {
      throw new ApiError(401, 'Shopify session required');
    }

    // Get inventory data
    const inventoryData = await getProductInventory(session, mapping.shopifyProductId);

    const response = {
      success: true,
      inventory: inventoryData,
      mapping: {
        dashboardProductId: productId,
        shopifyProductId: mapping.shopifyProductId,
        storeId: storeId
      },
      executionTime: new Date()
    };

    res.status(200).json(
      new ApiResponse(200, response, 'Inventory data retrieved successfully')
    );

  } catch (error) {
    console.error('Inventory retrieval failed:', error);
    throw new ApiError(
      error.status || 500,
      `Failed to retrieve inventory: ${error.message}`
    );
  }
});

/**
 * Bulk Sync Products
 * Efficiently sync multiple products to Shopify store
 */
export const executeBulkSync = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { productIds, options = {} } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new ApiError(400, 'Product IDs array is required');
  }

  const session = req.session;
  if (!session) {
    throw new ApiError(401, 'Shopify session required');
  }

  const results = [];
  const errors = [];

  // Process products in batches to avoid overwhelming Shopify API
  const batchSize = options.batchSize || 5;
  
  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (productId) => {
      try {
        // Get product
        const product = await Product.findById(productId)
          .populate('variants')
          .populate('media')
          .populate('options');

        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        // Check mapping
        let mapping = await ProductMap.findOne({
          dashboardProductId: productId,
          storeId: storeId
        });

        let result;
        let operation;

        if (!mapping) {
          // Create new
          const productInput = product.toShopifyProductInput();
          result = await createProduct(session, productInput);
          operation = 'created';

          mapping = await ProductMap.create({
            dashboardProductId: productId,
            shopifyProductId: result.product.id,
            storeId: storeId,
            handle: result.product.handle,
            lastSyncAt: new Date(),
            syncStatus: 'active'
          });
        } else {
          // Update existing
          const updateInput = {
            id: mapping.shopifyProductId,
            ...product.toShopifyProductInput()
          };
          result = await updateProduct(session, updateInput);
          operation = 'updated';

          await ProductMap.findByIdAndUpdate(mapping._id, {
            lastSyncAt: new Date(),
            syncStatus: 'active'
          });
        }

        return {
          productId,
          operation,
          success: true,
          shopifyProductId: result.product.id,
          handle: result.product.handle
        };

      } catch (error) {
        return {
          productId,
          success: false,
          error: error.message
        };
      }
    });

    // Wait for batch to complete
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          results.push(result.value);
        } else {
          errors.push(result.value);
        }
      } else {
        errors.push({
          productId: 'unknown',
          success: false,
          error: result.reason.message
        });
      }
    });

    // Add delay between batches to respect rate limits
    if (i + batchSize < productIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const response = {
    success: true,
    summary: {
      total: productIds.length,
      successful: results.length,
      failed: errors.length
    },
    results: results,
    errors: errors,
    storeId: storeId,
    executionTime: new Date()
  };

  res.status(200).json(
    new ApiResponse(200, response, `Bulk sync completed: ${results.length} successful, ${errors.length} failed`)
  );
});

/**
 * Get Product Sync Status Across All Stores
 * Returns sync status for a product in all connected stores
 */
export const getProductSyncStatus = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  try {
    // Get the product to verify it exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Get all user's active stores
    const stores = await Store.find({
      userId: req.user._id,
      isActive: true
    });

    // Get all ProductMap entries for this product
    const productMappings = await ProductMap.find({
      dashboardProduct: productId
    }).populate('storeMappings.store');

    // Build sync status for each store
    const syncStatuses = stores.map(store => {
      const mapping = productMappings.find(pm => 
        pm.storeMappings.some(sm => sm.store._id.toString() === store._id.toString())
      );

      if (!mapping) {
        return {
          storeId: store._id,
          storeName: store.shopName,
          shopDomain: store.shopDomain,
          isSynced: false,
          syncStatus: 'not_synced',
          lastSyncAt: null,
          shopifyProductId: null,
          variantCount: 0
        };
      }

      const storeMapping = mapping.getStoreMapping(store._id);
      
      return {
        storeId: store._id,
        storeName: store.shopName,
        shopDomain: store.shopDomain,
        isSynced: true,
        syncStatus: storeMapping.status,
        lastSyncAt: storeMapping.lastSyncAt,
        shopifyProductId: storeMapping.shopifyProductId,
        shopifyHandle: storeMapping.shopifyHandle,
        variantCount: storeMapping.variantMappings.length,
        createdAt: storeMapping.createdAt,
        updatedAt: storeMapping.updatedAt
      };
    });

    const response = {
      success: true,
      productId: productId,
      productTitle: product.title,
      totalStores: stores.length,
      syncedStores: syncStatuses.filter(s => s.isSynced).length,
      syncStatuses: syncStatuses,
      generatedAt: new Date()
    };

    res.status(200).json(
      new ApiResponse(200, response, 'Product sync status retrieved successfully')
    );

  } catch (error) {
    console.error('Product sync status fetch failed:', error);
    throw new ApiError(
      error.status || 500,
      `Failed to get product sync status: ${error.message}`
    );
  }
});

