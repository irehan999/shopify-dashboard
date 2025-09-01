import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { SocketProvider } from '@/providers/SocketProvider'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import '@/index.css'

// Components
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Stores from '@/pages/Stores'
import Products from '@/pages/Products'
import Settings from '@/pages/Settings'

// Create router
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'stores',
        element: <Stores />,
      },
      {
        path: 'products',
        element: <Products />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="shopify-dashboard-theme">
          <SocketProvider>
            <RouterProvider router={router} />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-text)',
                },
              }}
            />
          </SocketProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
