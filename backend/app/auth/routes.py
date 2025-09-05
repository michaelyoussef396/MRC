from flask import request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token, 
    get_jwt_identity, 
    jwt_required,
    get_jwt,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies
)
from flask_mail import Message
from datetime import datetime, timezone
import re
import bleach
import logging
from app import db, mail, limiter
from app.auth import bp
from app.models import User

# Get client IP address helper
def get_client_ip():
    """Get client IP address for logging"""
    if request.environ.get('HTTP_X_FORWARDED_FOR') is None:
        return request.environ['REMOTE_ADDR']
    else:
        return request.environ['HTTP_X_FORWARDED_FOR']

def sanitize_input(text):
    """Sanitize user input to prevent XSS attacks"""
    if not text:
        return text
    # Allow only safe HTML tags and attributes (none for security)
    return bleach.clean(str(text), tags=[], attributes={}, strip=True)

def validate_password_strength(password):
    """Validate password meets MRC requirements"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    return True, "Password meets all requirements"

@bp.route('/login', methods=['POST'])
@limiter.limit("50 per minute")
def login():
    """Authenticate user and return JWT tokens"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get credentials (support both username and email)
        username_or_email = data.get('username') or data.get('email')
        password = data.get('password')
        remember_me = data.get('remember_me', False)
        
        if not username_or_email or not password:
            return jsonify({'error': 'Username/email and password are required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        client_ip = get_client_ip()
        
        if not user:
            # Log failed attempt even when user doesn't exist (prevent enumeration)
            current_app.logger.warning(f"LOGIN_FAILED: Unknown user '{username_or_email}' from IP {client_ip}")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check if account is locked
        if user.is_account_locked():
            user.log_security_event("LOGIN_BLOCKED_LOCKED", client_ip)
            return jsonify({'error': 'Account temporarily locked due to failed login attempts'}), 401
        
        if not user.check_password(password):
            user.handle_failed_login(client_ip)
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            user.log_security_event("LOGIN_BLOCKED_INACTIVE", client_ip)
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Handle successful login
        user.handle_successful_login(client_ip)
        
        # Create tokens (identity must be string for JWT)
        access_token = create_access_token(identity=str(user.id))
        
        # Create response
        response_data = {
            'message': 'Login successful',
            'user': user.to_dict()
        }
        
        response = jsonify(response_data)
        
        # Set access token cookie
        set_access_cookies(response, access_token)
        
        # Create longer-lasting refresh token if "remember me" is checked
        if remember_me:
            refresh_token = create_refresh_token(identity=str(user.id))
            set_refresh_cookies(response, refresh_token)
        
        return response, 200
        
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token"""
    try:
        current_user_id = int(get_jwt_identity())  # Convert back to int for DB query
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 404
        
        new_access_token = create_access_token(identity=str(current_user_id))
        
        response_data = {
            'message': 'Token refreshed successfully',
            'user': user.to_dict()
        }
        
        response = jsonify(response_data)
        set_access_cookies(response, new_access_token)
        
        return response, 200
        
    except Exception as e:
        current_app.logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'Token refresh failed'}), 500

@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = int(get_jwt_identity())  # Convert back to int for DB query
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        current_app.logger.error(f"Get profile error: {str(e)}")
        return jsonify({'error': 'Failed to get profile'}), 500

@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user profile"""
    try:
        current_user_id = int(get_jwt_identity())  # Convert back to int for DB query
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update allowed fields with input sanitization
        if 'username' in data:
            # Sanitize and check if username is already taken
            clean_username = sanitize_input(data['username'])
            existing_user = User.query.filter(
                User.username == clean_username, 
                User.id != user.id
            ).first()
            if existing_user:
                return jsonify({'error': 'Username already taken'}), 400
            user.username = clean_username
        
        if 'email' in data:
            # Sanitize and check if email is already taken
            clean_email = sanitize_input(data['email'])
            existing_user = User.query.filter(
                User.email == clean_email, 
                User.id != user.id
            ).first()
            if existing_user:
                return jsonify({'error': 'Email already taken'}), 400
            user.email = clean_email
        
        if 'full_name' in data:
            user.full_name = sanitize_input(data['full_name'])
        
        if 'phone' in data:
            user.phone = sanitize_input(data['phone'])
        
        # Handle password change
        if 'current_password' in data and 'new_password' in data:
            if not user.check_password(data['current_password']):
                return jsonify({'error': 'Current password is incorrect'}), 400
            
            is_valid, message = validate_password_strength(data['new_password'])
            if not is_valid:
                return jsonify({'error': message}), 400
            
            user.set_password(data['new_password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Update profile error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500

@bp.route('/add-technician', methods=['POST'])
@jwt_required()
def add_technician():
    """Add new technician user (admin function)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Required fields
        required_fields = ['username', 'email', 'password', 'full_name']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field.replace("_", " ").title()} is required'}), 400
        
        # Check if username exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        # Check if email exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Validate password strength
        is_valid, message = validate_password_strength(data['password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Create new user with sanitized input
        new_user = User(
            username=sanitize_input(data['username']),
            email=sanitize_input(data['email']),
            full_name=sanitize_input(data['full_name']),
            phone=sanitize_input(data.get('phone')) if data.get('phone') else None
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Technician added successfully',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Add technician error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add technician'}), 500



@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user and clear cookies"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if user:
            user.log_security_event("LOGOUT", get_client_ip())
        
        response = jsonify({'message': 'Logged out successfully'})
        unset_jwt_cookies(response)
        return response, 200
        
    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Logout failed'}), 500

@bp.route('/request-password-reset', methods=['POST'])
@limiter.limit("5 per minute")  # Strict rate limiting for password reset requests
def request_password_reset():
    """Request password reset token"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = sanitize_input(data.get('email'))
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        client_ip = get_client_ip()
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        # Always return success to prevent email enumeration
        if user and user.is_active:
            # Generate reset token
            token = user.generate_password_reset_token()
            
            # Send reset email
            try:
                msg = Message(
                    'Password Reset - MRC Authentication',
                    sender=current_app.config['MAIL_DEFAULT_SENDER'],
                    recipients=[user.email]
                )
                
                # Simple text email with reset link
                reset_url = f"http://localhost:3000/reset-password?token={token}&email={user.email}"
                
                msg.body = f"""Hello {user.full_name},

You have requested a password reset for your MRC account.

Click the following link to reset your password:
{reset_url}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
MRC Authentication System
"""
                
                mail.send(msg)
                user.log_security_event("PASSWORD_RESET_EMAIL_SENT", client_ip)
                
            except Exception as e:
                current_app.logger.error(f"Failed to send password reset email: {str(e)}")
                # Clear token if email fails
                user.clear_password_reset_token()
                return jsonify({'error': 'Failed to send reset email'}), 500
        else:
            # Log attempt for non-existent or inactive users
            current_app.logger.warning(f"Password reset requested for invalid email: {email} from IP {client_ip}")
        
        # Always return success message (prevent email enumeration)
        return jsonify({
            'message': 'If the email exists in our system, a password reset link has been sent.'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Password reset request error: {str(e)}")
        return jsonify({'error': 'Failed to process password reset request'}), 500

@bp.route('/reset-password', methods=['POST'])
@limiter.limit("10 per minute")
def reset_password():
    """Reset password using token"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = sanitize_input(data.get('email'))
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not all([email, token, new_password]):
            return jsonify({'error': 'Email, token, and new password are required'}), 400
        
        client_ip = get_client_ip()
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        if not user:
            current_app.logger.warning(f"Password reset attempted for non-existent email: {email} from IP {client_ip}")
            return jsonify({'error': 'Invalid reset token'}), 400
        
        # Verify token
        if not user.verify_password_reset_token(token):
            user.log_security_event("PASSWORD_RESET_INVALID_TOKEN", client_ip)
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        # Validate new password strength
        is_valid, message = validate_password_strength(new_password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Reset password
        user.reset_password(new_password)
        
        return jsonify({'message': 'Password has been successfully reset'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Password reset error: {str(e)}")
        return jsonify({'error': 'Failed to reset password'}), 500