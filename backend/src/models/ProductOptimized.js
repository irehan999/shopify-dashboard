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
    index: true,
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
  
  // Add product options for new product model (filter empty values)
  if (this.options?.length) {
    input.productOptions = this.options.map(option => {
      const rawValues = Array.isArray(option.optionValues) ? option.optionValues : []
      const cleanedValues = rawValues
        .filter(v => v && typeof v.name === 'string' && v.name.trim().length > 0)
        .map(v => ({ name: v.name }))
      return {
        name: option.name,
        position: option.position,
        values: cleanedValues
      }
    })
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

// Convert to ProductSetInput for productSet mutation (upsert)
productSchema.methods.toShopifyProductSetInput = function(locationId = null, collectionsToJoin = [], variantOverrides = {}) {
  const input = {
    title: this.title,
    handle: this.handle || this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
  
  // Add optional fields only if they exist
  if (this.descriptionHtml) input.descriptionHtml = this.descriptionHtml
  if (this.vendor) input.vendor = this.vendor
  if (this.productType) input.productType = this.productType
  if (this.tags?.length) input.tags = this.tags
  if (this.status) input.status = this.status
  // Do not include published/publishDate in productSet input (not supported)
  
  // IMPORTANT: As per current requirements, do NOT include collections in productSet input.
  // Collections will be handled via separate mutations after product creation.
  // TODO(Future): Re-enable collections field if workflow requires direct assignment via productSet.
  
  if (this.giftCard) input.giftCard = this.giftCard
  if (this.giftCardTemplateSuffix) input.giftCardTemplateSuffix = this.giftCardTemplateSuffix
  
  // Add SEO if exists
  if (this.seo?.title || this.seo?.description) {
    input.seo = {}
    if (this.seo.title) input.seo.title = this.seo.title
    if (this.seo.description) input.seo.description = this.seo.description
  }
  
  // Add product options for new product model (filter empty values)
  if (this.options?.length) {
    input.productOptions = this.options.map(option => {
      const rawValues = Array.isArray(option.optionValues) ? option.optionValues : []
      const cleanedValues = rawValues
        .filter(v => v && typeof v.name === 'string' && v.name.trim().length > 0)
        .map(v => ({ name: v.name }))
      return {
        name: option.name,
        position: option.position,
        values: cleanedValues
      }
    })
  }
  
  // Add variants for productSet
  if (this.variants?.length) {
    let definedOptions = Array.isArray(this.options) ? this.options : []
    // If variants exist but no options are defined, inject default option
    // Shopify requires product options when updating/creating variants
    if (definedOptions.length === 0) {
      definedOptions = [{
        name: 'Title',
        position: 1,
        optionValues: [{ name: 'Default' }]
      }]
      // Ensure productOptions exists on input with the default
      input.productOptions = [
        {
          name: 'Title',
          position: 1,
          values: [{ name: 'Default' }]
        }
      ]
    }
    input.variants = this.variants.map((variant, vIndex) => {
      const override = variantOverrides?.[vIndex] || {};
      const variantInput = {
        price: (override.price ?? variant.price).toString() // Shopify expects string
      }
      
      // Add optional variant fields
      if (override.compareAtPrice != null) {
        variantInput.compareAtPrice = override.compareAtPrice.toString()
      } else if (variant.compareAtPrice) {
        variantInput.compareAtPrice = variant.compareAtPrice.toString()
      }
      if (override.sku) {
        variantInput.sku = override.sku
      } else if (variant.sku) {
        variantInput.sku = variant.sku
      }
      if (variant.barcode) variantInput.barcode = variant.barcode
      if (variant.taxCode) variantInput.taxCode = variant.taxCode
      // Shopify: Gift cards cannot be taxable; omit taxable when giftCard true
      if (!this.giftCard && typeof variant.taxable === 'boolean') {
        variantInput.taxable = variant.taxable
      }
      // Do not include requiresShipping in productSet variant input (not supported)
      
  // Inventory settings
  if (variant.inventoryPolicy) variantInput.inventoryPolicy = variant.inventoryPolicy.toUpperCase()
  // If a location is available, set inventory quantity at that location (enables tracking in Shopify UI)
  if (typeof variant.inventoryQuantity === 'number' && locationId) {
        variantInput.inventoryQuantities = [{
          availableQuantity: variant.inventoryQuantity,
          locationId: locationId
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
      
      // Option values for new product model: align with defined product options
      const incomingOptionValues = Array.isArray(variant.optionValues) ? variant.optionValues : []
      const normalizedOptionValues = definedOptions.map((optDef, optIndex) => {
        // Prefer match by optionName; fallback by index
        const match = incomingOptionValues.find(ov => ov && ov.optionName === optDef.name) || incomingOptionValues[optIndex]
        const valueName = (match && typeof match.name === 'string' && match.name.trim().length > 0)
          ? match.name
          : (
            // fallback to first defined option value if present, else 'Default'
            (Array.isArray(optDef.optionValues) && optDef.optionValues.length > 0 && optDef.optionValues[0].name)
              ? optDef.optionValues[0].name
              : 'Default'
          )
        return {
          optionName: optDef.name,
          name: valueName
        }
      })
      // With the default injection above, definedOptions is always >= 1 here
      variantInput.optionValues = normalizedOptionValues
      
      // Add metafields if exist on variant
      if (variant.metafields?.length) {
        variantInput.metafields = variant.metafields.map(meta => ({
          namespace: meta.namespace,
          key: meta.key,
          value: meta.value,
          type: meta.type
        }))
      }
      
      return variantInput
    })
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
  if (!this.giftCard && typeof variant.taxable === 'boolean') variantInput.taxable = variant.taxable
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
