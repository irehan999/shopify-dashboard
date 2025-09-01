import { forwardRef } from 'react'
import { Input as HeadlessInput, Field, Label, Description } from '@headlessui/react'
import { cn } from '@/utils/cn'

const Input = forwardRef(({
  label,
  description,
  error,
  className = '',
  containerClassName = '',
  required = false,
  ...props
}, ref) => {
  return (
    <Field className={cn('space-y-2', containerClassName)}>
      {label && (
        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <HeadlessInput
        ref={ref}
        className={cn(
          'block w-full rounded-md border px-3 py-2 text-sm transition-colors duration-200',
          'placeholder:text-gray-400 dark:placeholder:text-gray-500',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          'data-[focus]:outline-none data-[focus]:ring-2 data-[focus]:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Error state
          error
            ? 'border-red-300 dark:border-red-600 data-[focus]:border-red-500 data-[focus]:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 data-[focus]:border-blue-500 data-[focus]:ring-blue-500',
          className
        )}
        {...props}
      />
      
      {(description || error) && (
        <div className="text-sm">
          {error ? (
            <Description className="text-red-600 dark:text-red-400">{error}</Description>
          ) : description ? (
            <Description className="text-gray-500 dark:text-gray-400">{description}</Description>
          ) : null}
        </div>
      )}
    </Field>
  )
})

Input.displayName = 'Input'

export default Input
