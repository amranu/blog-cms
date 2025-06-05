"""
Image upload routes for blog CMS
"""
import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from utils.auth import admin_required
from PIL import Image
import re

uploads_bp = Blueprint('uploads', __name__)

# Allowed image extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_upload_directory():
    """Create upload directory if it doesn't exist"""
    upload_dir = os.path.join(current_app.instance_path, 'uploads', 'images')
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir

def resize_image(image_path, max_width=1200, max_height=800, quality=85):
    """Resize image to optimize for web"""
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Calculate new dimensions maintaining aspect ratio
            width, height = img.size
            if width > max_width or height > max_height:
                img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Save optimized image
            img.save(image_path, 'JPEG', quality=quality, optimize=True)
            
    except Exception as e:
        current_app.logger.error(f"Error resizing image: {str(e)}")

@uploads_bp.route('/upload-image', methods=['POST'])
@admin_required
def upload_image(user):
    """Upload and process an image file"""
    try:
        # Check if file is in request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        # Check if file was selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file size
        if len(file.read()) > MAX_FILE_SIZE:
            return jsonify({'error': 'File too large. Maximum size is 5MB'}), 400
        
        # Reset file pointer
        file.seek(0)
        
        if file and allowed_file(file.filename):
            # Create upload directory
            upload_dir = create_upload_directory()
            
            # Generate unique filename
            file_extension = secure_filename(file.filename).rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
            
            # Save file
            file_path = os.path.join(upload_dir, unique_filename)
            file.save(file_path)
            
            # Resize and optimize image
            resize_image(file_path)
            
            # Generate URL for accessing the image
            image_url = f"/api/uploads/images/{unique_filename}"
            
            current_app.logger.info(f"Image uploaded successfully: {unique_filename}")
            
            return jsonify({
                'success': True,
                'image_url': image_url,
                'filename': unique_filename,
                'original_filename': secure_filename(file.filename)
            }), 201
        
        return jsonify({'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WebP'}), 400
        
    except Exception as e:
        current_app.logger.error(f"Error uploading image: {str(e)}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@uploads_bp.route('/images/<filename>', methods=['GET'])
def serve_image(filename):
    """Serve uploaded images"""
    try:
        upload_dir = os.path.join(current_app.instance_path, 'uploads', 'images')
        
        # Security check - ensure filename is safe
        secure_name = secure_filename(filename)
        if secure_name != filename:
            return jsonify({'error': 'Invalid filename'}), 400
        
        # Check if file exists
        file_path = os.path.join(upload_dir, secure_name)
        if not os.path.exists(file_path):
            return jsonify({'error': 'Image not found'}), 404
        
        return send_from_directory(upload_dir, secure_name)
        
    except Exception as e:
        current_app.logger.error(f"Error serving image: {str(e)}")
        return jsonify({'error': 'Failed to serve image'}), 500

@uploads_bp.route('/images/<filename>', methods=['DELETE'])
@admin_required
def delete_image(user, filename):
    """Delete an uploaded image"""
    try:
        upload_dir = os.path.join(current_app.instance_path, 'uploads', 'images')
        
        # Security check
        secure_name = secure_filename(filename)
        if secure_name != filename:
            return jsonify({'error': 'Invalid filename'}), 400
        
        file_path = os.path.join(upload_dir, secure_name)
        
        if os.path.exists(file_path):
            os.remove(file_path)
            current_app.logger.info(f"Image deleted: {secure_name}")
            return jsonify({'message': 'Image deleted successfully'})
        else:
            return jsonify({'error': 'Image not found'}), 404
            
    except Exception as e:
        current_app.logger.error(f"Error deleting image: {str(e)}")
        return jsonify({'error': f'Delete failed: {str(e)}'}), 500