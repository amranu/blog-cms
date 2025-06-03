import React, { useState, useEffect } from 'react';
import PageHeaders from '../components/PageHeaders';
import BlogEditor from '../components/BlogEditor';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, APP_CONFIG } from '../config/constants';
import { useAdminAnalytics } from '../hooks/useAnalytics';

function WritePostPage() {
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [publishedPost, setPublishedPost] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const adminAnalytics = useAdminAnalytics();

  useEffect(() => {
    // Check authentication
    const userItem = JSON.parse(localStorage.getItem('user'));
    if (!userItem) {
      navigate('/login');
      return;
    }

    const currentTime = new Date().getTime();
    if (currentTime >= userItem.expiry) {
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }

    // Check if user is admin
    if (!userItem.data.is_admin) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      alert('Access denied: Admin privileges required');
      navigate('/login');
      return;
    }

    setUser(userItem.data);
  }, [navigate]);

  const handlePostSave = async (postData) => {
    try {
      if (!user?.id) {
        console.error('User not authenticated');
        return { success: false, error: 'Please log in to continue' };
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        navigate('/login');
        return { success: false, error: 'Authentication required. Please log in again.' };
      }

      const response = await fetch(API_ENDPOINTS.BLOG_POSTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...postData,
          author_id: user.id
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return { success: false, error: 'Your session has expired. Please log in again.' };
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      const newPost = await response.json();
      
      // Track content creation
      adminAnalytics.trackContentCreation('blog_post', postData.title);
      
      // Show success feedback if post was published
      if (postData.status === 'published') {
        setPublishedPost(newPost);
        setShowSuccessFeedback(true);
        
        // Track publishing action
        adminAnalytics.trackAdminAction('post_published', {
          post_title: postData.title,
          post_slug: newPost.slug,
          post_category: postData.category
        });
        
        // Auto-hide success message after 8 seconds
        setTimeout(() => {
          setShowSuccessFeedback(false);
        }, 8000);
      } else {
        // Track draft saving
        adminAnalytics.trackAdminAction('post_saved_as_draft', {
          post_title: postData.title,
          post_category: postData.category
        });
        
        // For drafts, show brief success and redirect
        setTimeout(() => {
          navigate('/blog-management');
        }, 1000);
      }

      return { success: true, post: newPost };
    } catch (error) {
      console.error('Error creating post:', error);
      return { success: false, error: error.message };
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  const dismissSuccessMessage = () => {
    setShowSuccessFeedback(false);
  };

  const viewPublishedPost = () => {
    if (publishedPost?.slug) {
      window.open(`/blog/${publishedPost.slug}`, '_blank');
    }
  };

  if (!user) {
    return (
      <>
        <PageHeaders />
        <div className="main-content" style={{
          marginLeft: '250px',
          paddingTop: '85px',
          padding: '85px 20px 20px 20px',
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading editor...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeaders />
      
      {/* Success Feedback Overlay */}
      {showSuccessFeedback && publishedPost && (
        <>
          {/* Backdrop */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 999,
            backdropFilter: 'blur(2px)'
          }} onClick={dismissSuccessMessage} />
          
          {/* Success Message */}
          <div style={{
            position: 'fixed',
            top: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            maxWidth: '480px',
            width: '90%',
            border: '1px solid #e5e7eb',
            animation: 'successSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Header */}
            <div style={{
              background: APP_CONFIG.THEME.SUCCESS_COLOR,
              color: 'white',
              padding: '20px 25px',
              borderRadius: '16px 16px 0 0',
              position: 'relative'
            }}>
              <button
                onClick={dismissSuccessMessage}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.opacity = '0.8';
                }}
                title="Close"
              >
                ×
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  fontSize: '24px'
                }}>
                  🎉
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: '700', 
                    margin: '0 0 4px 0'
                  }}>
                    Successfully Published!
                  </h3>
                  <p style={{ 
                    fontSize: '14px',
                    margin: 0,
                    opacity: 0.9
                  }}>
                    Your article is now live
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '25px' }}>
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 8px 0'
                }}>
                  "{publishedPost.title}"
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: 0
                }}>
                  Your article is now visible to all readers and indexed by search engines.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={viewPublishedPost}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                >
                  <span style={{ marginRight: '8px' }}>👀</span>
                  View Post
                </button>
                <button
                  onClick={() => navigate('/blog-management')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 20px',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.borderColor = '#9ca3af';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                >
                  <span style={{ marginRight: '8px' }}>📝</span>
                  Manage Posts
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="main-content" style={{
        marginLeft: '250px',
        paddingTop: '85px',
        padding: '85px 30px 30px 30px',
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        {/* Header Section */}
        <div style={{
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#3b82f6',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px'
            }}>
              <span style={{ fontSize: '20px' }}>✍️</span>
            </div>
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: '#111827',
                margin: '0 0 4px 0'
              }}>
                Create New Article
              </h1>
              <p style={{ 
                color: '#6b7280',
                fontSize: '16px',
                margin: 0
              }}>
                Share your thoughts and ideas with your readers
              </p>
            </div>
          </div>
          
          {/* User Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#f3f4f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              {user.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 2px 0'
              }}>
                Writing as {user.username || 'Admin'}
              </p>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: 0
              }}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Editor Container */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <BlogEditor 
            onSave={handlePostSave}
            onCancel={handleCancel}
          />
        </div>

        {/* Footer Tips */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 12px 0'
          }}>
            💡 Writing Tips
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <div>
              <strong style={{ color: '#374151' }}>Engaging Titles:</strong> Use clear, descriptive titles that grab attention
            </div>
            <div>
              <strong style={{ color: '#374151' }}>Structure:</strong> Break content into sections with headings and bullet points
            </div>
            <div>
              <strong style={{ color: '#374151' }}>SEO:</strong> Add meta descriptions and relevant tags for better discoverability
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes successSlide {
          from {
            opacity: 0;
            transform: translate(-50%, -30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default WritePostPage;