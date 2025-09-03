import mongoose from 'mongoose'

const storeLinkSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  shopDomain: { type: String, required: true, lowercase: true, trim: true },
  shopName: String,
  shopEmail: String,
  // OAuth session payload we need to finalize the connection
  sessionId: String,
  accessToken: { type: String, required: true },
  scopes: [String],
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
    phone: String,
  },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true })

// TTL index (optional manual cleanup); do not auto-delete to allow manual handling
storeLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const StoreLink = mongoose.model('StoreLink', storeLinkSchema)
