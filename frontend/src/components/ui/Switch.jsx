import { Switch as HeadlessSwitch, Field, Label, Description } from '@headlessui/react'
import { cn } from '@/utils/cn'

const Switch = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
  labelClassName = '',
}) => {
  const sizes = {
    sm: {
      switch: 'h-4 w-7',
      thumb: 'h-3 w-3 data-[checked]:translate-x-3',
    },
    md: {
      switch: 'h-6 w-11',
      thumb: 'h-5 w-5 data-[checked]:translate-x-5',
    },
    lg: {
      switch: 'h-8 w-14',
      thumb: 'h-6 w-6 data-[checked]:translate-x-6',
    },
  }

  return (
    <Field className={cn('flex items-center', className)}>
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'group relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
          'focus:outline-none data-[focus]:ring-2 data-[focus]:ring-blue-500 data-[focus]:ring-offset-2',
          'data-[checked]:bg-blue-600 bg-gray-200 dark:bg-gray-700',
          'disabled:cursor-not-allowed disabled:opacity-50',
          sizes[size].switch
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            'translate-x-0',
            sizes[size].thumb
          )}
        />
      </HeadlessSwitch>
      
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <Label className={cn('text-sm font-medium text-gray-700 dark:text-gray-300', labelClassName)}>
              {label}
            </Label>
          )}
          {description && (
            <Description className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </Description>
          )}
        </div>
      )}
    </Field>
  )
}

export default Switch
