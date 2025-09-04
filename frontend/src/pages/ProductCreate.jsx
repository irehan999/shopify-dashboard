import React from 'react';
import { ProductCreator } from '@/features/products/components/ProductCreator';

/**
 * Product creation page component
 * Renders the full product creation workflow
 */
const ProductCreate = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Multi-Store Ready
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Create a new product and sync it across your connected Shopify stores with options and collections.
          </p>
        </div>
        
        <ProductCreator />
      </div>
    </div>
  );
};

export default ProductCreate;
