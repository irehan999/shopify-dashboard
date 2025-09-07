import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleProductDetail } from './SimpleProductDetail.jsx';
import { ConnectedProductDetail } from './ConnectedProductDetail.jsx';

/**
 * Product Detail Controller Component
 * Determines which ProductDetail component to render based on store connections
 * 
 * Logic:
 * - If product.isConnected === true && product.storeMappings.length > 0: Show ConnectedProductDetail
 * - Otherwise: Show SimpleProductDetail
 */
export const ProductDetailController = ({ product }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    const productId = product.id || product._id;
    navigate(`/products/${productId}/edit`);
  };

  const handlePushToStores = () => {
    const productId = product.id || product._id;
    navigate(`/products/${productId}/push`);
  };

  // Determine which component to render based on store connections
  const isConnectedToStores = product?.isConnected && product?.storeMappings?.length > 0;

  if (isConnectedToStores) {
    return (
      <ConnectedProductDetail
        product={product}
        onEdit={handleEdit}
        onPushToStores={handlePushToStores}
      />
    );
  }

  return (
    <SimpleProductDetail
      product={product}
      onEdit={handleEdit}
      onPushToStores={handlePushToStores}
    />
  );
};
