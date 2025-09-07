/**
 * Inventory Routes
 * Routes for inventory management between dashboard and stores
 */

import { Router } from 'express';
import {
  getStoreLocations,
  assignInventoryToStore,
  syncInventoryFromShopify,
  getInventorySummary,
  getInventoryHistory,
  getLiveShopifyInventory,
  getInventoryAllocationRecommendations,
  getRealTimeAllocationData
} from '../controllers/inventoryController.js';

import { createStoreSession } from '../middleware/storeSession.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Get store locations for specific store (requires storeId)
router.get('/stores/:storeId/locations', getStoreLocations);

// Assign inventory from master product to store
router.post('/products/:productId/stores/:storeId/inventory/assign', assignInventoryToStore);

// Sync inventory from Shopify store to update our records
router.post('/products/:productId/stores/:storeId/inventory/sync', syncInventoryFromShopify);

// Get inventory summary for a product (all stores or specific store)
router.get('/products/:productId/inventory/summary', getInventorySummary);

// Get inventory change history
router.get('/products/:productId/stores/:storeId/inventory/history', getInventoryHistory);

// Live Shopify inventory data routes
router.post('/products/:productId/stores/:storeId/live-inventory', getLiveShopifyInventory);

// Get inventory allocation recommendations
router.post('/allocation/recommendations', getInventoryAllocationRecommendations);

// Get real-time allocation data for dashboard
router.post('/allocation/real-time', getRealTimeAllocationData);

export default router;
