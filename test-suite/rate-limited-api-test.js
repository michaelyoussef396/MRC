/**
 * MRC Authentication API - Rate-Limited Test Suite
 * Respects 5 requests/minute limit while testing core functionality
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class RateLimitedAPITester {
  constructor() {
    this.config = {
      apiURL: 'http://localhost:5001',
      testUser: {
        email: 'michaelyoussef396@gmail.com',
        password: 'AdminMike123!',
        username: 'michael' // Supporting both email and username login
      },
      requestDelay: 15000 // 15 seconds between requests to respect 5/minute limit
    };
    
    this.results = [];
    this.currentToken = null;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async logResult(testName, status, details, error = null) {
    const result = {
      test: testName,
      status,
      details,
      error,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${testName}: ${details}`);
    if (error) console.log(`   Error: ${error}`);
    
    return result;
  }

  async runSequentialTests() {
    console.log('🧪 Starting Rate-Limited API Test Suite');
    console.log('⏱️  Respecting 5 requests/minute limit with 15-second delays');
    console.log('=' .repeat(80));
    
    const tests = [
      () => this.testEnvironment(),
      () => this.testValidLogin(),
      () => this.testTokenValidation(),
      () => this.testProfileAccess(),
      () => this.testInvalidCredentials()
    ];
    
    for (let i = 0; i < tests.length; i++) {
      const testNum = i + 1;
      console.log(`\n[${testNum}/${tests.length}] Running test ${testNum}...`);
      
      try {
        await tests[i]();
      } catch (error) {
        await this.logResult(`Test ${testNum}`, 'FAIL', 'Test execution failed', error.message);
      }
      
      // Add delay between tests to respect rate limits
      if (i < tests.length - 1) {
        console.log(`⏱️  Waiting ${this.config.requestDelay / 1000} seconds for rate limit...`);
        await this.delay(this.config.requestDelay);
      }
    }
    
    return this.generateReport();
  }

  async testEnvironment() {
    try {
      // Test basic API connectivity without hitting login endpoint
      const response = await axios.get(`${this.config.apiURL}/api/auth/profile`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status === 401) {
        await this.logResult('Environment Check', 'PASS', 'API responding correctly (401 for missing auth)');
      } else {
        await this.logResult('Environment Check', 'FAIL', `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      await this.logResult('Environment Check', 'FAIL', 'API not accessible', error.message);
    }
  }

  async testValidLogin() {
    try {
      console.log('🔄 Attempting login with test credentials...');
      
      const loginData = {
        email: this.config.testUser.email,
        password: this.config.testUser.password
      };

      const response = await axios.post(`${this.config.apiURL}/api/auth/login`, loginData, {
        timeout: 10000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        this.currentToken = response.data.access_token;
        await this.logResult('Valid Login', 'PASS', 'Login successful, token received');
        
        // Log user data if available
        if (response.data.user) {
          console.log(`   User: ${response.data.user.email} (${response.data.user.full_name})`);
        }
      } else if (response.status === 429) {
        await this.logResult('Valid Login', 'FAIL', 'Rate limited - too many requests');
      } else if (response.status === 401) {
        await this.logResult('Valid Login', 'FAIL', 'Invalid credentials or user not found');
      } else {
        await this.logResult('Valid Login', 'FAIL', `Unexpected status: ${response.status}`);
      }
    } catch (error) {
      await this.logResult('Valid Login', 'FAIL', 'Request failed', error.message);
    }
  }

  async testTokenValidation() {
    if (!this.currentToken) {
      await this.logResult('Token Validation', 'SKIP', 'No token available from login test');
      return;
    }

    try {
      console.log('🔄 Testing token validation...');
      
      const response = await axios.get(`${this.config.apiURL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${this.currentToken}`
        },
        timeout: 10000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        await this.logResult('Token Validation', 'PASS', 'Valid token accepted');
      } else {
        await this.logResult('Token Validation', 'FAIL', `Token rejected with status: ${response.status}`);
      }
    } catch (error) {
      await this.logResult('Token Validation', 'FAIL', 'Token validation failed', error.message);
    }
  }

  async testProfileAccess() {
    if (!this.currentToken) {
      await this.logResult('Profile Access', 'SKIP', 'No token available');
      return;
    }

    try {
      console.log('🔄 Testing profile access...');
      
      const response = await axios.get(`${this.config.apiURL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${this.currentToken}`
        },
        timeout: 10000
      });

      if (response.status === 200 && response.data.user) {
        const user = response.data.user;
        await this.logResult('Profile Access', 'PASS', 
          `Profile data retrieved: ${user.email}, ${user.full_name}`);
      } else {
        await this.logResult('Profile Access', 'FAIL', 'No user data in response');
      }
    } catch (error) {
      await this.logResult('Profile Access', 'FAIL', 'Profile access failed', error.message);
    }
  }

  async testInvalidCredentials() {
    try {
      console.log('🔄 Testing invalid credentials handling...');
      
      const invalidLogin = {
        email: this.config.testUser.email,
        password: 'wrong-password'
      };

      const response = await axios.post(`${this.config.apiURL}/api/auth/login`, invalidLogin, {
        timeout: 10000,
        validateStatus: () => true
      });

      if (response.status === 401) {
        await this.logResult('Invalid Credentials', 'PASS', 'Invalid credentials properly rejected');
      } else if (response.status === 429) {
        await this.logResult('Invalid Credentials', 'SKIP', 'Rate limited - cannot test');
      } else {
        await this.logResult('Invalid Credentials', 'FAIL', 
          `Unexpected response for invalid credentials: ${response.status}`);
      }
    } catch (error) {
      await this.logResult('Invalid Credentials', 'FAIL', 'Test failed', error.message);
    }
  }

  generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;
    
    const report = {
      summary: {
        total,
        passed,
        failed,
        skipped,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0
      },
      results: this.results,
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };

    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Pass Rate: ${report.summary.passRate}%`);
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    this.saveReport(report);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.results.filter(r => r.status === 'FAIL');
    const skippedTests = this.results.filter(r => r.status === 'SKIP');
    
    if (failedTests.some(t => t.error && t.error.includes('429'))) {
      recommendations.push('Increase rate limits for development testing (currently 5/minute)');
    }
    
    if (failedTests.some(t => t.test === 'Valid Login')) {
      recommendations.push('Verify test user exists in database and credentials are correct');
    }
    
    if (skippedTests.length > 0) {
      recommendations.push('Re-run tests after fixing login issues to complete test coverage');
    }
    
    if (failedTests.some(t => t.test === 'Environment Check')) {
      recommendations.push('Check backend server configuration and network connectivity');
    }
    
    return recommendations;
  }

  saveReport(report) {
    try {
      const reportDir = path.join(__dirname, '../test-results');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      const filename = `rate-limited-api-test-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(reportDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report saved: ${filepath}`);
    } catch (error) {
      console.error('Failed to save report:', error.message);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new RateLimitedAPITester();
  
  tester.runSequentialTests()
    .then(report => {
      console.log('\n🎉 Rate-limited testing complete!');
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n💥 Testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = { RateLimitedAPITester };