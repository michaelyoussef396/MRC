"""
Unit tests for authentication route functionality.
Tests all auth endpoints with comprehensive scenarios including edge cases.
"""
import pytest
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock

from app import db
from app.models import User
from app.auth.routes import sanitize_input, validate_password_strength, get_client_ip


class TestAuthRouteHelpers:
    """Test utility functions used in auth routes."""
    
    def test_sanitize_input_basic(self):
        """Test basic input sanitization."""
        assert sanitize_input('normal text') == 'normal text'
        assert sanitize_input('') == ''
        assert sanitize_input(None) is None
    
    def test_sanitize_input_xss_protection(self, malicious_inputs):
        """Test XSS protection in input sanitization."""
        for xss_attempt in malicious_inputs['xss_attempts']:
            sanitized = sanitize_input(xss_attempt)
            assert '<script>' not in sanitized
            assert 'javascript:' not in sanitized
            assert '<img' not in sanitized
            assert 'alert(' not in sanitized
    
    def test_sanitize_input_html_stripping(self):
        """Test HTML tag stripping."""
        html_inputs = [
            '<b>bold text</b>',
            '<div>content</div>',
            '<a href="http://example.com">link</a>',
            '<style>body{color:red}</style>',
        ]
        
        for html_input in html_inputs:
            sanitized = sanitize_input(html_input)
            assert '<' not in sanitized
            assert '>' not in sanitized
    
    def test_validate_password_strength_valid(self, valid_passwords):
        """Test password strength validation with valid passwords."""
        for password in valid_passwords:
            is_valid, message = validate_password_strength(password)
            assert is_valid is True
            assert message == "Password meets all requirements"
    
    def test_validate_password_strength_invalid(self, invalid_passwords):
        """Test password strength validation with invalid passwords."""
        for password in invalid_passwords:
            is_valid, message = validate_password_strength(password)
            assert is_valid is False
            assert isinstance(message, str)
            assert len(message) > 0
    
    def test_validate_password_strength_specific_requirements(self):
        """Test specific password requirements."""
        # Too short
        is_valid, message = validate_password_strength('Aa1!')
        assert is_valid is False
        assert 'at least 8 characters' in message
        
        # No uppercase
        is_valid, message = validate_password_strength('password123!')
        assert is_valid is False
        assert 'uppercase letter' in message
        
        # No lowercase
        is_valid, message = validate_password_strength('PASSWORD123!')
        assert is_valid is False
        assert 'lowercase letter' in message
        
        # No number
        is_valid, message = validate_password_strength('Password!')
        assert is_valid is False
        assert 'number' in message
        
        # No special character
        is_valid, message = validate_password_strength('Password123')
        assert is_valid is False
        assert 'special character' in message
    
    @patch('app.auth.routes.request')
    def test_get_client_ip_direct(self, mock_request):
        """Test getting client IP from direct connection."""
        mock_request.environ = {
            'HTTP_X_FORWARDED_FOR': None,
            'REMOTE_ADDR': '192.168.1.100'
        }
        
        ip = get_client_ip()
        assert ip == '192.168.1.100'
    
    @patch('app.auth.routes.request')
    def test_get_client_ip_forwarded(self, mock_request):
        """Test getting client IP from X-Forwarded-For header."""
        mock_request.environ = {
            'HTTP_X_FORWARDED_FOR': '203.0.113.1',
            'REMOTE_ADDR': '192.168.1.100'
        }
        
        ip = get_client_ip()
        assert ip == '203.0.113.1'


class TestLoginEndpoint:
    """Test /api/auth/login endpoint functionality."""
    
    def test_login_success_with_email(self, client, valid_login_data):
        """Test successful login with email."""
        response = client.post('/api/auth/login', 
                             json=valid_login_data,
                             content_type='application/json')
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert data['message'] == 'Login successful'
        assert 'user' in data
        assert data['user']['email'] == valid_login_data['email']
        
        # Check JWT cookies are set
        assert 'Set-Cookie' in response.headers
        cookies = response.headers.getlist('Set-Cookie')
        access_cookie_found = any('access_token_cookie' in cookie for cookie in cookies)
        assert access_cookie_found
    
    def test_login_success_with_username(self, client):
        """Test successful login with username."""
        login_data = {
            'username': 'michael',
            'password': 'AdminMike123!',
            'remember_me': False
        }
        
        response = client.post('/api/auth/login', 
                             json=login_data,
                             content_type='application/json')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Login successful'
    
    def test_login_with_remember_me(self, client, valid_login_data):
        """Test login with remember_me creates refresh token."""
        valid_login_data['remember_me'] = True
        
        response = client.post('/api/auth/login', 
                             json=valid_login_data,
                             content_type='application/json')
        
        assert response.status_code == 200
        
        # Check both access and refresh cookies are set
        cookies = response.headers.getlist('Set-Cookie')
        access_cookie_found = any('access_token_cookie' in cookie for cookie in cookies)
        refresh_cookie_found = any('refresh_token_cookie' in cookie for cookie in cookies)
        
        assert access_cookie_found
        assert refresh_cookie_found
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        invalid_data = {
            'email': 'michaelyoussef396@gmail.com',
            'password': 'WrongPassword123!',
            'remember_me': False
        }
        
        response = client.post('/api/auth/login', 
                             json=invalid_data,
                             content_type='application/json')
        
        assert response.status_code == 401
        data = response.get_json()
        assert data['error'] == 'Invalid credentials'
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user."""
        nonexistent_data = {
            'email': 'nonexistent@example.com',
            'password': 'SomePassword123!',
            'remember_me': False
        }
        
        response = client.post('/api/auth/login', 
                             json=nonexistent_data,
                             content_type='application/json')
        
        assert response.status_code == 401
        data = response.get_json()
        assert data['error'] == 'Invalid credentials'
    
    def test_login_missing_credentials(self, client):
        """Test login with missing credentials."""
        # Missing password
        response = client.post('/api/auth/login', 
                             json={'email': 'test@example.com'},
                             content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Username/email and password are required' in data['error']
        
        # Missing email/username
        response = client.post('/api/auth/login', 
                             json={'password': 'Password123!'},
                             content_type='application/json')
        
        assert response.status_code == 400
    
    def test_login_empty_request(self, client):
        """Test login with empty request body."""
        response = client.post('/api/auth/login', 
                             json={},
                             content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Username/email and password are required' in data['error']
    
    def test_login_no_json_data(self, client):
        """Test login with no JSON data."""
        response = client.post('/api/auth/login')
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['error'] == 'No data provided'
    
    def test_login_locked_account(self, client, locked_user):
        """Test login with locked account."""
        login_data = {
            'email': locked_user.email,
            'password': 'LockedPass123!',
            'remember_me': False
        }
        
        response = client.post('/api/auth/login', 
                             json=login_data,
                             content_type='application/json')
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'Account temporarily locked' in data['error']
    
    def test_login_inactive_account(self, client, inactive_user):
        """Test login with inactive account."""
        login_data = {
            'email': inactive_user.email,
            'password': 'InactivePass123!',
            'remember_me': False
        }
        
        response = client.post('/api/auth/login', 
                             json=login_data,
                             content_type='application/json')
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'Account is deactivated' in data['error']
    
    def test_login_tracks_failed_attempts(self, client, create_test_user):
        """Test login tracks failed login attempts."""
        user = create_test_user()
        initial_attempts = user.failed_login_attempts
        
        login_data = {
            'email': user.email,
            'password': 'WrongPassword123!',
            'remember_me': False
        }
        
        response = client.post('/api/auth/login', 
                             json=login_data,
                             content_type='application/json')
        
        assert response.status_code == 401
        
        # Refresh user from database
        db.session.refresh(user)
        assert user.failed_login_attempts == initial_attempts + 1
    
    def test_login_resets_failed_attempts_on_success(self, client, create_test_user):
        """Test successful login resets failed attempts counter."""
        user = create_test_user()
        user.failed_login_attempts = 2
        db.session.commit()
        
        login_data = {
            'email': user.email,
            'password': 'TestPass123!',
            'remember_me': False
        }
        
        response = client.post('/api/auth/login', 
                             json=login_data,
                             content_type='application/json')
        
        assert response.status_code == 200
        
        # Refresh user from database
        db.session.refresh(user)
        assert user.failed_login_attempts == 0
        assert user.last_login is not None


class TestRefreshEndpoint:
    """Test /api/auth/refresh endpoint functionality."""
    
    def test_refresh_token_success(self, authenticated_user):
        """Test successful token refresh."""
        client = authenticated_user['client']
        
        response = client.post('/api/auth/refresh')
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert data['message'] == 'Token refreshed successfully'
        assert 'user' in data
        
        # Check new access token cookie is set
        cookies = response.headers.getlist('Set-Cookie')
        access_cookie_found = any('access_token_cookie' in cookie for cookie in cookies)
        assert access_cookie_found
    
    def test_refresh_token_without_token(self, client):
        """Test token refresh without refresh token."""
        response = client.post('/api/auth/refresh')
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'Authorization token required' in data['message']
    
    def test_refresh_token_inactive_user(self, client, create_test_user):
        """Test token refresh with inactive user."""
        user = create_test_user()
        
        # Login first to get tokens
        login_response = client.post('/api/auth/login', json={
            'email': user.email,
            'password': 'TestPass123!',
            'remember_me': True
        })
        assert login_response.status_code == 200
        
        # Deactivate user
        user.is_active = False
        db.session.commit()
        
        # Try to refresh
        response = client.post('/api/auth/refresh')
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'User not found or inactive' in data['error']


class TestProfileEndpoints:
    """Test profile-related endpoints."""
    
    def test_get_profile_success(self, authenticated_user):
        """Test successful profile retrieval."""
        client = authenticated_user['client']
        user = authenticated_user['user']
        
        response = client.get('/api/auth/profile')
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert 'user' in data
        user_data = data['user']
        assert user_data['username'] == user.username
        assert user_data['email'] == user.email
        assert user_data['full_name'] == user.full_name
        assert 'password_hash' not in user_data  # Should not expose password
    
    def test_get_profile_without_token(self, client):
        """Test profile retrieval without authentication."""
        response = client.get('/api/auth/profile')
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'Authorization token required' in data['message']
    
    def test_update_profile_success(self, authenticated_user):
        """Test successful profile update."""
        client = authenticated_user['client']
        user = authenticated_user['user']
        
        update_data = {
            'full_name': 'Updated Name',
            'phone': '+61 400 999 999'
        }
        
        response = client.put('/api/auth/profile', 
                            json=update_data,
                            content_type='application/json')
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert data['message'] == 'Profile updated successfully'
        assert data['user']['full_name'] == 'Updated Name'
        assert data['user']['phone'] == '+61 400 999 999'
        
        # Verify database update
        db.session.refresh(user)
        assert user.full_name == 'Updated Name'
        assert user.phone == '+61 400 999 999'
    
    def test_update_profile_with_password_change(self, authenticated_user):
        """Test profile update with password change."""
        client = authenticated_user['client']
        user = authenticated_user['user']
        
        update_data = {
            'current_password': 'AuthPass123!',
            'new_password': 'NewPassword456!'
        }
        
        response = client.put('/api/auth/profile', 
                            json=update_data,
                            content_type='application/json')
        
        assert response.status_code == 200
        
        # Verify password was changed
        db.session.refresh(user)
        assert user.check_password('NewPassword456!') is True
        assert user.check_password('AuthPass123!') is False
    
    def test_update_profile_wrong_current_password(self, authenticated_user):
        """Test profile update with wrong current password."""
        client = authenticated_user['client']
        
        update_data = {
            'current_password': 'WrongPassword123!',
            'new_password': 'NewPassword456!'
        }
        
        response = client.put('/api/auth/profile', 
                            json=update_data,
                            content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Current password is incorrect' in data['error']
    
    def test_update_profile_weak_new_password(self, authenticated_user):
        """Test profile update with weak new password."""
        client = authenticated_user['client']
        
        update_data = {
            'current_password': 'AuthPass123!',
            'new_password': 'weak'
        }
        
        response = client.put('/api/auth/profile', 
                            json=update_data,
                            content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Password must be at least 8 characters' in data['error']
    
    def test_update_profile_duplicate_username(self, authenticated_user, create_test_user):
        """Test profile update with duplicate username."""
        client = authenticated_user['client']
        existing_user = create_test_user(username='existinguser')
        
        update_data = {
            'username': 'existinguser'
        }
        
        response = client.put('/api/auth/profile', 
                            json=update_data,
                            content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Username already taken' in data['error']
    
    def test_update_profile_duplicate_email(self, authenticated_user, create_test_user):
        """Test profile update with duplicate email."""
        client = authenticated_user['client']
        existing_user = create_test_user(email='existing@example.com')
        
        update_data = {
            'email': 'existing@example.com'
        }
        
        response = client.put('/api/auth/profile', 
                            json=update_data,
                            content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Email already taken' in data['error']
    
    def test_update_profile_sanitizes_input(self, authenticated_user, malicious_inputs):
        """Test profile update sanitizes malicious input."""
        client = authenticated_user['client']
        user = authenticated_user['user']
        
        update_data = {
            'full_name': malicious_inputs['xss_attempts'][0]  # Script tag attempt
        }
        
        response = client.put('/api/auth/profile', 
                            json=update_data,
                            content_type='application/json')
        
        assert response.status_code == 200
        
        # Verify malicious content was sanitized
        db.session.refresh(user)
        assert '<script>' not in user.full_name
        assert 'alert(' not in user.full_name


class TestAddTechnicianEndpoint:
    """Test /api/auth/add-technician endpoint functionality."""
    
    def test_add_technician_success(self, authenticated_user, sample_user_data):
        """Test successful technician addition."""
        client = authenticated_user['client']
        
        response = client.post('/api/auth/add-technician', 
                             json=sample_user_data,
                             content_type='application/json')
        
        assert response.status_code == 201
        data = response.get_json()
        
        assert data['message'] == 'Technician added successfully'
        assert 'user' in data
        assert data['user']['username'] == sample_user_data['username']
        assert data['user']['email'] == sample_user_data['email']
        
        # Verify user was created in database
        new_user = User.query.filter_by(username=sample_user_data['username']).first()
        assert new_user is not None
        assert new_user.check_password(sample_user_data['password']) is True
    
    def test_add_technician_missing_fields(self, authenticated_user):
        """Test technician addition with missing required fields."""
        client = authenticated_user['client']
        
        incomplete_data = {
            'username': 'newtech',
            'email': 'newtech@example.com'
            # Missing password and full_name
        }
        
        response = client.post('/api/auth/add-technician', 
                             json=incomplete_data,
                             content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Password is required' in data['error']
    
    def test_add_technician_duplicate_username(self, authenticated_user, create_test_user):
        """Test technician addition with duplicate username."""
        client = authenticated_user['client']
        existing_user = create_test_user(username='duplicate')
        
        technician_data = {
            'username': 'duplicate',
            'email': 'new@example.com',
            'password': 'NewPass123!',
            'full_name': 'New Tech'
        }
        
        response = client.post('/api/auth/add-technician', 
                             json=technician_data,
                             content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Username already exists' in data['error']
    
    def test_add_technician_weak_password(self, authenticated_user):
        """Test technician addition with weak password."""
        client = authenticated_user['client']
        
        technician_data = {
            'username': 'newtech',
            'email': 'newtech@example.com',
            'password': 'weak',
            'full_name': 'New Tech'
        }
        
        response = client.post('/api/auth/add-technician', 
                             json=technician_data,
                             content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Password must be at least 8 characters' in data['error']
    
    def test_add_technician_without_authentication(self, client, sample_user_data):
        """Test technician addition without authentication."""
        response = client.post('/api/auth/add-technician', 
                             json=sample_user_data,
                             content_type='application/json')
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'Authorization token required' in data['message']


class TestLogoutEndpoint:
    """Test /api/auth/logout endpoint functionality."""
    
    def test_logout_success(self, authenticated_user):
        """Test successful logout."""
        client = authenticated_user['client']
        
        response = client.post('/api/auth/logout')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Logged out successfully'
        
        # Check cookies are cleared
        cookies = response.headers.getlist('Set-Cookie')
        cookie_clears = [cookie for cookie in cookies if 'expires=Thu, 01 Jan 1970' in cookie]
        assert len(cookie_clears) > 0  # Should have cookie clearing directives
    
    def test_logout_without_authentication(self, client):
        """Test logout without authentication."""
        response = client.post('/api/auth/logout')
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'Authorization token required' in data['message']


class TestPasswordResetEndpoints:
    """Test password reset functionality."""
    
    @patch('app.auth.routes.mail.send')
    def test_request_password_reset_success(self, mock_send, client, create_test_user):
        """Test successful password reset request."""
        user = create_test_user(email='reset@example.com')
        
        response = client.post('/api/auth/request-password-reset', 
                             json={'email': 'reset@example.com'},
                             content_type='application/json')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'password reset link has been sent' in data['message']
        
        # Verify email was sent
        mock_send.assert_called_once()
        
        # Verify token was generated
        db.session.refresh(user)
        assert user.password_reset_token is not None
        assert user.password_reset_expires is not None
    
    @patch('app.auth.routes.mail.send')
    def test_request_password_reset_nonexistent_email(self, mock_send, client):
        """Test password reset request for non-existent email."""
        response = client.post('/api/auth/request-password-reset', 
                             json={'email': 'nonexistent@example.com'},
                             content_type='application/json')
        
        # Should still return success (prevent email enumeration)
        assert response.status_code == 200
        data = response.get_json()
        assert 'password reset link has been sent' in data['message']
        
        # But no email should be sent
        mock_send.assert_not_called()
    
    def test_reset_password_success(self, client, user_with_reset_token):
        """Test successful password reset."""
        user = user_with_reset_token['user']
        token = user_with_reset_token['token']
        
        reset_data = {
            'email': user.email,
            'token': token,
            'new_password': 'NewPassword123!'
        }
        
        response = client.post('/api/auth/reset-password', 
                             json=reset_data,
                             content_type='application/json')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'Password has been successfully reset' in data['message']
        
        # Verify password was changed
        db.session.refresh(user)
        assert user.check_password('NewPassword123!') is True
        assert user.check_password('ResetPass123!') is False
        
        # Verify token was cleared
        assert user.password_reset_token is None
        assert user.password_reset_expires is None
    
    def test_reset_password_invalid_token(self, client, user_with_reset_token):
        """Test password reset with invalid token."""
        user = user_with_reset_token['user']
        
        reset_data = {
            'email': user.email,
            'token': 'invalid-token',
            'new_password': 'NewPassword123!'
        }
        
        response = client.post('/api/auth/reset-password', 
                             json=reset_data,
                             content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Invalid or expired reset token' in data['error']
    
    def test_reset_password_weak_password(self, client, user_with_reset_token):
        """Test password reset with weak password."""
        user = user_with_reset_token['user']
        token = user_with_reset_token['token']
        
        reset_data = {
            'email': user.email,
            'token': token,
            'new_password': 'weak'
        }
        
        response = client.post('/api/auth/reset-password', 
                             json=reset_data,
                             content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Password must be at least 8 characters' in data['error']