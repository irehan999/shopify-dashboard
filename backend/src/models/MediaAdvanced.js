import mongoose from 'mongoose'

// ==============================================
// SEPARATE MEDIA MODEL (OPTIONAL)
// Use this if you need advanced media management
// ==============================================

const mediaSchema = new mongoose.Schema({
  // ==============================================
  // CORE FIELDS
  // ==============================================
  
  // Original file information
  originalFilename: {
    type: String,
    required: true,
    trim: true
  },
  
  // File storage information
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v)
      },
      message: 'Invalid URL format'
    }
  },
  
  // CDN/optimized URLs for different sizes
  optimizedUrls: {
    thumbnail: String,    // 150x150
    small: String,        // 300x300
    medium: String,       // 600x600
    large: String,        // 1200x1200
    original: String      // Original size
  },
  
  // Media type and format
  mediaContentType: {
    type: String,
    enum: ['IMAGE', 'VIDEO', 'MODEL_3D', 'EXTERNAL_VIDEO'],
    required: true
  },
  
  mimeType: {
    type: String,
    required: true
  },
  
  // File metadata
  fileSize: {
    type: Number,
    required: true,
    min: 0
  },
  
  dimensions: {
    width: Number,
    height: Number,
    duration: Number // for videos
  },
  
  // Display information
  alt: {
    type: String,
    trim: true,
    maxLength: 512
  },
  
  caption: {
    type: String,
    trim: true,
    maxLength: 1000
  },
  
  // ==============================================
  // DASHBOARD ORGANIZATION
  // ==============================================
  
  // Who uploaded this media
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Folder organization
  folder: {
    type: String,
    trim: true,
    default: 'general'
  },
  
  // Tags for organization
  tags: [{
    type: String,
    trim: true,
    maxLength: 50
  }],
  
  // ==============================================
  // USAGE TRACKING
  // ==============================================
  
  // Products using this media
  usedInProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    position: {
      type: Number,
      default: 0
    }
  }],
  
  // Collections using this media
  usedInCollections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }],
  
  // Usage count for analytics
  usageCount: {
    type: Number,
    default: 0
  },
  
  // ==============================================
  // SHOPIFY SYNC
  // ==============================================
  
  // Shopify media IDs per store
  shopifyMappings: [{
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    shopifyMediaId: {
      type: String,
      required: true
    },
    syncedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ==============================================
  // PROCESSING STATUS
  // ==============================================
  
  processingStatus: {
    type: String,
    enum: ['uploading', 'processing', 'ready', 'error'],
    default: 'uploading'
  },
  
  processingError: {
    type: String
  },
  
  // ==============================================
  // SEO & ACCESSIBILITY
  // ==============================================
  
  seo: {
    title: String,
    description: String,
    focusKeyword: String
  },
  
  accessibility: {
    altGenerated: Boolean,
    colorProfile: String,
    hasTransparency: Boolean
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// ==============================================
// INDEXES
// ==============================================

mediaSchema.index({ uploadedBy: 1, createdAt: -1 })
mediaSchema.index({ mediaContentType: 1 })
mediaSchema.index({ folder: 1 })
mediaSchema.index({ tags: 1 })
mediaSchema.index({ processingStatus: 1 })
mediaSchema.index({ 'usedInProducts.product': 1 })

// ==============================================
// VIRTUALS
// ==============================================

// Get the best URL for display
mediaSchema.virtual('displayUrl').get(function() {
  return this.optimizedUrls?.medium || this.url
})

// Check if media is being used
mediaSchema.virtual('isInUse').get(function() {
  return this.usedInProducts?.length > 0 || this.usedInCollections?.length > 0
})

// File size in human readable format
mediaSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
})

// ==============================================
// METHODS
// ==============================================

// Convert to Shopify media input
mediaSchema.methods.toShopifyMediaInput = function() {
  return {
    alt: this.alt || this.caption || '',
    mediaContentType: this.mediaContentType,
    originalSource: this.url
  }
}

// Add usage to product
mediaSchema.methods.addProductUsage = function(productId, position = 0) {
  const existing = this.usedInProducts.find(
    usage => usage.product.toString() === productId.toString()
  )
  
  if (!existing) {
    this.usedInProducts.push({ product: productId, position })
    this.usageCount += 1
  } else {
    existing.position = position
  }
  
  return this.save()
}

// Remove usage from product
mediaSchema.methods.removeProductUsage = function(productId) {
  const index = this.usedInProducts.findIndex(
    usage => usage.product.toString() === productId.toString()
  )
  
  if (index > -1) {
    this.usedInProducts.splice(index, 1)
    this.usageCount = Math.max(0, this.usageCount - 1)
  }
  
  return this.save()
}

// ==============================================
// STATIC METHODS
// ==============================================

// Find unused media
mediaSchema.statics.findUnused = function() {
  return this.find({
    $and: [
      { 'usedInProducts.0': { $exists: false } },
      { 'usedInCollections.0': { $exists: false } }
    ]
  })
}

// Find by folder
mediaSchema.statics.findByFolder = function(folder, userId) {
  const query = { folder }
  if (userId) query.uploadedBy = userId
  
  return this.find(query).sort({ createdAt: -1 })
}

// Search media
mediaSchema.statics.search = function(filters = {}) {
  const query = {}
  
  if (filters.uploadedBy) query.uploadedBy = filters.uploadedBy
  if (filters.mediaContentType) query.mediaContentType = filters.mediaContentType
  if (filters.folder) query.folder = filters.folder
  if (filters.tags) query.tags = { $in: filters.tags }
  if (filters.processingStatus) query.processingStatus = filters.processingStatus
  
  if (filters.search) {
    query.$or = [
      { originalFilename: new RegExp(filters.search, 'i') },
      { alt: new RegExp(filters.search, 'i') },
      { caption: new RegExp(filters.search, 'i') },
      { tags: new RegExp(filters.search, 'i') }
    ]
  }
  
  return this.find(query).sort({ createdAt: -1 })
}

export const Media = mongoose.model('Media', mediaSchema)

// ==============================================
// USAGE EXAMPLE
// ==============================================

/*
// When to use separate Media model vs embedded:

// 1. USE EMBEDDED (current approach) for:
//    - Simple product catalogs
//    - Direct Shopify sync
//    - When media is tightly coupled to products
//    - Smaller teams with simple workflows

// 2. USE SEPARATE Media model for:
//    - Advanced media management
//    - Media libraries shared across products
//    - Complex image processing workflows
//    - Large teams with media managers
//    - Advanced analytics on media usage
//    - Bulk media operations

// Example usage of separate Media model:
const media = new Media({
  originalFilename: 'product-image.jpg',
  url: 'https://cdn.example.com/media/123.jpg',
  mediaContentType: 'IMAGE',
  mimeType: 'image/jpeg',
  fileSize: 125000,
  dimensions: { width: 1200, height: 800 },
  alt: 'Blue running shoes',
  uploadedBy: userId,
  folder: 'products/shoes'
})

await media.save()
await media.addProductUsage(productId, 0) // Position 0 = featured image
*/
