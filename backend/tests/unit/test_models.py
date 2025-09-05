"""
Unit tests for User model functionality.
Tests password hashing, account lockout, password reset, and security features.
"""
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock

from app import db
from app.models import User


class TestUserModel:
    """Test User model functionality."""
    
    def test_user_creation(self, app_context):
        """Test basic user creation."""
        user = User(
            username='testuser',
            email='test@example.com',
            full_name='Test User',
            phone='+61 400 000 000'
        )
        user.set_password('TestPass123!')
        
        db.session.add(user)
        db.session.commit()
        
        assert user.id is not None
        assert user.username == 'testuser'
        assert user.email == 'test@example.com'
        assert user.full_name == 'Test User'
        assert user.phone == '+61 400 000 000'
        assert user.is_active is True
        assert user.failed_login_attempts == 0
        assert user.locked_until is None
    
    def test_user_repr(self, create_test_user):
        """Test user string representation."""
        user = create_test_user(username='testuser')
        assert repr(user) == '<User testuser>'
    
    def test_user_to_dict(self, create_test_user):
        """Test user dictionary conversion."""
        user = create_test_user(
            username='testuser',
            email='test@example.com',
            full_name='Test User',
            phone='+61 400 000 000'
        )
        
        user_dict = user.to_dict()
        
        assert user_dict['username'] == 'testuser'
        assert user_dict['email'] == 'test@example.com'
        assert user_dict['full_name'] == 'Test User'
        assert user_dict['phone'] == '+61 400 000 000'
        assert user_dict['is_active'] is True
        assert 'password_hash' not in user_dict  # Should not expose password


class TestPasswordFunctionality:
    """Test password hashing and validation."""
    
    def test_password_hashing(self, app_context):
        """Test password is properly hashed."""
        user = User(username='testuser', email='test@example.com', full_name='Test User')
        password = 'TestPass123!'
        
        user.set_password(password)
        
        # Password should be hashed
        assert user.password_hash != password
        assert user.password_hash.startswith('$2b$')  # bcrypt hash
        assert len(user.password_hash) > 50  # Proper length
    
    def test_password_verification(self, create_test_user):
        """Test password verification works correctly."""
        password = 'TestPass123!'
        user = create_test_user(password=password)
        
        # Correct password should verify
        assert user.check_password(password) is True
        
        # Wrong password should not verify
        assert user.check_password('WrongPassword123!') is False
        assert user.check_password('') is False
        assert user.check_password(None) is False
    
    def test_password_with_special_characters(self, app_context):
        """Test passwords with various special characters."""
        user = User(username='testuser', email='test@example.com', full_name='Test User')
        special_passwords = [
            'Test@123!',
            'Pass#456$',
            'Secure%789^',
            'Strong&012*',
            'Valid(123)',
        ]
        
        for password in special_passwords:
            user.set_password(password)
            assert user.check_password(password) is True
    
    def test_password_case_sensitivity(self, create_test_user):
        """Test password verification is case sensitive."""
        user = create_test_user(password='TestPass123!')
        
        assert user.check_password('TestPass123!') is True
        assert user.check_password('testpass123!') is False
        assert user.check_password('TESTPASS123!') is False
    
    def test_password_unicode_handling(self, app_context):
        """Test password handling with Unicode characters."""
        user = User(username='testuser', email='test@example.com', full_name='Test User')
        unicode_password = 'Tëst123!ñ'
        
        user.set_password(unicode_password)
        assert user.check_password(unicode_password) is True
        assert user.check_password('Test123!n') is False


class TestAccountLockoutFunctionality:
    """Test account lockout and security features."""
    
    def test_account_not_locked_initially(self, create_test_user):
        """Test new accounts are not locked."""
        user = create_test_user()
        assert user.is_account_locked() is False
        assert user.failed_login_attempts == 0
        assert user.locked_until is None
    
    def test_failed_login_increments_attempts(self, create_test_user):
        """Test failed login attempts are tracked."""
        user = create_test_user()
        initial_attempts = user.failed_login_attempts
        
        user.handle_failed_login('127.0.0.1')
        
        assert user.failed_login_attempts == initial_attempts + 1
        assert user.last_failed_login is not None
    
    def test_account_lockout_after_threshold(self, create_test_user):
        """Test account gets locked after failed attempts."""
        user = create_test_user()
        
        # Simulate 3 failed attempts (should lock on 3rd)
        for i in range(3):
            user.handle_failed_login('127.0.0.1')
        
        assert user.is_account_locked() is True
        assert user.locked_until is not None
        assert user.locked_until > datetime.now(timezone.utc)
    
    def test_progressive_lockout_timing(self, create_test_user):
        """Test lockout duration increases progressively."""
        user = create_test_user()
        
        # Set attempts to just before lockout
        user.failed_login_attempts = 2
        
        # First lockout (3rd attempt) - should be 5 minutes
        user.handle_failed_login('127.0.0.1')
        first_lockout = user.locked_until
        
        # Simulate more attempts for longer lockout
        user.failed_login_attempts = 3
        user.handle_failed_login('127.0.0.1')
        second_lockout = user.locked_until
        
        # Second lockout should be longer
        assert second_lockout > first_lockout
    
    def test_successful_login_resets_attempts(self, create_test_user):
        """Test successful login resets failed attempts."""
        user = create_test_user()
        
        # Add some failed attempts
        user.failed_login_attempts = 2
        user.last_failed_login = datetime.now(timezone.utc)
        
        user.handle_successful_login('127.0.0.1')
        
        assert user.failed_login_attempts == 0
        assert user.locked_until is None
        assert user.last_failed_login is None
        assert user.last_login is not None
    
    def test_manual_account_unlock(self, create_test_user):
        """Test admin can manually unlock account."""
        user = create_test_user()
        
        # Lock the account
        user.failed_login_attempts = 5
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)
        user.last_failed_login = datetime.now(timezone.utc)
        
        user.unlock_account()
        
        assert user.failed_login_attempts == 0
        assert user.locked_until is None
        assert user.last_failed_login is None
        assert user.is_account_locked() is False
    
    def test_lockout_expiration(self, create_test_user):
        """Test account automatically unlocks after timeout."""
        user = create_test_user()
        
        # Set lockout in the past
        user.locked_until = datetime.now(timezone.utc) - timedelta(minutes=1)
        
        assert user.is_account_locked() is False


class TestPasswordResetFunctionality:
    """Test password reset token functionality."""
    
    def test_generate_password_reset_token(self, create_test_user):
        """Test password reset token generation."""
        user = create_test_user()
        
        token = user.generate_password_reset_token()
        
        assert token is not None
        assert len(token) > 50  # URL-safe token should be long
        assert user.password_reset_token == token
        assert user.password_reset_expires is not None
        assert user.password_reset_expires > datetime.now(timezone.utc)
    
    def test_password_reset_token_expiry(self, create_test_user):
        """Test password reset token has proper expiry."""
        user = create_test_user()
        
        token = user.generate_password_reset_token()
        expected_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
        
        # Allow 60 second tolerance for test execution time
        assert abs((user.password_reset_expires - expected_expiry).total_seconds()) < 60
    
    def test_verify_valid_password_reset_token(self, create_test_user):
        """Test valid token verification."""
        user = create_test_user()
        
        token = user.generate_password_reset_token()
        
        assert user.verify_password_reset_token(token) is True
    
    def test_verify_invalid_password_reset_token(self, create_test_user):
        """Test invalid token verification."""
        user = create_test_user()
        
        user.generate_password_reset_token()
        
        assert user.verify_password_reset_token('invalid-token') is False
        assert user.verify_password_reset_token('') is False
        assert user.verify_password_reset_token(None) is False
    
    def test_verify_expired_password_reset_token(self, create_test_user):
        """Test expired token verification."""
        user = create_test_user()
        
        token = user.generate_password_reset_token()
        
        # Manually expire the token
        user.password_reset_expires = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.session.commit()
        
        assert user.verify_password_reset_token(token) is False
        # Token should be cleared after failed verification
        assert user.password_reset_token is None
        assert user.password_reset_expires is None
    
    def test_clear_password_reset_token(self, create_test_user):
        """Test clearing password reset token."""
        user = create_test_user()
        
        user.generate_password_reset_token()
        assert user.password_reset_token is not None
        
        user.clear_password_reset_token()
        
        assert user.password_reset_token is None
        assert user.password_reset_expires is None
    
    def test_reset_password_with_token(self, create_test_user):
        """Test password reset functionality."""
        user = create_test_user(password='OldPass123!')
        old_password_hash = user.password_hash
        
        token = user.generate_password_reset_token()
        new_password = 'NewPass456!'
        
        # Verify old password works
        assert user.check_password('OldPass123!') is True
        
        user.reset_password(new_password)
        
        # Verify password was changed
        assert user.password_hash != old_password_hash
        assert user.check_password(new_password) is True
        assert user.check_password('OldPass123!') is False
        
        # Verify token was cleared
        assert user.password_reset_token is None
        assert user.password_reset_expires is None
        
        # Verify failed attempts were reset
        assert user.failed_login_attempts == 0
        assert user.locked_until is None


class TestSecurityLogging:
    """Test security logging functionality."""
    
    @patch('app.models.security_logger')
    def test_log_security_event(self, mock_logger, create_test_user):
        """Test security event logging."""
        user = create_test_user()
        
        user.log_security_event('TEST_EVENT', '127.0.0.1', 'test details')
        
        mock_logger.warning.assert_called_once()
        call_args = mock_logger.warning.call_args[0][0]
        assert 'SECURITY: TEST_EVENT' in call_args
        assert f'User:{user.id}({user.username})' in call_args
        assert 'IP:127.0.0.1' in call_args
        assert 'Details:test details' in call_args
    
    @patch('app.models.security_logger')
    def test_log_security_event_minimal(self, mock_logger, create_test_user):
        """Test security event logging with minimal data."""
        user = create_test_user()
        
        user.log_security_event('MINIMAL_EVENT')
        
        mock_logger.warning.assert_called_once()
        call_args = mock_logger.warning.call_args[0][0]
        assert 'SECURITY: MINIMAL_EVENT' in call_args
        assert f'User:{user.id}({user.username})' in call_args
        assert 'IP:' not in call_args
        assert 'Details:' not in call_args
    
    @patch('app.models.security_logger')
    def test_password_reset_logging(self, mock_logger, create_test_user):
        """Test password reset events are logged."""
        user = create_test_user()
        
        # Test token generation logging
        user.generate_password_reset_token()
        mock_logger.warning.assert_called_with(
            f'SECURITY: PASSWORD_RESET_REQUESTED - User:{user.id}({user.username})'
        )
        
        # Test password reset completion logging
        mock_logger.reset_mock()
        user.reset_password('NewPass123!')
        mock_logger.warning.assert_called_with(
            f'SECURITY: PASSWORD_RESET_COMPLETED - User:{user.id}({user.username})'
        )
    
    @patch('app.models.security_logger')
    def test_account_lockout_logging(self, mock_logger, create_test_user):
        """Test account lockout events are logged."""
        user = create_test_user()
        
        # Multiple failed attempts to trigger lockout
        user.failed_login_attempts = 2  # Set to just before lockout
        user.handle_failed_login('192.168.1.100')
        
        mock_logger.warning.assert_called()
        call_args = mock_logger.warning.call_args[0][0]
        assert 'SECURITY: ACCOUNT_LOCKED' in call_args
        assert 'IP:192.168.1.100' in call_args
        assert 'Attempts:3' in call_args
    
    @patch('app.models.security_logger')
    def test_successful_login_logging(self, mock_logger, create_test_user):
        """Test successful login logging."""
        user = create_test_user()
        
        user.handle_successful_login('10.0.0.1')
        
        mock_logger.warning.assert_called_with(
            f'SECURITY: LOGIN_SUCCESS - User:{user.id}({user.username}) IP:10.0.0.1'
        )
    
    @patch('app.models.security_logger')
    def test_account_unlock_logging(self, mock_logger, create_test_user):
        """Test account unlock logging."""
        user = create_test_user()
        
        user.unlock_account()
        
        mock_logger.warning.assert_called_with(
            f'SECURITY: ACCOUNT_UNLOCKED - User:{user.id}({user.username})'
        )


class TestUserTimestamps:
    """Test user timestamp functionality."""
    
    def test_created_at_timestamp(self, create_test_user):
        """Test created_at timestamp is set."""
        before_creation = datetime.now(timezone.utc)
        user = create_test_user()
        after_creation = datetime.now(timezone.utc)
        
        assert user.created_at is not None
        assert before_creation <= user.created_at <= after_creation
    
    def test_update_last_login(self, create_test_user):
        """Test last login timestamp update."""
        user = create_test_user()
        
        # Initially should be None
        assert user.last_login is None
        
        before_login = datetime.now(timezone.utc)
        user.update_last_login()
        after_login = datetime.now(timezone.utc)
        
        assert user.last_login is not None
        assert before_login <= user.last_login <= after_login
    
    def test_last_failed_login_timestamp(self, create_test_user):
        """Test last failed login timestamp."""
        user = create_test_user()
        
        before_failed = datetime.now(timezone.utc)
        user.handle_failed_login('127.0.0.1')
        after_failed = datetime.now(timezone.utc)
        
        assert user.last_failed_login is not None
        assert before_failed <= user.last_failed_login <= after_failed


class TestUserValidation:
    """Test user validation and constraints."""
    
    def test_unique_username_constraint(self, create_test_user, app_context):
        """Test username uniqueness constraint."""
        create_test_user(username='duplicate')
        
        # Try to create another user with same username
        user2 = User(
            username='duplicate',
            email='different@example.com',
            full_name='Different User'
        )
        user2.set_password('Password123!')
        
        db.session.add(user2)
        
        with pytest.raises(Exception):  # Should raise IntegrityError
            db.session.commit()
    
    def test_unique_email_constraint(self, create_test_user, app_context):
        """Test email uniqueness constraint."""
        create_test_user(email='duplicate@example.com')
        
        # Try to create another user with same email
        user2 = User(
            username='different',
            email='duplicate@example.com',
            full_name='Different User'
        )
        user2.set_password('Password123!')
        
        db.session.add(user2)
        
        with pytest.raises(Exception):  # Should raise IntegrityError
            db.session.commit()
    
    def test_required_fields(self, app_context):
        """Test required field validation."""
        # Test missing username
        user1 = User(email='test@example.com', full_name='Test User')
        db.session.add(user1)
        
        with pytest.raises(Exception):
            db.session.commit()
        
        db.session.rollback()
        
        # Test missing email
        user2 = User(username='testuser', full_name='Test User')
        db.session.add(user2)
        
        with pytest.raises(Exception):
            db.session.commit()
        
        db.session.rollback()
        
        # Test missing full_name
        user3 = User(username='testuser', email='test@example.com')
        db.session.add(user3)
        
        with pytest.raises(Exception):
            db.session.commit()