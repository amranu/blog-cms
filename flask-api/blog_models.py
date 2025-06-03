from sqlalchemy import func
from datetime import datetime

def create_blog_models(db):
    """Create blog models with the provided database instance"""
    
    class BlogPost(db.Model):
        __tablename__ = 'blog_posts'
        id = db.Column(db.Integer, primary_key=True)
        title = db.Column(db.String(255), nullable=False)
        slug = db.Column(db.String(255), unique=True, nullable=False)
        content = db.Column(db.Text, nullable=False)
        excerpt = db.Column(db.Text)  # Short summary for listings
        
        # Author information
        author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
        
        # SEO and metadata
        meta_description = db.Column(db.Text)
        featured_image = db.Column(db.String(500))  # URL to featured image
        
        # Publishing control
        status = db.Column(db.String(20), default='draft')  # draft, published, archived
        published_at = db.Column(db.DateTime)
        
        # Categories and tags
        category = db.Column(db.String(100))
        tags = db.Column(db.Text)  # JSON array of tags
        
        # Analytics
        view_count = db.Column(db.Integer, default=0)
        
        # Timestamps
        created_at = db.Column(db.DateTime, default=func.now())
        updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())
        
        # Relationships
        author = db.relationship('User', backref='blog_posts')
        comments = db.relationship('BlogComment', backref='post', lazy=True, cascade='all, delete-orphan')
        
        def to_dict(self, include_content=True):
            data = {
                'id': self.id,
                'title': self.title,
                'slug': self.slug,
                'excerpt': self.excerpt,
                'author': self.author.username if self.author else 'Unknown',
                'author_id': self.author_id,
                'meta_description': self.meta_description,
                'featured_image': self.featured_image,
                'status': self.status,
                'published_at': self.published_at.isoformat() if self.published_at else None,
                'category': self.category,
                'tags': self.tags,
                'view_count': self.view_count,
                'created_at': self.created_at.isoformat(),
                'updated_at': self.updated_at.isoformat()
            }
            
            if include_content:
                data['content'] = self.content
                
            return data

    class BlogComment(db.Model):
        __tablename__ = 'blog_comments'
        id = db.Column(db.Integer, primary_key=True)
        post_id = db.Column(db.Integer, db.ForeignKey('blog_posts.id'), nullable=False)
        
        # Comment content
        content = db.Column(db.Text, nullable=False)
        author_name = db.Column(db.String(100), nullable=False)
        author_email = db.Column(db.String(255), nullable=False)
        author_website = db.Column(db.String(255))
        
        # Moderation
        status = db.Column(db.String(20), default='pending')  # pending, approved, spam, rejected
        ip_address = db.Column(db.String(45))  # Store IP for spam prevention
        
        # Threading support
        parent_id = db.Column(db.Integer, db.ForeignKey('blog_comments.id'))
        
        # Timestamps
        created_at = db.Column(db.DateTime, default=func.now())
        
        # Relationships
        replies = db.relationship('BlogComment', backref=db.backref('parent', remote_side=[id]))
        
        def to_dict(self):
            return {
                'id': self.id,
                'post_id': self.post_id,
                'content': self.content,
                'author_name': self.author_name,
                'author_email': self.author_email,
                'author_website': self.author_website,
                'status': self.status,
                'parent_id': self.parent_id,
                'created_at': self.created_at.isoformat(),
                'replies': [reply.to_dict() for reply in self.replies if reply.status == 'approved']
            }

    class BlogCategory(db.Model):
        __tablename__ = 'blog_categories'
        id = db.Column(db.Integer, primary_key=True)
        name = db.Column(db.String(100), unique=True, nullable=False)
        slug = db.Column(db.String(100), unique=True, nullable=False)
        description = db.Column(db.Text)
        color = db.Column(db.String(7), default='#3b82f6')  # Hex color
        
        # SEO
        meta_description = db.Column(db.Text)
        
        # Timestamps
        created_at = db.Column(db.DateTime, default=func.now())
        
        def to_dict(self):
            return {
                'id': self.id,
                'name': self.name,
                'slug': self.slug,
                'description': self.description,
                'color': self.color,
                'meta_description': self.meta_description,
                'created_at': self.created_at.isoformat()
            }
    
    return {
        'BlogPost': BlogPost,
        'BlogComment': BlogComment,
        'BlogCategory': BlogCategory
    }