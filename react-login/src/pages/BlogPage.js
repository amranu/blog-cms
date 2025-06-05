import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_ENDPOINTS, APP_CONFIG } from '../config/constants';
import { useBlogPostAnalytics, useAnalytics } from '../hooks/useAnalytics';
import { useSiteContext } from '../contexts/SiteContext';
import { useBlogTheme } from '../contexts/BlogThemeContext';
import LaTeXRenderer from '../components/LaTeXRenderer';
import BlogThemeToggle from '../components/BlogThemeToggle';

const BlogPage = () => {
    const { slug } = useParams();
    const [posts, setPosts] = useState([]);
    const [currentPost, setCurrentPost] = useState(null);
    const { siteName } = useSiteContext();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [postNotFound, setPostNotFound] = useState(false);
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
            setPostNotFound(false);
            const response = await fetch(API_ENDPOINTS.BLOG_POST_BY_SLUG(slug));
            
            if (response.ok) {
                const post = await response.json();
                setCurrentPost(post);
                setPostNotFound(false);
            } else {
                console.error('Failed to fetch post');
                setCurrentPost(null);
                setPostNotFound(true);
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            setCurrentPost(null);
            setPostNotFound(true);
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
            window.location.reload();
        };

        return (
            <nav className="blog-nav" style={{
                position: 'sticky',
                top: 0,
                zIndex: 50
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
                        <Link to="/" className="blog-nav-brand" style={{
                            fontSize: '20px',
                            fontWeight: '600'
                        }}>
                            {siteName || 'Blog'}
                        </Link>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <BlogThemeToggle />
                            {user && (
                                <Link 
                                    to="/admin" 
                                    className="blog-nav-link"
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    Admin
                                </Link>
                            )}
                            {!user && (
                                <Link 
                                    to="/login" 
                                    className="blog-nav-link"
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    Login
                                </Link>
                            )}
                            {user && (
                                <button 
                                    onClick={handleLogout}
                                    className="blog-nav-link"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Logout
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        );
    };

    // Post Not Found View
    if (slug && postNotFound && !loading) {
        return (
            <div className="blog-container">
                <Navigation />
                
                <div style={{ 
                    maxWidth: '720px', 
                    margin: '0 auto', 
                    padding: '40px 24px',
                    textAlign: 'center'
                }}>
                    {/* Back to Blog Button */}
                    <div style={{ marginBottom: '40px' }}>
                        <Link 
                            to="/" 
                            className="blog-nav-link"
                            style={{
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            ← Back to all posts
                        </Link>
                    </div>

                    <div style={{ padding: '80px 20px' }}>
                        <h1 className="blog-post-title" style={{
                            fontSize: '2.5rem',
                            fontWeight: '700',
                            marginBottom: '16px'
                        }}>
                            Post Not Found
                        </h1>
                        <p className="blog-post-meta" style={{
                            fontSize: '16px',
                            lineHeight: '1.5',
                            marginBottom: '32px'
                        }}>
                            The blog post you're looking for doesn't exist or has been removed.
                        </p>
                        <Link
                            to="/"
                            className="blog-button"
                            style={{
                                display: 'inline-block',
                                padding: '12px 24px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                textDecoration: 'none'
                            }}
                        >
                            View All Posts
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Single Post View
    if (slug && currentPost) {
        return (
            <div className="blog-container">
                <Navigation />
                
                <article style={{ 
                    maxWidth: '720px', 
                    margin: '0 auto', 
                    padding: '40px 24px'
                }}>
                    {/* Back to Blog Button */}
                    <div style={{ marginBottom: '40px' }}>
                        <Link 
                            to="/" 
                            className="blog-nav-link"
                            style={{
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            ← Back to all posts
                        </Link>
                    </div>

                    {/* Post Header */}
                    <header style={{ marginBottom: '40px' }}>
                        {currentPost.category && (
                            <div style={{ marginBottom: '16px' }}>
                                <span className="blog-post-meta" style={{
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    {currentPost.category}
                                </span>
                            </div>
                        )}
                        
                        <h1 className="blog-post-title" style={{
                            fontSize: '2.5rem',
                            fontWeight: '700',
                            lineHeight: '1.1',
                            margin: '0 0 20px 0',
                            letterSpacing: '-0.025em'
                        }}>
                            {currentPost.title}
                        </h1>
                        
                        <div className="blog-post-meta" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            <time>{formatDate(currentPost.published_at || currentPost.created_at)}</time>
                            <span>•</span>
                            <span>{Math.ceil(currentPost.content.split(' ').length / 200)} min read</span>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {currentPost.featured_image && (
                        <div style={{
                            marginBottom: '40px',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            <img
                                src={currentPost.featured_image}
                                alt={currentPost.title}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block'
                                }}
                            />
                        </div>
                    )}
                    
                    {/* Post Content */}
                    <div className="blog-post-content" style={{
                        fontSize: '18px',
                        lineHeight: '1.7',
                        fontWeight: '400',
                        marginBottom: '48px'
                    }}>
                        <LaTeXRenderer content={currentPost.content} />
                    </div>
                    
                    {/* Tags */}
                    {currentPost.tags && (
                        <div className="blog-divider" style={{
                            paddingTop: '32px',
                            borderTop: '1px solid',
                            marginBottom: '40px'
                        }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {currentPost.tags.split(',').map((tag, index) => (
                                    <span 
                                        key={index}
                                        className="blog-tag" 
                                        style={{
                                            padding: '4px 12px',
                                            borderRadius: '16px',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Back to posts link */}
                    <div className="blog-divider" style={{ textAlign: 'center', paddingTop: '32px', borderTop: '1px solid' }}>
                        <Link
                            to="/"
                            className="blog-nav-link"
                            style={{
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            ← Back to all posts
                        </Link>
                    </div>
                </article>
            </div>
        );
    }

    // Blog Listing View
    return (
        <div className="blog-container">
            <Navigation />
            
            <div style={{ 
                maxWidth: '1200px', 
                margin: '0 auto', 
                padding: '40px 24px'
            }}>
                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                    <h1 className="blog-post-title" style={{
                        fontSize: '2.5rem',
                        fontWeight: '700',
                        margin: '0 0 8px 0',
                        letterSpacing: '-0.025em'
                    }}>
                        All Posts
                    </h1>
                    <p className="blog-post-meta" style={{
                        fontSize: '16px',
                        margin: 0
                    }}>
                        Thoughts, ideas, and insights
                    </p>
                </div>

                {/* Filters Section */}
                {(categories.length > 0 || filters.search) && (
                    <div className="blog-filters" style={{
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '40px'
                    }}>
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            flexWrap: 'wrap',
                            alignItems: 'center'
                        }}>
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={filters.search}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                className="blog-input"
                                style={{
                                    flex: 1,
                                    minWidth: '200px',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                            />
                            {categories.length > 0 && (
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleCategoryFilter(e.target.value)}
                                    className="blog-select"
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                >
                                    <option value="">All categories</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.name}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {(filters.category || filters.search) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="blog-button"
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Posts List */}
                {loading ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '80px 0'
                    }}>
                        <span className="blog-post-meta" style={{
                            fontSize: '16px',
                            fontWeight: '500'
                        }}>
                            Loading...
                        </span>
                    </div>
                ) : posts.length > 0 ? (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
                            {posts.map((post) => (
                                <Link
                                    key={post.id}
                                    to={`/blog/${post.slug}`}
                                    onClick={() => handlePostClick(post)}
                                    style={{
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        display: 'block'
                                    }}
                                >
                                    <article 
                                        className="blog-card"
                                        style={{
                                            padding: '24px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {post.category && (
                                            <div style={{ marginBottom: '8px' }}>
                                                <span className="blog-post-meta" style={{
                                                    fontSize: '14px',
                                                    fontWeight: '500'
                                                }}>
                                                    {post.category}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <h2 className="blog-post-title" style={{
                                            fontSize: '20px',
                                            fontWeight: '600',
                                            marginBottom: '8px',
                                            lineHeight: '1.3',
                                            margin: '0 0 8px 0'
                                        }}>
                                            {post.title}
                                        </h2>
                                        
                                        {post.excerpt && (
                                            <p className="blog-post-meta" style={{
                                                marginBottom: '16px',
                                                lineHeight: '1.5',
                                                margin: '0 0 16px 0'
                                            }}>
                                                {post.excerpt}
                                            </p>
                                        )}
                                        
                                        <div className="blog-post-meta" style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}>
                                            <time>{formatDate(post.published_at || post.created_at)}</time>
                                            <span>•</span>
                                            <span>{Math.ceil(post.content?.split(' ').length / 200) || 1} min read</span>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="blog-divider" style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '16px',
                                marginTop: '48px',
                                paddingTop: '32px',
                                borderTop: '1px solid'
                            }}>
                                {pagination.current_page > 1 && (
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        className="blog-nav-link"
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ← Previous
                                    </button>
                                )}
                                
                                <span className="blog-post-meta" style={{
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    Page {pagination.current_page} of {pagination.pages}
                                </span>
                                
                                {pagination.current_page < pagination.pages && (
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        className="blog-nav-link"
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Next →
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px'
                    }}>
                        <h3 className="blog-post-title" style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>No posts found</h3>
                        <p className="blog-post-meta" style={{
                            fontSize: '16px',
                            lineHeight: '1.5',
                            margin: 0
                        }}>
                            {filters.category || filters.search 
                                ? 'Try adjusting your search criteria.'
                                : 'Check back soon for new content.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogPage;