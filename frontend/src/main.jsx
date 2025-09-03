import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
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

// Auth components
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import { AuthGuard, PublicRoute } from '@/features/auth/components/AuthGuard'
import LinkStore from '@/pages/LinkStore'

// Create router using createRoutesFromElements
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Auth routes (public) */}
  <Route path="/auth/login" element={<PublicRoute><Login /></PublicRoute>} />
  <Route path="/auth/signup" element={<PublicRoute><Signup /></PublicRoute>} />
  {/* Link store must be accessible whether user is logged in or not, so do NOT wrap in PublicRoute */}
  <Route path="/link-store" element={<LinkStore />} />
      
      {/* Protected routes */}
      <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
        <Route index element={<Dashboard />} />
        <Route path="stores" element={<Stores />} />
        <Route path="products" element={<Products />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </>
  )
)

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
