"""
Blog CMS routes
"""
import re
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from utils.validation import sanitize_input, validate_blog_post
from utils.auth import token_required, admin_required
from __init__ import db
from shared_models import get_blog_post, get_blog_comment, get_blog_category

blog_bp = Blueprint('blog', __name__)

# Initialize blog models
BlogPost = get_blog_post()
BlogComment = get_blog_comment()
BlogCategory = get_blog_category()

@blog_bp.route('/posts', methods=['GET'])
def get_blog_posts():
    """Get all blog posts with filtering options"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    category = request.args.get('category')
    author_id = request.args.get('author_id', type=int)
    
    query = BlogPost.query
    
    # Filter by status (only if status is specified and not 'all')
    if status and status != 'all':
        query = query.filter_by(status=status)
    
    # Filter by category
    if category:
        query = query.filter_by(category=category)
        
    # Filter by author
    if author_id:
        query = query.filter_by(author_id=author_id)
    
    # Order by published date or created date
    if status == 'published':
        query = query.order_by(BlogPost.published_at.desc())
    else:
        query = query.order_by(BlogPost.created_at.desc())
    
    # Paginate
    posts = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'posts': [post.to_dict(include_content=False) for post in posts.items],
        'total': posts.total,
        'pages': posts.pages,
        'current_page': page,
        'per_page': per_page
    })

@blog_bp.route('/posts/<slug>', methods=['GET'])
def get_blog_post(slug):
    """Get a single blog post by slug"""
    post = BlogPost.query.filter_by(slug=slug).first_or_404()
    
    # Increment view count
    post.view_count += 1
    db.session.commit()
    
    # Get approved comments
    comments = BlogComment.query.filter_by(
        post_id=post.id, 
        status='approved',
        parent_id=None  # Only top-level comments
    ).order_by(BlogComment.created_at.desc()).all()
    
    post_data = post.to_dict()
    post_data['comments'] = [comment.to_dict() for comment in comments]
    
    return jsonify(post_data)

@blog_bp.route('/posts/<int:post_id>', methods=['GET'])
def get_blog_post_by_id(post_id):
    """Get a single blog post by ID (for editing)"""
    post = BlogPost.query.get_or_404(post_id)
    return jsonify(post.to_dict())

@blog_bp.route('/posts', methods=['POST'])
@admin_required
def create_blog_post(user):
    """Create a new blog post"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        current_app.logger.info(f"Creating blog post with data: {data.get('title', 'No title')} - Status: {data.get('status', 'No status')}")
        
        # Validate input data
        validation_errors = validate_blog_post(data)
        if validation_errors:
            current_app.logger.warning(f"Validation failed: {validation_errors}")
            return jsonify({'error': 'Validation failed', 'details': validation_errors}), 400
        
        # Use authenticated user ID
        author_id = request.current_user_id
        current_app.logger.info(f"Creating post for user ID: {author_id}")
    
    except Exception as e:
        current_app.logger.error(f"Error in create_blog_post setup: {str(e)}")
        return jsonify({'error': 'Invalid request data'}), 400
    
    try:
        # Sanitize inputs - allow markdown for content
        title = sanitize_input(data['title'])
        content = sanitize_input(data['content'], allow_markdown=True)
        excerpt = sanitize_input(data.get('excerpt', ''))
        meta_description = sanitize_input(data.get('meta_description', ''))
        category = sanitize_input(data.get('category', ''))
        tags = sanitize_input(data.get('tags', ''))
        featured_image = data.get('featured_image', '')
        
        # Validate URL if provided
        if featured_image and not re.match(r'^https?://', featured_image):
            return jsonify({'error': 'Featured image must be a valid URL'}), 400
        
        # Generate slug from title
        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower())
        slug = re.sub(r'\s+', '-', slug.strip())
        
        # Ensure slug is unique
        base_slug = slug
        counter = 1
        while BlogPost.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        post = BlogPost(
            title=title,
            slug=slug,
            content=content,
            excerpt=excerpt,
            author_id=author_id,
            meta_description=meta_description,
            featured_image=featured_image,
            status=data.get('status', 'draft'),
            category=category,
            tags=tags,
            published_at=datetime.now() if data.get('status') == 'published' else None
        )
        
        db.session.add(post)
        db.session.commit()
        
        current_app.logger.info(f"Successfully created blog post ID: {post.id}, Title: {post.title}, Status: {post.status}")
        return jsonify(post.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating blog post: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@blog_bp.route('/posts/<int:post_id>', methods=['PUT'])
@admin_required
def update_blog_post(user, post_id):
    """Update an existing blog post"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        current_app.logger.info(f"Updating blog post ID: {post_id} with status: {data.get('status', 'No status')}")
        
        post = BlogPost.query.get_or_404(post_id)
        
        # Update fields
        if 'title' in data:
            post.title = data['title']
            
            # Regenerate slug if title changed
            slug = re.sub(r'[^a-zA-Z0-9\s-]', '', data['title'].lower())
            slug = re.sub(r'\s+', '-', slug.strip())
            
            # Ensure slug is unique (excluding current post)
            base_slug = slug
            counter = 1
            while BlogPost.query.filter(BlogPost.slug == slug, BlogPost.id != post_id).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            post.slug = slug
        
        if 'content' in data:
            post.content = data['content']
        if 'excerpt' in data:
            post.excerpt = data['excerpt']
        if 'meta_description' in data:
            post.meta_description = data['meta_description']
        if 'featured_image' in data:
            post.featured_image = data['featured_image']
        if 'category' in data:
            post.category = data['category']
        if 'tags' in data:
            post.tags = data['tags']
        
        # Handle status change
        if 'status' in data:
            old_status = post.status
            post.status = data['status']
            
            # Set published_at when publishing for the first time
            if old_status != 'published' and data['status'] == 'published':
                post.published_at = datetime.now()
        
        db.session.commit()
        
        current_app.logger.info(f"Successfully updated blog post ID: {post.id}, Title: {post.title}, Status: {post.status}")
        return jsonify(post.to_dict())
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating blog post: {str(e)}")
        return jsonify({'error': f'Update error: {str(e)}'}), 400

@blog_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@admin_required
def delete_blog_post(user, post_id):
    """Delete a blog post"""
    try:
        post = BlogPost.query.get_or_404(post_id)
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'message': 'Post deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@blog_bp.route('/categories', methods=['GET'])
def get_blog_categories():
    """Get all blog categories"""
    categories = BlogCategory.query.order_by(BlogCategory.name).all()
    return jsonify([category.to_dict() for category in categories])

@blog_bp.route('/categories', methods=['POST'])
@admin_required
def create_blog_category(user):
    """Create a new blog category"""
    data = request.json
    
    try:
        # Generate slug from name
        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', data['name'].lower())
        slug = re.sub(r'\s+', '-', slug.strip())
        
        category = BlogCategory(
            name=data['name'],
            slug=slug,
            description=data.get('description', ''),
            color=data.get('color', '#3b82f6'),
            meta_description=data.get('meta_description', '')
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify(category.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@blog_bp.route('/categories/<int:category_id>', methods=['PUT'])
@admin_required
def update_blog_category(user, category_id):
    """Update an existing blog category"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        category = BlogCategory.query.get_or_404(category_id)
        
        # Update fields
        if 'name' in data:
            category.name = data['name']
            # Regenerate slug if name changed
            slug = re.sub(r'[^a-zA-Z0-9\s-]', '', data['name'].lower())
            slug = re.sub(r'\s+', '-', slug.strip())
            
            # Ensure slug is unique (excluding current category)
            base_slug = slug
            counter = 1
            while BlogCategory.query.filter(BlogCategory.slug == slug, BlogCategory.id != category_id).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            category.slug = slug
        
        if 'description' in data:
            category.description = data['description']
        if 'color' in data:
            category.color = data['color']
        if 'meta_description' in data:
            category.meta_description = data['meta_description']
        
        db.session.commit()
        
        return jsonify(category.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@blog_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@admin_required
def delete_blog_category(user, category_id):
    """Delete a blog category"""
    try:
        category = BlogCategory.query.get_or_404(category_id)
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'message': 'Category deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400