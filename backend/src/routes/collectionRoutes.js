import express from 'express';
import { 
  getStoreCollections,
  getCollectionDetails,
  createStoreCollection,
  addProductsToStoreCollection,
  removeProductsFromStoreCollection,
  searchCollectionsAcrossStores
} from '../controllers/collectionController.js';
import { authenticateUser as verifyJWT } from '../middleware/auth.js';

const router = express.Router();

/**
 * COLLECTION ROUTES
 * =================
 * 
 * All routes for collection management using Shopify GraphQL API
 * through the established controller system with proper authentication
 * and session validation.
 */

// Apply authentication middleware to all routes
router.use(verifyJWT);

// ==============================================
// COLLECTION FETCH ROUTES
// ==============================================

/**
 * @route   GET /api/collections/search
 * @desc    Search collections across all user stores
 * @access  Private
 * @params  query (string) - search term, limit (number) - max results
 */
router.get('/search', searchCollectionsAcrossStores);

/**
 * @route   GET /api/collections/:storeId
 * @desc    Get collections for a specific store
 * @access  Private
 * @params  storeId (string) - MongoDB store ID
 * @query   first (number) - pagination limit, after (string) - cursor, query (string) - search
 */
router.get('/:storeId', getStoreCollections);

/**
 * @route   GET /api/collections/:storeId/:collectionId
 * @desc    Get detailed information about a specific collection
 * @access  Private
 * @params  storeId (string) - MongoDB store ID, collectionId (string) - Shopify collection ID
 */
router.get('/:storeId/:collectionId', getCollectionDetails);

// ==============================================
// COLLECTION MANAGEMENT ROUTES
// ==============================================

/**
 * @route   POST /api/collections/:storeId
 * @desc    Create a new collection in a specific store
 * @access  Private
 * @params  storeId (string) - MongoDB store ID
 * @body    title, description, handle, ruleSet, image, seo
 */
router.post('/:storeId', createStoreCollection);

/**
 * @route   POST /api/collections/:storeId/:collectionId/products
 * @desc    Add products to a specific collection
 * @access  Private
 * @params  storeId (string) - MongoDB store ID, collectionId (string) - Shopify collection ID
 * @body    productIds (array) - Array of Shopify product IDs
 */
router.post('/:storeId/:collectionId/products', addProductsToStoreCollection);

/**
 * @route   DELETE /api/collections/:storeId/:collectionId/products
 * @desc    Remove products from a specific collection
 * @access  Private
 * @params  storeId (string) - MongoDB store ID, collectionId (string) - Shopify collection ID
 * @body    productIds (array) - Array of Shopify product IDs
 */
router.delete('/:storeId/:collectionId/products', removeProductsFromStoreCollection);

export default router;
