import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeaders from '../components/PageHeaders';
import { API_ENDPOINTS, APP_CONFIG } from '../config/constants';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        totalCategories: 0
    });
    const [recentPosts, setRecentPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check if user is logged in
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
        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Fetch all posts for stats
            const [allPostsResponse, categoriesResponse] = await Promise.all([
                fetch(`${API_ENDPOINTS.BLOG_POSTS}?per_page=100`),
                fetch(API_ENDPOINTS.BLOG_CATEGORIES)
            ]);

            if (allPostsResponse.ok) {
                const data = await allPostsResponse.json();
                const posts = data.posts || [];
                
                setStats({
                    totalPosts: posts.length,
                    publishedPosts: posts.filter(p => p.status === 'published').length,
                    draftPosts: posts.filter(p => p.status === 'draft').length,
                    totalCategories: 0 // Will be updated below
                });

                // Set recent posts (last 5)
                setRecentPosts(posts.slice(0, 5));
            }

            if (categoriesResponse.ok) {
                const categories = await categoriesResponse.json();
                setStats(prev => ({
                    ...prev,
                    totalCategories: categories.length
                }));
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <>
                <PageHeaders />
                <div className="main-content" style={{
                    marginLeft: '250px',
                    paddingTop: '85px',
                    padding: '85px 20px 20px 20px',
                    minHeight: '100vh',
                    backgroundColor: '#0f172a'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '60vh',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid #475569',
                            borderTop: '4px solid #3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '20px'
                        }}></div>
                        <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading dashboard...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeaders />
            <div className="main-content" style={{
                marginLeft: '250px',
                paddingTop: '85px',
                padding: '85px 20px 20px 20px',
                minHeight: '100vh',
                backgroundColor: '#0f172a'
            }}>
                {/* Welcome Section */}
                <div style={{
                    background: APP_CONFIG.THEME.PRIMARY_COLOR,
                    borderRadius: '12px',
                    padding: '30px',
                    color: 'white',
                    marginBottom: '30px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                    <h1 style={{ 
                        fontSize: '28px', 
                        fontWeight: '700', 
                        marginBottom: '8px',
                        margin: 0 
                    }}>
                        Welcome back, {user?.username || 'Admin'}! 👋
                    </h1>
                    <p style={{ 
                        fontSize: '16px', 
                        opacity: 0.9,
                        margin: 0
                    }}>
                        Ready to manage your blog content? Here's your dashboard overview.
                    </p>
                </div>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    {/* Total Posts */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #475569'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                backgroundColor: '#334155',
                                borderRadius: '8px',
                                padding: '8px',
                                marginRight: '15px'
                            }}>
                                📄
                            </div>
                            <div>
                                <p style={{ 
                                    color: '#6b7280', 
                                    fontSize: '14px', 
                                    margin: '0 0 5px 0',
                                    fontWeight: '500'
                                }}>Total Articles</p>
                                <p style={{ 
                                    color: '#f1f5f9', 
                                    fontSize: '24px', 
                                    fontWeight: '700',
                                    margin: 0
                                }}>{stats.totalPosts}</p>
                            </div>
                        </div>
                    </div>

                    {/* Published Posts */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #475569'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                backgroundColor: '#334155',
                                borderRadius: '8px',
                                padding: '8px',
                                marginRight: '15px'
                            }}>
                                ✅
                            </div>
                            <div>
                                <p style={{ 
                                    color: '#6b7280', 
                                    fontSize: '14px', 
                                    margin: '0 0 5px 0',
                                    fontWeight: '500'
                                }}>Published</p>
                                <p style={{ 
                                    color: '#f1f5f9', 
                                    fontSize: '24px', 
                                    fontWeight: '700',
                                    margin: 0
                                }}>{stats.publishedPosts}</p>
                            </div>
                        </div>
                    </div>

                    {/* Draft Posts */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #475569'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                backgroundColor: '#334155',
                                borderRadius: '8px',
                                padding: '8px',
                                marginRight: '15px'
                            }}>
                                ✏️
                            </div>
                            <div>
                                <p style={{ 
                                    color: '#6b7280', 
                                    fontSize: '14px', 
                                    margin: '0 0 5px 0',
                                    fontWeight: '500'
                                }}>Drafts</p>
                                <p style={{ 
                                    color: '#f1f5f9', 
                                    fontSize: '24px', 
                                    fontWeight: '700',
                                    margin: 0
                                }}>{stats.draftPosts}</p>
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #475569'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                backgroundColor: '#334155',
                                borderRadius: '8px',
                                padding: '8px',
                                marginRight: '15px'
                            }}>
                                🏷️
                            </div>
                            <div>
                                <p style={{ 
                                    color: '#6b7280', 
                                    fontSize: '14px', 
                                    margin: '0 0 5px 0',
                                    fontWeight: '500'
                                }}>Categories</p>
                                <p style={{ 
                                    color: '#f1f5f9', 
                                    fontSize: '24px', 
                                    fontWeight: '700',
                                    margin: 0
                                }}>{stats.totalCategories}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Recent Posts */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '30px'
                }}>
                    {/* Quick Actions */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        padding: '25px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #475569'
                    }}>
                        <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: '600', 
                            color: '#f1f5f9',
                            marginBottom: '20px',
                            margin: '0 0 20px 0'
                        }}>Quick Actions</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <Link
                                to="/write-post"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '15px',
                                    backgroundColor: '#475569',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    color: '#f1f5f9',
                                    transition: 'background-color 0.2s',
                                    border: '1px solid #475569'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#64748b'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#475569'}
                            >
                                <div style={{
                                    fontSize: '20px',
                                    marginRight: '15px'
                                }}>
                                    ✍️
                                </div>
                                <div>
                                    <h4 style={{ 
                                        fontWeight: '600', 
                                        margin: '0 0 3px 0',
                                        fontSize: '16px'
                                    }}>Write New Article</h4>
                                    <p style={{ 
                                        color: '#6b7280', 
                                        fontSize: '14px',
                                        margin: 0
                                    }}>Create and publish new content</p>
                                </div>
                            </Link>

                            <Link
                                to="/blog-management"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '15px',
                                    backgroundColor: '#475569',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    color: '#f1f5f9',
                                    transition: 'background-color 0.2s',
                                    border: '1px solid #475569'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#64748b'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#475569'}
                            >
                                <div style={{
                                    fontSize: '20px',
                                    marginRight: '15px'
                                }}>
                                    📝
                                </div>
                                <div>
                                    <h4 style={{ 
                                        fontWeight: '600', 
                                        margin: '0 0 3px 0',
                                        fontSize: '16px'
                                    }}>Manage Content</h4>
                                    <p style={{ 
                                        color: '#6b7280', 
                                        fontSize: '14px',
                                        margin: 0
                                    }}>Edit and organize your articles</p>
                                </div>
                            </Link>

                            <Link
                                to="/"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '15px',
                                    backgroundColor: '#475569',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    color: '#f1f5f9',
                                    transition: 'background-color 0.2s',
                                    border: '1px solid #475569'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#64748b'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#475569'}
                            >
                                <div style={{
                                    fontSize: '20px',
                                    marginRight: '15px'
                                }}>
                                    🌐
                                </div>
                                <div>
                                    <h4 style={{ 
                                        fontWeight: '600', 
                                        margin: '0 0 3px 0',
                                        fontSize: '16px'
                                    }}>Visit Your Blog</h4>
                                    <p style={{ 
                                        color: '#6b7280', 
                                        fontSize: '14px',
                                        margin: 0
                                    }}>See your published content live</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Posts */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        padding: '25px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #475569'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ 
                                fontSize: '18px', 
                                fontWeight: '600', 
                                color: '#f1f5f9',
                                margin: 0
                            }}>Recent Articles</h3>
                            <Link
                                to="/blog-management"
                                style={{
                                    color: '#3b82f6',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                View all →
                            </Link>
                        </div>
                        
                        {recentPosts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {recentPosts.map((post) => (
                                    <div key={post.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px',
                                        backgroundColor: '#334155',
                                        borderRadius: '8px',
                                        transition: 'background-color 0.2s'
                                    }}>
                                        <div style={{
                                            width: '35px',
                                            height: '35px',
                                            backgroundColor: '#475569',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: '12px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#6b7280'
                                        }}>
                                            {post.title.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{
                                                fontWeight: '500',
                                                color: '#f1f5f9',
                                                margin: '0 0 4px 0',
                                                fontSize: '14px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>{post.title}</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '2px 6px',
                                                    fontSize: '11px',
                                                    fontWeight: '500',
                                                    borderRadius: '12px',
                                                    backgroundColor: '#334155',
                                                    color: post.status === 'published' ? '#22c55e' : '#fbbf24'
                                                }}>
                                                    {post.status}
                                                </span>
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: '#6b7280'
                                                }}>
                                                    {formatDate(post.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: '#6b7280'
                            }}>
                                <div style={{
                                    fontSize: '48px',
                                    marginBottom: '15px'
                                }}>📝</div>
                                <h4 style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#f1f5f9',
                                    margin: '0 0 8px 0'
                                }}>No articles yet</h4>
                                <p style={{
                                    fontSize: '14px',
                                    margin: '0 0 20px 0'
                                }}>Start creating amazing content for your readers</p>
                                <Link
                                    to="/write-post"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '8px 16px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        textDecoration: 'none',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    ✍️ Write Your First Article
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;