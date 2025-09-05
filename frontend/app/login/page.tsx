'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  const { login, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 3) {
      newErrors.password = 'Password is too short'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    const success = await login({
      email,
      password,
      remember_me: rememberMe
    })

    if (success) {
      router.push('/dashboard')
    }

    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mrc-deep-navy" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-mrc-off-white">
      <div className="w-full max-w-md space-y-8">
        {/* Company Logo/Branding */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 mb-4 flex items-center justify-center bg-mrc-deep-navy rounded-lg p-2">
            <img 
              src="/SmallLogo.png" 
              alt="MOULD & RESTORATION CO" 
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-semibold text-mrc-charcoal">
            Welcome Back
          </h1>
          <p className="mt-2 text-mrc-medium-gray">
            Sign in to your MOULD & RESTORATION CO account
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'border-mrc-error-red focus-visible:ring-mrc-error-red' : ''}
                  autoComplete="email"
                  autoFocus
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-required="true"
                />
                {errors.email && (
                  <div role="alert" aria-live="polite">
                    <p id="email-error" className="text-mrc-error-red text-sm font-medium">{errors.email}</p>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? 'border-mrc-error-red focus-visible:ring-mrc-error-red pr-12' : 'pr-12'}
                    autoComplete="current-password"
                    aria-describedby={errors.password ? "password-error" : undefined}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mrc-medium-gray hover:text-mrc-charcoal transition-colors focus:outline-none focus:ring-2 focus:ring-mrc-deep-navy focus:ring-offset-2 rounded-sm"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <div role="alert" aria-live="polite">
                    <p id="password-error" className="text-mrc-error-red text-sm font-medium">{errors.password}</p>
                  </div>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember-me" className="text-sm cursor-pointer">
                  Keep me signed in for 30 days
                </Label>
              </div>

              {/* General Error */}
              {errors.general && (
                <div role="alert" aria-live="assertive" className="text-center">
                  <p className="text-mrc-error-red text-sm font-medium">{errors.general}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                aria-describedby={isSubmitting ? "loading-message" : undefined}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span id="loading-message">Signing In...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}