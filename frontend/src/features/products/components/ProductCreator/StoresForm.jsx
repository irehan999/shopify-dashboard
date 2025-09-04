import React, { useState } from 'react';
import { useStoreSelection, useCollectionSelection } from '../../hooks/useProductApi.js';
import { Controller } from 'react-hook-form';

export const StoresForm = ({ form }) => {
  const [selectedStoreForCollections, setSelectedStoreForCollections] = useState(null);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  
  const { 
    stores, 
    isLoading, 
    availableStores, 
    storeOptions 
  } = useStoreSelection();

  const { control, watch, setValue } = form;
  const syncToAll = watch('storeMappings.syncToAll');
  const selectedStoreIds = watch('storeMappings.storeIds') || [];
  const selectedCollections = watch('storeMappings.collections') || {};

  const handleSyncToAllChange = (checked) => {
    setValue('storeMappings.syncToAll', checked);
    if (checked) {
      // Clear individual store selections when sync to all is enabled
      setValue('storeMappings.storeIds', []);
      setValue('storeMappings.collections', {});
    }
  };

  const handleStoreToggle = (storeId) => {
    const currentIds = selectedStoreIds;
    const isSelected = currentIds.includes(storeId);
    
    if (isSelected) {
      setValue('storeMappings.storeIds', currentIds.filter(id => id !== storeId));
      // Remove collections for this store
      const newCollections = { ...selectedCollections };
      delete newCollections[storeId];
      setValue('storeMappings.collections', newCollections);
    } else {
      setValue('storeMappings.storeIds', [...currentIds, storeId]);
    }
  };

  const getTargetStores = () => {
    return syncToAll ? availableStores : availableStores.filter(store => selectedStoreIds.includes(store.id));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Store Synchronization & Collections
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Choose which stores to sync your product to and optionally add to collections.
        </p>
      </div>

      {availableStores.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Connected Stores
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                You need to connect at least one Shopify store to sync products. Go to Store Settings to connect a store.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sync to All Option */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Sync to All Stores
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically sync to all {availableStores.length} connected stores
                </p>
              </div>
              <Controller
                name="storeMappings.syncToAll"
                control={control}
                render={({ field }) => (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={field.value || false}
                      onChange={(e) => {
                        field.onChange(e.target.checked);
                        handleSyncToAllChange(e.target.checked);
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                )}
              />
            </div>
          </div>

          {/* Individual Store Selection */}
          {!syncToAll && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Select Specific Stores
              </h3>
              <div className="space-y-2">
                {storeOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedStoreIds.includes(option.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !option.disabled && handleStoreToggle(option.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedStoreIds.includes(option.value)}
                          onChange={() => handleStoreToggle(option.value)}
                          disabled={option.disabled}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {option.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {option.store.shopifyDomain}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          option.store.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {option.store.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collection Selection */}
          {getTargetStores().length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Add to Collections (Optional)
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Select collections to add your product to when syncing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCollectionSelector(!showCollectionSelector)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  {showCollectionSelector ? 'Hide' : 'Show'} Collections
                  <svg className={`ml-2 h-4 w-4 transition-transform ${showCollectionSelector ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {showCollectionSelector && (
                <div className="space-y-4">
                  {getTargetStores().map((store) => (
                    <CollectionSelector
                      key={store.id}
                      store={store}
                      selectedCollections={selectedCollections[store.id] || []}
                      onSelectionChange={(collections) => {
                        setValue(`storeMappings.collections.${store.id}`, collections);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Sync Summary
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                {syncToAll 
                  ? `Product will be synced to all ${availableStores.length} connected stores`
                  : selectedStoreIds.length === 0
                    ? 'No stores selected for sync'
                    : `Product will be synced to ${selectedStoreIds.length} selected store${selectedStoreIds.length > 1 ? 's' : ''}`
                }
              </p>
              {Object.keys(selectedCollections).length > 0 && (
                <p>
                  Collections selected for {Object.keys(selectedCollections).length} store{Object.keys(selectedCollections).length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Collection Selector Component
const CollectionSelector = ({ store, selectedCollections, onSelectionChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { collections, isLoading, collectionOptions, searchCollections } = useCollectionSelection(store.id);
  
  const filteredCollections = searchTerm 
    ? searchCollections(searchTerm)
    : collections;

  const handleCollectionToggle = (collectionId) => {
    const isSelected = selectedCollections.includes(collectionId);
    if (isSelected) {
      onSelectionChange(selectedCollections.filter(id => id !== collectionId));
    } else {
      onSelectionChange([...selectedCollections, collectionId]);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">
          {store.displayName} Collections
        </h4>
        <span className="text-xs text-gray-500">
          {selectedCollections.length} selected
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading collections...</span>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Collections List */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {filteredCollections.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                {searchTerm ? 'No collections found matching your search' : 'No collections available'}
              </p>
            ) : (
              filteredCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => handleCollectionToggle(collection.id)}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(collection.id)}
                      onChange={() => handleCollectionToggle(collection.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {collection.displayName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {collection.productsCount} products
                        {collection.isSmartCollection && ' • Smart Collection'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
