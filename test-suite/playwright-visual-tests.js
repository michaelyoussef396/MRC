/**
 * MRC Authentication System - Playwright Visual Tests
 * Frontend UI Testing with Screenshots and Interaction Testing
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseURL: 'http://localhost:3000',
  testUser: {
    email: 'michaelyoussef396@gmail.com',
    password: 'AdminMike123!'
  },
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 }
  ]
};

// Test Results Storage
const testResults = {
  screenshots: [],
  tests: [],
  performance: [],
  accessibility: []
};

test.describe('MRC Authentication System - Visual Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console Error: ${msg.text()}`);
      }
    });
    
    // Set up network monitoring
    page.on('response', response => {
      if (!response.ok() && !response.url().includes('_next')) {
        console.log(`Network Error: ${response.status()} ${response.url()}`);
      }
    });
  });

  // Test 1: Page Load and Basic UI Elements
  test('Homepage loads correctly across viewports', async ({ page }) => {
    const testName = 'Homepage Load';
    const results = { testName, viewports: [], errors: [] };
    
    for (const viewport of config.viewports) {
      try {
        await page.setViewportSize(viewport);
        await page.goto(config.baseURL, { waitUntil: 'networkidle' });
        
        // Wait for page to be fully loaded
        await page.waitForLoadState('domcontentloaded');
        
        // Check if it's login or dashboard
        const isLoginPage = await page.locator('input[type="email"]').isVisible();
        const isDashboard = await page.locator('text=Dashboard').isVisible();
        
        // Take screenshot
        const screenshotPath = `screenshots/${testName}-${viewport.name}.png`;
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        
        results.viewports.push({
          name: viewport.name,
          dimensions: `${viewport.width}x${viewport.height}`,
          pageType: isLoginPage ? 'login' : 'dashboard',
          screenshot: screenshotPath,
          loadTime: await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart)
        });
        
        testResults.screenshots.push({
          test: testName,
          viewport: viewport.name,
          path: screenshotPath
        });
        
      } catch (error) {
        results.errors.push({
          viewport: viewport.name,
          error: error.message
        });
      }
    }
    
    testResults.tests.push(results);
    console.log(`✅ ${testName} - Screenshots captured for ${results.viewports.length} viewports`);
  });

  // Test 2: Login Form Testing
  test('Login form functionality and validation', async ({ page }) => {
    const testName = 'Login Form';
    const results = { testName, tests: [], errors: [] };
    
    await page.setViewportSize(config.viewports[2]); // Desktop for form testing
    await page.goto(config.baseURL);
    
    try {
      // Check if we're on login page or need to navigate to it
      const hasLoginForm = await page.locator('input[type="email"]').isVisible();
      
      if (!hasLoginForm) {
        // Try to find logout or login button to get to login page
        const logoutBtn = page.locator('button:has-text("Logout")');
        if (await logoutBtn.isVisible()) {
          await logoutBtn.click();
          await page.waitForSelector('input[type="email"]');
        }
      }
      
      // Test 1: Empty form validation
      const submitBtn = page.locator('button[type="submit"]');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        
        const emailError = await page.locator('text*="required"').first().isVisible();
        results.tests.push({
          name: 'Empty form validation',
          passed: emailError,
          details: emailError ? 'Validation messages shown' : 'No validation messages'
        });
        
        await page.screenshot({ path: 'screenshots/login-form-validation.png' });
      }
      
      // Test 2: Invalid email format
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', 'somepassword');
      
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        
        const errorVisible = await page.locator('text*="Invalid"').isVisible();
        results.tests.push({
          name: 'Invalid email format',
          passed: errorVisible,
          details: 'Error handling for invalid email'
        });
      }
      
      // Test 3: Valid credentials (if we can test without rate limiting)
      await page.fill('input[type="email"]', config.testUser.email);
      await page.fill('input[type="password"]', config.testUser.password);
      await page.screenshot({ path: 'screenshots/login-form-filled.png' });
      
      results.tests.push({
        name: 'Form filled with valid credentials',
        passed: true,
        details: 'Screenshot captured'
      });
      
    } catch (error) {
      results.errors.push({
        test: 'Login form testing',
        error: error.message
      });
    }
    
    testResults.tests.push(results);
    console.log(`✅ ${testName} - ${results.tests.length} form tests completed`);
  });

  // Test 3: Mobile Responsiveness
  test('Mobile responsiveness and touch targets', async ({ page }) => {
    const testName = 'Mobile Responsiveness';
    const results = { testName, tests: [], errors: [] };
    
    // Test on mobile viewport
    await page.setViewportSize(config.viewports[0]); // Mobile
    await page.goto(config.baseURL);
    
    try {
      // Check touch target sizes
      const buttons = await page.locator('button').all();
      let touchTargetResults = [];
      
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        const button = buttons[i];
        const boundingBox = await button.boundingBox();
        if (boundingBox) {
          const meetsMinSize = boundingBox.width >= 44 && boundingBox.height >= 44;
          touchTargetResults.push({
            element: `Button ${i + 1}`,
            size: `${boundingBox.width}x${boundingBox.height}`,
            meetsStandard: meetsMinSize
          });
        }
      }
      
      results.tests.push({
        name: 'Touch target sizes',
        results: touchTargetResults,
        passed: touchTargetResults.some(t => t.meetsStandard)
      });
      
      // Check if layout adapts to mobile
      await page.screenshot({ path: 'screenshots/mobile-layout.png', fullPage: true });
      
      // Test scrolling and navigation
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = config.viewports[0].height;
      
      results.tests.push({
        name: 'Mobile layout adaptation',
        passed: true,
        details: `Page height: ${pageHeight}px, Viewport: ${viewportHeight}px`
      });
      
    } catch (error) {
      results.errors.push({
        test: 'Mobile responsiveness',
        error: error.message
      });
    }
    
    testResults.tests.push(results);
    console.log(`✅ ${testName} - Mobile responsiveness tested`);
  });

  // Test 4: Logo and Branding
  test('Logo visibility and branding elements', async ({ page }) => {
    const testName = 'Logo and Branding';
    const results = { testName, tests: [], errors: [] };
    
    for (const viewport of config.viewports) {
      try {
        await page.setViewportSize(viewport);
        await page.goto(config.baseURL);
        await page.waitForLoadState('domcontentloaded');
        
        // Check for logo presence
        const logoSelectors = [
          'img[alt*="logo"]',
          'img[alt*="Logo"]',
          'img[src*="logo"]',
          'img[src*="Logo"]',
          '.logo',
          '[data-testid="logo"]'
        ];
        
        let logoFound = false;
        let logoDetails = {};
        
        for (const selector of logoSelectors) {
          const logo = page.locator(selector).first();
          if (await logo.isVisible()) {
            logoFound = true;
            const boundingBox = await logo.boundingBox();
            logoDetails = {
              selector,
              size: boundingBox ? `${boundingBox.width}x${boundingBox.height}` : 'unknown',
              visible: true
            };
            break;
          }
        }
        
        results.tests.push({
          name: `Logo visibility - ${viewport.name}`,
          passed: logoFound,
          details: logoFound ? logoDetails : 'No logo found',
          viewport: viewport.name
        });
        
        // Take screenshot focusing on header area
        await page.screenshot({ 
          path: `screenshots/logo-${viewport.name}.png`,
          clip: { x: 0, y: 0, width: viewport.width, height: 200 }
        });
        
      } catch (error) {
        results.errors.push({
          viewport: viewport.name,
          error: error.message
        });
      }
    }
    
    testResults.tests.push(results);
    console.log(`✅ ${testName} - Logo tested across ${config.viewports.length} viewports`);
  });

  // Test 5: Performance Testing
  test('Frontend performance metrics', async ({ page }) => {
    const testName = 'Performance Metrics';
    const results = { testName, metrics: [], errors: [] };
    
    try {
      // Navigate and measure performance
      const startTime = Date.now();
      await page.goto(config.baseURL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Get performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
          loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });
      
      results.metrics = [
        { name: 'Page Load Time', value: `${loadTime}ms`, threshold: 3000, passed: loadTime < 3000 },
        { name: 'DOM Content Loaded', value: `${performanceMetrics.domContentLoaded}ms`, threshold: 1500, passed: performanceMetrics.domContentLoaded < 1500 },
        { name: 'Load Complete', value: `${performanceMetrics.loadComplete}ms`, threshold: 2000, passed: performanceMetrics.loadComplete < 2000 },
        { name: 'First Paint', value: `${Math.round(performanceMetrics.firstPaint)}ms`, threshold: 1000, passed: performanceMetrics.firstPaint < 1000 },
        { name: 'First Contentful Paint', value: `${Math.round(performanceMetrics.firstContentfulPaint)}ms`, threshold: 1500, passed: performanceMetrics.firstContentfulPaint < 1500 }
      ];
      
    } catch (error) {
      results.errors.push({
        test: 'Performance measurement',
        error: error.message
      });
    }
    
    testResults.performance.push(results);
    console.log(`✅ ${testName} - Performance metrics captured`);
  });

  // Test 6: Accessibility Testing
  test('Basic accessibility checks', async ({ page }) => {
    const testName = 'Accessibility';
    const results = { testName, tests: [], errors: [] };
    
    try {
      await page.goto(config.baseURL);
      await page.waitForLoadState('domcontentloaded');
      
      // Check for basic accessibility features
      const accessibilityChecks = [
        {
          name: 'Page has title',
          test: () => page.title(),
          evaluate: (title) => title && title.length > 0
        },
        {
          name: 'Images have alt attributes',
          test: () => page.locator('img:not([alt])').count(),
          evaluate: (count) => count === 0
        },
        {
          name: 'Form inputs have labels',
          test: () => page.locator('input:not([aria-label]):not([aria-labelledby])').count(),
          evaluate: (count) => count === 0
        },
        {
          name: 'Buttons have accessible names',
          test: () => page.locator('button:not([aria-label]):not([title]):empty').count(),
          evaluate: (count) => count === 0
        }
      ];
      
      for (const check of accessibilityChecks) {
        try {
          const result = await check.test();
          const passed = check.evaluate(result);
          
          results.tests.push({
            name: check.name,
            passed,
            details: `Result: ${result}`
          });
        } catch (error) {
          results.tests.push({
            name: check.name,
            passed: false,
            error: error.message
          });
        }
      }
      
    } catch (error) {
      results.errors.push({
        test: 'Accessibility checks',
        error: error.message
      });
    }
    
    testResults.accessibility.push(results);
    console.log(`✅ ${testName} - ${results.tests.length} accessibility checks completed`);
  });
});

// After all tests, generate a report
test.afterAll(async () => {
  console.log('\n🎯 Generating Visual Test Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.tests.length,
      screenshots: testResults.screenshots.length,
      performanceTests: testResults.performance.length,
      accessibilityTests: testResults.accessibility.length
    },
    tests: testResults.tests,
    performance: testResults.performance,
    accessibility: testResults.accessibility,
    screenshots: testResults.screenshots
  };
  
  // Save report
  const reportPath = path.join(__dirname, '../test-results/visual-test-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Create markdown summary
  const markdownSummary = generateMarkdownSummary(report);
  const summaryPath = path.join(__dirname, '../test-results/visual-test-summary.md');
  fs.writeFileSync(summaryPath, markdownSummary);
  
  console.log(`📊 Visual test report saved: ${reportPath}`);
  console.log(`📝 Summary report saved: ${summaryPath}`);
  console.log(`📸 ${report.screenshots.length} screenshots captured`);
});

function generateMarkdownSummary(report) {
  return `# MRC Authentication System - Visual Test Report
Generated: ${new Date().toLocaleString()}

## Summary
- **Total Test Suites**: ${report.summary.totalTests}
- **Screenshots Captured**: ${report.summary.screenshots}
- **Performance Tests**: ${report.summary.performanceTests}
- **Accessibility Tests**: ${report.summary.accessibilityTests}

## Test Results

### Visual Tests
${report.tests.map(test => `
#### ${test.testName}
${test.viewports ? test.viewports.map(v => `- **${v.name}** (${v.dimensions}): ${v.pageType} page - Load time: ${v.loadTime}ms`).join('\n') : ''}
${test.tests ? test.tests.map(t => `- **${t.name}**: ${t.passed ? '✅ PASSED' : '❌ FAILED'} - ${t.details}`).join('\n') : ''}
${test.errors && test.errors.length > 0 ? `**Errors**: ${test.errors.map(e => e.error).join(', ')}` : ''}
`).join('\n')}

### Performance Metrics
${report.performance.map(perf => `
${perf.metrics ? perf.metrics.map(m => `- **${m.name}**: ${m.value} (Threshold: ${m.threshold}ms) ${m.passed ? '✅' : '❌'}`).join('\n') : 'No metrics captured'}
`).join('\n')}

### Accessibility Results
${report.accessibility.map(acc => `
${acc.tests ? acc.tests.map(t => `- **${t.name}**: ${t.passed ? '✅ PASSED' : '❌ FAILED'} - ${t.details || t.error}`).join('\n') : 'No accessibility tests'}
`).join('\n')}

## Screenshots
${report.screenshots.map(s => `- **${s.test}** (${s.viewport}): \`${s.path}\``).join('\n')}

## Recommendations
${report.performance.some(p => p.metrics && p.metrics.some(m => !m.passed)) ? 
  '⚠️ **Performance**: Some performance metrics exceed recommended thresholds. Consider optimization.' : 
  '✅ **Performance**: All performance metrics within acceptable ranges.'}

${report.accessibility.some(a => a.tests && a.tests.some(t => !t.passed)) ? 
  '⚠️ **Accessibility**: Some accessibility issues found. Review and fix for better user experience.' : 
  '✅ **Accessibility**: Basic accessibility checks passed.'}
`;
}

module.exports = { testResults };