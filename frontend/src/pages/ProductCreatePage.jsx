import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCreator } from '../features/products/components/ProductCreator/ProductCreator.jsx';

const ProductCreatePage = () => {
  const navigate = useNavigate();

  const handleSuccess = (product) => {
    const id = product?._id || product?.id || product?.data?._id || product?.data?.id;
    if (id) {
      navigate(`/products/${id}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductCreator onSuccess={handleSuccess} />
    </div>
  );
};

export default ProductCreatePage;