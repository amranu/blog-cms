"""
Flask API Application Factory
"""
import os
import logging
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from config import config

db = SQLAlchemy()

def create_app(config_name=None):
    """Create Flask application using the factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.getenv('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])
    
    # Configure logging
    if app.debug:
        logging.basicConfig(level=logging.INFO)
        app.logger.setLevel(logging.INFO)
    
    # Initialize extensions
    db.init_app(app)
    
    # Configure CORS
    allowed_origins = app.config.get('CORS_ORIGINS', ['http://localhost:3000'])
    CORS(app, supports_credentials=True, resources={r"/*": {"origins": allowed_origins}})
    
    # Security Headers
    @app.after_request
    def after_request(response):
        security_headers = app.config.get('SECURITY_HEADERS', {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
        })
        
        for header, value in security_headers.items():
            response.headers[header] = value
        return response
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.blog import blog_bp
    from routes.posts import posts_bp
    from routes.settings import settings_bp
    from routes.uploads import uploads_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(blog_bp, url_prefix='/api/blog')
    app.register_blueprint(posts_bp)
    app.register_blueprint(settings_bp, url_prefix='/api')
    app.register_blueprint(uploads_bp, url_prefix='/api/uploads')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app