import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button.jsx';
import { classNames } from '@/lib/utils.js';

export const ActionBar = ({
  currentStep,
  totalSteps = 4,
  isStepValid,
  isLoading,
  onPrevious,
  onNext,
  onSubmit
}) => {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step <span className="font-semibold text-gray-900 dark:text-white">{currentStep}</span> of {totalSteps}
          </div>
          {!isStepValid && (
            <div className="flex items-center space-x-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span>Complete this step to continue</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Previous Button */}
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep || isLoading}
            className={classNames(
              "inline-flex items-center",
              isFirstStep || isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {/* Next/Submit Button */}
          {isLastStep ? (
            <Button
              onClick={onSubmit}
              disabled={!isStepValid || isLoading}
              className={classNames(
                "inline-flex items-center px-6 py-2.5 text-sm font-medium",
                !isStepValid || isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
              )}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Product...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!isStepValid || isLoading}
              className={classNames(
                "inline-flex items-center",
                !isStepValid || isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              )}
            >
              Next
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Progress Indicator */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div 
            className="bg-blue-500 dark:bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
