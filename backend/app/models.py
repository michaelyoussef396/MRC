from datetime import datetime, timezone, timedelta
import bcrypt
import secrets
import logging
from app import db

# Security logging configuration
security_logger = logging.getLogger('mrc_security')
security_logger.setLevel(logging.WARNING)

class User(db.Model):
    """User model for MRC authentication system"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    # Password reset functionality
    password_reset_token = db.Column(db.String(128), nullable=True)
    password_reset_expires = db.Column(db.DateTime, nullable=True)
    
    # Account lockout functionality
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)
    last_failed_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password):
        """Hash password using bcrypt"""
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')

    def check_password(self, password):
        """Check password against bcrypt hash"""
        password_bytes = password.encode('utf-8')
        hash_bytes = self.password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)

    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.now(timezone.utc)
        db.session.commit()

    def to_dict(self):
        """Convert user to dictionary for API responses"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active
        }

    def __repr__(self):
        return f'<User {self.username}>'

    # Security and logging methods
    def log_security_event(self, event_type, ip_address=None, details=None):
        """Log security events for audit trail"""
        user_info = f"User:{self.id}({self.username})"
        ip_info = f" IP:{ip_address}" if ip_address else ""
        detail_info = f" Details:{details}" if details else ""
        security_logger.warning(f"SECURITY: {event_type} - {user_info}{ip_info}{detail_info}")

    # Password reset functionality
    def generate_password_reset_token(self):
        """Generate secure password reset token"""
        self.password_reset_token = secrets.token_urlsafe(64)
        self.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        self.log_security_event("PASSWORD_RESET_REQUESTED")
        db.session.commit()
        return self.password_reset_token

    def verify_password_reset_token(self, token):
        """Verify password reset token is valid and not expired"""
        if not self.password_reset_token or not self.password_reset_expires:
            return False
        
        if datetime.now(timezone.utc) > self.password_reset_expires:
            self.clear_password_reset_token()
            return False
            
        return secrets.compare_digest(self.password_reset_token, token)

    def clear_password_reset_token(self):
        """Clear password reset token"""
        self.password_reset_token = None
        self.password_reset_expires = None
        db.session.commit()

    def reset_password(self, new_password):
        """Reset password using token"""
        self.set_password(new_password)
        self.clear_password_reset_token()
        self.failed_login_attempts = 0  # Reset failed attempts
        self.locked_until = None
        self.log_security_event("PASSWORD_RESET_COMPLETED")
        db.session.commit()

    # Account lockout functionality
    def is_account_locked(self):
        """Check if account is currently locked"""
        if not self.locked_until:
            return False
        return datetime.now(timezone.utc) < self.locked_until

    def handle_failed_login(self, ip_address=None):
        """Handle failed login attempt with progressive lockout"""
        self.failed_login_attempts += 1
        self.last_failed_login = datetime.now(timezone.utc)
        
        # Progressive lockout: 5 min, 15 min, 30 min, 1 hr, 2 hr, max 4 hr
        if self.failed_login_attempts >= 3:
            lockout_minutes = min(5 * (2 ** (self.failed_login_attempts - 3)), 240)
            self.locked_until = datetime.now(timezone.utc) + timedelta(minutes=lockout_minutes)
            self.log_security_event("ACCOUNT_LOCKED", ip_address, 
                                   f"Attempts:{self.failed_login_attempts} Duration:{lockout_minutes}min")
        else:
            self.log_security_event("LOGIN_FAILED", ip_address, 
                                   f"Attempts:{self.failed_login_attempts}")
        
        db.session.commit()

    def handle_successful_login(self, ip_address=None):
        """Handle successful login - reset counters and update timestamps"""
        self.failed_login_attempts = 0
        self.locked_until = None
        self.last_failed_login = None
        self.update_last_login()
        self.log_security_event("LOGIN_SUCCESS", ip_address)

    def unlock_account(self):
        """Manually unlock account (admin function)"""
        self.failed_login_attempts = 0
        self.locked_until = None
        self.last_failed_login = None
        self.log_security_event("ACCOUNT_UNLOCKED")
        db.session.commit()

