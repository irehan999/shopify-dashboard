import React, { useState } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { useGenerateVariants } from '../../hooks/useProductApi.js';

export const OptionsForm = ({ form }) => {
  const { control, watch, setValue, formState: { errors } } = form;
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  
  const { fields: optionFields, append: addOption, remove: removeOption } = useFieldArray({
    control,
    name: 'options'
  });

  const generateVariants = useGenerateVariants();
  const watchedOptions = watch('options') || [];

  const addNewOption = () => {
    if (optionFields.length >= 3) {
      alert('Maximum 3 options allowed per product');
      return;
    }
    
    addOption({
      name: '',
      position: optionFields.length + 1,
      optionValues: [{ name: '', position: 1 }]
    });
  };

  const removeOptionAtIndex = (index) => {
    removeOption(index);
    // Update positions for remaining options
    optionFields.forEach((_, i) => {
      if (i > index) {
        setValue(`options.${i}.position`, i);
      }
    });
  };

  const addOptionValue = (optionIndex) => {
    const currentValues = watchedOptions[optionIndex]?.optionValues || [];
    const newPosition = currentValues.length + 1;
    
    setValue(`options.${optionIndex}.optionValues`, [
      ...currentValues,
      { name: '', position: newPosition }
    ]);
  };

  const removeOptionValue = (optionIndex, valueIndex) => {
    const currentValues = watchedOptions[optionIndex]?.optionValues || [];
    const updatedValues = currentValues
      .filter((_, i) => i !== valueIndex)
      .map((value, i) => ({ ...value, position: i + 1 }));
    
    setValue(`options.${optionIndex}.optionValues`, updatedValues);
  };

  const handleGenerateVariants = async () => {
    const validOptions = watchedOptions.filter(option => 
      option.name && option.optionValues?.some(value => value.name)
    );

    if (validOptions.length === 0) {
      alert('Please add at least one option with values to generate variants');
      return;
    }

    setIsGeneratingVariants(true);
    try {
      const result = await generateVariants.mutateAsync({
        options: validOptions
      });

      // Update form with generated variants, using base price from product
      const basePrice = form.getValues('price') || 0;
      const variants = result.variants?.map(variant => ({
        ...variant,
        price: basePrice,
        inventoryQuantity: 0,
        variantIds: []
      })) || [];
      
      setValue('variants', variants);
      
    } catch (error) {
      console.error('Failed to generate variants:', error);
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  const getTotalVariantCombinations = () => {
    const validOptions = watchedOptions.filter(option => 
      option.name && option.optionValues?.some(value => value.name)
    );
    
    if (validOptions.length === 0) return 0;
    
    return validOptions.reduce((total, option) => {
      const validValues = option.optionValues?.filter(value => value.name) || [];
      return total * Math.max(validValues.length, 1);
    }, 1);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Product Options & Variants
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Add product options like Color, Size, Material to create variants. Maximum 3 options allowed.
        </p>
      </div>

      {/* Options Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900">
            Product Options ({optionFields.length}/3)
          </h3>
          <button
            type="button"
            onClick={addNewOption}
            disabled={optionFields.length >= 3}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${
              optionFields.length >= 3
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Option
          </button>
        </div>

        {optionFields.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No options created</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add options like Color, Size, or Material to create product variants
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={addNewOption}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Option
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {optionFields.map((field, optionIndex) => (
              <div key={field.id} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    Option {optionIndex + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeOptionAtIndex(optionIndex)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Option Name */}
                <div className="mb-4">
                  <Controller
                    name={`options.${optionIndex}.name`}
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Option Name
                        </label>
                        <input
                          {...field}
                          type="text"
                          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                            errors.options?.[optionIndex]?.name ? 'border-red-300' : ''
                          }`}
                          placeholder="e.g., Color, Size, Material"
                        />
                        {errors.options?.[optionIndex]?.name && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.options[optionIndex].name.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Option Values */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Option Values
                    </label>
                    <button
                      type="button"
                      onClick={() => addOptionValue(optionIndex)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Value
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(watchedOptions[optionIndex]?.optionValues || []).map((value, valueIndex) => (
                      <div key={valueIndex} className="flex items-center space-x-2">
                        <Controller
                          name={`options.${optionIndex}.optionValues.${valueIndex}.name`}
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder={`Value ${valueIndex + 1}`}
                            />
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => removeOptionValue(optionIndex, valueIndex)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {(!watchedOptions[optionIndex]?.optionValues?.length || 
                    watchedOptions[optionIndex].optionValues.length === 0) && (
                    <div className="text-center py-4 bg-white rounded border-2 border-dashed border-gray-300">
                      <p className="text-sm text-gray-500">No values added yet</p>
                      <button
                        type="button"
                        onClick={() => addOptionValue(optionIndex)}
                        className="mt-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Add first value
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variant Generation */}
      {optionFields.length > 0 && (
        <div className="border-t pt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  Generate Variants
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  {getTotalVariantCombinations() > 0 
                    ? `This will create ${getTotalVariantCombinations()} variant${getTotalVariantCombinations() > 1 ? 's' : ''} based on your options`
                    : 'Add option values to see variant preview'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateVariants}
                disabled={getTotalVariantCombinations() === 0 || isGeneratingVariants}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                  getTotalVariantCombinations() === 0 || isGeneratingVariants
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isGeneratingVariants ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate Variants'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
