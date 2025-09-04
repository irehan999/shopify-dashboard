import React from 'react';
import { CheckIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const steps = [
  { id: 1, name: 'Basic Info', description: 'Product details' },
  { id: 2, name: 'Options', description: 'Product variations' },
  { id: 3, name: 'Variants', description: 'Pricing & inventory' },
  { id: 4, name: 'Media', description: 'Images & videos' },
  { id: 5, name: 'Stores', description: 'Sync settings' }
];

export const StepIndicator = ({ currentStep, completedSteps, totalSteps }) => {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex items-center">
              <div className="relative flex items-center justify-center">
                {completedSteps.has(step.id) ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-white" />
                  </div>
                ) : currentStep === step.id ? (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{step.id}</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 text-sm font-medium">{step.id}</span>
                  </div>
                )}
              </div>
              
              <div className="ml-3 min-w-0">
                <p className={`text-sm font-medium ${
                  currentStep === step.id ? 'text-blue-600' : 
                  completedSteps.has(step.id) ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              
              {stepIdx !== steps.length - 1 && (
                <div className="flex-1 flex justify-center">
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};
