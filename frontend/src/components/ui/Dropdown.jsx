import { Fragment } from 'react'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { cn } from '@/utils/cn'

const Dropdown = ({
  trigger,
  children,
  align = 'right',
  width = 'w-48',
  className = '',
}) => {
  const alignmentClasses = {
    left: 'origin-top-left left-0',
    right: 'origin-top-right right-0',
    center: 'origin-top left-1/2 transform -translate-x-1/2',
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton as={Fragment}>
          {trigger}
        </MenuButton>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems
          className={cn(
            'absolute mt-2 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50',
            'border border-gray-200 dark:border-gray-700',
            width,
            alignmentClasses[align],
            className
          )}
        >
          <div className="py-1">
            {children}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  )
}

// Dropdown Item component
const DropdownItem = ({
  children,
  onClick,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  return (
    <MenuItem disabled={disabled}>
      {({ focus, disabled: isDisabled }) => (
        <button
          onClick={onClick}
          className={cn(
            'group flex w-full items-center px-4 py-2 text-sm transition-colors duration-200',
            focus && !isDisabled
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              : 'text-gray-700 dark:text-gray-300',
            isDisabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          disabled={isDisabled}
          {...props}
        >
          {Icon && <Icon className="mr-3 h-4 w-4" />}
          {children}
        </button>
      )}
    </MenuItem>
  )
}

// Dropdown Separator component
const DropdownSeparator = ({ className = '' }) => {
  return (
    <div className={cn('border-t border-gray-100 dark:border-gray-700 my-1', className)} />
  )
}

// Dropdown Label component
const DropdownLabel = ({ children, className = '' }) => {
  return (
    <div className={cn('px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider', className)}>
      {children}
    </div>
  )
}

// Attach subcomponents
Dropdown.Item = DropdownItem
Dropdown.Separator = DropdownSeparator
Dropdown.Label = DropdownLabel

export default Dropdown
export { DropdownItem, DropdownSeparator, DropdownLabel }
