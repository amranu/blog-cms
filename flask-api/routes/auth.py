"""
Authentication routes
"""
import re
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.user import User
from utils.validation import sanitize_input
from utils.auth import generate_token, admin_required
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
        token = generate_token(user.id)
        return jsonify({
            "login": True, 
            "token": token,
            "user": {'id': user.id, 'username': user.username, 'is_admin': user.is_admin}
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