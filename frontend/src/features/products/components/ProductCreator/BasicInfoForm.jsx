import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Switch, Listbox } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { classNames } from '@/lib/utils.js';

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' }
];

export const BasicInfoForm = ({ form }) => {
  const { control, formState: { errors }, watch } = form;
  const [tagInput, setTagInput] = useState('');
  const published = watch('published');
  const giftCard = watch('giftCard');
  const status = watch('status');

  const handleTagInputChange = (e, field) => {
    const value = e.target.value;
    setTagInput(value);
    
    // Convert tags on comma or enter
    if (value.includes(',')) {
      const newTags = value.split(',').map(tag => tag.trim()).filter(Boolean);
      const currentTags = field.value || [];
      const updatedTags = [...new Set([...currentTags, ...newTags])];
      field.onChange(updatedTags);
      setTagInput('');
    }
  };

  const handleTagInputKeyDown = (e, field) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = tagInput.trim();
      if (value) {
        const currentTags = field.value || [];
        const updatedTags = [...new Set([...currentTags, value])];
        field.onChange(updatedTags);
        setTagInput('');
      }
    }
  };

  const removeTag = (indexToRemove, field) => {
    const currentTags = field.value || [];
    const updatedTags = currentTags.filter((_, index) => index !== indexToRemove);
    field.onChange(updatedTags);
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          Basic Product Information
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          Enter the essential details for your product
        </p>

        <div className="space-y-4">
          {/* Product Title */}
          <div>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...field}
                    type="text"
                    className={classNames(
                      "block w-full px-3 py-2 rounded-md border transition-all duration-200 text-sm",
                      "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                      "placeholder-gray-500 dark:placeholder-gray-400",
                      "focus:outline-none focus:ring-0",
                      "font-medium",
                      errors.title 
                        ? "border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400" 
                        : "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                    )}
                    placeholder="Enter a clear, descriptive product title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.title.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Description */}
          <div>
            <Controller
              name="descriptionHtml"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    Product Description
                  </label>
                  <textarea
                    {...field}
                    rows={4}
                    className={classNames(
                      "block w-full px-3 py-2 rounded-md border transition-all duration-200 text-sm",
                      "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                      "placeholder-gray-500 dark:placeholder-gray-400",
                      "focus:outline-none focus:ring-0 resize-none",
                      errors.descriptionHtml 
                        ? "border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400" 
                        : "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                    )}
                    placeholder="Describe your product features, benefits, and details..."
                  />
                  {errors.descriptionHtml && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.descriptionHtml.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Vendor and Product Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Controller
                name="vendor"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                      Vendor
                    </label>
                    <input
                      {...field}
                      type="text"
                      className={classNames(
                        "block w-full px-3 py-2 rounded-md border transition-all duration-200 text-sm",
                        "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                        "placeholder-gray-500 dark:placeholder-gray-400",
                        "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                        "focus:outline-none focus:ring-0"
                      )}
                      placeholder="e.g., Apple, Nike, Your Brand"
                    />
                  </div>
                )}
              />
            </div>

            <div>
              <Controller
                name="productType"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                      Product Type
                    </label>
                    <input
                      {...field}
                      type="text"
                      className={classNames(
                        "block w-full px-3 py-2 rounded-md border transition-all duration-200 text-sm",
                        "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                        "placeholder-gray-500 dark:placeholder-gray-400",
                        "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                        "focus:outline-none focus:ring-0"
                      )}
                      placeholder="e.g., Electronics, Clothing, Books"
                    />
                  </div>
                )}
              />
            </div>
          </div>

          {/* Status with Headless UI Dropdown */}
          <div>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    Status
                  </label>
                  <Listbox value={field.value} onChange={field.onChange}>
                    <div className="relative">
                      <Listbox.Button className={classNames(
                        "relative w-full cursor-default rounded-md py-2 pl-3 pr-8 text-left text-sm",
                        "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600",
                        "focus:outline-none focus:ring-0 focus:border-blue-500 dark:focus:border-blue-400",
                        "transition-all duration-200"
                      )}>
                        <span className="block truncate text-gray-900 dark:text-white">
                          {statusOptions.find(option => option.value === field.value)?.label || 'Select status'}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon
                            className="h-4 w-4 text-gray-400"
                            aria-hidden="true"
                          />
                        </span>
                      </Listbox.Button>

                      <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm">
                        {statusOptions.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            className={({ active }) =>
                              classNames(
                                active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white',
                                'relative cursor-default select-none py-1.5 pl-8 pr-3'
                              )
                            }
                            value={option.value}
                          >
                            {({ selected }) => (
                              <>
                                <span className={classNames(selected ? 'font-medium' : 'font-normal', 'block truncate')}>
                                  {option.label}
                                </span>
                                {selected ? (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-blue-600 dark:text-blue-400">
                                    <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>
              )}
            />
          </div>

          {/* Tags with Proper Input Handling */}
          <div>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    Tags
                  </label>
                  
                  {/* Tags Display */}
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {field.value.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(index, field)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 hover:bg-blue-300 dark:hover:bg-blue-700"
                          >
                            <span className="text-xs">×</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Tag Input */}
          <input
                    value={tagInput}
                    onChange={(e) => handleTagInputChange(e, field)}
                    onKeyDown={(e) => handleTagInputKeyDown(e, field)}
                    type="text"
                    className={classNames(
            "block w-full px-3 py-2 rounded-md border transition-all duration-200 text-sm",
                      "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                      "placeholder-gray-500 dark:placeholder-gray-400",
            "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                      "focus:outline-none focus:ring-0"
                    )}
                    placeholder="Type tags and press Enter or comma to add (e.g., summer, sale, featured)"
                  />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Press Enter or comma to add tags for better organization and discoverability
                  </p>
                </div>
              )}
            />
          </div>

          {/* Internal Notes */}
          <div>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    {...field}
                    rows={4}
                    className={classNames(
                      "block w-full px-3 py-2 rounded-md border transition-all duration-200 text-sm",
                      "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                      "placeholder-gray-500 dark:placeholder-gray-400",
                      "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                      "focus:outline-none focus:ring-0 resize-none"
                    )}
                    placeholder="Add internal notes about this product for your team..."
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    These notes are only visible in your dashboard and won't appear in stores
                  </p>
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* Pricing & Inventory Section (for single variant products) */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Pricing & Inventory
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          Basic pricing and inventory for this product. If you add product options later, you can set specific prices for each variant.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                    <input
                      {...field}
                      value={field.value ?? ''}
                      type="number"
                      step="0.01"
                      min="0"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || v === undefined || v === null) {
                          field.onChange('');
                        } else {
                          const num = Number(v);
                          field.onChange(Number.isFinite(num) ? num : '');
                        }
                      }}
                      onFocus={(e) => {
                        // Select all text when focusing for easy editing
                        e.target.select();
                      }}
                      onKeyDown={(e) => {
                        // Allow backspace, delete, arrow keys, etc.
                        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                          return;
                        }
                        // Allow numbers, decimal point, and minus sign
                        if (!/[\d.-]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                        }
                      }}
                      className={classNames(
                        "block w-full pl-7 pr-3 py-2 rounded-md border transition-colors duration-200 text-sm",
                        "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                        "placeholder-gray-500 dark:placeholder-gray-400",
                        "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                        "focus:outline-none focus:ring-0"
                      )}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            />
          </div>

          <div>
            <Controller
              name="compareAtPrice"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    Compare at Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                    <input
                      {...field}
                      value={field.value ?? ''}
                      type="number"
                      step="0.01"
                      min="0"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || v === undefined || v === null) {
                          field.onChange('');
                        } else {
                          const num = Number(v);
                          field.onChange(Number.isFinite(num) ? num : '');
                        }
                      }}
                      onFocus={(e) => {
                        // Select all text when focusing for easy editing
                        e.target.select();
                      }}
                      onKeyDown={(e) => {
                        // Allow backspace, delete, arrow keys, etc.
                        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                          return;
                        }
                        // Allow numbers, decimal point, and minus sign
                        if (!/[\d.-]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                        }
                      }}
                      className={classNames(
                        "block w-full pl-7 pr-3 py-2 rounded-md border transition-colors duration-200 text-sm",
                        "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                        "placeholder-gray-500 dark:placeholder-gray-400",
                        "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                        "focus:outline-none focus:ring-0"
                      )}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            />
          </div>

          <div>
            <Controller
              name="inventoryQuantity"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    Inventory Quantity
                  </label>
                  <input
                    {...field}
                    value={field.value ?? ''}
                    type="number"
                    min="0"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || v === undefined || v === null) {
                          field.onChange('');
                        } else {
                          const num = parseInt(v, 10);
                          field.onChange(Number.isFinite(num) ? num : '');
                        }
                      }}
                      onFocus={(e) => {
                        // Select all text when focusing for easy editing
                        e.target.select();
                      }}
                      onKeyDown={(e) => {
                        // Allow backspace, delete, arrow keys, etc.
                        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                          return;
                        }
                        // Allow only numbers
                        if (!/[\d]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                        }
                      }}
                    className={classNames(
                      "block w-full px-3 py-2 rounded-md border transition-colors duration-200 text-sm",
                      "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                      "placeholder-gray-500 dark:placeholder-gray-400",
                      "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                      "focus:outline-none focus:ring-0"
                    )}
                    placeholder="0"
                  />
                </div>
              )}
            />
          </div>

          <div>
            <Controller
              name="sku"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    SKU
                  </label>
                  <input
                    {...field}
                    type="text"
                    className={classNames(
                      "block w-full px-3 py-2 rounded-md border transition-colors duration-200 text-sm",
                      "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                      "placeholder-gray-500 dark:placeholder-gray-400",
                      "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                      "focus:outline-none focus:ring-0"
                    )}
                    placeholder="Stock Keeping Unit"
                  />
                </div>
              )}
            />
          </div>

          <div>
            <Controller
              name="barcode"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    Barcode
                  </label>
                  <input
                    {...field}
                    type="text"
                    className={classNames(
                      "block w-full px-3 py-2 rounded-md border transition-colors duration-200 text-sm",
                      "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                      "placeholder-gray-500 dark:placeholder-gray-400",
                      "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                      "focus:outline-none focus:ring-0"
                    )}
                    placeholder="UPC, EAN, or ISBN"
                  />
                </div>
              )}
            />
          </div>

          <div>
            <Controller
              name="weight"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    Weight
                  </label>
                  <div className="flex space-x-2">
                    <input
                      {...field}
                      value={field.value ?? ''}
                      type="number"
                      step="0.01"
                      min="0"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || v === undefined || v === null) {
                          field.onChange('');
                        } else {
                          const num = Number(v);
                          field.onChange(Number.isFinite(num) ? num : '');
                        }
                      }}
                      onFocus={(e) => {
                        // Select all text when focusing for easy editing
                        e.target.select();
                      }}
                      onKeyDown={(e) => {
                        // Allow backspace, delete, arrow keys, etc.
                        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                          return;
                        }
                        // Allow numbers, decimal point, and minus sign
                        if (!/[\d.-]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                        }
                      }}
                      className={classNames(
                        "block flex-1 px-3 py-2 rounded-md border transition-colors duration-200 text-sm",
                        "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                        "placeholder-gray-500 dark:placeholder-gray-400",
                        "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                        "focus:outline-none focus:ring-0"
                      )}
                      placeholder="0.0"
                    />
                    <Controller
                      name="weightUnit"
                      control={control}
                      render={({ field: unitField }) => (
                        <select
                          {...unitField}
                          className={classNames(
                            "px-3 py-2 rounded-md border transition-colors duration-200 text-sm",
                            "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                            "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                            "focus:outline-none focus:ring-0"
                          )}
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="oz">oz</option>
                          <option value="lb">lb</option>
                        </select>
                      )}
                    />
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* SEO Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Search Engine Optimization
        </h3>
        <div className="space-y-4">
          <div>
            <Controller
              name="seo.title"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    SEO Title
                  </label>
                  <input
                    {...field}
                    type="text"
                    className={classNames(
                      "block w-full px-3 py-2 rounded-md border transition-colors duration-200 text-sm",
                      "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                      "placeholder-gray-500 dark:placeholder-gray-400",
                      "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                      "focus:outline-none focus:ring-0"
                    )}
                    placeholder="Optimized title for search engines"
                    maxLength={60}
                  />
                </div>
              )}
            />
          </div>

          <div>
            <Controller
              name="seo.description"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    SEO Description
                  </label>
                  <textarea
                    {...field}
                    rows={3}
                    className={classNames(
                      "block w-full px-3 py-2 rounded-md border transition-colors duration-200 text-sm",
                      "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                      "placeholder-gray-500 dark:placeholder-gray-400",
                      "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                      "focus:outline-none focus:ring-0"
                    )}
                    placeholder="Brief description for search engine results"
                    maxLength={160}
                  />
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* Publishing Settings */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Publishing Settings
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Controller
                name="published"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-900 dark:text-white">
                        Publish Status
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Control visibility when syncing to stores
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                      className={classNames(
                        published ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={classNames(
                          published ? 'translate-x-5' : 'translate-x-0',
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                        )}
                      />
                    </Switch>
                  </div>
                )}
              />
            </div>

            <div>
              <Controller
                name="giftCard"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-gray-900 dark:text-white">
                        Gift Card Product
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mark as gift card if applicable
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                      className={classNames(
                        giftCard ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700',
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={classNames(
                          giftCard ? 'translate-x-5' : 'translate-x-0',
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                        )}
                      />
                    </Switch>
                  </div>
                )}
              />
            </div>
          </div>

          <div>
            <Controller
              name="publishDate"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                    Publish Date
                  </label>
                  <input
                    {...field}
                    type="date"
                    className={classNames(
                      "block w-full px-3 py-2 rounded-md border transition-colors duration-200 text-sm",
                      "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                      "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
                      "focus:outline-none focus:ring-0"
                    )}
                  />
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
