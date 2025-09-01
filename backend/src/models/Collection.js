import mongoose from 'mongoose'

const collectionSchema = new mongoose.Schema({
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
  
  // Basic collection information
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
  
  // Collection type
  collectionType: {
    type: String,
    enum: ['smart', 'custom'],
    required: true
  },
  
  // Collection rules (for smart collections)
  rules: [{
    column: {
      type: String,
      enum: ['title', 'type', 'vendor', 'variant_price', 'tag', 'variant_compare_at_price', 'variant_weight', 'variant_inventory', 'variant_title']
    },
    relation: {
      type: String,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'starts_with', 'ends_with', 'contains', 'not_contains']
    },
    condition: String
  }],
  
  // Disjunctive (OR vs AND logic for rules)
  disjunctive: {
    type: Boolean,
    default: false
  },
  
  // Sort order
  sortOrder: {
    type: String,
    enum: ['manual', 'best-selling', 'alpha-asc', 'alpha-desc', 'price-asc', 'price-desc', 'created-desc', 'created-asc'],
    default: 'manual'
  },
  
  // Collection status
  published: {
    type: Boolean,
    default: true
  },
  publishedAt: {
    type: Date
  },
  
  // SEO
  seo: {
    title: String,
    description: String
  },
  
  // Template suffix
  templateSuffix: {
    type: String
  },
  
  // Image
  image: {
    id: String,
    alt: String,
    src: String,
    width: Number,
    height: Number
  },
  
  // Products in this collection (for custom collections)
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Product count
  productsCount: {
    type: Number,
    default: 0
  },
  
  // Metafields
  metafields: [{
    namespace: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
    type: { type: String, default: 'single_line_text_field' }
  }],
  
  // Publishing channels
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

// Indexes
collectionSchema.index({ store: 1, shopifyId: 1 })
collectionSchema.index({ store: 1, published: 1 })
collectionSchema.index({ store: 1, collectionType: 1 })
collectionSchema.index({ lastSyncAt: 1 })

// Method to update product count
collectionSchema.methods.updateProductCount = async function() {
  if (this.collectionType === 'custom') {
    this.productsCount = this.products.length
  } else {
    // For smart collections, we'd need to query products that match the rules
    // This would be implemented based on the specific rule logic
    const Product = mongoose.model('Product')
    this.productsCount = await Product.countDocuments({
      store: this.store,
      // Add rule matching logic here
    })
  }
  return this.save()
}

// Method to update sync status
collectionSchema.methods.updateSyncStatus = function(status, error = null) {
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

export const Collection = mongoose.model('Collection', collectionSchema)
