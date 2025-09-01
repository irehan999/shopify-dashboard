import mongoose from 'mongoose'
import {
  mediaSchema,
  productOptionSchema,
  productVariantSchema,
  seoSchema,
  metafieldSchema
} from './schemas/ProductSchemas.js'

// ==============================================
// MAIN PRODUCT MODEL
// ==============================================

const productSchema = new mongoose.Schema({
  // ==============================================
  // REQUIRED FIELDS
  // ==============================================
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 255,
    index: true
  },
  
  // Dashboard ownership
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // ==============================================
  // CORE PRODUCT FIELDS (for productCreate)
  // ==============================================
  
  descriptionHtml: {
    type: String,
    maxLength: 65535
  },
  
  vendor: {
    type: String,
    trim: true,
    maxLength: 255,
    index: true
  },
  
  productType: {
    type: String,
    trim: true,
    maxLength: 255,
    index: true
  },
  
  tags: [{
    type: String,
    trim: true,
    maxLength: 255
  }],
  
  handle: {
    type: String,
    trim: true,
    lowercase: true,
    maxLength: 255,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return !v || /^[a-z0-9-]+$/.test(v)
      },
      message: 'Handle can only contain lowercase letters, numbers, and hyphens'
    }
  },
  
  // ==============================================
  // STATUS & PUBLISHING
  // ==============================================
  
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED', 'DRAFT'],
    default: 'DRAFT',
    index: true
  },
  
  published: {
    type: Boolean,
    default: false
  },
  
  publishDate: {
    type: Date
  },
  
  // ==============================================
  // COLLECTIONS
  // ==============================================
  
  collectionsToJoin: [{
    type: String,
    trim: true
  }],
  
  // ==============================================
  // GIFT CARDS
  // ==============================================
  
  giftCard: {
    type: Boolean,
    default: false
  },
  
  giftCardTemplateSuffix: {
    type: String,
    trim: true
  },
  
  // ==============================================
  // PRODUCT STRUCTURE (New Product Model)
  // ==============================================
  
  // Product options (Color, Size, Material, etc.)
  options: {
    type: [productOptionSchema],
    validate: {
      validator: function(options) {
        return options.length <= 3 // Shopify limit
      },
      message: 'Maximum 3 product options allowed'
    }
  },
  
  // Product variants
  variants: {
    type: [productVariantSchema],
    validate: {
      validator: function(variants) {
        return variants.length <= 100 // Standard Shopify limit
      },
      message: 'Maximum 100 variants allowed per product'
    }
  },
  
  // Product media (images, videos, 3D models)
  media: {
    type: [mediaSchema],
    validate: {
      validator: function(media) {
        return media.length <= 250 // Shopify limit
      },
      message: 'Maximum 250 media files allowed per product'
    }
  },
  
  // ==============================================
  // SEO & METADATA
  // ==============================================
  
  seo: seoSchema,
  
  metafields: {
    type: [metafieldSchema],
    validate: {
      validator: function(metafields) {
        // Check for duplicate namespace+key combinations
        const keys = metafields.map(m => `${m.namespace}.${m.key}`)
        return keys.length === new Set(keys).size
      },
      message: 'Duplicate metafield namespace.key combinations are not allowed'
    }
  },
  
  // ==============================================
  // DASHBOARD SPECIFIC FIELDS
  // ==============================================
  
  // Internal organization
  category: {
    type: String,
    trim: true,
    maxLength: 255
  },
  
  // Internal notes for dashboard users
  notes: {
    type: String,
    maxLength: 1000
  },
  
  // Track sync status across stores
  syncStatus: {
    type: String,
    enum: ['pending', 'syncing', 'synced', 'error'],
    default: 'pending'
  },
  
  // Last sync attempt
  lastSyncAttempt: {
    type: Date
  },
  
  // Total stores this product is mapped to
  storeCount: {
    type: Number,
    default: 0,
    min: 0
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// ==============================================
// INDEXES FOR PERFORMANCE
// ==============================================

productSchema.index({ createdBy: 1, status: 1 })
productSchema.index({ vendor: 1, productType: 1 })
productSchema.index({ tags: 1 })
productSchema.index({ syncStatus: 1 })
productSchema.index({ createdAt: -1 })

// Compound index for filtering
productSchema.index({ 
  createdBy: 1, 
  status: 1, 
  productType: 1 
})

// ==============================================
// VIRTUAL FIELDS
// ==============================================

// Total variant count
productSchema.virtual('variantCount').get(function() {
  return this.variants?.length || 0
})

// Has images
productSchema.virtual('hasImages').get(function() {
  return this.media?.some(m => m.mediaContentType === 'IMAGE') || false
})

// Price range
productSchema.virtual('priceRange').get(function() {
  if (!this.variants?.length) return null
  
  const prices = this.variants.map(v => v.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  
  return { min, max }
})

// ==============================================
// METHODS FOR SHOPIFY API CONVERSION
// ==============================================

// Convert to ProductInput for productCreate mutation
productSchema.methods.toShopifyProductInput = function() {
  const input = {
    title: this.title
  }
  
  // Add optional fields only if they exist
  if (this.descriptionHtml) input.descriptionHtml = this.descriptionHtml
  if (this.vendor) input.vendor = this.vendor
  if (this.productType) input.productType = this.productType
  if (this.tags?.length) input.tags = this.tags
  if (this.handle) input.handle = this.handle
  if (this.status) input.status = this.status
  if (typeof this.published === 'boolean') input.published = this.published
  if (this.publishDate) input.publishDate = this.publishDate.toISOString()
  if (this.collectionsToJoin?.length) input.collectionsToJoin = this.collectionsToJoin
  if (this.giftCard) input.giftCard = this.giftCard
  if (this.giftCardTemplateSuffix) input.giftCardTemplateSuffix = this.giftCardTemplateSuffix
  
  // Add SEO if exists
  if (this.seo?.title || this.seo?.description) {
    input.seo = {}
    if (this.seo.title) input.seo.title = this.seo.title
    if (this.seo.description) input.seo.description = this.seo.description
  }
  
  // Add product options for new product model
  if (this.options?.length) {
    input.productOptions = this.options.map(option => ({
      name: option.name,
      position: option.position,
      values: option.optionValues?.map(value => ({ 
        name: value.name 
      })) || []
    }))
  }
  
  // Add metafields if exist
  if (this.metafields?.length) {
    input.metafields = this.metafields.map(meta => ({
      namespace: meta.namespace,
      key: meta.key,
      value: meta.value,
      type: meta.type
    }))
  }
  
  return input
}

// Convert variants for productVariantsBulkCreate mutation
productSchema.methods.toShopifyVariantsInput = function() {
  if (!this.variants?.length) return []
  
  return this.variants.map(variant => {
    const variantInput = {
      price: variant.price.toString() // Shopify expects string
    }
    
    // Add optional variant fields
    if (variant.compareAtPrice) variantInput.compareAtPrice = variant.compareAtPrice.toString()
    if (variant.sku) variantInput.sku = variant.sku
    if (variant.barcode) variantInput.barcode = variant.barcode
    if (variant.taxCode) variantInput.taxCode = variant.taxCode
    if (typeof variant.taxable === 'boolean') variantInput.taxable = variant.taxable
    if (typeof variant.requiresShipping === 'boolean') variantInput.requiresShipping = variant.requiresShipping
    
    // Inventory settings
    if (variant.inventoryPolicy) variantInput.inventoryPolicy = variant.inventoryPolicy.toUpperCase()
    if (typeof variant.inventoryQuantity === 'number') {
      variantInput.inventoryQuantities = [{
        availableQuantity: variant.inventoryQuantity,
        locationId: 'gid://shopify/Location/primary' // Will be updated with actual location
      }]
    }
    
    // Weight
    if (variant.weight) {
      variantInput.inventoryItem = {
        measurement: {
          weight: {
            value: variant.weight,
            unit: variant.weightUnit?.toUpperCase() || 'GRAMS'
          }
        }
      }
    }
    
    // Option values for new product model
    if (variant.optionValues?.length) {
      variantInput.optionValues = variant.optionValues.map(opt => ({
        optionName: opt.optionName,
        name: opt.name
      }))
    }
    
    return variantInput
  })
}

// Convert media for productCreateMedia mutation
productSchema.methods.toShopifyMediaInput = function() {
  if (!this.media?.length) return []
  
  return this.media.map(mediaItem => ({
    alt: mediaItem.alt || '',
    mediaContentType: mediaItem.mediaContentType,
    originalSource: mediaItem.src
  }))
}

// ==============================================
// STATIC METHODS
// ==============================================

// Find products by store mapping
productSchema.statics.findByStore = function(storeId) {
  return this.aggregate([
    {
      $lookup: {
        from: 'productmaps',
        localField: '_id',
        foreignField: 'dashboardProduct',
        as: 'mappings'
      }
    },
    {
      $match: {
        'mappings.store': mongoose.Types.ObjectId(storeId)
      }
    }
  ])
}

// Search products with filters
productSchema.statics.search = function(filters = {}) {
  const query = {}
  
  if (filters.createdBy) query.createdBy = filters.createdBy
  if (filters.status) query.status = filters.status
  if (filters.vendor) query.vendor = new RegExp(filters.vendor, 'i')
  if (filters.productType) query.productType = new RegExp(filters.productType, 'i')
  if (filters.tags) query.tags = { $in: filters.tags }
  if (filters.search) {
    query.$or = [
      { title: new RegExp(filters.search, 'i') },
      { descriptionHtml: new RegExp(filters.search, 'i') },
      { tags: new RegExp(filters.search, 'i') }
    ]
  }
  
  return this.find(query)
}

export const Product = mongoose.model('Product', productSchema)
