import mongoose from 'mongoose'

// Product Option Schema based on Shopify's new product model
const productOptionSchema = new mongoose.Schema({
  shopifyId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  position: {
    type: Number,
    required: true
  },
  values: [{
    type: String,
    required: true
  }],
  optionValues: [{
    id: String,
    name: String,
    hasVariants: Boolean
  }]
}, { _id: false })

// Product Variant Schema based on Shopify's structure
const productVariantSchema = new mongoose.Schema({
  shopifyId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  compareAtPrice: {
    type: Number,
    min: 0
  },
  sku: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  position: {
    type: Number,
    default: 1
  },
  inventoryPolicy: {
    type: String,
    enum: ['deny', 'continue'],
    default: 'deny'
  },
  inventoryQuantity: {
    type: Number,
    default: 0
  },
  inventoryManagement: {
    type: String,
    enum: ['shopify', 'manual', null],
    default: 'shopify'
  },
  requiresShipping: {
    type: Boolean,
    default: true
  },
  taxable: {
    type: Boolean,
    default: true
  },
  weight: {
    value: { type: Number, default: 0 },
    unit: { type: String, enum: ['g', 'kg', 'oz', 'lb'], default: 'kg' }
  },
  selectedOptions: [{
    name: String,
    value: String
  }],
  availableForSale: {
    type: Boolean,
    default: true
  },
  media: [{
    id: String,
    alt: String,
    src: String,
    mediaContentType: {
      type: String,
      enum: ['IMAGE', 'VIDEO', 'MODEL_3D', 'EXTERNAL_VIDEO']
    }
  }],
  metafields: [{
    namespace: String,
    key: String,
    value: String,
    type: String
  }]
}, { _id: false })

// Main Product Schema
const productSchema = new mongoose.Schema({
  // Shopify identifiers
  shopifyId: {
    type: String,
    required: true,
    unique: true
  },
  shopifyHandle: {
    type: String,
    required: true,
    trim: true
  },
  
  // Store reference
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  
  // Basic product information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  descriptionHtml: {
    type: String
  },
  
  // Product categorization
  productType: {
    type: String,
    trim: true
  },
  vendor: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Product status and visibility
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED', 'DRAFT'],
    default: 'DRAFT'
  },
  publishedAt: {
    type: Date
  },
  
  // SEO
  seo: {
    title: String,
    description: String
  },
  
  // Product options (new model)
  options: [productOptionSchema],
  
  // Product variants
  variants: [productVariantSchema],
  
  // Media (images, videos, 3D models)
  media: [{
    id: String,
    alt: String,
    src: String,
    mediaContentType: {
      type: String,
      enum: ['IMAGE', 'VIDEO', 'MODEL_3D', 'EXTERNAL_VIDEO']
    },
    position: Number
  }],
  
  // Featured media
  featuredMedia: {
    id: String,
    alt: String,
    src: String,
    mediaContentType: String
  },
  
  // Pricing information
  priceRange: {
    minVariantPrice: { type: Number, min: 0 },
    maxVariantPrice: { type: Number, min: 0 }
  },
  compareAtPriceRange: {
    minVariantPrice: { type: Number, min: 0 },
    maxVariantPrice: { type: Number, min: 0 }
  },
  
  // Inventory
  totalInventory: {
    type: Number,
    default: 0
  },
  tracksInventory: {
    type: Boolean,
    default: true
  },
  hasOutOfStockVariants: {
    type: Boolean,
    default: false
  },
  hasOnlyDefaultVariant: {
    type: Boolean,
    default: true
  },
  
  // Collections
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }],
  
  // Metafields for custom data
  metafields: [{
    namespace: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
    type: { type: String, default: 'single_line_text_field' }
  }],
  
  // Gift card specific
  isGiftCard: {
    type: Boolean,
    default: false
  },
  giftCardTemplateSuffix: {
    type: String
  },
  
  // Publishing
  publishedOnChannels: [{
    channelId: String,
    channelName: String,
    publishedAt: Date
  }],
  
  // Sync information
  lastSyncAt: {
    type: Date,
    default: Date.now
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'syncing', 'synced', 'error'],
    default: 'pending'
  },
  syncErrors: [{
    message: String,
    timestamp: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false }
  }],
  
  // Dashboard specific fields
  dashboardSettings: {
    featured: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    notes: String
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes for performance
productSchema.index({ store: 1, shopifyId: 1 })
productSchema.index({ store: 1, status: 1 })
productSchema.index({ store: 1, productType: 1 })
productSchema.index({ store: 1, vendor: 1 })
productSchema.index({ tags: 1 })
productSchema.index({ 'variants.sku': 1 })
productSchema.index({ lastSyncAt: 1 })

// Virtual for variant count
productSchema.virtual('variantCount').get(function() {
  return this.variants.length
})

// Virtual for available variants
productSchema.virtual('availableVariants').get(function() {
  return this.variants.filter(variant => variant.availableForSale)
})

// Method to get variant by Shopify ID
productSchema.methods.getVariantByShopifyId = function(shopifyId) {
  return this.variants.find(variant => variant.shopifyId === shopifyId)
}

// Method to update sync status
productSchema.methods.updateSyncStatus = function(status, error = null) {
  this.syncStatus = status
  this.lastSyncAt = new Date()
  
  if (error) {
    this.syncErrors.push({
      message: error.message || error,
      timestamp: new Date()
    })
  }
  
  return this.save()
}

// Method to calculate price range
productSchema.methods.calculatePriceRange = function() {
  if (this.variants.length === 0) {
    this.priceRange = { minVariantPrice: 0, maxVariantPrice: 0 }
    return
  }
  
  const prices = this.variants.map(v => v.price)
  const compareAtPrices = this.variants
    .filter(v => v.compareAtPrice)
    .map(v => v.compareAtPrice)
  
  this.priceRange = {
    minVariantPrice: Math.min(...prices),
    maxVariantPrice: Math.max(...prices)
  }
  
  if (compareAtPrices.length > 0) {
    this.compareAtPriceRange = {
      minVariantPrice: Math.min(...compareAtPrices),
      maxVariantPrice: Math.max(...compareAtPrices)
    }
  }
}

// Pre-save hook to calculate derived fields
productSchema.pre('save', function(next) {
  this.calculatePriceRange()
  this.hasOnlyDefaultVariant = this.variants.length <= 1
  this.hasOutOfStockVariants = this.variants.some(v => v.inventoryQuantity <= 0)
  this.totalInventory = this.variants.reduce((total, v) => total + v.inventoryQuantity, 0)
  next()
})

export const Product = mongoose.model('Product', productSchema)
