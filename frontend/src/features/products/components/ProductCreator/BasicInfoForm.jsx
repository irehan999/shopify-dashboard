import React from 'react';
import { Controller } from 'react-hook-form';

export const BasicInfoForm = ({ form }) => {
  const { control, formState: { errors } } = form;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Basic Product Information
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter the basic details for your product
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Title */}
        <div className="md:col-span-2">
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Title *
                </label>
                <input
                  {...field}
                  type="text"
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.title ? 'border-red-300' : ''
                  }`}
                  placeholder="Enter product title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
            )}
          />
        </div>

        {/* Description - CRITICAL: Using descriptionHtml to match backend */}
        <div className="md:col-span-2">
          <Controller
            name="descriptionHtml"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Description
                </label>
                <textarea
                  {...field}
                  rows={4}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.descriptionHtml ? 'border-red-300' : ''
                  }`}
                  placeholder="Describe your product..."
                />
                {errors.descriptionHtml && (
                  <p className="mt-1 text-sm text-red-600">{errors.descriptionHtml.message}</p>
                )}
              </div>
            )}
          />
        </div>

        {/* Vendor */}
        <div>
          <Controller
            name="vendor"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor
                </label>
                <input
                  {...field}
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Apple, Nike"
                />
              </div>
            )}
          />
        </div>

        {/* Product Type */}
        <div>
          <Controller
            name="productType"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type
                </label>
                <input
                  {...field}
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Electronics, Clothing"
                />
              </div>
            )}
          />
        </div>

        {/* Category - Dashboard specific field */}
        <div>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  {...field}
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Internal category"
                />
              </div>
            )}
          />
        </div>

        {/* Status - Using backend UPPERCASE values */}
        <div>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  {...field}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            )}
          />
        </div>

        {/* Tags */}
        <div className="md:col-span-2">
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                  onChange={(e) => {
                    const tagsArray = e.target.value
                      .split(',')
                      .map(tag => tag.trim())
                      .filter(Boolean);
                    field.onChange(tagsArray);
                  }}
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter tags separated by commas (e.g., summer, sale, featured)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Separate tags with commas
                </p>
              </div>
            )}
          />
        </div>

        {/* Handle */}
        <div className="md:col-span-2">
          <Controller
            name="handle"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Handle
                </label>
                <input
                  {...field}
                  type="text"
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.handle ? 'border-red-300' : ''
                  }`}
                  placeholder="Leave blank to auto-generate from title"
                />
                {errors.handle && (
                  <p className="mt-1 text-sm text-red-600">{errors.handle.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Must contain only lowercase letters, numbers, and hyphens
                </p>
              </div>
            )}
          />
        </div>

        {/* Notes - Dashboard specific */}
        <div className="md:col-span-2">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes
                </label>
                <textarea
                  {...field}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Internal notes for your team..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  These notes are only visible in your dashboard
                </p>
              </div>
            )}
          />
        </div>
      </div>

      {/* SEO Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Search Engine Optimization
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SEO Title */}
          <div className="md:col-span-2">
            <Controller
              name="seo.title"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <input
                    {...field}
                    type="text"
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.seo?.title ? 'border-red-300' : ''
                    }`}
                    placeholder="Title for search engines"
                  />
                  {errors.seo?.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.seo.title.message}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Recommended: Under 60 characters
                  </p>
                </div>
              )}
            />
          </div>

          {/* SEO Description */}
          <div className="md:col-span-2">
            <Controller
              name="seo.description"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    {...field}
                    rows={3}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.seo?.description ? 'border-red-300' : ''
                    }`}
                    placeholder="Description for search engines"
                  />
                  {errors.seo?.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.seo.description.message}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Recommended: Under 160 characters
                  </p>
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* Publishing Settings */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Publishing Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Published */}
          <div>
            <Controller
              name="published"
              control={control}
              render={({ field }) => (
                <div className="flex items-center">
                  <input
                    {...field}
                    type="checkbox"
                    checked={field.value}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Publish immediately
                  </label>
                </div>
              )}
            />
          </div>

          {/* Publish Date */}
          <div>
            <Controller
              name="publishDate"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date
                  </label>
                  <input
                    {...field}
                    type="datetime-local"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              )}
            />
          </div>

          {/* Gift Card */}
          <div>
            <Controller
              name="giftCard"
              control={control}
              render={({ field }) => (
                <div className="flex items-center">
                  <input
                    {...field}
                    type="checkbox"
                    checked={field.value}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    This is a gift card
                  </label>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
