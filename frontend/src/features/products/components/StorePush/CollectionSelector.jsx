import React from 'react';
import { Card } from '@/components/ui/Card.jsx';
import { useCollectionSelection, useStoreDetails } from '../../hooks/useProductApi.js';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup.jsx';
import { FolderIcon } from '@heroicons/react/24/outline';

export const CollectionSelector = ({ 
  storeId, 
  selectedCollections, 
  onSelectionChange 
}) => {
  const { data: store } = useStoreDetails(storeId);
  const { 
    collections, 
    isLoading, 
    error, 
    collectionOptions 
  } = useCollectionSelection(storeId);

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Collections for {store?.name || 'Store'}
        </h3>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Collections for {store?.name || 'Store'}
        </h3>
        <div className="text-center py-4">
          <p className="text-red-600">Failed to load collections</p>
          <p className="text-sm text-gray-500 mt-1">{error.message}</p>
        </div>
      </Card>
    );
  }

  if (collections.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Collections for {store?.name || 'Store'}
        </h3>
        <div className="text-center py-4">
          <FolderIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No collections available</p>
          <p className="text-xs text-gray-400 mt-1">
            Product will be added without collection assignment
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Collections for {store?.name || 'Store'}
      </h3>
      
      <CheckboxGroup
        options={collectionOptions}
        value={selectedCollections}
        onChange={onSelectionChange}
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
      />

      {selectedCollections.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            Product will be added to <strong>{selectedCollections.length}</strong> collections
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>💡 Tip: You can add the product to collections later from the Shopify admin</p>
      </div>
    </Card>
  );
};
