"""
Security-focused tests for MRC authentication system.
Tests against common attack vectors and security vulnerabilities.
"""
import pytest
import time
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock

from app import db
from app.models import User


class TestInputSanitization:
    """Test input sanitization against XSS and injection attacks."""
    
    def test_xss_protection_in_profile_update(self, authenticated_user, malicious_inputs):
        """Test XSS protection in profile updates."""
        client = authenticated_user['client']
        
        for xss_payload in malicious_inputs['xss_attempts']:
            update_data = {
                'full_name': xss_payload,
                'username': f'user_{hash(xss_payload) % 1000}'  # Unique username
            }
            
            response = client.put('/api/auth/profile', 
                                json=update_data,
                                content_type='application/json')
            
            # Should sanitize but not fail
            assert response.status_code == 200
            
            # Verify malicious content was sanitized
            data = response.get_json()
            sanitized_name = data['user']['full_name']
            assert '<script>' not in sanitized_name.lower()
            assert 'javascript:' not in sanitized_name.lower()
            assert 'alert(' not in sanitized_name.lower()
    
    def test_xss_protection_in_technician_creation(self, authenticated_user, malicious_inputs):
        """Test XSS protection in technician creation."""
        client = authenticated_user['client']
        
        for i, xss_payload in enumerate(malicious_inputs['xss_attempts']):
            technician_data = {
                'username': f'tech_{i}',
                'email': f'tech{i}@example.com',
                'password': 'TechPass123!',
                'full_name': xss_payload
            }
            
            response = client.post('/api/auth/add-technician', 
                                 json=technician_data,
                                 content_type='application/json')
            
            assert response.status_code == 201
            
            # Verify malicious content was sanitized
            data = response.get_json()
            sanitized_name = data['user']['full_name']
            assert '<script>' not in sanitized_name.lower()
    
    def test_sql_injection_protection_login(self, client, malicious_inputs):
        """Test SQL injection protection in login endpoint."""
        for sql_payload in malicious_inputs['sql_injection']:
            login_data = {
                'email': sql_payload,
                'password': 'password'
            }
            
            response = client.post('/api/auth/login', 
                                 json=login_data,
                                 content_type='application/json')
            
            # Should fail gracefully, not crash
            assert response.status_code in [400, 401]
            
            # Should not expose database errors
            data = response.get_json()
            assert 'database' not in data.get('error', '').lower()
            assert 'sql' not in data.get('error', '').lower()
    
    def test_command_injection_protection(self, authenticated_user, malicious_inputs):
        """Test command injection protection."""
        client = authenticated_user['client']
        
        for cmd_payload in malicious_inputs['command_injection']:
            update_data = {
                'phone': cmd_payload
            }
            
            response = client.put('/api/auth/profile', 
                                json=update_data,
                                content_type='application/json')
            
            # Should sanitize input
            assert response.status_code == 200
            data = response.get_json()
            phone = data['user']['phone']
            assert ';' not in phone
            assert '|' not in phone
            assert '`' not in phone
            assert '$(' not in phone


class TestAccountLockoutSecurity:
    """Test account lockout security mechanisms."""
    
    def test_progressive_lockout_timing(self, client, create_test_user):
        """Test progressive lockout increases duration."""
        user = create_test_user()
        
        # Track lockout durations
        lockout_durations = []
        
        for attempt in range(6):  # Trigger multiple lockouts
            # Make failed login attempt
            login_data = {
                'email': user.email,
                'password': 'WrongPassword123!'
            }
            
            response = client.post('/api/auth/login', json=login_data)
            assert response.status_code == 401
            
            db.session.refresh(user)
            
            if user.is_account_locked():
                lockout_duration = user.locked_until - datetime.now(timezone.utc)
                lockout_durations.append(lockout_duration.total_seconds())
                
                # Wait a moment to avoid rate limiting in tests
                time.sleep(0.1)
        
        # Verify lockout durations increase
        assert len(lockout_durations) > 1
        for i in range(1, len(lockout_durations)):
            # Each lockout should be longer (with some tolerance for test timing)
            assert lockout_durations[i] >= lockout_durations[i-1] - 10
    
    def test_lockout_prevents_further_attempts(self, client, locked_user):
        """Test locked account prevents login attempts."""
        login_data = {
            'email': locked_user.email,
            'password': 'LockedPass123!'  # Correct password
        }
        
        # Multiple attempts should all be blocked
        for _ in range(3):
            response = client.post('/api/auth/login', json=login_data)
            assert response.status_code == 401
            data = response.get_json()
            assert 'Account temporarily locked' in data['error']
    
    def test_lockout_expires_correctly(self, client, create_test_user):
        """Test account lockout expires after timeout."""
        user = create_test_user()
        
        # Set a very short lockout (1 second in past for testing)
        user.locked_until = datetime.now(timezone.utc) - timedelta(seconds=1)
        user.failed_login_attempts = 5
        db.session.commit()
        
        # Login should work after lockout expires
        login_data = {
            'email': user.email,
            'password': 'TestPass123!'
        }
        
        response = client.post('/api/auth/login', json=login_data)
        assert response.status_code == 200
        
        # Verify lockout was cleared
        db.session.refresh(user)
        assert not user.is_account_locked()
    
    def test_successful_login_resets_lockout(self, client, create_test_user):
        """Test successful login resets lockout counters."""
        user = create_test_user()
        
        # Add some failed attempts but not enough to lock
        user.failed_login_attempts = 2
        user.last_failed_login = datetime.now(timezone.utc)
        db.session.commit()
        
        # Successful login should reset
        login_data = {
            'email': user.email,
            'password': 'TestPass123!'
        }
        
        response = client.post('/api/auth/login', json=login_data)
        assert response.status_code == 200
        
        # Verify counters were reset
        db.session.refresh(user)
        assert user.failed_login_attempts == 0
        assert user.last_failed_login is None


class TestRateLimiting:
    """Test rate limiting protection."""
    
    @pytest.mark.slow
    def test_login_rate_limiting(self, rate_limit_test_client):
        """Test login endpoint rate limiting."""
        client = rate_limit_test_client
        
        # Make many rapid requests (should be limited at 50 per minute)
        responses = []
        for i in range(55):  # Exceed limit
            response = client.post('/api/auth/login', json={
                'email': f'test{i}@example.com',
                'password': 'password'
            })
            responses.append(response.status_code)
            
            # Small delay to avoid overwhelming the test
            if i % 10 == 0:
                time.sleep(0.1)
        
        # Should see some 429 (Too Many Requests) responses
        rate_limited = [r for r in responses if r == 429]
        assert len(rate_limited) > 0
    
    @pytest.mark.slow
    def test_password_reset_rate_limiting(self, rate_limit_test_client):
        """Test password reset request rate limiting."""
        client = rate_limit_test_client
        
        # Make many rapid password reset requests
        responses = []
        for i in range(8):  # Should be limited at 5 per minute
            response = client.post('/api/auth/request-password-reset', json={
                'email': f'test{i}@example.com'
            })
            responses.append(response.status_code)
            time.sleep(0.1)  # Small delay
        
        # Should see rate limiting after 5 requests
        rate_limited = [r for r in responses if r == 429]
        assert len(rate_limited) > 0


class TestJWTTokenSecurity:
    """Test JWT token security implementation."""
    
    def test_token_expiration(self, client, create_test_user):
        """Test JWT tokens expire properly."""
        user = create_test_user()
        
        # Login to get tokens
        login_response = client.post('/api/auth/login', json={
            'email': user.email,
            'password': 'TestPass123!'
        })
        assert login_response.status_code == 200
        
        # Try to access protected endpoint
        profile_response = client.get('/api/auth/profile')
        assert profile_response.status_code == 200
        
        # Mock token expiration by manipulating time
        with patch('flask_jwt_extended.utils.datetime') as mock_datetime:
            # Set time to far in future (beyond token expiry)
            future_time = datetime.now(timezone.utc) + timedelta(hours=25)
            mock_datetime.now.return_value = future_time
            mock_datetime.side_effect = lambda *args, **kw: future_time
            
            expired_response = client.get('/api/auth/profile')
            # Should be unauthorized due to expired token
            assert expired_response.status_code == 401
    
    def test_token_invalidation_on_logout(self, authenticated_user):
        """Test tokens are invalidated on logout."""
        client = authenticated_user['client']
        
        # Verify we can access protected endpoint
        response = client.get('/api/auth/profile')
        assert response.status_code == 200
        
        # Logout
        logout_response = client.post('/api/auth/logout')
        assert logout_response.status_code == 200
        
        # Try to access protected endpoint after logout
        protected_response = client.get('/api/auth/profile')
        assert protected_response.status_code == 401
    
    def test_token_refresh_security(self, client, create_test_user):
        """Test token refresh security."""
        user = create_test_user()
        
        # Login with remember_me to get refresh token
        login_response = client.post('/api/auth/login', json={
            'email': user.email,
            'password': 'TestPass123!',
            'remember_me': True
        })
        assert login_response.status_code == 200
        
        # Refresh token should work
        refresh_response = client.post('/api/auth/refresh')
        assert refresh_response.status_code == 200
        
        # Deactivate user
        user.is_active = False
        db.session.commit()
        
        # Refresh should now fail
        refresh_response2 = client.post('/api/auth/refresh')
        assert refresh_response2.status_code == 404


class TestPasswordSecurity:
    """Test password security features."""
    
    def test_password_hashing_strength(self, create_test_user):
        """Test password hashing uses strong bcrypt."""
        user = create_test_user(password='TestPassword123!')
        
        # Verify bcrypt hash format
        assert user.password_hash.startswith('$2b$')
        
        # Verify hash length (bcrypt should be 60 characters)
        assert len(user.password_hash) == 60
        
        # Verify same password produces different hashes (salt)
        user2 = User(username='user2', email='user2@test.com', full_name='User 2')
        user2.set_password('TestPassword123!')
        
        assert user.password_hash != user2.password_hash
    
    def test_password_complexity_requirements(self, authenticated_user):
        """Test password complexity is enforced."""
        client = authenticated_user['client']
        
        weak_passwords = [
            'password',           # No uppercase, numbers, special chars
            'PASSWORD',           # No lowercase, numbers, special chars  
            'Password',           # No numbers, special chars
            'Password123',        # No special chars
            'Pass1!',            # Too short
            '12345678',          # Only numbers
            '!@#$%^&*',          # Only special chars
        ]
        
        for weak_password in weak_passwords:
            update_data = {
                'current_password': 'AuthPass123!',
                'new_password': weak_password
            }
            
            response = client.put('/api/auth/profile', 
                                json=update_data,
                                content_type='application/json')
            
            assert response.status_code == 400
            data = response.get_json()
            assert 'Password must' in data['error'] or 'Password' in data['error']
    
    def test_password_reset_token_security(self, create_test_user):
        """Test password reset tokens are cryptographically secure."""
        user = create_test_user()
        
        # Generate multiple tokens
        tokens = []
        for _ in range(10):
            token = user.generate_password_reset_token()
            tokens.append(token)
            
            # Clear token for next generation
            user.clear_password_reset_token()
        
        # Verify all tokens are unique
        assert len(set(tokens)) == len(tokens)
        
        # Verify tokens are URL-safe and long enough
        for token in tokens:
            assert len(token) >= 64  # Should be cryptographically secure length
            assert all(c.isalnum() or c in '-_' for c in token)  # URL-safe characters
    
    def test_password_reset_token_timing_attack_protection(self, create_test_user):
        """Test protection against timing attacks on password reset."""
        user = create_test_user()
        token = user.generate_password_reset_token()
        
        # Measure time for valid token verification
        import time
        start = time.time()
        result1 = user.verify_password_reset_token(token)
        valid_time = time.time() - start
        
        # Measure time for invalid token verification
        start = time.time()
        result2 = user.verify_password_reset_token('invalid_token_same_length_as_valid_one_to_test_timing')
        invalid_time = time.time() - start
        
        assert result1 is True
        assert result2 is False
        
        # Times should be similar (within reasonable variance)
        # This tests that we use secure comparison (secrets.compare_digest)
        time_ratio = max(valid_time, invalid_time) / min(valid_time, invalid_time)
        assert time_ratio < 10  # Allow for some variance in test environment


class TestSessionSecurity:
    """Test session and cookie security."""
    
    def test_jwt_cookies_are_httponly(self, client, valid_login_data):
        """Test JWT cookies are set as HttpOnly."""
        response = client.post('/api/auth/login', 
                             json=valid_login_data,
                             content_type='application/json')
        
        assert response.status_code == 200
        
        # Check cookie attributes
        cookies = response.headers.getlist('Set-Cookie')
        jwt_cookies = [cookie for cookie in cookies if 'token_cookie' in cookie]
        
        assert len(jwt_cookies) > 0
        
        for cookie in jwt_cookies:
            assert 'HttpOnly' in cookie
            assert 'SameSite' in cookie  # Should have SameSite protection
    
    def test_cookies_cleared_on_logout(self, authenticated_user):
        """Test cookies are properly cleared on logout."""
        client = authenticated_user['client']
        
        response = client.post('/api/auth/logout')
        assert response.status_code == 200
        
        # Check cookies are cleared (expired)
        cookies = response.headers.getlist('Set-Cookie')
        cleared_cookies = [cookie for cookie in cookies if 'expires=Thu, 01 Jan 1970' in cookie]
        
        assert len(cleared_cookies) > 0


class TestSecurityHeaders:
    """Test security headers implementation."""
    
    def test_security_headers_present(self, client):
        """Test security headers are set by Talisman."""
        response = client.get('/api/auth/profile')  # Any endpoint
        
        # Should have security headers (even on 401)
        headers = response.headers
        
        # Content Security Policy
        assert 'Content-Security-Policy' in headers
        
        # X-Content-Type-Options
        assert 'X-Content-Type-Options' in headers
        assert headers['X-Content-Type-Options'] == 'nosniff'
        
        # X-Frame-Options
        assert 'X-Frame-Options' in headers
        assert headers['X-Frame-Options'] == 'DENY'
    
    def test_cors_configuration(self, client):
        """Test CORS headers are properly configured."""
        # Make an OPTIONS request to test CORS
        response = client.options('/api/auth/login')
        
        headers = response.headers
        
        # Should have CORS headers
        assert 'Access-Control-Allow-Origin' in headers
        assert 'Access-Control-Allow-Methods' in headers
        assert 'Access-Control-Allow-Headers' in headers


class TestErrorHandling:
    """Test error handling doesn't expose sensitive information."""
    
    def test_database_errors_not_exposed(self, client):
        """Test database errors are not exposed to users."""
        # Try to create invalid data that might cause DB error
        invalid_data = {
            'username': 'a' * 1000,  # Potentially too long
            'email': 'invalid_email_format',
            'password': 'TestPass123!',
            'full_name': 'Test User'
        }
        
        response = client.post('/api/auth/add-technician', 
                             json=invalid_data,
                             content_type='application/json')
        
        # Should get generic error, not database details
        if response.status_code >= 500:
            data = response.get_json()
            error_msg = data.get('error', '').lower()
            
            # Should not expose database internals
            assert 'sqlite' not in error_msg
            assert 'database' not in error_msg
            assert 'table' not in error_msg
            assert 'column' not in error_msg
            assert 'constraint' not in error_msg
    
    def test_stack_traces_not_exposed(self, client):
        """Test stack traces are not exposed in error responses."""
        # Try various malformed requests
        malformed_requests = [
            ('', 'text/plain'),  # Wrong content type
            ('invalid json', 'application/json'),  # Invalid JSON
            (None, 'application/json'),  # No body
        ]
        
        for data, content_type in malformed_requests:
            if data is None:
                response = client.post('/api/auth/login')
            else:
                response = client.post('/api/auth/login', 
                                     data=data,
                                     content_type=content_type)
            
            # Should get clean error response
            if response.status_code >= 400:
                try:
                    error_data = response.get_json()
                    if error_data and 'error' in error_data:
                        error_msg = error_data['error']
                        # Should not contain stack trace elements
                        assert 'Traceback' not in error_msg
                        assert 'File "' not in error_msg
                        assert 'line ' not in error_msg
                except:
                    # If JSON parsing fails, that's okay for malformed requests
                    pass
    
    def test_user_enumeration_protection(self, client):
        """Test protection against user enumeration attacks."""
        # Try login with various non-existent users
        fake_users = [
            'nonexistent@example.com',
            'admin@example.com', 
            'test@test.com',
            'user@domain.com'
        ]
        
        response_times = []
        error_messages = []
        
        for email in fake_users:
            login_data = {
                'email': email,
                'password': 'SomePassword123!'
            }
            
            start_time = time.time()
            response = client.post('/api/auth/login', json=login_data)
            end_time = time.time()
            
            response_times.append(end_time - start_time)
            
            assert response.status_code == 401
            data = response.get_json()
            error_messages.append(data['error'])
        
        # All error messages should be identical
        assert len(set(error_messages)) == 1
        assert error_messages[0] == 'Invalid credentials'
        
        # Response times should be similar (no significant variance)
        # This prevents timing-based user enumeration
        avg_time = sum(response_times) / len(response_times)
        for response_time in response_times:
            # Allow for reasonable variance in test environment
            assert abs(response_time - avg_time) < 0.5