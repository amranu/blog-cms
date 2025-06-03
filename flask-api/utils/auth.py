"""
Authentication utilities for JWT token handling
"""
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app

def generate_token(user_id):
    """Generate JWT token for authenticated user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7),  # 7 days instead of 24 hours
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        current_app.logger.warning(f"Token expired for request")
        return None
    except jwt.InvalidTokenError as e:
        current_app.logger.warning(f"Invalid token: {str(e)}")
        return None

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            current_app.logger.warning("No Authorization header provided")
            return jsonify({'error': 'Authentication required - No authorization header'}), 401
        
        if not auth_header.startswith('Bearer '):
            current_app.logger.warning(f"Invalid Authorization header format: {auth_header[:20]}...")
            return jsonify({'error': 'Authentication required - Invalid header format'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = verify_token(token)
        if user_id is None:
            current_app.logger.warning("Token verification failed")
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user_id to request context
        request.current_user_id = user_id
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator to require valid JWT token and admin privileges"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            current_app.logger.warning("No Authorization header provided")
            return jsonify({'error': 'Authentication required - No authorization header'}), 401
        
        if not auth_header.startswith('Bearer '):
            current_app.logger.warning(f"Invalid Authorization header format: {auth_header[:20]}...")
            return jsonify({'error': 'Authentication required - Invalid header format'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = verify_token(token)
        if user_id is None:
            current_app.logger.warning("Token verification failed")
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Check if user is admin
        from models.user import User
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            current_app.logger.warning(f"Non-admin user {user_id} attempted to access admin endpoint")
            return jsonify({'error': 'Admin privileges required'}), 403
        
        # Add user_id to request context
        request.current_user_id = user_id
        return f(*args, **kwargs)
    return decorated