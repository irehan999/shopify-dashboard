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
  const watchedTitle = form.watch('title');
  const watchedVariants = form.watch('variants');
  const watchedOptions = form.watch('options');

  // Generate URL handle from title
  const generateHandle = useCallback((title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }, []);

  // Auto-generate handle when title changes
  useEffect(() => {
    const title = watchedTitle;
    if (title && !form.getValues('handle')) {
      form.setValue('handle', generateHandle(title));
    }
  }, [watchedTitle, form, generateHandle]);

  // Generate variants from options
  const handleGenerateVariants = useCallback(async () => {
    const options = form.getValues('options');
    
    if (!options || options.length === 0) {
      form.setValue('variants', [{
        price: form.getValues('price') || 0,
        optionValues: [],
        inventoryQuantity: 0
      }]);
      return;
    }

    try {
      const result = await generateVariants.mutateAsync(options);
      const variants = result.variants.map(variant => ({
        ...variant,
        price: form.getValues('price') || 0,
        inventoryQuantity: 0,
        mediaIds: []
      }));
      
      form.setValue('variants', variants);
    } catch (error) {
      console.error('Failed to generate variants:', error);
    }
  }, [form, generateVariants]);

  // Auto-generate variants when options change
  useEffect(() => {
    if (watchedOptions && watchedOptions.length > 0) {
      const hasCompleteOptions = watchedOptions.every(option => 
        option.name && option.optionValues && option.optionValues.length > 0
      );
      
      if (hasCompleteOptions) {
        handleGenerateVariants();
      }
    }
  }, [watchedOptions, handleGenerateVariants]);

  // Step validation
  const validateStep = useCallback((step) => {
    const stepData = getStepData(step);
    const schema = stepSchemas[getStepKey(step)];
    
    if (!schema) return true;
    
    try {
      schema.parse(stepData);
      return true;
    } catch (error) {
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
          category: formData.category,
          notes: formData.notes
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
    generateHandle,
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
