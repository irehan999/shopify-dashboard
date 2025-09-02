import mongoose from 'mongoose'

const storeSchema = new mongoose.Schema({
  // User who owns this store connection
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Shopify store information
  shopDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  shopEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // OAuth access token (encrypted in production)
  accessToken: {
    type: String,
    required: true
  },
  scopes: [{
    type: String
  }],
  
  // Connection status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  disconnectedAt: {
    type: Date
  },
  
  // Shop metadata from Shopify API
  shopData: {
    id: Number,
    currency: String,
    timezone: String,
    plan: String,
    country: String,
    province: String,
    city: String,
    address: String,
    zip: String,
    phone: String
  },
  
  // Sync information
  lastSyncAt: {
    type: Date
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'syncing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Webhook configuration
  webhookEndpoints: [{
    topic: String,
    address: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Cached analytics (updated periodically)
  analytics: {
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 },
    lastUpdated: Date
  },
  
  // Dashboard settings
  dashboardSettings: {
    syncFrequency: { 
      type: String, 
      enum: ['real-time', 'hourly', 'daily'], 
      default: 'hourly' 
    },
    autoSync: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  },
  
  // Error tracking
  lastError: {
    message: String,
    code: String,
    timestamp: Date
  }
}, {
  timestamps: true
})

// Compound index for user and shop (unique connection per user)
storeSchema.index({ userId: 1, shopDomain: 1 }, { unique: true })

// Index for active stores
storeSchema.index({ userId: 1, isActive: 1 })

// Index for shop domain lookup
storeSchema.index({ shopDomain: 1 })

// Pre-save middleware to handle shop domain formatting
storeSchema.pre('save', function(next) {
  if (this.shopDomain && !this.shopDomain.includes('.myshopify.com')) {
    this.shopDomain = `${this.shopDomain}.myshopify.com`
  }
  next()
})

// Virtual for store URL
storeSchema.virtual('storeUrl').get(function() {
  return `https://${this.shopDomain}`
})

// Virtual for admin URL
storeSchema.virtual('adminUrl').get(function() {
  return `https://${this.shopDomain}/admin`
})

// Instance method to check if store token is valid
storeSchema.methods.isTokenValid = function() {
  return this.accessToken && this.isActive
}

// Instance method to update last sync time
storeSchema.methods.updateLastSync = function() {
  this.lastSyncAt = new Date()
  return this.save()
}

// Static method to find active stores for user
storeSchema.statics.findActiveStoresForUser = function(userId) {
  return this.find({ userId, isActive: true }).sort({ connectedAt: -1 })
}

// Static method to get store with analytics (without access token)
storeSchema.statics.findStoreWithAnalytics = function(storeId, userId) {
  return this.findOne({ _id: storeId, userId, isActive: true })
    .select('-accessToken') // Don't return access token for security
}

export const Store = mongoose.model('Store', storeSchema)
