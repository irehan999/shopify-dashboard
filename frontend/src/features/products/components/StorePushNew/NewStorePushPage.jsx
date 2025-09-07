import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button.jsx';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { StoreSelectionCard } from './StoreSelectionCard.jsx';
// Collections/Locations UI disabled in new flow
// import { StoreConfigurationCard } from './StoreConfigurationCard.jsx';
import { StoreOverridesCard } from './StoreOverridesCard.jsx';
import { PushProgressCard } from './PushProgressCard.jsx';
import { useConnectedStores } from '@/features/shopify/hooks/useShopify.js';
import { useSyncToMultipleStores } from '../../hooks/useShopifySync.js';
import { toast } from 'react-hot-toast';

/**
 * New StorePush Page - Completely Rebuilt
 * Professional implementation following your requirements:
 * - Load connected stores from DB
 * - Per-store configuration with collections and locations
 * - Clean component structure
 * - Real-time progress tracking
 */
export const NewStorePushPage = ({ product }) => {
  const navigate = useNavigate();
  
  // State Management
  const [selectedStores, setSelectedStores] = useState([]);
  // Per-store overrides and inventory assignment
  // { [storeId]: { variantOverrides: { [index]: { price?, compareAtPrice?, sku? } }, assignedInventory: { [index]: number } } }
  const [storeOverrides, setStoreOverrides] = useState({});
  const [pushProgress, setPushProgress] = useState(null);
  const [isPushing, setIsPushing] = useState(false);

  // API Hooks
  const { data: stores = [], isLoading: storesLoading } = useConnectedStores();
  const syncToMultipleStores = useSyncToMultipleStores();

  // Debug logging - only when data changes
  useEffect(() => {
    console.log('StorePush Debug:', { 
      stores, 
      storesLoading, 
      storesCount: stores?.length,
      selectedStores,
      storeOverrides 
    });
  }, [stores, storesLoading, selectedStores, storeOverrides]);

  // Event Handlers
  const handleStoreToggle = (storeId) => {
    setSelectedStores(prev => {
      const isSelected = prev.includes(storeId);
      if (isSelected) {
        // Remove store and its overrides
        const newSelected = prev.filter(id => id !== storeId);
        setStoreOverrides(prevState => {
          const next = { ...prevState };
          delete next[storeId];
          return next;
        });
        return newSelected;
      } else {
        // Add store
        return [...prev, storeId];
      }
    });
  };

  const handleOverridesChange = (storeId, next) => {
    setStoreOverrides(prev => ({ ...prev, [storeId]: next }));
  };

  const handleStartPush = async () => {
    if (selectedStores.length === 0) {
      toast.error('Please select at least one store');
      return;
    }

    try {
      setIsPushing(true);
      setPushProgress({
        status: 'syncing',
        total: selectedStores.length,
        completed: 0,
        current: null,
        results: []
      });

      // Prepare sync options for each store
      const storesWithOptions = selectedStores.map(storeId => {
        const ov = storeOverrides[storeId] || {};
        return ({
          storeId,
          options: {
            forceSync: true,
            variantOverrides: ov.variantOverrides || {},
            assignedInventory: ov.assignedInventory || {}
          }
        });
      });

      // Execute the push
      const results = await syncToMultipleStores.mutateAsync({
        productId: product.id,
        storesWithOptions
      });

      // Process results
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      setPushProgress({
        status: 'completed',
        total: selectedStores.length,
        completed: successCount,
        results: results.map(result => ({
          status: result.status === 'fulfilled' ? 'completed' : 'failed',
          storeName: stores.find(s => s._id === result.storeId)?.shopName || 'Unknown Store',
          error: result.error?.message || result.error
        }))
      });

      // Show notifications
      if (successCount > 0) {
        toast.success(`Product pushed to ${successCount} stores successfully!`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to push to ${failedCount} stores`);
      }

      // Redirect after success
      if (successCount > 0) {
        setTimeout(() => {
          navigate(`/products/${product.id}`);
        }, 3000);
      }

    } catch (error) {
      console.error('Push error:', error);
      setPushProgress({
        status: 'error',
        error: error.message || 'Failed to push product to stores'
      });
      toast.error(error.message || 'Failed to push product to stores');
    } finally {
      setIsPushing(false);
    }
  };

  const handleCancelPush = () => {
    // Note: In a real implementation, you'd cancel the API request
    setIsPushing(false);
    setPushProgress(null);
    toast.info('Push cancelled');
  };

  // Helper functions
  const isConfigurationValid = selectedStores.length > 0;
  const selectedStoreObjects = stores.filter(store => selectedStores.includes(store._id));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/products/${product.id}`)}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Product
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Push Product to Stores
            </h1>
            <p className="text-gray-600">
              Configure and push "{product.title}" to your connected Shopify stores
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Store Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store Selection */}
          <StoreSelectionCard
            stores={stores}
            selectedStores={selectedStores}
            onStoreToggle={handleStoreToggle}
            isLoading={storesLoading}
          />

          {/* Per-store overrides and inventory assignment */}
          {selectedStoreObjects.map((store) => (
            <StoreOverridesCard
              key={`ov-${store._id}`}
              store={store}
              product={product}
              value={storeOverrides[store._id]}
              onChange={(next) => handleOverridesChange(store._id, next)}
            />
          ))}
        </div>

        {/* Right Column - Progress and Actions */}
        <div className="space-y-6">
          {/* Push Progress */}
          <PushProgressCard
            isActive={isPushing}
            progress={pushProgress}
            onStart={handleStartPush}
            onCancel={handleCancelPush}
            selectedStores={selectedStoreObjects}
            isConfigurationValid={isConfigurationValid}
          />

          {/* Product Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Product Summary</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Title:</strong> {product.title}</p>
              <p><strong>Variants:</strong> {product.variants?.length || 0}</p>
              <p><strong>Status:</strong> {product.status || 'DRAFT'}</p>
              {product.vendor && <p><strong>Vendor:</strong> {product.vendor}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
