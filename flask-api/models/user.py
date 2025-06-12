"""
User model
"""
from __init__ import db
import secrets
from datetime import datetime, timedelta

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(), nullable=False)
    email = db.Column(db.String(), unique=True, nullable=False)
    firstname = db.Column(db.String(), nullable=False)
    lastname = db.Column(db.String(), nullable=False)
    middlename = db.Column(db.String(), nullable=True)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    email_verification_token = db.Column(db.String(64), nullable=True)
    email_verification_sent_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def generate_verification_token(self):
        """Generate a new verification token that expires in 24 hours"""
        self.email_verification_token = secrets.token_urlsafe(32)
        self.email_verification_sent_at = datetime.utcnow()
        return self.email_verification_token
    
    def is_verification_token_valid(self, token):
        """Check if the verification token is valid and not expired"""
        if not self.email_verification_token or not self.email_verification_sent_at:
            return False
        if datetime.utcnow() > (self.email_verification_sent_at + timedelta(hours=24)):
            return False
        return self.email_verification_token == token
    
    def verify_email(self):
        """Mark email as verified and clear verification token"""
        self.email_verified = True
        self.email_verification_token = None
        self.email_verification_sent_at = None
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'firstname': self.firstname,
            'lastname': self.lastname,
            'middlename': self.middlename,
            'is_admin': self.is_admin,
            'is_verified': self.email_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }