import React from 'react';
import { Button } from '@/components/ui/Button.jsx';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * ErrorScreen Component
 * A reusable error screen component
 */
export const ErrorScreen = ({ 
  title = "Something went wrong", 
  message = "An error occurred while loading the page.",
  actionLabel = "Try Again",
  onAction
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        {onAction && (
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
