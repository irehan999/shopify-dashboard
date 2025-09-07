import React from 'react';
import { useParams } from 'react-router-dom';
import { useProduct } from '@/features/products/hooks/useProductApi.js';
import { NewStorePushPage } from '@/features/products/components/StorePushNew/NewStorePushPage.jsx';
import { LoadingScreen } from '@/components/common/LoadingScreen.jsx';
import { ErrorScreen } from '@/components/common/ErrorScreen.jsx';

/**
 * StorePushPageWrapper - New Implementation
 * Wrapper page for the completely rebuilt StorePush functionality
 */
const StorePushPageWrapper = () => {
  const { id } = useParams();
  const { data: product, isLoading, error } = useProduct(id);

  if (isLoading) {
    return <LoadingScreen message="Loading product details..." />;
  }

  if (error) {
    return (
      <ErrorScreen 
        title="Failed to load product"
        message={error.message || 'Something went wrong while loading the product details.'}
        actionLabel="Back to Products"
        onAction={() => window.history.back()}
      />
    );
  }

  if (!product) {
    return (
      <ErrorScreen 
        title="Product not found"
        message="The product you're looking for doesn't exist or has been removed."
        actionLabel="Back to Products"
        onAction={() => window.history.back()}
      />
    );
  }

  return <NewStorePushPage product={product} />;
};

export default StorePushPageWrapper;
