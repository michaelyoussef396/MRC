from flask import request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token, 
    get_jwt_identity, 
    jwt_required,
    get_jwt
)
from flask_mail import Message
from datetime import datetime, timezone
import re
import bleach
from app import db, mail, limiter
from app.auth import bp
from app.models import User, PasswordResetToken

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
@limiter.limit("5 per minute")
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
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Update last login
        user.update_last_login()
        
        # Create tokens (identity must be string for JWT)
        access_token = create_access_token(identity=str(user.id))
        
        # Create longer-lasting refresh token if "remember me" is checked
        if remember_me:
            refresh_token = create_refresh_token(identity=str(user.id))
        else:
            refresh_token = None
        
        response = {
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }
        
        if refresh_token:
            response['refresh_token'] = refresh_token
        
        return jsonify(response), 200
        
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
        
        return jsonify({
            'access_token': new_access_token,
            'user': user.to_dict()
        }), 200
        
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

@bp.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    """Request password reset email"""
    try:
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        if not user:
            # Don't reveal if email exists for security
            return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200
        
        # Generate reset token
        token = PasswordResetToken.generate_token()
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.now(timezone.utc) + current_app.config['PASSWORD_RESET_TOKEN_EXPIRES']
        )
        
        db.session.add(reset_token)
        db.session.commit()
        
        # Send email (in production, would use actual email service)
        try:
            msg = Message(
                'Password Reset - MRC System',
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                recipients=[user.email]
            )
            msg.body = f"""
Hello {user.full_name},

You have requested a password reset for your MRC account.

Please click the link below to reset your password:
{request.url_root}reset-password?token={token}

This link will expire in 15 minutes.

If you did not request this reset, please ignore this email.

Best regards,
MRC System
            """
            mail.send(msg)
        except Exception as email_error:
            current_app.logger.error(f"Email send error: {str(email_error)}")
            # Don't fail the request if email fails in development
        
        return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Password reset request error: {str(e)}")
        return jsonify({'error': 'Failed to process password reset request'}), 500

@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    try:
        data = request.get_json()
        if not data or 'token' not in data or 'new_password' not in data:
            return jsonify({'error': 'Token and new password are required'}), 400
        
        # Find valid token
        reset_token = PasswordResetToken.query.filter_by(
            token=data['token'], 
            used=False
        ).first()
        
        if not reset_token or not reset_token.is_valid():
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        # Validate new password
        is_valid, message = validate_password_strength(data['new_password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Update user password
        user = reset_token.user
        user.set_password(data['new_password'])
        
        # Mark token as used
        reset_token.used = True
        
        db.session.commit()
        
        return jsonify({'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Password reset error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to reset password'}), 500

@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client should discard tokens)"""
    try:
        # In a production system, you might want to blacklist the JWT token
        # For now, we'll just return success and let the client discard the token
        return jsonify({'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Logout failed'}), 500