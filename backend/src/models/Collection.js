import mongoose from 'mongoose'

// Collection Rule Schema for Smart Collections
const collectionRuleSchema = new mongoose.Schema({
  column: {
    type: String,
    enum: [
      'IS_PRICE_REDUCED', 'PRODUCT_CATEGORY_ID', 'PRODUCT_METAFIELD_DEFINITION',
      'TAG', 'TITLE', 'TYPE', 'VARIANT_COMPARE_AT_PRICE', 'VARIANT_INVENTORY',
      'VARIANT_METAFIELD_DEFINITION', 'VARIANT_PRICE', 'VARIANT_TITLE',
      'VARIANT_WEIGHT', 'VENDOR'
    ],
    required: true
  },
  relation: {
    type: String,
    enum: [
      'CONTAINS', 'ENDS_WITH', 'EQUALS', 'GREATER_THAN', 'IS_NOT_SET',
      'IS_SET', 'LESS_THAN', 'NOT_CONTAINS', 'NOT_EQUALS', 'STARTS_WITH'
    ],
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  conditionObjectId: {
    type: String // For metafield definitions
  }
}, { _id: false })

// Collection Schema - Dashboard Master Collection
const collectionSchema = new mongoose.Schema({
  // REQUIRED: Only field required by collectionCreate
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
  
  // OPTIONAL: Common fields for collectionCreate
  descriptionHtml: {
    type: String
  },
  handle: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Collection type - determines behavior
  collectionType: {
    type: String,
    enum: ['MANUAL', 'SMART'],
    default: 'MANUAL'
  },
  
  // OPTIONAL: For smart collections only
  ruleSet: {
    appliedDisjunctively: {
      type: Boolean,
      default: false
    },
    rules: [collectionRuleSchema]
  },
  
  // OPTIONAL: For manual collections - products to include
  productIds: [{
    type: String // Dashboard product IDs (not ObjectIds - string references)
  }],
  
  // OPTIONAL: Sorting
  sortOrder: {
    type: String,
    enum: [
      'ALPHA_ASC', 'ALPHA_DESC', 'BEST_SELLING', 'CREATED',
      'CREATED_DESC', 'MANUAL', 'PRICE_ASC', 'PRICE_DESC'
    ],
    default: 'MANUAL'
  },
  
  // OPTIONAL: SEO
  seo: {
    title: String,
    description: String
  },
  
  // OPTIONAL: Image
  image: {
    src: String,
    altText: String
  },
  
  // OPTIONAL: Template
  templateSuffix: {
    type: String
  },
  
  // OPTIONAL: Metafields
  metafields: [{
    namespace: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
    type: { type: String, default: 'single_line_text_field' }
  }],
  
  // Publishing status
  published: {
    type: Boolean,
    default: false
  },
  
  // Dashboard UI settings
  color: {
    type: String,
    default: '#007bff'
  }
}, {
  timestamps: true
})

// Indexes
collectionSchema.index({ createdBy: 1 })
collectionSchema.index({ collectionType: 1 })
collectionSchema.index({ handle: 1 }, { unique: true, sparse: true })

// Generate handle if not provided
collectionSchema.methods.generateHandle = function() {
  if (!this.handle) {
    this.handle = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  return this.handle
}

// Convert to Shopify CollectionInput for collectionCreate
collectionSchema.methods.toShopifyCollectionInput = function() {
  const input = {
    title: this.title
  }
  
  // Add optional fields only if they exist
  if (this.descriptionHtml) input.descriptionHtml = this.descriptionHtml
  if (this.handle) input.handle = this.handle
  if (this.templateSuffix) input.templateSuffix = this.templateSuffix
  
  // Add SEO if exists
  if (this.seo?.title || this.seo?.description) {
    input.seo = {}
    if (this.seo.title) input.seo.title = this.seo.title
    if (this.seo.description) input.seo.description = this.seo.description
  }
  
  // Add image if exists
  if (this.image?.src) {
    input.image = {
      src: this.image.src,
      altText: this.image.altText
    }
  }
  
  // Add sort order
  if (this.sortOrder) input.sortOrder = this.sortOrder
  
  // Add rule set for smart collections
  if (this.collectionType === 'SMART' && this.ruleSet?.rules?.length) {
    input.ruleSet = {
      appliedDisjunctively: this.ruleSet.appliedDisjunctively,
      rules: this.ruleSet.rules.map(rule => ({
        column: rule.column,
        relation: rule.relation,
        condition: rule.condition,
        ...(rule.conditionObjectId && { conditionObjectId: rule.conditionObjectId })
      }))
    }
  }
  
  // Add metafields if any
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

// Method to add/remove products (for manual collections)
collectionSchema.methods.addProduct = function(productId) {
  if (this.collectionType === 'MANUAL' && !this.productIds.includes(productId)) {
    this.productIds.push(productId)
    return this.save()
  }
  return Promise.resolve(this)
}

collectionSchema.methods.removeProduct = function(productId) {
  if (this.collectionType === 'MANUAL') {
    this.productIds = this.productIds.filter(id => id !== productId)
    return this.save()
  }
  return Promise.resolve(this)
}

// Pre-save hook
collectionSchema.pre('save', function(next) {
  this.generateHandle()
  
  // Validate: SMART collections need rules
  if (this.collectionType === 'SMART' && (!this.ruleSet?.rules || this.ruleSet.rules.length === 0)) {
    return next(new Error('Smart collections must have at least one rule'))
  }
  
  next()
})

export const Collection = mongoose.model('Collection', collectionSchema)
