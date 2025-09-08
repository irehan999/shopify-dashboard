import { z } from 'zod';

// Option value schema - matches backend optionValues structure
export const optionValueSchema = z.object({
  name: z.string().min(1, 'Option value is required'),
  position: z.number().optional()
});

// Option schema - matches backend productOptionSchema exactly
export const optionSchema = z.object({
  name: z.string().min(1, 'Option name is required'),
  position: z.number().optional(),
  optionValues: z.array(optionValueSchema).min(1, 'At least one option value is required')
});

// Base product schema - matches backend ProductOptimized model exactly
export const productSchema = z.object({
  title: z.string()
    .min(1, 'Product title is required')
    .max(255, 'Title must be less than 255 characters'),
  
  // CRITICAL: Backend expects descriptionHtml, not description
  descriptionHtml: z.string()
    .max(65535, 'Description must be less than 65535 characters')
    .optional(),
  
  vendor: z.string()
    .max(255, 'Vendor must be less than 255 characters')
    .optional(),
  
  productType: z.string()
    .max(255, 'Product type must be less than 255 characters')
    .optional(),
  
  tags: z.array(z.string()).default([]),
  
  // CRITICAL: Backend uses UPPERCASE status values
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('DRAFT'),
  
  // Handle field to match backend
  handle: z.string()
    .regex(/^[a-z0-9-]+$/, 'Handle can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  
  // Publishing fields to match backend
  published: z.boolean().default(false),
  publishDate: z.string().optional(), // Will be converted to Date on backend
  
  // Gift card fields to match backend
  giftCard: z.boolean().default(false),
  giftCardTemplateSuffix: z.string().optional(),
  
  // Collections to match backend
  collectionsToJoin: z.array(z.string()).default([]),
  
  // SEO fields to match backend seoSchema
  seo: z.object({
    title: z.string().max(60, 'SEO title should be under 60 characters').optional(),
    description: z.string().max(160, 'SEO description should be under 160 characters').optional()
  }).optional(),

  // Dashboard specific fields
  category: z.string().max(255, 'Category must be less than 255 characters').optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  
  // Options for variants - matches backend exactly
  options: z.array(optionSchema).default([])
});

// Product variant schema - matches backend productVariantSchema exactly
export const variantSchema = z.object({
  price: z.number().min(0, 'Price must be positive'),
  compareAtPrice: z.number().min(0, 'Compare at price must be positive').optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  weight: z.number().min(0).optional(),
  weightUnit: z.enum(['kg', 'g', 'lb', 'oz']).default('g'), // Backend default is 'g'
  inventoryQuantity: z.number().min(0).default(0),
  inventoryPolicy: z.enum(['deny', 'continue']).default('deny'),
  inventoryManagement: z.string().default('shopify'),
  requiresShipping: z.boolean().default(true),
  taxable: z.boolean().default(true),
  taxCode: z.string().optional(),
  position: z.number().optional(),
  
  // CRITICAL: Backend expects optionValues with optionName + name structure
  optionValues: z.array(z.object({
    optionName: z.string(), // Must match option.name from product.options
    name: z.string()        // Must match optionValue.name from option.optionValues
  })).default([])
}).refine((val) => {
  // If compareAtPrice is provided, it must be greater than price
  if (val.compareAtPrice === undefined || val.compareAtPrice === null) return true;
  return val.compareAtPrice > val.price;
}, {
  message: 'Compare at price must be greater than price',
  path: ['compareAtPrice']
});

// Media upload schema - matches backend mediaSchema exactly
export const mediaSchema = z.object({
  alt: z.string().max(255, 'Alt text must be less than 255 characters').optional(),
  position: z.number().optional(),
  src: z.string().url().optional(), // Backend uses 'src', not 'url'
  mediaContentType: z.enum(['IMAGE', 'VIDEO', 'EXTERNAL_VIDEO', 'MODEL_3D']).default('IMAGE'),
  
  // Frontend-only fields for file handling
  file: z.instanceof(File).optional(),
  preview: z.string().optional(), // For preview display
  isUploading: z.boolean().default(false)
});

// Store mapping schema - NO STORE IDS in main product (handled by ProductMap model)
export const storeMappingSchema = z.object({
  // Note: storeIds are NOT stored in the main Product model
  // They will be handled separately in ProductMap during push phase
  syncToAll: z.boolean().default(false),
  selectedStoreIds: z.array(z.string()).default([]), // Temporary for UI, not sent to backend
  collections: z.record(z.string(), z.array(z.string())).default({}) // storeId -> collectionIds[]
});

// Complete product creation form schema - EXACTLY matches backend expectations
export const productFormSchema = z.object({
  // MAIN PRODUCT DATA - sent directly to backend createProduct
  title: z.string().min(1, 'Product title is required').max(255),
  descriptionHtml: z.string().max(65535).optional(),
  vendor: z.string().max(255).optional(),
  productType: z.string().max(255).optional(),
  tags: z.array(z.string()).default([]),
  handle: z.string().optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('DRAFT'),
  published: z.boolean().default(false),
  publishDate: z.string().optional(),
  collectionsToJoin: z.array(z.string()).default([]),
  giftCard: z.boolean().default(false),
  giftCardTemplateSuffix: z.string().optional(),
  
  // SEO data
  seo: z.object({
    title: z.string().max(60).optional(),
    description: z.string().max(160).optional()
  }).default({}),
  
  // Dashboard specific
  notes: z.string().max(1000).optional(),
  
  // Product structure
  options: z.array(optionSchema).default([]),
  variants: z.array(variantSchema).default([]),
  media: z.array(mediaSchema).default([]),
  
  // Single variant product fields (used when no options)
  price: z.number().min(0.01, 'Price must be greater than 0'), // Required and > 0
  sku: z.string().optional(),
  inventoryQuantity: z.number().min(0).default(0),
  compareAtPrice: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  weightUnit: z.enum(['kg', 'g', 'lb', 'oz']).default('g'),
  barcode: z.string().optional(),
  
  // Store sync settings (frontend only - not sent to product creation)
  storeMappings: storeMappingSchema.default({ syncToAll: false, selectedStoreIds: [] })
}).refine((data) => {
  // For single-variant flow (no options), if compareAtPrice provided, validate against base price
  if (data.options && data.options.length > 0) return true;
  if (data.compareAtPrice === undefined || data.compareAtPrice === null) return true;
  return data.compareAtPrice > (data.price ?? 0);
}, {
  message: 'Compare at price must be greater than price',
  path: ['compareAtPrice']
});

// Form step validation schemas - updated to match new structure
export const stepSchemas = {
  basicInfo: z.object({
    title: z.string().min(1, 'Product title is required').max(255),
    descriptionHtml: z.string().max(65535).optional(),
    vendor: z.string().max(255).optional(),
    productType: z.string().max(255).optional(),
    tags: z.array(z.string()).default([]),
    handle: z.string().optional(),
    status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('DRAFT'),
    published: z.boolean().default(false),
    publishDate: z.string().optional(),
    notes: z.string().max(1000).optional(),
    price: z.number().min(0.01, 'Price must be greater than 0'), // Required and > 0
    sku: z.string().optional(),
    inventoryQuantity: z.number().min(0).default(0),
    compareAtPrice: z.number().min(0).optional(),
    seo: z.object({
      title: z.string().max(60).optional(),
      description: z.string().max(160).optional()
    }).default({})
  }).refine((data) => {
    if (data.compareAtPrice === undefined || data.compareAtPrice === null) return true;
    return data.compareAtPrice > data.price;
  }, {
    message: 'Compare at price must be greater than price',
    path: ['compareAtPrice']
  }),
  
  options: z.object({
    options: z.array(optionSchema).default([])
  }),
  
  variants: z.object({
    variants: z.array(variantSchema).default([])
  }),
  
  media: z.object({
    media: z.array(mediaSchema).default([])
  })
};

// Default form values - updated to match backend expectations
export const defaultProductForm = {
  title: '',
  descriptionHtml: '',
  vendor: '',
  productType: '',
  tags: [],
  handle: '',
  status: 'ACTIVE',
  published: false,
  publishDate: '',
  collectionsToJoin: [],
  giftCard: false,
  giftCardTemplateSuffix: '',
  seo: {
    title: '',
    description: ''
  },
  notes: '',
  options: [],
  variants: [],
  media: [],
  
  // Single variant product fields (used when no options)
  price: undefined, // No default value
  sku: '',
  inventoryQuantity: undefined, // No default value
  compareAtPrice: undefined,
  weight: undefined,
  weightUnit: 'g',
  barcode: '',
  
  storeMappings: {
    syncToAll: false,
    selectedStoreIds: [],
    collections: {}
  }
};
