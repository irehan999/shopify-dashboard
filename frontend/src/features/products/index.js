// Export all product-related components and hooks
export { ProductCreator } from './components/ProductCreator/ProductCreator.jsx';
export { StepIndicator } from './components/ProductCreator/StepIndicator.jsx';
export { BasicInfoForm } from './components/ProductCreator/BasicInfoForm.jsx';
export { ActionBar } from './components/ProductCreator/ActionBar.jsx';

// Export hooks
export { useProductForm } from './hooks/useProductForm.js';
export { 
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useGenerateVariants,
  useUploadMedia,
  useDeleteMedia,
  // Shopify sync hooks (re-exported from useShopifySync.js via useProductApi.js)
  useSyncToStore,
  useSyncToMultipleStores,
  useBulkSyncToStore,
  useDeleteFromStore,
  useStoreProduct,
  useStoreInventory,
  useSyncStatus,
  useProductSyncManagement
} from './hooks/useProductApi.js';

// Export API functions
export { productApi } from './api/productApi.js';
export { shopifySyncApi } from './api/shopifySyncApi.js';

// Export schemas
export { 
  productSchema,
  variantSchema,
  mediaSchema,
  storeMappingSchema,
  productFormSchema,
  stepSchemas,
  defaultProductForm
} from './schemas/productSchemas.js';
