import mongoose from 'mongoose'

// Dashboard Product to Store Product mapping
// This model maps dashboard products to their Shopify store instances
const productMapSchema = new mongoose.Schema({
  // Dashboard product (the master/source product created in dashboard)
  dashboardProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // User who created this mapping
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Store mappings - where this dashboard product has been pushed
  storeMappings: [{
    // Target store where product was pushed
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    
    // Shopify product ID in the target store
    shopifyProductId: {
      type: String,
      required: true
    },
    
    // Shopify product handle in the target store
    shopifyHandle: {
      type: String,
      required: true
    },
    
    // Mapping status
    status: {
      type: String,
      enum: ['active', 'syncing', 'error', 'paused', 'deleted'],
      default: 'active'
    },
    
    // Store-specific sync settings
    syncSettings: {
      autoSync: { type: Boolean, default: true },
      syncTitle: { type: Boolean, default: true },
      syncDescription: { type: Boolean, default: true },
      syncPrice: { type: Boolean, default: true },
      syncInventory: { type: Boolean, default: false },
      syncMedia: { type: Boolean, default: true },
      syncSEO: { type: Boolean, default: true },
      syncTags: { type: Boolean, default: true },
      syncVariants: { type: Boolean, default: true },
      syncStatus: { type: Boolean, default: true }
    },
    
    // Store-specific customizations
    storeCustomizations: {
      titlePrefix: String,
      titleSuffix: String,
      descriptionAppend: String,
      descriptionPrepend: String,
      additionalTags: [String],
      excludeTags: [String],
      customHandle: String,
      customMetafields: [{
        namespace: { type: String, required: true },
        key: { type: String, required: true },
        value: { type: String, required: true },
        type: { type: String, default: 'single_line_text_field' }
      }]
    },
    
    // Price adjustments for this specific store
    priceAdjustments: {
      type: {
        type: String,
        enum: ['none', 'percentage', 'fixed', 'markup', 'markdown'],
        default: 'none'
      },
      value: { type: Number, default: 0 },
      roundTo: { type: Number, default: 0.01 },
      applyToCompareAt: { type: Boolean, default: true }
    },
    
    // Variant-specific mappings (dashboard variant ID to Shopify variant ID)
    variantMappings: [{
      dashboardVariantIndex: { type: Number, required: true },
      shopifyVariantId: { type: String, required: true },
      customPrice: Number,
      customCompareAtPrice: Number,
      customSku: String,
      isActive: { type: Boolean, default: true }
    }],
    
    // Media mappings (dashboard media to Shopify media)
    mediaMappings: [{
      dashboardMediaIndex: { type: Number, required: true },
      shopifyMediaId: String,
      shopifyUrl: String,
      uploadStatus: {
        type: String,
        enum: ['pending', 'uploading', 'uploaded', 'error'],
        default: 'pending'
      }
    }],
    
    // Sync history
    syncHistory: [{
      syncType: {
        type: String,
        enum: ['create', 'update', 'price', 'inventory', 'media', 'full'],
        required: true
      },
      timestamp: { type: Date, default: Date.now },
      success: { type: Boolean, required: true },
      changes: [{
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed
      }],
      error: String,
      syncDuration: Number // in milliseconds
    }],
    
    // Last sync information
    lastSyncAt: Date,
    lastSuccessfulSyncAt: Date,
    lastSyncError: String,
    
    // Store-specific product status
    isPublished: { type: Boolean, default: false },
    publishedAt: Date,
    
    // Creation and update timestamps for this mapping
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  
  // Global sync settings for all stores
  globalSyncSettings: {
    autoSyncOnDashboardUpdate: { type: Boolean, default: true },
    syncFrequency: {
      type: String,
      enum: ['manual', 'real-time', 'hourly', 'daily', 'weekly'],
      default: 'manual'
    },
    batchSync: { type: Boolean, default: false },
    
    // Auto-sync triggers
    triggers: {
      onTitleChange: { type: Boolean, default: true },
      onDescriptionChange: { type: Boolean, default: true },
      onPriceChange: { type: Boolean, default: true },
      onInventoryChange: { type: Boolean, default: false },
      onMediaChange: { type: Boolean, default: true },
      onVariantChange: { type: Boolean, default: true },
      onStatusChange: { type: Boolean, default: true },
      onTagChange: { type: Boolean, default: true }
    }
  },
  
  // Overall mapping statistics
  mappingStats: {
    totalStores: { type: Number, default: 0 },
    activeStores: { type: Number, default: 0 },
    totalSyncs: { type: Number, default: 0 },
    successfulSyncs: { type: Number, default: 0 },
    failedSyncs: { type: Number, default: 0 },
    lastGlobalSync: Date,
    averageSyncDuration: Number
  },
  
  // Mapping status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
})

// Indexes for efficient queries
productMapSchema.index({ dashboardProduct: 1 })
productMapSchema.index({ createdBy: 1 })
productMapSchema.index({ 'storeMappings.store': 1 })
productMapSchema.index({ 'storeMappings.shopifyProductId': 1 })
productMapSchema.index({ 'storeMappings.status': 1 })
productMapSchema.index({ isActive: 1, isDeleted: 1 })

// Compound indexes
productMapSchema.index({ 
  dashboardProduct: 1, 
  'storeMappings.store': 1 
})

// Method to add a store mapping (when pushing to a new store)
productMapSchema.methods.addStoreMapping = function(storeId, shopifyProductId, shopifyHandle, customizations = {}) {
  // Check if mapping already exists
  const existingMapping = this.storeMappings.find(
    mapping => mapping.store.toString() === storeId.toString()
  )
  
  if (existingMapping) {
    throw new Error('Store mapping already exists for this product')
  }
  
  const newMapping = {
    store: storeId,
    shopifyProductId,
    shopifyHandle,
    status: 'active',
    syncSettings: this.getDefaultSyncSettings(),
    storeCustomizations: customizations,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  this.storeMappings.push(newMapping)
  this.mappingStats.totalStores += 1
  this.mappingStats.activeStores += 1
  
  return this.save()
}

// Method to remove a store mapping
productMapSchema.methods.removeStoreMapping = function(storeId) {
  const mappingIndex = this.storeMappings.findIndex(
    mapping => mapping.store.toString() === storeId.toString()
  )
  
  if (mappingIndex === -1) {
    throw new Error('Store mapping not found')
  }
  
  const mapping = this.storeMappings[mappingIndex]
  if (mapping.status === 'active') {
    this.mappingStats.activeStores -= 1
  }
  
  this.storeMappings.splice(mappingIndex, 1)
  this.mappingStats.totalStores -= 1
  
  return this.save()
}

// Method to update sync status for a specific store
productMapSchema.methods.updateStoreSyncStatus = function(storeId, syncData) {
  const mapping = this.storeMappings.find(
    mapping => mapping.store.toString() === storeId.toString()
  )
  
  if (!mapping) {
    throw new Error('Store mapping not found')
  }
  
  // Add to sync history
  const syncRecord = {
    syncType: syncData.syncType || 'update',
    timestamp: new Date(),
    success: syncData.success,
    changes: syncData.changes || [],
    syncDuration: syncData.duration
  }
  
  if (syncData.error) {
    syncRecord.error = syncData.error
    mapping.lastSyncError = syncData.error
    this.mappingStats.failedSyncs += 1
  } else {
    mapping.lastSuccessfulSyncAt = new Date()
    mapping.lastSyncError = null
    this.mappingStats.successfulSyncs += 1
  }
  
  mapping.syncHistory.push(syncRecord)
  mapping.lastSyncAt = new Date()
  mapping.updatedAt = new Date()
  
  this.mappingStats.totalSyncs += 1
  this.mappingStats.lastGlobalSync = new Date()
  
  // Calculate average sync duration
  if (syncData.duration) {
    const totalDuration = this.mappingStats.averageSyncDuration || 0
    const totalSyncs = this.mappingStats.totalSyncs
    this.mappingStats.averageSyncDuration = (totalDuration * (totalSyncs - 1) + syncData.duration) / totalSyncs
  }
  
  return this.save()
}

// Method to get mapping for specific store
productMapSchema.methods.getStoreMapping = function(storeId) {
  return this.storeMappings.find(
    mapping => mapping.store.toString() === storeId.toString()
  )
}

// Method to update variant mapping
productMapSchema.methods.updateVariantMapping = function(storeId, dashboardVariantIndex, shopifyVariantId, customData = {}) {
  const storeMapping = this.getStoreMapping(storeId)
  if (!storeMapping) {
    throw new Error('Store mapping not found')
  }
  
  const existingVariant = storeMapping.variantMappings.find(
    vm => vm.dashboardVariantIndex === dashboardVariantIndex
  )
  
  if (existingVariant) {
    existingVariant.shopifyVariantId = shopifyVariantId
    Object.assign(existingVariant, customData)
  } else {
    storeMapping.variantMappings.push({
      dashboardVariantIndex,
      shopifyVariantId,
      ...customData
    })
  }
  
  storeMapping.updatedAt = new Date()
  return this.save()
}

// Method to get default sync settings
productMapSchema.methods.getDefaultSyncSettings = function() {
  return {
    autoSync: true,
    syncTitle: true,
    syncDescription: true,
    syncPrice: true,
    syncInventory: false,
    syncMedia: true,
    syncSEO: true,
    syncTags: true,
    syncVariants: true,
    syncStatus: true
  }
}

// Static method to find by dashboard product
productMapSchema.statics.findByDashboardProduct = function(productId) {
  return this.findOne({ 
    dashboardProduct: productId, 
    isDeleted: false 
  }).populate('storeMappings.store dashboardProduct')
}

// Static method to find by store
productMapSchema.statics.findByStore = function(storeId) {
  return this.find({
    'storeMappings.store': storeId,
    isDeleted: false
  }).populate('dashboardProduct storeMappings.store')
}

// Static method to find by Shopify product ID
productMapSchema.statics.findByShopifyProductId = function(shopifyProductId) {
  return this.findOne({
    'storeMappings.shopifyProductId': shopifyProductId,
    isDeleted: false
  }).populate('dashboardProduct storeMappings.store')
}

export const ProductMap = mongoose.model('ProductMap', productMapSchema)
