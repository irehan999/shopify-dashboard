import React from 'react';
import { useSyncStatus } from '../../hooks/useShopifySync.js';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export const SyncStatusTracker = ({ 
  isCreating, 
  isSyncing, 
  syncProgress, 
  createdProduct 
}) => {
  // Get real-time sync status if product is created
  const { data: syncStatuses, isLoading: statusLoading } = useSyncStatus(createdProduct?.id);

  const getStatusIcon = (status) => {
    const iconProps = { className: "w-4 h-4" };
    
    switch (status) {
      case 'pending':
        return (
          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock {...iconProps} className="text-yellow-600" />
          </div>
        );
      case 'syncing':
        return (
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <RefreshCw {...iconProps} className="text-blue-600 animate-spin" />
          </div>
        );
      case 'completed':
      case 'success':
        return (
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle {...iconProps} className="text-green-600" />
          </div>
        );
      case 'failed':
      case 'error':
        return (
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle {...iconProps} className="text-red-600" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
            <AlertCircle {...iconProps} className="text-gray-600" />
          </div>
        );
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Main Status */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <RefreshCw className={`h-5 w-5 text-blue-600 ${(isCreating || isSyncing) ? 'animate-spin' : ''}`} />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            {isCreating ? 'Creating Product...' : 
             isSyncing ? 'Syncing to Stores...' : 
             'Product Status'}
          </h3>
          <p className="text-sm text-gray-600">
            {isCreating 
              ? 'Setting up your product in the dashboard'
              : syncProgress?.type === 'all'
                ? `Syncing to all ${syncProgress.total} stores`
                : syncProgress?.type === 'selected'
                  ? `Syncing to ${syncProgress.total} selected stores`
                  : syncProgress?.storeIds?.length
                    ? `Syncing to ${syncProgress.storeIds.length} stores`
                    : 'Ready for store deployment'
            }
          </p>
        </div>
      </div>

      {/* Progress Bar (if syncing) */}
      {syncProgress && (syncProgress.completed !== undefined) && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{syncProgress.completed}/{syncProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.round((syncProgress.completed / syncProgress.total) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Detailed Sync Status */}
      {syncStatuses && syncStatuses.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Store Sync Status
          </h4>
          <div className="space-y-2">
            {syncStatuses.map((syncStatus) => (
              <div key={syncStatus.storeId} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(syncStatus.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {syncStatus.storeName || syncStatus.storeId}
                    </p>
                    {syncStatus.error && (
                      <p className="text-xs text-red-600">
                        {syncStatus.error}
                      </p>
                    )}
                    {syncStatus.shopifyProductId && (
                      <p className="text-xs text-gray-500">
                        Shopify ID: {syncStatus.shopifyProductId}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(syncStatus.status)}`}>
                  {syncStatus.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {statusLoading && createdProduct && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-4 h-4 animate-spin text-gray-400 mr-2" />
            <span className="text-sm text-gray-500">Loading sync status...</span>
          </div>
        </div>
      )}

      {/* No Sync Data */}
      {!statusLoading && createdProduct && (!syncStatuses || syncStatuses.length === 0) && (
        <div className="border-t pt-4">
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No sync activity yet</p>
            <p className="text-xs text-gray-400">Product is ready for store deployment</p>
          </div>
        </div>
      )}
    </div>
  );
};
