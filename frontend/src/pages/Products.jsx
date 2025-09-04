import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ShoppingBagIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'

// Import headless UI components
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import Dropdown from '@/components/ui/Dropdown'

// Import product hooks
import { useProducts, useDeleteProduct } from '@/features/products/hooks/useProductApi'
import { formatCurrency } from '@/utils/currency'
import { toast } from 'react-hot-toast'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

const statusColors = {
  published: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400',
  draft: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400',
  archived: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400',
}

export default function Products() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Fetch products from API
  const { 
    data: productsResponse, 
    isLoading, 
    error,
    refetch 
  } = useProducts({
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: 1,
    limit: 50
  })

  const deleteProduct = useDeleteProduct()

  // Filter products based on search and status
  const filteredProducts = useMemo(() => {
    if (!productsResponse?.data?.products) return []
    
    let filtered = productsResponse.data.products

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(product => 
        product.title?.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search) ||
        product.tags?.some(tag => tag.toLowerCase().includes(search))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter)
    }

    return filtered
  }, [productsResponse?.data?.products, searchTerm, statusFilter])

  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct.mutateAsync(productId)
      toast.success('Product deleted successfully!')
      setDeleteConfirm(null)
      refetch()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  // Handle navigation to product creation
  const handleCreateProduct = () => {
    navigate('/products/create')
  }

  // Handle product actions
  const handleViewProduct = (productId) => {
    navigate(`/products/${productId}`);
  }

  const handleEditProduct = (productId) => {
    // Navigate to product edit page (to be implemented)
    navigate(`/products/${productId}/edit`);
  }

  const handlePushToStores = (productId) => {
    navigate(`/products/${productId}/push`);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage products across all your stores
          </p>
        </div>
        <Button
          onClick={handleCreateProduct}
          className="inline-flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            placeholder="Filter by status"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading products
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error?.message || 'Something went wrong. Please try again.'}
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Variants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stores
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0">
                          {product.media && product.media.length > 0 ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.media[0].url || product.media[0].preview}
                              alt={product.media[0].alt || product.title}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <ShoppingBagIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {product.description ? 
                              product.description.length > 50 
                                ? `${product.description.substring(0, 50)}...` 
                                : product.description
                              : 'No description'
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={product.status === 'published' ? 'default' : 'secondary'}
                        className={statusColors[product.status]}
                      >
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {product.variants && product.variants.length > 0 ? (
                        (() => {
                          const prices = product.variants
                            .map(v => parseFloat(v.price || 0))
                            .filter(p => p > 0)
                          if (prices.length === 0) return 'No price'
                          const min = Math.min(...prices)
                          const max = Math.max(...prices)
                          return min === max 
                            ? formatCurrency(min)
                            : `${formatCurrency(min)} - ${formatCurrency(max)}`
                        })()
                      ) : 'No variants'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {product.variants ? product.variants.length : 0} variant{product.variants?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {product.storeMappings && product.storeMappings.length > 0 ? (
                          product.storeMappings.slice(0, 2).map((mapping, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {mapping.storeName || `Store ${mapping.storeId}`}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400">No stores</span>
                        )}
                        {product.storeMappings && product.storeMappings.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.storeMappings.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Dropdown
                        trigger={
                          <Button variant="ghost" size="sm" className="p-2">
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </Button>
                        }
                      >
                        <Dropdown.Item
                          onClick={() => handleViewProduct(product.id)}
                          icon={EyeIcon}
                        >
                          View Details
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => handleEditProduct(product.id)}
                          icon={PencilIcon}
                        >
                          Edit Product
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => handlePushToStores(product.id)}
                          icon={ArrowTopRightOnSquareIcon}
                        >
                          Push to Stores
                        </Dropdown.Item>
                        <Dropdown.Separator />
                        <Dropdown.Item
                          onClick={() => setDeleteConfirm(product)}
                          icon={TrashIcon}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete Product
                        </Dropdown.Item>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first product.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <div className="mt-6">
                  <Button onClick={handleCreateProduct}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create your first product
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Product"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleteProduct.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDeleteProduct(deleteConfirm.id)}
              loading={deleteProduct.isPending}
            >
              Delete Product
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete "<strong>{deleteConfirm?.title}</strong>"? This action cannot be undone.
          </p>
          
          {deleteConfirm?.storeMappings && deleteConfirm.storeMappings.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Warning
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    This product is currently synced to {deleteConfirm.storeMappings.length} store{deleteConfirm.storeMappings.length !== 1 ? 's' : ''}. 
                    Deleting it here will not remove it from your Shopify stores.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
