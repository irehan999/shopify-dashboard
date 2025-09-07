import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Progress } from '@/components/ui/Progress.jsx';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

/**
 * Push Progress Component - New Implementation
 * Shows real-time progress of product push to multiple stores
 */
export const PushProgressCard = ({ 
  isActive, 
  progress, 
  onStart, 
  onCancel,
  selectedStores = [],
  isConfigurationValid = false 
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full animate-spin border-t-blue-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (!isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PlayIcon className="h-5 w-5 mr-2" />
            Ready to Push
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Product will be pushed to {selectedStores.length} selected store(s)</p>
              {!isConfigurationValid && (
                <p className="text-amber-600 mt-2">
                  ⚠️ Please configure at least one store before pushing
                </p>
              )}
            </div>
            
            <Button 
              onClick={onStart}
              disabled={!isConfigurationValid || selectedStores.length === 0}
              className="w-full"
            >
              Start Push to Stores
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { status, total, completed, current, results = [], error } = progress;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-gray-300 rounded-full animate-spin border-t-blue-500 mr-2" />
            Push Progress
          </div>
          {status === 'syncing' && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-600">{completed}/{total}</span>
          </div>
          <Progress value={(completed / total) * 100} className="w-full" />
        </div>

        {/* Current Store */}
        {current && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium text-blue-900">Currently Processing:</p>
            <p className="text-sm text-blue-700">{current.name || current.shop}</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Results:</h4>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span className="text-sm">{result.storeName || `Store ${index + 1}`}</span>
                  </div>
                  <Badge variant="outline" className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-medium text-red-900">Error:</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success/Completion State */}
        {status === 'completed' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-900">
                Push completed successfully!
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Product has been pushed to {completed} store(s)
            </p>
          </div>
        )}

        {/* Failed State */}
        {status === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-red-900">
                Push failed
              </span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              {error || 'An error occurred during the push process'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
