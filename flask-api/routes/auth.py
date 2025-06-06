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
            "user": {
                'id': user.id, 
                'username': user.username, 
                'email': user.email,
                'firstname': user.firstname,
                'lastname': user.lastname,
                'is_admin': user.is_admin, 
                'is_verified': user.email_verified
            }
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
        return '''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invalid Link - Blog CMS</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                .error { color: #f44336; }
                .btn { background-color: #008CBA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                .btn:hover { background-color: #007BB5; }
            </style>
        </head>
        <body>
            <h1 class="error">✗ Invalid Verification Link</h1>
            <p>The verification link is missing required information. Please check your email and try clicking the link again.</p>
            <a href="/" class="btn">Go to Home</a>
        </body>
        </html>
        ''', 400
    
    # Find user with this verification token
    user = User.query.filter_by(email_verification_token=token).first()
    
    if not user:
        return '''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invalid Token - Blog CMS</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                .error { color: #f44336; }
                .btn { background-color: #008CBA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                .btn:hover { background-color: #007BB5; }
            </style>
        </head>
        <body>
            <h1 class="error">✗ Invalid Verification Token</h1>
            <p>This verification link is not valid. It may have already been used or the token is incorrect.</p>
            <a href="/" class="btn">Go to Home</a>
        </body>
        </html>
        ''', 400
    
    # Check if token is valid and not expired
    if not user.is_verification_token_valid(token):
        return '''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Link Expired - Blog CMS</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                .error { color: #f44336; }
                .btn { background-color: #008CBA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                .btn:hover { background-color: #007BB5; }
            </style>
        </head>
        <body>
            <h1 class="error">✗ Verification Link Expired</h1>
            <p>This verification link has expired. Verification links are valid for 24 hours. Please register again to receive a new verification email.</p>
            <a href="/" class="btn">Go to Home</a>
        </body>
        </html>
        ''', 400
    
    # Verify the user
    user.verify_email()
    
    try:
        db.session.commit()
        # Return HTML page for successful verification
        return '''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verified - Blog CMS</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                .success { color: #4CAF50; }
                .btn { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                .btn:hover { background-color: #45a049; }
            </style>
        </head>
        <body>
            <h1 class="success">✓ Email Verified Successfully!</h1>
            <p>Your email address has been verified. You can now log in to your Blog CMS account.</p>
            <a href="/login" class="btn">Go to Login</a>
        </body>
        </html>
        ''', 200
    except Exception as e:
        db.session.rollback()
        # Return HTML page for verification failure
        return '''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Failed - Blog CMS</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                .error { color: #f44336; }
                .btn { background-color: #008CBA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                .btn:hover { background-color: #007BB5; }
            </style>
        </head>
        <body>
            <h1 class="error">✗ Verification Failed</h1>
            <p>There was an error verifying your email address. Please try again or contact support.</p>
            <a href="/" class="btn">Go to Home</a>
        </body>
        </html>
        ''', 500

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
    
    if user.email_verified:
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