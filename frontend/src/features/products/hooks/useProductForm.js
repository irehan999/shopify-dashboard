import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback, useEffect } from 'react';
import { productFormSchema, defaultProductForm, stepSchemas } from '../schemas/productSchemas.js';
import { useGenerateVariants } from './useProductApi.js';

export const useProductForm = (initialData = {}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  
  const form = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: { ...defaultProductForm, ...initialData },
    mode: 'onChange'
  });

  const generateVariants = useGenerateVariants();

  // Watch form changes
  const watchedVariants = form.watch('variants');
  const watchedOptions = form.watch('options');
  const watchedProduct = form.watch(); // Watch entire form for product data

  // Note: We no longer auto-generate a handle on the client.
  // Shopify will manage the final handle during push. Users can set it manually if needed.

  // Generate variants from options
  const handleGenerateVariants = useCallback(async () => {
    const options = form.getValues('options');
    const basicInfo = form.getValues();
    
    if (!options || options.length === 0) {
      // Single variant product - use values from Basic Info
      form.setValue('variants', [{
        price: basicInfo.price || 0,
        compareAtPrice: basicInfo.compareAtPrice,
        sku: basicInfo.sku || '',
        barcode: basicInfo.barcode || '',
        inventoryQuantity: basicInfo.inventoryQuantity || 0,
        inventoryPolicy: 'deny',
        inventoryManagement: 'not_managed',
        taxable: true,
        requiresShipping: true,
        weight: basicInfo.weight || 0,
        weightUnit: basicInfo.weightUnit || 'g',
        optionValues: [],
        position: 1
      }]);
      return;
    }

    try {
      const result = await generateVariants.mutateAsync({ options });
      const variants = result.variants.map((variant, index) => ({
        ...variant,
        price: basicInfo.price || 0, // Use basic info price as default
        compareAtPrice: basicInfo.compareAtPrice,
        sku: basicInfo.sku ? `${basicInfo.sku}-${index + 1}` : '', // Generate SKU variants
        barcode: basicInfo.barcode || '',
        inventoryQuantity: basicInfo.inventoryQuantity || 0,
        inventoryPolicy: 'deny',
        inventoryManagement: 'not_managed',
        taxable: true,
        requiresShipping: true,
        weight: basicInfo.weight || 0,
        weightUnit: basicInfo.weightUnit || 'g',
        mediaIds: [],
        position: index + 1
      }));
      
      form.setValue('variants', variants);
    } catch (error) {
      console.error('Failed to generate variants:', error);
    }
  }, [form, generateVariants]);

  // Auto-generate single variant when moving to variants step if no options
  useEffect(() => {
    if (currentStep === 3) { // Variants step
      const options = form.getValues('options');
      const variants = form.getValues('variants');
      
      // If no options and no variants, create single variant from basic info
      if ((!options || options.length === 0) && (!variants || variants.length === 0)) {
        const basicInfo = form.getValues();
        form.setValue('variants', [{
          price: basicInfo.price || 0,
          compareAtPrice: basicInfo.compareAtPrice,
          sku: basicInfo.sku || '',
          barcode: basicInfo.barcode || '',
          inventoryQuantity: basicInfo.inventoryQuantity || 0,
          inventoryPolicy: 'deny',
          inventoryManagement: 'not_managed',
          taxable: true,
          requiresShipping: true,
          weight: basicInfo.weight || 0,
          weightUnit: basicInfo.weightUnit || 'g',
          optionValues: [],
          position: 1
        }]);
      }
    }
  }, [currentStep, form]);

  // Step validation
  const validateStep = useCallback((step) => {
    const stepData = getStepData(step);
    const schema = stepSchemas[getStepKey(step)];
    
    if (!schema) return true;
    
    // Special case for step 3 (variants): If no options are defined, variants step is always valid
    // because we're creating a single variant product
    if (step === 3) {
      const formData = form.getValues();
      const hasOptions = formData.options && formData.options.length > 0;
      
      // If no options, step 3 is automatically valid (single variant product)
      if (!hasOptions) {
        return true;
      }
      
      // If has options, variants should be generated/present
      const hasVariants = formData.variants && formData.variants.length > 0;
      return hasVariants;
    }
    
    try {
      schema.parse(stepData);
      return true;
    } catch (error) {
      // Keep silent during render-time checks; show field-level errors in UI instead
      return false;
    }
  }, [form]);

  // Get data for specific step
  const getStepData = useCallback((step) => {
    const formData = form.getValues();
    
    switch (step) {
      case 1:
        return {
          title: formData.title,
          descriptionHtml: formData.descriptionHtml,
          vendor: formData.vendor,
          productType: formData.productType,
          tags: formData.tags,
          seo: formData.seo,
          handle: formData.handle,
          status: formData.status,
          notes: formData.notes,
          price: formData.price || 0,
          sku: formData.sku,
          inventoryQuantity: formData.inventoryQuantity || 0
        };
      case 2:
        return {
          options: formData.options
        };
      case 3:
        return {
          variants: formData.variants
        };
      case 4:
        return {
          media: formData.media
        };
      default:
        return {};
    }
  }, [form]);

  const getStepKey = (step) => {
    const keys = ['basicInfo', 'options', 'variants', 'media'];
    return keys[step - 1];
  };

  // Navigation methods
  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    const isValid = validateStep(currentStep);
    if (isValid && currentStep < 4) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    }
    return isValid;
  }, [currentStep, validateStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Form submission
  const isFormValid = useCallback(() => {
    try {
      productFormSchema.parse(form.getValues());
      return true;
    } catch (error) {
      return false;
    }
  }, [form]);

  // Helper methods
  const addOption = useCallback(() => {
    const currentOptions = form.getValues('options') || [];
    form.setValue('options', [
      ...currentOptions,
      {
        name: '',
        optionValues: [{ name: '' }]
      }
    ]);
  }, [form]);

  const removeOption = useCallback((index) => {
    const currentOptions = form.getValues('options') || [];
    const newOptions = currentOptions.filter((_, i) => i !== index);
    form.setValue('options', newOptions);

    // Cascade: prune corresponding optionValues from each variant
    const currentVariants = form.getValues('variants') || [];
    if (currentVariants.length) {
      const prunedVariants = currentVariants.map(v => {
        const ov = Array.isArray(v.optionValues) ? v.optionValues : [];
        const newOv = ov.filter((_, i) => i !== index);
        return { ...v, optionValues: newOv };
      });
      form.setValue('variants', prunedVariants);
    }
  }, [form]);

  const addOptionValue = useCallback((optionIndex) => {
    const currentOptions = form.getValues('options') || [];
    const newOptions = [...currentOptions];
    newOptions[optionIndex].optionValues.push({ name: '' });
    form.setValue('options', newOptions);
  }, [form]);

  const removeOptionValue = useCallback((optionIndex, valueIndex) => {
    const currentOptions = form.getValues('options') || [];
    const newOptions = [...currentOptions];
    newOptions[optionIndex].optionValues = newOptions[optionIndex].optionValues.filter((_, i) => i !== valueIndex);
    form.setValue('options', newOptions);
  }, [form]);

  const updateVariantPrice = useCallback((variantIndex, price) => {
    form.setValue(`variants.${variantIndex}.price`, price);
  }, [form]);

  const updateVariantSku = useCallback((variantIndex, sku) => {
    form.setValue(`variants.${variantIndex}.sku`, sku);
  }, [form]);

  const updateVariantInventory = useCallback((variantIndex, quantity) => {
    form.setValue(`variants.${variantIndex}.inventoryQuantity`, quantity);
  }, [form]);

  return {
    // Form instance
    form,
    
    // Step management
    currentStep,
    completedSteps,
    goToStep,
    nextStep,
    previousStep,
    validateStep,
    isFormValid,
    
    // Watched values
    product: watchedProduct,
    variants: watchedVariants,
    options: watchedOptions,
    
    // Helper methods
    handleGenerateVariants,
    addOption,
    removeOption,
    addOptionValue,
    removeOptionValue,
    updateVariantPrice,
    updateVariantSku,
    updateVariantInventory,
    
    // Loading states
    isGeneratingVariants: generateVariants.isPending
  };
};
