# MRC Lead Management System - Testing Documentation

## Comprehensive Test Suite Overview

This document describes the complete testing strategy and implementation for the MRC Lead Management System Phase 1 authentication components. The test suite covers Flask backend + Next.js frontend with enterprise-grade security testing.

## Table of Contents

1. [Test Architecture](#test-architecture)
2. [Backend Testing (Flask)](#backend-testing-flask)
3. [Frontend Testing (React/Next.js)](#frontend-testing-reactnextjs)
4. [End-to-End Testing (Playwright)](#end-to-end-testing-playwright)
5. [Security Testing](#security-testing)
6. [Performance Testing](#performance-testing)
7. [Running Tests](#running-tests)
8. [CI/CD Integration](#cicd-integration)
9. [Coverage Requirements](#coverage-requirements)
10. [Troubleshooting](#troubleshooting)

## Test Architecture

### Test Pyramid Strategy
- **Unit Tests (70%)**: Individual component and function testing
- **Integration Tests (20%)**: API and component integration testing  
- **End-to-End Tests (10%)**: Complete user workflow testing

### Technology Stack
- **Backend**: pytest, pytest-flask, pytest-cov, factory-boy
- **Frontend**: Jest, React Testing Library, @testing-library/jest-dom
- **E2E**: Playwright with multi-browser support
- **Security**: Custom security test suite with penetration testing scenarios
- **Performance**: Load testing with concurrent user simulation

## Backend Testing (Flask)

### Test Structure
```
backend/tests/
├── conftest.py              # Pytest fixtures and configuration
├── unit/
│   ├── test_models.py       # User model and security features
│   └── test_auth_routes.py  # Authentication endpoints
├── integration/
│   └── test_auth_flow.py    # Complete authentication workflows
└── security/
    └── test_security_features.py  # Security vulnerability testing
```

### Key Test Categories

#### 1. User Model Tests (`test_models.py`)
- **Password Security**: bcrypt hashing, validation, strength requirements
- **Account Lockout**: Progressive lockout timing, unlock mechanisms
- **Password Reset**: Token generation, expiration, security
- **Security Logging**: Audit trail verification, event tracking
- **Data Validation**: Required fields, unique constraints, timestamps

#### 2. Authentication Routes (`test_auth_routes.py`)
- **Login Endpoint**: Valid/invalid credentials, account lockout, session management
- **Profile Management**: Update profile, password changes, input sanitization
- **Token Management**: JWT creation, refresh, expiration handling
- **Technician Creation**: Admin functionality, validation, security
- **Password Reset Flow**: Email integration, token validation, completion

#### 3. Integration Tests (`test_auth_flow.py`)
- **Complete User Journeys**: Registration → Login → Profile Update → Logout
- **Multi-User Scenarios**: Concurrent sessions, user isolation
- **Error Recovery**: Database rollbacks, network failure handling
- **Data Consistency**: API-Database synchronization verification

### Security Testing Features

#### 1. Input Sanitization (`test_security_features.py`)
- **XSS Protection**: Script injection prevention across all inputs
- **SQL Injection**: Parameterized query verification
- **Command Injection**: System command prevention
- **Path Traversal**: File system access protection

#### 2. Account Security
- **Progressive Lockout**: 3 attempts → 5min, 6 → 15min, 9 → 1hr, 12+ → 4hr max
- **Rate Limiting**: Login attempts (50/min), password reset (5/min)
- **Session Security**: HttpOnly cookies, secure token storage
- **User Enumeration Protection**: Consistent response times and messages

#### 3. Cryptographic Security
- **Password Hashing**: bcrypt with salt verification
- **Token Security**: JWT validation, secure random generation
- **Timing Attack Protection**: secrets.compare_digest usage
- **Token Expiration**: Proper access (8hr) and refresh (30d) token handling

### Running Backend Tests

```bash
# Navigate to backend directory
cd backend

# Install test dependencies
pip install -r requirements-test.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Run specific test categories
pytest -m unit          # Unit tests only
pytest -m integration   # Integration tests only
pytest -m security      # Security tests only

# Run with verbose output
pytest -v

# Run parallel tests (faster)
pytest -n auto
```

### Backend Coverage Requirements
- **Overall Coverage**: ≥85%
- **Critical Paths**: 100% (authentication, security)
- **Models**: ≥95%
- **API Endpoints**: ≥90%

## Frontend Testing (React/Next.js)

### Test Structure
```
frontend/tests/
├── components/
│   └── AuthContext.test.tsx    # Authentication context testing
├── pages/
│   ├── login.test.tsx          # Login page component
│   ├── dashboard.test.tsx      # Dashboard page component
│   └── settings.test.tsx       # Settings page component
└── integration/
    └── api-integration.test.tsx # API integration tests
```

### Key Test Categories

#### 1. Authentication Context Testing
- **State Management**: User state, loading states, authentication status
- **API Integration**: Login, logout, profile updates, token refresh
- **Error Handling**: Network failures, API errors, token expiration
- **Side Effects**: Toast notifications, route navigation, local storage

#### 2. Component Testing
- **Login Form**: Input validation, submission, error display
- **Profile Forms**: Field validation, password strength, update functionality  
- **Navigation**: Protected routes, authentication redirects
- **Responsive Design**: Mobile-first layout verification

#### 3. User Interaction Testing
- **Form Interactions**: Input changes, validation triggers, submissions
- **Button States**: Loading, disabled, success states
- **Error States**: Display, clearing, user feedback
- **Accessibility**: Keyboard navigation, screen reader compatibility

### Frontend Test Configuration

#### Jest Configuration (`jest.config.js`)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'contexts/**/*.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Running Frontend Tests

```bash
# Navigate to frontend directory
cd frontend

# Install test dependencies (already included in package.json)
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode (development)
npm run test:watch

# Run specific test files
npm test AuthContext.test.tsx

# Update snapshots (if using)
npm test -- -u
```

## End-to-End Testing (Playwright)

### Test Structure
```
frontend/tests/e2e/
├── auth-flow.spec.ts         # Complete authentication workflows
├── profile-management.spec.ts # Profile and settings functionality
├── responsive-design.spec.ts  # Mobile/tablet/desktop testing
└── accessibility.spec.ts     # WCAG compliance testing
```

### Key Test Scenarios

#### 1. Authentication Flows (`auth-flow.spec.ts`)
- **Login Process**: Form validation, successful login, error handling
- **Session Management**: Remember me, token refresh, logout
- **Route Protection**: Authenticated/unauthenticated redirects
- **Mobile Responsiveness**: Touch interactions, viewport optimization

#### 2. Profile Management
- **Profile Updates**: Field changes, validation, persistence
- **Password Changes**: Strength validation, confirmation, success flow
- **Technician Creation**: Admin functionality, form validation, error handling

#### 3. Cross-Browser Testing
- **Desktop Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: Chrome Mobile, Safari Mobile
- **Tablet Support**: iPad, Android tablets
- **Responsive Breakpoints**: 375px, 768px, 1440px viewports

#### 4. Accessibility Testing
- **Keyboard Navigation**: Tab order, Enter/Space activation
- **Screen Reader Support**: ARIA labels, roles, descriptions
- **Focus Management**: Visible focus indicators, logical tab flow
- **Color Contrast**: WCAG AA compliance verification

### Playwright Configuration (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  
  webServer: [
    {
      command: 'cd ../backend && source venv/bin/activate && python app.py',
      port: 5001,
    },
    {
      command: 'npm run dev',
      port: 3000,
    },
  ],
})
```

### Running E2E Tests

```bash
# Navigate to frontend directory
cd frontend

# Install Playwright browsers
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific browser
npx playwright test --project=chromium

# Run with UI mode (interactive)
npx playwright test --ui

# Generate test report
npx playwright show-report

# Debug tests (headed mode)
npx playwright test --headed

# Run mobile tests only
npx playwright test --grep "Mobile"
```

## Security Testing

### Security Test Categories

#### 1. Authentication Security
- **Brute Force Protection**: Rate limiting effectiveness
- **Account Lockout**: Progressive penalties, unlock mechanisms
- **Session Security**: Token validation, secure storage, expiration

#### 2. Input Validation Security
- **Injection Attacks**: SQL, NoSQL, command injection prevention
- **Cross-Site Scripting**: Script injection, HTML sanitization
- **Path Traversal**: File system access restrictions

#### 3. API Security
- **Authorization**: Proper access control, privilege escalation prevention
- **CORS Configuration**: Origin validation, credential handling
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options

#### 4. Cryptographic Security
- **Password Hashing**: bcrypt strength, salt uniqueness
- **Token Security**: JWT validation, secure random generation
- **Encryption**: Data at rest and in transit protection

### Security Testing Execution

```bash
# Run security-specific tests
cd backend
pytest -m security -v

# Run penetration testing scenarios
pytest tests/security/ -v

# Check for known vulnerabilities
pip audit

# Security linting (if configured)
bandit -r app/
```

## Performance Testing

### Performance Test Categories

#### 1. Load Testing
- **Concurrent Users**: 10, 50, 100, 500 simultaneous logins
- **API Response Times**: Login, profile updates, token refresh
- **Database Performance**: Query optimization verification
- **Memory Usage**: Memory leak detection during extended testing

#### 2. Stress Testing
- **Rate Limiting**: Verify limits under high load
- **Database Connections**: Connection pool exhaustion testing
- **Error Recovery**: System behavior under stress conditions

#### 3. Mobile Performance
- **3G Network Simulation**: Performance on slow connections
- **Battery Usage**: Efficient resource utilization
- **Touch Response**: Input latency measurement

### Running Performance Tests

```bash
# Backend performance tests
cd backend
pytest tests/performance/ -v

# Frontend bundle analysis
cd frontend
npm run analyze

# Lighthouse performance testing
npm run lighthouse
```

## Coverage Requirements

### Backend Coverage Targets
- **Overall**: 85%+ line coverage
- **Critical Authentication Paths**: 100%
- **Security Functions**: 100%
- **API Endpoints**: 90%+
- **Models**: 95%+

### Frontend Coverage Targets
- **Overall**: 80%+ line coverage
- **Authentication Components**: 95%+
- **Context Providers**: 90%+
- **Utility Functions**: 85%+

### Coverage Reports
- **HTML Reports**: Detailed file-by-file coverage analysis
- **Terminal Output**: Quick coverage summary
- **CI Integration**: Coverage status in pull requests

## Running Tests

### Complete Test Suite Execution

```bash
#!/bin/bash
# run-all-tests.sh - Complete test suite execution

echo "🧪 Starting MRC Authentication System Test Suite"

# Backend Tests
echo "📊 Running Backend Tests..."
cd backend
source venv/bin/activate
pip install -r requirements-test.txt
pytest --cov=app --cov-report=html --cov-report=term --cov-fail-under=85

# Frontend Tests  
echo "⚛️ Running Frontend Tests..."
cd ../frontend
npm install
npm run test:coverage

# E2E Tests
echo "🌐 Running E2E Tests..."
npx playwright install
npx playwright test

echo "✅ Test Suite Complete"
echo "📋 Coverage reports available:"
echo "  - Backend: backend/htmlcov/index.html"
echo "  - Frontend: frontend/coverage/lcov-report/index.html"
echo "  - E2E: frontend/playwright-report/index.html"
```

### Individual Test Commands

```bash
# Quick backend test run
cd backend && pytest

# Quick frontend test run  
cd frontend && npm test

# Quick E2E test run
cd frontend && npx playwright test --headed

# Security tests only
cd backend && pytest -m security

# Mobile tests only
cd frontend && npx playwright test --grep "Mobile"
```

## CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/test.yml`)

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt -r requirements-test.txt
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Run tests
        run: |
          cd frontend
          npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Install Playwright
        run: |
          cd frontend
          npx playwright install --with-deps
      - name: Run E2E tests
        run: |
          cd frontend
          npx playwright test
```

### Quality Gates
- **Minimum Coverage**: 85% backend, 80% frontend
- **Test Success**: All tests must pass
- **Security Tests**: All security tests must pass
- **Performance**: Response times within thresholds

## Troubleshooting

### Common Issues

#### Backend Test Issues
```bash
# Database connection issues
export FLASK_ENV=testing
flask db upgrade

# Import path issues  
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Permission issues
chmod +x run-tests.sh
```

#### Frontend Test Issues
```bash
# Node module issues
rm -rf node_modules package-lock.json
npm install

# Jest cache issues
npm test -- --clearCache

# TypeScript issues
npm run type-check
```

#### E2E Test Issues
```bash
# Browser installation
npx playwright install --with-deps

# Port conflicts
lsof -i :3000
kill -9 <PID>

# Timeout issues
npx playwright test --timeout=60000
```

### Debug Commands

```bash
# Debug backend tests
cd backend && pytest --pdb

# Debug frontend tests  
cd frontend && npm test -- --verbose

# Debug E2E tests
cd frontend && npx playwright test --debug

# Generate detailed reports
cd backend && pytest --html=report.html --self-contained-html
cd frontend && npx playwright test --reporter=html
```

## Test Maintenance

### Regular Maintenance Tasks
1. **Update Dependencies**: Monthly security and feature updates
2. **Review Coverage**: Ensure targets are maintained
3. **Performance Baselines**: Update performance expectations
4. **Browser Compatibility**: Test with latest browser versions
5. **Security Tests**: Add new attack vectors and defenses

### Best Practices
- **Test Isolation**: Each test should be independent
- **Descriptive Names**: Clear test descriptions and assertions
- **Mock External Services**: Avoid dependencies on external APIs
- **Clean Test Data**: Use factories and fixtures for consistent data
- **Regular Refactoring**: Keep tests maintainable and DRY

This comprehensive test suite ensures the MRC Lead Management System Phase 1 authentication components are thoroughly tested for functionality, security, performance, and user experience across all supported platforms and use cases.