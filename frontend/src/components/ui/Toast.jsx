import { Fragment } from 'react'
import { Transition } from '@headlessui/react'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'

const Toast = ({
  show = false,
  onClose,
  type = 'info',
  title,
  message,
  duration = 5000,
  className = '',
}) => {
  const icons = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  }

  const colors = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400',
  }

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  }

  const Icon = icons[type]

  // Auto-close toast after duration
  React.useEffect(() => {
    if (show && duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  return (
    <Transition
      appear
      show={show}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className={cn(
          'max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border transition-all duration-200',
          bgColors[type],
          className
        )}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className={cn('h-6 w-6', colors[type])} aria-hidden="true" />
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              {title && (
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {title}
                </p>
              )}
              {message && (
                <p className={cn(
                  'text-sm text-gray-500 dark:text-gray-300',
                  title ? 'mt-1' : ''
                )}>
                  {message}
                </p>
              )}
            </div>
            {onClose && (
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className={cn(
                    'rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  )}
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Transition>
  )
}

export { Toast }
