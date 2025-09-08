import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { authAPI } from '@/features/auth/api/authAPI'
import { userAPI } from '@/features/user/api/userAPI'
import useAuthStore from '@/stores/authStore'
import { 
  CogIcon,
  KeyIcon,
  BellIcon,
  UserIcon,
  ShieldCheckIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

const settingsCategories = [
  {
    id: 'general',
    name: 'General',
    icon: CogIcon,
    description: 'Basic application settings',
  },
  // Removed API keys section for end users
  {
    id: 'notifications',
    name: 'Notifications',
    icon: BellIcon,
    description: 'Configure notification preferences',
  },
  {
    id: 'profile',
    name: 'Profile',
    icon: UserIcon,
    description: 'Update your profile information',
  },
  {
    id: 'security',
    name: 'Security',
    icon: ShieldCheckIcon,
    description: 'Security and privacy settings',
  },
]

export default function Settings() {
  const [activeCategory, setActiveCategory] = useState('general')
  const { user, updateUser } = useAuthStore()
  const [prefs, setPrefs] = useState({
    notifications: user?.preferences?.notifications ?? true,
    theme: user?.preferences?.theme || 'dark',
    language: user?.preferences?.language || 'en'
  })
  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          General Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Application Name
            </label>
            <input
              type="text"
              defaultValue="Shopify Dashboard"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Currency
            </label>
            <select className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timezone
            </label>
            <select className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const savePreferences = async () => {
    try {
      const res = await userAPI.updateProfile({}) // no-op to ensure auth; optional
      const prefRes = await userAPI.updatePreferences?.(prefs)
      // If updatePreferences is not exported, call api directly
      if (!prefRes) {
        await (await import('@/lib/api')).api.patch('/api/user/preferences', prefs)
      }
      updateUser({ ...user, preferences: { ...user.preferences, ...prefs } })
      toast.success('Preferences updated')
    } catch (e) {
      toast.error('Failed to update preferences')
    }
  }

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Notifications
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Turn on/off in-app notifications
              </p>
            </div>
            <input
              type="checkbox"
              checked={!!prefs.notifications}
              onChange={(e) => setPrefs(p => ({ ...p, notifications: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
        <div className="mt-6">
          <button onClick={savePreferences} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Preferences</button>
        </div>
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Change Password
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="password" placeholder="Current password" className="px-3 py-2 border rounded-md" value={pwd.oldPassword} onChange={e => setPwd({ ...pwd, oldPassword: e.target.value })} />
          <div />
          <input type="password" placeholder="New password" className="px-3 py-2 border rounded-md" value={pwd.newPassword} onChange={e => setPwd({ ...pwd, newPassword: e.target.value })} />
          <input type="password" placeholder="Confirm new password" className="px-3 py-2 border rounded-md" value={pwd.confirmPassword} onChange={e => setPwd({ ...pwd, confirmPassword: e.target.value })} />
        </div>
        <div className="mt-4">
          <button
            onClick={async () => {
              if (pwd.newPassword !== pwd.confirmPassword) { toast.error('Passwords do not match'); return; }
              try {
                await authAPI.changePassword({ oldPassword: pwd.oldPassword, newPassword: pwd.newPassword })
                toast.success('Password changed')
                setPwd({ oldPassword: '', newPassword: '', confirmPassword: '' })
              } catch (e) {
                toast.error(e.response?.data?.message || 'Failed to change password')
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeCategory) {
      case 'general':
        return renderGeneralSettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'security':
        return renderSecurity()
      default:
        return (
          <div className="text-center py-12">
            <CogIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {settingsCategories.find(cat => cat.id === activeCategory)?.name} Settings
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This section will be implemented soon.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your application preferences and configurations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {settingsCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${activeCategory === category.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <category.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <div>{category.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {category.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            {renderContent()}
            
            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end space-x-3">
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                  Cancel
                </button>
                <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
