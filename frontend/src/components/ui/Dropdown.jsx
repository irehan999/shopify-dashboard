import { Fragment, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { cn } from '@/utils/cn'

const Dropdown = ({
  trigger,
  children,
  align = 'right',
  width = 'w-48',
  className = '',
  portal = true,
}) => {
  const alignmentClasses = {
    left: 'origin-top-left left-0',
    right: 'origin-top-right right-0',
    center: 'origin-top left-1/2 transform -translate-x-1/2',
  }

  const [portalEl, setPortalEl] = useState(null)
  const buttonRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    let el = document.getElementById('dropdown-portal')
    if (!el) {
      el = document.createElement('div')
      el.id = 'dropdown-portal'
      document.body.appendChild(el)
    }
    setPortalEl(el)
  }, [])

  const updatePosition = () => {
    const btn = buttonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setPosition({
      top: rect.bottom + window.scrollY,
      left: align === 'right' ? rect.right + window.scrollX : rect.left + window.scrollX,
      width: rect.width,
    })
  }

  useEffect(() => {
    const onScroll = () => updatePosition()
    const onResize = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <div ref={buttonRef} onClick={updatePosition}>
            <MenuButton as={Fragment}>
              {trigger}
            </MenuButton>
          </div>

          {open && (
            portal && portalEl ? (
              createPortal(
                <MenuItems
                  static
                  className={cn(
                    'rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999]',
                    'border border-gray-200 dark:border-gray-700',
                    width,
                    className
                  )}
                  style={{
                    position: 'absolute',
                    top: position.top,
                    left: align === 'right' ? position.left - 200 : position.left, // Fixed right alignment
                    minWidth: position.width,
                  }}
                >
                  <div className="py-1">
                    {children}
                  </div>
                </MenuItems>,
                portalEl
              )
            ) : (
              <MenuItems
                static
                className={cn(
                  'absolute top-full mt-2 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999]',
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
            )
          )}
        </>
      )}
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
