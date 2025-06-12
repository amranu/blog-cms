#!/usr/bin/env python3
"""
Database migration script to add email verification fields to User model
"""
import sqlite3
import os
from datetime import datetime

def migrate_database():
    """Add email verification columns to users table"""
    
    db_path = '/opt/blog-cms/flask-api/instance/cms_blog.db'
    
    if not os.path.exists(db_path):
        print("Database not found. Creating new database with updated schema.")
        return
    
    print("Starting database migration for email verification...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        new_columns = [
            ('is_verified', 'BOOLEAN DEFAULT 0'),
            ('verification_token', 'VARCHAR(64)'),
            ('verification_token_expires', 'DATETIME'),
            ('created_at', 'DATETIME')
        ]
        
        for column_name, column_def in new_columns:
            if column_name not in columns:
                print(f"Adding column: {column_name}")
                cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_def}")
            else:
                print(f"Column {column_name} already exists, skipping.")
        
        # Set existing users as verified (admin users should remain functional)
        cursor.execute("UPDATE users SET is_verified = 1 WHERE is_verified IS NULL OR is_verified = 0")
        
        # Set created_at for existing users if null
        cursor.execute("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")
        
        conn.commit()
        print("Database migration completed successfully!")
        
        # Display updated schema
        cursor.execute("PRAGMA table_info(users)")
        print("\nUpdated users table schema:")
        for column in cursor.fetchall():
            print(f"  {column[1]} - {column[2]}")
            
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()