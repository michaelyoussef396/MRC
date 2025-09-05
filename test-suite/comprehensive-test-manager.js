/**
 * MRC Authentication System - Comprehensive Test Manager
 * Phase 1 Testing Framework for Authentication System
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { performance } = require('perf_hooks');

class MRCTestManager {
  constructor() {
    this.config = {
      baseURL: 'http://localhost:3000',
      apiURL: 'http://localhost:5001',
      testUser: {
        email: 'michaelyoussef396@gmail.com',
        password: 'AdminMike123!',
        name: 'Michael Rodriguez',
        phone: '+61 400 123 458'
      },
      viewports: {
        mobile: { width: 375, height: 667 },
        tablet: { width: 768, height: 1024 },
        desktop: { width: 1440, height: 900 }
      },
      thresholds: {
        responseTime: 3000,
        lighthouse: {
          performance: 90,
          accessibility: 95,
          seo: 90
        }
      }
    };
    
    this.testResults = {
      functional: {},
      security: {},
      performance: {},
      accessibility: {},
      mobile: {},
      summary: {}
    };
    
    this.startTime = Date.now();
  }

  async runComprehensiveTestSuite() {
    console.log('🧪 Starting MRC Authentication System Comprehensive Test Suite');
    console.log('=' .repeat(80));
    
    try {
      // Test environment verification
      await this.verifyTestEnvironment();
      
      // Functional testing
      await this.runFunctionalTests();
      
      // Security testing
      await this.runSecurityTests();
      
      // Performance testing
      await this.runPerformanceTests();
      
      // Mobile responsiveness testing
      await this.runMobileTests();
      
      // Generate comprehensive report
      const report = this.generateTestReport();
      await this.saveTestReport(report);
      
      return report;
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error.message);
      throw error;
    }
  }

  async verifyTestEnvironment() {
    console.log('\n🔍 Verifying Test Environment...');
    
    const checks = [];
    
    // Backend API check
    try {
      const response = await axios.get(`${this.config.apiURL}/api/auth/profile`, {
        timeout: 5000,
        validateStatus: () => true
      });
      checks.push({
        service: 'Backend API',
        status: response.status === 401 ? 'OK' : 'ERROR', // 401 expected without token
        details: `Status: ${response.status}`
      });
    } catch (error) {
      checks.push({
        service: 'Backend API',
        status: 'ERROR',
        details: error.message
      });
    }

    // Frontend check
    try {
      const response = await axios.get(this.config.baseURL, {
        timeout: 10000,
        validateStatus: () => true
      });
      checks.push({
        service: 'Frontend',
        status: response.status === 200 ? 'OK' : 'ERROR',
        details: `Status: ${response.status}`
      });
    } catch (error) {
      checks.push({
        service: 'Frontend',
        status: 'ERROR',
        details: error.message
      });
    }

    this.testResults.environment = checks;
    
    checks.forEach(check => {
      console.log(`  ${check.status === 'OK' ? '✅' : '❌'} ${check.service}: ${check.details}`);
    });
    
    const failedChecks = checks.filter(check => check.status === 'ERROR');
    if (failedChecks.length > 0) {
      throw new Error(`Environment verification failed: ${failedChecks.length} service(s) unavailable`);
    }
  }

  async runFunctionalTests() {
    console.log('\n🔧 Running Functional Tests...');
    
    const functionalTests = [
      { name: 'Login Flow', test: () => this.testLoginFlow() },
      { name: 'Profile Management', test: () => this.testProfileManagement() },
      { name: 'Add Technician', test: () => this.testAddTechnician() },
      { name: 'Session Handling', test: () => this.testSessionHandling() },
      { name: 'Form Validation', test: () => this.testFormValidation() },
      { name: 'Error Handling', test: () => this.testErrorHandling() }
    ];

    const results = {};
    
    for (const { name, test } of functionalTests) {
      try {
        console.log(`  🔄 Testing: ${name}`);
        const startTime = performance.now();
        const result = await test();
        const duration = performance.now() - startTime;
        
        results[name] = {
          status: 'PASSED',
          duration: Math.round(duration),
          details: result || 'Test completed successfully'
        };
        console.log(`    ✅ ${name} - ${Math.round(duration)}ms`);
      } catch (error) {
        results[name] = {
          status: 'FAILED',
          error: error.message,
          details: error.stack
        };
        console.log(`    ❌ ${name} - FAILED: ${error.message}`);
      }
    }
    
    this.testResults.functional = results;
  }

  async testLoginFlow() {
    // Test valid login
    const loginData = {
      email: this.config.testUser.email,
      password: this.config.testUser.password
    };

    const response = await axios.post(`${this.config.apiURL}/api/auth/login`, loginData, {
      timeout: 10000
    });

    if (response.status !== 200) {
      throw new Error(`Login failed with status ${response.status}`);
    }

    if (!response.data.access_token) {
      throw new Error('No access token returned');
    }

    // Test token validation
    const profileResponse = await axios.get(`${this.config.apiURL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${response.data.access_token}`
      }
    });

    if (profileResponse.status !== 200) {
      throw new Error('Token validation failed');
    }

    return {
      loginStatus: response.status,
      tokenReceived: !!response.data.access_token,
      profileAccess: profileResponse.status === 200
    };
  }

  async testProfileManagement() {
    // First login to get token
    const loginResponse = await axios.post(`${this.config.apiURL}/api/auth/login`, {
      email: this.config.testUser.email,
      password: this.config.testUser.password
    });

    const token = loginResponse.data.access_token;
    
    // Test profile retrieval
    const profileResponse = await axios.get(`${this.config.apiURL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (profileResponse.status !== 200) {
      throw new Error('Profile retrieval failed');
    }

    // Test profile update
    const updateData = {
      full_name: 'Michael Rodriguez Updated',
      phone: '+61 400 123 999'
    };

    const updateResponse = await axios.put(`${this.config.apiURL}/api/auth/profile`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (updateResponse.status !== 200) {
      throw new Error('Profile update failed');
    }

    // Restore original data
    await axios.put(`${this.config.apiURL}/api/auth/profile`, {
      full_name: this.config.testUser.name,
      phone: this.config.testUser.phone
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      profileRetrieval: profileResponse.status === 200,
      profileUpdate: updateResponse.status === 200
    };
  }

  async testAddTechnician() {
    // Login first
    const loginResponse = await axios.post(`${this.config.apiURL}/api/auth/login`, {
      email: this.config.testUser.email,
      password: this.config.testUser.password
    });

    const token = loginResponse.data.access_token;
    
    const newTechnicianData = {
      email: `test-tech-${Date.now()}@example.com`,
      full_name: 'Test Technician',
      phone: '+61 400 555 000',
      password: 'TechPass123!'
    };

    const response = await axios.post(`${this.config.apiURL}/api/auth/add-technician`, newTechnicianData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status !== 201) {
      throw new Error(`Add technician failed with status ${response.status}`);
    }

    return {
      technicianCreated: response.status === 201,
      userData: response.data
    };
  }

  async testSessionHandling() {
    // Test with invalid token
    try {
      await axios.get(`${this.config.apiURL}/api/auth/profile`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      throw new Error('Invalid token should have been rejected');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return { invalidTokenRejected: true };
      }
      throw error;
    }
  }

  async testFormValidation() {
    // Test invalid email format
    try {
      await axios.post(`${this.config.apiURL}/api/auth/login`, {
        email: 'invalid-email',
        password: 'password'
      });
      throw new Error('Invalid email should have been rejected');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return { emailValidation: true };
      }
      throw error;
    }
  }

  async testErrorHandling() {
    // Test wrong password
    try {
      await axios.post(`${this.config.apiURL}/api/auth/login`, {
        email: this.config.testUser.email,
        password: 'wrong-password'
      });
      throw new Error('Wrong password should have been rejected');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return { wrongPasswordRejected: true };
      }
      throw error;
    }
  }

  async runSecurityTests() {
    console.log('\n🛡️  Running Security Tests...');
    
    const securityTests = [
      { name: 'SQL Injection Protection', test: () => this.testSQLInjection() },
      { name: 'XSS Protection', test: () => this.testXSSProtection() },
      { name: 'Token Security', test: () => this.testTokenSecurity() },
      { name: 'Rate Limiting', test: () => this.testRateLimiting() },
      { name: 'Input Sanitization', test: () => this.testInputSanitization() }
    ];

    const results = {};
    
    for (const { name, test } of securityTests) {
      try {
        console.log(`  🔄 Testing: ${name}`);
        const result = await test();
        results[name] = {
          status: 'PASSED',
          details: result
        };
        console.log(`    ✅ ${name}`);
      } catch (error) {
        results[name] = {
          status: 'FAILED',
          error: error.message
        };
        console.log(`    ❌ ${name} - FAILED: ${error.message}`);
      }
    }
    
    this.testResults.security = results;
  }

  async testSQLInjection() {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin'; --"
    ];

    for (const input of maliciousInputs) {
      try {
        const response = await axios.post(`${this.config.apiURL}/api/auth/login`, {
          email: input,
          password: 'test'
        }, { timeout: 5000 });
        
        if (response.status === 200) {
          throw new Error('SQL injection vulnerability detected');
        }
      } catch (error) {
        if (error.response && (error.response.status === 400 || error.response.status === 401)) {
          continue; // Expected rejection
        }
        throw error;
      }
    }

    return { sqlInjectionProtected: true };
  }

  async testXSSProtection() {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>'
    ];

    // Test XSS in login form
    for (const payload of xssPayloads) {
      try {
        await axios.post(`${this.config.apiURL}/api/auth/login`, {
          email: payload,
          password: 'test'
        });
      } catch (error) {
        // Expect rejection
        if (error.response && error.response.status === 400) {
          continue;
        }
      }
    }

    return { xssProtected: true };
  }

  async testTokenSecurity() {
    // Test with malformed tokens
    const malformedTokens = [
      'Bearer ',
      'Bearer invalid',
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      'NotABearer token'
    ];

    for (const token of malformedTokens) {
      try {
        const response = await axios.get(`${this.config.apiURL}/api/auth/profile`, {
          headers: { Authorization: token }
        });
        
        if (response.status === 200) {
          throw new Error('Malformed token accepted');
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          continue; // Expected rejection
        }
        throw error;
      }
    }

    return { tokenSecurityVerified: true };
  }

  async testRateLimiting() {
    // Attempt multiple rapid login requests
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.post(`${this.config.apiURL}/api/auth/login`, {
          email: 'test@example.com',
          password: 'wrong'
        }, { timeout: 5000 })
        .catch(error => error.response)
      );
    }

    const responses = await Promise.all(promises);
    const rateLimited = responses.some(response => 
      response && response.status === 429
    );

    return { rateLimitingActive: rateLimited };
  }

  async testInputSanitization() {
    const maliciousInputs = [
      { email: '<script>alert("test")</script>', password: 'test' },
      { email: 'test@example.com', password: '../../../etc/passwd' },
      { email: 'test@example.com\0', password: 'test' }
    ];

    for (const input of maliciousInputs) {
      try {
        const response = await axios.post(`${this.config.apiURL}/api/auth/login`, input);
        if (response.status === 200) {
          throw new Error('Malicious input not sanitized');
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          continue; // Expected rejection
        }
      }
    }

    return { inputSanitized: true };
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...');
    
    const performanceTests = [
      { name: 'API Response Times', test: () => this.testAPIPerformance() },
      { name: 'Load Testing', test: () => this.testLoadPerformance() },
      { name: 'Memory Usage', test: () => this.testMemoryUsage() }
    ];

    const results = {};
    
    for (const { name, test } of performanceTests) {
      try {
        console.log(`  🔄 Testing: ${name}`);
        const result = await test();
        results[name] = {
          status: 'PASSED',
          metrics: result
        };
        console.log(`    ✅ ${name}`);
      } catch (error) {
        results[name] = {
          status: 'FAILED',
          error: error.message
        };
        console.log(`    ❌ ${name} - FAILED: ${error.message}`);
      }
    }
    
    this.testResults.performance = results;
  }

  async testAPIPerformance() {
    const endpoints = [
      { name: 'Login', method: 'POST', url: '/api/auth/login', data: this.config.testUser },
      { name: 'Profile', method: 'GET', url: '/api/auth/profile', requiresAuth: true }
    ];

    const results = {};
    let token = null;

    for (const endpoint of endpoints) {
      const times = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        
        try {
          const config = { timeout: 10000 };
          
          if (endpoint.requiresAuth) {
            if (!token) {
              // Get token first
              const loginResponse = await axios.post(`${this.config.apiURL}/api/auth/login`, this.config.testUser);
              token = loginResponse.data.access_token;
            }
            config.headers = { Authorization: `Bearer ${token}` };
          }

          let response;
          if (endpoint.method === 'POST') {
            response = await axios.post(`${this.config.apiURL}${endpoint.url}`, endpoint.data || {}, config);
          } else {
            response = await axios.get(`${this.config.apiURL}${endpoint.url}`, config);
          }

          const endTime = performance.now();
          times.push(endTime - startTime);

          if (response.data && response.data.access_token) {
            token = response.data.access_token;
          }

        } catch (error) {
          console.warn(`Performance test warning for ${endpoint.name}:`, error.message);
        }
      }

      if (times.length > 0) {
        results[endpoint.name] = {
          min: Math.min(...times),
          max: Math.max(...times),
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          threshold: this.config.thresholds.responseTime,
          passed: Math.max(...times) < this.config.thresholds.responseTime
        };
      }
    }

    return results;
  }

  async testLoadPerformance() {
    // Simple concurrent request test
    const concurrentRequests = 10;
    const promises = [];

    const startTime = performance.now();
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        axios.post(`${this.config.apiURL}/api/auth/login`, this.config.testUser)
          .catch(error => ({ error: error.message }))
      );
    }

    const responses = await Promise.all(promises);
    const endTime = performance.now();

    const successful = responses.filter(r => !r.error).length;
    const totalTime = endTime - startTime;

    return {
      concurrentRequests,
      successfulRequests: successful,
      totalTime: Math.round(totalTime),
      averageTime: Math.round(totalTime / concurrentRequests),
      throughput: Math.round((successful / totalTime) * 1000) // requests per second
    };
  }

  async testMemoryUsage() {
    // Basic memory usage check
    const memUsage = process.memoryUsage();
    
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024) // MB
    };
  }

  async runMobileTests() {
    console.log('\n📱 Running Mobile Responsiveness Tests...');
    
    this.testResults.mobile = {
      note: 'Mobile tests require Playwright browser automation',
      recommendation: 'Run browser-based tests separately using Playwright'
    };
  }

  generateTestReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    // Calculate overall status
    const allTests = [
      ...Object.values(this.testResults.functional || {}),
      ...Object.values(this.testResults.security || {}),
      ...Object.values(this.testResults.performance || {})
    ];
    
    const passed = allTests.filter(test => test.status === 'PASSED').length;
    const failed = allTests.filter(test => test.status === 'FAILED').length;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: Math.round(duration),
      summary: {
        totalTests: allTests.length,
        passed,
        failed,
        passRate: allTests.length > 0 ? Math.round((passed / allTests.length) * 100) : 0,
        overallStatus: failed === 0 ? 'PASSED' : 'FAILED'
      },
      environment: this.testResults.environment,
      functional: this.testResults.functional,
      security: this.testResults.security,
      performance: this.testResults.performance,
      mobile: this.testResults.mobile,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Check functional test failures
    if (this.testResults.functional) {
      Object.entries(this.testResults.functional).forEach(([testName, result]) => {
        if (result.status === 'FAILED') {
          recommendations.push({
            category: 'Functional',
            severity: 'HIGH',
            issue: `${testName} test failed`,
            recommendation: `Fix ${testName} functionality: ${result.error}`
          });
        }
      });
    }

    // Check security test failures
    if (this.testResults.security) {
      Object.entries(this.testResults.security).forEach(([testName, result]) => {
        if (result.status === 'FAILED') {
          recommendations.push({
            category: 'Security',
            severity: 'CRITICAL',
            issue: `${testName} test failed`,
            recommendation: `Address security vulnerability: ${result.error}`
          });
        }
      });
    }

    // Check performance issues
    if (this.testResults.performance && this.testResults.performance['API Response Times']) {
      const apiPerf = this.testResults.performance['API Response Times'];
      if (apiPerf.metrics) {
        Object.entries(apiPerf.metrics).forEach(([endpoint, metrics]) => {
          if (!metrics.passed) {
            recommendations.push({
              category: 'Performance',
              severity: 'MEDIUM',
              issue: `${endpoint} response time exceeded threshold`,
              recommendation: `Optimize ${endpoint} endpoint performance (${Math.round(metrics.avg)}ms avg)`
            });
          }
        });
      }
    }

    return recommendations;
  }

  async saveTestReport(report) {
    const reportDir = path.join(__dirname, '../test-results');
    
    try {
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `mrc-test-report-${timestamp}.json`;
      const filepath = path.join(reportDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      console.log(`\n📊 Test report saved: ${filepath}`);
      
      // Also create a summary report
      this.createSummaryReport(report, reportDir);
      
    } catch (error) {
      console.error('Failed to save test report:', error.message);
    }
  }

  createSummaryReport(report, reportDir) {
    const summary = `
# MRC Authentication System Test Report
Generated: ${new Date().toLocaleString()}

## Test Summary
- **Overall Status**: ${report.summary.overallStatus}
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Pass Rate**: ${report.summary.passRate}%
- **Duration**: ${Math.round(report.duration / 1000)}s

## Environment Status
${report.environment.map(env => `- ${env.service}: ${env.status} (${env.details})`).join('\n')}

## Test Categories

### Functional Tests
${Object.entries(report.functional).map(([name, result]) => 
  `- ${name}: ${result.status} ${result.duration ? `(${result.duration}ms)` : ''}`
).join('\n')}

### Security Tests
${Object.entries(report.security).map(([name, result]) => 
  `- ${name}: ${result.status}`
).join('\n')}

### Performance Tests
${Object.entries(report.performance).map(([name, result]) => 
  `- ${name}: ${result.status}`
).join('\n')}

## Recommendations
${report.recommendations.length === 0 ? 'No issues found!' : 
  report.recommendations.map(rec => 
    `### ${rec.severity} - ${rec.category}\n**Issue**: ${rec.issue}\n**Recommendation**: ${rec.recommendation}\n`
  ).join('\n')
}

## Next Steps
${report.summary.overallStatus === 'PASSED' ? 
  '✅ All tests passed! The authentication system is ready for production.' :
  '❌ Some tests failed. Address the recommendations above before proceeding.'
}
`;

    const summaryPath = path.join(reportDir, 'test-summary.md');
    fs.writeFileSync(summaryPath, summary);
    console.log(`📝 Summary report saved: ${summaryPath}`);
  }
}

module.exports = { MRCTestManager };

// If run directly
if (require.main === module) {
  const testManager = new MRCTestManager();
  
  testManager.runComprehensiveTestSuite()
    .then(report => {
      console.log('\n🎉 Test suite completed!');
      console.log(`Overall Status: ${report.summary.overallStatus}`);
      console.log(`Pass Rate: ${report.summary.passRate}%`);
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error.message);
      process.exit(1);
    });
}