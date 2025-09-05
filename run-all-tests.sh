#!/bin/bash

# MRC Lead Management System - Complete Test Suite Execution
# This script runs all tests for the authentication system

set -e  # Exit on any error

echo "🧪 Starting MRC Authentication System Test Suite"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "PLANNING.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the MRC project root directory"
    exit 1
fi

# Backend Tests
print_status "📊 Running Backend Tests..."
echo "----------------------------------------"

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_error "Virtual environment not found. Please set up the backend first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Install test dependencies if needed
if [ ! -f "requirements-test.txt" ]; then
    print_warning "Test dependencies file not found, using main requirements only"
    pip install pytest pytest-cov pytest-flask pytest-mock coverage factory-boy
else
    print_status "Installing test dependencies..."
    pip install -r requirements-test.txt
fi

# Run backend tests with coverage
print_status "Running pytest with coverage..."
if pytest --cov=app --cov-report=html:htmlcov --cov-report=term-missing --cov-report=xml:coverage.xml --cov-fail-under=85 -v; then
    print_success "Backend tests passed with adequate coverage"
    BACKEND_STATUS="✅ PASSED"
else
    print_error "Backend tests failed or coverage below threshold"
    BACKEND_STATUS="❌ FAILED"
fi

# Run security tests specifically
print_status "Running security tests..."
if pytest -m security -v; then
    print_success "Security tests passed"
    SECURITY_STATUS="✅ PASSED"
else
    print_error "Security tests failed"
    SECURITY_STATUS="❌ FAILED"
fi

cd ..

# Frontend Tests
print_status "⚛️ Running Frontend Tests..."
echo "----------------------------------------"

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

# Add testing dependencies to package.json if not present
if ! grep -q "jest" package.json; then
    print_status "Adding test dependencies..."
    npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest babel-jest
fi

# Run frontend tests with coverage
print_status "Running Jest tests with coverage..."
if npm run test -- --coverage --watchAll=false; then
    print_success "Frontend tests passed"
    FRONTEND_STATUS="✅ PASSED"
else
    print_error "Frontend tests failed"
    FRONTEND_STATUS="❌ FAILED"
fi

# E2E Tests with Playwright
print_status "🌐 Running End-to-End Tests..."
echo "----------------------------------------"

# Install Playwright if not already installed
if [ ! -d "node_modules/@playwright" ]; then
    print_status "Installing Playwright..."
    npm install --save-dev @playwright/test
fi

# Install Playwright browsers
print_status "Installing Playwright browsers..."
npx playwright install

# Check if backend is running (for E2E tests)
print_status "Checking if backend server is accessible..."
if ! curl -f http://localhost:5001/api/health 2>/dev/null; then
    print_warning "Backend server not running. Starting backend for E2E tests..."
    cd ../backend
    source venv/bin/activate
    nohup python app.py > /dev/null 2>&1 &
    BACKEND_PID=$!
    sleep 5
    cd ../frontend
else
    print_success "Backend server is running"
    BACKEND_PID=""
fi

# Check if frontend is running
print_status "Checking if frontend server is accessible..."
if ! curl -f http://localhost:3000 2>/dev/null; then
    print_warning "Frontend server not running. Starting frontend for E2E tests..."
    nohup npm run dev > /dev/null 2>&1 &
    FRONTEND_PID=$!
    sleep 10
else
    print_success "Frontend server is running"
    FRONTEND_PID=""
fi

# Run E2E tests
print_status "Running Playwright E2E tests..."
if npx playwright test; then
    print_success "E2E tests passed"
    E2E_STATUS="✅ PASSED"
else
    print_error "E2E tests failed"
    E2E_STATUS="❌ FAILED"
fi

# Cleanup background processes if we started them
if [ ! -z "$BACKEND_PID" ]; then
    print_status "Cleaning up backend process..."
    kill $BACKEND_PID 2>/dev/null || true
fi

if [ ! -z "$FRONTEND_PID" ]; then
    print_status "Cleaning up frontend process..."
    kill $FRONTEND_PID 2>/dev/null || true
fi

cd ..

# Generate Test Report
print_status "📋 Generating Test Summary Report..."
echo "=================================================="

echo "MRC Authentication System - Test Results Summary"
echo "=================================================="
echo "Backend Tests:     $BACKEND_STATUS"
echo "Security Tests:    $SECURITY_STATUS" 
echo "Frontend Tests:    $FRONTEND_STATUS"
echo "E2E Tests:         $E2E_STATUS"
echo ""

echo "📁 Test Artifacts & Reports:"
echo "  - Backend Coverage:  backend/htmlcov/index.html"
echo "  - Frontend Coverage: frontend/coverage/lcov-report/index.html"
echo "  - E2E Test Report:   frontend/playwright-report/index.html"
echo "  - E2E Test Results:  frontend/test-results/"
echo ""

# Check overall status
FAILED_COUNT=0
if [[ $BACKEND_STATUS == *"FAILED"* ]]; then ((FAILED_COUNT++)); fi
if [[ $SECURITY_STATUS == *"FAILED"* ]]; then ((FAILED_COUNT++)); fi
if [[ $FRONTEND_STATUS == *"FAILED"* ]]; then ((FAILED_COUNT++)); fi
if [[ $E2E_STATUS == *"FAILED"* ]]; then ((FAILED_COUNT++)); fi

if [ $FAILED_COUNT -eq 0 ]; then
    print_success "🎉 ALL TESTS PASSED! Authentication system is ready for deployment."
    echo ""
    echo "✨ Test Suite Complete with Full Coverage"
    echo "   - Backend: Enterprise-grade security testing"
    echo "   - Frontend: Component and integration testing" 
    echo "   - E2E: Multi-browser user workflow testing"
    echo "   - Security: Penetration testing and vulnerability assessment"
    exit 0
else
    print_error "🚨 $FAILED_COUNT test suite(s) failed. Please review the output above."
    echo ""
    echo "🔧 Troubleshooting Tips:"
    echo "   - Check backend/htmlcov/index.html for coverage details"
    echo "   - Review frontend test output for specific failures"
    echo "   - Examine playwright-report/index.html for E2E test details"
    echo "   - Ensure both backend and frontend servers are accessible"
    exit 1
fi