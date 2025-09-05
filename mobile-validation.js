const { chromium } = require('playwright');

async function validateMobileAuthentication() {
  console.log('🚀 Starting MRC Authentication Mobile Validation...\n');

  // Mobile Device Configurations
  const deviceConfigs = [
    { 
      name: 'iPhone SE (Primary Focus)', 
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    },
    { 
      name: 'iPad (Tablet)', 
      viewport: { width: 768, height: 1024 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    },
    { 
      name: 'Desktop', 
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  ];

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000  // Slow down for observation
  });

  const results = {
    overall: 'PASS',
    devices: {},
    issues: [],
    recommendations: []
  };

  for (const config of deviceConfigs) {
    console.log(`📱 Testing on ${config.name} (${config.viewport.width}x${config.viewport.height})`);
    
    const context = await browser.newContext({
      viewport: config.viewport,
      userAgent: config.userAgent
    });
    
    const page = await context.newPage();
    const deviceResults = {
      viewport: config.viewport,
      tests: {},
      screenshots: [],
      issues: []
    };

    try {
      // Test 1: Navigate to home page
      console.log('  ✓ Loading home page...');
      await page.goto('http://localhost:3002');
      await page.waitForTimeout(2000);
      
      // Capture initial load screenshot
      const homeScreenshot = `home-${config.viewport.width}px.png`;
      await page.screenshot({ path: homeScreenshot, fullPage: true });
      deviceResults.screenshots.push(homeScreenshot);
      console.log(`    📸 Screenshot: ${homeScreenshot}`);

      // Test 2: Navigation to login (should redirect automatically)
      console.log('  ✓ Testing automatic redirect to login...');
      await page.waitForSelector('form', { timeout: 5000 });
      
      const loginScreenshot = `login-${config.viewport.width}px.png`;
      await page.screenshot({ path: loginScreenshot, fullPage: true });
      deviceResults.screenshots.push(loginScreenshot);
      console.log(`    📸 Screenshot: ${loginScreenshot}`);

      // Test 3: Check touch targets and layout
      console.log('  ✓ Analyzing touch targets and layout...');
      
      // Check input field dimensions
      const emailInput = await page.locator('input[type="email"]').first();
      const passwordInput = await page.locator('input[type="password"]').first();
      const submitButton = await page.locator('button[type="submit"]').first();
      
      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();
      const submitBox = await submitButton.boundingBox();
      
      deviceResults.tests.emailInputHeight = emailBox.height;
      deviceResults.tests.passwordInputHeight = passwordBox.height;
      deviceResults.tests.submitButtonHeight = submitBox.height;
      
      // Validate minimum 44px touch targets
      if (emailBox.height < 44) {
        deviceResults.issues.push(`Email input too small: ${emailBox.height}px (minimum 44px)`);
      }
      if (passwordBox.height < 44) {
        deviceResults.issues.push(`Password input too small: ${passwordBox.height}px (minimum 44px)`);
      }
      if (submitBox.height < 44) {
        deviceResults.issues.push(`Submit button too small: ${submitBox.height}px (minimum 44px)`);
      }

      // Test 4: Form interaction and validation
      console.log('  ✓ Testing form validation...');
      
      // Test empty form submission
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      // Check for validation messages
      const emailError = await page.locator('text=Email is required').isVisible();
      const passwordError = await page.locator('text=Password is required').isVisible();
      deviceResults.tests.validationMessagesVisible = emailError && passwordError;
      
      if (!emailError || !passwordError) {
        deviceResults.issues.push('Form validation messages not properly displayed');
      }

      // Test 5: Password visibility toggle
      console.log('  ✓ Testing password visibility toggle...');
      await passwordInput.fill('TestPassword123!');
      
      const eyeButton = await page.locator('button:has-text("")').last(); // Eye icon button
      await eyeButton.click();
      await page.waitForTimeout(500);
      
      const passwordType = await passwordInput.getAttribute('type');
      deviceResults.tests.passwordToggleWorks = passwordType === 'text';
      
      if (passwordType !== 'text') {
        deviceResults.issues.push('Password visibility toggle not working properly');
      }

      // Test 6: Successful login flow
      console.log('  ✓ Testing successful login...');
      await emailInput.fill('michaelyoussef396@gmail.com');
      await passwordInput.fill('AdminMike123!');
      
      // Test remember me checkbox
      const rememberCheckbox = await page.locator('input[type="checkbox"]').first();
      await rememberCheckbox.check();
      
      const loginFormScreenshot = `login-filled-${config.viewport.width}px.png`;
      await page.screenshot({ path: loginFormScreenshot, fullPage: true });
      deviceResults.screenshots.push(loginFormScreenshot);
      
      await submitButton.click();
      
      // Wait for navigation to dashboard
      try {
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        deviceResults.tests.loginSuccessful = true;
        console.log('    ✅ Login successful, redirected to dashboard');
        
        const dashboardScreenshot = `dashboard-${config.viewport.width}px.png`;
        await page.screenshot({ path: dashboardScreenshot, fullPage: true });
        deviceResults.screenshots.push(dashboardScreenshot);
        
        // Test 7: Navigation and logout
        console.log('  ✓ Testing navigation and logout...');
        
        // Try to find settings link/button
        try {
          const settingsLink = await page.locator('a:has-text("Settings"), button:has-text("Settings")').first();
          await settingsLink.click();
          await page.waitForTimeout(2000);
          
          const settingsScreenshot = `settings-${config.viewport.width}px.png`;
          await page.screenshot({ path: settingsScreenshot, fullPage: true });
          deviceResults.screenshots.push(settingsScreenshot);
          
          deviceResults.tests.settingsNavigationWorks = true;
        } catch (error) {
          deviceResults.issues.push('Settings navigation not found or not working');
        }
        
        // Test logout
        try {
          const logoutButton = await page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
          await logoutButton.click();
          await page.waitForTimeout(2000);
          
          // Should redirect back to login
          const currentURL = page.url();
          deviceResults.tests.logoutSuccessful = currentURL.includes('login') || currentURL === 'http://localhost:3002/';
          
        } catch (error) {
          deviceResults.issues.push('Logout functionality not found or not working');
        }
        
      } catch (error) {
        deviceResults.tests.loginSuccessful = false;
        deviceResults.issues.push(`Login failed: ${error.message}`);
        console.log('    ❌ Login failed or dashboard not reached');
      }

      // Test 8: Check for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      if (consoleErrors.length > 0) {
        deviceResults.issues.push(`Console errors: ${consoleErrors.join(', ')}`);
      }

      // Test 9: Accessibility quick check
      console.log('  ✓ Quick accessibility check...');
      
      // Check for proper labels
      const labelledInputs = await page.locator('input[aria-label], input + label, label input').count();
      const totalInputs = await page.locator('input').count();
      
      if (labelledInputs < totalInputs) {
        deviceResults.issues.push('Some form inputs missing proper labels');
      }

    } catch (error) {
      deviceResults.issues.push(`Critical error during testing: ${error.message}`);
      console.log(`    ❌ Critical error: ${error.message}`);
    }

    await context.close();
    results.devices[config.name] = deviceResults;
    
    // Print device summary
    const issueCount = deviceResults.issues.length;
    const status = issueCount === 0 ? '✅ PASS' : `⚠️ ${issueCount} issues`;
    console.log(`    Result: ${status}\n`);
    
    if (issueCount > 0) {
      results.overall = 'NEEDS ATTENTION';
      results.issues.push(...deviceResults.issues.map(issue => `${config.name}: ${issue}`));
    }
  }

  await browser.close();

  // Generate comprehensive report
  console.log('📋 MOBILE VALIDATION REPORT');
  console.log('═══════════════════════════════\n');
  
  console.log(`Overall Status: ${results.overall}\n`);
  
  console.log('Device Testing Summary:');
  for (const [deviceName, deviceResult] of Object.entries(results.devices)) {
    const issueCount = deviceResult.issues.length;
    const status = issueCount === 0 ? '✅' : '⚠️';
    console.log(`${status} ${deviceName}: ${issueCount} issues`);
  }
  console.log('');

  if (results.issues.length > 0) {
    console.log('Issues Found:');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    console.log('');
  }

  // Mobile-specific recommendations
  console.log('Mobile Optimization Recommendations:');
  console.log('1. Verify all touch targets meet 44px minimum size');
  console.log('2. Test thumb-reach zones for single-hand navigation');
  console.log('3. Check form field focus states on mobile Safari');
  console.log('4. Validate keyboard appearance and interactions');
  console.log('5. Test loading performance on 3G connections');
  console.log('6. Verify text remains readable without zooming');
  console.log('7. Check for proper error messaging on small screens');
  console.log('');

  console.log('Screenshots captured for each device/viewport:');
  Object.entries(results.devices).forEach(([device, data]) => {
    console.log(`${device}:`);
    data.screenshots.forEach(screenshot => {
      console.log(`  - ${screenshot}`);
    });
  });

  return results;
}

// Run the validation
validateMobileAuthentication().then(results => {
  console.log('🎉 Mobile validation complete!');
  process.exit(results.overall === 'PASS' ? 0 : 1);
}).catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});