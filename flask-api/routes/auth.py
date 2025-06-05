"""
Authentication routes
"""
import re
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.user import User
from utils.validation import sanitize_input
from utils.auth import generate_token, admin_required
from utils.email import send_verification_email
from __init__ import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    
    # Input validation
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"login": False, "error": "Username and password required"}), 400
    
    # Sanitize inputs
    username = sanitize_input(data['username'])
    password = data['password']  # Don't sanitize password as it might contain special chars
    
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password):
        # Check if email is verified (admins are automatically verified)
        if not user.email_verified and not user.is_admin:
            return jsonify({
                "login": False, 
                "error": "Please verify your email address before logging in",
                "verification_required": True
            }), 401
        
        token = generate_token(user.id)
        return jsonify({
            "login": True, 
            "token": token,
            "user": {'id': user.id, 'username': user.username, 'is_admin': user.is_admin, 'is_verified': user.email_verified}
        }), 200
    else:
        return jsonify({"login": False, "error": "Invalid credentials"}), 401

@auth_bp.route('/register_user', methods=['POST'])
@admin_required
def register_user(user):
    data = request.json
    
    # Input validation
    required_fields = ['username', 'password', 'email', 'firstname', 'lastname']
    for field in required_fields:
        if not data or field not in data or not str(data[field]).strip():
            return jsonify({"registered": False, "error": f"{field.capitalize()} is required"}), 400
    
    # Sanitize inputs
    username = sanitize_input(data['username'])
    email = sanitize_input(data['email'])
    firstname = sanitize_input(data['firstname'])
    lastname = sanitize_input(data['lastname'])
    middlename = sanitize_input(data.get('middlename', ''))
    
    # Email validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        return jsonify({"registered": False, "error": "Invalid email format"}), 400
    
    # Password strength validation
    password = data['password']
    if len(password) < 8:
        return jsonify({"registered": False, "error": "Password must be at least 8 characters long"}), 400
    
    hashed_password = generate_password_hash(password)
    new_user = User(
        username=username, 
        password=hashed_password, 
        email=email, 
        firstname=firstname, 
        lastname=lastname, 
        middlename=middlename,
        is_admin=False
    )
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"registered": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"registered": False, "error": "Username or email already exists"}), 409

@auth_bp.route('/register', methods=['POST'])
def register():
    """Public registration endpoint for non-admin users"""
    data = request.json
    
    # Input validation
    required_fields = ['username', 'password', 'email', 'firstname', 'lastname']
    for field in required_fields:
        if not data or field not in data or not str(data[field]).strip():
            return jsonify({"registered": False, "error": f"{field.capitalize()} is required"}), 400
    
    # Sanitize inputs
    username = sanitize_input(data['username'])
    email = sanitize_input(data['email'])
    firstname = sanitize_input(data['firstname'])
    lastname = sanitize_input(data['lastname'])
    middlename = sanitize_input(data.get('middlename', ''))
    
    # Email validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        return jsonify({"registered": False, "error": "Invalid email format"}), 400
    
    # Password strength validation
    password = data['password']
    if len(password) < 8:
        return jsonify({"registered": False, "error": "Password must be at least 8 characters long"}), 400
    
    hashed_password = generate_password_hash(password)
    new_user = User(
        username=username, 
        password=hashed_password, 
        email=email, 
        firstname=firstname, 
        lastname=lastname, 
        middlename=middlename,
        is_admin=False,
        email_verified=False
    )
    
    try:
        # Generate verification token
        verification_token = new_user.generate_verification_token()
        
        db.session.add(new_user)
        db.session.commit()
        
        # Send verification email
        full_name = f"{firstname} {lastname}"
        try:
            send_verification_email(email, full_name, verification_token)
        except Exception as e:
            # Log error but don't fail registration
            print(f"Failed to send verification email: {str(e)}")
        
        return jsonify({
            "registered": True,
            "message": "Registration successful! Please check your email to verify your account."
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"registered": False, "error": "Username or email already exists"}), 409

@auth_bp.route('/verify-email', methods=['GET'])
def verify_email():
    """Email verification endpoint"""
    token = request.args.get('token')
    
    if not token:
        return jsonify({"verified": False, "error": "Verification token is required"}), 400
    
    # Find user with this verification token
    user = User.query.filter_by(verification_token=token).first()
    
    if not user:
        return jsonify({"verified": False, "error": "Invalid verification token"}), 400
    
    # Check if token is valid and not expired
    if not user.is_verification_token_valid(token):
        return jsonify({
            "verified": False, 
            "error": "Verification token has expired. Please register again."
        }), 400
    
    # Verify the user
    user.verify_email()
    
    try:
        db.session.commit()
        return jsonify({
            "verified": True,
            "message": "Email verified successfully! You can now log in."
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"verified": False, "error": "Verification failed"}), 500

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend verification email"""
    data = request.json
    
    if not data or 'email' not in data:
        return jsonify({"sent": False, "error": "Email address is required"}), 400
    
    email = sanitize_input(data['email'])
    user = User.query.filter_by(email=email).first()
    
    if not user:
        # Don't reveal if email exists or not for security
        return jsonify({
            "sent": True,
            "message": "If an account with this email exists, a verification email has been sent."
        }), 200
    
    if user.is_verified:
        return jsonify({"sent": False, "error": "Email is already verified"}), 400
    
    # Generate new verification token
    verification_token = user.generate_verification_token()
    
    try:
        db.session.commit()
        
        # Send verification email
        full_name = f"{user.firstname} {user.lastname}"
        send_verification_email(user.email, full_name, verification_token)
        
        return jsonify({
            "sent": True,
            "message": "Verification email sent successfully!"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"sent": False, "error": "Failed to send verification email"}), 500