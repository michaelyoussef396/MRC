"""
Pytest configuration and shared fixtures for MRC authentication system testing.
"""
import pytest
import os
import tempfile
from datetime import datetime, timezone
from unittest.mock import MagicMock

from app import create_app, db
from app.models import User
from config import Config


class TestConfig(Config):
    """Test configuration class"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SECRET_KEY = 'test-secret-key-for-testing-only'
    JWT_SECRET_KEY = 'test-jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour for testing
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  # 30 days
    WTF_CSRF_ENABLED = False
    MAIL_SUPPRESS_SEND = True
    MAIL_DEFAULT_SENDER = 'test@mrc.com'
    CORS_ORIGINS = ['http://localhost:3000']
    # Disable rate limiting for tests
    RATELIMIT_ENABLED = False


@pytest.fixture(scope='session')
def app():
    """Create application for the tests."""
    app = create_app(TestConfig)
    
    # Create application context
    with app.app_context():
        db.create_all()
        
        # Create initial test user (Michael)
        test_user = User(
            username='michael',
            email='michaelyoussef396@gmail.com',
            full_name='Michael Rodriguez',
            phone='+61 400 123 458'
        )
        test_user.set_password('AdminMike123!')
        db.session.add(test_user)
        db.session.commit()
        
        yield app
        
        # Cleanup
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope='function')
def client(app):
    """Test client for making requests."""
    return app.test_client()


@pytest.fixture(scope='function')
def runner(app):
    """Test CLI runner."""
    return app.test_cli_runner()


@pytest.fixture
def app_context(app):
    """Application context for tests."""
    with app.app_context():
        yield app


@pytest.fixture
def db_session(app_context):
    """Database session for tests."""
    connection = db.engine.connect()
    transaction = connection.begin()
    
    # Configure session to use connection
    db.session.configure(bind=connection)
    
    yield db.session
    
    # Cleanup
    transaction.rollback()
    connection.close()
    db.session.remove()


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'TestPass123!',
        'full_name': 'Test User',
        'phone': '+61 400 000 000'
    }


@pytest.fixture
def create_test_user(app_context):
    """Factory function to create test users."""
    def _create_user(username='testuser', email='test@example.com', password='TestPass123!', 
                     full_name='Test User', phone=None, is_active=True):
        user = User(
            username=username,
            email=email,
            full_name=full_name,
            phone=phone,
            is_active=is_active
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user
    return _create_user


@pytest.fixture
def authenticated_user(client, app_context):
    """Create and return an authenticated user with JWT tokens."""
    # Create test user
    user = User(
        username='authuser',
        email='auth@example.com',
        full_name='Auth User',
        phone='+61 400 111 111'
    )
    user.set_password('AuthPass123!')
    db.session.add(user)
    db.session.commit()
    
    # Login to get JWT tokens
    response = client.post('/api/auth/login', json={
        'email': 'auth@example.com',
        'password': 'AuthPass123!',
        'remember_me': True
    })
    
    assert response.status_code == 200
    return {
        'user': user,
        'client': client,
        'response': response
    }


@pytest.fixture
def locked_user(app_context):
    """Create a locked user account for testing."""
    user = User(
        username='lockeduser',
        email='locked@example.com',
        full_name='Locked User'
    )
    user.set_password('LockedPass123!')
    user.failed_login_attempts = 5
    user.locked_until = datetime.now(timezone.utc).replace(microsecond=0) + \
                       pytest.timedelta(minutes=30)
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def inactive_user(app_context):
    """Create an inactive user account for testing."""
    user = User(
        username='inactiveuser',
        email='inactive@example.com',
        full_name='Inactive User',
        is_active=False
    )
    user.set_password('InactivePass123!')
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def user_with_reset_token(app_context):
    """Create user with password reset token for testing."""
    user = User(
        username='resetuser',
        email='reset@example.com',
        full_name='Reset User'
    )
    user.set_password('ResetPass123!')
    db.session.add(user)
    db.session.commit()
    
    # Generate reset token
    token = user.generate_password_reset_token()
    return {'user': user, 'token': token}


@pytest.fixture
def mock_mail(monkeypatch):
    """Mock Flask-Mail for testing email functionality."""
    mock_mail = MagicMock()
    monkeypatch.setattr('app.auth.routes.mail.send', mock_mail)
    return mock_mail


@pytest.fixture
def valid_login_data():
    """Valid login credentials for Michael (initial user)."""
    return {
        'email': 'michaelyoussef396@gmail.com',
        'password': 'AdminMike123!',
        'remember_me': False
    }


@pytest.fixture
def invalid_passwords():
    """List of invalid passwords for testing validation."""
    return [
        '',  # Empty
        'short',  # Too short
        'nouppercase123!',  # No uppercase
        'NOLOWERCASE123!',  # No lowercase
        'NoNumbers!',  # No numbers
        'NoSpecialChars123',  # No special characters
        'Valid123',  # Missing special character (not in our set)
    ]


@pytest.fixture
def valid_passwords():
    """List of valid passwords for testing."""
    return [
        'ValidPass123!',
        'AnotherGood1@',
        'SecurePassword2#',
        'TestingPass99$',
        'AdminMike123!',
    ]


@pytest.fixture
def malicious_inputs():
    """Malicious input attempts for security testing."""
    return {
        'xss_attempts': [
            '<script>alert("xss")</script>',
            'javascript:alert(1)',
            '<img src=x onerror=alert(1)>',
            '"><script>alert("xss")</script>',
        ],
        'sql_injection': [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM users--",
        ],
        'path_traversal': [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32\\config\\sam',
            '....//....//....//etc/passwd',
        ],
        'command_injection': [
            '; rm -rf /',
            '| whoami',
            '`id`',
            '$(id)',
        ]
    }


@pytest.fixture
def rate_limit_test_client(app):
    """Special test client for rate limiting tests."""
    # Re-enable rate limiting for these specific tests
    app.config['RATELIMIT_ENABLED'] = True
    
    # Import and reinitialize limiter
    from app import limiter
    limiter.init_app(app)
    
    return app.test_client()


# Pytest plugins and hooks
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "security: mark test as a security test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "auth: mark test as authentication related"
    )
    config.addinivalue_line(
        "markers", "database: mark test as database related"
    )
    config.addinivalue_line(
        "markers", "api: mark test as API endpoint test"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers based on file paths."""
    for item in items:
        # Add markers based on test file location
        if "test_security" in item.nodeid:
            item.add_marker(pytest.mark.security)
        if "test_integration" in item.nodeid:
            item.add_marker(pytest.mark.integration)
        if "test_unit" in item.nodeid:
            item.add_marker(pytest.mark.unit)
        if "auth" in item.nodeid:
            item.add_marker(pytest.mark.auth)
        if "database" in item.nodeid or "models" in item.nodeid:
            item.add_marker(pytest.mark.database)
        if "routes" in item.nodeid or "api" in item.nodeid:
            item.add_marker(pytest.mark.api)