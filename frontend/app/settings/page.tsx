'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Eye, EyeOff, Loader2, Check, X, User, UserPlus } from 'lucide-react'
import { validatePasswordStrength } from '@/lib/utils'
import api from '@/lib/api'
import { toast } from 'react-toastify'

interface AddTechnicianData {
  username: string
  email: string
  password: string
  full_name: string
  phone: string
}

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('profile')

  // Profile form state
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Add technician form state
  const [technicianData, setTechnicianData] = useState<AddTechnicianData>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: ''
  })
  const [technicianErrors, setTechnicianErrors] = useState<Record<string, string>>({})
  const [isTechnicianSubmitting, setIsTechnicianSubmitting] = useState(false)
  const [showTechnicianPassword, setShowTechnicianPassword] = useState(false)

  // Initialize profile data and handle URL params
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (user) {
      setProfileData(prev => ({
        ...prev,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone || ''
      }))
    }

    // Handle tab from URL
    const tab = searchParams.get('tab')
    if (tab === 'add-technician') {
      setActiveTab('add-technician')
    }
  }, [user, isAuthenticated, isLoading, router, searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mrc-deep-navy" />
      </div>
    )
  }

  if (!user) return null

  // Profile form handlers
  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateProfileForm = (changingPassword: boolean) => {
    const errors: Record<string, string> = {}

    if (!profileData.username.trim()) {
      errors.username = 'Username is required'
    }

    if (!profileData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!profileData.full_name.trim()) {
      errors.full_name = 'Full name is required'
    }

    if (changingPassword) {
      if (!profileData.current_password) {
        errors.current_password = 'Current password is required'
      }

      if (!profileData.new_password) {
        errors.new_password = 'New password is required'
      } else {
        const validation = validatePasswordStrength(profileData.new_password)
        if (!validation.isValid) {
          errors.new_password = `Password must contain: ${validation.feedback.join(', ')}`
        }
      }

      if (profileData.new_password !== profileData.confirm_password) {
        errors.confirm_password = 'Passwords do not match'
      }
    }

    setProfileErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const changingPassword = !!(profileData.current_password || profileData.new_password)
    
    if (!validateProfileForm(changingPassword)) return

    setIsProfileSubmitting(true)

    const updateData: any = {
      username: profileData.username,
      email: profileData.email,
      full_name: profileData.full_name,
      phone: profileData.phone
    }

    if (changingPassword) {
      updateData.current_password = profileData.current_password
      updateData.new_password = profileData.new_password
    }

    const success = await updateProfile(updateData)

    if (success && changingPassword) {
      setProfileData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }))
    }

    setIsProfileSubmitting(false)
  }

  // Add technician form handlers
  const handleTechnicianChange = (field: keyof AddTechnicianData, value: string) => {
    setTechnicianData(prev => ({ ...prev, [field]: value }))
    if (technicianErrors[field]) {
      setTechnicianErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateTechnicianForm = () => {
    const errors: Record<string, string> = {}

    if (!technicianData.username.trim()) {
      errors.username = 'Username is required'
    }

    if (!technicianData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(technicianData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!technicianData.full_name.trim()) {
      errors.full_name = 'Full name is required'
    }

    if (!technicianData.password) {
      errors.password = 'Password is required'
    } else {
      const validation = validatePasswordStrength(technicianData.password)
      if (!validation.isValid) {
        errors.password = `Password must contain: ${validation.feedback.join(', ')}`
      }
    }

    setTechnicianErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleTechnicianSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateTechnicianForm()) return

    setIsTechnicianSubmitting(true)

    try {
      await api.post('/auth/add-technician', technicianData)
      toast.success(`Technician account created for ${technicianData.full_name}!`)
      
      // Reset form
      setTechnicianData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: ''
      })
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create technician account'
      toast.error(message)
    }

    setIsTechnicianSubmitting(false)
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    const validation = validatePasswordStrength(password)
    return validation
  }

  const PasswordStrengthIndicator = ({ password }: { password: string }) => {
    const strength = getPasswordStrength(password)
    
    return (
      <div className="mt-2 space-y-1">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1 flex-1 rounded-full ${
                level <= strength.score
                  ? strength.score < 3
                    ? 'bg-mrc-error-red'
                    : strength.score < 5
                    ? 'bg-mrc-warning-amber'
                    : 'bg-mrc-success-green'
                  : 'bg-mrc-light-gray'
              }`}
            />
          ))}
        </div>
        <div className="text-xs space-y-1">
          {strength.feedback.map((item, index) => (
            <div key={index} className="flex items-center space-x-1">
              {password && strength.score >= (index + 1) ? (
                <Check className="h-3 w-3 text-mrc-success-green" />
              ) : (
                <X className="h-3 w-3 text-mrc-light-gray" />
              )}
              <span className={password && strength.score >= (index + 1) ? 'text-mrc-success-green' : 'text-mrc-medium-gray'}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mrc-off-white">
      {/* Header */}
      <header className="bg-mrc-pure-white border-b border-mrc-light-gray">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="mr-4 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-mrc-charcoal">Settings</h1>
              <p className="text-sm text-mrc-medium-gray">Manage your account and team</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              My Profile
            </TabsTrigger>
            <TabsTrigger value="add-technician" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Technician
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your personal information and change your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => handleProfileChange('username', e.target.value)}
                        className={profileErrors.username ? 'border-mrc-error-red' : ''}
                      />
                      {profileErrors.username && (
                        <p className="text-mrc-error-red text-sm">{profileErrors.username}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        className={profileErrors.email ? 'border-mrc-error-red' : ''}
                      />
                      {profileErrors.email && (
                        <p className="text-mrc-error-red text-sm">{profileErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => handleProfileChange('full_name', e.target.value)}
                        className={profileErrors.full_name ? 'border-mrc-error-red' : ''}
                      />
                      {profileErrors.full_name && (
                        <p className="text-mrc-error-red text-sm">{profileErrors.full_name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+61 400 123 456"
                        value={profileData.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password Change Section */}
                  <div className="border-t border-mrc-light-gray pt-6">
                    <h3 className="text-lg font-medium text-mrc-charcoal mb-4">Change Password</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="current_password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current_password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={profileData.current_password}
                            onChange={(e) => handleProfileChange('current_password', e.target.value)}
                            className={profileErrors.current_password ? 'border-mrc-error-red pr-12' : 'pr-12'}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mrc-medium-gray"
                          >
                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {profileErrors.current_password && (
                          <p className="text-mrc-error-red text-sm">{profileErrors.current_password}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new_password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new_password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={profileData.new_password}
                            onChange={(e) => handleProfileChange('new_password', e.target.value)}
                            className={profileErrors.new_password ? 'border-mrc-error-red pr-12' : 'pr-12'}
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mrc-medium-gray"
                          >
                            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {profileData.new_password && (
                          <PasswordStrengthIndicator password={profileData.new_password} />
                        )}
                        {profileErrors.new_password && (
                          <p className="text-mrc-error-red text-sm">{profileErrors.new_password}</p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="confirm_password">Confirm New Password</Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          value={profileData.confirm_password}
                          onChange={(e) => handleProfileChange('confirm_password', e.target.value)}
                          className={profileErrors.confirm_password ? 'border-mrc-error-red' : ''}
                          placeholder="Confirm new password"
                        />
                        {profileErrors.confirm_password && (
                          <p className="text-mrc-error-red text-sm">{profileErrors.confirm_password}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={isProfileSubmitting}
                  >
                    {isProfileSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Profile'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Technician Tab */}
          <TabsContent value="add-technician">
            <Card>
              <CardHeader>
                <CardTitle>Add New Technician</CardTitle>
                <CardDescription>
                  Create a new account for a team member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTechnicianSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tech_username">Username</Label>
                      <Input
                        id="tech_username"
                        value={technicianData.username}
                        onChange={(e) => handleTechnicianChange('username', e.target.value)}
                        className={technicianErrors.username ? 'border-mrc-error-red' : ''}
                        placeholder="glen"
                      />
                      {technicianErrors.username && (
                        <p className="text-mrc-error-red text-sm">{technicianErrors.username}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tech_email">Email</Label>
                      <Input
                        id="tech_email"
                        type="email"
                        value={technicianData.email}
                        onChange={(e) => handleTechnicianChange('email', e.target.value)}
                        className={technicianErrors.email ? 'border-mrc-error-red' : ''}
                        placeholder="glen@mouldrestoration.com.au"
                      />
                      {technicianErrors.email && (
                        <p className="text-mrc-error-red text-sm">{technicianErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tech_full_name">Full Name</Label>
                      <Input
                        id="tech_full_name"
                        value={technicianData.full_name}
                        onChange={(e) => handleTechnicianChange('full_name', e.target.value)}
                        className={technicianErrors.full_name ? 'border-mrc-error-red' : ''}
                        placeholder="Glen Smith"
                      />
                      {technicianErrors.full_name && (
                        <p className="text-mrc-error-red text-sm">{technicianErrors.full_name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tech_phone">Phone Number</Label>
                      <Input
                        id="tech_phone"
                        type="tel"
                        value={technicianData.phone}
                        onChange={(e) => handleTechnicianChange('phone', e.target.value)}
                        placeholder="+61 400 123 456"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="tech_password">Initial Password</Label>
                      <div className="relative">
                        <Input
                          id="tech_password"
                          type={showTechnicianPassword ? 'text' : 'password'}
                          value={technicianData.password}
                          onChange={(e) => handleTechnicianChange('password', e.target.value)}
                          className={technicianErrors.password ? 'border-mrc-error-red pr-12' : 'pr-12'}
                          placeholder="Create a secure password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTechnicianPassword(!showTechnicianPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mrc-medium-gray"
                        >
                          {showTechnicianPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {technicianData.password && (
                        <PasswordStrengthIndicator password={technicianData.password} />
                      )}
                      {technicianErrors.password && (
                        <p className="text-mrc-error-red text-sm">{technicianErrors.password}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={isTechnicianSubmitting}
                  >
                    {isTechnicianSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Technician Account'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}