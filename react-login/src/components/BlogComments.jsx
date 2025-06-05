import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/constants';
import LaTeXRenderer from './LaTeXRenderer';

// Separate CommentForm component to prevent focus issues
const CommentForm = ({ 
  formData, 
  onInputChange, 
  onSubmit, 
  isSubmitting, 
  submitMessage, 
  onCancel, 
  replyingTo 
}) => (
  <form onSubmit={onSubmit} style={{ marginBottom: '32px' }}>
    <div style={{
      padding: '24px',
      backgroundColor: 'var(--blog-bg-secondary)',
      borderRadius: '8px',
      border: '1px solid var(--blog-border-primary)'
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        marginBottom: '16px',
        color: 'var(--blog-text-primary)'
      }}>
        {replyingTo ? 'Reply to Comment' : 'Leave a Comment'}
      </h3>
      
      {submitMessage && (
        <div style={{
          padding: '12px',
          backgroundColor: submitMessage.includes('error') ? '#fee2e2' : '#d1fae5',
          border: '1px solid ' + (submitMessage.includes('error') ? '#fca5a5' : '#86efac'),
          borderRadius: '6px',
          marginBottom: '16px',
          color: submitMessage.includes('error') ? '#dc2626' : '#059669',
          fontSize: '14px'
        }}>
          {submitMessage}
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontSize: '14px', 
            fontWeight: '500',
            color: 'var(--blog-text-primary)'
          }}>
            Name *
          </label>
          <input
            type="text"
            name="author_name"
            value={formData.author_name}
            onChange={onInputChange}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--blog-border-primary)',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'var(--blog-bg-primary)',
              color: 'var(--blog-text-primary)',
              outline: 'none'
            }}
          />
        </div>
        
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontSize: '14px', 
            fontWeight: '500',
            color: 'var(--blog-text-primary)'
          }}>
            Email *
          </label>
          <input
            type="email"
            name="author_email"
            value={formData.author_email}
            onChange={onInputChange}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--blog-border-primary)',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'var(--blog-bg-primary)',
              color: 'var(--blog-text-primary)',
              outline: 'none'
            }}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '6px', 
          fontSize: '14px', 
          fontWeight: '500',
          color: 'var(--blog-text-primary)'
        }}>
          Website (optional)
        </label>
        <input
          type="url"
          name="author_website"
          value={formData.author_website}
          onChange={onInputChange}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--blog-border-primary)',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'var(--blog-bg-primary)',
            color: 'var(--blog-text-primary)',
            outline: 'none'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '6px', 
          fontSize: '14px', 
          fontWeight: '500',
          color: 'var(--blog-text-primary)'
        }}>
          Comment *
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={onInputChange}
          required
          rows="4"
          placeholder="Write your comment here... (Markdown and LaTeX supported)"
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid var(--blog-border-primary)',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'var(--blog-bg-primary)',
            color: 'var(--blog-text-primary)',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
      </div>
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--blog-accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            transition: 'all 0.2s'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Comment'}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: 'var(--blog-text-secondary)',
            border: '1px solid var(--blog-border-primary)',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Cancel
        </button>
      </div>
      
      <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--blog-text-secondary)' }}>
        <p>Comments are moderated and will appear after approval. Your email will not be published.</p>
      </div>
    </div>
  </form>
);

const BlogComments = ({ post, comments: initialComments, onCommentsUpdate }) => {
  const [comments, setComments] = useState(initialComments || []);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [formData, setFormData] = useState({
    content: '',
    author_name: '',
    author_email: '',
    author_website: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim() || !formData.author_name.trim() || !formData.author_email.trim()) {
      setSubmitMessage('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const commentData = {
        ...formData,
        parent_id: replyingTo
      };

      const response = await fetch(API_ENDPOINTS.BLOG_COMMENTS(post.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData)
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage('Comment submitted successfully! It will appear after approval.');
        setFormData({
          content: '',
          author_name: '',
          author_email: '',
          author_website: ''
        });
        if (onCommentsUpdate) {
          onCommentsUpdate();
        }
        // Auto-hide form after successful submission
        setTimeout(() => {
          setShowCommentForm(false);
          setReplyingTo(null);
          setSubmitMessage('');
        }, 2000);
      } else {
        setSubmitMessage(`Error: ${result.error || 'Failed to submit comment'}`);
      }
    } catch (error) {
      setSubmitMessage('Error submitting comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId) => {
    setReplyingTo(commentId);
    setShowCommentForm(true);
    setSubmitMessage('');
  };

  const handleCancelComment = () => {
    setShowCommentForm(false);
    setReplyingTo(null);
    setSubmitMessage('');
    setFormData({
      content: '',
      author_name: '',
      author_email: '',
      author_website: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderComment = (comment, isReply = false) => (
    <div 
      key={comment.id} 
      style={{
        marginLeft: isReply ? '40px' : '0',
        marginBottom: '24px',
        padding: '20px',
        backgroundColor: 'var(--blog-bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--blog-border-primary)'
      }}
    >
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: '600', fontSize: '16px', color: 'var(--blog-text-primary)' }}>
            {comment.author_website ? (
              <a 
                href={comment.author_website} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'var(--blog-accent-primary)', textDecoration: 'none' }}
              >
                {comment.author_name}
              </a>
            ) : (
              comment.author_name
            )}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--blog-text-secondary)' }}>
            {formatDate(comment.created_at)}
          </div>
        </div>
        
        {!isReply && (
          <button
            onClick={() => handleReply(comment.id)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              color: 'var(--blog-accent-primary)',
              backgroundColor: 'transparent',
              border: '1px solid var(--blog-accent-primary)',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--blog-accent-primary)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = 'var(--blog-accent-primary)';
            }}
          >
            Reply
          </button>
        )}
      </div>
      
      <div style={{ color: 'var(--blog-text-primary)', lineHeight: '1.6' }}>
        <LaTeXRenderer 
          content={comment.content} 
          style={{ 
            color: 'var(--blog-text-primary)',
            fontSize: 'inherit',
            lineHeight: 'inherit'
          }}
        />
      </div>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ marginTop: '48px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '32px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--blog-border-primary)'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700',
          color: 'var(--blog-text-primary)',
          margin: 0
        }}>
          Comments ({comments.length})
        </h2>
        
        {!showCommentForm && (
          <button
            onClick={() => setShowCommentForm(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--blog-accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Add Comment
          </button>
        )}
      </div>
      
      {showCommentForm && (
        <CommentForm 
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleSubmitComment}
          isSubmitting={isSubmitting}
          submitMessage={submitMessage}
          onCancel={handleCancelComment}
          replyingTo={replyingTo}
        />
      )}
      
      {comments.length > 0 ? (
        <div>
          {comments.map(comment => renderComment(comment))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '48px 20px',
          color: 'var(--blog-text-secondary)'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No comments yet.</p>
          <p style={{ fontSize: '14px' }}>Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
};

export default BlogComments;