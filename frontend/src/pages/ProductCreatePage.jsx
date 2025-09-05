import React from 'react';
import { ProductCreator } from '../features/products/components/ProductCreator/ProductCreator.jsx';

const ProductCreatePage = () => {
  const handleSuccess = (product) => {
    console.log('Product created successfully:', product);
    // Navigate to products list or product detail page
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductCreator onSuccess={handleSuccess} />
    </div>
  );
};

export default ProductCreatePage;