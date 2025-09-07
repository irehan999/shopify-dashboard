/**
 * New Shopify GraphQL Routes
 * Clean routes for the new GraphQL controller with proper organization
 */

import express from 'express';

// Import all controller functions at once for better readability
import * as shopifyController from '../controllers/shopifyGraphQLControllerNew.js';

// Import correct middleware
import { authenticateUser } from '../middleware/auth.js';
import { createStoreSession, createBulkStoreSessions } from '../middleware/storeSession.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

/**
 * Product Creation Routes
 * POST /api/shopify/products/:productId/stores/:storeId/create
 */
router.post('/products/:productId/stores/:storeId/create', createStoreSession, shopifyController.executeCreateProduct);

/**
 * Product Update Routes  
 * PUT /api/shopify/products/:productId/stores/:storeId/update
 */
router.put('/products/:productId/stores/:storeId/update', createStoreSession, shopifyController.executeUpdateProduct);

/**
 * Product Sync Routes
 * POST /api/shopify/products/:productId/stores/:storeId/sync
 */
router.post('/products/:productId/stores/:storeId/sync', createStoreSession, shopifyController.executeSyncProduct);

// Variant media association (dashboard only; does not require store session)
// POST /api/shopify/products/:productId/variants/media
router.post('/products/:productId/variants/media', shopifyController.associateVariantMedia);

/**
 * Get Product Sync Status Across All Stores
 * GET /api/shopify/products/:productId/sync-status
 */
router.get('/products/:productId/sync-status', shopifyController.getProductSyncStatus);

/**
 * Product Deletion Routes
 * DELETE /api/shopify/products/:productId/stores/:storeId
 */
router.delete('/products/:productId/stores/:storeId', createStoreSession, shopifyController.executeDeleteProduct);

/**
 * Get Shopify Product Data
 * GET /api/shopify/products/:productId/stores/:storeId
 */
router.get('/products/:productId/stores/:storeId', createStoreSession, shopifyController.getShopifyProduct);

/**
 * Store Inventory Routes
 * GET /api/shopify/products/:productId/stores/:storeId/inventory
 */
router.get('/products/:productId/stores/:storeId/inventory', createStoreSession, shopifyController.getStoreInventory);

/**
 * Search Store Products
 * GET /api/shopify/stores/:storeId/products/search
 */
router.get('/stores/:storeId/products/search', createStoreSession, shopifyController.searchShopifyProducts);

/**
 * Bulk Operations Routes
 * POST /api/shopify/stores/:storeId/products/bulk-sync
 */
router.post('/stores/:storeId/products/bulk-sync', createStoreSession, shopifyController.executeBulkSync);

/**
 * Health Check Route
 * GET /api/shopify/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Shopify GraphQL service is healthy',
    timestamp: new Date(),
    version: '2.0.0'
  });
});

export default router;
