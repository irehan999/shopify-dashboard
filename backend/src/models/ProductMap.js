import mongoose from 'mongoose'

// Product-Store mapping for cross-store product management
const productMapSchema = new mongoose.Schema({
  // Source product (master/original)
  sourceProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  sourceStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  
  // Target stores where this product should be synced
  targetMappings: [{
    targetStore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    targetProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    targetShopifyId: String,
    
    // Mapping status
    status: {
      type: String,
      enum: ['pending', 'syncing', 'synced', 'error', 'paused'],
      default: 'pending'
    },
    
    // Sync settings for this mapping
    syncSettings: {
      syncTitle: { type: Boolean, default: true },
      syncDescription: { type: Boolean, default: true },
      syncPrice: { type: Boolean, default: true },
      syncInventory: { type: Boolean, default: false },
      syncImages: { type: Boolean, default: true },
      syncSEO: { type: Boolean, default: true },
      syncTags: { type: Boolean, default: true },
      syncVariants: { type: Boolean, default: true }
    },
    
    // Price adjustments for this store
    priceAdjustment: {
      type: {
        type: String,
        enum: ['none', 'percentage', 'fixed'],
        default: 'none'
      },
      value: { type: Number, default: 0 },
      roundTo: { type: Number, default: 0.01 } // Round to nearest cent
    },
    
    // Store-specific customizations
    customizations: {
      titleSuffix: String,
      descriptionAppend: String,
      additionalTags: [String],
      customMetafields: [{
        namespace: String,
        key: String,
        value: String
      }]
    },
    
    // Last sync information
    lastSyncAt: Date,
    lastSyncErrors: [{
      message: String,
      timestamp: { type: Date, default: Date.now },
      resolved: { type: Boolean, default: false }
    }],
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  
  // User who created this mapping
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Global sync settings
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Sync frequency
  syncFrequency: {
    type: String,
    enum: ['manual', 'real-time', 'hourly', 'daily'],
    default: 'manual'
  },
  
  // Auto-sync triggers
  autoSyncTriggers: {
    onPriceChange: { type: Boolean, default: false },
    onInventoryChange: { type: Boolean, default: false },
    onContentChange: { type: Boolean, default: true },
    onStatusChange: { type: Boolean, default: true }
  },
  
  // Sync statistics
  syncStats: {
    totalSyncs: { type: Number, default: 0 },
    successfulSyncs: { type: Number, default: 0 },
    failedSyncs: { type: Number, default: 0 },
    lastSuccessfulSync: Date,
    lastFailedSync: Date
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
})

// Indexes
productMapSchema.index({ sourceProduct: 1, sourceStore: 1 })
productMapSchema.index({ 'targetMappings.targetStore': 1 })
productMapSchema.index({ 'targetMappings.status': 1 })
productMapSchema.index({ createdBy: 1 })
productMapSchema.index({ isActive: 1 })

// Compound index for efficient lookups
productMapSchema.index({ 
  sourceProduct: 1, 
  'targetMappings.targetStore': 1 
})

// Method to add a target store mapping
productMapSchema.methods.addTargetStore = function(targetStoreId, syncSettings = {}) {
  // Check if mapping already exists
  const existingMapping = this.targetMappings.find(
    mapping => mapping.targetStore.toString() === targetStoreId.toString()
  )
  
  if (existingMapping) {
    throw new Error('Target store mapping already exists')
  }
  
  this.targetMappings.push({
    targetStore: targetStoreId,
    syncSettings: { ...this.getDefaultSyncSettings(), ...syncSettings },
    status: 'pending'
  })
  
  return this.save()
}

// Method to remove a target store mapping
productMapSchema.methods.removeTargetStore = function(targetStoreId) {
  this.targetMappings = this.targetMappings.filter(
    mapping => mapping.targetStore.toString() !== targetStoreId.toString()
  )
  return this.save()
}

// Method to update mapping status
productMapSchema.methods.updateMappingStatus = function(targetStoreId, status, error = null) {
  const mapping = this.targetMappings.find(
    mapping => mapping.targetStore.toString() === targetStoreId.toString()
  )
  
  if (!mapping) {
    throw new Error('Target store mapping not found')
  }
  
  mapping.status = status
  mapping.lastSyncAt = new Date()
  mapping.updatedAt = new Date()
  
  if (error) {
    mapping.lastSyncErrors.push({
      message: error.message || error,
      timestamp: new Date()
    })
    this.syncStats.failedSyncs += 1
    this.syncStats.lastFailedSync = new Date()
  } else if (status === 'synced') {
    this.syncStats.successfulSyncs += 1
    this.syncStats.lastSuccessfulSync = new Date()
  }
  
  this.syncStats.totalSyncs += 1
  
  return this.save()
}

// Method to get default sync settings
productMapSchema.methods.getDefaultSyncSettings = function() {
  return {
    syncTitle: true,
    syncDescription: true,
    syncPrice: true,
    syncInventory: false,
    syncImages: true,
    syncSEO: true,
    syncTags: true,
    syncVariants: true
  }
}

// Static method to find mappings by source product
productMapSchema.statics.findBySourceProduct = function(productId) {
  return this.findOne({ sourceProduct: productId, isDeleted: false })
}

// Static method to find mappings by target store
productMapSchema.statics.findByTargetStore = function(storeId) {
  return this.find({
    'targetMappings.targetStore': storeId,
    isDeleted: false
  })
}

export const ProductMap = mongoose.model('ProductMap', productMapSchema)
