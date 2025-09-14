#!/usr/bin/env node

/**
 * Test Script for Error Handling System
 * 
 * This script demonstrates the new centralized error handling,
 * logging, and validation system.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';
const AUTH_BASE = 'http://localhost:5100';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const testEndpoint = async (method, url, data = null, expectedStatus = 200) => {
  try {
    const config = {
      method,
      url,
      timeout: 5000,
      validateStatus: () => true // Don't throw on HTTP errors
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    log('blue', `\n📡 ${method.toUpperCase()} ${url}`);
    log('blue', `📊 Status: ${response.status}`);
    
    if (response.headers['x-request-id']) {
      log('blue', `🔍 Request ID: ${response.headers['x-request-id']}`);
    }
    
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === expectedStatus) {
      log('green', '✅ Test passed');
    } else {
      log('red', `❌ Test failed - Expected ${expectedStatus}, got ${response.status}`);
    }
    
    return response;
  } catch (error) {
    log('red', `❌ Request failed: ${error.message}`);
    return null;
  }
};

const runTests = async () => {
  log('yellow', '🚀 Starting Error Handling System Tests\n');
  
  // Test 1: API Gateway Health Check
  log('yellow', '=== Test 1: API Gateway Health Check ===');
  await testEndpoint('GET', `${API_BASE}/health`);
  
  // Test 2: API Gateway Config
  log('yellow', '\n=== Test 2: API Gateway Config ===');
  await testEndpoint('GET', `${API_BASE}/api/config`);
  
  // Test 3: 404 Error Handling
  log('yellow', '\n=== Test 3: 404 Error Handling ===');
  await testEndpoint('GET', `${API_BASE}/api/nonexistent`, null, 404);
  
  // Test 4: Auth Service Health Check
  log('yellow', '\n=== Test 4: Auth Service Health Check ===');
  await testEndpoint('GET', `${AUTH_BASE}/health`);
  
  // Test 5: Validation Error - Invalid Registration
  log('yellow', '\n=== Test 5: Validation Error - Invalid Registration ===');
  await testEndpoint('POST', `${API_BASE}/api/auth/register`, {
    username: 'ab', // Too short
    email: 'invalid-email', // Invalid format
    password: '123', // Too weak
    confirmPassword: '456' // Doesn't match
  }, 400);
  
  // Test 6: Validation Error - Missing Login Fields
  log('yellow', '\n=== Test 6: Validation Error - Missing Login Fields ===');
  await testEndpoint('POST', `${API_BASE}/api/auth/login`, {
    // Missing email/username and password
  }, 400);
  
  // Test 7: Authentication Error - Invalid Credentials
  log('yellow', '\n=== Test 7: Authentication Error - Invalid Credentials ===');
  await testEndpoint('POST', `${API_BASE}/api/auth/login`, {
    email: 'nonexistent@example.com',
    password: 'wrongpassword'
  }, 401);
  
  // Test 8: Valid Registration (if MongoDB is running)
  log('yellow', '\n=== Test 8: Valid Registration ===');
  const timestamp = Date.now();
  await testEndpoint('POST', `${API_BASE}/api/auth/register`, {
    username: `testuser${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    acceptTerms: true
  }, 201);
  
  // Test 9: Refresh Token Error
  log('yellow', '\n=== Test 9: Refresh Token Error ===');
  await testEndpoint('POST', `${API_BASE}/api/auth/refresh`, {
    refreshToken: 'invalid-token'
  }, 401);
  
  // Test 10: Email Verification Error
  log('yellow', '\n=== Test 10: Email Verification Error ===');
  await testEndpoint('POST', `${API_BASE}/api/auth/verify-email`, {
    token: 'invalid-verification-token'
  }, 400);
  
  log('yellow', '\n🏁 Tests completed!');
  log('blue', '\nCheck the server logs to see the detailed logging output.');
  log('blue', 'Each request should have a unique Request ID for tracing.');
};

// Check if servers are running
const checkServers = async () => {
  try {
    log('blue', '🔍 Checking if servers are running...');
    
    const apiGateway = await axios.get(`${API_BASE}/health`, { timeout: 2000 });
    log('green', '✅ API Gateway is running');
    
    const authService = await axios.get(`${AUTH_BASE}/health`, { timeout: 2000 });
    log('green', '✅ Auth Service is running');
    
    return true;
  } catch (error) {
    log('red', '❌ Servers are not running. Please start them first:');
    log('yellow', '   1. Start API Gateway: npm run dev:api-gateway');
    log('yellow', '   2. Start Auth Service: cd backend/services/auth-service && npm start');
    log('yellow', '   3. Make sure MongoDB is running: docker-compose up -d');
    return false;
  }
};

// Main execution
const main = async () => {
  const serversRunning = await checkServers();
  
  if (serversRunning) {
    await runTests();
  }
  
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (error) => {
  log('red', `❌ Unhandled rejection: ${error.message}`);
  process.exit(1);
});

// Run the tests
main();