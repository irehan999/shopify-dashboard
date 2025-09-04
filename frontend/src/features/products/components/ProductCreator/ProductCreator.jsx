import React from 'react';
import { useProductForm } from '../../hooks/useProductForm.js';
import { useCreateProduct } from '../../hooks/useProductApi.js';
import { StepIndicator } from './StepIndicator.jsx';
import { BasicInfoForm } from './BasicInfoForm.jsx';
import { OptionsForm } from './OptionsForm.jsx';
import { VariantsForm } from './VariantsForm.jsx';
import { MediaForm } from './MediaForm.jsx';
import { ActionBar } from './ActionBar.jsx';
import { toast } from 'react-hot-toast';

export const ProductCreator = ({ onSuccess, initialData }) => {
  const {
    form,
    currentStep,
    completedSteps,
    nextStep,
    previousStep,
    isFormValid,
    validateStep
  } = useProductForm(initialData);

  const createProduct = useCreateProduct();

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.error('Please fix all form errors before submitting');
      return;
    }

    try {
      const formData = form.getValues();
      
      // Remove store mappings - we only create product in database
      const { storeMappings, ...productData } = formData;
      
      // Create product in our database only
      const newProduct = await createProduct.mutateAsync(productData);
      
      toast.success('Product created successfully! You can now push it to stores from the product catalog.');
      onSuccess?.(newProduct);
      
    } catch (error) {
      console.error('Product creation failed:', error);
      toast.error(error.message || 'Failed to create product');
    }
  };

  const isStepValid = validateStep(currentStep);
  const isLoading = createProduct.isPending;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create New Product
        </h1>
        <p className="text-gray-600">
          Create a product in your dashboard - you can push to stores later
        </p>
        
        <div className="mt-6">
          <StepIndicator 
            currentStep={currentStep} 
            completedSteps={completedSteps}
            totalSteps={4}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {currentStep === 1 && (
            <BasicInfoForm form={form} />
          )}
          
          {currentStep === 2 && (
            <OptionsForm form={form} />
          )}
          
          {currentStep === 3 && (
            <VariantsForm form={form} />
          )}
          
          {currentStep === 4 && (
            <MediaForm form={form} />
          )}
        </form>
      </div>

      {/* Action Bar */}
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
  );
};
