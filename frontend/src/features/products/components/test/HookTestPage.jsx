import React from 'react';
import { Card } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { 
  useSyncToMultipleStores,
  useSyncStatus
} from '../../hooks/useShopifySync.js';
import { useConnectedStores } from '@/features/shopify/hooks/useShopify.js';
import { useCollectionSelection } from '../../hooks/useCollectionApi.js';
import { 
  useStoreLocations,
  useInventorySummary
} from '../../hooks/useInventoryApi.js';
import { 
  useProducts,
  useProduct
} from '../../hooks/useProductApi.js';

/**
 * Test page to verify all hooks are working correctly
 * This component can be used for debugging and testing
 */
export const HookTestPage = () => {
  // Test Shopify hooks
  const { data: stores = [], isLoading: storesLoading } = useConnectedStores();
  const { collections: storeCollection, isLoading: collectionSelectionLoading } = useCollectionSelection('test-store-id');
  
  // Test Inventory hooks
  const { data: locations, isLoading: locationsLoading } = useStoreLocations('test-store-id');
  const { data: inventorySummary, isLoading: inventoryLoading } = useInventorySummary();
  
  // Test Product hooks
  const { data: products, isLoading: productsLoading } = useProducts({ limit: 5 });
  
  // Test mutations
  const syncToMultipleStores = useSyncToMultipleStores();

  const handleTestSync = () => {
    if (products?.data?.products?.[0] && connectedStores?.[0]) {
      syncToMultipleStores.mutate({
        productId: products.data.products[0].id,
        storeIds: [connectedStores[0].id]
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Hook Testing Page
      </h1>
      
      {/* Store Selection Test */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Store Selection Hook</h2>
        {storeSelectionLoading ? (
          <p>Loading store selection...</p>
        ) : (
          <div>
            <p>Available stores: {storeSelection?.length || 0}</p>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(storeSelection?.slice(0, 2), null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {/* Connected Stores Test */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Connected Stores Hook</h2>
        {connectedStoresLoading ? (
          <p>Loading connected stores...</p>
        ) : (
          <div>
            <p>Connected stores: {connectedStores?.length || 0}</p>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(connectedStores?.slice(0, 2), null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {/* Inventory Test */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Inventory Hooks</h2>
        {inventoryLoading ? (
          <p>Loading inventory summary...</p>
        ) : (
          <div>
            <p>Inventory data available: {inventorySummary ? 'Yes' : 'No'}</p>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(inventorySummary, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {/* Products Test */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Product Hooks</h2>
        {productsLoading ? (
          <p>Loading products...</p>
        ) : (
          <div>
            <p>Products loaded: {products?.data?.products?.length || 0}</p>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(products?.data?.products?.slice(0, 1), null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {/* Sync Test */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Sync Testing</h2>
        <Button 
          onClick={handleTestSync}
          disabled={syncToMultipleStores.isPending || !products?.data?.products?.[0] || !connectedStores?.[0]}
          loading={syncToMultipleStores.isPending}
        >
          Test Sync to Multiple Stores
        </Button>
        {syncToMultipleStores.isError && (
          <p className="text-red-600 mt-2">
            Error: {syncToMultipleStores.error?.message}
          </p>
        )}
        {syncToMultipleStores.isSuccess && (
          <p className="text-green-600 mt-2">
            Sync successful!
          </p>
        )}
      </Card>

      {/* Hook Status Summary */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Hook Status Summary</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Shopify Sync Hooks:</strong>
            <ul className="list-disc pl-5">
              <li>useConnectedStores: {storesLoading ? 'Loading' : 'Ready'}</li>
              <li>useCollectionSelection: {collectionSelectionLoading ? 'Loading' : 'Ready'}</li>
              <li>useSyncToMultipleStores: Ready</li>
            </ul>
          </div>
          <div>
            <strong>Other Hooks:</strong>
            <ul className="list-disc pl-5">
              <li>useInventorySummary: {inventoryLoading ? 'Loading' : 'Ready'}</li>
              <li>useProducts: {productsLoading ? 'Loading' : 'Ready'}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HookTestPage;
