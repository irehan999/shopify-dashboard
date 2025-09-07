import React from 'react';
import { cn } from '@/utils/cn.js';

/**
 * CheckboxGroup Component
 * A reusable component for displaying a group of checkboxes
 */
export const CheckboxGroup = ({ 
  options = [], 
  value = [], 
  onChange, 
  className = '',
  compact = false 
}) => {
  const handleChange = (optionValue, checked) => {
    if (checked) {
      // Add to selection
      const newValue = [...value, optionValue];
      onChange(newValue);
    } else {
      // Remove from selection
      const newValue = value.filter(v => v !== optionValue);
      onChange(newValue);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {options.map((option) => {
        const optionValue = typeof option === 'string' ? option : option.value;
        const optionLabel = typeof option === 'string' ? option : option.label;
        const optionSubtitle = typeof option === 'object' ? option.subtitle : null;
        const isChecked = value.includes(optionValue);
        
        return (
          <label
            key={`checkbox-${optionValue}-${option.id || Math.random()}`}
            className={cn(
              "flex items-start space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors",
              compact && "p-1"
            )}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => handleChange(optionValue, e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1 min-w-0">
              <div className={cn(
                "font-medium text-gray-900",
                compact ? "text-sm" : "text-base"
              )}>
                {optionLabel}
              </div>
              {optionSubtitle && (
                <div className="text-xs text-gray-500 mt-1">
                  {optionSubtitle}
                </div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};

export default CheckboxGroup;
