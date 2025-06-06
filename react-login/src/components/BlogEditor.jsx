import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/constants';
import LaTeXRenderer from './LaTeXRenderer';

const BlogEditor = ({ post = null, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    meta_description: '',
    featured_image: '',
    category: '',
    tags: '',
    status: 'draft'
  });

  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showSEOPanel, setShowSEOPanel] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [estimatedReadTime, setEstimatedReadTime] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [contentTextarea, setContentTextarea] = useState(null);

  useEffect(() => {
    fetchCategories();
    
    // If editing an existing post, populate the form
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        meta_description: post.meta_description || '',
        featured_image: post.featured_image || '',
        category: post.category || '',
        tags: post.tags || '',
        status: post.status || 'draft'
      });
    }
  }, [post]);

  useEffect(() => {
    // Calculate word count and reading time
    const words = formData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    setEstimatedReadTime(Math.ceil(words / 200)); // 200 words per minute average
  }, [formData.content]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.BLOG_CATEGORIES);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError('');
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving post:', error);
      setServerError(error.message || 'Failed to save post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndPublish = async () => {
    console.log('Publish button clicked');
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setIsSubmitting(true);
    setServerError('');
    
    try {
      const publishData = { ...formData, status: 'published' };
      console.log('Publishing post with data:', publishData);
      await onSave(publishData);
      console.log('Post published successfully');
    } catch (error) {
      console.error('Error publishing post:', error);
      setServerError(error.message || 'Failed to publish post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSave = () => {
    if (formData.title || formData.content) {
      localStorage.setItem('blog_draft', JSON.stringify(formData));
    }
  };

  const handleImageUpload = async (file) => {
    setIsUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.UPLOAD_IMAGE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      return data.image_url;
      
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const insertImageAtCursor = (imageUrl) => {
    if (!contentTextarea) return;
    
    const start = contentTextarea.selectionStart;
    const end = contentTextarea.selectionEnd;
    const currentContent = formData.content;
    const imageMarkdown = `\n![Image](${imageUrl})\n`;
    
    const newContent = currentContent.substring(0, start) + imageMarkdown + currentContent.substring(end);
    
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (contentTextarea) {
        contentTextarea.focus();
        const newCursorPos = start + imageMarkdown.length;
        contentTextarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleImageButtonClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setServerError('Image file size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setServerError('Please select a valid image file');
        return;
      }
      
      try {
        const imageUrl = await handleImageUpload(file);
        insertImageAtCursor(imageUrl);
      } catch (error) {
        setServerError(error.message || 'Failed to upload image');
      }
    };
    
    input.click();
  };

  useEffect(() => {
    const interval = setInterval(handleAutoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [formData]);

  const renderPreview = () => {
    return (
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{formData.title || 'Untitled Post'}</h1>
        {formData.excerpt && (
          <p className="text-xl text-gray-600 italic mb-8 border-l-4 border-blue-500 pl-4">
            {formData.excerpt}
          </p>
        )}
        <div className="leading-relaxed text-gray-800">
          {formData.content ? (
            <LaTeXRenderer content={formData.content} />
          ) : (
            'Start writing your content...'
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: 'transparent', minHeight: 'auto' }}>
      {/* Top Navigation Bar */}
      <div style={{
        position: 'sticky',
        top: '0px',
        zIndex: 40,
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #475569',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        borderRadius: '12px 12px 0 0',
        marginBottom: '0'
      }}>
        <div style={{ margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', minWidth: 0 }}>
            {/* Left side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
              <button
                onClick={onCancel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#334155';
                  e.target.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#1e293b';
                  e.target.style.borderColor = '#475569';
                }}
              >
                <span style={{ marginRight: '8px' }}>⬅️</span>
                Back
              </button>
              <div style={{ height: '24px', width: '1px', backgroundColor: '#475569' }}></div>
              <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {post ? 'Edit Post' : 'New Post'}
              </h1>
            </div>

            {/* Center - Status and Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px', color: '#6b7280', flex: 1, justifyContent: 'center', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: formData.status === 'published' ? '#10b981' : 
                                   formData.status === 'draft' ? '#eab308' : '#6b7280'
                }}></div>
                <span style={{ textTransform: 'capitalize' }}>{formData.status}</span>
              </div>
              {wordCount > 0 && window.innerWidth > 768 && (
                <>
                  <span>{wordCount} words</span>
                  <span>{estimatedReadTime} min read</span>
                </>
              )}
              <span style={{ color: '#059669' }}>Auto-saved</span>
            </div>

            {/* Right side - Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: showPreview ? '#1e40af' : '#374151',
                  backgroundColor: showPreview ? '#334155' : '#1e293b',
                  border: showPreview ? '1px solid #64748b' : '1px solid #475569',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!showPreview) {
                    e.target.style.backgroundColor = '#334155';
                    e.target.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showPreview) {
                    e.target.style.backgroundColor = '#1e293b';
                    e.target.style.borderColor = '#475569';
                  }
                }}
              >
                <span style={{ marginRight: '8px' }}>👀</span>
                Preview
              </button>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isSubmitting ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = '#334155';
                    e.target.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = '#1e293b';
                    e.target.style.borderColor = '#475569';
                  }
                }}
              >
                <span style={{ marginRight: '8px' }}>{isSubmitting ? '⏳' : '💾'}</span>
                {isSubmitting ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                onClick={handleSaveAndPublish}
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isSubmitting ? 0.5 : 1,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = '#2563eb';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = '#3b82f6';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <span style={{ marginRight: '8px' }}>{isSubmitting ? '🚀' : '✨'}</span>
                {isSubmitting ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {serverError && (
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#dc2626',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <span>❌</span>
            {serverError}
          </div>
          <button
            onClick={() => setServerError('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto',
        backgroundColor: '#1e293b',
        borderRadius: '0 0 12px 12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e5e7eb',
        borderTop: 'none'
      }}>
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 85px)' }}>
          {/* Main Editor Area */}
          <div style={{ 
            flex: 1, 
            maxWidth: showPreview ? 'calc(50% - 160px)' : 'calc(100% - 320px)',
            display: showPreview ? 'block' : 'block'
          }}>
            <div style={{ padding: '32px', paddingTop: '40px', height: '100%' }}>
              {/* Title Input */}
              <div style={{ marginBottom: '32px' }}>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    fontSize: '32px',
                    fontWeight: '700',
                    color: errors.title ? '#dc2626' : '#111827',
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: '1.2',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}
                  placeholder="Post title..."
                  onFocus={(e) => {
                    e.target.style.backgroundColor = '#334155';
                    e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.title && (
                  <p style={{ 
                    marginTop: '8px', 
                    fontSize: '14px', 
                    color: '#dc2626', 
                    display: 'flex', 
                    alignItems: 'center' 
                  }}>
                    <svg style={{ width: '16px', height: '16px', marginRight: '4px' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Server Error Display */}
              {serverError && (
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚠️</span>
                  <span>{serverError}</span>
                  <button
                    onClick={() => setServerError('')}
                    style={{
                      marginLeft: 'auto',
                      padding: '4px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ❌
                  </button>
                </div>
              )}

              {/* Editor Toolbar */}
              <div style={{
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: '#334155',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid #475569'
              }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase' }}>
                  Formatting Tools:
                </div>
                
                <button
                  onClick={handleImageButtonClick}
                  disabled={isUploadingImage}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: isUploadingImage ? '#6b7280' : '#f1f5f9',
                    backgroundColor: isUploadingImage ? '#1e293b' : '#475569',
                    border: '1px solid #64748b',
                    borderRadius: '6px',
                    cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isUploadingImage ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isUploadingImage) {
                      e.target.style.backgroundColor = '#64748b';
                      e.target.style.borderColor = '#94a3b8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isUploadingImage) {
                      e.target.style.backgroundColor = '#475569';
                      e.target.style.borderColor = '#64748b';
                    }
                  }}
                >
                  <span>{isUploadingImage ? '⏳' : '📷'}</span>
                  {isUploadingImage ? 'Uploading...' : 'Insert Image'}
                </button>
                
                <div style={{ 
                  height: '16px', 
                  width: '1px', 
                  backgroundColor: '#64748b',
                  margin: '0 4px'
                }}></div>
                
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  💡 Tip: Use ![alt](url) for images, **bold**, *italic*, and LaTeX math: $equation$
                </div>
              </div>

              {/* Content Textarea */}
              <div style={{ marginBottom: '32px' }}>
                <textarea
                  ref={(ref) => setContentTextarea(ref)}
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    height: '600px',
                    minHeight: '600px',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: errors.content ? '#dc2626' : '#111827',
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    padding: '16px',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Start writing your story..."
                  onFocus={(e) => {
                    e.target.style.backgroundColor = '#334155';
                    e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.content && (
                  <p style={{ 
                    marginTop: '8px', 
                    fontSize: '14px', 
                    color: '#dc2626', 
                    display: 'flex', 
                    alignItems: 'center' 
                  }}>
                    <svg style={{ width: '16px', height: '16px', marginRight: '4px' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.content}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div style={{ 
              flex: 1, 
              borderLeft: '1px solid #e5e7eb', 
              backgroundColor: '#1e293b',
              height: 'calc(100vh - 85px)',
              overflowY: 'auto'
            }}>
              <div style={{ padding: '32px', paddingTop: '40px' }}>
                <div style={{ marginBottom: '16px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>PREVIEW</div>
                {renderPreview()}
              </div>
            </div>
          )}

          {/* Right Sidebar */}
          <div style={{ 
            width: '320px', 
            backgroundColor: '#1e293b', 
            borderLeft: '1px solid #e5e7eb',
            flexShrink: 0,
            height: 'calc(100vh - 85px)',
            overflowY: 'auto'
          }}>
            <div style={{ padding: '24px', height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Publish Settings */}
                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                    Publish Settings
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#1e293b',
                          color: '#374151',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#475569';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: 'var(--background-card)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--primary-color)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-color)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="">Select category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Tags
                      </label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#1e293b',
                          color: '#374151',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        placeholder="tech, web, tutorial"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#475569';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>Separate with commas</p>
                    </div>
                  </div>
                </div>

                {/* Featured Image */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                    Featured Image
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="url"
                      name="featured_image"
                      value={formData.featured_image}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: '#1e293b',
                        color: '#374151',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      placeholder="https://example.com/image.jpg"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#475569';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {formData.featured_image && (
                      <div className="relative">
                        <img
                          src={formData.featured_image}
                          alt="Featured"
                          className="w-full h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            padding: '4px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#dc2626';
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#ef4444';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          ❌
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                    Excerpt
                  </h3>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#1e293b',
                      color: '#374151',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Brief summary for listings..."
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#475569';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* SEO Settings */}
                <div>
                  <button
                    onClick={() => setShowSEOPanel(!showSEOPanel)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#111827',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '16px',
                      padding: '8px 12px',
                      backgroundColor: '#334155',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6';
                      e.target.style.color = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#334155';
                      e.target.style.color = '#111827';
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>🎯</span>
                      SEO Settings
                    </span>
                    <span style={{ 
                      transform: showSEOPanel ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>⬇️</span>
                  </button>
                  {showSEOPanel && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Description
                        </label>
                        <textarea
                          name="meta_description"
                          value={formData.meta_description}
                          onChange={handleInputChange}
                          rows={2}
                          maxLength={160}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: '#1e293b',
                            color: '#374151',
                            outline: 'none',
                            resize: 'vertical',
                            transition: 'all 0.2s',
                            fontFamily: 'inherit'
                          }}
                          placeholder="SEO description..."
                          onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6';
                            e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#475569';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {formData.meta_description.length}/160 characters
                        </p>
                      </div>
                    </div>
                  )}
                </div>


                {/* Post Stats */}
                {(wordCount > 0 || post) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                      Post Statistics
                    </h3>
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Words:</span>
                        <span className="font-medium">{wordCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reading time:</span>
                        <span className="font-medium">{estimatedReadTime} min</span>
                      </div>
                      {post && (
                        <div className="flex justify-between">
                          <span>Views:</span>
                          <span className="font-medium">{post.view_count || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;