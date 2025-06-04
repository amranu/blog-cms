"""
Shared models initialization - call create_blog_models only once
"""
from blog_models import create_blog_models
from __init__ import db

# Initialize models once and share across modules
blog_models = None

def get_models():
    """Get the shared models, creating them if they don't exist"""
    global blog_models
    if blog_models is None:
        blog_models = create_blog_models(db)
    return blog_models

# Export the individual models for convenience
def get_blog_post():
    return get_models()['BlogPost']

def get_blog_comment():
    return get_models()['BlogComment']

def get_blog_category():
    return get_models()['BlogCategory']

def get_setting():
    return get_models()['Setting']