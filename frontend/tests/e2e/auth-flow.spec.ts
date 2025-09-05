import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
  })

  test('should display login form correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/MRC Authentication/)

    // Check login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /remember me/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    
    // Check forgot password link
    await expect(page.getByText(/forgot password/i)).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in login form
    await page.getByLabel(/email/i).fill('michaelyoussef396@gmail.com')
    await page.getByLabel(/password/i).fill('AdminMike123!')
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Should show welcome message
    await expect(page.getByText(/welcome/i)).toBeVisible()
    await expect(page.getByText(/michael/i)).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in login form with wrong credentials
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
    
    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i)
    const toggleButton = page.getByRole('button', { name: /toggle password visibility/i })
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle button
    await toggleButton.click()
    
    // Password should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click toggle button again
    await toggleButton.click()
    
    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should remember login with remember me checkbox', async ({ page }) => {
    // Fill in login form with remember me checked
    await page.getByLabel(/email/i).fill('michaelyoussef396@gmail.com')
    await page.getByLabel(/password/i).fill('AdminMike123!')
    await page.getByRole('checkbox', { name: /remember me/i }).check()
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Verify refresh token cookie is set (check via network or document.cookie)
    const cookies = await page.context().cookies()
    const refreshToken = cookies.find(c => c.name.includes('refresh'))
    expect(refreshToken).toBeTruthy()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('michaelyoussef396@gmail.com')
    await page.getByLabel(/password/i).fill('AdminMike123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout/i }).or(
      page.getByText(/logout/i)
    )
    await logoutButton.click()
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
    
    // Verify cookies are cleared
    const cookies = await page.context().cookies()
    const authCookies = cookies.filter(c => 
      c.name.includes('token') || c.name.includes('auth')
    )
    expect(authCookies.length).toBe(0)
  })

  test('should protect dashboard route when not authenticated', async ({ page }) => {
    // Try to access dashboard directly without login
    await page.goto('/dashboard')
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
  })

  test('should redirect to dashboard when accessing login while authenticated', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('michaelyoussef396@gmail.com')
    await page.getByLabel(/password/i).fill('AdminMike123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Try to access login page
    await page.goto('/login')
    
    // Should redirect back to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept login request and simulate network error
    await page.route('**/api/auth/login', route => {
      route.abort('failed')
    })
    
    // Fill in login form
    await page.getByLabel(/email/i).fill('michaelyoussef396@gmail.com')
    await page.getByLabel(/password/i).fill('AdminMike123!')
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show network error message
    await expect(page.getByText(/network error/i).or(
      page.getByText(/login failed/i)
    )).toBeVisible()
  })

  test('should show loading state during login', async ({ page }) => {
    // Intercept login request to add delay
    await page.route('**/api/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.continue()
    })
    
    // Fill in login form
    await page.getByLabel(/email/i).fill('michaelyoussef396@gmail.com')
    await page.getByLabel(/password/i).fill('AdminMike123!')
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show loading state
    await expect(page.getByRole('button', { name: /signing in/i }).or(
      page.getByText(/loading/i)
    )).toBeVisible()
  })
})

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('michaelyoussef396@gmail.com')
    await page.getByLabel(/password/i).fill('AdminMike123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should navigate to settings page', async ({ page }) => {
    // Find and click settings link
    await page.getByText(/settings/i).or(page.getByText(/profile/i)).click()
    
    // Should navigate to settings
    await expect(page).toHaveURL('/settings')
    
    // Should show profile form
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/phone/i)).toBeVisible()
  })

  test('should update profile successfully', async ({ page }) => {
    await page.goto('/settings')
    
    // Update profile information
    await page.getByLabel(/full name/i).fill('Updated Name')
    await page.getByLabel(/phone/i).fill('+61 400 999 999')
    
    // Save changes
    await page.getByRole('button', { name: /save/i }).click()
    
    // Should show success message
    await expect(page.getByText(/profile updated/i)).toBeVisible()
    
    // Reload page and verify changes persisted
    await page.reload()
    await expect(page.getByLabel(/full name/i)).toHaveValue('Updated Name')
    await expect(page.getByLabel(/phone/i)).toHaveValue('+61 400 999 999')
  })

  test('should change password successfully', async ({ page }) => {
    await page.goto('/settings')
    
    // Navigate to password change section
    const passwordTab = page.getByRole('tab', { name: /password/i }).or(
      page.getByText(/change password/i)
    )
    if (await passwordTab.isVisible()) {
      await passwordTab.click()
    }
    
    // Fill password change form
    await page.getByLabel(/current password/i).fill('AdminMike123!')
    await page.getByLabel(/new password/i).fill('NewPassword123!')
    await page.getByLabel(/confirm password/i).fill('NewPassword123!')
    
    // Submit password change
    await page.getByRole('button', { name: /change password/i }).click()
    
    // Should show success message
    await expect(page.getByText(/password changed/i)).toBeVisible()
  })

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/settings')
    
    // Navigate to password change section
    const passwordTab = page.getByRole('tab', { name: /password/i }).or(
      page.getByText(/change password/i)
    )
    if (await passwordTab.isVisible()) {
      await passwordTab.click()
    }
    
    // Try weak password
    await page.getByLabel(/current password/i).fill('AdminMike123!')
    await page.getByLabel(/new password/i).fill('weak')
    
    // Should show password requirements
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible()
    await expect(page.getByText(/uppercase letter/i)).toBeVisible()
    await expect(page.getByText(/number/i)).toBeVisible()
    await expect(page.getByText(/special character/i)).toBeVisible()
  })
})

test.describe('Add Technician', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('michaelyoussef396@gmail.com')
    await page.getByLabel(/password/i).fill('AdminMike123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/dashboard')
    await page.goto('/settings')
  })

  test('should add new technician successfully', async ({ page }) => {
    // Navigate to add technician tab
    const technicianTab = page.getByRole('tab', { name: /add technician/i }).or(
      page.getByText(/add technician/i)
    )
    if (await technicianTab.isVisible()) {
      await technicianTab.click()
    }
    
    // Fill technician form
    await page.getByLabel(/username/i).fill('newtechnician')
    await page.getByLabel(/email/i).fill('tech@mrc.com')
    await page.getByLabel(/full name/i).fill('New Technician')
    await page.getByLabel(/phone/i).fill('+61 400 555 555')
    await page.getByLabel(/password/i).fill('TechPass123!')
    
    // Submit form
    await page.getByRole('button', { name: /add technician/i }).click()
    
    // Should show success message
    await expect(page.getByText(/technician added/i)).toBeVisible()
  })

  test('should validate technician form fields', async ({ page }) => {
    // Navigate to add technician tab
    const technicianTab = page.getByRole('tab', { name: /add technician/i }).or(
      page.getByText(/add technician/i)
    )
    if (await technicianTab.isVisible()) {
      await technicianTab.click()
    }
    
    // Try to submit empty form
    await page.getByRole('button', { name: /add technician/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/username is required/i)).toBeVisible()
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/full name is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should prevent duplicate usernames', async ({ page }) => {
    // Navigate to add technician tab
    const technicianTab = page.getByRole('tab', { name: /add technician/i }).or(
      page.getByText(/add technician/i)
    )
    if (await technicianTab.isVisible()) {
      await technicianTab.click()
    }
    
    // Try to create technician with existing username
    await page.getByLabel(/username/i).fill('michael') // Existing user
    await page.getByLabel(/email/i).fill('newtech@mrc.com')
    await page.getByLabel(/full name/i).fill('New Technician')
    await page.getByLabel(/password/i).fill('TechPass123!')
    
    // Submit form
    await page.getByRole('button', { name: /add technician/i }).click()
    
    // Should show error message
    await expect(page.getByText(/username already exists/i)).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('should work properly on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/login')
    
    // Check mobile layout
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    // Login should work on mobile
    await page.getByLabel(/email/i).fill('michaelyoussef396@gmail.com')
    await page.getByLabel(/password/i).fill('AdminMike123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    await expect(page).toHaveURL('/dashboard')
  })

  test('should work properly on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await page.goto('/login')
    
    // Check tablet layout
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    // Login should work on tablet
    await page.getByLabel(/email/i).fill('michaelyoussef396@gmail.com')
    await page.getByLabel(/password/i).fill('AdminMike123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    await expect(page).toHaveURL('/dashboard')
  })
})

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login')
    
    // Tab through form elements
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/email/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/password/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('checkbox', { name: /remember me/i })).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused()
    
    // Should be able to submit with Enter
    await page.getByLabel(/email/i).fill('michaelyoussef396@gmail.com')
    await page.getByLabel(/password/i).fill('AdminMike123!')
    await page.keyboard.press('Enter')
    
    await expect(page).toHaveURL('/dashboard')
  })

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/login')
    
    // Check ARIA labels
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /password/i }).or(
      page.getByLabel(/password/i)
    )).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /remember me/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})