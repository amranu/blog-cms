"""
Legacy posts routes
"""
from flask import Blueprint, request, jsonify, abort
from models.post import Post
from utils.auth import admin_required
from __init__ import db

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/posts', methods=['GET'])
def get_posts():
    posts = Post.query.all()
    return jsonify([post.to_dict() for post in posts]), 200

@posts_bp.route('/posts', methods=['POST'])
@admin_required
def create_post(user):
    if not request.json or 'title' not in request.json or 'content' not in request.json or 'publisher_id' not in request.json:
        abort(400)
    data = request.json
    new_post = Post(title=data['title'], content=data['content'], publisher_id=data['publisher_id'])
    try:
        db.session.add(new_post)
        db.session.commit()
        return jsonify({"created": True, "post": {"id": new_post.id, "title": new_post.title}}), 201
    except Exception as e:
        return jsonify({"created": False, "error": str(e)}), 500

@posts_bp.route('/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    post = Post.query.get_or_404(post_id)
    return jsonify(post.to_dict()), 200

@posts_bp.route('/posts/<int:post_id>', methods=['PUT'])
@admin_required
def update_post(user, post_id):
    post = Post.query.get_or_404(post_id)
    data = request.json
    post.title = data.get('title', post.title)
    post.content = data.get('content', post.content)
    db.session.commit()
    return jsonify(post.to_dict()), 200

@posts_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@admin_required
def delete_post(user, post_id):
    post = Post.query.get_or_404(post_id)
    db.session.delete(post)
    db.session.commit()
    return jsonify({"deleted": True}), 200