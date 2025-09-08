/**
 * Store Routes
 * Routes for store-specific operations like collections and locations
 */

import { Router } from 'express';

import {
  getStoreDetails,
  getUserStores,
  getStorePushedProducts,
  getStoreStats,
  getStoreSyncHistory
} from '../controllers/storeController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Store management routes
router.get('/', getUserStores);
router.get('/:storeId', getStoreDetails);
router.get('/:storeId/products', getStorePushedProducts);
router.get('/:storeId/stats', getStoreStats);
router.get('/:storeId/sync-history', getStoreSyncHistory);



export default router;
