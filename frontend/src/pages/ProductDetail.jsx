import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useProduct, 
  useUpdateProduct, 
  useDeleteProduct
} from '@/features/products/hooks/useProductApi';
import { useConnectedStores } from '@/features/shopify/hooks/useShopify.js';
import { useInventorySummary, useAssignInventoryToStore } from '@/features/products/hooks/useInventoryApi.js';
import { useProductSyncManagement } from '@/features/products/hooks/useShopifySync.js';
import { InventoryAssignmentModal } from '@/features/products/components/InventoryAssignmentModal.jsx';
import LiveInventoryAllocationDashboard from '@/features/products/components/LiveInventoryAllocationDashboard.jsx';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Dropdown from '@/components/ui/Dropdown';
import { 
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ChevronLeftIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  PhotoIcon,
  TagIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showLiveAllocation, setShowLiveAllocation] = useState(false);
  const [selectedStoreForSync, setSelectedStoreForSync] = useState(null);

  // Fetch product and stores data
  const { data: product, isLoading, error, refetch } = useProduct(id);
  const { data: stores = [] } = useConnectedStores();
  const { data: inventorySummary, isLoading: inventoryLoading } = useInventorySummary(id);
  const sync = useProductSyncManagement(id);

  // Mutations
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const assignInventory = useAssignInventoryToStore();

  const handleBack = () => {
    navigate('/products');
  };

  const handleEdit = () => {
    navigate(`/products/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Product deleted successfully!');
      navigate('/products');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicateData = {
        ...product,
        title: `${product.title} (Copy)`,
        handle: `${product.handle}-copy`,
        id: undefined,
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined
      };
      
      // This would need a duplicate API endpoint
      console.log('Duplicate product:', duplicateData);
      toast.success('Product duplication feature coming soon!');
      setShowDuplicateModal(false);
    } catch (error) {
      toast.error('Failed to duplicate product');
    }
  };

  const handlePushToStores = () => {
    navigate(`/products/${id}/push`);
  };

  const handleSyncToStore = async (storeId) => {
    try {
      setSelectedStoreForSync(storeId);
      await sync.syncToStore(storeId, {});
    } catch (e) {
      // toast is handled inside hook
    } finally {
      setSelectedStoreForSync(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading product...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
        <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={handleBack}>Back to Products</Button>
      </div>
    );
  }

  const getPriceRange = () => {
    if (!product.variants?.length) return 'No variants';
    
    const prices = product.variants.map(v => parseFloat(v.price || 0)).filter(p => p > 0);
    if (!prices.length) return 'No price set';
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    return min === max ? formatCurrency(min) : `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  const getMainImage = () => {
    return product.media?.find(m => m.position === 1) || product.media?.[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            <p className="text-gray-600">Product Details & Store Management</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleEdit}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Product
          </Button>

          <Button 
            variant="primary" 
            onClick={handlePushToStores}
            disabled={stores.length === 0}
          >
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            Push to Stores
          </Button>

          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" className="p-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
            }
          >
            <Dropdown.Item
              onClick={() => setShowDuplicateModal(true)}
              icon={DocumentDuplicateIcon}
            >
              Duplicate Product
            </Dropdown.Item>
            <Dropdown.Separator />
            <Dropdown.Item
              onClick={() => setShowDeleteModal(true)}
              icon={TrashIcon}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete Product
            </Dropdown.Item>
          </Dropdown>
        </div>
      </div>

      {/* Product Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <EyeIcon className="h-5 w-5 mr-2" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {getMainImage() ? (
                    <img
                      src={getMainImage().src || getMainImage().url || getMainImage().preview}
                      alt={getMainImage().alt || product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{product.title}</h3>
                  {product.descriptionHtml && (
                    <div 
                      className="text-sm text-gray-600 mt-2 line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                    />
                  )}
                  <div className="flex items-center space-x-4 mt-3">
                    <Badge 
                      variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={
                        product.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : product.status === 'DRAFT'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {product.status}
                    </Badge>
                    {product.vendor && (
                      <span className="text-sm text-gray-500">by {product.vendor}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Price Range</dt>
                    <dd className="text-lg font-semibold text-gray-900">{getPriceRange()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Variants</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {product.variants?.length || 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Media Files</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {product.media?.length || 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Product Type</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {product.productType || 'Not set'}
                    </dd>
                  </div>
                </dl>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div className="border-t pt-4">
                  <dt className="text-sm font-medium text-gray-500 mb-2">Tags</dt>
                  <div className="flex flex-wrap gap-1">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CubeIcon className="h-5 w-5 mr-2" />
                  Variants ({product.variants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inventory
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {product.variants.map((variant, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {variant.optionValues && variant.optionValues.length > 0
                              ? variant.optionValues.map(ov => `${ov.optionName}: ${ov.name}`).join(' / ')
                              : `Variant ${index + 1}`
                            }
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(variant.price)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {variant.sku || 'No SKU'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {variant.inventoryQuantity || 0} units
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <CubeIcon className="h-5 w-5 mr-2" />
                  Inventory Management
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex rounded-lg border border-gray-200 p-1">
                    <button
                      onClick={() => setShowLiveAllocation(false)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        !showLiveAllocation
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Traditional
                    </button>
                    <button
                      onClick={() => setShowLiveAllocation(true)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        showLiveAllocation
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Live Allocation
                    </button>
                  </div>
                  {!showLiveAllocation && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInventoryModal(true)}
                    >
                      Manage Inventory
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showLiveAllocation ? (
                // Traditional Inventory View
                <>
                  {inventoryLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : inventorySummary ? (
                    <div className="space-y-4">
                      {/* Master Inventory Summary */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Master Inventory</h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Total Variants:</span>
                              <span className="ml-2 font-medium">{inventorySummary.masterInventory?.length || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total Stock:</span>
                              <span className="ml-2 font-medium">
                                {inventorySummary.masterInventory?.reduce((sum, variant) => sum + (variant.masterQuantity || 0), 0) || 0} units
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Store Inventory */}
                      {inventorySummary.storeInventory && inventorySummary.storeInventory.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Store Inventory</h4>
                          <div className="space-y-2">
                            {inventorySummary.storeInventory.map((store) => (
                              <div key={store.storeId} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-sm">{store.storeName}</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {store.totalVariants} variants
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Assigned:</span>
                                    <span className="ml-2 font-medium text-blue-600">{store.totalAssigned} units</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">In Shopify:</span>
                                    <span className="ml-2 font-medium text-green-600">{store.totalLastKnown} units</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No inventory assigned to stores yet</p>
                          <p className="text-gray-400 text-xs">Push this product to stores to manage inventory</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">Unable to load inventory data</p>
                    </div>
                  )}
                </>
              ) : (
                // Live Allocation View
                <LiveInventoryAllocationDashboard
                  productId={id}
                  onAllocationChange={(variantId, allocation) => {
                    console.log('Allocation changed:', variantId, allocation);
                    // Handle allocation changes here
                    toast.success('Allocation updated successfully!');
                  }}
                  showRecommendations={true}
                  compactMode={false}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Store Sync Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
                Store Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stores.length > 0 ? (
                <div className="space-y-3">
                  {stores.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{store.shop}</div>
                        <div className="text-xs text-gray-500">
                          {/* This would come from ProductMap in real implementation */}
                          Not synced
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncToStore(store.id)}
                        disabled={sync.isSyncing}
                      >
                        {sync.isSyncing && selectedStoreForSync === store.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          'Sync'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <BuildingStorefrontIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No stores connected</p>
                  <Button size="sm" className="mt-3" onClick={() => navigate('/stores')}>
                    Connect Store
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Product Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm font-medium">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Last Updated</span>
                <span className="text-sm font-medium">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Sync Status</span>
                <Badge variant="secondary" className="text-xs">
                  {product.syncStatus || 'Not synced'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Product"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteProduct.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteProduct.isPending}
            >
              Delete Product
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "<strong>{product.title}</strong>"? This action cannot be undone.
          </p>
          
          {product.storeMappings && product.storeMappings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    This product may be synced to stores. Deleting it here will not remove it from Shopify stores.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Duplicate Confirmation Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="Duplicate Product"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDuplicateModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDuplicate}>
              Duplicate Product
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          This will create a copy of "<strong>{product.title}</strong>" with all its variants and media. 
          The copy will be saved as a draft and can be edited before publishing.
        </p>
      </Modal>

      {/* Inventory Assignment Modal */}
      <InventoryAssignmentModal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        product={product}
        inventorySummary={inventorySummary}
      />
    </div>
  );
};

export default ProductDetail;
