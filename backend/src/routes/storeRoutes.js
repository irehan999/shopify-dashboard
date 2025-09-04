/**
 * Store Routes
 * Routes for store-specific operations like collections and locations
 */

import { Router } from 'express';
import {
  getStoreCollections,
  getStoreLocations,
  getStoreSummary
} from '../controllers/shopifyStoreController.js';

const router = Router();

// Get collections for a specific store (for dynamic selection)
router.get('/stores/:storeId/collections', getStoreCollections);

// Get locations for a specific store (for inventory management)
router.get('/stores/:storeId/locations', getStoreLocations);

// Get store summary (collections count, locations, capabilities)
router.get('/stores/:storeId/summary', getStoreSummary);

export default router;
