import { Store } from '../models/Store.js';
import { ProductMap } from '../models/ProductMap.js';
import { Product } from '../models/ProductOptimized.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHanlde.js';

// Get store details with basic information
export const getStoreDetails = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const userId = req.user._id;

    console.log('Getting store details for store:', storeId, 'user:', userId);

    // Find store belonging to user
    const store = await Store.findOne({ 
        _id: storeId, 
        userId,
        isActive: true 
    }).select('-accessToken'); // Don't expose access token

    if (!store) {
        throw new ApiError(404, 'Store not found or not accessible');
    }

    console.log('Store found:', store.shopName, store.shopDomain);

    return res.status(200).json(
        new ApiResponse(200, store, 'Store details retrieved successfully')
    );
});

// Get all stores for user
export const getUserStores = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log('Getting all stores for user:', userId);

    const stores = await Store.find({ 
        userId,
        isActive: true 
    }).select('-accessToken').sort({ connectedAt: -1 });

    console.log('Found stores:', stores.length);

    return res.status(200).json(
        new ApiResponse(200, stores, 'User stores retrieved successfully')
    );
});

// Get products pushed to a specific store
export const getStorePushedProducts = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 20, status = 'all' } = req.query;

    console.log('Getting pushed products for store:', storeId, 'user:', userId);

    // Verify store belongs to user
    const store = await Store.findOne({ 
        _id: storeId, 
        userId,
        isActive: true 
    });

    if (!store) {
        throw new ApiError(404, 'Store not found or not accessible');
    }

    // Build query for ProductMaps
    const query = {
        createdBy: userId,
        'storeMappings.store': storeId,
        isDeleted: false
    };

    // Add status filter if specified
    if (status !== 'all') {
        query['storeMappings.status'] = status;
    }

    console.log('ProductMap query:', query);

    // Get product maps with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [productMaps, totalCount] = await Promise.all([
        ProductMap.find(query)
            .populate('dashboardProduct', 'title descriptionHtml media variants tags status handle createdAt')
            .populate('storeMappings.store', 'shopName shopDomain')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 }),
        ProductMap.countDocuments(query)
    ]);

    console.log('Found product maps:', productMaps.length, 'total:', totalCount);

    // Format the response data
    const pushedProducts = productMaps.map(productMap => {
        const storeMapping = productMap.storeMappings.find(
            mapping => mapping.store._id.toString() === storeId.toString()
        );

        return {
            _id: productMap.dashboardProduct._id,
            title: productMap.dashboardProduct.title,
            description: productMap.dashboardProduct.descriptionHtml,
            handle: productMap.dashboardProduct.handle,
            media: productMap.dashboardProduct.media || [],
            variants: productMap.dashboardProduct.variants || [],
            tags: productMap.dashboardProduct.tags || [],
            status: productMap.dashboardProduct.status,
            createdAt: productMap.dashboardProduct.createdAt,
            
            // Store-specific mapping information
            mapping: {
                shopifyProductId: storeMapping?.shopifyProductId,
                shopifyHandle: storeMapping?.shopifyHandle,
                status: storeMapping?.status,
                isPublished: storeMapping?.isPublished,
                publishedAt: storeMapping?.publishedAt,
                lastSyncAt: storeMapping?.lastSyncAt,
                lastSuccessfulSyncAt: storeMapping?.lastSuccessfulSyncAt,
                lastSyncError: storeMapping?.lastSyncError,
                syncSettings: storeMapping?.syncSettings,
                priceAdjustments: storeMapping?.priceAdjustments,
                variantMappings: storeMapping?.variantMappings || [],
                createdAt: storeMapping?.createdAt,
                updatedAt: storeMapping?.updatedAt
            }
        };
    });

    const pagination = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
    };

    console.log('Returning pushed products:', pushedProducts.length, 'pagination:', pagination);

    return res.status(200).json(
        new ApiResponse(200, {
            products: pushedProducts,
            pagination,
            store: {
                _id: store._id,
                shopName: store.shopName,
                shopDomain: store.shopDomain
            }
        }, 'Store pushed products retrieved successfully')
    );
});

// Get store statistics and analytics
export const getStoreStats = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const userId = req.user._id;

    console.log('Getting store stats for store:', storeId, 'user:', userId);

    // Verify store belongs to user
    const store = await Store.findOne({ 
        _id: storeId, 
        userId,
        isActive: true 
    });

    if (!store) {
        throw new ApiError(404, 'Store not found or not accessible');
    }

    // Get product mapping statistics
    const [
        totalPushedProducts,
        activePushedProducts,
        syncingProducts,
        errorProducts,
        recentSyncs
    ] = await Promise.all([
        ProductMap.countDocuments({
            createdBy: userId,
            'storeMappings.store': storeId,
            isDeleted: false
        }),
        ProductMap.countDocuments({
            createdBy: userId,
            'storeMappings.store': storeId,
            'storeMappings.status': 'active',
            isDeleted: false
        }),
        ProductMap.countDocuments({
            createdBy: userId,
            'storeMappings.store': storeId,
            'storeMappings.status': 'syncing',
            isDeleted: false
        }),
        ProductMap.countDocuments({
            createdBy: userId,
            'storeMappings.store': storeId,
            'storeMappings.status': 'error',
            isDeleted: false
        }),
        ProductMap.find({
            createdBy: userId,
            'storeMappings.store': storeId,
            isDeleted: false
        })
        .populate('dashboardProduct', 'title')
        .sort({ 'storeMappings.lastSyncAt': -1 })
        .limit(5)
    ]);

    const stats = {
        store: {
            _id: store._id,
            shopName: store.shopName,
            shopDomain: store.shopDomain,
            connectedAt: store.connectedAt,
            lastSyncAt: store.lastSyncAt,
            syncStatus: store.syncStatus,
            analytics: store.analytics
        },
        productStats: {
            totalPushed: totalPushedProducts,
            active: activePushedProducts,
            syncing: syncingProducts,
            errors: errorProducts,
            successRate: totalPushedProducts > 0 ? 
                ((activePushedProducts / totalPushedProducts) * 100).toFixed(1) : '0.0'
        },
        recentActivity: recentSyncs.map(productMap => {
            const storeMapping = productMap.storeMappings.find(
                mapping => mapping.store.toString() === storeId.toString()
            );
            return {
                productTitle: productMap.dashboardProduct.title,
                lastSyncAt: storeMapping?.lastSyncAt,
                status: storeMapping?.status,
                success: !storeMapping?.lastSyncError
            };
        })
    };

    console.log('Store stats:', stats);

    return res.status(200).json(
        new ApiResponse(200, stats, 'Store statistics retrieved successfully')
    );
});

// Get store sync history
export const getStoreSyncHistory = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    console.log('Getting sync history for store:', storeId, 'user:', userId);

    // Verify store belongs to user
    const store = await Store.findOne({ 
        _id: storeId, 
        userId,
        isActive: true 
    });

    if (!store) {
        throw new ApiError(404, 'Store not found or not accessible');
    }

    // Get product maps with sync history
    const productMaps = await ProductMap.find({
        createdBy: userId,
        'storeMappings.store': storeId,
        isDeleted: false
    }).populate('dashboardProduct', 'title handle');

    // Collect all sync history entries
    const allSyncHistory = [];
    
    productMaps.forEach(productMap => {
        const storeMapping = productMap.storeMappings.find(
            mapping => mapping.store.toString() === storeId.toString()
        );
        
        if (storeMapping && storeMapping.syncHistory) {
            storeMapping.syncHistory.forEach(sync => {
                allSyncHistory.push({
                    productId: productMap.dashboardProduct._id,
                    productTitle: productMap.dashboardProduct.title,
                    productHandle: productMap.dashboardProduct.handle,
                    shopifyProductId: storeMapping.shopifyProductId,
                    ...sync.toObject()
                });
            });
        }
    });

    // Sort by timestamp descending
    allSyncHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedHistory = allSyncHistory.slice(skip, skip + parseInt(limit));

    const pagination = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allSyncHistory.length / parseInt(limit)),
        totalItems: allSyncHistory.length,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(allSyncHistory.length / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
    };

    console.log('Sync history entries:', paginatedHistory.length, 'total:', allSyncHistory.length);

    return res.status(200).json(
        new ApiResponse(200, {
            syncHistory: paginatedHistory,
            pagination,
            store: {
                _id: store._id,
                shopName: store.shopName,
                shopDomain: store.shopDomain
            }
        }, 'Store sync history retrieved successfully')
    );
});
