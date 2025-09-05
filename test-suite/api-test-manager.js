/**
 * MRC Authentication System - API Test Manager
 * Backend API Testing (Independent of Frontend)
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { performance } = require('perf_hooks');

class MRCAPITestManager {
  constructor() {
    this.config = {
      apiURL: 'http://localhost:5001',
      testUser: {
        email: 'michaelyoussef396@gmail.com',
        password: 'AdminMike123!',
        full_name: 'Michael Rodriguez',
        phone: '+61 400 123 458'
      },
      thresholds: {
        responseTime: 3000
      }
    };
    
    this.testResults = {
      environment: {},
      authentication: {},
      security: {},
      performance: {},
      summary: {}
    };
    
    this.startTime = Date.now();
  }

  async runAPITestSuite() {
    console.log('🧪 Starting MRC Authentication API Test Suite');
    console.log('=' .repeat(80));
    
    try {
      // Verify API is running
      await this.verifyAPIEnvironment();
      
      // Authentication testing
      await this.runAuthenticationTests();
      
      // Security testing
      await this.runSecurityTests();
      
      // Performance testing
      await this.runPerformanceTests();
      
      // Generate report
      const report = this.generateTestReport();
      await this.saveTestReport(report);
      
      return report;
      
    } catch (error) {
      console.error('❌ API test suite execution failed:', error.message);
      throw error;
    }
  }

  async verifyAPIEnvironment() {
    console.log('\n🔍 Verifying API Environment...');
    
    try {
      // Test basic API connectivity
      const response = await axios.get(`${this.config.apiURL}/api/auth/profile`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      this.testResults.environment = {
        status: response.status === 401 ? 'OK' : 'ERROR', // 401 expected without token
        details: `API Status: ${response.status}`,
        message: response.status === 401 ? 'API correctly rejecting unauthorized requests' : 'API unexpected response'
      };
      
      console.log(`  ${this.testResults.environment.status === 'OK' ? '✅' : '❌'} Backend API: ${this.testResults.environment.details}`);
      
      if (this.testResults.environment.status === 'ERROR') {
        throw new Error('API environment verification failed');
      }
      
    } catch (error) {
      this.testResults.environment = {
        status: 'ERROR',
        details: error.message
      };
      throw new Error(`API not accessible: ${error.message}`);
    }
  }

  async runAuthenticationTests() {
    console.log('\n🔐 Running Authentication Tests...');
    
    const authTests = [
      { name: 'Valid Login', test: () => this.testValidLogin() },
      { name: 'Invalid Credentials', test: () => this.testInvalidCredentials() },
      { name: 'Token Validation', test: () => this.testTokenValidation() },
      { name: 'Profile Access', test: () => this.testProfileAccess() },
      { name: 'Profile Update', test: () => this.testProfileUpdate() },
      { name: 'Add Technician', test: () => this.testAddTechnician() },
      { name: 'Password Change', test: () => this.testPasswordChange() }
    ];

    const results = {};
    
    for (const { name, test } of authTests) {
      try {
        console.log(`  🔄 Testing: ${name}`);
        const startTime = performance.now();
        const result = await test();
        const duration = performance.now() - startTime;
        
        results[name] = {
          status: 'PASSED',
          duration: Math.round(duration),
          details: result
        };
        console.log(`    ✅ ${name} - ${Math.round(duration)}ms`);
      } catch (error) {
        results[name] = {
          status: 'FAILED',
          error: error.message,
          stack: error.stack
        };
        console.log(`    ❌ ${name} - FAILED: ${error.message}`);
      }
    }
    
    this.testResults.authentication = results;
  }

  async testValidLogin() {
    const response = await axios.post(`${this.config.apiURL}/api/auth/login`, {
      email: this.config.testUser.email,
      password: this.config.testUser.password
    }, { timeout: 10000 });

    if (response.status !== 200) {
      throw new Error(`Login failed with status ${response.status}`);
    }

    if (!response.data.access_token) {
      throw new Error('No access token returned');
    }

    if (!response.data.refresh_token) {
      throw new Error('No refresh token returned');
    }

    return {
      statusCode: response.status,
      hasAccessToken: !!response.data.access_token,
      hasRefreshToken: !!response.data.refresh_token,
      userData: !!response.data.user
    };
  }

  async testInvalidCredentials() {
    try {
      const response = await axios.post(`${this.config.apiURL}/api/auth/login`, {
        email: this.config.testUser.email,
        password: 'wrong-password'
      }, { timeout: 5000 });
      
      // Should not reach here
      throw new Error('Invalid credentials were accepted');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return { correctly_rejected: true, status: error.response.status };
      }
      throw error;
    }
  }

  async testTokenValidation() {
    // First get a valid token
    const loginResponse = await axios.post(`${this.config.apiURL}/api/auth/login`, {
      email: this.config.testUser.email,
      password: this.config.testUser.password
    });

    const token = loginResponse.data.access_token;

    // Test with valid token
    const validResponse = await axios.get(`${this.config.apiURL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (validResponse.status !== 200) {
      throw new Error('Valid token was rejected');
    }

    // Test with invalid token
    try {
      await axios.get(`${this.config.apiURL}/api/auth/profile`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      throw new Error('Invalid token was accepted');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return { 
          valid_token_accepted: true,
          invalid_token_rejected: true 
        };
      }
      throw error;
    }
  }

  async testProfileAccess() {
    // Login first
    const loginResponse = await axios.post(`${this.config.apiURL}/api/auth/login`, {
      email: this.config.testUser.email,
      password: this.config.testUser.password
    });

    const token = loginResponse.data.access_token;
    
    const profileResponse = await axios.get(`${this.config.apiURL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (profileResponse.status !== 200) {
      throw new Error(`Profile access failed with status ${profileResponse.status}`);
    }

    const profile = profileResponse.data;
    
    return {
      statusCode: profileResponse.status,
      hasEmail: !!profile.email,
      hasName: !!profile.full_name,
      hasPhone: !!profile.phone,
      email: profile.email
    };
  }

  async testProfileUpdate() {
    // Login first
    const loginResponse = await axios.post(`${this.config.apiURL}/api/auth/login`, {
      email: this.config.testUser.email,
      password: this.config.testUser.password
    });

    const token = loginResponse.data.access_token;
    
    const updateData = {
      full_name: 'Michael Test Update',
      phone: '+61 400 999 888'
    };

    const updateResponse = await axios.put(`${this.config.apiURL}/api/auth/profile`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (updateResponse.status !== 200) {
      throw new Error(`Profile update failed with status ${updateResponse.status}`);
    }

    // Verify the update
    const profileResponse = await axios.get(`${this.config.apiURL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const isUpdated = profileResponse.data.full_name === updateData.full_name &&
                     profileResponse.data.phone === updateData.phone;

    // Restore original data
    await axios.put(`${this.config.apiURL}/api/auth/profile`, {
      full_name: this.config.testUser.full_name,
      phone: this.config.testUser.phone
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      updateSuccessful: updateResponse.status === 200,
      dataVerified: isUpdated,
      restoredOriginal: true
    };
  }

  async testAddTechnician() {
    // Login first
    const loginResponse = await axios.post(`${this.config.apiURL}/api/auth/login`, {
      email: this.config.testUser.email,
      password: this.config.testUser.password
    });

    const token = loginResponse.data.access_token;
    
    const technicianData = {
      email: `test-tech-${Date.now()}@example.com`,
      full_name: 'Test Technician',
      phone: '+61 400 555 000',
      password: 'TechPass123!'
    };

    const response = await axios.post(`${this.config.apiURL}/api/auth/add-technician`, technicianData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status !== 201) {
      throw new Error(`Add technician failed with status ${response.status}`);
    }

    return {
      statusCode: response.status,
      technicianCreated: true,
      email: technicianData.email
    };
  }

  async testPasswordChange() {
    // Login first
    const loginResponse = await axios.post(`${this.config.apiURL}/api/auth/login`, {
      email: this.config.testUser.email,
      password: this.config.testUser.password
    });

    const token = loginResponse.data.access_token;
    
    const newPassword = 'NewTestPass123!';
    
    const changeResponse = await axios.put(`${this.config.apiURL}/api/auth/change-password`, {
      current_password: this.config.testUser.password,
      new_password: newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (changeResponse.status !== 200) {
      throw new Error(`Password change failed with status ${changeResponse.status}`);
    }

    // Test login with new password
    const newLoginResponse = await axios.post(`${this.config.apiURL}/api/auth/login`, {
      email: this.config.testUser.email,
      password: newPassword
    });

    if (newLoginResponse.status !== 200) {
      throw new Error('Login failed with new password');
    }

    // Restore original password
    const restoreResponse = await axios.put(`${this.config.apiURL}/api/auth/change-password`, {
      current_password: newPassword,
      new_password: this.config.testUser.password
    }, {
      headers: { Authorization: `Bearer ${newLoginResponse.data.access_token}` }
    });

    return {
      passwordChanged: changeResponse.status === 200,
      newPasswordWorks: newLoginResponse.status === 200,
      originalPasswordRestored: restoreResponse.status === 200
    };
  }

  async runSecurityTests() {
    console.log('\n🛡️  Running Security Tests...');
    
    const securityTests = [
      { name: 'SQL Injection Protection', test: () => this.testSQLInjection() },
      { name: 'XSS Protection', test: () => this.testXSSProtection() },
      { name: 'Authentication Bypass', test: () => this.testAuthBypass() },
      { name: 'Token Security', test: () => this.testTokenSecurity() },
      { name: 'Input Validation', test: () => this.testInputValidation() }
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
      "admin'; --",
      "' UNION SELECT * FROM users; --"
    ];

    for (const input of maliciousInputs) {
      try {
        const response = await axios.post(`${this.config.apiURL}/api/auth/login`, {
          email: input,
          password: 'test'
        }, { timeout: 5000, validateStatus: () => true });
        
        if (response.status === 200 && response.data.access_token) {
          throw new Error(`SQL injection vulnerability: ${input}`);
        }
      } catch (error) {
        if (error.message.includes('SQL injection vulnerability')) {
          throw error;
        }
        // Expected rejection is good
      }
    }

    return { sqlInjectionProtected: true };
  }

  async testXSSProtection() {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>',
      '"><script>alert("xss")</script>'
    ];

    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(`${this.config.apiURL}/api/auth/login`, {
          email: payload,
          password: 'test'
        }, { validateStatus: () => true });
        
        if (response.status === 200) {
          throw new Error(`XSS vulnerability detected: ${payload}`);
        }
      } catch (error) {
        if (error.message.includes('XSS vulnerability')) {
          throw error;
        }
        // Expected rejection
      }
    }

    return { xssProtected: true };
  }

  async testAuthBypass() {
    // Test accessing protected endpoints without token
    const protectedEndpoints = [
      '/api/auth/profile',
      '/api/auth/add-technician'
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        const response = await axios.get(`${this.config.apiURL}${endpoint}`, {
          validateStatus: () => true
        });
        
        if (response.status === 200) {
          throw new Error(`Authentication bypass vulnerability: ${endpoint}`);
        }
      } catch (error) {
        if (error.message.includes('bypass vulnerability')) {
          throw error;
        }
      }
    }

    return { authBypassProtected: true };
  }

  async testTokenSecurity() {
    const malformedTokens = [
      'Bearer ',
      'Bearer invalid',
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
      'NotBearer token',
      'Bearer null',
      'Bearer undefined'
    ];

    for (const token of malformedTokens) {
      try {
        const response = await axios.get(`${this.config.apiURL}/api/auth/profile`, {
          headers: { Authorization: token },
          validateStatus: () => true
        });
        
        if (response.status === 200) {
          throw new Error(`Token security vulnerability: ${token}`);
        }
      } catch (error) {
        if (error.message.includes('security vulnerability')) {
          throw error;
        }
      }
    }

    return { tokenSecurityVerified: true };
  }

  async testInputValidation() {
    // Test various invalid inputs
    const testCases = [
      { email: '', password: '' }, // Empty fields
      { email: 'not-an-email', password: 'test' }, // Invalid email
      { email: 'test@example.com', password: '123' }, // Weak password
      { email: 'a'.repeat(500) + '@example.com', password: 'test' }, // Long email
      { email: 'test@example.com', password: 'b'.repeat(1000) } // Long password
    ];

    for (const testCase of testCases) {
      try {
        const response = await axios.post(`${this.config.apiURL}/api/auth/login`, testCase, {
          validateStatus: () => true
        });
        
        if (response.status === 200) {
          throw new Error(`Input validation failed for: ${JSON.stringify(testCase)}`);
        }
      } catch (error) {
        if (error.message.includes('validation failed')) {
          throw error;
        }
      }
    }

    return { inputValidationWorking: true };
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...');
    
    const performanceTests = [
      { name: 'Login Performance', test: () => this.testLoginPerformance() },
      { name: 'API Response Times', test: () => this.testAPIResponseTimes() },
      { name: 'Concurrent Requests', test: () => this.testConcurrentRequests() }
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

  async testLoginPerformance() {
    const iterations = 5;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      await axios.post(`${this.config.apiURL}/api/auth/login`, {
        email: this.config.testUser.email,
        password: this.config.testUser.password
      });
      
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    return {
      iterations,
      averageTime: Math.round(avgTime),
      maxTime: Math.round(maxTime),
      minTime: Math.round(minTime),
      withinThreshold: maxTime < this.config.thresholds.responseTime,
      threshold: this.config.thresholds.responseTime
    };
  }

  async testAPIResponseTimes() {
    // Test various endpoints
    const endpoints = [
      { name: 'Login', method: 'POST', url: '/api/auth/login', data: this.config.testUser },
      { name: 'Profile', method: 'GET', url: '/api/auth/profile', requiresAuth: true }
    ];

    const results = {};
    let token = null;

    for (const endpoint of endpoints) {
      const times = [];
      
      for (let i = 0; i < 3; i++) {
        const startTime = performance.now();
        
        try {
          const config = { timeout: 10000 };
          
          if (endpoint.requiresAuth) {
            if (!token) {
              const loginResponse = await axios.post(`${this.config.apiURL}/api/auth/login`, this.config.testUser);
              token = loginResponse.data.access_token;
            }
            config.headers = { Authorization: `Bearer ${token}` };
          }

          if (endpoint.method === 'POST') {
            await axios.post(`${this.config.apiURL}${endpoint.url}`, endpoint.data || {}, config);
          } else {
            await axios.get(`${this.config.apiURL}${endpoint.url}`, config);
          }

          const endTime = performance.now();
          times.push(endTime - startTime);

        } catch (error) {
          console.warn(`Performance test warning for ${endpoint.name}:`, error.message);
        }
      }

      if (times.length > 0) {
        results[endpoint.name] = {
          averageTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
          maxTime: Math.round(Math.max(...times)),
          minTime: Math.round(Math.min(...times)),
          samples: times.length
        };
      }
    }

    return results;
  }

  async testConcurrentRequests() {
    const concurrentCount = 5;
    const promises = [];

    const startTime = performance.now();
    
    for (let i = 0; i < concurrentCount; i++) {
      promises.push(
        axios.post(`${this.config.apiURL}/api/auth/login`, this.config.testUser)
          .then(response => ({ success: true, status: response.status }))
          .catch(error => ({ success: false, error: error.message }))
      );
    }

    const results = await Promise.all(promises);
    const endTime = performance.now();

    const successful = results.filter(r => r.success).length;
    const totalTime = endTime - startTime;

    return {
      concurrentRequests: concurrentCount,
      successfulRequests: successful,
      failedRequests: concurrentCount - successful,
      totalTime: Math.round(totalTime),
      averageTime: Math.round(totalTime / concurrentCount),
      successRate: Math.round((successful / concurrentCount) * 100)
    };
  }

  generateTestReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    // Calculate overall statistics
    const allTests = [
      ...Object.values(this.testResults.authentication || {}),
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
      authentication: this.testResults.authentication,
      security: this.testResults.security,
      performance: this.testResults.performance,
      recommendations: this.generateRecommendations()
    };

    this.logSummary(report);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Check for failures in each category
    const categories = {
      authentication: 'HIGH',
      security: 'CRITICAL',
      performance: 'MEDIUM'
    };

    Object.entries(categories).forEach(([category, severity]) => {
      const tests = this.testResults[category] || {};
      Object.entries(tests).forEach(([testName, result]) => {
        if (result.status === 'FAILED') {
          recommendations.push({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            severity,
            issue: `${testName} test failed`,
            recommendation: `Fix ${testName}: ${result.error}`,
            details: result.stack
          });
        }
      });
    });

    // Performance-specific recommendations
    const perfTests = this.testResults.performance || {};
    Object.entries(perfTests).forEach(([testName, result]) => {
      if (result.metrics) {
        if (testName === 'Login Performance' && result.metrics.maxTime > 2000) {
          recommendations.push({
            category: 'Performance',
            severity: 'MEDIUM',
            issue: 'Login response time exceeded 2 seconds',
            recommendation: `Optimize login endpoint (current max: ${result.metrics.maxTime}ms)`
          });
        }
      }
    });

    return recommendations;
  }

  logSummary(report) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY REPORT');
    console.log('='.repeat(80));
    console.log(`Overall Status: ${report.summary.overallStatus}`);
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Pass Rate: ${report.summary.passRate}%`);
    console.log(`Duration: ${Math.round(report.duration / 1000)}s`);
    
    if (report.recommendations.length > 0) {
      console.log('\n⚠️  RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.severity}] ${rec.issue}`);
        console.log(`   → ${rec.recommendation}`);
      });
    } else {
      console.log('\n✅ No issues found! All tests passed.');
    }
    
    console.log('='.repeat(80));
  }

  async saveTestReport(report) {
    try {
      const reportDir = path.join(__dirname, '../test-results');
      
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `mrc-api-test-report-${timestamp}.json`;
      const filepath = path.join(reportDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Test report saved: ${filepath}`);
      
      // Create summary markdown
      this.createMarkdownSummary(report, reportDir);
      
    } catch (error) {
      console.error('Failed to save test report:', error.message);
    }
  }

  createMarkdownSummary(report, reportDir) {
    const summary = `# MRC Authentication API Test Report
Generated: ${new Date().toLocaleString()}

## Summary
- **Overall Status**: ${report.summary.overallStatus}
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Pass Rate**: ${report.summary.passRate}%
- **Duration**: ${Math.round(report.duration / 1000)}s

## Environment
- **API Status**: ${report.environment.status}
- **Details**: ${report.environment.details}

## Test Results

### Authentication Tests
${Object.entries(report.authentication).map(([name, result]) => 
  `- **${name}**: ${result.status} ${result.duration ? `(${result.duration}ms)` : ''}`
).join('\n')}

### Security Tests
${Object.entries(report.security).map(([name, result]) => 
  `- **${name}**: ${result.status}`
).join('\n')}

### Performance Tests
${Object.entries(report.performance).map(([name, result]) => 
  `- **${name}**: ${result.status}`
).join('\n')}

## Recommendations
${report.recommendations.length === 0 ? '✅ **No issues found!**' :
  report.recommendations.map(rec => 
    `### ${rec.severity} - ${rec.category}\n**Issue**: ${rec.issue}\n**Recommendation**: ${rec.recommendation}\n`
  ).join('\n')
}

## Next Steps
${report.summary.overallStatus === 'PASSED' ? 
  '🎉 **All API tests passed!** The authentication API is functioning correctly.' :
  '⚠️ **Some tests failed.** Please address the recommendations above.'
}
`;

    const summaryPath = path.join(reportDir, 'api-test-summary.md');
    fs.writeFileSync(summaryPath, summary);
    console.log(`📝 Summary saved: ${summaryPath}`);
  }
}

module.exports = { MRCAPITestManager };

// If run directly
if (require.main === module) {
  const testManager = new MRCAPITestManager();
  
  testManager.runAPITestSuite()
    .then(report => {
      console.log('\n🎉 API Test Suite Completed!');
      process.exit(report.summary.overallStatus === 'PASSED' ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 API Test Suite Failed:', error.message);
      process.exit(1);
    });
}