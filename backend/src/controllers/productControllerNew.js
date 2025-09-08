import { Product } from '../models/ProductOptimized.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHanlde.js';
import { uploadOnCloudinary, deleteFromCloudinary, validateForShopify } from '../utils/cloudinary.js';
import { validateImageDimensions } from '../middleware/multer.js';

/**
 * MASTER PRODUCT CONTROLLER
 * ========================
 * 
 * This controller handles ALL dashboard product operations with perfect
 * alignment to Shopify GraphQL structure. Every field, every conversion
 * method, and every operation is designed to seamlessly integrate with
 * the Shopify GraphQL API for effortless store synchronization.
 * 
 * FEATURES:
 * - Complete ProductOptimized CRUD operations
 * - Advanced media handling (images, videos, 3D models)
 * - Sophisticated variant management with option values
 * - Product options with full customization
 * - SEO and metafields support
 * - Shopify-ready conversion methods integration
 * - Cloudinary integration with Shopify-optimized transformations
 * - Comprehensive validation and error handling
 */

// ==============================================
// CORE PRODUCT OPERATIONS
// ==============================================

/**
 * Create a new dashboard product with all features
 * POST /api/products
 * 
 * Supports:
 * - Product options (Color, Size, Material - max 3)
 * - Multiple variants with option combinations
 * - Media files (images, videos, 3D models)
 * - SEO settings
 * - Metafields
 * - Shopify-compatible structure
 */
const createProduct = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  console.log("Raw Body:", req.body);
  console.log('Files: ', req.files);
  
  // Parse productData if it comes as JSON string (from FormData)
  let productData;
  if (req.body.productData) {
    try {
      productData = JSON.parse(req.body.productData);
      console.log("Parsed Product Data:", productData);
    } catch (error) {
      throw new ApiError(400, 'Invalid product data format');
    }
  } else {
    productData = req.body;
  }
  
  const {
    // Basic product info
    title,
    descriptionHtml,
    vendor,
    productType,
    tags = [],
    handle,
    status = 'DRAFT',
    published = false,
    publishDate,
    
    // Collections and gift cards
    collectionsToJoin = [],
    giftCard = false,
    giftCardTemplateSuffix,
    
    // Product structure
    options = [], // [{ name: "Color", optionValues: [{ name: "Red" }, { name: "Blue" }] }]
    variants = [], // [{ price: 29.99, optionValues: [{ optionName: "Color", name: "Red" }] }]
    
    // SEO and metadata
    seo = {},
    metafields = [],
    
    // Dashboard specific
    notes
  } = productData;

  // Validate required fields
  if (!title) {
    throw new ApiError(400, 'Product title is required');
  }

  try {
    // Validate product options (max 3 for Shopify)
    if (options.length > 3) {
      throw new ApiError(400, 'Maximum 3 product options allowed');
    }

    // Validate variants (max 100 for Shopify)
    if (variants.length > 100) {
      throw new ApiError(400, 'Maximum 100 variants allowed per product');
    }

    // Validate option values consistency
    if (options.length > 0 && variants.length > 0) {
      const optionNames = options.map(opt => opt.name);
      for (const variant of variants) {
        if (variant.optionValues) {
          for (const optValue of variant.optionValues) {
            if (!optionNames.includes(optValue.optionName)) {
              throw new ApiError(400, `Invalid option name "${optValue.optionName}" in variant. Must match product options.`);
            }
          }
        }
      }
    }

    
    // Process media files if uploaded
    let processedMedia = [];
    if (req.files && req.files.length > 0) {
      processedMedia = await processMediaFiles(req.files);
    } else if (productData.media && productData.media.length > 0) {
      // Handle media from JSON data (absolute URLs only). Reject local/relative paths like './1.webp'
      processedMedia = productData.media
        .map(mediaItem => {
          const candidate = mediaItem.src || mediaItem.url || mediaItem.file?.path || '';
          const isHttp = typeof candidate === 'string' && /^https?:\/\//i.test(candidate);
          if (!isHttp) return null;
          return {
            alt: mediaItem.alt || '',
            position: mediaItem.position || 1,
            mediaContentType: mediaItem.mediaContentType || 'IMAGE',
            src: candidate,
          };
        })
        .filter(Boolean);
    }

  // Do not auto-generate handle; Shopify will own the final handle on push
  const productHandle = handle && handle.trim() ? handle.trim() : undefined;

    // Process variants - if no variants provided but we have price data, create a default variant
    let processedVariants = processProductVariants(variants);
    if (processedVariants.length === 0 && productData.price !== undefined) {
      // Create default variant for single-variant product
      processedVariants = [{
        price: productData.price || 0,
        sku: productData.sku || '',
        inventoryQuantity: productData.inventoryQuantity || 0,
        compareAtPrice: productData.compareAtPrice || undefined,
        weight: productData.weight || undefined,
        weightUnit: productData.weightUnit || 'g',
        barcode: productData.barcode || '',
        optionValues: []
      }];
    }

    // Create product with all data
    const productDataForSave = {
      title: title.trim(),
      descriptionHtml,
      vendor: vendor?.trim(),
      productType: productType?.trim(),
      tags: tags.map(tag => tag.trim()).filter(Boolean),
      handle: productHandle,
      status,
      published,
      publishDate: publishDate ? new Date(publishDate) : undefined,
      collectionsToJoin,
      giftCard,
      giftCardTemplateSuffix,
      options: processProductOptions(options),
      variants: processedVariants,
      media: processedMedia,
      seo: processSEO(seo),
      metafields: processMetafields(metafields),
      notes: notes?.trim(),
      createdBy: userId,
      syncStatus: 'pending'
    };

    const product = new Product(productDataForSave);
    await product.save();

    // Populate user info for response
    await product.populate('createdBy', 'name email');

    res.status(201).json(
      new ApiResponse(201, product, 'Product created successfully')
    );

  } catch (error) {
    console.error('Error creating product:', error);
    
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      await cleanupUploadedFiles(req.files);
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to create product: ${error.message}`);
  }
});

/**
 * Get user's products with advanced filtering
 * GET /api/products
 */
const getUserProducts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    page = 1,
    limit = 20,
    status,
    vendor,
    productType,
    tags,
    search,
    category,
    syncStatus,
    hasImages,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  try {
    // Build filter query
    const filterQuery = { createdBy: userId };
    
    if (status) filterQuery.status = status;
    if (vendor) filterQuery.vendor = new RegExp(vendor, 'i');
    if (productType) filterQuery.productType = new RegExp(productType, 'i');
    if (category) filterQuery.category = new RegExp(category, 'i');
    if (syncStatus) filterQuery.syncStatus = syncStatus;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filterQuery.tags = { $in: tagArray };
    }
    if (hasImages === 'true') {
      filterQuery['media.0'] = { $exists: true };
    }
    if (search) {
      filterQuery.$or = [
        { title: new RegExp(search, 'i') },
        { descriptionHtml: new RegExp(search, 'i') },
        { vendor: new RegExp(search, 'i') },
        { productType: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(filterQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .lean();

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    // Get ProductMap data to determine store connections for each product
    const ProductMap = (await import('../models/ProductMap.js')).ProductMap;
    const productIds = products.map(p => p._id);
    
    const storeMappings = await ProductMap.find({
      dashboardProduct: { $in: productIds }
    }).populate('storeMappings.store', 'shopName shopDomain');

    // Create a map of productId to store mappings
    const mappingsMap = {};
    storeMappings.forEach(mapping => {
      mappingsMap[mapping.dashboardProduct.toString()] = mapping.storeMappings
        .filter(sm => sm.status !== 'deleted')
        .map(sm => ({
          storeId: sm.store._id,
          shopifyProductId: sm.shopifyProductId,
          store: {
            id: sm.store._id,
            shopName: sm.store.shopName,
            shopDomain: sm.store.shopDomain,
            // backwards-compat for UI fields
            shop: sm.store.shopDomain,
            domain: sm.store.shopDomain,
            name: sm.store.shopName
          },
          lastSyncAt: sm.lastSyncAt,
          syncStatus: sm.status
        }));
    });

    // Add computed fields and connection information
    const enrichedProducts = products.map(product => ({
      ...product,
      variantCount: product.variants?.length || 0,
      hasImages: product.media?.some(m => m.mediaContentType === 'IMAGE') || false,
      priceRange: calculatePriceRange(product.variants),
      storeMappings: mappingsMap[product._id.toString()] || [],
      isConnected: (mappingsMap[product._id.toString()] || []).length > 0
    }));

    res.json(
      new ApiResponse(200, {
        products: enrichedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        filters: {
          status,
          vendor,
          productType,
          tags,
          search,
          category,
          syncStatus,
          hasImages
        }
      }, 'Products retrieved successfully')
    );

  } catch (error) {
    console.error('Error fetching user products:', error);
    throw new ApiError(500, 'Failed to fetch products');
  }
});

/**
 * Get single product by ID
 * GET /api/products/:id
 */
const getProduct = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    }).populate('createdBy', 'name email');

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Get ProductMap data to determine store connections (aligned with ProductMap schema)
    const ProductMap = (await import('../models/ProductMap.js')).ProductMap;
    const mappingDocs = await ProductMap.find({
      dashboardProduct: id,
      isDeleted: false
    }).populate('storeMappings.store', 'shopName shopDomain');

    // Flatten mappings to a simple array for the frontend
    const flatStoreMappings = [];
    for (const doc of mappingDocs) {
      for (const sm of (doc.storeMappings || [])) {
        if (sm?.status === 'deleted') continue;
        if (!sm?.store) continue;
        flatStoreMappings.push({
          storeId: sm.store._id,
          shopifyProductId: sm.shopifyProductId,
          store: {
            id: sm.store._id,
            shopName: sm.store.shopName,
            shopDomain: sm.store.shopDomain,
            // backwards-compat for UI fields
            shop: sm.store.shopDomain,
            name: sm.store.shopName,
            domain: sm.store.shopDomain
          },
          lastSyncAt: sm.lastSyncAt,
          syncStatus: sm.status
        });
      }
    }

    // Add store connection information to product
    const productWithMappings = {
      ...product.toObject(),
      storeMappings: flatStoreMappings,
      isConnected: flatStoreMappings.length > 0
    };

    res.json(
      new ApiResponse(200, productWithMappings, 'Product retrieved successfully')
    );

  } catch (error) {
    console.error('Error fetching product:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to fetch product');
  }
});

/**
 * Update existing product
 * PUT /api/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const updateData = req.body;

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Validate options if being updated
    if (updateData.options && updateData.options.length > 3) {
      throw new ApiError(400, 'Maximum 3 product options allowed');
    }

    // Validate variants if being updated
    if (updateData.variants && updateData.variants.length > 100) {
      throw new ApiError(400, 'Maximum 100 variants allowed per product');
    }

    // Process new media files if uploaded
    let newMedia = [];
    if (req.files && req.files.length > 0) {
      newMedia = await processMediaFiles(req.files);
    }

    // Handle media updates
    if (updateData.mediaToDelete) {
      const mediaToDelete = Array.isArray(updateData.mediaToDelete) 
        ? updateData.mediaToDelete 
        : [updateData.mediaToDelete];
      
      // Delete from Cloudinary
      for (const mediaIndex of mediaToDelete) {
        const media = product.media[parseInt(mediaIndex)];
        if (media && media.src.includes('cloudinary.com')) {
          const publicId = extractCloudinaryPublicId(media.src);
          await deleteFromCloudinary(publicId);
        }
      }
      
      // Remove from array (reverse order to maintain indices)
      mediaToDelete.sort((a, b) => b - a).forEach(index => {
        product.media.splice(parseInt(index), 1);
      });
    }

    // Add new media
    if (newMedia.length > 0) {
      product.media.push(...newMedia);
    }

    // Validate total media count (max 250 for Shopify)
    if (product.media.length > 250) {
      throw new ApiError(400, 'Maximum 250 media files allowed per product');
    }

    // Process updates
    const allowedUpdates = [
      'title', 'descriptionHtml', 'vendor', 'productType', 'tags', 'handle',
      'status', 'published', 'publishDate', 'collectionsToJoin', 'giftCard',
      'giftCardTemplateSuffix', 'options', 'variants', 'seo', 'metafields',
      'category', 'notes'
    ];

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        switch (field) {
          case 'options':
            product.options = processProductOptions(updateData.options);
            break;
          case 'variants':
            product.variants = processProductVariants(updateData.variants);
            break;
          case 'seo':
            product.seo = processSEO(updateData.seo);
            break;
          case 'metafields':
            product.metafields = processMetafields(updateData.metafields);
            break;
          case 'tags':
            product.tags = updateData.tags.map(tag => tag.trim()).filter(Boolean);
            break;
          case 'publishDate':
            product.publishDate = updateData.publishDate ? new Date(updateData.publishDate) : undefined;
            break;
          default:
            product[field] = updateData[field];
        }
      }
    });

    // Update sync status
    product.syncStatus = 'pending';
    product.lastSyncAttempt = new Date();

    await product.save();
    await product.populate('createdBy', 'name email');

    res.json(
      new ApiResponse(200, product, 'Product updated successfully')
    );

  } catch (error) {
    console.error('Error updating product:', error);
    
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      await cleanupUploadedFiles(req.files);
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to update product: ${error.message}`);
  }
});

/**
 * Duplicate existing product
 * POST /api/products/:id/duplicate
 */
const duplicateProduct = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { title: newTitle, handle: newHandle } = req.body;

  try {
    const originalProduct = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!originalProduct) {
      throw new ApiError(404, 'Product not found');
    }

    // Generate new title and handle
    const duplicateTitle = newTitle || `${originalProduct.title} (Copy)`;
    let duplicateHandle = newHandle || `${originalProduct.handle}-copy`;
    
    // Ensure handle uniqueness
    let handleExists = await Product.findOne({ handle: duplicateHandle });
    let counter = 1;
    while (handleExists) {
      duplicateHandle = `${newHandle || originalProduct.handle}-copy-${counter}`;
      handleExists = await Product.findOne({ handle: duplicateHandle });
      counter++;
    }

    // Create duplicate with modified data
    const duplicateData = {
      ...originalProduct.toObject(),
      _id: undefined,
      title: duplicateTitle,
      handle: duplicateHandle,
      status: 'DRAFT',
      published: false,
      publishDate: undefined,
      syncStatus: 'pending',
      lastSyncAttempt: undefined,
      storeCount: 0,
      createdAt: undefined,
      updatedAt: undefined
    };

    const duplicateProduct = new Product(duplicateData);
    await duplicateProduct.save();
    await duplicateProduct.populate('createdBy', 'name email');

    res.status(201).json(
      new ApiResponse(201, duplicateProduct, 'Product duplicated successfully')
    );

  } catch (error) {
    console.error('Error duplicating product:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to duplicate product');
  }
});

/**
 * Delete product
 * DELETE /api/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Check if product is synced to stores
    if (product.storeCount > 0) {
      throw new ApiError(400, 'Cannot delete product that is synced to stores. Remove from stores first.');
    }

    // Delete media from Cloudinary
    if (product.media && product.media.length > 0) {
      for (const media of product.media) {
        if (media.src.includes('cloudinary.com')) {
          const publicId = extractCloudinaryPublicId(media.src);
          await deleteFromCloudinary(publicId);
        }
      }
    }

    await Product.findByIdAndDelete(id);

    res.json(
      new ApiResponse(200, {}, 'Product deleted successfully')
    );

  } catch (error) {
    console.error('Error deleting product:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to delete product');
  }
});

// ==============================================
// PRODUCT OPTIONS MANAGEMENT
// ==============================================

/**
 * Add product option
 * POST /api/products/:id/options
 */
const addProductOption = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { name, optionValues = [] } = req.body;

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    if (product.options.length >= 3) {
      throw new ApiError(400, 'Maximum 3 product options allowed');
    }

    if (!name || !name.trim()) {
      throw new ApiError(400, 'Option name is required');
    }

    // Check for duplicate option names
    const existingOption = product.options.find(opt => 
      opt.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existingOption) {
      throw new ApiError(400, 'Option with this name already exists');
    }

    const newOption = {
      name: name.trim(),
      position: product.options.length,
      optionValues: optionValues.map((value, index) => ({
        name: typeof value === 'string' ? value.trim() : value.name.trim(),
        position: index
      }))
    };

    product.options.push(newOption);
    product.syncStatus = 'pending';
    await product.save();

    res.json(
      new ApiResponse(200, product, 'Product option added successfully')
    );

  } catch (error) {
    console.error('Error adding product option:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to add product option');
  }
});

/**
 * Update product option
 * PUT /api/products/:id/options/:optionIndex
 */
const updateProductOption = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id, optionIndex } = req.params;
  const { name, optionValues } = req.body;

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const index = parseInt(optionIndex);
    if (index < 0 || index >= product.options.length) {
      throw new ApiError(404, 'Option not found');
    }

    const option = product.options[index];
    
    if (name !== undefined) {
      // Check for duplicate names (excluding current option)
      const duplicateOption = product.options.find((opt, i) => 
        i !== index && opt.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (duplicateOption) {
        throw new ApiError(400, 'Option with this name already exists');
      }
      option.name = name.trim();
    }

    if (optionValues !== undefined) {
      option.optionValues = optionValues.map((value, valueIndex) => ({
        name: typeof value === 'string' ? value.trim() : value.name.trim(),
        position: valueIndex
      }));
    }

    product.syncStatus = 'pending';
    await product.save();

    res.json(
      new ApiResponse(200, product, 'Product option updated successfully')
    );

  } catch (error) {
    console.error('Error updating product option:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to update product option');
  }
});

/**
 * Delete product option
 * DELETE /api/products/:id/options/:optionIndex
 */
const deleteProductOption = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id, optionIndex } = req.params;

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const index = parseInt(optionIndex);
    if (index < 0 || index >= product.options.length) {
      throw new ApiError(404, 'Option not found');
    }

    const optionName = product.options[index].name;

    // Remove option
    product.options.splice(index, 1);

    // Update positions
    product.options.forEach((option, i) => {
      option.position = i;
    });

    // Remove option values from variants
    product.variants.forEach(variant => {
      if (variant.optionValues) {
        variant.optionValues = variant.optionValues.filter(
          optValue => optValue.optionName !== optionName
        );
      }
    });

    product.syncStatus = 'pending';
    await product.save();

    res.json(
      new ApiResponse(200, product, 'Product option deleted successfully')
    );

  } catch (error) {
    console.error('Error deleting product option:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to delete product option');
  }
});

// ==============================================
// PRODUCT VARIANTS MANAGEMENT
// ==============================================

/**
 * Add product variant
 * POST /api/products/:id/variants
 */
const addProductVariant = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const variantData = req.body;

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    if (product.variants.length >= 100) {
      throw new ApiError(400, 'Maximum 100 variants allowed per product');
    }

    // Validate required fields
    if (!variantData.price || variantData.price < 0) {
      throw new ApiError(400, 'Valid price is required');
    }

    // Validate option values
    if (product.options.length > 0 && variantData.optionValues) {
      const optionNames = product.options.map(opt => opt.name);
      for (const optValue of variantData.optionValues) {
        if (!optionNames.includes(optValue.optionName)) {
          throw new ApiError(400, `Invalid option name "${optValue.optionName}"`);
        }
      }
    }

    const newVariant = {
      price: parseFloat(variantData.price),
      compareAtPrice: variantData.compareAtPrice ? parseFloat(variantData.compareAtPrice) : undefined,
      sku: variantData.sku?.trim(),
      barcode: variantData.barcode?.trim(),
      inventoryQuantity: parseInt(variantData.inventoryQuantity) || 0,
      inventoryPolicy: variantData.inventoryPolicy || 'deny',
      inventoryManagement: variantData.inventoryManagement || 'shopify',
      requiresShipping: variantData.requiresShipping !== false,
      taxable: variantData.taxable !== false,
      taxCode: variantData.taxCode?.trim(),
      weight: variantData.weight ? parseFloat(variantData.weight) : 0,
      weightUnit: variantData.weightUnit || 'g',
      optionValues: variantData.optionValues || [],
      position: product.variants.length
    };

    product.variants.push(newVariant);
    product.syncStatus = 'pending';
    await product.save();

    res.json(
      new ApiResponse(200, product, 'Product variant added successfully')
    );

  } catch (error) {
    console.error('Error adding product variant:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to add product variant');
  }
});

/**
 * Update product variant
 * PUT /api/products/:id/variants/:variantIndex
 */
const updateProductVariant = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id, variantIndex } = req.params;
  const variantData = req.body;

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const index = parseInt(variantIndex);
    if (index < 0 || index >= product.variants.length) {
      throw new ApiError(404, 'Variant not found');
    }

    const variant = product.variants[index];

    // Update fields
    if (variantData.price !== undefined) {
      if (variantData.price < 0) {
        throw new ApiError(400, 'Price cannot be negative');
      }
      variant.price = parseFloat(variantData.price);
    }

    if (variantData.compareAtPrice !== undefined) {
      variant.compareAtPrice = variantData.compareAtPrice ? parseFloat(variantData.compareAtPrice) : undefined;
    }

    // Update other fields
    const updateFields = [
      'sku', 'barcode', 'inventoryQuantity', 'inventoryPolicy', 
      'inventoryManagement', 'requiresShipping', 'taxable', 'taxCode',
      'weight', 'weightUnit', 'optionValues'
    ];

    updateFields.forEach(field => {
      if (variantData[field] !== undefined) {
        variant[field] = variantData[field];
      }
    });

    product.syncStatus = 'pending';
    await product.save();

    res.json(
      new ApiResponse(200, product, 'Product variant updated successfully')
    );

  } catch (error) {
    console.error('Error updating product variant:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to update product variant');
  }
});

/**
 * Delete product variant
 * DELETE /api/products/:id/variants/:variantIndex
 */
const deleteProductVariant = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id, variantIndex } = req.params;

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const index = parseInt(variantIndex);
    if (index < 0 || index >= product.variants.length) {
      throw new ApiError(404, 'Variant not found');
    }

    // Remove variant
    product.variants.splice(index, 1);

    // Update positions
    product.variants.forEach((variant, i) => {
      variant.position = i;
    });

    product.syncStatus = 'pending';
    await product.save();

    res.json(
      new ApiResponse(200, product, 'Product variant deleted successfully')
    );

  } catch (error) {
    console.error('Error deleting product variant:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to delete product variant');
  }
});

// ==============================================
// MEDIA MANAGEMENT
// ==============================================

/**
 * Upload media files to product
 * POST /api/products/:id/media
 */
const uploadProductMedia = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, 'No files uploaded');
    }

    // Check total media limit (250 for Shopify)
    if (product.media.length + req.files.length > 250) {
      throw new ApiError(400, 'Maximum 250 media files allowed per product');
    }

    // Process uploaded files
    const processedMedia = await processMediaFiles(req.files);
    
    // Add to product
    product.media.push(...processedMedia);
    product.syncStatus = 'pending';
    await product.save();

    res.json(
      new ApiResponse(200, {
        product,
        uploadedMedia: processedMedia
      }, 'Media uploaded successfully')
    );

  } catch (error) {
    console.error('Error uploading media:', error);
    
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      await cleanupUploadedFiles(req.files);
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to upload media');
  }
});

/**
 * Delete media from product
 * DELETE /api/products/:id/media/:mediaIndex
 */
const deleteProductMedia = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id, mediaIndex } = req.params;

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const index = parseInt(mediaIndex);
    if (index < 0 || index >= product.media.length) {
      throw new ApiError(404, 'Media not found');
    }

    const media = product.media[index];

    // Delete from Cloudinary if hosted there
    if (media.src.includes('cloudinary.com')) {
      const publicId = extractCloudinaryPublicId(media.src);
      await deleteFromCloudinary(publicId);
    }

    // Remove from array
    product.media.splice(index, 1);

    // Update positions
    product.media.forEach((media, i) => {
      media.position = i;
    });

    product.syncStatus = 'pending';
    await product.save();

    res.json(
      new ApiResponse(200, product, 'Media deleted successfully')
    );

  } catch (error) {
    console.error('Error deleting media:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to delete media');
  }
});

/**
 * Reorder product media
 * PUT /api/products/:id/media/reorder
 */
const reorderProductMedia = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { mediaOrder } = req.body; // Array of media indices in new order

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    if (!Array.isArray(mediaOrder) || mediaOrder.length !== product.media.length) {
      throw new ApiError(400, 'Invalid media order array');
    }

    // Validate indices
    const validIndices = Array.from({ length: product.media.length }, (_, i) => i);
    const sortedOrder = [...mediaOrder].sort((a, b) => a - b);
    if (!validIndices.every((val, i) => val === sortedOrder[i])) {
      throw new ApiError(400, 'Invalid media indices in order array');
    }

    // Reorder media
    const reorderedMedia = mediaOrder.map(index => product.media[index]);
    
    // Update positions
    reorderedMedia.forEach((media, i) => {
      media.position = i;
    });

    product.media = reorderedMedia;
    product.syncStatus = 'pending';
    await product.save();

    res.json(
      new ApiResponse(200, product, 'Media reordered successfully')
    );

  } catch (error) {
    console.error('Error reordering media:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to reorder media');
  }
});

// ==============================================
// SHOPIFY PREVIEW METHODS
// ==============================================

/**
 * Preview product in Shopify format
 * GET /api/products/:id/shopify-preview
 */
const getShopifyPreview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Generate Shopify-compatible formats
    const shopifyPreview = {
      productInput: product.toShopifyProductInput(),
      variantsInput: product.toShopifyVariantsInput(),
      mediaInput: product.toShopifyMediaInput(),
      summary: {
        title: product.title,
        variantCount: product.variants?.length || 0,
        mediaCount: product.media?.length || 0,
        optionCount: product.options?.length || 0,
        status: product.status,
        priceRange: calculatePriceRange(product.variants)
      }
    };

    res.json(
      new ApiResponse(200, shopifyPreview, 'Shopify preview generated successfully')
    );

  } catch (error) {
    console.error('Error generating Shopify preview:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to generate Shopify preview');
  }
});

// ==============================================
// HELPER FUNCTIONS
// ==============================================

/**
 * Process uploaded media files with Shopify validation
 */
const processMediaFiles = async (files) => {
  const processedMedia = [];
  console.log('Processing media files:', files); 
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // Determine media content type
      let mediaContentType = 'IMAGE';
      if (file.mimetype.startsWith('video/')) {
        mediaContentType = 'VIDEO';
      } else if (file.mimetype === 'model/gltf-binary' || file.mimetype === 'model/vnd.usdz+zip') {
        mediaContentType = 'MODEL_3D';
      }

      // Upload to Cloudinary with Shopify-optimized settings
      const transformationType = mediaContentType === 'IMAGE' ? 'product_main' : undefined;
      const uploadResult = await uploadOnCloudinary(file.path, transformationType);

      if (!uploadResult) {
        throw new Error(`Failed to upload ${file.originalname}`);
      }

      // Validate for Shopify requirements
      if (mediaContentType === 'IMAGE') {
        validateImageDimensions(uploadResult.width, uploadResult.height);
        validateForShopify(uploadResult);
      }

      processedMedia.push({
        src: uploadResult.url,
        alt: `${file.originalname} - Product image`,
        mediaContentType,
        fileSize: uploadResult.bytes,
        dimensions: {
          width: uploadResult.width,
          height: uploadResult.height
        },
        position: i
      });

    } catch (error) {
      console.error(`Error processing file ${file.originalname}:`, error);
      throw new ApiError(400, `Failed to process ${file.originalname}: ${error.message}`);
    }
  }

  return processedMedia;
};

/**
 * Process product options with validation
 */
const processProductOptions = (options) => {
  if (!Array.isArray(options)) return [];
  
  return options.map((option, index) => ({
    name: option.name.trim(),
    position: index,
    optionValues: Array.isArray(option.optionValues) 
      ? option.optionValues.map((value, valueIndex) => ({
          name: typeof value === 'string' ? value.trim() : value.name.trim(),
          position: valueIndex
        }))
      : []
  }));
};

/**
 * Process product variants with validation
 */
const processProductVariants = (variants) => {
  if (!Array.isArray(variants)) return [];
  
  return variants.map((variant, index) => ({
    price: parseFloat(variant.price),
    compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : undefined,
    sku: variant.sku?.trim(),
    barcode: variant.barcode?.trim(),
    inventoryQuantity: parseInt(variant.inventoryQuantity) || 0,
    inventoryPolicy: variant.inventoryPolicy || 'deny',
    inventoryManagement: variant.inventoryManagement || 'shopify',
    requiresShipping: variant.requiresShipping !== false,
    taxable: variant.taxable !== false,
    taxCode: variant.taxCode?.trim(),
    weight: variant.weight ? parseFloat(variant.weight) : 0,
    weightUnit: variant.weightUnit || 'g',
    optionValues: Array.isArray(variant.optionValues) ? variant.optionValues : [],
    position: index
  }));
};

/**
 * Process SEO data
 */
const processSEO = (seo) => {
  if (!seo || typeof seo !== 'object') return {};
  
  const processed = {};
  if (seo.title) processed.title = seo.title.trim();
  if (seo.description) processed.description = seo.description.trim();
  
  return processed;
};

/**
 * Process metafields with validation
 */
const processMetafields = (metafields) => {
  if (!Array.isArray(metafields)) return [];
  
  return metafields.map(meta => ({
    namespace: meta.namespace.trim(),
    key: meta.key.trim(),
    value: meta.value.toString().trim(),
    type: meta.type || 'single_line_text_field'
  }));
};

/**
 * Generate product handle from title
 */
const generateProductHandle = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 255);
};

/**
 * Calculate price range from variants
 */
const calculatePriceRange = (variants) => {
  if (!variants || variants.length === 0) return null;
  
  const prices = variants.map(v => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  return { min, max };
};

/**
 * Extract Cloudinary public ID from URL
 */
const extractCloudinaryPublicId = (url) => {
  const parts = url.split('/');
  const uploadIndex = parts.findIndex(part => part === 'upload');
  if (uploadIndex === -1) return null;
  
  // Get the part after version (v1234567890)
  let publicIdPart = parts[uploadIndex + 2] || parts[uploadIndex + 1];
  
  // Remove file extension
  return publicIdPart.split('.')[0];
};

/**
 * Clean up uploaded files on error
 */
const cleanupUploadedFiles = async (files) => {
  for (const file of files) {
    try {
      // Files are already cleaned up by Cloudinary upload function
      console.log(`Cleaned up temporary file: ${file.filename}`);
    } catch (error) {
      console.error(`Failed to clean up file ${file.filename}:`, error);
    }
  }
};

export {
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
};
