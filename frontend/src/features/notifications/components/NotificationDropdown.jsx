import { Fragment, useState, useRef, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import useNotificationStore from '../../../stores/notificationStore.js';
import { cn } from '../../../utils/cn.js';

/**
 * Notification Dropdown Component
 * 
 * Integrates with notification store and backend for real-time updates.
 * Features:
 * - Real-time notification display
 * - Mark as read/unread functionality
 * - Delete notifications
 * - Mark all as read
 * - Smart categorization and icons
 * - Responsive design
 */

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return CheckCircleIcon;
    case 'warning':
      return ExclamationTriangleIcon;
    case 'error':
      return ExclamationCircleIcon;
    case 'info':
    default:
      return InformationCircleIcon;
  }
};

const getNotificationColor = (type, isRead = false) => {
  const opacity = isRead ? 'opacity-60' : '';
  
  switch (type) {
    case 'success':
      return `text-green-500 ${opacity}`;
    case 'warning':
      return `text-yellow-500 ${opacity}`;
    case 'error':
      return `text-red-500 ${opacity}`;
    case 'info':
    default:
      return `text-blue-500 ${opacity}`;
  }
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

export default function NotificationDropdown() {
  // Don't fetch on open - just show existing data from store
  // Store handles all fetching automatically on login
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // No need to fetch - store handles it automatically

  const handleMarkAsRead = async (notificationId, event) => {
    event.preventDefault();
    event.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId, event) => {
    event.preventDefault();
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleLoadMore = () => {
    // Removed - keeping dropdown simple, full page for more notifications
  };

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Close dropdown
    setIsOpen(false);
    
    // Handle link if present
    if (notification.link) {
      // If it's an internal link, use router navigation
      if (notification.link.startsWith('/') || notification.link.startsWith('#')) {
        // Let the Link component handle internal navigation
        return;
      } else {
        // External link
        window.open(notification.link, '_blank');
      }
    }
  };

  return (
    <Menu as="div" className="relative" ref={dropdownRef}>
      <div>
        <Menu.Button 
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        show={isOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
        beforeEnter={() => setIsOpen(true)}
        afterLeave={() => setIsOpen(false)}
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-80 sm:w-96 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-72 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BellIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  const iconColor = getNotificationColor(notification.type, notification.read);
                  
                  const NotificationContent = (
                    <div
                      className={cn(
                        "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200",
                        !notification.read && "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <IconComponent className={cn("h-5 w-5", iconColor)} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium",
                            notification.read 
                              ? "text-gray-600 dark:text-gray-400" 
                              : "text-gray-900 dark:text-white"
                          )}>
                            {notification.title}
                          </p>
                          <p className={cn(
                            "text-sm mt-1",
                            notification.read
                              ? "text-gray-500 dark:text-gray-500"
                              : "text-gray-700 dark:text-gray-300"
                          )}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-center space-x-1">
                          {!notification.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification._id, e)}
                              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title="Mark as read"
                            >
                              <CheckIcon className="h-3 w-3" />
                            </button>
                          )}
                          
                          <Menu as="div" className="relative">
                            <Menu.Button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              <EllipsisVerticalIcon className="h-3 w-3" />
                            </Menu.Button>
                            
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="origin-top-right absolute right-0 mt-1 w-32 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                <div className="py-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={(e) => handleDelete(notification._id, e)}
                                        className={cn(
                                          "flex items-center w-full px-3 py-2 text-sm",
                                          active 
                                            ? "bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white" 
                                            : "text-gray-700 dark:text-gray-200"
                                        )}
                                      >
                                        <XMarkIcon className="mr-2 h-3 w-3" />
                                        Delete
                                      </button>
                                    )}
                                  </Menu.Item>
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </div>
                      </div>
                    </div>
                  );

                  // Wrap with Link if notification has an internal link
                  if (notification.link && (notification.link.startsWith('/') || notification.link.startsWith('#'))) {
                    return (
                      <Menu.Item key={notification._id}>
                        <Link to={notification.link} className="block">
                          {NotificationContent}
                        </Link>
                      </Menu.Item>
                    );
                  }

                  return (
                    <Menu.Item key={notification._id}>
                      {NotificationContent}
                    </Menu.Item>
                  );
                })}

                {/* Simple footer - no load more in dropdown */}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-600">
              <Link
                to="/settings#notifications"
                className="block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-center font-medium"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
