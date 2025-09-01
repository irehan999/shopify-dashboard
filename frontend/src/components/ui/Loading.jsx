import { cn } from '@/utils/cn'

const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400',
        sizes[size],
        className
      )}
    />
  )
}

const Loading = ({
  type = 'spinner',
  size = 'md',
  overlay = false,
  text,
  className = '',
}) => {
  const LoadingComponent = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse',
                  size === 'xs' && 'h-1 w-1',
                  size === 'sm' && 'h-2 w-2',
                  size === 'md' && 'h-3 w-3',
                  size === 'lg' && 'h-4 w-4',
                  size === 'xl' && 'h-6 w-6'
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s',
                }}
              />
            ))}
          </div>
        )
      
      case 'pulse':
        return (
          <div
            className={cn(
              'rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse',
              size === 'xs' && 'h-3 w-3',
              size === 'sm' && 'h-4 w-4',
              size === 'md' && 'h-6 w-6',
              size === 'lg' && 'h-8 w-8',
              size === 'xl' && 'h-12 w-12'
            )}
          />
        )
      
      default:
        return <Spinner size={size} />
    }
  }

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70">
        <div className={cn(
          'flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg',
          className
        )}>
          <LoadingComponent />
          {text && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{text}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <LoadingComponent />
      {text && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{text}</p>
      )}
    </div>
  )
}

Loading.Spinner = Spinner

export default Loading
