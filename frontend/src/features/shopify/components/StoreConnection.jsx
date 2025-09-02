import React, { useState } from 'react';
import { Plus, Store, Settings, BarChart3, ExternalLink, Trash2 } from 'lucide-react';
import { useConnectedStores, useInitiateShopifyAuth, useDisconnectStore } from '../api/shopifyApi';

const StoreConnection = () => {
  const [shopDomain, setShopDomain] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: stores = [], isLoading, error } = useConnectedStores();
  const initiateAuth = useInitiateShopifyAuth();
  const disconnectStore = useDisconnectStore();

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!shopDomain.trim()) return;

    setIsConnecting(true);
    try {
      await initiateAuth.mutateAsync(shopDomain.trim());
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (storeId, shopName) => {
    if (window.confirm(`Are you sure you want to disconnect ${shopName}?`)) {
      try {
        await disconnectStore.mutateAsync(storeId);
      } catch (error) {
        console.error('Disconnect failed:', error);
      }
    }
  };

  const formatShopDomain = (domain) => {
    return domain.replace('.myshopify.com', '');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Connected Stores
        </h1>
        <p className="text-gray-600">
          Manage your Shopify store connections and view analytics
        </p>
      </div>

      {/* Connect new store form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Plus className="mr-2 h-5 w-5" />
          Connect New Store
        </h2>
        
        <form onSubmit={handleConnect} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="shop-domain" className="block text-sm font-medium text-gray-700 mb-2">
              Shop Domain
            </label>
            <div className="relative">
              <input
                id="shop-domain"
                type="text"
                placeholder="your-store"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isConnecting}
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">
                .myshopify.com
              </span>
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isConnecting || !shopDomain.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isConnecting ? 'Connecting...' : 'Connect Store'}
            </button>
          </div>
        </form>
        
        <p className="text-sm text-gray-500 mt-2">
          Enter your Shopify store domain without .myshopify.com
        </p>
      </div>

      {/* Connected stores list */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">
            Failed to load stores: {error.message}
          </p>
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No stores connected
          </h3>
          <p className="text-gray-600">
            Connect your first Shopify store to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => (
            <StoreCard
              key={store._id}
              store={store}
              onDisconnect={() => handleDisconnect(store._id, store.shopName)}
              onViewAnalytics={() => {
                // Navigate to analytics page
                window.location.href = `/stores/${store._id}/analytics`;
              }}
            />
          ))}
        </div>
      )}

      {/* OAuth callback success/error handling */}
      <OAuthCallbackHandler />
    </div>
  );
};

const StoreCard = ({ store, onDisconnect, onViewAnalytics }) => {
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatShopDomain = (domain) => {
    return domain.replace('.myshopify.com', '');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Store className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              {store.shopName}
            </h3>
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Connected
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            {formatShopDomain(store.shopDomain)} • 
            Connected on {formatDate(store.connectedAt)}
          </p>

          {/* Quick stats */}
          {store.analytics && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {store.analytics.totalOrders || 0}
                </p>
                <p className="text-sm text-gray-600">Orders</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(store.analytics.totalRevenue || 0, store.shopData?.currency)}
                </p>
                <p className="text-sm text-gray-600">Revenue</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {store.analytics.totalProducts || 0}
                </p>
                <p className="text-sm text-gray-600">Products</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2 ml-4">
          <button
            onClick={onViewAnalytics}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="View Analytics"
          >
            <BarChart3 className="h-5 w-5" />
          </button>
          
          <a
            href={`https://${store.shopDomain}/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
            title="Open Shopify Admin"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
          
          <button
            onClick={onDisconnect}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Disconnect Store"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const OAuthCallbackHandler = () => {
  const [callbackStatus, setCallbackStatus] = useState(null);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const store = urlParams.get('store');

    if (success === 'true') {
      setCallbackStatus({
        type: 'success',
        message: `Successfully connected ${store || 'store'}!`
      });
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Auto-hide after 5 seconds
      setTimeout(() => setCallbackStatus(null), 5000);
    } else if (error) {
      setCallbackStatus({
        type: 'error',
        message: 'Failed to connect store. Please try again.'
      });
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Auto-hide after 10 seconds
      setTimeout(() => setCallbackStatus(null), 10000);
    }
  }, []);

  if (!callbackStatus) return null;

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      callbackStatus.type === 'success' 
        ? 'bg-green-50 border border-green-200 text-green-800'
        : 'bg-red-50 border border-red-200 text-red-800'
    }`}>
      <div className="flex items-center">
        <span className="mr-2">
          {callbackStatus.type === 'success' ? '✅' : '❌'}
        </span>
        {callbackStatus.message}
        <button
          onClick={() => setCallbackStatus(null)}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default StoreConnection;
