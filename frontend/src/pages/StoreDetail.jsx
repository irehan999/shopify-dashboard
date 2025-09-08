import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  ArrowTopRightOnSquareIcon,
  TagIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'

const statusConfig = {
  active: {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: CheckCircleIcon
  },
  syncing: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: ClockIcon
  },
  error: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: ExclamationCircleIcon
  },
  paused: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: ExclamationTriangleIcon
  }
}

export default function StoreDetail() {
  const { storeId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('products')
  const [productsPage, setProductsPage] = useState(1)
  const [productsFilter, setProductsFilter] = useState('all')

  console.log('StoreDetail - Store ID:', storeId, 'Active tab:', activeTab);

  // Fetch store details
  const { data: storeData, isLoading: storeLoading, error: storeError } = useQuery({
    queryKey: ['store-details', storeId],
    queryFn: async () => {
      console.log('Fetching store details for:', storeId);
      const response = await api.get(`/api/stores/${storeId}`)
      console.log('Store details response:', response);
      return response.data
    },
    enabled: !!storeId
  })

  // Fetch store statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['store-stats', storeId],
    queryFn: async () => {
      console.log('Fetching store stats for:', storeId);
      const response = await api.get(`/api/stores/${storeId}/stats`)
      console.log('Store stats response:', response);
      return response.data
    },
    enabled: !!storeId
  })

  // Fetch pushed products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['store-products', storeId, productsPage, productsFilter],
    queryFn: async () => {
      console.log('Fetching store products for:', storeId, 'page:', productsPage, 'filter:', productsFilter);
      const params = new URLSearchParams({
        page: productsPage.toString(),
        limit: '12'
      })
      
      if (productsFilter !== 'all') {
        params.append('status', productsFilter)
      }
      
      const response = await api.get(`/api/stores/${storeId}/products?${params}`)
      console.log('Store products response:', response);
      return response.data
    },
    enabled: !!storeId && activeTab === 'products'
  })

  // Fetch sync history
  const { data: syncHistoryData, isLoading: syncHistoryLoading } = useQuery({
    queryKey: ['store-sync-history', storeId],
    queryFn: async () => {
      console.log('Fetching sync history for:', storeId);
      const response = await api.get(`/api/stores/${storeId}/sync-history?limit=50`)
      console.log('Sync history response:', response);
      return response.data
    },
    enabled: !!storeId && activeTab === 'sync-history'
  })

  const store = storeData?.data
  const stats = statsData?.data
  const products = productsData?.data?.products || []
  const productsPagination = productsData?.data?.pagination || {}
  const syncHistory = syncHistoryData?.data?.syncHistory || []

  console.log('Rendered data - Store:', store?.shopName, 'Stats:', stats, 'Products:', products.length);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString()
  }

  const formatPrice = (price) => {
    if (!price) return 'N/A'
    return `$${parseFloat(price).toFixed(2)}`
  }

  const renderStoreHeader = () => (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/stores')}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {store?.shopName || 'Store Details'}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600 dark:text-gray-400">
              {store?.shopDomain}
            </p>
            {store?.shopDomain && (
              <a
                href={`https://${store.shopDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Visit Store
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Store Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <CubeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.productStats?.totalPushed || 0}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Products Pushed
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.productStats?.active || 0}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Products
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.productStats?.syncing || 0}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Syncing
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <ExclamationCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.productStats?.errors || 0}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Errors
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'products', label: 'Pushed Products', icon: CubeIcon },
            { id: 'sync-history', label: 'Sync History', icon: ClockIcon },
            { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )

  const renderProductCard = (product) => {
    const config = statusConfig[product.mapping?.status] || statusConfig.active
    const StatusIcon = config.icon

    return (
      <div
        key={product._id}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
      >
        {/* Product Image */}
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-800">
          {product.media && product.media.length > 0 ? (
            <img
              src={product.media[0].src || product.media[0].url}
              alt={product.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center">
              <CubeIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
              {product.title}
            </h3>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.border} border`}>
              <StatusIcon className={`w-3 h-3 ${config.color}`} />
              <span className={config.color}>
                {product.mapping?.status || 'active'}
              </span>
            </div>
          </div>

          {/* Price */}
          {product.variants && product.variants.length > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <CurrencyDollarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatPrice(product.variants[0].price)}
              </span>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <TagIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {product.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {product.tags.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    +{product.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mapping Info */}
          <div className="space-y-2 text-xs text-gray-500 dark:text-gray-500">
            <div className="flex justify-between">
              <span>Shopify ID:</span>
              <span className="font-mono">{product.mapping?.shopifyProductId || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Sync:</span>
              <span>{formatTimeAgo(product.mapping?.lastSyncAt)}</span>
            </div>
            {product.mapping?.lastSyncError && (
              <div className="text-red-500 dark:text-red-400 text-xs">
                Error: {product.mapping.lastSyncError}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigate(`/products/${product._id}`)}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <EyeIcon className="w-4 h-4" />
              View Details
            </button>
            
            <button
              onClick={() => navigate(`/products/${product._id}/edit`)}
              className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderProductsTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All Products' },
            { value: 'active', label: 'Active' },
            { value: 'syncing', label: 'Syncing' },
            { value: 'error', label: 'Errors' },
            { value: 'paused', label: 'Paused' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setProductsFilter(filter.value)
                setProductsPage(1)
              }}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${productsFilter === filter.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {productsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <CubeIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No products found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {productsFilter === 'all' 
              ? "No products have been pushed to this store yet."
              : `No ${productsFilter} products found.`
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(renderProductCard)}
          </div>

          {/* Pagination */}
          {productsPagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((productsPagination.currentPage - 1) * productsPagination.itemsPerPage) + 1} to{' '}
                {Math.min(productsPagination.currentPage * productsPagination.itemsPerPage, productsPagination.totalItems)} of{' '}
                {productsPagination.totalItems} products
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProductsPage(productsPage - 1)}
                  disabled={!productsPagination.hasPrevPage}
                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                  Page {productsPagination.currentPage} of {productsPagination.totalPages}
                </span>
                
                <button
                  onClick={() => setProductsPage(productsPage + 1)}
                  disabled={!productsPagination.hasNextPage}
                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderSyncHistoryTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Sync History
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Recent sync activities for products in this store
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {syncHistoryLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading sync history...</p>
            </div>
          ) : syncHistory.length === 0 ? (
            <div className="p-6 text-center">
              <ClockIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No sync history
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No sync activities recorded for this store yet.
              </p>
            </div>
          ) : (
            syncHistory.map((sync, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    ${sync.success ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}
                  `}>
                    {sync.success ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {sync.productTitle}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {sync.syncType} sync • {formatTimeAgo(sync.timestamp)}
                        </p>
                        {!sync.success && sync.error && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            Error: {sync.error}
                          </p>
                        )}
                      </div>
                      
                      <span className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${sync.success 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                        }
                      `}>
                        {sync.success ? 'Success' : 'Failed'}
                      </span>
                    </div>

                    {/* Changes */}
                    {sync.changes && sync.changes.length > 0 && (
                      <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                        <p className="font-medium mb-1">Changes:</p>
                        <ul className="space-y-1">
                          {sync.changes.map((change, changeIndex) => (
                            <li key={changeIndex}>
                              <span className="font-mono">{change.field}</span>: 
                              <span className="ml-1">
                                {JSON.stringify(change.oldValue)} → {JSON.stringify(change.newValue)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Duration */}
                    {sync.syncDuration && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        Duration: {sync.syncDuration}ms
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Analytics Coming Soon
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Detailed analytics and insights for this store will be available soon.
        </p>
      </div>
    </div>
  )

  if (storeError) {
    console.error('Store detail error:', storeError);
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Failed to load store
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {storeError.response?.data?.message || storeError.message}
          </p>
          <button
            onClick={() => navigate('/stores')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Stores
          </button>
        </div>
      </div>
    )
  }

  if (storeLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading store details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {renderStoreHeader()}
      
      <div className="mt-6">
        {activeTab === 'products' && renderProductsTab()}
        {activeTab === 'sync-history' && renderSyncHistoryTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  )
}
