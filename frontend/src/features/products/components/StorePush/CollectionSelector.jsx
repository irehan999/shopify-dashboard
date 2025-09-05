import React from 'react';
import { Card } from '@/components/ui/Card.jsx';
import { useCollectionSelection } from '../../hooks/useCollectionApi.js';
import { useConnectedStores } from '@/features/shopify/hooks/useShopify.js';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup.jsx';
import { FolderIcon } from '@heroicons/react/24/outline';

export const CollectionSelector = ({ 
  storeId, 
  selectedCollections, 
  onSelectionChange,
  compact = false
}) => {
  const { data: stores } = useConnectedStores();
  const store = stores?.find(s => s.id === storeId);
  
  const { 
    collections, 
    isLoading, 
    error, 
    collectionOptions 
  } = useCollectionSelection(storeId);

  if (isLoading) {
    return (
      <Card className={compact ? "p-4" : "p-6"}>
        <h3 className={`font-medium text-gray-900 mb-4 ${compact ? 'text-base' : 'text-lg'}`}>
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
      <Card className={compact ? "p-4" : "p-6"}>
        <h3 className={`font-medium text-gray-900 mb-4 ${compact ? 'text-base' : 'text-lg'}`}>
          Collections for {store?.name || 'Store'}
        </h3>
        <div className="text-center py-4">
          <p className="text-red-600 text-sm">Failed to load collections</p>
          <p className="text-xs text-gray-500 mt-1">{error.message}</p>
        </div>
      </Card>
    );
  }

  if (collections.length === 0) {
    return (
      <Card className={compact ? "p-4" : "p-6"}>
        <h3 className={`font-medium text-gray-900 mb-4 ${compact ? 'text-base' : 'text-lg'}`}>
          Collections for {store?.name || 'Store'}
        </h3>
        <div className="text-center py-4">
          <FolderIcon className={`text-gray-400 mx-auto mb-2 ${compact ? 'h-6 w-6' : 'h-8 w-8'}`} />
          <p className="text-gray-500 text-sm">No collections available</p>
          <p className="text-xs text-gray-400 mt-1">
            Product will be added without collection assignment
          </p>
        </div>
      </Card>
    );
  }

  const gridCols = compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2";

  return (
    <Card className={compact ? "p-4" : "p-6"}>
      {!compact && (
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Collections for {store?.name || 'Store'}
        </h3>
      )}
      
      <CheckboxGroup
        options={collectionOptions}
        value={selectedCollections}
        onChange={onSelectionChange}
        className={`grid ${gridCols} gap-2`}
        compact={compact}
      />

      {selectedCollections.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            Product will be added to <strong>{selectedCollections.length}</strong> collections
          </p>
        </div>
      )}

      {!compact && (
        <div className="mt-4 text-xs text-gray-500">
          <p>💡 Tip: You can add the product to collections later from the Shopify admin</p>
        </div>
      )}
    </Card>
  );
};
