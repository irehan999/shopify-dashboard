import mongoose from 'mongoose'

// ==============================================
// REUSABLE SCHEMAS FOR BETTER ORGANIZATION
// ==============================================

// Media Schema - can be reused across models
export const mediaSchema = new mongoose.Schema({
  src: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(v)
      },
      message: 'Invalid media URL format'
    }
  },
  alt: {
    type: String,
    trim: true,
    maxLength: 512
  },
  mediaContentType: {
    type: String,
    enum: ['IMAGE', 'VIDEO', 'MODEL_3D', 'EXTERNAL_VIDEO'],
    required: true
  },
  fileSize: Number, // For dashboard optimization
  dimensions: {
    width: Number,
    height: Number
  },
  position: { // For ordering
    type: Number,
    default: 0
  }
}, { _id: false })

// Product Option Value Schema
export const optionValueSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxLength: 255
  },
  position: {
    type: Number,
    default: 0
  }
}, { _id: false })

// Product Option Schema
export const productOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 255
  },
  position: {
    type: Number,
    default: 0
  },
  optionValues: [optionValueSchema]
}, { _id: false })

// Variant Option Values Schema (for new product model)
export const variantOptionValueSchema = new mongoose.Schema({
  optionName: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  }
}, { _id: false })

// Product Variant Schema
export const productVariantSchema = new mongoose.Schema({
  // REQUIRED FIELDS
  price: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0 && v <= 999999.99
      },
      message: 'Price must be between 0 and 999999.99'
    }
  },
  
  // OPTIONAL SHOPIFY FIELDS
  compareAtPrice: {
    type: Number,
    min: 0,
    validate: {
      validator: function(v) {
        return !v || v >= this.price
      },
      message: 'Compare at price must be greater than or equal to price'
    }
  },
  sku: {
    type: String,
    trim: true,
    maxLength: 255
  },
  barcode: {
    type: String,
    trim: true,
    maxLength: 255
  },
  
  // INVENTORY SETTINGS
  inventoryQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  inventoryPolicy: {
    type: String,
    enum: ['deny', 'continue'],
    default: 'deny'
  },
  inventoryManagement: {
    type: String,
    enum: ['shopify', 'not_managed'],
    default: 'not_managed'
  },
  
  // SHIPPING & TAX
  requiresShipping: {
    type: Boolean,
    default: true
  },
  taxable: {
    type: Boolean,
    default: true
  },
  taxCode: {
    type: String,
    trim: true
  },
  
  // WEIGHT
  weight: {
    type: Number,
    default: 0,
    min: 0
  },
  weightUnit: {
    type: String,
    enum: ['g', 'kg', 'oz', 'lb'],
    default: 'g'
  },
  
  // NEW PRODUCT MODEL: Option values
  optionValues: [variantOptionValueSchema],
  
  // Variant-specific media linkage (indexes referencing product.media array)
  mediaIndexes: {
    type: [Number],
    default: []
  },
  
  // DASHBOARD FIELDS
  position: {
    type: Number,
    default: 0
  }
}, { _id: false })

// SEO Schema
export const seoSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxLength: 320
  },
  description: {
    type: String,
    trim: true,
    maxLength: 320
  }
}, { _id: false })

// Metafield Schema
export const metafieldSchema = new mongoose.Schema({
  namespace: { 
    type: String, 
    required: true,
    trim: true,
    maxLength: 20
  },
  key: { 
    type: String, 
    required: true,
    trim: true,
    maxLength: 30
  },
  value: { 
    type: String, 
    required: true,
    maxLength: 5000
  },
  type: { 
    type: String, 
    default: 'single_line_text_field',
    enum: [
      'single_line_text_field',
      'multi_line_text_field',
      'number_integer',
      'number_decimal',
      'date',
      'date_time',
      'boolean',
      'color',
      'weight',
      'volume',
      'dimension',
      'rating',
      'json',
      'money',
      'file_reference',
      'product_reference',
      'variant_reference',
      'page_reference',
      'collection_reference'
    ]
  }
}, { _id: false })
