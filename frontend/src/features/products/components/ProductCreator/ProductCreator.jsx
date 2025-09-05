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
      
      // If no options, create single variant with product-level data
      if (!productData.options || productData.options.length === 0) {
        productData.variants = [{
          price: productData.price || 0,
          sku: productData.sku || '',
          inventoryQuantity: productData.inventoryQuantity || 0,
          optionValues: [],
          mediaIds: []
        }];
      }
      
      console.log('Final product data:', productData);
      
      // Create product in our database only
      const created = await createProduct.mutateAsync(productData);
      
      toast.success('Product created successfully!');
      
      if (onSuccess) {
        onSuccess(created);
      } else {
        // Navigate to product detail page (backend returns ApiResponse.data with _id)
        const newId = created?._id || created?.id;
        if (newId) {
          navigate(`/products/${newId}`);
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
