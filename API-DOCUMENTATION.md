# API Documentation
## MRC Lead Management System - Authentication API

**Version**: 1.0  
**Base URL**: `http://localhost:5001/api`  
**Production URL**: `https://api.mouldrestoration.com.au/api` (when deployed)  
**Protocol**: HTTP/HTTPS  
**Content-Type**: `application/json`  
**Authentication**: JWT via HttpOnly Cookies

---

## Table of Contents

1. [Authentication Overview](#authentication-overview)
2. [Authentication Endpoints](#authentication-endpoints)
3. [User Management Endpoints](#user-management-endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Security Headers](#security-headers)
7. [Examples](#examples)

---

## Authentication Overview

The MRC API uses JWT (JSON Web Tokens) for authentication with the following security features:

### Token Types
- **Access Token**: 8-hour expiration, used for API requests
- **Refresh Token**: 30-day expiration, used to renew access tokens

### Storage Method
- Tokens stored in **HttpOnly cookies** for security
- Automatic inclusion in requests (no manual token management required)
- Secure, SameSite=Lax configuration

### Security Features
- bcrypt password hashing with salt
- Progressive account lockout after failed attempts
- Rate limiting on sensitive endpoints
- Comprehensive security event logging
- Input sanitization and validation

---

## Authentication Endpoints

### POST /api/auth/login

Authenticate user and establish session with JWT tokens.

**URL**: `POST /api/auth/login`  
**Rate Limit**: 50 requests per minute  
**Authentication**: None (public endpoint)

#### Request Body
```json
{
  "email": "michaelyoussef396@gmail.com",
  "password": "AdminMike123!",
  "remember_me": false
}
```

**Parameters**:
- `email` (string, required): User's email address or username
- `password` (string, required): User's password
- `remember_me` (boolean, optional): Extend session to 30 days if true

#### Success Response (200)
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "michael",
    "email": "michaelyoussef396@gmail.com",
    "full_name": "Michael Rodriguez",
    "phone": "+61 400 123 458",
    "created_at": "2025-09-05T12:00:00.000Z",
    "last_login": "2025-09-05T12:30:00.000Z",
    "is_active": true
  }
}
```

**Set-Cookie Headers**:
- `access_token_cookie`: JWT access token (HttpOnly, Secure, SameSite=Lax)
- `refresh_token_cookie`: JWT refresh token (HttpOnly, Secure, SameSite=Lax) - only if remember_me=true

#### Error Responses

**401 Unauthorized - Invalid Credentials**
```json
{
  "error": "Invalid credentials"
}
```

**401 Unauthorized - Account Locked**
```json
{
  "error": "Account temporarily locked due to failed login attempts"
}
```

**401 Unauthorized - Account Inactive**
```json
{
  "error": "Account is deactivated"
}
```

**400 Bad Request - Missing Data**
```json
{
  "error": "Username/email and password are required"
}
```

---

### POST /api/auth/refresh

Refresh access token using refresh token.

**URL**: `POST /api/auth/refresh`  
**Authentication**: Refresh token required (via cookie)

#### Request
No request body required. Refresh token automatically included via cookie.

#### Success Response (200)
```json
{
  "message": "Token refreshed successfully",
  "user": {
    "id": 1,
    "username": "michael",
    "email": "michaelyoussef396@gmail.com",
    "full_name": "Michael Rodriguez",
    "phone": "+61 400 123 458",
    "created_at": "2025-09-05T12:00:00.000Z",
    "last_login": "2025-09-05T12:30:00.000Z",
    "is_active": true
  }
}
```

**Set-Cookie Headers**:
- `access_token_cookie`: New JWT access token

#### Error Responses

**401 Unauthorized - Invalid Refresh Token**
```json
{
  "error": "Authorization token required",
  "message": "Authorization token required"
}
```

**404 Not Found - User Not Found**
```json
{
  "error": "User not found or inactive"
}
```

---

### POST /api/auth/logout

Log out user and clear authentication cookies.

**URL**: `POST /api/auth/logout`  
**Authentication**: Access token required

#### Request
No request body required.

#### Success Response (200)
```json
{
  "message": "Logged out successfully"
}
```

**Set-Cookie Headers**:
- `access_token_cookie=; Max-Age=0`: Clears access token
- `refresh_token_cookie=; Max-Age=0`: Clears refresh token

---

### POST /api/auth/request-password-reset

Request password reset email (backend ready, email service pending).

**URL**: `POST /api/auth/request-password-reset`  
**Rate Limit**: 5 requests per minute (strict)  
**Authentication**: None (public endpoint)

#### Request Body
```json
{
  "email": "michaelyoussef396@gmail.com"
}
```

**Parameters**:
- `email` (string, required): User's email address

#### Success Response (200)
```json
{
  "message": "If the email exists in our system, a password reset link has been sent."
}
```

**Note**: Response is consistent regardless of whether email exists (prevents user enumeration).

#### Error Responses

**400 Bad Request - Missing Email**
```json
{
  "error": "Email is required"
}
```

**500 Internal Server Error - Email Service**
```json
{
  "error": "Failed to send reset email"
}
```

---

### POST /api/auth/reset-password

Reset password using token received via email.

**URL**: `POST /api/auth/reset-password`  
**Rate Limit**: 10 requests per minute  
**Authentication**: None (uses password reset token)

#### Request Body
```json
{
  "email": "michaelyoussef396@gmail.com",
  "token": "secure-reset-token-from-email",
  "new_password": "NewSecurePassword123!"
}
```

**Parameters**:
- `email` (string, required): User's email address
- `token` (string, required): Password reset token from email
- `new_password` (string, required): New password meeting strength requirements

#### Success Response (200)
```json
{
  "message": "Password has been successfully reset"
}
```

#### Error Responses

**400 Bad Request - Missing Fields**
```json
{
  "error": "Email, token, and new password are required"
}
```

**400 Bad Request - Invalid Token**
```json
{
  "error": "Invalid or expired reset token"
}
```

**400 Bad Request - Weak Password**
```json
{
  "error": "Password must contain at least one uppercase letter"
}
```

---

## User Management Endpoints

### GET /api/auth/profile

Get current user profile information.

**URL**: `GET /api/auth/profile`  
**Authentication**: Access token required

#### Request
No request body or parameters required.

#### Success Response (200)
```json
{
  "user": {
    "id": 1,
    "username": "michael",
    "email": "michaelyoussef396@gmail.com",
    "full_name": "Michael Rodriguez",
    "phone": "+61 400 123 458",
    "created_at": "2025-09-05T12:00:00.000Z",
    "last_login": "2025-09-05T12:30:00.000Z",
    "is_active": true
  }
}
```

#### Error Response

**404 Not Found - User Not Found**
```json
{
  "error": "User not found"
}
```

---

### PUT /api/auth/profile

Update current user profile information.

**URL**: `PUT /api/auth/profile`  
**Authentication**: Access token required

#### Request Body
```json
{
  "username": "michael_updated",
  "email": "newemail@example.com",
  "full_name": "Michael Rodriguez Updated",
  "phone": "+61 400 123 999",
  "current_password": "CurrentPassword123!",
  "new_password": "NewSecurePassword123!"
}
```

**Parameters** (all optional):
- `username` (string): New username (must be unique)
- `email` (string): New email address (must be unique)
- `full_name` (string): Updated full name
- `phone` (string): Updated phone number
- `current_password` (string): Required if changing password
- `new_password` (string): New password (requires current_password)

#### Success Response (200)
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "username": "michael_updated",
    "email": "newemail@example.com",
    "full_name": "Michael Rodriguez Updated",
    "phone": "+61 400 123 999",
    "created_at": "2025-09-05T12:00:00.000Z",
    "last_login": "2025-09-05T12:30:00.000Z",
    "is_active": true
  }
}
```

#### Error Responses

**400 Bad Request - Username Taken**
```json
{
  "error": "Username already taken"
}
```

**400 Bad Request - Email Taken**
```json
{
  "error": "Email already taken"
}
```

**400 Bad Request - Wrong Current Password**
```json
{
  "error": "Current password is incorrect"
}
```

**400 Bad Request - Weak New Password**
```json
{
  "error": "Password must be at least 8 characters long"
}
```

---

### POST /api/auth/add-technician

Add new technician user account (admin function).

**URL**: `POST /api/auth/add-technician`  
**Authentication**: Access token required

#### Request Body
```json
{
  "username": "glen_technician",
  "email": "glen@mouldrestoration.com.au",
  "password": "TechPassword123!",
  "full_name": "Glen Wilson",
  "phone": "+61 400 555 123"
}
```

**Parameters**:
- `username` (string, required): Unique username for new technician
- `email` (string, required): Unique email address
- `password` (string, required): Password meeting strength requirements
- `full_name` (string, required): Full name
- `phone` (string, optional): Phone number

#### Success Response (201)
```json
{
  "message": "Technician added successfully",
  "user": {
    "id": 2,
    "username": "glen_technician",
    "email": "glen@mouldrestoration.com.au",
    "full_name": "Glen Wilson",
    "phone": "+61 400 555 123",
    "created_at": "2025-09-05T13:00:00.000Z",
    "last_login": null,
    "is_active": true
  }
}
```

#### Error Responses

**400 Bad Request - Missing Required Field**
```json
{
  "error": "Full Name is required"
}
```

**400 Bad Request - Username Exists**
```json
{
  "error": "Username already exists"
}
```

**400 Bad Request - Email Exists**
```json
{
  "error": "Email already exists"
}
```

**400 Bad Request - Weak Password**
```json
{
  "error": "Password must contain at least one special character"
}
```

---

## Error Handling

### Standard Error Response Format

All API errors return a consistent JSON structure:

```json
{
  "error": "Human-readable error message",
  "message": "Optional additional context"
}
```

### HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or failed
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Password Strength Requirements

Passwords must meet all of these criteria:
- Minimum 8 characters long
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*(),.?\":{}|<>)

**Example Error Messages**:
- "Password must be at least 8 characters long"
- "Password must contain at least one uppercase letter"
- "Password must contain at least one lowercase letter"
- "Password must contain at least one number"
- "Password must contain at least one special character"

---

## Rate Limiting

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|---------|
| `/api/auth/login` | 50 requests | per minute |
| `/api/auth/request-password-reset` | 5 requests | per minute |
| `/api/auth/reset-password` | 10 requests | per minute |
| All other endpoints | 50 requests | per minute |

### Rate Limit Headers

When approaching rate limits, the following headers are included:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1693958400
```

### Rate Limit Exceeded Response

**HTTP 429 Too Many Requests**
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

---

## Security Headers

### CORS Configuration

**Allowed Origins**:
- `http://localhost:3000` (development)
- `http://localhost:3001` (development)
- `http://localhost:3002` (development)
- Production domains when deployed

**Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS  
**Allowed Headers**: Content-Type, Authorization  
**Credentials**: Supported (required for cookie authentication)

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
font-src 'self' data:;
img-src 'self' data: blob:;
connect-src 'self' http://localhost:3000 http://localhost:3001 http://localhost:3002;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
```

### Security Headers Applied

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security`: Enabled in production with HTTPS

---

## Examples

### Authentication Flow Example

#### 1. Login Request
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "michaelyoussef396@gmail.com",
    "password": "AdminMike123!",
    "remember_me": true
  }' \
  -c cookies.txt
```

#### 2. Authenticated Request
```bash
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

#### 3. Profile Update
```bash
curl -X PUT http://localhost:5001/api/auth/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "full_name": "Michael Rodriguez Updated",
    "phone": "+61 400 999 123"
  }'
```

#### 4. Logout
```bash
curl -X POST http://localhost:5001/api/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### JavaScript/Axios Examples

#### Login with Axios
```javascript
import axios from 'axios';

// Configure axios to include cookies
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5001/api';

// Login
const login = async (email, password, rememberMe = false) => {
  try {
    const response = await axios.post('/auth/login', {
      email,
      password,
      remember_me: rememberMe
    });
    
    console.log('Login successful:', response.data.user);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response.data.error);
    throw error;
  }
};
```

#### Profile Update with Axios
```javascript
const updateProfile = async (profileData) => {
  try {
    const response = await axios.put('/auth/profile', profileData);
    console.log('Profile updated:', response.data.user);
    return response.data;
  } catch (error) {
    console.error('Profile update failed:', error.response.data.error);
    throw error;
  }
};
```

#### Add Technician with Axios
```javascript
const addTechnician = async (technicianData) => {
  try {
    const response = await axios.post('/auth/add-technician', technicianData);
    console.log('Technician added:', response.data.user);
    return response.data;
  } catch (error) {
    console.error('Failed to add technician:', error.response.data.error);
    throw error;
  }
};
```

---

## Testing the API

### Using curl for Testing

#### Test Login
```bash
# Successful login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "michaelyoussef396@gmail.com", "password": "AdminMike123!"}' \
  -v -c cookies.txt

# Failed login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "wrong@email.com", "password": "wrongpassword"}' \
  -v
```

#### Test Protected Endpoint
```bash
# Get profile (requires cookies from login)
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -v
```

#### Test Rate Limiting
```bash
# Send multiple rapid requests to trigger rate limiting
for i in {1..60}; do
  curl -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test", "password": "test"}' &
done
```

### Account Lockout Testing

To test the progressive account lockout:

1. Make 3 failed login attempts (no lockout)
2. Make 2 more failed attempts (5-minute lockout)
3. Wait for lockout to expire, make 5 more failed attempts (15-minute lockout)
4. Continue pattern to test progressive delays

```bash
# Script to test account lockout
for i in {1..10}; do
  echo "Attempt $i"
  curl -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "michaelyoussef396@gmail.com", "password": "wrongpassword"}'
  sleep 1
done
```

---

## Development Notes

### Current Implementation Status
- ✅ All authentication endpoints fully implemented
- ✅ JWT token management with HttpOnly cookies
- ✅ Progressive account lockout system
- ✅ Rate limiting and security headers
- ✅ Input sanitization and validation
- ✅ Comprehensive error handling
- ✅ Security event logging

### Email Service Integration
- Backend email functionality is complete
- Email templates and reset flow implemented  
- Requires production email service credentials (SendGrid/Mailgun)
- Configuration ready in `config.py`

### Database Schema
- SQLite for development
- Migration scripts ready for PostgreSQL production
- All security fields implemented (lockout, reset tokens, audit trail)

### Security Considerations
- All passwords hashed with bcrypt
- Tokens are cryptographically secure
- Account lockout prevents brute force attacks
- Rate limiting prevents API abuse
- Security logging tracks all authentication events
- Input sanitization prevents XSS attacks
- CORS properly configured for security

---

*API Documentation Version: 1.0*  
*Last Updated: September 5, 2025*  
*For Technical Support: Contact development team*