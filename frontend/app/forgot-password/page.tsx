'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'react-toastify'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await api.post('/auth/request-password-reset', { email })
      setIsEmailSent(true)
      toast.success('Password reset email sent!')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to send reset email'
      toast.error(message)
    }

    setIsSubmitting(false)
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-mrc-off-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-mrc-success-green rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-mrc-charcoal">
              Check Your Email
            </h1>
            <p className="mt-2 text-mrc-medium-gray">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-mrc-medium-gray">
                  The reset link will expire in 15 minutes for security reasons.
                </p>
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEmailSent(false)
                      setEmail('')
                    }}
                  >
                    Send Another Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-mrc-off-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-mrc-deep-navy rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-mrc-pure-white">MRC</span>
          </div>
          <h1 className="text-2xl font-semibold text-mrc-charcoal">
            Reset Your Password
          </h1>
          <p className="mt-2 text-mrc-medium-gray">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-center">Forgot Password</CardTitle>
            <CardDescription className="text-center">
              No worries, we'll help you get back in
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  className={error ? 'border-mrc-error-red focus-visible:ring-mrc-error-red' : ''}
                  autoComplete="email"
                  autoFocus
                />
                {error && (
                  <p className="text-mrc-error-red text-sm">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Email...
                  </>
                ) : (
                  'Send Reset Email'
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/login')}
                  className="text-sm"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-mrc-medium-gray">
          <p>If you don't receive an email, check your spam folder or contact support</p>
        </div>
      </div>
    </div>
  )
}