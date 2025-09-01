import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useTheme } from '@/hooks/useTheme'

export default function Layout() {
  const { theme } = useTheme()

  return (
    <div className={`min-h-screen ${theme}`}>
      <div className="flex bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        {/* Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <Header />
          <main className="flex-1 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
