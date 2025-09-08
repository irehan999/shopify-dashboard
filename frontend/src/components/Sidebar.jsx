import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  BuildingStorefrontIcon,
  BellIcon,
  CogIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Stores', href: '/stores', icon: BuildingStorefrontIcon },
  { name: 'Products', href: '/products', icon: ShoppingBagIcon },
  { name: 'Notifications', href: '/notifications', icon: BellIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BuildingStorefrontIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Shopify Hub
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200
                  ${isActive 
                    ? 'text-blue-500' 
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                  }
                `}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Shopify Dashboard v1.0
        </div>
      </div>
    </div>
  )
}
