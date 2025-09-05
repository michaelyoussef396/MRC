from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.main import bp
from app.models import User

@bp.route('/health')
def health():
    """API health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'MRC Authentication API',
        'version': '1.0.0'
    }), 200

@bp.route('/me')
@jwt_required()
def get_current_user():
    """Get current authenticated user info"""
    try:
        current_user_id = int(get_jwt_identity())  # Convert back to int for DB query
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get user info'}), 500

