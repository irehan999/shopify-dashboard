import React from 'react';
import { useSyncStatus } from '../../hooks/useShopifySync.js';

export const SyncStatusTracker = ({ 
  isCreating, 
  isSyncing, 
  syncProgress, 
  createdProduct 
}) => {
  // Get real-time sync status if product is created
  const { data: syncStatuses } = useSyncStatus(createdProduct?.id);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
        );
      case 'syncing':
        return (
          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="animate-spin h-3 w-3 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      case 'completed':
        return (
          <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="h-3 w-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Main Status */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            {isCreating ? 'Creating Product...' : 'Syncing to Stores...'}
          </h3>
          <p className="text-sm text-gray-600">
            {isCreating 
              ? 'Setting up your product in the dashboard'
              : syncProgress?.type === 'all'
                ? `Syncing to all ${syncProgress.total} stores`
                : syncProgress?.type === 'selected'
                  ? `Syncing to ${syncProgress.total} selected stores`
                  : 'Pushing product to Shopify stores'
            }
          </p>
        </div>
      </div>

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
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  syncStatus.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : syncStatus.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : syncStatus.status === 'syncing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {syncStatus.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
