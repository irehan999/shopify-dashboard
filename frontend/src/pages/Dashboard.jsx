import { 
  ChartBarIcon, 
  BuildingStorefrontIcon, 
  ShoppingBagIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

const stats = [
  {
    name: 'Total Revenue',
    value: '$45,231',
    change: '+12.5%',
    changeType: 'positive',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Connected Stores',
    value: '8',
    change: '+2',
    changeType: 'positive',
    icon: BuildingStorefrontIcon,
  },
  {
    name: 'Total Products',
    value: '1,234',
    change: '+45',
    changeType: 'positive',
    icon: ShoppingBagIcon,
  },
  {
    name: 'Active Users',
    value: '573',
    change: '-2.1%',
    changeType: 'negative',
    icon: UsersIcon,
  },
]

const recentActivity = [
  {
    id: 1,
    type: 'product_created',
    title: 'New product created',
    description: 'iPhone 15 Pro Max added to Electronics Store',
    time: '2 minutes ago',
    icon: ShoppingBagIcon,
  },
  {
    id: 2,
    type: 'store_connected',
    title: 'Store connected',
    description: 'Fashion Boutique successfully connected',
    time: '1 hour ago',
    icon: BuildingStorefrontIcon,
  },
  {
    id: 3,
    type: 'product_synced',
    title: 'Products synced',
    description: '15 products synced to 3 stores',
    time: '3 hours ago',
    icon: ChartBarIcon,
  },
]

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Overview of your Shopify stores and products
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                </div>
                <div className={`
                  inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium
                  ${stat.changeType === 'positive' 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                  }
                `}>
                  <ArrowTrendingUpIcon className={`
                    -ml-1 mr-0.5 flex-shrink-0 self-center h-4 w-4 
                    ${stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500 rotate-180'}
                  `} />
                  <span className="sr-only">
                    {stat.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                  </span>
                  {stat.change}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Chart placeholder */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Revenue Overview
              </h3>
            </div>
            <div className="p-6">
              <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Chart will be implemented here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Recent Activity
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <activity.icon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
