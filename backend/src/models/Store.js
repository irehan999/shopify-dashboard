import mongoose from 'mongoose'

const storeSchema = new mongoose.Schema({
  // Shopify store information
  shopifyDomain: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  shopId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Authentication tokens
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  
  // Store configuration
  currency: {
    type: String,
    default: 'USD'
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  locale: {
    type: String,
    default: 'en'
  },
  
  // Store status
  isActive: {
    type: Boolean,
    default: true
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  lastSyncAt: {
    type: Date
  },
  
  // Store metadata
  planName: {
    type: String
  },
  country: {
    type: String
  },
  province: {
    type: String
  },
  city: {
    type: String
  },
  address: {
    type: String
  },
  zipCode: {
    type: String
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  
  // Store owner/manager
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Store features and limits
  features: {
    multiLocation: { type: Boolean, default: false },
    giftCards: { type: Boolean, default: false },
    abandonedCheckout: { type: Boolean, default: false },
    reports: { type: Boolean, default: false }
  },
  
  limits: {
    products: { type: Number, default: 25 },
    variants: { type: Number, default: 100 },
    fileStorage: { type: Number, default: 1000 }, // MB
    bandwidth: { type: Number, default: 1000 }, // GB per month
    staffAccounts: { type: Number, default: 2 }
  },
  
  // Store settings for dashboard
  dashboardSettings: {
    syncFrequency: { 
      type: String, 
      enum: ['real-time', 'hourly', 'daily'], 
      default: 'hourly' 
    },
    autoSync: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  },
  
  // Webhook endpoints
  webhooks: [{
    topic: { type: String, required: true },
    endpoint: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Error tracking
  lastError: {
    message: String,
    code: String,
    timestamp: Date
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
storeSchema.index({ owner: 1 })
storeSchema.index({ shopifyDomain: 1 })
storeSchema.index({ isActive: 1, isConnected: 1 })

// Virtual for store URL
storeSchema.virtual('storeUrl').get(function() {
  return `https://${this.shopifyDomain}`
})

// Method to check if store token is valid
storeSchema.methods.isTokenValid = function() {
  // Add token validation logic here
  return this.accessToken && this.isConnected
}

// Method to update last sync time
storeSchema.methods.updateLastSync = function() {
  this.lastSyncAt = new Date()
  return this.save()
}

export const Store = mongoose.model('Store', storeSchema)
