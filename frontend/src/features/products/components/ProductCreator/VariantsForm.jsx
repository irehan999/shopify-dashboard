import React, { useState } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { useCreateVariant, useUpdateVariant, useDeleteVariant } from '../../hooks/useProductApi.js';

export const VariantsForm = ({ form }) => {
  const { control, watch, setValue, formState: { errors } } = form;
  const [expandedVariants, setExpandedVariants] = useState(new Set());
  
  const { fields: variantFields, append: addVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants'
  });

  const watchedVariants = watch('variants') || [];
  const watchedOptions = watch('options') || [];
  const basePrice = watch('price') || 0;

  const toggleVariantExpansion = (variantIndex) => {
    const newExpanded = new Set(expandedVariants);
    if (newExpanded.has(variantIndex)) {
      newExpanded.delete(variantIndex);
    } else {
      newExpanded.add(variantIndex);
    }
    setExpandedVariants(newExpanded);
  };

  const addManualVariant = () => {
    const newVariant = {
      price: basePrice,
      compareAtPrice: undefined,
      sku: '',
      barcode: '',
      inventoryQuantity: 0,
      inventoryPolicy: 'deny',
      taxable: true,
      requiresShipping: true,
      weight: 0,
      weightUnit: 'g',
      optionValues: watchedOptions.map(option => ({
        optionName: option.name,
        name: ''
      })),
      position: variantFields.length + 1
    };
    
    addVariant(newVariant);
    setExpandedVariants(new Set([...expandedVariants, variantFields.length]));
  };

  const removeVariantAtIndex = (index) => {
    removeVariant(index);
    const newExpanded = new Set(expandedVariants);
    newExpanded.delete(index);
    // Update indices for expanded variants
    const updatedExpanded = new Set();
    newExpanded.forEach(idx => {
      if (idx > index) {
        updatedExpanded.add(idx - 1);
      } else if (idx < index) {
        updatedExpanded.add(idx);
      }
    });
    setExpandedVariants(updatedExpanded);
  };

  const bulkUpdatePrices = (adjustment) => {
    variantFields.forEach((_, index) => {
      const currentPrice = watchedVariants[index]?.price || basePrice;
      let newPrice = currentPrice;
      
      if (adjustment.type === 'percentage') {
        newPrice = currentPrice * (1 + adjustment.value / 100);
      } else if (adjustment.type === 'fixed') {
        newPrice = currentPrice + adjustment.value;
      }
      
      setValue(`variants.${index}.price`, Math.max(0, Number(newPrice.toFixed(2))));
    });
  };

  const getVariantTitle = (variant) => {
    if (!variant.selectedOptions || variant.selectedOptions.length === 0) {
      return 'Default Variant';
    }
    
    return variant.selectedOptions
      .filter(opt => opt.value)
      .map(opt => opt.value)
      .join(' / ') || 'Unnamed Variant';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Product Variants
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Manage product variants with different prices, SKUs, and inventory settings.
        </p>
      </div>

      {/* Variant Management Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900">
            Variants ({variantFields.length})
          </h3>
          <p className="text-sm text-gray-500">
            {variantFields.length === 0 
              ? 'No variants created yet'
              : `Manage pricing and inventory for each variant`
            }
          </p>
        </div>
        
        <div className="flex space-x-2">
          {variantFields.length > 0 && (
            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => {
                  const adjustment = prompt('Bulk price adjustment:\n• +10 (add $10)\n• -5 (subtract $5)\n• +10% (increase by 10%)\n• -5% (decrease by 5%)');
                  if (adjustment) {
                    const match = adjustment.match(/^([+-]?)(\d+(?:\.\d+)?)(%?)$/);
                    if (match) {
                      const [, sign, value, isPercentage] = match;
                      const numValue = parseFloat(value) * (sign === '-' ? -1 : 1);
                      bulkUpdatePrices({
                        type: isPercentage ? 'percentage' : 'fixed',
                        value: numValue
                      });
                    }
                  }
                }}
              >
                Bulk Update Prices
              </button>
            </div>
          )}
          
          <button
            type="button"
            onClick={addManualVariant}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Variant
          </button>
        </div>
      </div>

      {/* Variants List */}
      {variantFields.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No variants created</h3>
          <p className="mt-1 text-sm text-gray-500">
            {watchedOptions.length > 0 
              ? 'Generate variants from your options or add manually'
              : 'Add product options first, or create a manual variant'
            }
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={addManualVariant}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Variant
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {variantFields.map((field, variantIndex) => (
            <div key={field.id} className="bg-white border rounded-lg">
              {/* Variant Header */}
              <div 
                className="px-4 py-3 border-b cursor-pointer hover:bg-gray-50"
                onClick={() => toggleVariantExpansion(variantIndex)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg 
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        expandedVariants.has(variantIndex) ? 'rotate-90' : ''
                      }`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {getVariantTitle(watchedVariants[variantIndex])}
                      </h4>
                      <p className="text-sm text-gray-500">
                        ${watchedVariants[variantIndex]?.price || basePrice} • 
                        SKU: {watchedVariants[variantIndex]?.sku || 'Not set'} • 
                        Inventory: {watchedVariants[variantIndex]?.inventoryQuantity || 0}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVariantAtIndex(variantIndex);
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Variant Details */}
              {expandedVariants.has(variantIndex) && (
                <div className="p-4 space-y-4">
                  {/* Option Values */}
                  {watchedOptions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Option Values</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {watchedOptions.map((option, optionIndex) => (
                          <Controller
                            key={option.name || optionIndex}
                            name={`variants.${variantIndex}.selectedOptions.${optionIndex}.value`}
                            control={control}
                            render={({ field }) => (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  {option.name || `Option ${optionIndex + 1}`}
                                </label>
                                <select
                                  {...field}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                >
                                  <option value="">Select {option.name}</option>
                                  {(option.values || []).map((value, valueIndex) => (
                                    <option key={valueIndex} value={value.name}>
                                      {value.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Pricing</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Controller
                        name={`variants.${variantIndex}.price`}
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Price *
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                              </div>
                              <input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        )}
                      />

                      <Controller
                        name={`variants.${variantIndex}.compareAtPrice`}
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Compare At Price
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                              </div>
                              <input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  {/* SKU & Barcode */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Tracking</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Controller
                        name={`variants.${variantIndex}.sku`}
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              SKU
                            </label>
                            <input
                              {...field}
                              type="text"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Product SKU"
                            />
                          </div>
                        )}
                      />

                      <Controller
                        name={`variants.${variantIndex}.barcode`}
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Barcode
                            </label>
                            <input
                              {...field}
                              type="text"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Product barcode"
                            />
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  {/* Inventory */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Inventory</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Controller
                        name={`variants.${variantIndex}.inventoryQuantity`}
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Quantity
                            </label>
                            <input
                              {...field}
                              type="number"
                              min="0"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="0"
                            />
                          </div>
                        )}
                      />

                      <Controller
                        name={`variants.${variantIndex}.inventoryPolicy`}
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              When out of stock
                            </label>
                            <select
                              {...field}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="deny">Stop selling</option>
                              <option value="continue">Continue selling</option>
                            </select>
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  {/* Weight & Shipping */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Shipping</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Controller
                        name={`variants.${variantIndex}.weight`}
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Weight
                            </label>
                            <input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="0"
                            />
                          </div>
                        )}
                      />

                      <Controller
                        name={`variants.${variantIndex}.weightUnit`}
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Unit
                            </label>
                            <select
                              {...field}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="g">grams</option>
                              <option value="kg">kilograms</option>
                              <option value="oz">ounces</option>
                              <option value="lb">pounds</option>
                            </select>
                          </div>
                        )}
                      />

                      <div className="flex items-center space-x-4 pt-6">
                        <Controller
                          name={`variants.${variantIndex}.requiresShipping`}
                          control={control}
                          render={({ field }) => (
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Requires shipping</span>
                            </label>
                          )}
                        />

                        <Controller
                          name={`variants.${variantIndex}.taxable`}
                          control={control}
                          render={({ field }) => (
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Taxable</span>
                            </label>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
