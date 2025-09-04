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
  useSyncToStores,
  useSyncStatus,
  useRetrySync,
  useConnectedStores,
  useStoreDetails
} from './hooks/useProductApi.js';

// Export API functions
export { productApi, syncApi, storeApi } from './api/productApi.js';

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
