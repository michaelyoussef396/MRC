'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Users, Loader2, LogOut, User } from 'lucide-react'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mrc-deep-navy" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-mrc-off-white">
      {/* Header */}
      <header className="bg-mrc-pure-white border-b border-mrc-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-mrc-deep-navy rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-mrc-pure-white">MRC</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-mrc-charcoal">Dashboard</h1>
                <p className="text-sm text-mrc-medium-gray">Mould & Restoration Co.</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={logout}
              className="text-mrc-medium-gray hover:text-mrc-error-red"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-mrc-charcoal mb-2">
            Welcome back, {user.full_name}!
          </h2>
          <p className="text-mrc-medium-gray">
            Manage your account and team members from your dashboard.
          </p>
        </div>

        {/* User Info Card */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-mrc-deep-navy" />
                Your Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-mrc-medium-gray">Username:</span>
                  <span className="ml-2 text-mrc-charcoal font-medium">{user.username}</span>
                </div>
                <div>
                  <span className="text-mrc-medium-gray">Email:</span>
                  <span className="ml-2 text-mrc-charcoal font-medium">{user.email}</span>
                </div>
                <div>
                  <span className="text-mrc-medium-gray">Phone:</span>
                  <span className="ml-2 text-mrc-charcoal font-medium">{user.phone || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-mrc-medium-gray">Last Login:</span>
                  <span className="ml-2 text-mrc-charcoal font-medium">{formatDate(user.last_login)}</span>
                </div>
                <div>
                  <span className="text-mrc-medium-gray">Member Since:</span>
                  <span className="ml-2 text-mrc-charcoal font-medium">{formatDate(user.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/settings')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-mrc-deep-navy" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Update your profile, change password, and manage your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Manage Account
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/settings?tab=add-technician')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-mrc-deep-navy" />
                Add Team Member
              </CardTitle>
              <CardDescription>
                Create accounts for new technicians and team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Add User
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-mrc-off-white border-dashed border-2 border-mrc-light-gray">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-mrc-medium-gray">
                Coming Soon
              </CardTitle>
              <CardDescription>
                Phase 2 features will be available here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" disabled className="w-full">
                Stay Tuned
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Footer */}
        <div className="mt-12 text-center text-sm text-mrc-medium-gray">
          <p>Phase 1: Authentication System - Fully Operational</p>
          <p className="mt-1">Next: Phase 2 Dashboard & Navigation Features</p>
        </div>
      </main>
    </div>
  )
}