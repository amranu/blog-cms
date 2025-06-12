#!/usr/bin/env python3
"""
Database migration script to add email verification fields to existing users
"""

from __init__ import create_app, db
from sqlalchemy import text

def migrate_database():
    """Add email verification columns and set existing users as verified"""
    app = create_app()
    
    with app.app_context():
        # Use db.session.execute instead of db.engine.execute for SQLAlchemy 2.x
        try:
            # Add new columns to users table
            db.session.execute(text('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0 NOT NULL'))
            db.session.commit()
            print("Added email_verified column")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("email_verified column already exists")
            else:
                print(f"Error adding email_verified: {e}")
            db.session.rollback()
        
        try:
            db.session.execute(text('ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(64)'))
            db.session.commit()
            print("Added email_verification_token column")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("email_verification_token column already exists")
            else:
                print(f"Error adding email_verification_token: {e}")
            db.session.rollback()
        
        try:
            db.session.execute(text('ALTER TABLE users ADD COLUMN email_verification_sent_at DATETIME'))
            db.session.commit()
            print("Added email_verification_sent_at column")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("email_verification_sent_at column already exists")
            else:
                print(f"Error adding email_verification_sent_at: {e}")
            db.session.rollback()
        
        try:
            # SQLite doesn't support NOT NULL with dynamic defaults, so make it nullable
            db.session.execute(text('ALTER TABLE users ADD COLUMN created_at DATETIME'))
            db.session.commit()
            print("Added created_at column (nullable)")
            
            # Update existing users to have a created_at timestamp
            db.session.execute(text('UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL'))
            db.session.commit()
            print("Set created_at for existing users")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("created_at column already exists")
            else:
                print(f"Error adding created_at: {e}")
            db.session.rollback()
        
        # Now update existing users to be email verified
        try:
            db.session.execute(text('UPDATE users SET email_verified = 1 WHERE email_verified = 0'))
            affected_rows = db.session.execute(text('SELECT changes()')).scalar()
            db.session.commit()
            print(f"Set {affected_rows} existing users as email verified")
        except Exception as e:
            print(f"Error updating existing users: {e}")
            db.session.rollback()
        
        print("Database migration completed successfully!")

if __name__ == '__main__':
    migrate_database()