#!/usr/bin/env python3
"""
Script to create admin user 'amranu' with randomly generated password
"""
import sys
import os
import secrets
import string
from werkzeug.security import generate_password_hash

# Add the flask-api directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.user import User
from __init__ import db, create_app

def generate_random_password(length=16):
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

def create_admin_user():
    """Create admin user 'amranu' with random password"""
    app = create_app()
    
    with app.app_context():
        print("Initializing database tables...")
        
        # Create all tables
        db.create_all()
        print("Database tables created!")
        
        # Generate random password
        random_password = generate_random_password()
        
        # Check if user already exists
        existing_user = User.query.filter_by(username='amranu').first()
        if existing_user:
            print("User 'amranu' already exists!")
            # Update password and ensure admin status
            existing_user.password = generate_password_hash(random_password)
            existing_user.is_admin = True
            db.session.commit()
            print("Updated existing user 'amranu':")
            print(f"  Username: amranu")
            print(f"  Password: {random_password}")
            print(f"  Admin: True")
            print(f"\n⚠️  IMPORTANT: Save this password immediately! ⚠️")
            return
        
        # Create admin user
        print("Creating admin user 'amranu'...")
        hashed_password = generate_password_hash(random_password)
        admin_user = User(
            username='amranu',
            password=hashed_password,
            email='amranu@isodigm.ca',
            firstname='Admin',
            lastname='User',
            middlename='',
            is_admin=True
        )
        
        try:
            db.session.add(admin_user)
            db.session.commit()
            print("✅ Successfully created admin user:")
            print(f"  Username: amranu")
            print(f"  Password: {random_password}")
            print(f"  Email: amranu@isodigm.ca")
            print(f"  Admin: True")
            print(f"\n⚠️  IMPORTANT: Save this password immediately! ⚠️")
            print(f"This password will not be shown again.")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating admin user: {str(e)}")
            raise

if __name__ == '__main__':
    create_admin_user()