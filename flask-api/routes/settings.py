"""
Settings routes for blog configuration
"""
from flask import Blueprint, request, jsonify, current_app
from utils.auth import token_required, admin_required
from __init__ import db
from shared_models import get_setting

settings_bp = Blueprint('settings', __name__)

# Get the Setting model
Setting = get_setting()

@settings_bp.route('/settings', methods=['GET'])
@token_required
def get_settings(current_user):
    """Get all settings"""
    try:
        settings = Setting.query.all()
        settings_dict = {}
        for setting in settings:
            settings_dict[setting.key] = setting.value
            
        # Add default values if not set
        if 'site_name' not in settings_dict:
            settings_dict['site_name'] = 'Blog CMS'
            
        return jsonify({'settings': settings_dict}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/settings', methods=['POST'])
@admin_required
def update_settings(current_user):
    """Update settings (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        for key, value in data.items():
            setting = Setting.query.filter_by(key=key).first()
            if setting:
                setting.value = str(value)
            else:
                setting = Setting(key=key, value=str(value))
                db.session.add(setting)
        
        db.session.commit()
        return jsonify({'message': 'Settings updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/settings/site_name', methods=['GET'])
def get_site_name():
    """Get site name (public endpoint)"""
    try:
        setting = Setting.query.filter_by(key='site_name').first()
        if setting:
            return jsonify({'value': setting.value}), 200
        else:
            return jsonify({'value': 'Blog CMS'}), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/settings/<key>', methods=['GET'])
@token_required
def get_setting(current_user, key):
    """Get a specific setting"""
    try:
        setting = Setting.query.filter_by(key=key).first()
        if setting:
            return jsonify({'value': setting.value}), 200
        else:
            # Return default values for known settings
            defaults = {
                'site_name': 'Blog CMS'
            }
            return jsonify({'value': defaults.get(key, '')}), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/settings/<key>', methods=['PUT'])
@admin_required
def update_setting(current_user, key):
    """Update a specific setting"""
    try:
        data = request.get_json()
        if not data or 'value' not in data:
            return jsonify({'error': 'Value is required'}), 400
            
        setting = Setting.query.filter_by(key=key).first()
        if setting:
            setting.value = str(data['value'])
        else:
            setting = Setting(key=key, value=str(data['value']))
            db.session.add(setting)
        
        db.session.commit()
        return jsonify({'message': f'Setting {key} updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500