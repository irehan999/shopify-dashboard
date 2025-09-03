import React, { useMemo, useState } from 'react';
import { Plus, Store, Settings, BarChart3, ExternalLink, Trash2, Link as LinkIcon } from 'lucide-react';
import { useConnectedStores, useInitiateShopifyAuth, useDisconnectStore, useLinkStore } from '../api/shopifyApi';

const StoreConnection = () => {
  const [shopDomain, setShopDomain] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: stores = [], isLoading, error } = useConnectedStores();
  const initiateAuthMutation = useInitiateShopifyAuth();
  const disconnectStore = useDisconnectStore();
  const linkStore = useLinkStore();

  // Detect a pending link token in query params as a manual fallback
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const pendingToken = urlParams.get('token');
  const pendingShop = urlParams.get('shop');

const handleConnect = async (e) => {
  e.preventDefault();
  if (!shopDomain.trim()) return;

  setIsConnecting(true);
  try {
    const cleaned = shopDomain.trim().toLowerCase();
    const fullDomain = cleaned.includes('.myshopify.com') ? cleaned : `${cleaned}.myshopify.com`;
    await initiateAuthMutation.mutateAsync(fullDomain);
  } catch (error) {
    console.error('Failed to initiate OAuth:', error);
    setIsConnecting(false);
  }
  // After mutateAsync completes, browser will redirect to OAuth
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
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {pendingToken && (
        <div className="mb-4 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 flex items-center justify-between">
          <div>
            <p className="text-blue-800 dark:text-blue-200 font-medium">Store link pending</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">A connection for <span className="font-semibold">{pendingShop}</span> is ready to link to your account.</p>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 disabled:opacity-50"
            disabled={linkStore.isPending}
            onClick={async () => {
              try {
                await linkStore.mutateAsync(pendingToken);
                // Clean URL and show success
                const newUrl = window.location.pathname + '?success=true&store=' + encodeURIComponent(pendingShop || 'store');
                window.history.replaceState({}, '', newUrl);
                // Optionally trigger a reload of stores via React Query invalidation occurs in hook
              } catch (e) {
                console.error('Manual link from Stores failed:', e);
              }
            }}
          >
            <LinkIcon className="h-4 w-4" /> {linkStore.isPending ? 'Linking…' : 'Link now'}
          </button>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Connected Stores
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your Shopify store connections and view analytics
        </p>
      </div>

      {/* Connect new store form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Plus className="mr-2 h-5 w-5" />
          Connect New Store
        </h2>
        
        <form onSubmit={handleConnect} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="shop-domain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Shop Domain
            </label>
            <div className="relative">
              <input
                id="shop-domain"
                type="text"
                placeholder="your-store"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isConnecting}
              />
              <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400 text-sm">
                .myshopify.com
              </span>
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isConnecting || !shopDomain.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isConnecting ? 'Connecting...' : 'Connect Store'}
            </button>
          </div>
        </form>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Enter your Shopify store domain without .myshopify.com
        </p>
      </div>

      {/* Connected stores list */}
      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">
            Failed to load stores: {error.message}
          </p>
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
          <Store className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No stores connected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Store className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {store.shopName}
            </h3>
            <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded-full">
              Connected
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {formatShopDomain(store.shopDomain)} • 
            Connected on {formatDate(store.connectedAt)}
          </p>

          {/* Basic details only for now; analytics to be implemented later */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Domain: <span className="font-medium">{store.shopDomain}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Email: <span className="font-medium">{store.shopEmail || '—'}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Plan: <span className="font-medium">{store.shopData?.plan || '—'}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Currency: <span className="font-medium">{store.shopData?.currency || '—'}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 ml-4">
          <button
            onClick={onViewAnalytics}
            className="p-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
            title="View Analytics"
          >
            <BarChart3 className="h-5 w-5" />
          </button>
          
          <a
            href={`https://${store.shopDomain}/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-green-600 dark:text-gray-500 dark:hover:text-green-400 transition-colors"
            title="Open Shopify Admin"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
          
          <button
            onClick={onDisconnect}
            className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
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
        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
    }`}>
      <div className="flex items-center">
        <span className="mr-2">
          {callbackStatus.type === 'success' ? '✅' : '❌'}
        </span>
        {callbackStatus.message}
        <button
          onClick={() => setCallbackStatus(null)}
          className="ml-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default StoreConnection;
