import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  BellIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'

// Notification type icons and colors
const notificationConfig = {
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    titleColor: 'text-green-800 dark:text-green-200'
  },
  error: {
    icon: ExclamationCircleIcon,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-800 dark:text-red-200'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    titleColor: 'text-yellow-800 dark:text-yellow-200'
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleColor: 'text-blue-800 dark:text-blue-200'
  },
  store: {
    icon: InformationCircleIcon,
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-600 dark:text-purple-400',
    titleColor: 'text-purple-800 dark:text-purple-200'
  },
  product: {
    icon: InformationCircleIcon,
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    titleColor: 'text-indigo-800 dark:text-indigo-200'
  },
  sync: {
    icon: ClockIcon,
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-600',
    iconColor: 'text-gray-600 dark:text-gray-400',
    titleColor: 'text-gray-800 dark:text-gray-200'
  }
}

export default function Notifications() {
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  // Debug console logs
  console.log('Notifications - Current filter:', filter, 'page:', page);

  // Fetch notifications
  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications', filter, page],
    queryFn: async () => {
      console.log('Fetching notifications with filter:', filter, 'page:', page);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (filter !== 'all') {
        params.append('type', filter)
      }
      
      const response = await api.get(`/api/notifications?${params}`)
      console.log('Notifications API response:', response);
      return response.data
    }
  })

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await api.get('/api/notifications/unread-count')
      console.log('Unread count response:', response);
      return response.data
    }
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      console.log('Marking notification as read:', notificationId);
      const response = await api.patch(`/api/notifications/${notificationId}/read`)
      console.log('Mark as read response:', response);
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      toast.success('Notification marked as read')
    },
    onError: (error) => {
      console.error('Mark as read error:', error);
      toast.error(error.response?.data?.message || 'Failed to mark as read')
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log('Marking all notifications as read');
      const response = await api.patch('/api/notifications/mark-all-read')
      console.log('Mark all as read response:', response);
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      toast.success('All notifications marked as read')
    },
    onError: (error) => {
      console.error('Mark all as read error:', error);
      toast.error(error.response?.data?.message || 'Failed to mark all as read')
    }
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      console.log('Deleting notification:', notificationId);
      const response = await api.delete(`/api/notifications/${notificationId}`)
      console.log('Delete notification response:', response);
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      toast.success('Notification deleted')
    },
    onError: (error) => {
      console.error('Delete notification error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete notification')
    }
  })

  const notifications = notificationsData?.data?.notifications || []
  const pagination = notificationsData?.data?.pagination || {}
  const unreadCount = unreadData?.data?.unreadCount || 0

  console.log('Rendered notifications:', notifications.length, 'unread:', unreadCount);

  const filterOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'store', label: 'Store' },
    { value: 'product', label: 'Product' },
    { value: 'sync', label: 'Sync' },
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Error' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' }
  ]

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString()
  }

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id)
    }
    
    // Navigate to link if provided
    if (notification.link) {
      window.location.href = notification.link
    }
  }

  const renderNotificationItem = (notification) => {
    const config = notificationConfig[notification.type] || notificationConfig.info
    const IconComponent = config.icon

    return (
      <div
        key={notification._id}
        className={`
          p-4 border rounded-lg transition-all duration-200 cursor-pointer
          ${config.bgColor} ${config.borderColor}
          ${!notification.isRead ? 'shadow-sm' : 'opacity-75'}
          hover:shadow-md
        `}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            ${config.bgColor}
          `}>
            <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className={`text-sm font-medium ${config.titleColor}`}>
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {notification.message}
                </p>
                
                {/* Metadata */}
                {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    {JSON.stringify(notification.metadata, null, 2).length < 100 ? (
                      <pre className="whitespace-pre-wrap font-mono">
                        {JSON.stringify(notification.metadata, null, 2)}
                      </pre>
                    ) : (
                      <span>Additional details available</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {!notification.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsReadMutation.mutate(notification._id)
                    }}
                    disabled={markAsReadMutation.isPending}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Mark as read"
                  >
                    <CheckIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNotificationMutation.mutate(notification._id)
                  }}
                  disabled={deleteNotificationMutation.isPending}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                  title="Delete notification"
                >
                  <TrashIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-red-600" />
                </button>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {formatTimeAgo(notification.createdAt)}
              </span>
              
              {!notification.isRead && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                  Unread
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    console.error('Notifications page error:', error);
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Failed to load notifications
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error.response?.data?.message || error.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Stay updated with your store activities and system updates
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {markAllAsReadMutation.isPending ? 'Marking...' : `Mark All Read (${unreadCount})`}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {unreadCount > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFilter(option.value)
                setPage(1)
              }}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${filter === option.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No notifications
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter === 'all' 
                ? "You're all caught up! No notifications to show."
                : `No ${filter} notifications found.`
              }
            </p>
          </div>
        ) : (
          notifications.map(renderNotificationItem)
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} notifications
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
