import React from 'react';
import { Card } from '@/components/ui/Card.jsx';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup.jsx';
import { ShoppingBagIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

export const StoreSelector = ({ 
  stores, 
  selectedStores, 
  onSelectionChange, 
  isLoading,
  advanced = false 
}) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Select Stores
        </h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (stores.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Connected Stores
          </h3>
          <p className="text-gray-600">
            Connect your Shopify stores to push products
          </p>
        </div>
      </Card>
    );
  }

  const storeOptions = stores.map(store => ({
    value: store.id,
    label: store.name,
    description: store.domain,
    icon: store.logo || <GlobeAltIcon className="h-6 w-6" />,
    disabled: !store.isActive
  }));

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Select Stores ({stores.length} available)
      </h2>
      
      {advanced ? (
        /* Advanced mode with detailed info */
        <div className="space-y-3">
          {stores.map(store => (
            <div
              key={store.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedStores.includes(store.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${!store.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!store.isActive) return;
                const newSelection = selectedStores.includes(store.id)
                  ? selectedStores.filter(id => id !== store.id)
                  : [...selectedStores, store.id];
                onSelectionChange(newSelection);
              }}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedStores.includes(store.id)}
                  onChange={() => {}}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={!store.isActive}
                />
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {store.logo ? (
                    <img src={store.logo} alt={store.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{store.name}</h3>
                  <p className="text-sm text-gray-600">{store.domain}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      store.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {store.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {store.productCount || 0} products
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Simple mode with checkbox group */
        <CheckboxGroup
          options={storeOptions}
          value={selectedStores}
          onChange={onSelectionChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        />
      )}

      {selectedStores.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{selectedStores.length}</strong> stores selected
          </p>
        </div>
      )}
    </Card>
  );
};
