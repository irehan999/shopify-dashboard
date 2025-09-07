import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';

/**
 * Store Selection Component - New Implementation
 * Allows users to select stores for product push with clean UI
 */
export const StoreSelectionCard = ({ stores, selectedStores, onStoreToggle, isLoading }) => {
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      selectedStores.forEach(storeId => onStoreToggle(storeId));
    } else {
      // Select all that aren't already selected
      stores.forEach(store => {
        if (!selectedStores.includes(store._id)) {
          onStoreToggle(store._id);
        }
      });
    }
    setSelectAll(!selectAll);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Stores...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stores || stores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
            No Stores Available
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <BuildingStorefrontIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No connected stores found</p>
          <Button onClick={() => window.open('/stores/connect', '_blank')}>
            Connect a Store
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
            Select Stores ({selectedStores.length}/{stores.length})
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedStores.length === stores.length ? 'Deselect All' : 'Select All'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stores.map((store) => {
            const isSelected = selectedStores.includes(store._id);
            
            return (
              <div
                key={`store-${store._id}-${store.shop || Math.random()}`}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={(e) => {
                  // Only toggle if not clicking on checkbox
                  if (e.target.type !== 'checkbox') {
                    onStoreToggle(store._id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onStoreToggle(store._id);
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {store.shopName || store.name || store.shop || store.displayName || 'Unnamed Store'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {store.shopDomain || store.domain || store.shop || 'No domain'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {store.shopData?.plan || store.plan || 'Basic'}
                    </Badge>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
