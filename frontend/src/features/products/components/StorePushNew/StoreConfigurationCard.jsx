import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup.jsx';
import { 
  CogIcon, 
  TagIcon, 
  MapPinIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { useCollectionsByStore } from '../../hooks/useCollectionApi.js';
import { useStoreLocationsForStore } from '../../hooks/useInventoryApi.js';
import { toast } from 'react-hot-toast';

/**
 * Store Configuration Component - New Implementation
 * Handles collections and locations configuration for each selected store
 */
export const StoreConfigurationCard = ({ 
  store, 
  selectedCollections, 
  selectedLocation, 
  onCollectionsChange, 
  onLocationChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [locationsLoaded, setLocationsLoaded] = useState(false);

  // Only fetch data when expanded
  const { 
    data: collections = [], 
    isLoading: collectionsLoading,
    error: collectionsError 
  } = useCollectionsByStore(store._id, { enabled: isExpanded });
  
  const { 
    data: locations = [], 
    isLoading: locationsLoading,
    error: locationsError 
  } = useStoreLocationsForStore(store._id, { enabled: isExpanded });

  useEffect(() => {
    if (isExpanded && collections.length > 0 && !collectionsLoaded) {
      setCollectionsLoaded(true);
    }
  }, [collections, isExpanded, collectionsLoaded]);

  useEffect(() => {
    if (isExpanded && locations.length > 0 && !locationsLoaded) {
      setLocationsLoaded(true);
    }
  }, [locations, isExpanded, locationsLoaded]);

  useEffect(() => {
    if (collectionsError) {
      toast.error(`Failed to load collections for ${store.name}: ${collectionsError.message}`);
    }
  }, [collectionsError, store.name]);

  useEffect(() => {
    if (locationsError) {
      toast.error(`Failed to load locations for ${store.name}: ${locationsError.message}`);
    }
  }, [locationsError, store.name]);

  const collectionOptions = (collections || []).map(collection => ({
    value: collection.id,
    label: collection.title,
    description: `${collection.productsCount || 0} products`
  }));

  const locationOptions = (locations || []).map(location => ({
    value: location.id,
    label: location.name,
    description: location.isActive ? 
      (location.fulfillsOnlineOrders ? 'Primary Location' : 'Active') : 
      'Inactive'
  }));

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base">
            <CogIcon className="h-4 w-4 mr-2" />
            Configure: {store.name || store.shop}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-500">{store.domain || store.shop}</p>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Collections Configuration */}
          <div>
            <div className="flex items-center mb-3">
              <TagIcon className="h-4 w-4 mr-2 text-gray-600" />
              <h4 className="font-medium text-sm">Collections</h4>
              <Badge variant="outline" className="ml-2 text-xs">
                {selectedCollections.length} selected
              </Badge>
            </div>
            
            {collectionsLoading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : collectionsError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-600">Failed to load collections</p>
              </div>
            ) : collections.length === 0 ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-sm text-gray-500">No collections available</p>
              </div>
            ) : (
              <CheckboxGroup
                options={collectionOptions}
                selectedValues={selectedCollections}
                onChange={onCollectionsChange}
                className="max-h-32 overflow-y-auto"
              />
            )}
          </div>

          {/* Location Configuration */}
          <div>
            <div className="flex items-center mb-3">
              <MapPinIcon className="h-4 w-4 mr-2 text-gray-600" />
              <h4 className="font-medium text-sm">Inventory Location</h4>
              {selectedLocation && (
                <Badge variant="default" className="ml-2 text-xs">
                  Selected
                </Badge>
              )}
            </div>
            
            {locationsLoading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ) : locationsError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-600">Failed to load locations</p>
              </div>
            ) : locations.length === 0 ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-sm text-gray-500">No locations available</p>
              </div>
            ) : (
              <Select
                options={locationOptions}
                value={selectedLocation || ''}
                onChange={onLocationChange}
                placeholder="Select inventory location..."
                className="w-full"
              />
            )}
          </div>

          {/* Configuration Summary */}
          <div className="pt-3 border-t border-gray-200">
            <h5 className="text-xs font-medium text-gray-700 mb-2">Configuration Summary:</h5>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Collections: {selectedCollections.length > 0 ? `${selectedCollections.length} selected` : 'None selected'}</p>
              <p>• Location: {selectedLocation ? 'Selected' : 'Not selected'}</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
