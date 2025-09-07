import React from 'react';
import { cn } from '@/utils/cn.js';

/**
 * Checkbox Component
 * A reusable checkbox component
 */
export const Checkbox = ({ 
  checked = false, 
  onChange, 
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
};
