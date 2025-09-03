import { Fragment } from 'react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition, Field, Label } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { cn } from '@/utils/cn'

const Select = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  className = '',
  buttonClassName = '',
}) => {
  const selectedOption = options.find(option => option.value === value)

  return (
    <Field className={cn('space-y-2', className)}>
      {label && (
        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </Label>
      )}
      
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <ListboxButton
            className={cn(
              'relative w-full cursor-pointer rounded-md border py-2 pl-3 pr-10 text-left transition-colors duration-200',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
              'focus:outline-none data-[focus]:ring-2 data-[focus]:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-red-300 dark:border-red-600 data-[focus]:border-red-500 data-[focus]:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 data-[focus]:border-blue-500 data-[focus]:ring-blue-500',
              buttonClassName
            )}
          >
            <span className="block truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </ListboxButton>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 dark:border-gray-700">
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={({ focus, selected, disabled: isDisabled }) =>
                    cn(
                      'relative cursor-pointer select-none py-2 pl-10 pr-4 transition-colors duration-200',
                      focus && !isDisabled
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                        : 'text-gray-900 dark:text-white',
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )
                  }
                >
                  {({ selected, focus }) => (
                    <>
                      <span className={cn('block truncate', selected ? 'font-medium' : 'font-normal')}>
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </Field>
  )
}

export { Select }
