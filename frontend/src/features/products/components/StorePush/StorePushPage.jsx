import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useSyncToMultipleStores
} from '../../hooks/useShopifySync.js';
import { useCollectionSelection } from '../../hooks/useCollectionApi.js';
import { useLocationSelection } from '../../hooks/useInventoryApi.js';
import { useConnectedStores } from '@/features/shopify/hooks/useShopify.js';
import { useLiveShopifyInventory } from '../../hooks/useInventoryApi.js';
import LiveInventoryAllocationDashboard from '../LiveInventoryAllocationDashboard.jsx';
import { StoreSelector } from './StoreSelector.jsx';
import { CollectionSelector } from './CollectionSelector.jsx';
import { PushProgress } from './PushProgress.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Switch } from '@/components/ui/Switch.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { ArrowLeftIcon, CogIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export const StorePushPage = ({ product }) => {
  const navigate = useNavigate();
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState({});
  const [selectedLocations, setSelectedLocations] = useState({});
  const [variantInventory, setVariantInventory] = useState({}); // Store-specific variant inventory
  const [syncProgress, setSyncProgress] = useState(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [enableCollections, setEnableCollections] = useState(true);
  const [enableInventory, setEnableInventory] = useState(false);
  const [showLiveAllocation, setShowLiveAllocation] = useState(false);

  const { data: stores = [], isLoading: storesLoading } = useConnectedStores();
  const { locations, locationOptions } = useLocationSelection();
  const { data: liveInventory } = useLiveShopifyInventory(product?.id);
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

      // Prepare sync options with collections and inventory
      const syncOptions = {
        forceSync: true,
        ...(enableCollections && {
          collectionsToJoin: selectedCollections
        }),
        ...(enableInventory && {
          locationId: selectedLocations,
          inventoryData: variantInventory // Include variant-specific inventory
        })
      };

      // Use enhanced syncToMultipleStores with new options
      const results = await syncToMultipleStores.mutateAsync({
        productId: product.id,
        storeIds: selectedStores,
        syncOptions
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

      // Get all store IDs
      const allStoreIds = stores.map(store => store.id);
      
      // Prepare sync options
      const syncOptions = {
        forceSync: true,
        ...(enableCollections && Object.keys(selectedCollections).length > 0 && {
          collectionsToJoin: selectedCollections
        }),
        ...(enableInventory && Object.keys(selectedLocations).length > 0 && {
          locationId: selectedLocations,
          inventoryData: variantInventory
        })
      };

      // Use enhanced syncToMultipleStores
      const results = await syncToMultipleStores.mutateAsync({
        productId: product.id,
        storeIds: allStoreIds,
        syncOptions
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
    // Reset collections, locations, and inventory when stores change
    setSelectedCollections({});
    setSelectedLocations({});
    setVariantInventory({});
  };

  const handleCollectionSelection = (storeId, collectionIds) => {
    setSelectedCollections(prev => ({
      ...prev,
      [storeId]: collectionIds
    }));
  };

  const handleLocationSelection = (storeId, locationId) => {
    setSelectedLocations(prev => ({
      ...prev,
      [storeId]: locationId
    }));
  };

  const handleInventoryChange = (storeId, variantIndex, quantity) => {
    setVariantInventory(prev => ({
      ...prev,
      [storeId]: {
        ...prev[storeId],
        [variantIndex]: parseInt(quantity) || 0
      }
    }));
  };

  const isLoading = syncToMultipleStores.isPending;
  const hasSelectedCollections = enableCollections && Object.keys(selectedCollections).length > 0;
  const hasSelectedLocations = enableInventory && Object.keys(selectedLocations).length > 0;
  const hasInventoryAssignments = enableInventory && Object.keys(variantInventory).length > 0;

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
          {/* Sync Configuration */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Sync Configuration
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              >
                <CogIcon className="h-4 w-4 mr-2" />
                {isAdvancedMode ? 'Simple Mode' : 'Advanced Options'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Add to Collections
                  </label>
                  <p className="text-xs text-gray-500">
                    Assign product to specific collections in each store
                  </p>
                </div>
                <Switch
                  checked={enableCollections}
                  onChange={setEnableCollections}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Manage Inventory
                  </label>
                  <p className="text-xs text-gray-500">
                    Set inventory locations for each store
                  </p>
                </div>
                <Switch
                  checked={enableInventory}
                  onChange={setEnableInventory}
                />
              </div>
              
              {/* Live Allocation Option */}
              {enableInventory && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Use Live Allocation
                    </label>
                    <p className="text-xs text-gray-500">
                      Real-time Shopify inventory allocation
                    </p>
                  </div>
                  <Switch
                    checked={showLiveAllocation}
                    onChange={setShowLiveAllocation}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Live Allocation Dashboard */}
          {enableInventory && showLiveAllocation && (
            <Card className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Live Inventory Allocation
              </h2>
              <LiveInventoryAllocationDashboard
                productId={product?.id}
                onAllocationChange={(variantId, allocation) => {
                  // Handle live allocation changes
                  console.log('Live allocation changed:', variantId, allocation);
                  toast.success('Live allocation updated!');
                }}
                showRecommendations={true}
                compactMode={true}
              />
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
                {hasSelectedCollections && <span className="mr-2">📁 Collections</span>}
                {hasSelectedLocations && <span className="mr-2">📍 Locations</span>}
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

          {/* Collection and Location Configuration per Store */}
          {selectedStores.length > 0 && (enableCollections || enableInventory) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Store Configuration
              </h3>
              
              {selectedStores.map(storeId => {
                const store = stores.find(s => s.id === storeId);
                return (
                  <Card key={storeId} className="p-6">
                    <h4 className="font-medium text-gray-900 mb-4">
                      {store?.name || store?.displayName}
                    </h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Collection Selection */}
                      {enableCollections && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Collections
                          </label>
                          <CollectionSelector
                            storeId={storeId}
                            selectedCollections={selectedCollections[storeId] || []}
                            onSelectionChange={(collectionIds) => 
                              handleCollectionSelection(storeId, collectionIds)
                            }
                            compact={true}
                          />
                        </div>
                      )}
                      
                      {/* Location Selection */}
                      {enableInventory && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Inventory Location
                          </label>
                          <Select
                            options={locationOptions}
                            value={selectedLocations[storeId] || ''}
                            onChange={(locationId) => handleLocationSelection(storeId, locationId)}
                            placeholder="Select inventory location..."
                            className="w-full"
                          />
                        </div>
                      )}
                      {/* Inventory Assignment */}
                      {enableInventory && selectedLocations[storeId] && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Inventory Assignment
                          </label>
                          <div className="space-y-2">
                            {product.variants?.map((variant, variantIndex) => (
                              <div key={variantIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <span className="text-sm font-medium">
                                    {variant.sku || `Variant ${variantIndex + 1}`}
                                  </span>
                                  <div className="text-xs text-gray-500">
                                    Master: {variant.inventoryQuantity || 0} units
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max={variant.inventoryQuantity || 0}
                                    value={variantInventory[storeId]?.[variantIndex] || ''}
                                    onChange={(e) => handleInventoryChange(storeId, variantIndex, e.target.value)}
                                    placeholder="0"
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <span className="text-xs text-gray-500">units</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Collection Selection (Legacy - for stores without individual config) */}
          {selectedStores.length > 0 && enableCollections && !isAdvancedMode && (
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
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Product will be pushed to {selectedStores.length} selected stores</p>
                    {hasSelectedCollections && (
                      <p>• Will be added to selected collections</p>
                    )}
                    {hasSelectedLocations && (
                      <p>• Inventory will be managed at selected locations</p>
                    )}
                    {hasInventoryAssignments && (
                      <p>• Inventory quantities will be assigned as specified</p>
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
