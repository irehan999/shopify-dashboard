import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Field, Label } from '@headlessui/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Loader2, Mail, Lock, Eye, EyeOff, Store } from 'lucide-react'
import { useLogin, useRegister } from '@/features/auth/hooks/useAuth'
import { useLinkStore } from '@/features/shopify/api/shopifyApi'
import useAuthStore from '@/stores/authStore'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  fullName: z.string().optional(),
  username: z.string().optional(),
})

export default function LinkStore() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [autoTried, setAutoTried] = useState(false)

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const token = params.get('token') || ''
  const shop = params.get('shop') || ''

  const loginMutation = useLogin()
  const registerMutation = useRegister()
  const linkMutation = useLinkStore()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', fullName: '', username: '' },
  })

  useEffect(() => {
    // If already authenticated, just link using token (run once)
    const autoLink = async () => {
      if (!autoTried && isAuthenticated && token) {
        setAutoTried(true)
        try {
          await linkMutation.mutateAsync(token)
          navigate('/stores?success=true&store=' + encodeURIComponent(shop), { replace: true })
        } catch (e) {
          // Stay on page; user can try manual link
          console.error('Auto link failed:', e)
        }
      }
    }
    autoLink()
  }, [isAuthenticated, token, shop, autoTried])

  const onSubmit = async (data) => {
    try {
      // Try login first
      await loginMutation.mutateAsync({ email: data.email, password: data.password })
    } catch (e) {
      // If login fails, attempt register with minimal fields
      const fallback = {
        fullName: data.fullName || data.email.split('@')[0],
        username: (data.username || data.email.split('@')[0]).replace(/[^a-z0-9_\-]/gi, '').toLowerCase(),
        email: data.email,
        password: data.password,
      }
      await registerMutation.mutateAsync(fallback)
    }

    // Now link the store
    await linkMutation.mutateAsync(token)
    navigate('/stores?success=true&store=' + encodeURIComponent(shop), { replace: true })
  }

  const busy = isSubmitting || loginMutation.isPending || registerMutation.isPending || linkMutation.isPending

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Store className="h-5 w-5" /> Connect your store
          </CardTitle>
          <CardDescription className="text-center">
            {token ? (
              <>Complete sign in to link <span className="font-medium">{shop}</span> to your account</>
            ) : (
              <span className="text-red-600">Missing or invalid link token. Please restart the connection from Stores.</span>
            )}
          </CardDescription>
        </CardHeader>

        {/* If user is already logged in, provide a manual Link Now button */}
        {isAuthenticated && token ? (
          <CardContent>
            <div className="space-y-4 text-center">
              <p className="text-gray-700">You're signed in as <span className="font-medium">{user?.email}</span>.</p>
              <Button
                onClick={async () => {
                  try {
                    await linkMutation.mutateAsync(token)
                    navigate('/stores?success=true&store=' + encodeURIComponent(shop), { replace: true })
                  } catch (e) {
                    console.error('Manual link failed:', e)
                  }
                }}
                className="w-full"
                disabled={busy}
              >
                {busy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Linking…</>) : 'Link store now'}
              </Button>
            </div>
          </CardContent>
        ) : null}

        {/* Show auth form when not authenticated and have a token */}
        {!isAuthenticated && (
          <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <Field>
              <Label className="text-sm font-medium">Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input type="email" placeholder="you@example.com" className="pl-10" disabled={busy} {...register('email')} />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </Field>

            <Field>
              <Label className="text-sm font-medium">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input type={showPassword ? 'text' : 'password'} placeholder="Enter password" className="pl-10 pr-10" disabled={busy} {...register('password')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600" disabled={busy}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label className="text-sm font-medium">Full name (optional)</Label>
                <Input type="text" placeholder="John Doe" disabled={busy} {...register('fullName')} />
              </Field>
              <Field>
                <Label className="text-sm font-medium">Username (optional)</Label>
                <Input type="text" placeholder="john_doe" disabled={busy} {...register('username')} />
              </Field>
            </div>

            <p className="text-xs text-gray-500">We’ll sign you in if you already have an account. Otherwise, we’ll create one and continue.</p>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={busy || !token}>
              {busy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting…</>) : 'Continue'}
            </Button>
          </CardFooter>
          </form>
        )}

        {/* Helpful links preserving the token in case user navigates to login/signup */}
        {!isAuthenticated && token && (
          <CardFooter className="flex flex-col gap-2">
            <p className="text-xs text-gray-500 text-center">Already have an account?</p>
            <div className="flex justify-center gap-4 text-sm">
              <Link to={`/auth/login?next=${encodeURIComponent(`/link-store?token=${token}&shop=${shop}`)}`} className="text-blue-600 hover:underline">Sign in</Link>
              <Link to={`/auth/signup?next=${encodeURIComponent(`/link-store?token=${token}&shop=${shop}`)}`} className="text-blue-600 hover:underline">Create account</Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
