import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { authAPI } from '@/features/auth/api/authAPI'
import { userAPI } from '@/features/user/api/userAPI'
import useAuthStore from '@/stores/authStore'
import { useTheme } from '@/providers/ThemeProvider'
import { 
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'

const settingsCategories = [
  {
    id: 'preferences',
    name: 'Preferences',
    icon: CogIcon,
    description: 'App preferences and theme settings',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: BellIcon,
    description: 'Configure notification preferences',
  },
  {
    id: 'security',
    name: 'Security',
    icon: ShieldCheckIcon,
    description: 'Password and security settings',
  },
]

export default function Settings() {
  const [activeCategory, setActiveCategory] = useState('preferences')
  const { user, updateUser } = useAuthStore()
  const { theme, setTheme, effectiveTheme } = useTheme()
  
  const [prefs, setPrefs] = useState({
    notifications: user?.preferences?.notifications ?? true,
    theme: user?.preferences?.theme || 'system'
  })
  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Debug console logs
  console.log('Settings - Auth store user:', user);
  console.log('Settings - User preferences:', user?.preferences);
  console.log('Settings - Current prefs state:', prefs);
  console.log('Settings - Current theme:', { theme, effectiveTheme });

  const savePreferences = async () => {
    setIsUpdatingPrefs(true)
    try {
      console.log('Saving preferences:', prefs);
      
      // Use the userAPI hook
      const response = await userAPI.updatePreferences(prefs);
      console.log('Preferences update response:', response);
      
      // Update auth store
      updateUser({ ...user, preferences: { ...user.preferences, ...prefs } })
      
      toast.success('Preferences updated successfully')
    } catch (e) {
      console.error('Failed to update preferences:', e);
      toast.error(e.response?.data?.message || 'Failed to update preferences')
    } finally {
      setIsUpdatingPrefs(false)
    }
  }

  const changePassword = async () => {
    if (pwd.newPassword !== pwd.confirmPassword) { 
      toast.error('Passwords do not match'); 
      return; 
    }
    if (pwd.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsUpdatingPassword(true)
    try {
      console.log('Changing password...');
      await authAPI.changePassword({ 
        oldPassword: pwd.oldPassword, 
        newPassword: pwd.newPassword 
      })
      toast.success('Password changed successfully')
      setPwd({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (e) {
      console.error('Password change error:', e);
      toast.error(e.response?.data?.message || 'Failed to change password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const renderPreferences = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          App Preferences
        </h3>
        <div className="space-y-8">
          {/* Theme Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Theme Preference
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'light', label: 'Light', icon: SunIcon },
                { value: 'dark', label: 'Dark', icon: MoonIcon },
                { value: 'system', label: 'System', icon: ComputerDesktopIcon }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setPrefs(p => ({ ...p, theme: option.value }))
                    // Apply theme immediately for live preview
                    setTheme(option.value)
                  }}
                  className={`
                    flex flex-col items-center p-6 rounded-lg border-2 transition-all duration-200
                    ${prefs.theme === option.value 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                    }
                  `}
                >
                  <option.icon className={`h-8 w-8 mb-3 ${
                    prefs.theme === option.value 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    prefs.theme === option.value
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Current: {effectiveTheme === 'light' ? 'Light' : 'Dark'} mode
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={savePreferences}
              disabled={isUpdatingPrefs}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isUpdatingPrefs ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Notification Settings
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Enable Notifications
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Turn on/off in-app notifications for product sync, errors, and updates
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!prefs.notifications}
                onChange={(e) => setPrefs(p => ({ ...p, notifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={savePreferences}
              disabled={isUpdatingPrefs}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isUpdatingPrefs ? 'Saving...' : 'Save Notification Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Change Password
        </h3>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Security Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Choose a strong password with at least 6 characters for better security.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <input 
              type="password" 
              placeholder="Enter your current password" 
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              value={pwd.oldPassword} 
              onChange={e => setPwd({ ...pwd, oldPassword: e.target.value })} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <input 
                type="password" 
                placeholder="Enter new password" 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                value={pwd.newPassword} 
                onChange={e => setPwd({ ...pwd, newPassword: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input 
                type="password" 
                placeholder="Confirm new password" 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                value={pwd.confirmPassword} 
                onChange={e => setPwd({ ...pwd, confirmPassword: e.target.value })} 
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={changePassword}
              disabled={isUpdatingPassword || !pwd.oldPassword || !pwd.newPassword || !pwd.confirmPassword}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeCategory) {
      case 'preferences':
        return renderPreferences()
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account preferences and security settings
        </p>
      </div>

      <div className="flex gap-0 min-h-[600px]">
        {/* Settings Navigation */}
        <div className="w-1/3 bg-white dark:bg-gray-900 rounded-l-lg shadow-sm border border-r-0 border-gray-200 dark:border-gray-700">
          <nav className="p-6">
            <div className="space-y-2">
              {settingsCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`
                    w-full flex items-start p-4 text-sm font-medium rounded-lg transition-all duration-200
                    ${activeCategory === category.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <category.icon className={`mr-3 h-5 w-5 flex-shrink-0 mt-0.5 ${
                    activeCategory === category.id 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`} />
                  <div className="text-left">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {category.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="w-2/3 bg-white dark:bg-gray-900 rounded-r-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
