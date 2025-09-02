import express from 'express';
import {
  // Core CRUD
  createProduct,
  getUserProducts,
  getProduct,
  updateProduct,
  duplicateProduct,
  deleteProduct,
  
  // Options management
  addProductOption,
  updateProductOption,
  deleteProductOption,
  
  // Variants management
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
  
  // Media management
  uploadProductMedia,
  deleteProductMedia,
  reorderProductMedia,
  
  // Shopify integration
  getShopifyPreview
} from '../controllers/productControllerNew.js';

import { authenticateUser as verifyJWT } from '../middleware/auth.js';
import { upload } from '../middleware/multer.js';

const router = express.Router();

/**
 * MASTER PRODUCT ROUTES
 * ====================
 * 
 * Complete product management system with perfect Shopify alignment
 * Every endpoint designed for seamless GraphQL integration
 */

// Apply authentication to all routes
router.use(verifyJWT);

// ==============================================
// CORE PRODUCT OPERATIONS
// ==============================================

/**
 * @route   POST /api/products
 * @desc    Create new dashboard product with full Shopify structure
 * @access  Private
 * @body    { title, descriptionHtml?, vendor?, productType?, tags?, handle?, 
 *           status?, published?, publishDate?, collectionsToJoin?, giftCard?, 
 *           options?, variants?, seo?, metafields?, category?, notes? }
 */
router.post('/', upload.array('media', 10), createProduct);

/**
 * @route   GET /api/products
 * @desc    Get user's products with advanced filtering
 * @access  Private
 * @query   page?, limit?, status?, vendor?, productType?, tags?, search?, 
 *          category?, syncStatus?, hasImages?, sortBy?, sortOrder?
 */
router.get('/', getUserProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Private
 */
router.get('/:id', getProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update existing product
 * @access  Private
 * @body    Any product fields to update
 */
router.put('/:id', upload.array('media', 10), updateProduct);

/**
 * @route   POST /api/products/:id/duplicate
 * @desc    Duplicate existing product
 * @access  Private
 * @body    { title?, handle? }
 */
router.post('/:id/duplicate', duplicateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (only if not synced to stores)
 * @access  Private
 */
router.delete('/:id', deleteProduct);

// ==============================================
// PRODUCT OPTIONS MANAGEMENT
// ==============================================

/**
 * @route   POST /api/products/:id/options
 * @desc    Add product option (Color, Size, etc.)
 * @access  Private
 * @body    { name, optionValues[] }
 */
router.post('/:id/options', addProductOption);

/**
 * @route   PUT /api/products/:id/options/:optionIndex
 * @desc    Update product option
 * @access  Private
 * @body    { name?, optionValues[]? }
 */
router.put('/:id/options/:optionIndex', updateProductOption);

/**
 * @route   DELETE /api/products/:id/options/:optionIndex
 * @desc    Delete product option
 * @access  Private
 */
router.delete('/:id/options/:optionIndex', deleteProductOption);

// ==============================================
// PRODUCT VARIANTS MANAGEMENT
// ==============================================

/**
 * @route   POST /api/products/:id/variants
 * @desc    Add product variant
 * @access  Private
 * @body    { price, compareAtPrice?, sku?, barcode?, inventoryQuantity?, 
 *           inventoryPolicy?, requiresShipping?, taxable?, weight?, 
 *           weightUnit?, optionValues[]? }
 */
router.post('/:id/variants', addProductVariant);

/**
 * @route   PUT /api/products/:id/variants/:variantIndex
 * @desc    Update product variant
 * @access  Private
 * @body    Variant fields to update
 */
router.put('/:id/variants/:variantIndex', updateProductVariant);

/**
 * @route   DELETE /api/products/:id/variants/:variantIndex
 * @desc    Delete product variant
 * @access  Private
 */
router.delete('/:id/variants/:variantIndex', deleteProductVariant);

// ==============================================
// MEDIA MANAGEMENT
// ==============================================

/**
 * @route   POST /api/products/:id/media
 * @desc    Upload media files to product (images, videos, 3D models)
 * @access  Private
 * @files   media[] - Up to 10 files per request
 */
router.post('/:id/media', upload.array('media', 10), uploadProductMedia);

/**
 * @route   DELETE /api/products/:id/media/:mediaIndex
 * @desc    Delete media from product
 * @access  Private
 */
router.delete('/:id/media/:mediaIndex', deleteProductMedia);

/**
 * @route   PUT /api/products/:id/media/reorder
 * @desc    Reorder product media
 * @access  Private
 * @body    { mediaOrder[] } - Array of media indices in new order
 */
router.put('/:id/media/reorder', reorderProductMedia);

// ==============================================
// SHOPIFY INTEGRATION
// ==============================================

/**
 * @route   GET /api/products/:id/shopify-preview
 * @desc    Preview product in Shopify GraphQL format
 * @access  Private
 * @returns { productInput, variantsInput, mediaInput, summary }
 */
router.get('/:id/shopify-preview', getShopifyPreview);

export default router;
