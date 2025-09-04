import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useSyncToMultipleStores,
  useStoreSelection,
  useCollectionSelection
} from '../../hooks/useProductApi.js';
import { StoreSelector } from './StoreSelector.jsx';
import { CollectionSelector } from './CollectionSelector.jsx';
import { PushProgress } from './PushProgress.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export const StorePushPage = ({ product }) => {
  const navigate = useNavigate();
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState({});
  const [syncProgress, setSyncProgress] = useState(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  const { stores, isLoading: storesLoading } = useStoreSelection();
  const syncToMultipleStores = useSyncToMultipleStores();

  const handlePushToStores = async () => {
    if (selectedStores.length === 0) {
      toast.error('Please select at least one store');
      return;
    }

    try {
      setSyncProgress({
        total: selectedStores.length,
        completed: 0,
        current: null,
        status: 'syncing'
      });

      // Use syncToMultipleStores with correct data format
      const results = await syncToMultipleStores.mutateAsync({
        productId: product.id,
        storeIds: selectedStores
      });

      setSyncProgress(prev => ({
        ...prev,
        status: 'completed'
      }));

      toast.success(`Product pushed to ${selectedStores.length} stores successfully!`);
      
      // Redirect back to product detail after success
      setTimeout(() => {
        navigate(`/products/${product.id}`);
      }, 2000);

    } catch (error) {
      setSyncProgress(prev => ({
        ...prev,
        status: 'error',
        error: error.message
      }));
      toast.error(error.message || 'Failed to push product to stores');
    }
  };

  const handlePushToAllStores = async () => {
    try {
      setSyncProgress({
        total: stores.length,
        completed: 0,
        current: null,
        status: 'syncing'
      });

      // Get all store IDs
      const allStoreIds = stores.map(store => store.id);
      
      // Use syncToMultipleStores with all store IDs
      const results = await syncToMultipleStores.mutateAsync({
        productId: product.id,
        storeIds: allStoreIds
      });

      setSyncProgress(prev => ({
        ...prev,
        status: 'completed'
      }));

      toast.success(`Product pushed to all ${stores.length} stores successfully!`);
      
      // Redirect back to product detail after success
      setTimeout(() => {
        navigate(`/products/${product.id}`);
      }, 2000);

    } catch (error) {
      setSyncProgress(prev => ({
        ...prev,
        status: 'error',
        error: error.message
      }));
      toast.error(error.message || 'Failed to push product to all stores');
    }
  };

  const handleStoreSelection = (storeIds) => {
    setSelectedStores(storeIds);
    // Reset collections when stores change
    setSelectedCollections({});
  };

  const handleCollectionSelection = (storeId, collectionIds) => {
    setSelectedCollections(prev => ({
      ...prev,
      [storeId]: collectionIds
    }));
  };

  const isLoading = syncToMultipleStores.isPending || syncToAllStores.isPending;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/products/${product.id}`)}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Product
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Push Product to Stores
          </h1>
          <p className="text-gray-600">
            Select stores and collections for "{product.title}"
          </p>
        </div>
      </div>

      {/* Product Summary */}
      <Card className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Product Summary
        </h2>
        <div className="flex items-start space-x-4">
          {product.media?.[0] && (
            <img
              src={product.media[0].src || product.media[0].preview}
              alt={product.media[0].alt || product.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div>
            <h3 className="font-medium text-gray-900">{product.title}</h3>
            <p className="text-sm text-gray-600">{product.vendor}</p>
            <p className="text-sm text-gray-500">
              {product.variants?.length || 0} variants • {product.options?.length || 0} options
            </p>
          </div>
        </div>
      </Card>

      {syncProgress ? (
        /* Show progress when syncing */
        <PushProgress 
          progress={syncProgress}
          product={product}
          onRetry={() => handlePushToStores()}
          onCancel={() => {
            setSyncProgress(null);
            navigate(`/products/${product.id}`);
          }}
        />
      ) : (
        /* Show store selection */
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handlePushToAllStores}
                disabled={isLoading || storesLoading || stores.length === 0}
                className="flex-1"
              >
                Push to All Stores ({stores.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                className="flex-1"
              >
                {isAdvancedMode ? 'Simple Mode' : 'Advanced Selection'}
              </Button>
            </div>
          </Card>

          {/* Store Selection */}
          <StoreSelector
            stores={stores}
            selectedStores={selectedStores}
            onSelectionChange={handleStoreSelection}
            isLoading={storesLoading}
            advanced={isAdvancedMode}
          />

          {/* Collection Selection (per store) */}
          {selectedStores.length > 0 && (
            <div className="space-y-4">
              {selectedStores.map(storeId => (
                <CollectionSelector
                  key={storeId}
                  storeId={storeId}
                  selectedCollections={selectedCollections[storeId] || []}
                  onSelectionChange={(collectionIds) => 
                    handleCollectionSelection(storeId, collectionIds)
                  }
                />
              ))}
            </div>
          )}

          {/* Push Button */}
          {selectedStores.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Ready to Push
                  </h3>
                  <p className="text-sm text-gray-600">
                    Product will be pushed to {selectedStores.length} selected stores
                  </p>
                </div>
                <Button
                  onClick={handlePushToStores}
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? 'Pushing...' : 'Push to Stores'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
