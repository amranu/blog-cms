import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_ENDPOINTS, APP_CONFIG } from '../config/constants';
import { useBlogPostAnalytics, useAnalytics } from '../hooks/useAnalytics';
import { useSiteSettings } from '../hooks/useSiteSettings';
import LaTeXRenderer from '../components/LaTeXRenderer';

const BlogPage = () => {
    const { slug } = useParams();
    const [posts, setPosts] = useState([]);
    const [currentPost, setCurrentPost] = useState(null);
    const { siteName } = useSiteSettings();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 6,
        total: 0,
        pages: 0
    });

    // Analytics hooks
    const analytics = useAnalytics();
    const blogPostAnalytics = useBlogPostAnalytics(currentPost);

    useEffect(() => {
        if (slug) {
            fetchSinglePost(slug);
        } else {
            fetchPosts();
        }
        fetchCategories();
    }, [slug, filters, pagination.current_page]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.current_page,
                per_page: pagination.per_page,
                status: 'published',
                ...(filters.category && { category: filters.category })
            });

            const response = await fetch(`${API_ENDPOINTS.BLOG_POSTS}?${queryParams}`);
            
            if (response.ok) {
                const data = await response.json();
                setPosts(data.posts || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    pages: data.pages || 0
                }));
            } else {
                console.error('Failed to fetch posts');
                setPosts([]);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSinglePost = async (slug) => {
        try {
            setLoading(true);
            const response = await fetch(API_ENDPOINTS.BLOG_POST_BY_SLUG(slug));
            
            if (response.ok) {
                const post = await response.json();
                setCurrentPost(post);
            } else {
                console.error('Failed to fetch post');
                setCurrentPost(null);
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            setCurrentPost(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.BLOG_CATEGORIES);
            if (response.ok) {
                const data = await response.json();
                setCategories(data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Track pagination usage
        analytics.trackEvent('pagination_click', {
            category: 'blog',
            label: `Page ${page}`,
            page_number: page
        });
    };

    const handleCategoryFilter = (categoryValue) => {
        setFilters(prev => ({ ...prev, category: categoryValue }));
        setPagination(prev => ({ ...prev, current_page: 1 }));
        
        // Track category filtering
        if (categoryValue) {
            analytics.trackCategoryView(categoryValue);
        }
    };

    const handleSearchInput = (searchTerm) => {
        setFilters(prev => ({ ...prev, search: searchTerm }));
        setPagination(prev => ({ ...prev, current_page: 1 }));
        
        // Track search (debounced)
        if (searchTerm.length > 2) {
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => {
                analytics.trackSearch(searchTerm, posts.length);
            }, 1000);
        }
    };

    const handleClearFilters = () => {
        setFilters({ category: '', search: '' });
        setPagination(prev => ({ ...prev, current_page: 1 }));
        
        // Track filter clearing
        analytics.trackEvent('filters_cleared', {
            category: 'blog',
            label: 'Clear all filters'
        });
    };

    const handlePostClick = (post) => {
        // Track post click from listing
        analytics.trackEvent('blog_post_click', {
            category: 'blog',
            label: post.title,
            post_slug: post.slug,
            post_category: post.category,
            source: 'blog_listing'
        });
    };

    // Navigation Component
    const Navigation = () => {
        const [user, setUser] = useState(null);
        
        useEffect(() => {
            // Check if user is logged in
            const userItem = localStorage.getItem('user');
            if (userItem) {
                try {
                    const parsedUser = JSON.parse(userItem);
                    const currentTime = new Date().getTime();
                    if (currentTime < parsedUser.expiry) {
                        setUser(parsedUser.data);
                    } else {
                        localStorage.removeItem('user');
                        setUser(null);
                    }
                } catch (error) {
                    localStorage.removeItem('user');
                    setUser(null);
                }
            }
        }, []);

        const handleLogout = () => {
            localStorage.removeItem('user');
            setUser(null);
            // Reload page to update state
            window.location.reload();
        };

        return (
            <nav style={{
                background: APP_CONFIG.THEME.PRIMARY_COLOR,
                position: 'sticky',
                top: 0,
                zIndex: 50,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
                        <Link to="/" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            textDecoration: 'none',
                            color: 'white'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: APP_CONFIG.THEME.ACCENT_COLOR,
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: '600',
                                color: 'white',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                            }}>
                                📚
                            </div>
                            <span style={{ fontSize: '22px', fontWeight: '700' }}>{siteName || 'Blog CMS'}</span>
                        </Link>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {user ? (
                                <>
                                    {/* User Profile */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        padding: '6px 12px',
                                        borderRadius: '25px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>
                                        <div style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            background: APP_CONFIG.THEME.ACCENT_COLOR,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: 'white',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                                        }}>
                                            {user.username?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <span style={{ fontSize: '13px', opacity: 0.9 }}>
                                            {user.username || 'User'}
                                        </span>
                                    </div>
                                    
                                    {/* Logout Button */}
                                    <button 
                                        onClick={handleLogout}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            color: 'white',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                                            e.target.style.transform = 'translateY(-1px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    >
                                        <span>🚪</span>
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <Link 
                                    to="/login" 
                                    style={{
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.color = 'rgba(255, 255, 255, 0.9)';
                                    }}
                                >
                                    <span>🔐</span>
                                    Login
                                </Link>
                            )}
                            
                            {user && (
                                <Link 
                                    to="/admin" 
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        color: 'white',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    <span>⚡</span>
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        );
    };

    // Single Post View
    if (slug && currentPost) {
        return (
            <div style={{ minHeight: '100vh', background: APP_CONFIG.THEME.BACKGROUND_LIGHT }}>
                <Navigation />
                
                <article style={{ 
                    maxWidth: '1000px', 
                    margin: '0 auto', 
                    padding: '40px 20px'
                }}>
                    {/* Back to Blog Button */}
                    <div style={{ marginBottom: '32px' }}>
                        <Link 
                            to="/" 
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'white',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: '600',
                                padding: '12px 20px',
                                background: APP_CONFIG.THEME.PRIMARY_COLOR,
                                borderRadius: '25px',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px) scale(1.05)';
                                e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0) scale(1)';
                                e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                            }}
                        >
                            <span>⬅️</span>
                            Back to Blog
                        </Link>
                    </div>

                    {/* Main Post Container */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '20px',
                        padding: '48px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        background: APP_CONFIG.THEME.BACKGROUND_LIGHTER
                    }}>
                        {/* Post Header */}
                        <header style={{ marginBottom: '48px' }}>
                            {currentPost.featured_image && (
                                <div style={{
                                    position: 'relative',
                                    height: '400px',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    marginBottom: '32px',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                                    border: '2px solid rgba(255, 255, 255, 0.9)'
                                }}>
                                    <img
                                        src={currentPost.featured_image}
                                        alt={currentPost.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: `${APP_CONFIG.THEME.PRIMARY_COLOR}10`
                                    }}></div>
                                </div>
                            )}
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {currentPost.category && (
                                    <div>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: APP_CONFIG.THEME.PRIMARY_LIGHTER,
                                            color: '#1e40af',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            padding: '10px 18px',
                                            borderRadius: '25px',
                                            border: '2px solid rgba(59, 130, 246, 0.2)',
                                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)'
                                        }}>
                                            <span>🏷️</span>
                                            {currentPost.category}
                                        </span>
                                    </div>
                                )}
                                
                                <h1 style={{
                                    fontSize: '3.5rem',
                                    fontWeight: '800',
                                    color: APP_CONFIG.THEME.TEXT_PRIMARY,
                                    lineHeight: '1.1',
                                    margin: 0,
                                    letterSpacing: '-0.02em'
                                }}>
                                    {currentPost.title}
                                </h1>
                                
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '20px',
                                    color: '#6b7280',
                                    fontSize: '15px',
                                    fontWeight: '500',
                                    padding: '20px 24px',
                                    background: APP_CONFIG.THEME.BACKGROUND_LIGHT,
                                    borderRadius: '16px',
                                    border: '1px solid rgba(59, 130, 246, 0.1)',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '18px' }}>📅</span>
                                        <time>{formatDate(currentPost.published_at || currentPost.created_at)}</time>
                                    </div>
                                    <span style={{ color: '#475569', fontSize: '18px' }}>•</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '18px' }}>⏱️</span>
                                        <span>{Math.ceil(currentPost.content.split(' ').length / 200)} min read</span>
                                    </div>
                                    <span style={{ color: '#475569', fontSize: '18px' }}>•</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '18px' }}>👁️</span>
                                        <span>{currentPost.view_count || 0} views</span>
                                    </div>
                                </div>
                            </div>
                        </header>
                        
                        {/* Post Content */}
                        <div style={{
                            color: '#cbd5e1',
                            fontSize: '18px',
                            lineHeight: '1.8',
                            fontWeight: '400',
                            letterSpacing: '0.01em',
                            marginBottom: '48px',
                            paddingBottom: '48px',
                            borderBottom: '2px solid rgba(59, 130, 246, 0.1)'
                        }}>
                            <LaTeXRenderer content={currentPost.content} />
                        </div>
                        
                        {/* Social Sharing */}
                        <div style={{
                            background: APP_CONFIG.THEME.BACKGROUND_LIGHT,
                            borderRadius: '16px',
                            padding: '32px',
                            marginBottom: '40px',
                            border: '1px solid rgba(59, 130, 246, 0.1)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                        }}>
                            <h4 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#f1f5f9',
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{ fontSize: '20px' }}>📤</span>
                                Share this article
                            </h4>
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                flexWrap: 'wrap'
                            }}>
                                {[
                                    {
                                        name: 'Twitter',
                                        icon: '🐦',
                                        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(currentPost.title)}&url=${encodeURIComponent(window.location.href)}`,
                                        color: '#1DA1F2'
                                    },
                                    {
                                        name: 'Facebook',
                                        icon: '👥',
                                        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                                        color: '#4267B2'
                                    },
                                    {
                                        name: 'LinkedIn',
                                        icon: '💼',
                                        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                                        color: '#0077B5'
                                    },
                                    {
                                        name: 'Email',
                                        icon: '📧',
                                        url: `mailto:?subject=${encodeURIComponent(currentPost.title)}&body=${encodeURIComponent('Check out this article: ' + window.location.href)}`,
                                        color: '#6B7280'
                                    }
                                ].map((platform) => (
                                    <button
                                        key={platform.name}
                                        onClick={() => {
                                            blogPostAnalytics.trackShare(platform.name.toLowerCase());
                                            window.open(platform.url, '_blank', 'width=600,height=400');
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 20px',
                                            backgroundColor: '#1e293b',
                                            border: `2px solid ${platform.color}20`,
                                            borderRadius: '25px',
                                            color: platform.color,
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = platform.color;
                                            e.target.style.color = 'white';
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = `0 4px 15px ${platform.color}40`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#1e293b';
                                            e.target.style.color = platform.color;
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                                        }}
                                    >
                                        <span>{platform.icon}</span>
                                        {platform.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Post Footer */}
                        <footer>
                        {currentPost.tags && (
                            <div style={{ marginBottom: '40px' }}>
                                <h4 style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#f1f5f9',
                                    marginBottom: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <span style={{ fontSize: '20px' }}>🏷️</span>
                                    Tags
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                    {currentPost.tags.split(',').map((tag, index) => (
                                        <span 
                                            key={index} 
                                            style={{
                                                background: APP_CONFIG.THEME.BACKGROUND_LIGHT,
                                                color: '#cbd5e1',
                                                padding: '10px 16px',
                                                borderRadius: '25px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                border: '2px solid rgba(59, 130, 246, 0.1)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.05)';
                                            }}
                                        >
                                            <span style={{ fontSize: '12px' }}>🔖</span>
                                            {tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div style={{ textAlign: 'center' }}>
                            <Link
                                to="/"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    padding: '16px 32px',
                                    background: APP_CONFIG.THEME.PRIMARY_COLOR,
                                    color: 'white',
                                    fontWeight: '700',
                                    fontSize: '16px',
                                    borderRadius: '30px',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s',
                                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                                    border: '2px solid rgba(255, 255, 255, 0.8)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-3px) scale(1.05)';
                                    e.target.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0) scale(1)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                                }}
                            >
                                <span>⬅️</span>
                                Back to All Posts
                            </Link>
                        </div>
                    </footer>
                    </div>
                </article>
            </div>
        );
    }

    // Blog Listing View
    return (
        <div style={{ minHeight: '100vh', background: APP_CONFIG.THEME.BACKGROUND_LIGHT }}>
            <Navigation />
            
            <div style={{ 
                maxWidth: '1400px', 
                margin: '0 auto', 
                padding: '32px 24px'
            }}>
                {/* Filters Section */}
                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e5e7eb',
                    padding: '20px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#334155',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px'
                        }}>
                            🔍
                        </div>
                        <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#f1f5f9',
                            margin: 0
                        }}>
                            Find Articles
                        </h3>
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                placeholder="🔍 Search articles..."
                                value={filters.search}
                                onChange={(e) => handleSearchInput(e.target.value)}
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
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                                value={filters.category}
                                onChange={(e) => handleCategoryFilter(e.target.value)}
                                style={{
                                    minWidth: '180px',
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
                                <option value="">📂 All Categories</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.name}>
                                        🏷️ {category.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleClearFilters}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
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
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Posts Grid */}
                {loading ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '80px 0',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid #e5e7eb',
                            borderTop: '4px solid #3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <span style={{
                            color: '#6b7280',
                            fontSize: '16px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>📖</span>
                            Loading articles...
                        </span>
                    </div>
                ) : posts.length > 0 ? (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '28px',
                            marginBottom: '48px'
                        }}>
                            {posts.map((post) => (
                                <Link
                                    key={post.id}
                                    to={`/blog/${post.slug}`}
                                    onClick={() => handlePostClick(post)}
                                    style={{
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        display: 'block',
                                        height: 'fit-content'
                                    }}
                                >
                                    <article 
                                        style={{
                                            backgroundColor: '#1e293b',
                                            borderRadius: '16px',
                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                            border: '1px solid #e5e7eb',
                                            overflow: 'hidden',
                                            transition: 'all 0.3s',
                                            cursor: 'pointer',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-6px)';
                                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                                            e.currentTarget.style.borderColor = APP_CONFIG.THEME.PRIMARY_COLOR;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                        }}
                                    >
                                    {/* Featured Image */}
                                    {post.featured_image ? (
                                        <div style={{
                                            position: 'relative',
                                            height: '192px',
                                            overflow: 'hidden'
                                        }}>
                                            <img
                                                src={post.featured_image}
                                                alt={post.title}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.3s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.transform = 'scale(1.05)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.transform = 'scale(1)';
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{
                                            height: '192px',
                                            background: APP_CONFIG.THEME.PRIMARY_COLOR,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative'
                                        }}>
                                            <div style={{
                                                color: 'white',
                                                fontSize: '48px',
                                                fontWeight: '700',
                                                opacity: 0.7
                                            }}>
                                                {post.title.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                fontSize: '20px'
                                            }}>
                                                📖
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Post Content */}
                                    <div style={{ 
                                        padding: '24px',
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        {post.category && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    backgroundColor: '#334155',
                                                    color: '#1e40af',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #93c5fd'
                                                }}>
                                                    <span>🏷️</span>
                                                    {post.category}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <h2 style={{
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: '#f1f5f9',
                                            marginBottom: '12px',
                                            lineHeight: '1.4',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            transition: 'color 0.2s',
                                            margin: '0 0 12px 0'
                                        }}>
                                            {post.title}
                                        </h2>
                                        
                                        {post.excerpt && (
                                            <p style={{
                                                color: '#6b7280',
                                                marginBottom: '16px',
                                                lineHeight: '1.5',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {post.excerpt}
                                            </p>
                                        )}
                                        
                                        {/* Spacer to push footer to bottom */}
                                        <div style={{ flex: 1 }}></div>
                                        
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '12px',
                                            color: '#9ca3af',
                                            marginTop: '16px'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    <span>📅</span>
                                                    <time>{formatDate(post.published_at || post.created_at)}</time>
                                                </div>
                                                <span style={{
                                                    color: APP_CONFIG.THEME.PRIMARY_COLOR,
                                                    fontWeight: '500',
                                                    fontSize: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    Read more
                                                    <span>→</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '32px'
                            }}>
                                <button
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        color: pagination.current_page === 1 ? '#9ca3af' : '#374151',
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
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
                                            e.target.style.backgroundColor = '#1e293b';
                                        }
                                    }}
                                >
                                    <span>⬅️</span>
                                    Previous
                                </button>
                                
                                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer',
                                            ...(page === pagination.current_page
                                                ? {
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    border: '1px solid #3b82f6',
                                                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                                                }
                                                : {
                                                    color: '#cbd5e1',
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid #475569'
                                                })
                                        }}
                                        onMouseEnter={(e) => {
                                            if (page !== pagination.current_page) {
                                                e.target.style.backgroundColor = '#334155';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (page !== pagination.current_page) {
                                                e.target.style.backgroundColor = '#1e293b';
                                            }
                                        }}
                                    >
                                        {page}
                                    </button>
                                ))}
                                
                                <button
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.pages}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        color: pagination.current_page === pagination.pages ? '#9ca3af' : '#374151',
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
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
                                            e.target.style.backgroundColor = '#1e293b';
                                        }
                                    }}
                                >
                                    Next
                                    <span>➡️</span>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        backgroundColor: '#1e293b',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{
                            fontSize: '80px',
                            marginBottom: '24px',
                            filter: 'grayscale(1)',
                            opacity: 0.6
                        }}>📝</div>
                        <h3 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#f1f5f9',
                            marginBottom: '12px'
                        }}>No articles found</h3>
                        <p style={{
                            color: '#6b7280',
                            marginBottom: '32px',
                            fontSize: '16px',
                            lineHeight: '1.5'
                        }}>
                            {filters.category || filters.search 
                                ? '🔍 Try adjusting your filters to find more content.'
                                : '✨ Be the first to publish an article and share your knowledge!'}
                        </p>
                        <Link
                            to="/write-post"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                fontWeight: '600',
                                borderRadius: '8px',
                                textDecoration: 'none',
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
                            Write First Article
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogPage;