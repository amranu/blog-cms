"""
Input validation and sanitization utilities
"""
import re
import html

def sanitize_input(text, allow_markdown=False):
    """Sanitize user input to prevent XSS attacks."""
    if not text:
        return ""
    
    text = str(text).strip()
    
    if not allow_markdown:
        # HTML escape for non-markdown content
        text = html.escape(text)
    
    # Remove potentially dangerous patterns
    text = re.sub(r'<script.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
    
    return text

def validate_blog_post(data):
    """Validate blog post data."""
    errors = []
    
    # Title validation
    if not data.get('title') or not str(data['title']).strip():
        errors.append("Title is required")
    elif len(str(data['title'])) > 255:
        errors.append("Title must be less than 255 characters")
    
    # Content validation
    if not data.get('content') or not str(data['content']).strip():
        errors.append("Content is required")
    elif len(str(data['content'])) > 50000:  # 50KB limit
        errors.append("Content is too long (max 50,000 characters)")
    
    # Status validation
    valid_statuses = ['draft', 'published', 'archived']
    if data.get('status') and data['status'] not in valid_statuses:
        errors.append("Invalid status. Must be draft, published, or archived")
    
    # Excerpt validation
    if data.get('excerpt') and len(str(data['excerpt'])) > 500:
        errors.append("Excerpt must be less than 500 characters")
    
    # Meta description validation
    if data.get('meta_description') and len(str(data['meta_description'])) > 160:
        errors.append("Meta description must be less than 160 characters")
    
    return errors