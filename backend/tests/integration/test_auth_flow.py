"""
Integration tests for complete authentication flows.
Tests end-to-end scenarios combining multiple components.
"""
import pytest
import time
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock

from app import db
from app.models import User


class TestCompleteAuthenticationFlow:
    """Test complete authentication user journeys."""
    
    def test_full_user_registration_and_login_flow(self, client, authenticated_user):
        """Test complete flow: create user -> login -> access protected resource."""
        admin_client = authenticated_user['client']
        
        # Step 1: Admin creates new technician
        technician_data = {
            'username': 'newtechnician',
            'email': 'tech@mrc.com',
            'password': 'TechnicianPass123!',
            'full_name': 'New Technician',
            'phone': '+61 400 555 555'
        }
        
        create_response = admin_client.post('/api/auth/add-technician', 
                                          json=technician_data,
                                          content_type='application/json')
        
        assert create_response.status_code == 201
        create_data = create_response.get_json()
        assert create_data['message'] == 'Technician added successfully'
        
        # Step 2: New technician logs in
        login_data = {
            'email': 'tech@mrc.com',
            'password': 'TechnicianPass123!',
            'remember_me': True
        }
        
        login_response = client.post('/api/auth/login', 
                                   json=login_data,
                                   content_type='application/json')
        
        assert login_response.status_code == 200
        login_response_data = login_response.get_json()
        assert login_response_data['message'] == 'Login successful'
        
        # Step 3: Access protected profile endpoint
        profile_response = client.get('/api/auth/profile')
        
        assert profile_response.status_code == 200
        profile_data = profile_response.get_json()
        assert profile_data['user']['email'] == 'tech@mrc.com'
        assert profile_data['user']['full_name'] == 'New Technician'
        
        # Step 4: Update profile
        update_data = {
            'phone': '+61 400 777 777',
            'full_name': 'Updated Technician Name'
        }
        
        update_response = client.put('/api/auth/profile', 
                                   json=update_data,
                                   content_type='application/json')
        
        assert update_response.status_code == 200
        update_response_data = update_response.get_json()
        assert update_response_data['user']['phone'] == '+61 400 777 777'
        assert update_response_data['user']['full_name'] == 'Updated Technician Name'
        
        # Step 5: Logout
        logout_response = client.post('/api/auth/logout')
        
        assert logout_response.status_code == 200
        
        # Step 6: Verify cannot access protected resources after logout
        protected_response = client.get('/api/auth/profile')
        assert protected_response.status_code == 401
    
    def test_password_change_flow(self, client, create_test_user):
        """Test complete password change flow."""
        user = create_test_user(password='OldPassword123!')
        
        # Step 1: Login with old password
        login_response = client.post('/api/auth/login', json={
            'email': user.email,
            'password': 'OldPassword123!'
        })
        assert login_response.status_code == 200
        
        # Step 2: Change password
        password_change_data = {
            'current_password': 'OldPassword123!',
            'new_password': 'NewPassword456!'
        }
        
        change_response = client.put('/api/auth/profile', 
                                   json=password_change_data,
                                   content_type='application/json')
        assert change_response.status_code == 200
        
        # Step 3: Logout
        client.post('/api/auth/logout')
        
        # Step 4: Verify old password no longer works
        old_login_response = client.post('/api/auth/login', json={
            'email': user.email,
            'password': 'OldPassword123!'
        })
        assert old_login_response.status_code == 401
        
        # Step 5: Verify new password works
        new_login_response = client.post('/api/auth/login', json={
            'email': user.email,
            'password': 'NewPassword456!'
        })
        assert new_login_response.status_code == 200
    
    @patch('app.auth.routes.mail.send')
    def test_complete_password_reset_flow(self, mock_send, client, create_test_user):
        """Test complete password reset flow."""
        user = create_test_user(email='resetuser@example.com', password='OriginalPass123!')
        
        # Step 1: Request password reset
        reset_request_data = {'email': 'resetuser@example.com'}
        
        request_response = client.post('/api/auth/request-password-reset', 
                                     json=reset_request_data,
                                     content_type='application/json')
        
        assert request_response.status_code == 200
        assert mock_send.called
        
        # Get the reset token from the user object
        db.session.refresh(user)
        reset_token = user.password_reset_token
        assert reset_token is not None
        
        # Step 2: Use reset token to change password
        reset_data = {
            'email': 'resetuser@example.com',
            'token': reset_token,
            'new_password': 'ResetPassword789!'
        }
        
        reset_response = client.post('/api/auth/reset-password', 
                                   json=reset_data,
                                   content_type='application/json')
        
        assert reset_response.status_code == 200
        
        # Step 3: Verify old password no longer works
        old_login_response = client.post('/api/auth/login', json={
            'email': 'resetuser@example.com',
            'password': 'OriginalPass123!'
        })
        assert old_login_response.status_code == 401
        
        # Step 4: Verify new password works
        new_login_response = client.post('/api/auth/login', json={
            'email': 'resetuser@example.com',
            'password': 'ResetPassword789!'
        })
        assert new_login_response.status_code == 200
        
        # Step 5: Verify reset token was cleared
        db.session.refresh(user)
        assert user.password_reset_token is None
        assert user.password_reset_expires is None
    
    def test_token_refresh_flow(self, client, create_test_user):
        """Test JWT token refresh flow."""
        user = create_test_user()
        
        # Step 1: Login with remember_me to get refresh token
        login_response = client.post('/api/auth/login', json={
            'email': user.email,
            'password': 'TestPass123!',
            'remember_me': True
        })
        assert login_response.status_code == 200
        
        # Step 2: Access protected resource with access token
        profile_response1 = client.get('/api/auth/profile')
        assert profile_response1.status_code == 200
        
        # Step 3: Refresh the access token
        refresh_response = client.post('/api/auth/refresh')
        assert refresh_response.status_code == 200
        
        # Step 4: Access protected resource with new access token
        profile_response2 = client.get('/api/auth/profile')
        assert profile_response2.status_code == 200
        
        # Step 5: Verify user data is still accessible
        profile_data = profile_response2.get_json()
        assert profile_data['user']['email'] == user.email


class TestAccountLockoutFlow:
    """Test account lockout integration scenarios."""
    
    def test_account_lockout_and_recovery_flow(self, client, create_test_user):
        """Test complete account lockout and recovery flow."""
        user = create_test_user()
        
        # Step 1: Make multiple failed login attempts to trigger lockout
        failed_login_data = {
            'email': user.email,
            'password': 'WrongPassword123!'
        }
        
        for attempt in range(4):  # Should lock on 3rd attempt
            response = client.post('/api/auth/login', 
                                 json=failed_login_data,
                                 content_type='application/json')
            
            if attempt < 2:
                assert response.status_code == 401
                data = response.get_json()
                assert data['error'] == 'Invalid credentials'
            else:
                # Account should be locked now
                assert response.status_code == 401
                data = response.get_json()
                assert 'Account temporarily locked' in data['error']
        
        # Step 2: Verify correct password also fails when locked
        correct_login_data = {
            'email': user.email,
            'password': 'TestPass123!'
        }
        
        locked_response = client.post('/api/auth/login', 
                                    json=correct_login_data,
                                    content_type='application/json')
        
        assert locked_response.status_code == 401
        data = locked_response.get_json()
        assert 'Account temporarily locked' in data['error']
        
        # Step 3: Manually unlock account (simulate admin action)
        db.session.refresh(user)
        user.unlock_account()
        
        # Step 4: Verify login works after unlock
        unlocked_response = client.post('/api/auth/login', 
                                      json=correct_login_data,
                                      content_type='application/json')
        
        assert unlocked_response.status_code == 200
        
        # Step 5: Verify failed attempts counter was reset
        db.session.refresh(user)
        assert user.failed_login_attempts == 0
        assert user.locked_until is None
    
    def test_progressive_lockout_timing(self, client, create_test_user):
        """Test progressive lockout timing integration."""
        user = create_test_user()
        
        lockout_durations = []
        
        # Trigger multiple lockouts to test progressive timing
        for lockout_round in range(3):
            # Reset for next round
            if lockout_round > 0:
                user.unlock_account()
            
            # Make failed attempts to trigger lockout
            for attempt in range(3):
                response = client.post('/api/auth/login', json={
                    'email': user.email,
                    'password': f'wrong_password_{lockout_round}_{attempt}'
                })
                
                if attempt == 2:  # Last attempt should lock
                    assert response.status_code == 401
                    data = response.get_json()
                    assert 'Account temporarily locked' in data['error']
                    
                    # Record lockout duration
                    db.session.refresh(user)
                    if user.locked_until:
                        duration = user.locked_until - datetime.now(timezone.utc)
                        lockout_durations.append(duration.total_seconds())
        
        # Verify lockout durations increase
        assert len(lockout_durations) >= 2
        for i in range(1, len(lockout_durations)):
            # Each lockout should be longer than the previous
            assert lockout_durations[i] > lockout_durations[i-1]


class TestMultiUserScenarios:
    """Test scenarios involving multiple users."""
    
    def test_concurrent_user_sessions(self, client, create_test_user):
        """Test multiple users can have concurrent sessions."""
        # Create two users
        user1 = create_test_user(username='user1', email='user1@test.com')
        user2 = create_test_user(username='user2', email='user2@test.com')
        
        # Create separate test clients for each user
        client1 = client
        client2 = client.application.test_client()
        
        # Both users login
        login1_response = client1.post('/api/auth/login', json={
            'email': user1.email,
            'password': 'TestPass123!'
        })
        assert login1_response.status_code == 200
        
        login2_response = client2.post('/api/auth/login', json={
            'email': user2.email,
            'password': 'TestPass123!'
        })
        assert login2_response.status_code == 200
        
        # Both users can access their profiles
        profile1_response = client1.get('/api/auth/profile')
        assert profile1_response.status_code == 200
        profile1_data = profile1_response.get_json()
        assert profile1_data['user']['username'] == 'user1'
        
        profile2_response = client2.get('/api/auth/profile')
        assert profile2_response.status_code == 200
        profile2_data = profile2_response.get_json()
        assert profile2_data['user']['username'] == 'user2'
        
        # User1 logs out
        logout1_response = client1.post('/api/auth/logout')
        assert logout1_response.status_code == 200
        
        # User1 can't access profile anymore
        profile1_after_logout = client1.get('/api/auth/profile')
        assert profile1_after_logout.status_code == 401
        
        # User2 can still access their profile
        profile2_after_user1_logout = client2.get('/api/auth/profile')
        assert profile2_after_user1_logout.status_code == 200
    
    def test_unique_constraint_enforcement(self, client, authenticated_user, create_test_user):
        """Test unique constraints are enforced across operations."""
        admin_client = authenticated_user['client']
        existing_user = create_test_user(username='existing', email='existing@test.com')
        
        # Try to create technician with duplicate username
        duplicate_username_data = {
            'username': 'existing',
            'email': 'newemail@test.com',
            'password': 'NewPass123!',
            'full_name': 'New User'
        }
        
        response1 = admin_client.post('/api/auth/add-technician', 
                                    json=duplicate_username_data,
                                    content_type='application/json')
        assert response1.status_code == 400
        assert 'Username already exists' in response1.get_json()['error']
        
        # Try to create technician with duplicate email
        duplicate_email_data = {
            'username': 'newusername',
            'email': 'existing@test.com',
            'password': 'NewPass123!',
            'full_name': 'New User'
        }
        
        response2 = admin_client.post('/api/auth/add-technician', 
                                    json=duplicate_email_data,
                                    content_type='application/json')
        assert response2.status_code == 400
        assert 'Email already exists' in response2.get_json()['error']


class TestErrorRecoveryScenarios:
    """Test error handling and recovery in integrated flows."""
    
    @patch('app.auth.routes.mail.send')
    def test_email_failure_handling_in_password_reset(self, mock_send, client, create_test_user):
        """Test password reset handles email sending failures gracefully."""
        user = create_test_user(email='test@example.com')
        
        # Mock email sending to fail
        mock_send.side_effect = Exception('SMTP server unavailable')
        
        reset_request_data = {'email': 'test@example.com'}
        
        response = client.post('/api/auth/request-password-reset', 
                             json=reset_request_data,
                             content_type='application/json')
        
        assert response.status_code == 500
        data = response.get_json()
        assert 'Failed to send reset email' in data['error']
        
        # Verify token was cleared after email failure
        db.session.refresh(user)
        assert user.password_reset_token is None
        assert user.password_reset_expires is None
    
    def test_database_rollback_on_profile_update_failure(self, authenticated_user):
        """Test database changes are rolled back on profile update failures."""
        client = authenticated_user['client']
        user = authenticated_user['user']
        
        original_full_name = user.full_name
        original_phone = user.phone
        
        # Try to update with invalid data that might cause an error
        with patch('app.db.session.commit') as mock_commit:
            mock_commit.side_effect = Exception('Database error')
            
            update_data = {
                'full_name': 'Updated Name',
                'phone': '+61 400 999 999'
            }
            
            response = client.put('/api/auth/profile', 
                                json=update_data,
                                content_type='application/json')
            
            assert response.status_code == 500
            
            # Verify user data wasn't changed
            db.session.refresh(user)
            assert user.full_name == original_full_name
            assert user.phone == original_phone
    
    def test_token_refresh_with_expired_refresh_token(self, client, create_test_user):
        """Test token refresh fails gracefully with expired refresh token."""
        user = create_test_user()
        
        # Login to get tokens
        login_response = client.post('/api/auth/login', json={
            'email': user.email,
            'password': 'TestPass123!',
            'remember_me': True
        })
        assert login_response.status_code == 200
        
        # Mock token expiration
        with patch('flask_jwt_extended.utils.datetime') as mock_datetime:
            # Set time far in future to expire refresh token
            future_time = datetime.now(timezone.utc) + timedelta(days=31)
            mock_datetime.now.return_value = future_time
            mock_datetime.side_effect = lambda *args, **kw: future_time
            
            # Try to refresh with expired token
            refresh_response = client.post('/api/auth/refresh')
            assert refresh_response.status_code == 401
            
            # Should get proper error message
            data = refresh_response.get_json()
            assert 'token' in data.get('error', '').lower()


class TestDataConsistencyScenarios:
    """Test data consistency across operations."""
    
    def test_user_data_consistency_across_operations(self, client, authenticated_user):
        """Test user data remains consistent across multiple operations."""
        admin_client = authenticated_user['client']
        
        # Create technician
        technician_data = {
            'username': 'consistency_test',
            'email': 'consistent@test.com',
            'password': 'TestPass123!',
            'full_name': 'Consistency Test User',
            'phone': '+61 400 123 456'
        }
        
        create_response = admin_client.post('/api/auth/add-technician', 
                                          json=technician_data)
        assert create_response.status_code == 201
        
        # Get user from database
        created_user = User.query.filter_by(username='consistency_test').first()
        assert created_user is not None
        
        # Login as new user
        login_response = client.post('/api/auth/login', json={
            'email': 'consistent@test.com',
            'password': 'TestPass123!'
        })
        assert login_response.status_code == 200
        
        # Get profile via API
        profile_response = client.get('/api/auth/profile')
        assert profile_response.status_code == 200
        api_user_data = profile_response.get_json()['user']
        
        # Verify data consistency between database and API
        assert api_user_data['username'] == created_user.username
        assert api_user_data['email'] == created_user.email
        assert api_user_data['full_name'] == created_user.full_name
        assert api_user_data['phone'] == created_user.phone
        assert api_user_data['is_active'] == created_user.is_active
        
        # Update profile
        update_data = {
            'full_name': 'Updated Consistent Name',
            'phone': '+61 400 789 012'
        }
        
        update_response = client.put('/api/auth/profile', json=update_data)
        assert update_response.status_code == 200
        
        # Verify database was updated
        db.session.refresh(created_user)
        assert created_user.full_name == 'Updated Consistent Name'
        assert created_user.phone == '+61 400 789 012'
        
        # Verify API returns updated data
        profile_response2 = client.get('/api/auth/profile')
        updated_api_data = profile_response2.get_json()['user']
        assert updated_api_data['full_name'] == 'Updated Consistent Name'
        assert updated_api_data['phone'] == '+61 400 789 012'
    
    def test_security_event_logging_consistency(self, client, create_test_user):
        """Test security events are consistently logged across operations."""
        user = create_test_user()
        
        with patch('app.models.security_logger') as mock_logger:
            # Test login success logging
            login_response = client.post('/api/auth/login', json={
                'email': user.email,
                'password': 'TestPass123!'
            })
            assert login_response.status_code == 200
            
            # Verify login success was logged
            mock_logger.warning.assert_called()
            last_call = mock_logger.warning.call_args[0][0]
            assert 'LOGIN_SUCCESS' in last_call
            
            mock_logger.reset_mock()
            
            # Test logout logging
            logout_response = client.post('/api/auth/logout')
            assert logout_response.status_code == 200
            
            # Verify logout was logged
            mock_logger.warning.assert_called()
            last_call = mock_logger.warning.call_args[0][0]
            assert 'LOGOUT' in last_call
            
            mock_logger.reset_mock()
            
            # Test failed login logging
            failed_login_response = client.post('/api/auth/login', json={
                'email': user.email,
                'password': 'WrongPassword123!'
            })
            assert failed_login_response.status_code == 401
            
            # Verify failed login was logged
            mock_logger.warning.assert_called()
            last_call = mock_logger.warning.call_args[0][0]
            assert 'LOGIN_FAILED' in last_call