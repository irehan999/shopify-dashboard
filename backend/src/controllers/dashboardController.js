import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { Product } from '../models/ProductOptimized.js';
import { ProductMap } from '../models/ProductMap.js';
import { UserNotification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHanlde.js';

/**
 * DASHBOARD CONTROLLER
 * ====================
 * 
 * Provides dashboard statistics and overview data for the user.
 * Integrates with all major features to give a comprehensive view.
 * 
 * Features:
 * - User dashboard statistics
 * - Recent activity feed
 * - Store connection status
 * - Product sync status
 * - Quick action insights
 */

/**
 * Get Dashboard Statistics
 * @route GET /api/dashboard/stats
 * @desc Get comprehensive dashboard statistics for the authenticated user
 * @access Private
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    // Get total products count (for this user)
    // Note: ProductOptimized does not have isDeleted, so don't filter by it
    const totalProducts = await Product.countDocuments({ 
      createdBy: userId
    });

    // Get connected stores count  
    const connectedStores = await Store.countDocuments({ 
      userId,
      isActive: true 
    });

    // Get pushed products - dashboard products that have at least one store mapping
    const pushedProductIds = await ProductMap.distinct('dashboardProduct', {
      createdBy: userId,
      isDeleted: false,
      'storeMappings.0': { $exists: true }
    });

    const unpushedProducts = await Product.countDocuments({
      createdBy: userId,
      _id: { $nin: pushedProductIds }
    });

    const pushedProducts = Math.max(0, totalProducts - unpushedProducts);

    // Get recent notifications count
    const recentNotifications = await UserNotification.countDocuments({
      userId,
      isRead: false,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const stats = {
      totalProducts,
      pushedProducts,
      connectedStores,
      unpushedProducts,
      recentNotifications,
    };

    console.log('Dashboard stats for user:', userId, stats);

    return res.status(200).json(
      new ApiResponse(200, stats, 'Dashboard statistics retrieved successfully')
    );
  } catch (error) {
    console.error('Dashboard stats error:', error);
    throw new ApiError(500, 'Failed to retrieve dashboard statistics');
  }
});

/**
 * Get Unpushed Products
 * @route GET /api/dashboard/unpushed-products  
 * @desc Get products that haven't been pushed to any store
 * @access Private
 */
export const getUnpushedProducts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // Get IDs of products that have been pushed (have ProductMap entries)
    const pushedProductIds = await ProductMap.distinct('dashboardProduct', {
      createdBy: userId,
      isDeleted: false,
      'storeMappings.0': { $exists: true }
    });

    // Find products that haven't been pushed to any store
    const unpushedProducts = await Product.find({
      createdBy: userId,
      _id: { $nin: pushedProductIds }
    })
      // Select only the fields we can render on the dashboard
      .select('title descriptionHtml media variants createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log(`Found ${unpushedProducts.length} unpushed products for user:`, userId);

    return res.status(200).json(
      new ApiResponse(200, { products: unpushedProducts, total: unpushedProducts.length }, 'Unpushed products retrieved successfully')
    );
  } catch (error) {
    console.error('Unpushed products error:', error);
    throw new ApiError(500, 'Failed to retrieve unpushed products');
  }
});


