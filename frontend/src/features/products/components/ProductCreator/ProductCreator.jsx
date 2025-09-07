import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductForm } from '../../hooks/useProductForm.js';
import { useCreateProduct } from '../../hooks/useProductApi.js';
import { StepIndicator } from './StepIndicator.jsx';
import { BasicInfoForm } from './BasicInfoForm.jsx';
import { OptionsForm } from './OptionsForm.jsx';
import { VariantsForm } from './VariantsForm.jsx';
import { MediaForm } from './MediaForm.jsx';
import { ActionBar } from './ActionBar.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export const ProductCreator = ({ onSuccess, initialData }) => {
  const navigate = useNavigate();
  const {
    form,
    currentStep,
    completedSteps,
    nextStep,
    previousStep,
    isFormValid,
    validateStep,
    product
  } = useProductForm(initialData);

  const createProduct = useCreateProduct();

  const handleSubmit = async () => {
    console.log('Submitting form with data:', form.getValues());
    
    if (!isFormValid()) {
      toast.error('Please fix all form errors before submitting');
      return;
    }

    try {
      const formData = form.getValues();
      console.log('Form data before submission:', formData);
      
      // Remove store mappings - we only create product in database
      const { storeMappings, ...productData } = formData;
      
      // CRITICAL: Follow backend logic exactly
      // Case 1: Single variant product (no options)
      if (!productData.options || productData.options.length === 0) {
        // Ensure price is provided for single variant creation
        if (!productData.price || productData.price <= 0) {
          toast.error('Price is required for product creation');
          return;
        }
        
        // Send empty variants array - backend will create default variant from product-level price data
        productData.variants = [];
        
        // Backend expects these product-level fields for single variant:
        // price, sku, inventoryQuantity, compareAtPrice, weight, weightUnit, barcode
        // These are already in productData from BasicInfoForm
      } 
      // Case 2: Multi-variant product (has options)
      else {
        // Validate that variants were generated
        if (!productData.variants || productData.variants.length === 0) {
          toast.error('Please generate variants from your options or add at least one variant');
          return;
        }
        
        // Validate option values consistency
        const optionNames = productData.options.map(opt => opt.name);
        for (const variant of productData.variants) {
          if (variant.optionValues) {
            for (const optValue of variant.optionValues) {
              if (!optionNames.includes(optValue.optionName)) {
                toast.error(`Invalid option configuration. Please regenerate variants.`);
                return;
              }
            }
          }
        }
      }
      
      // Clean up empty/undefined fields to avoid backend issues
      Object.keys(productData).forEach(key => {
        if (productData[key] === '' || productData[key] === undefined) {
          delete productData[key];
        }
      });
      
      // Ensure required fields
      if (!productData.title?.trim()) {
        toast.error('Product title is required');
        return;
      }
      
      console.log('Final product data:', productData);
      
      // Create product in our database only
      const created = await createProduct.mutateAsync(productData);
      
      toast.success('Product created successfully!');
      
      if (onSuccess) {
        onSuccess(created);
      } else {
        // Navigate to product detail page (backend returns ApiResponse.data with _id)
        const newId = created?._id || created?.id || created?.data?._id || created?.data?.id;
        if (newId) {
          navigate(`/products/${newId}`);
        } else {
          console.error('No product ID returned from creation:', created);
          // Fallback to products list if no ID
          navigate('/products');
        }
      }
      
    } catch (error) {
      console.error('Product creation failed:', error);
      toast.error(error?.response?.data?.message || error.message || 'Failed to create product');
    }
  };

  const isStepValid = validateStep(currentStep);
  const isLoading = createProduct.isPending;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple header (non-sticky, compact) */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/products')}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="text-xs text-gray-500 dark:text-gray-400">Step {currentStep} of 4</div>
          </div>
        </div>
      </div>

      {/* Step indicator as inline row (not sticky) */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200 dark:border-gray-700">
        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} totalSteps={4} />
      </div>

      {/* Full-width form, compact spacing, sections separated by dividers */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
          {currentStep === 1 && <BasicInfoForm form={form} />}
          {currentStep === 2 && <OptionsForm form={form} />}
          {currentStep === 3 && <VariantsForm form={form} />}
          {currentStep === 4 && <MediaForm form={form} />}
        </form>

        <div className="mt-4">
          <ActionBar
            currentStep={currentStep}
            totalSteps={4}
            isStepValid={isStepValid}
            isLoading={isLoading}
            onPrevious={previousStep}
            onNext={nextStep}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};
