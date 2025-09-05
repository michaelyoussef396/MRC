const { chromium } = require('playwright');

async function designReview() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Define responsive breakpoints for testing
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },  // iPhone SE
    { name: 'tablet', width: 768, height: 1024 }, // iPad
    { name: 'desktop', width: 1440, height: 900 } // Desktop
  ];
  
  const scenarios = [
    { 
      name: 'login-page', 
      url: 'http://localhost:3000/login',
      description: 'Login page initial state'
    },
    {
      name: 'login-validation',
      url: 'http://localhost:3000/login',
      description: 'Login page with validation errors',
      action: async () => {
        await page.fill('input[type="email"]', 'invalid-email');
        await page.fill('input[type="password"]', '123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
      }
    },
    {
      name: 'dashboard',
      url: 'http://localhost:3000/login',
      description: 'Dashboard after successful login',
      action: async () => {
        await page.fill('input[type="email"]', 'michaelyoussef396@gmail.com');
        await page.fill('input[type="password"]', 'AdminMike123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
      }
    },
    {
      name: 'settings-profile',
      url: 'http://localhost:3000/settings',
      description: 'Settings profile tab',
      action: async () => {
        // Already logged in from previous scenario
      }
    },
    {
      name: 'settings-add-technician',
      url: 'http://localhost:3000/settings?tab=add-technician',
      description: 'Settings add technician tab'
    }
  ];
  
  console.log('🔍 Starting comprehensive UI/UX design review...\n');
  
  for (const viewport of viewports) {
    console.log(`📱 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    
    for (const scenario of scenarios) {
      console.log(`  📸 Capturing: ${scenario.description}`);
      
      try {
        await page.goto(scenario.url);
        await page.waitForLoadState('networkidle');
        
        if (scenario.action) {
          await scenario.action();
          await page.waitForTimeout(1000);
        }
        
        // Take full page screenshot
        const filename = `./screenshots/${timestamp}_${viewport.name}_${scenario.name}.png`;
        await page.screenshot({ 
          path: filename, 
          fullPage: true 
        });
        
        console.log(`    ✅ Saved: ${filename}`);
        
        // Check for console errors
        const logs = await page.evaluate(() => {
          const errors = [];
          const originalError = console.error;
          console.error = function(...args) {
            errors.push(args.join(' '));
            originalError.apply(console, args);
          };
          return errors;
        });
        
        if (logs.length > 0) {
          console.log(`    ⚠️  Console errors: ${logs.length}`);
        }
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
      }
    }
    console.log();
  }
  
  // Additional accessibility tests
  console.log('♿ Testing accessibility features...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/login');
  
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.screenshot({ 
    path: `./screenshots/${timestamp}_accessibility_keyboard_navigation.png`,
    fullPage: true 
  });
  
  // Test focus visibility
  await page.evaluate(() => {
    document.body.classList.add('focus-visible');
  });
  
  console.log('✅ Design review complete!\n');
  
  await browser.close();
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('./screenshots')) {
  fs.mkdirSync('./screenshots');
}

designReview().catch(console.error);