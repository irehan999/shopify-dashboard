import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHanlde.js';
import { Store } from '../models/Store.js';
import { 
  getCollections, 
  getCollection 
} from '../graphql/queries/collectionQueries.js';
import { 
  createCollection, 
  updateCollection, 
  addProductsToCollection, 
  removeProductsFromCollection 
} from '../graphql/mutations/collectionMutations.js';

/**
 * COLLECTION CONTROLLER
 * =====================
 * 
 * This controller handles all collection operations using Shopify GraphQL API
 * through the established query helper system. It provides endpoints for
 * fetching collections from specific stores and managing collection operations.
 * 
 * FEATURES:
 * - Fetch collections from specific Shopify stores
 * - Search and filter collections
 * - Collection management operations
 * - Proper session handling and error management
 * - GraphQL query optimization
 */

// ==============================================
// COLLECTION FETCH OPERATIONS
// ==============================================

/**
 * Get collections for a specific store
 * @route GET /api/collections/:storeId
 * @desc Fetch collections from a specific Shopify store
 * @access Private
 */
export const getStoreCollections = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { 
    first = 50, 
    after = null, 
    query = null,
    search = null 
  } = req.query;

  // Find the store and validate ownership
  const store = await Store.findOne({
    _id: storeId,
    userId: req.user._id,
    status: 'active'
  });

  if (!store) {
    throw new ApiError(404, 'Store not found or not accessible');
  }

  // Prepare session object for GraphQL
  const session = {
    shop: store.shopifyDomain,
    accessToken: store.accessToken,
    scope: store.scope,
    isOnline: store.isOnline || false
  };

  try {
    // Build search query for Shopify
    let shopifyQuery = query;
    if (search && !query) {
      // If search term provided but no query, build a title search
      shopifyQuery = `title:*${search}*`;
    }

    // Fetch collections using GraphQL query
    const collectionsData = await getCollections(session, {
      first: parseInt(first),
      after,
      query: shopifyQuery
    });

    // Format collections for frontend
    const formattedCollections = collectionsData.collections.edges.map(edge => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      updatedAt: edge.node.updatedAt,
      productsCount: edge.node.productsCount,
      isSmartCollection: edge.node.ruleSet && edge.node.ruleSet.rules.length > 0,
      image: edge.node.image ? {
        url: edge.node.image.url,
        altText: edge.node.image.altText
      } : null,
      // Additional fields for frontend display
      displayName: edge.node.title,
      cursor: edge.cursor
    }));

    // Pagination info
    const pageInfo = collectionsData.collections.pageInfo;

    res.status(200).json(
      new ApiResponse(200, {
        collections: formattedCollections,
        pagination: {
          hasNextPage: pageInfo.hasNextPage,
          hasPreviousPage: pageInfo.hasPreviousPage,
          startCursor: pageInfo.startCursor,
          endCursor: pageInfo.endCursor,
          total: formattedCollections.length
        },
        store: {
          id: store._id,
          name: store.displayName,
          domain: store.shopifyDomain
        }
      }, 'Collections fetched successfully')
    );

  } catch (error) {
    console.error('Error fetching collections:', error);
    throw new ApiError(500, `Failed to fetch collections: ${error.message}`);
  }
});

/**
 * Get single collection details
 * @route GET /api/collections/:storeId/:collectionId
 * @desc Get detailed information about a specific collection
 * @access Private
 */
export const getCollectionDetails = asyncHandler(async (req, res) => {
  const { storeId, collectionId } = req.params;

  // Find the store and validate ownership
  const store = await Store.findOne({
    _id: storeId,
    userId: req.user._id,
    status: 'active'
  });

  if (!store) {
    throw new ApiError(404, 'Store not found or not accessible');
  }

  // Prepare session object for GraphQL
  const session = {
    shop: store.shopifyDomain,
    accessToken: store.accessToken,
    scope: store.scope,
    isOnline: store.isOnline || false
  };

  try {
    // Fetch collection details using GraphQL query
    const collectionData = await getCollection(session, collectionId);

    if (!collectionData) {
      throw new ApiError(404, 'Collection not found');
    }

    // Format collection data for frontend
    const formattedCollection = {
      id: collectionData.id,
      title: collectionData.title,
      description: collectionData.descriptionHtml,
      handle: collectionData.handle,
      sortOrder: collectionData.sortOrder,
      isSmartCollection: collectionData.ruleSet && collectionData.ruleSet.rules.length > 0,
      ruleSet: collectionData.ruleSet,
      image: collectionData.image ? {
        url: collectionData.image.url,
        altText: collectionData.image.altText
      } : null,
      seo: collectionData.seo,
      products: collectionData.products.edges.map(edge => ({
        id: edge.node.id,
        title: edge.node.title,
        handle: edge.node.handle,
        featuredImage: edge.node.featuredImage
      })),
      productsCount: collectionData.products.edges.length
    };

    res.status(200).json(
      new ApiResponse(200, {
        collection: formattedCollection,
        store: {
          id: store._id,
          name: store.displayName,
          domain: store.shopifyDomain
        }
      }, 'Collection details fetched successfully')
    );

  } catch (error) {
    console.error('Error fetching collection details:', error);
    throw new ApiError(500, `Failed to fetch collection details: ${error.message}`);
  }
});

// ==============================================
// COLLECTION MANAGEMENT OPERATIONS
// ==============================================

/**
 * Create a new collection
 * @route POST /api/collections/:storeId
 * @desc Create a new collection in a specific store
 * @access Private
 */
export const createStoreCollection = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { title, description, handle, ruleSet, image, seo } = req.body;

  // Find the store and validate ownership
  const store = await Store.findOne({
    _id: storeId,
    userId: req.user._id,
    status: 'active'
  });

  if (!store) {
    throw new ApiError(404, 'Store not found or not accessible');
  }

  // Prepare session object for GraphQL
  const session = {
    shop: store.shopifyDomain,
    accessToken: store.accessToken,
    scope: store.scope,
    isOnline: store.isOnline || false
  };

  // Prepare collection input
  const collectionInput = {
    title,
    descriptionHtml: description,
    handle,
    ruleSet,
    image,
    seo
  };

  try {
    // Create collection using GraphQL mutation
    const result = await createCollection(session, collectionInput);

    res.status(201).json(
      new ApiResponse(201, {
        collection: result.collection,
        store: {
          id: store._id,
          name: store.displayName,
          domain: store.shopifyDomain
        }
      }, 'Collection created successfully')
    );

  } catch (error) {
    console.error('Error creating collection:', error);
    throw new ApiError(500, `Failed to create collection: ${error.message}`);
  }
});

/**
 * Add products to collection
 * @route POST /api/collections/:storeId/:collectionId/products
 * @desc Add products to a specific collection
 * @access Private
 */
export const addProductsToStoreCollection = asyncHandler(async (req, res) => {
  const { storeId, collectionId } = req.params;
  const { productIds } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new ApiError(400, 'Product IDs array is required');
  }

  // Find the store and validate ownership
  const store = await Store.findOne({
    _id: storeId,
    userId: req.user._id,
    status: 'active'
  });

  if (!store) {
    throw new ApiError(404, 'Store not found or not accessible');
  }

  // Prepare session object for GraphQL
  const session = {
    shop: store.shopifyDomain,
    accessToken: store.accessToken,
    scope: store.scope,
    isOnline: store.isOnline || false
  };

  try {
    // Add products to collection using GraphQL mutation
    const result = await addProductsToCollection(session, collectionId, productIds);

    res.status(200).json(
      new ApiResponse(200, {
        collection: result.collection,
        addedProducts: productIds.length,
        store: {
          id: store._id,
          name: store.displayName,
          domain: store.shopifyDomain
        }
      }, 'Products added to collection successfully')
    );

  } catch (error) {
    console.error('Error adding products to collection:', error);
    throw new ApiError(500, `Failed to add products to collection: ${error.message}`);
  }
});

/**
 * Remove products from collection
 * @route DELETE /api/collections/:storeId/:collectionId/products
 * @desc Remove products from a specific collection
 * @access Private
 */
export const removeProductsFromStoreCollection = asyncHandler(async (req, res) => {
  const { storeId, collectionId } = req.params;
  const { productIds } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new ApiError(400, 'Product IDs array is required');
  }

  // Find the store and validate ownership
  const store = await Store.findOne({
    _id: storeId,
    userId: req.user._id,
    status: 'active'
  });

  if (!store) {
    throw new ApiError(404, 'Store not found or not accessible');
  }

  // Prepare session object for GraphQL
  const session = {
    shop: store.shopifyDomain,
    accessToken: store.accessToken,
    scope: store.scope,
    isOnline: store.isOnline || false
  };

  try {
    // Remove products from collection using GraphQL mutation
    const result = await removeProductsFromCollection(session, collectionId, productIds);

    res.status(200).json(
      new ApiResponse(200, {
        job: result.job,
        removedProducts: productIds.length,
        store: {
          id: store._id,
          name: store.displayName,
          domain: store.shopifyDomain
        }
      }, 'Products removed from collection successfully')
    );

  } catch (error) {
    console.error('Error removing products from collection:', error);
    throw new ApiError(500, `Failed to remove products from collection: ${error.message}`);
  }
});

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Search collections across all user stores
 * @route GET /api/collections/search
 * @desc Search collections across all connected stores
 * @access Private
 */
export const searchCollectionsAcrossStores = asyncHandler(async (req, res) => {
  const { query, limit = 20 } = req.query;

  if (!query || query.trim().length < 2) {
    throw new ApiError(400, 'Search query must be at least 2 characters');
  }

  // Get all active stores for the user
  const stores = await Store.find({
    userId: req.user._id,
    status: 'active'
  }).select('_id displayName shopifyDomain accessToken scope isOnline');

  if (stores.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, {
        collections: [],
        stores: []
      }, 'No connected stores found')
    );
  }

  const allCollections = [];
  const searchPromises = stores.map(async (store) => {
    try {
      const session = {
        shop: store.shopifyDomain,
        accessToken: store.accessToken,
        scope: store.scope,
        isOnline: store.isOnline || false
      };

      const collectionsData = await getCollections(session, {
        first: Math.ceil(limit / stores.length),
        query: `title:*${query}*`
      });

      return collectionsData.collections.edges.map(edge => ({
        ...edge.node,
        displayName: edge.node.title,
        productsCount: edge.node.productsCount,
        isSmartCollection: edge.node.ruleSet && edge.node.ruleSet.rules.length > 0,
        store: {
          id: store._id,
          name: store.displayName,
          domain: store.shopifyDomain
        }
      }));
    } catch (error) {
      console.error(`Error searching collections in store ${store.shopifyDomain}:`, error);
      return [];
    }
  });

  try {
    const results = await Promise.all(searchPromises);
    const flatResults = results.flat().slice(0, limit);

    res.status(200).json(
      new ApiResponse(200, {
        collections: flatResults,
        query,
        total: flatResults.length,
        stores: stores.map(s => ({ id: s._id, name: s.displayName }))
      }, 'Collections search completed')
    );

  } catch (error) {
    console.error('Error in multi-store collection search:', error);
    throw new ApiError(500, `Search failed: ${error.message}`);
  }
});
