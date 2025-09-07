import React from 'react';
import { cn } from '@/utils/cn.js';

/**
 * Progress Component
 * A reusable progress bar component
 */
export const Progress = ({ value = 0, max = 100, className = '', ...props }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn(
        "relative w-full bg-gray-200 rounded-full h-2 overflow-hidden",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-in-out rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
