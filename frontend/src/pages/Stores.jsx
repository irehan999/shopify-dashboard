import { useState } from 'react'
import { 
  BuildingStorefrontIcon, 
  PlusIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const stores = [
  {
    id: 1,
    name: 'Electronics Store',
    domain: 'electronics-store.myshopify.com',
    status: 'connected',
    lastSync: '2 minutes ago',
    products: 156,
    orders: 1234,
  },
  {
    id: 2,
    name: 'Fashion Boutique',
    domain: 'fashion-boutique.myshopify.com',
    status: 'connected',
    lastSync: '1 hour ago',
    products: 89,
    orders: 567,
  },
  {
    id: 3,
    name: 'Home & Garden',
    domain: 'home-garden.myshopify.com',
    status: 'error',
    lastSync: '2 days ago',
    products: 234,
    orders: 890,
    error: 'API token expired',
  },
]

export default function Stores() {
  const [showConnectModal, setShowConnectModal] = useState(false)

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <div className="h-5 w-5 bg-gray-300 rounded-full" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Connected Stores
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your Shopify store connections
          </p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Connect Store
        </button>
      </div>

      {/* Stores Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <div
            key={store.id}
            className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-200"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <BuildingStorefrontIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {store.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {store.domain}
                    </p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center space-x-2">
                {getStatusIcon(store.status)}
                <span className={`text-sm font-medium ${
                  store.status === 'connected' 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {getStatusText(store.status)}
                </span>
              </div>

              {/* Error message */}
              {store.error && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {store.error}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Products</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {store.products}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Orders</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {store.orders}
                  </p>
                </div>
              </div>

              {/* Last sync */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last sync: {store.lastSync}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-4 flex space-x-2">
                <button className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-2 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                  Sync Now
                </button>
                <button className="flex-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-2 rounded text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors duration-200">
                  Configure
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Connect Store Modal Placeholder */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Connect New Store
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect store modal will be implemented here with OAuth flow.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors duration-200">
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
