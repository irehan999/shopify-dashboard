import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { 
  useStoreLocations,
  useAssignInventoryToStore,
  useSyncInventoryFromShopify
} from '../../hooks/useInventoryApi.js';
import { useConnectedStores } from '@/features/shopify/hooks/useShopify.js';
import { toast } from 'react-hot-toast';

export const InventoryAssignmentModal = ({ 
  isOpen, 
  onClose, 
  product, 
  inventorySummary 
}) => {
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [variantQuantities, setVariantQuantities] = useState({});
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: stores = [] } = useConnectedStores();
  const { data: locations = [] } = useStoreLocations();
  const assignInventory = useAssignInventoryToStore();
  const syncInventory = useSyncInventoryFromShopify();

  const handleStoreChange = (storeId) => {
    setSelectedStore(storeId);
    setSelectedLocation('');
    // Reset quantities when store changes
    setVariantQuantities({});
  };

  const handleQuantityChange = (variantIndex, quantity) => {
    setVariantQuantities(prev => ({
      ...prev,
      [variantIndex]: parseInt(quantity) || 0
    }));
  };

  const handleAssignInventory = async () => {
    if (!selectedStore) {
      toast.error('Please select a store');
      return;
    }

    if (!selectedLocation) {
      toast.error('Please select a location');
      return;
    }

    const variantInventory = Object.entries(variantQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([variantIndex, assignedQuantity]) => ({
        variantIndex: parseInt(variantIndex),
        assignedQuantity
      }));

    if (variantInventory.length === 0) {
      toast.error('Please assign quantities to at least one variant');
      return;
    }

    setIsAssigning(true);
    try {
      await assignInventory.mutateAsync({
        productId: product.id,
        storeId: selectedStore,
        inventoryData: {
          variantInventory,
          locationId: selectedLocation
        }
      });

      toast.success('Inventory assigned successfully!');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to assign inventory');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSyncFromShopify = async (storeId) => {
    if (!storeId) return;

    try {
      await syncInventory.mutateAsync({
        productId: product.id,
        storeId: storeId
      });
      toast.success('Inventory synced from Shopify!');
    } catch (error) {
      toast.error(error.message || 'Failed to sync inventory');
    }
  };

  const getStoreInventory = (storeId) => {
    return inventorySummary?.storeInventory?.find(s => s.storeId === storeId);
  };

  const locationOptions = locations.map(location => ({
    value: location.id,
    label: location.name,
    subtitle: location.primary ? 'Primary Location' : location.address?.city
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Inventory"
      size="lg"
    >
      <div className="space-y-6">
        {/* Store Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Store
          </label>
          <Select
            options={stores.map(store => ({
              value: store.id,
              label: store.name || store.displayName,
              subtitle: store.shopDomain
            }))}
            value={selectedStore}
            onChange={handleStoreChange}
            placeholder="Choose a store..."
            className="w-full"
          />
        </div>

        {/* Current Store Inventory (if store selected) */}
        {selectedStore && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">
                Current Store Inventory
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSyncFromShopify(selectedStore)}
                disabled={syncInventory.isPending}
              >
                {syncInventory.isPending ? 'Syncing...' : 'Sync from Shopify'}
              </Button>
            </div>
            
            {(() => {
              const storeInventory = getStoreInventory(selectedStore);
              if (storeInventory) {
                return (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Assigned:</span>
                        <span className="ml-2 font-medium text-blue-600">
                          {storeInventory.totalAssigned} units
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">In Shopify:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {storeInventory.totalLastKnown} units
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Sync:</span>
                        <span className="ml-2 text-gray-400 text-xs">
                          {storeInventory.lastSyncAt 
                            ? new Date(storeInventory.lastSyncAt).toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-500 text-sm">No inventory data for this store</p>
                    <p className="text-gray-400 text-xs">Product needs to be pushed to this store first</p>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Location Selection */}
        {selectedStore && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inventory Location
            </label>
            <Select
              options={locationOptions}
              value={selectedLocation}
              onChange={setSelectedLocation}
              placeholder="Choose inventory location..."
              className="w-full"
            />
          </div>
        )}

        {/* Variant Inventory Assignment */}
        {selectedStore && selectedLocation && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Assign Inventory to Variants
            </h3>
            <div className="space-y-3">
              {inventorySummary?.masterInventory?.map((variant, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {variant.sku || `Variant ${index + 1}`}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Master: {variant.masterQuantity} units
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Price: ${variant.price}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max={variant.masterQuantity}
                      value={variantQuantities[index] || ''}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      placeholder="0"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-500">units</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-700 font-medium">Total to Assign:</span>
                <span className="text-blue-900 font-bold">
                  {Object.values(variantQuantities).reduce((sum, qty) => sum + (qty || 0), 0)} units
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          
          {selectedStore && selectedLocation && (
            <Button
              onClick={handleAssignInventory}
              disabled={isAssigning || Object.keys(variantQuantities).length === 0}
              className="flex-1"
            >
              {isAssigning ? 'Assigning...' : 'Assign Inventory'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
