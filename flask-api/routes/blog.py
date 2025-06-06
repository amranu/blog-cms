"""
Blog CMS routes
"""
import re
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from utils.validation import sanitize_input, validate_blog_post
from utils.auth import token_required, admin_required
from __init__ import db
from models.user import User
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

# Comment routes
@blog_bp.route('/posts/<int:post_id>/comments', methods=['POST'])
def create_comment(post_id):
    """Create a new comment on a blog post"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['content', 'author_name', 'author_email']
        for field in required_fields:
            if not data.get(field, '').strip():
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['author_email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if post exists
        post = BlogPost.query.get_or_404(post_id)
        
        # Validate parent comment if replying
        parent_id = data.get('parent_id')
        if parent_id:
            parent_comment = BlogComment.query.get(parent_id)
            if not parent_comment or parent_comment.post_id != post_id:
                return jsonify({'error': 'Invalid parent comment'}), 400
        
        # Get client IP for spam prevention
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', ''))
        
        # Sanitize inputs
        content = sanitize_input(data['content'], allow_markdown=True)
        author_name = sanitize_input(data['author_name'])
        author_email = sanitize_input(data['author_email'])
        author_website = sanitize_input(data.get('author_website', ''))
        
        # Validate website URL if provided
        if author_website and not re.match(r'^https?://', author_website):
            author_website = 'http://' + author_website
        
        # Check if commenter is a verified user for auto-approval
        # First check if user is authenticated (logged in)
        authenticated_user = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            try:
                from utils.auth import verify_token
                token = auth_header.split(' ')[1]
                user_id = verify_token(token)
                if user_id:
                    authenticated_user = User.query.get(user_id)
            except:
                pass  # Invalid token, continue as anonymous user
        
        # Determine comment status based on authentication and verification
        if authenticated_user and authenticated_user.email_verified:
            # Authenticated and verified user - auto-approve
            comment_status = 'approved'
            verified_user = authenticated_user
        else:
            # Anonymous user or unverified - check by email for verification
            verified_user = User.query.filter_by(email=author_email, email_verified=True).first()
            comment_status = 'approved' if verified_user else 'pending'
        
        comment = BlogComment(
            post_id=post_id,
            content=content,
            author_name=author_name,
            author_email=author_email,
            author_website=author_website,
            parent_id=parent_id,
            status=comment_status,
            ip_address=client_ip
        )
        
        db.session.add(comment)
        db.session.commit()
        
        current_app.logger.info(f"New comment created for post {post_id} by {author_name} (status: {comment_status})")
        
        # Different messages based on approval status
        if verified_user:
            message = 'Comment posted successfully!'
        else:
            message = 'Comment submitted successfully and is pending approval'
        
        return jsonify({
            'message': message,
            'comment': comment.to_dict(),
            'auto_approved': bool(verified_user)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating comment: {str(e)}")
        return jsonify({'error': 'Failed to create comment'}), 500

@blog_bp.route('/comments/<int:comment_id>/approve', methods=['POST'])
@admin_required
def approve_comment(user, comment_id):
    """Approve a pending comment"""
    try:
        comment = BlogComment.query.get_or_404(comment_id)
        comment.status = 'approved'
        db.session.commit()
        
        current_app.logger.info(f"Comment {comment_id} approved by admin {user.username}")
        return jsonify({'message': 'Comment approved successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@blog_bp.route('/comments/<int:comment_id>/reject', methods=['POST'])
@admin_required
def reject_comment(user, comment_id):
    """Reject a comment"""
    try:
        comment = BlogComment.query.get_or_404(comment_id)
        comment.status = 'rejected'
        db.session.commit()
        
        current_app.logger.info(f"Comment {comment_id} rejected by admin {user.username}")
        return jsonify({'message': 'Comment rejected successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@blog_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@admin_required
def delete_comment(user, comment_id):
    """Delete a comment"""
    try:
        comment = BlogComment.query.get_or_404(comment_id)
        db.session.delete(comment)
        db.session.commit()
        
        current_app.logger.info(f"Comment {comment_id} deleted by admin {user.username}")
        return jsonify({'message': 'Comment deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@blog_bp.route('/comments/pending', methods=['GET'])
@admin_required
def get_pending_comments(user):
    """Get all pending comments for admin review"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        comments = BlogComment.query.filter_by(status='pending')\
            .order_by(BlogComment.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'comments': [comment.to_dict() for comment in comments.items],
            'total': comments.total,
            'pages': comments.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching pending comments: {str(e)}")
        return jsonify({'error': 'Failed to fetch comments'}), 500