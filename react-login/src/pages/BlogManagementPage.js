import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeaders from '../components/PageHeaders';
import BlogEditor from '../components/BlogEditor';
import { API_ENDPOINTS, APP_CONFIG, MESSAGES } from '../config/constants';

const BlogManagementPage = () => {
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'edit'
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [filters, setFilters] = useState({
        status: 'all',
        category: '',
        author_id: ''
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
        pages: 0
    });

    useEffect(() => {
        checkAuth();
        fetchPosts();
        fetchCategories();
    }, [filters, pagination.current_page]);

    const checkAuth = () => {
        const userItem = localStorage.getItem('user');
        if (!userItem) {
            navigate('/login');
            return;
        }

        const currentUser = JSON.parse(userItem);
        if (!currentUser.data || !currentUser.data.id) {
            navigate('/login');
            return;
        }

        // Check if user is admin
        if (!currentUser.data.is_admin) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            alert('Access denied: Admin privileges required');
            navigate('/login');
            return;
        }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.current_page,
                per_page: pagination.per_page,
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.category && { category: filters.category }),
                ...(filters.author_id && { author_id: filters.author_id })
            });

            const response = await fetch(`${API_ENDPOINTS.BLOG_POSTS}?${queryParams}`);
            if (response.ok) {
                const data = await response.json();
                setPosts(data.posts);
                setPagination(prev => ({
                    ...prev,
                    total: data.total,
                    pages: data.pages
                }));
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleSavePost = async (postData) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                const errorMsg = 'Authentication required. Please log in again.';
                alert(errorMsg);
                navigate('/login');
                throw new Error(errorMsg);
            }
            
            console.log('Saving post data:', {
                title: postData.title,
                status: postData.status,
                content_length: postData.content?.length || 0
            });
            
            let response;

            if (editingPost) {
                // Update existing post
                console.log('Updating existing post ID:', editingPost.id);
                response = await fetch(API_ENDPOINTS.BLOG_POST_BY_ID(editingPost.id), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(postData)
                });
            } else {
                // Create new post
                console.log('Creating new post');
                response = await fetch(API_ENDPOINTS.BLOG_POSTS, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(postData)
                });
            }

            console.log('API Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Post saved successfully:', result);
                alert(editingPost ? MESSAGES.SUCCESS.POST_UPDATED : MESSAGES.SUCCESS.POST_CREATED);
                setActiveView('list');
                setEditingPost(null);
                fetchPosts();
            } else if (response.status === 401) {
                const errorMsg = 'Your session has expired. Please log in again.';
                alert(errorMsg);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                throw new Error(errorMsg);
            } else {
                const errorData = await response.json();
                console.error('API Error response:', errorData);
                const errorMsg = errorData.error || errorData.details || 'Failed to save post';
                alert(errorMsg);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Error saving post:', error);
            if (!error.message.includes('Authentication required') && !error.message.includes('session has expired')) {
                alert('Network error. Please try again.');
            }
            throw error; // Re-throw so BlogEditor can handle it
        }
    };

    const handleArchivePost = async (postId) => {
        if (!window.confirm('Are you sure you want to archive this post? It will be removed from the public blog but kept in storage.')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Authentication required. Please log in again.');
                navigate('/login');
                return;
            }

            const response = await fetch(API_ENDPOINTS.BLOG_POST_BY_ID(postId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'archived' })
            });

            if (response.ok) {
                alert('Post archived successfully!');
                fetchPosts();
            } else if (response.status === 401) {
                alert('Your session has expired. Please log in again.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to archive post');
            }
        } catch (error) {
            console.error('Error archiving post:', error);
            alert('Network error. Please try again.');
        }
    };

    const handleUnarchivePost = async (postId) => {
        if (!window.confirm('Are you sure you want to unarchive this post? It will be restored to published status.')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Authentication required. Please log in again.');
                navigate('/login');
                return;
            }

            const response = await fetch(API_ENDPOINTS.BLOG_POST_BY_ID(postId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'published' })
            });

            if (response.ok) {
                alert('Post unarchived and published successfully!');
                fetchPosts();
            } else if (response.status === 401) {
                alert('Your session has expired. Please log in again.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to unarchive post');
            }
        } catch (error) {
            console.error('Error unarchiving post:', error);
            alert('Network error. Please try again.');
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Authentication required. Please log in again.');
                navigate('/login');
                return;
            }

            const response = await fetch(API_ENDPOINTS.BLOG_POST_BY_ID(postId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert(MESSAGES.SUCCESS.POST_DELETED);
                fetchPosts();
            } else if (response.status === 401) {
                alert('Your session has expired. Please log in again.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Network error. Please try again.');
        }
    };

    const handleEditPost = async (post) => {
        try {
            // Fetch the full post data including content
            const response = await fetch(API_ENDPOINTS.BLOG_POST_BY_ID(post.id));
            if (response.ok) {
                const fullPost = await response.json();
                setEditingPost(fullPost);
                setActiveView('edit');
            } else {
                console.error('Failed to fetch full post data');
                // Fallback to the post data we have
                setEditingPost(post);
                setActiveView('edit');
            }
        } catch (error) {
            console.error('Error fetching full post data:', error);
            // Fallback to the post data we have
            setEditingPost(post);
            setActiveView('edit');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { emoji: '✏️', bg: '#334155', color: '#fbbf24', border: '#475569' },
            published: { emoji: '✅', bg: '#334155', color: '#22c55e', border: '#475569' },
            archived: { emoji: '📦', bg: '#334155', color: '#f87171', border: '#475569' }
        };
        
        const config = statusConfig[status] || statusConfig.draft;
        
        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                backgroundColor: config.bg,
                color: config.color,
                border: `1px solid ${config.border}`,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
            }}>
                <span>{config.emoji}</span>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (activeView === 'create') {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
                <PageHeaders />
                <div style={{
                    marginLeft: '250px',
                    paddingTop: '85px',
                    padding: '85px 30px 30px 30px'
                }}>
                    <BlogEditor
                        onSave={handleSavePost}
                        onCancel={() => setActiveView('list')}
                    />
                </div>
            </div>
        );
    }

    if (activeView === 'edit') {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
                <PageHeaders />
                <div style={{
                    marginLeft: '250px',
                    paddingTop: '85px',
                    padding: '85px 30px 30px 30px'
                }}>
                    <BlogEditor
                        post={editingPost}
                        onSave={handleSavePost}
                        onCancel={() => {
                            setActiveView('list');
                            setEditingPost(null);
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
            <PageHeaders />
            <div style={{
                marginLeft: '250px',
                paddingTop: '85px',
                padding: '85px 30px 30px 30px'
            }}>
                {/* Header Section */}
                <div style={{
                    marginBottom: '32px',
                    paddingBottom: '24px',
                    borderBottom: '1px solid #475569'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
                            }}>
                                📝
                            </div>
                            <div>
                                <h1 style={{
                                    fontSize: '28px',
                                    fontWeight: '700',
                                    color: '#f1f5f9',
                                    margin: '0 0 4px 0'
                                }}>
                                    Blog Management
                                </h1>
                                <p style={{
                                    color: '#6b7280',
                                    fontSize: '16px',
                                    margin: 0
                                }}>
                                    Create and manage your blog posts
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveView('create')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#2563eb';
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#3b82f6';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            <span>✍️</span>
                            Create New Post
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #475569',
                    padding: '24px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#334155',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px'
                        }}>
                            🔍
                        </div>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#f1f5f9',
                            margin: 0
                        }}>
                            Filter Posts
                        </h3>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        alignItems: 'end'
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#cbd5e1',
                                marginBottom: '8px'
                            }}>
                                📊 Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: '1px solid #475569',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    backgroundColor: '#1e293b',
                                    color: '#cbd5e1',
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
                                <option value="all">All Statuses</option>
                                <option value="draft">✏️ Draft</option>
                                <option value="published">✅ Published</option>
                                <option value="archived">📦 Archived</option>
                            </select>
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#cbd5e1',
                                marginBottom: '8px'
                            }}>
                                🏷️ Category
                            </label>
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: '1px solid #475569',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    backgroundColor: '#1e293b',
                                    color: '#cbd5e1',
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
                                <option value="">All Categories</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.name}>
                                        📂 {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <button
                                onClick={() => setFilters({ status: 'all', category: '', author_id: '' })}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '10px 16px',
                                    backgroundColor: '#334155',
                                    color: '#cbd5e1',
                                    border: '1px solid #475569',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#475569';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#334155';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <span>🧹</span>
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Posts List */}
                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #475569',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '24px',
                        borderBottom: '1px solid #475569',
                        background: APP_CONFIG.THEME.BACKGROUND_LIGHT
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                color: 'white'
                            }}>
                                📄
                            </div>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#f1f5f9',
                                margin: 0
                            }}>
                                Blog Posts ({pagination.total})
                            </h3>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{
                            padding: '60px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: '4px solid #475569',
                                borderTop: '4px solid #3b82f6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                            <span style={{
                                color: '#6b7280',
                                fontSize: '16px',
                                fontWeight: '500'
                            }}>Loading posts...</span>
                        </div>
                    ) : posts.length > 0 ? (
                        <div>
                            {posts.map(post => (
                                <div 
                                    key={post.id} 
                                    style={{
                                        padding: '24px',
                                        borderBottom: '1px solid #475569',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#334155';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                marginBottom: '12px'
                                            }}>
                                                <h3 style={{
                                                    fontSize: '18px',
                                                    fontWeight: '600',
                                                    color: '#f1f5f9',
                                                    margin: 0
                                                }}>
                                                    {post.title}
                                                </h3>
                                                {getStatusBadge(post.status)}
                                            </div>
                                            
                                            {post.excerpt && (
                                                <p style={{
                                                    color: '#6b7280',
                                                    marginBottom: '12px',
                                                    lineHeight: '1.5',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}>
                                                    {post.excerpt}
                                                </p>
                                            )}
                                            
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                fontSize: '13px',
                                                color: '#9ca3af',
                                                flexWrap: 'wrap'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span>👤</span>
                                                    <span>By {post.author}</span>
                                                </div>
                                                <span style={{ color: '#475569' }}>•</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span>📅</span>
                                                    <span>{formatDate(post.created_at)}</span>
                                                </div>
                                                {post.published_at && (
                                                    <>
                                                        <span style={{ color: '#475569' }}>•</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span>🚀</span>
                                                            <span>Published {formatDate(post.published_at)}</span>
                                                        </div>
                                                    </>
                                                )}
                                                {post.category && (
                                                    <>
                                                        <span style={{ color: '#475569' }}>•</span>
                                                        <span style={{
                                                            backgroundColor: '#334155',
                                                            color: '#60a5fa',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: '500',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}>
                                                            <span>🏷️</span>
                                                            {post.category}
                                                        </span>
                                                    </>
                                                )}
                                                <span style={{ color: '#475569' }}>•</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span>👁️</span>
                                                    <span>{post.view_count || 0} views</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                                            <button
                                                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '8px 16px',
                                                    backgroundColor: '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = '#059669';
                                                    e.target.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = '#10b981';
                                                    e.target.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <span>👁️</span>
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEditPost(post)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '8px 16px',
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = '#2563eb';
                                                    e.target.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = '#3b82f6';
                                                    e.target.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <span>✏️</span>
                                                Edit
                                            </button>
                                            {post.status !== 'archived' && (
                                                <button
                                                    onClick={() => handleArchivePost(post.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '8px 16px',
                                                        backgroundColor: '#f59e0b',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.backgroundColor = '#d97706';
                                                        e.target.style.transform = 'translateY(-1px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.backgroundColor = '#f59e0b';
                                                        e.target.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <span>📦</span>
                                                    Archive
                                                </button>
                                            )}
                                            {post.status === 'archived' && (
                                                <button
                                                    onClick={() => handleUnarchivePost(post.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '8px 16px',
                                                        backgroundColor: '#059669',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.backgroundColor = '#047857';
                                                        e.target.style.transform = 'translateY(-1px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.backgroundColor = '#059669';
                                                        e.target.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <span>📤</span>
                                                    Unarchive
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeletePost(post.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '8px 16px',
                                                    backgroundColor: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = '#dc2626';
                                                    e.target.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = '#ef4444';
                                                    e.target.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <span>🗑️</span>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            padding: '60px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: '80px',
                                marginBottom: '24px',
                                filter: 'grayscale(1)',
                                opacity: 0.6
                            }}>📝</div>
                            <h4 style={{
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#f1f5f9',
                                marginBottom: '12px'
                            }}>No blog posts found</h4>
                            <p style={{
                                color: '#6b7280',
                                marginBottom: '32px',
                                fontSize: '16px',
                                lineHeight: '1.5'
                            }}>
                                {filters.status !== 'all' || filters.category 
                                    ? '🔍 No posts match your current filters. Try adjusting your search criteria.'
                                    : '✨ You haven\'t created any blog posts yet. Start writing your first post!'}
                            </p>
                            <button
                                onClick={() => setActiveView('create')}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#2563eb';
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#3b82f6';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                }}
                            >
                                <span>✍️</span>
                                Create Your First Post
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div style={{
                            padding: '20px 24px',
                            borderTop: '1px solid #475569',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#334155'
                        }}>
                            <div style={{
                                fontSize: '14px',
                                color: '#6b7280',
                                fontWeight: '500'
                            }}>
                                📊 Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                                {pagination.total} posts
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                                    disabled={pagination.current_page === 1}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
                                        backgroundColor: '#1e293b',
                                        color: pagination.current_page === 1 ? '#9ca3af' : '#374151',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: pagination.current_page === 1 ? 'not-allowed' : 'pointer',
                                        opacity: pagination.current_page === 1 ? 0.5 : 1,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (pagination.current_page !== 1) {
                                            e.target.style.backgroundColor = '#334155';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (pagination.current_page !== 1) {
                                            e.target.style.backgroundColor = 'white';
                                        }
                                    }}
                                >
                                    <span>⬅️</span>
                                    Previous
                                </button>
                                <span style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#334155',
                                    color: '#1e40af',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    border: '1px solid #93c5fd'
                                }}>
                                    {pagination.current_page} / {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                                    disabled={pagination.current_page === pagination.pages}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
                                        backgroundColor: '#1e293b',
                                        color: pagination.current_page === pagination.pages ? '#9ca3af' : '#374151',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: pagination.current_page === pagination.pages ? 'not-allowed' : 'pointer',
                                        opacity: pagination.current_page === pagination.pages ? 0.5 : 1,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (pagination.current_page !== pagination.pages) {
                                            e.target.style.backgroundColor = '#334155';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (pagination.current_page !== pagination.pages) {
                                            e.target.style.backgroundColor = 'white';
                                        }
                                    }}
                                >
                                    Next
                                    <span>➡️</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogManagementPage;