import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { productApi } from '../api/productApi.js';
import { toast } from 'react-hot-toast';

/**
 * Core Product API Hooks
 * Only includes dashboard product CRUD operations
 * Sync and inventory operations are in separate hook files
 */

// Re-export specialized hooks for convenience
export * from './useShopifySync.js';
export * from './useInventoryApi.js';

// Product CRUD hooks
export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (id) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully!');
      return data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    }
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => productApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
      toast.success('Product updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
    }
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  });
};

// Option management hooks
export const useProductOptions = (productId) => {
  return useQuery({
    queryKey: ['products', productId, 'options'],
    queryFn: () => productApi.getOptions(productId),
    enabled: !!productId,
  });
};

export const useCreateOption = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, ...data }) => productApi.createOption(productId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'options'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Option added successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add option');
    }
  });
};

export const useUpdateOption = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, optionId, ...data }) => 
      productApi.updateOption(productId, optionId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'options'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Option updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update option');
    }
  });
};

export const useDeleteOption = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, optionId }) => 
      productApi.deleteOption(productId, optionId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'options'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Option deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete option');
    }
  });
};

// Variant management hooks
export const useProductVariants = (productId) => {
  return useQuery({
    queryKey: ['products', productId, 'variants'],
    queryFn: () => productApi.getVariants(productId),
    enabled: !!productId,
  });
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, ...data }) => productApi.createVariant(productId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'variants'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Variant created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create variant');
    }
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, variantId, ...data }) => 
      productApi.updateVariant(productId, variantId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'variants'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Variant updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update variant');
    }
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, variantId }) => 
      productApi.deleteVariant(productId, variantId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'variants'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Variant deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete variant');
    }
  });
};

// Variant generation hook
export const useGenerateVariants = () => {
  return useMutation({
    mutationFn: ({ options }) => {
      // Client-side variant generation from options
      const generateVariantCombinations = (options) => {
        if (!options || options.length === 0) {
          return [];
        }

        const combinations = [];
        
        const generateCombos = (optionIndex, currentCombo) => {
          if (optionIndex >= options.length) {
            combinations.push([...currentCombo]);
            return;
          }

          const option = options[optionIndex];
          const values = option.optionValues || [];
          
          for (const value of values) {
            if (value.name) {
              currentCombo.push({
                optionName: option.name,
                name: value.name
              });
              generateCombos(optionIndex + 1, currentCombo);
              currentCombo.pop();
            }
          }
        };

        generateCombos(0, []);
        
        return combinations.map((combo, index) => ({
          position: index + 1,
          optionValues: combo,
          price: 0,
          compareAtPrice: undefined,
          sku: '',
          barcode: '',
          inventoryQuantity: 0,
          inventoryPolicy: 'deny',
          taxable: true,
          requiresShipping: true,
          weight: 0,
          weightUnit: 'g'
        }));
      };

      return Promise.resolve({
        variants: generateVariantCombinations(options)
      });
    },
    onError: (error) => {
      toast.error('Failed to generate variants');
    }
  });
};

// Media management hooks
export const useProductMedia = (productId) => {
  return useQuery({
    queryKey: ['products', productId, 'media'],
    queryFn: () => productApi.getMedia(productId),
    enabled: !!productId,
  });
};

// Media upload hooks
export const useUploadMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, files, altTexts = [] }) => 
      productApi.uploadMedia(productId, files, altTexts),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'media'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Media uploaded successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload media');
    }
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, mediaId }) => 
      productApi.deleteMedia(productId, mediaId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'media'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Media deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete media');
    }
  });
};

export const useReorderMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, mediaOrder }) => 
      productApi.reorderMedia(productId, mediaOrder),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId, 'media'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['products', variables.productId] 
      });
      toast.success('Media reordered successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reorder media');
    }
  });
};

// Shopify Preview hook
export const useShopifyPreview = () => {
  return useMutation({
    mutationFn: ({ productId, storeId }) => 
      productApi.getShopifyPreview(productId, storeId),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate preview');
    }
  });
};
