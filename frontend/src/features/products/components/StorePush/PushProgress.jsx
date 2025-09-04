import React from 'react';
import { Card } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export const PushProgress = ({ 
  progress, 
  product, 
  onRetry, 
  onCancel 
}) => {
  const { total, completed, current, status, error } = progress;

  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-8 w-8 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-8 w-8 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'syncing':
        return `Pushing to stores... (${completed}/${total})`;
      case 'completed':
        return `Successfully pushed to ${total} stores!`;
      case 'error':
        return 'Push failed';
      default:
        return 'Preparing to push...';
    }
  };

  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Card className="p-8">
      <div className="text-center space-y-6">
        {/* Status Icon */}
        <div className="flex justify-center">
          {getStatusIcon()}
        </div>

        {/* Status Message */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {getStatusMessage()}
          </h2>
          {current && (
            <p className="text-gray-600">
              Currently processing: {current}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {status === 'syncing' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        {/* Error Details */}
        {status === 'error' && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Progress Details */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{total}</div>
              <div className="text-sm text-gray-500">Total Stores</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{completed}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{total - completed}</div>
              <div className="text-sm text-gray-500">Remaining</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {status === 'error' && (
            <Button onClick={onRetry} variant="primary">
              Retry Push
            </Button>
          )}
          
          {status === 'completed' && (
            <Button onClick={onCancel} variant="outline">
              Back to Product
            </Button>
          )}

          {status === 'syncing' && (
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          )}
        </div>

        {/* Product Info */}
        <div className="border-t pt-6 text-left">
          <h3 className="font-medium text-gray-900 mb-2">Product Details</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Title:</strong> {product.title}</p>
            <p><strong>Vendor:</strong> {product.vendor}</p>
            <p><strong>Variants:</strong> {product.variants?.length || 0}</p>
            <p><strong>Options:</strong> {product.options?.length || 0}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
