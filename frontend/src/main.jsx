import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib'
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
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  </StrictMode>,
)
