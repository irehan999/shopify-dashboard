/**
 * Store Session Middleware
 * Creates Shopify session from storeId parameter for multi-store operations
 */

import { Store } from '../models/Store.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware to create Shopify session from storeId parameter
 * Works with routes like: /products/:productId/stores/:storeId/create
 */
export const createStoreSession = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    
    if (!storeId) {
      throw new ApiError(400, 'Store ID is required');
    }

    // Find the store and verify it belongs to the authenticated user
    const store = await Store.findOne({
      _id: storeId,
      userId: req.user._id,
      isActive: true
    });

    if (!store) {
      throw new ApiError(404, 'Store not found or not accessible');
    }

    // Create manual session object (same as collection controller)
    req.session = {
      shop: store.shopDomain,
      accessToken: store.accessToken,
      scope: store.scopes.join(','),
      id: `offline_${store.shopDomain}`,
      isOnline: false
    };

    // Also attach store info for controller use
    req.store = store;

    next();
  } catch (error) {
    console.error('Store session middleware error:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create store session'
    });
  }
};

/**
 * Middleware for bulk operations that work with multiple stores
 * Expects storeIds in request body
 */
export const createBulkStoreSessions = async (req, res, next) => {
  try {
    const { storeIds } = req.body;
    
    if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
      throw new ApiError(400, 'Store IDs array is required');
    }

    // Find all stores and verify they belong to the authenticated user
    const stores = await Store.find({
      _id: { $in: storeIds },
      userId: req.user._id,
      isActive: true
    });

    if (stores.length !== storeIds.length) {
      throw new ApiError(404, 'One or more stores not found or not accessible');
    }

    // Create sessions for all stores
    req.storeSessions = stores.map(store => ({
      storeId: store._id,
      session: {
        shop: store.shopDomain,
        accessToken: store.accessToken,
        scope: store.scopes.join(','),
        id: `offline_${store.shopDomain}`,
        isOnline: false
      },
      store: store
    }));

    next();
  } catch (error) {
    console.error('Bulk store sessions middleware error:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create bulk store sessions'
    });
  }
};
