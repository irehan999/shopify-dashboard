import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useSyncToMultipleStores
} from '../../hooks/useShopifySync.js';
import { useConnectedStores } from '@/features/shopify/hooks/useShopify.js';
import { StoreSelector } from './StoreSelector.jsx';
import { PushProgress } from './PushProgress.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export const StorePushPage = ({ product }) => {
  const navigate = useNavigate();
  const [selectedStores, setSelectedStores] = useState([]);
  // Variant-level overrides and inventory assignment
  const [variantOverrides, setVariantOverrides] = useState({}); // { [variantIndex]: { price?, compareAtPrice?, sku? } }
  const [assignedInventory, setAssignedInventory] = useState({}); // { [variantIndex]: number }
  const [syncProgress, setSyncProgress] = useState(null);

  const { data: stores = [], isLoading: storesLoading } = useConnectedStores();
  const syncToMultipleStores = useSyncToMultipleStores();

  const variants = useMemo(() => product?.variants || [], [product]);

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

    // Build per-store payloads expected by API helper (storeId + options)
      const storesWithOptions = selectedStores.map(storeId => ({
        storeId,
        options: {
      forceSync: true,
      // New contract: send variant overrides and assigned inventory; no collections/locations here
      variantOverrides,
      assignedInventory
        }
      }));

      // Debug payload
      console.debug('StorePush Debug (frontend): storesWithOptions ->', storesWithOptions);
      // Use multi-store sync with corrected payload
      const results = await syncToMultipleStores.mutateAsync({
        productId: product.id,
        storesWithOptions
      });

      setSyncProgress(prev => ({
        ...prev,
        status: 'completed',
        results
      }));

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (successCount > 0) {
        toast.success(`Product pushed to ${successCount} stores successfully!`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to push to ${failedCount} stores`);
      }
      
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

      // Get all store IDs using MongoDB _id
  const allStoreIds = stores.map(store => store._id);

    // Build per-store payloads and apply current overrides/inventory
      const storesWithOptions = allStoreIds.map(storeId => ({
        storeId,
        options: {
      forceSync: true,
      variantOverrides,
      assignedInventory
        }
      }));

      const results = await syncToMultipleStores.mutateAsync({
        productId: product.id,
        storesWithOptions
      });

      setSyncProgress(prev => ({
        ...prev,
        status: 'completed',
        results
      }));

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (successCount > 0) {
        toast.success(`Product pushed to ${successCount} stores successfully!`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to push to ${failedCount} stores`);
      }
      
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
    // Reset inputs when stores change
    setVariantOverrides({});
    setAssignedInventory({});
  };

  // Handlers for inputs
  const handleOverrideChange = (variantIndex, field, value) => {
    setVariantOverrides(prev => ({
      ...prev,
      [variantIndex]: {
        ...(prev[variantIndex] || {}),
        [field]: value
      }
    }));
  };

  const handleAssignedQtyChange = (variantIndex, value) => {
    const qty = Number.isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10);
    setAssignedInventory(prev => ({
      ...prev,
      [variantIndex]: qty
    }));
  };

  const isLoading = syncToMultipleStores.isPending;
  const hasInventoryAssignments = Object.keys(assignedInventory).length > 0;
  const hasOverrides = Object.keys(variantOverrides).length > 0;

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
            Select stores and configure sync options for "{product.title}"
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
        /* Show store selection and configuration */
        <div className="space-y-6">
          {/* Variant Overrides and Inventory */}
          {selectedStores.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Variant Overrides and Inventory
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="px-3 py-2">Variant</th>
                      <th className="px-3 py-2">Current Price</th>
                      <th className="px-3 py-2">Override Price</th>
                      <th className="px-3 py-2">Override Compare-at</th>
                      <th className="px-3 py-2">Assign Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-900">
                          {v.title || v.optionValues?.map(ov => ov.name).join(' / ') || `Variant #${idx+1}`}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {v.price}
                          {v.compareAtPrice ? (
                            <span className="text-xs text-gray-400 ml-2">(comp {v.compareAtPrice})</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            className="w-28 border rounded px-2 py-1"
                            placeholder="e.g. 19.99"
                            value={variantOverrides[idx]?.price ?? ''}
                            onChange={e => handleOverrideChange(idx, 'price', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            className="w-28 border rounded px-2 py-1"
                            placeholder="e.g. 24.99"
                            value={variantOverrides[idx]?.compareAtPrice ?? ''}
                            onChange={e => handleOverrideChange(idx, 'compareAtPrice', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            className="w-24 border rounded px-2 py-1"
                            placeholder="0"
                            value={assignedInventory[idx] ?? ''}
                            onChange={e => handleAssignedQtyChange(idx, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-3">Overrides and assigned quantities will be applied to all selected stores.</p>
            </Card>
          )}

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
              <div className="text-sm text-gray-500 flex items-center">
                {hasOverrides && <span className="mr-2">✏️ Overrides</span>}
                {hasInventoryAssignments && <span>📦 Inventory</span>}
              </div>
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

          {/* No collections or location configuration in this flow */}

          {/* Push Button */}
          {selectedStores.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Ready to Push
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Product will be pushed to {selectedStores.length} selected stores</p>
                    {hasInventoryAssignments && (
                      <p>• Inventory quantities will be assigned as specified</p>
                    )}
                    {hasOverrides && (
                      <p>• Variant overrides will be applied where provided</p>
                    )}
                  </div>
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
