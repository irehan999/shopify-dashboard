import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useProduct } from '@/features/products/hooks/useProductApi';
import { StorePushPage } from './StorePushPage';
import { Card } from '@/components/ui/Card';

export const StorePushPageWrapper = () => {
  const { id } = useParams();
  const { data: product, isLoading, error } = useProduct(id);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </Card>
      </div>
    );
  }

  if (error || !product) {
    return <Navigate to="/products" replace />;
  }

  return <StorePushPage product={product} />;
};
