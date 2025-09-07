import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  ShareIcon,
  TagIcon,
  CubeIcon,
  PhotoIcon,
  BuildingStorefrontIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useInventorySummary } from '../../hooks/useInventoryApi.js';
import { useSyncToStore } from '../../hooks/useShopifySync.js';
import { toast } from 'react-hot-toast';

/**
 * Connected Product Detail Component
 * For products that ARE connected to Shopify stores
 * Shows store management and inventory features
 */
export const ConnectedProductDetail = ({ product, onEdit, onPushToStores }) => {
  const navigate = useNavigate();
  const [selectedStoreForSync, setSelectedStoreForSync] = useState(null);
  
  // Only fetch inventory if product has store mappings
  const { data: inventorySummary, isLoading: inventoryLoading } = useInventorySummary(
    product.id,
    { enabled: product.isConnected }
  );
  
  const syncToStore = useSyncToStore();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const handleSyncToStore = async (storeId) => {
    try {
      setSelectedStoreForSync(storeId);
      await syncToStore.mutateAsync({
        productId: product.id,
        storeId,
        forceSync: true
      });
      toast.success('Product synced successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to sync product');
    } finally {
      setSelectedStoreForSync(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/products')}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            <p className="text-gray-600">
              Connected to {product.storeMappings?.length || 0} store(s)
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onEdit}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
          <Button onClick={onPushToStores}>
            <ShareIcon className="h-4 w-4 mr-2" />
            Manage Stores
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Images */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PhotoIcon className="h-5 w-5 mr-2" />
                Product Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.media && product.media.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.media.map((media, index) => (
                    <div key={media.id || index} className="aspect-square">
                      <img
                        src={media.src || media.preview}
                        alt={media.alt || `Product image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No images uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Info Sidebar */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TagIcon className="h-5 w-5 mr-2" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {product.status || 'DRAFT'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Vendor</label>
                <p className="mt-1 text-sm text-gray-900">{product.vendor || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Product Type</label>
                <p className="mt-1 text-sm text-gray-900">{product.productType || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Tags</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {product.tags && product.tags.length > 0 ? (
                    product.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No tags</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connected Stores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
                  Connected Stores
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {product.storeMappings?.length || 0} stores
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {product.storeMappings && product.storeMappings.length > 0 ? (
                  product.storeMappings.map((mapping) => (
                    <div 
                      key={mapping.storeId} 
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{mapping.store.shop}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Synced {mapping.lastSyncAt ? `• ${new Date(mapping.lastSyncAt).toLocaleDateString()}` : ''}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncToStore(mapping.storeId)}
                        disabled={syncToStore.isPending}
                      >
                        {syncToStore.isPending && selectedStoreForSync === mapping.storeId ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          'Update'
                        )}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No stores connected</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Summary */}
          {inventorySummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Inventory Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inventoryLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inventorySummary.masterInventory?.map((variant, index) => (
                      <div key={variant.id || index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium truncate">
                          {variant.title || `Variant ${index + 1}`}
                        </span>
                        <Badge variant="outline">
                          {variant.inventoryQuantity || 0} units
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
