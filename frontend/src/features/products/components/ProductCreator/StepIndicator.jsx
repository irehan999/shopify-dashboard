import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { classNames } from '@/lib/utils.js';

const steps = [
  { id: 1, name: 'Basic Info', description: 'Product details' },
  { id: 2, name: 'Options', description: 'Product variations' },
  { id: 3, name: 'Variants', description: 'Pricing & inventory' },
  { id: 4, name: 'Media', description: 'Images & videos' }
];

export const StepIndicator = ({ currentStep, completedSteps, totalSteps = 4 }) => {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className="relative flex flex-col items-center">
            {/* Step Circle */}
            <div className="relative flex items-center justify-center">
              {completedSteps.has(step.id) ? (
                <div className="w-10 h-10 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800">
                  <CheckIcon className="w-5 h-5 text-white" />
                </div>
              ) : currentStep === step.id ? (
                <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800 ring-4 ring-blue-100 dark:ring-blue-900/30">
                  <span className="text-white text-sm font-semibold">{step.id}</span>
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shadow border-4 border-white dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{step.id}</span>
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="mt-3 text-center">
              <p className={classNames(
                "text-sm font-medium transition-colors duration-200",
                currentStep === step.id 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : completedSteps.has(step.id) 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-500 dark:text-gray-400'
              )}>
                {step.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {step.description}
              </p>
            </div>

            {/* Connection Line */}
            {stepIdx !== steps.length - 1 && (
              <div className="absolute top-5 left-full w-full h-0.5 bg-gray-200 dark:bg-gray-700 transform -translate-y-0.5" style={{ width: 'calc(100vw / 4 - 2.5rem)' }}>
                <div 
                  className={classNames(
                    "h-full transition-all duration-300",
                    completedSteps.has(step.id) 
                      ? "bg-green-500 dark:bg-green-600" 
                      : currentStep === step.id 
                        ? "bg-blue-500 dark:bg-blue-600" 
                        : "bg-gray-200 dark:bg-gray-700"
                  )}
                  style={{ 
                    width: completedSteps.has(step.id) 
                      ? '100%' 
                      : currentStep === step.id 
                        ? '50%' 
                        : '0%' 
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
