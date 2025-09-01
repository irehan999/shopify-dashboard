import mongoose from 'mongoose'

// Product Option Schema - streamlined for Shopify mutations
const productOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  optionValues: [{
    name: { type: String, required: true }
  }]
}, { _id: false })

// Product Variant Schema - only fields needed for mutations
const productVariantSchema = new mongoose.Schema({
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
  inventoryQuantity: {
    type: Number,
    default: 0
  },
  inventoryPolicy: {
    type: String,
    enum: ['deny', 'continue'],
    default: 'deny'
  },
  inventoryManagement: {
    type: String,
    enum: ['shopify', 'not_managed'],
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
    type: Number,
    default: 0
  },
  weightUnit: {
    type: String,
    enum: ['g', 'kg', 'oz', 'lb'],
    default: 'g'
  },
  // Option values for new product model
  optionValues: [{
    optionName: String, // Links to product option name
    name: String // The value name
  }]
}, { _id: false })

// Streamlined Product Schema - only essential fields for Shopify mutations
const productSchema = new mongoose.Schema({
  // REQUIRED: Only field required by productCreate mutation
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  // Dashboard metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // OPTIONAL: Common fields for productCreate mutation
  descriptionHtml: {
    type: String
  },
  vendor: {
    type: String,
    trim: true
  },
  productType: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  handle: {
    type: String,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED', 'DRAFT'],
    default: 'DRAFT'
  },
  
  // OPTIONAL: Publishing
  published: {
    type: Boolean,
    default: false
  },
  
  // OPTIONAL: Collections
  collectionsToJoin: [{
    type: String
  }],
  
  // OPTIONAL: SEO
  seo: {
    title: String,
    description: String
  },
  
  // OPTIONAL: Gift card functionality
  giftCard: {
    type: Boolean,
    default: false
  },
  giftCardTemplateSuffix: {
    type: String
  },
  
  // Product structure for new product model
  options: [productOptionSchema],
  variants: [productVariantSchema],
  
  // Media for productCreateMedia mutation
  media: [{
    src: { type: String, required: true },
    alt: String,
    mediaContentType: {
      type: String,
      enum: ['IMAGE', 'VIDEO', 'MODEL_3D', 'EXTERNAL_VIDEO'],
      required: true
    }
  }],
  
  // OPTIONAL: Metafields
  metafields: [{
    namespace: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
    type: { type: String, default: 'single_line_text_field' }
  }]
}, {
  timestamps: true
})

// Indexes for performance
productSchema.index({ createdBy: 1 })
productSchema.index({ status: 1 })
productSchema.index({ handle: 1 }, { unique: true, sparse: true })

// Method to convert to ProductInput for productCreate mutation
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
      values: option.optionValues?.map(value => ({ name: value.name })) || []
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

// Method for productVariantsBulkCreate mutation
productSchema.methods.toShopifyVariantsInput = function() {
  if (!this.variants?.length) return []
  
  return this.variants.map(variant => {
    const variantInput = {
      price: variant.price
    }
    
    // Add optional variant fields only if they exist
    if (variant.compareAtPrice) variantInput.compareAtPrice = variant.compareAtPrice
    if (variant.sku) variantInput.sku = variant.sku
    if (variant.barcode) variantInput.barcode = variant.barcode
    if (variant.weight) variantInput.weight = variant.weight
    if (variant.weightUnit) variantInput.weightUnit = variant.weightUnit
    if (typeof variant.inventoryQuantity === 'number') variantInput.inventoryQuantity = variant.inventoryQuantity
    if (variant.inventoryPolicy) variantInput.inventoryPolicy = variant.inventoryPolicy
    if (variant.inventoryManagement) variantInput.inventoryManagement = variant.inventoryManagement
    if (typeof variant.requiresShipping === 'boolean') variantInput.requiresShipping = variant.requiresShipping
    if (typeof variant.taxable === 'boolean') variantInput.taxable = variant.taxable
    
    // Add option values for new product model
    if (variant.optionValues?.length) {
      variantInput.optionValues = variant.optionValues.map(opt => ({
        optionName: opt.optionName,
        name: opt.name
      }))
    }
    
    return variantInput
  })
}

// Method for productCreateMedia mutation
productSchema.methods.toShopifyMediaInput = function() {
  if (!this.media?.length) return []
  
  return this.media.map(mediaItem => ({
    alt: mediaItem.alt,
    mediaContentType: mediaItem.mediaContentType,
    originalSource: mediaItem.src
  }))
}

export const Product = mongoose.model('Product', productSchema)
