#!/usr/bin/env python3
"""
Simple script to create test admin user
"""
import sys
import os
from werkzeug.security import generate_password_hash

# Add the flask-api directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.user import User
from __init__ import db, create_app

def create_admin_user():
    """Create test admin user"""
    app = create_app()
    
    with app.app_context():
        print("Initializing basic database tables...")
        
        # Create all tables
        db.create_all()
        print("Database tables created!")
        
        # Check if test user already exists
        existing_user = User.query.filter_by(username='test').first()
        if existing_user:
            print("User 'test' already exists!")
            # Update to admin if not already
            if not existing_user.is_admin:
                existing_user.is_admin = True
                db.session.commit()
                print("Updated existing user 'test' to admin status.")
            else:
                print("User 'test' is already an admin.")
            return
        
        # Create test admin user
        print("Creating test admin user...")
        hashed_password = generate_password_hash('test')
        admin_user = User(
            username='test',
            password=hashed_password,
            email='test@example.com',
            firstname='Test',
            lastname='Admin',
            middlename='',
            is_admin=True
        )
        
        try:
            db.session.add(admin_user)
            db.session.commit()
            print("Successfully created admin user:")
            print("  Username: test")
            print("  Password: test")
            print("  Email: test@example.com")
            print("  Admin: True")
        except Exception as e:
            db.session.rollback()
            print(f"Error creating admin user: {str(e)}")
            raise

if __name__ == '__main__':
    create_admin_user()