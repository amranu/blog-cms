import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeaders from '../components/PageHeaders';
import { API_ENDPOINTS } from '../config/constants';
import LaTeXRenderer from '../components/LaTeXRenderer';

const CommentModerationPage = () => {
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalComments, setTotalComments] = useState(0);

    useEffect(() => {
        // Check if user is logged in and is admin
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

        if (!userItem.data.is_admin) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            alert('Access denied: Admin privileges required');
            navigate('/login');
            return;
        }

        fetchPendingComments();
    }, [navigate, currentPage]);

    const fetchPendingComments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_ENDPOINTS.PENDING_COMMENTS}?page=${currentPage}&per_page=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setComments(data.comments || []);
                setTotalPages(data.pages || 1);
                setTotalComments(data.total || 0);
            } else {
                console.error('Error fetching comments:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (commentId) => {
        try {
            setProcessing(prev => ({ ...prev, [commentId]: 'approving' }));
            const token = localStorage.getItem('token');
            const response = await fetch(API_ENDPOINTS.APPROVE_COMMENT(commentId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Remove from pending list
                setComments(prev => prev.filter(comment => comment.id !== commentId));
                setTotalComments(prev => prev - 1);
            } else {
                alert('Failed to approve comment');
            }
        } catch (error) {
            console.error('Error approving comment:', error);
            alert('Error approving comment');
        } finally {
            setProcessing(prev => ({ ...prev, [commentId]: null }));
        }
    };

    const handleReject = async (commentId) => {
        try {
            setProcessing(prev => ({ ...prev, [commentId]: 'rejecting' }));
            const token = localStorage.getItem('token');
            const response = await fetch(API_ENDPOINTS.REJECT_COMMENT(commentId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Remove from pending list
                setComments(prev => prev.filter(comment => comment.id !== commentId));
                setTotalComments(prev => prev - 1);
            } else {
                alert('Failed to reject comment');
            }
        } catch (error) {
            console.error('Error rejecting comment:', error);
            alert('Error rejecting comment');
        } finally {
            setProcessing(prev => ({ ...prev, [commentId]: null }));
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm('Are you sure you want to permanently delete this comment?')) {
            return;
        }

        try {
            setProcessing(prev => ({ ...prev, [commentId]: 'deleting' }));
            const token = localStorage.getItem('token');
            const response = await fetch(API_ENDPOINTS.DELETE_COMMENT(commentId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Remove from list
                setComments(prev => prev.filter(comment => comment.id !== commentId));
                setTotalComments(prev => prev - 1);
            } else {
                alert('Failed to delete comment');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Error deleting comment');
        } finally {
            setProcessing(prev => ({ ...prev, [commentId]: null }));
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

    const getActionButton = (commentId, action, label, color) => {
        const isProcessing = processing[commentId] === action;
        return (
            <button
                onClick={() => {
                    if (action === 'approving') handleApprove(commentId);
                    else if (action === 'rejecting') handleReject(commentId);
                    else if (action === 'deleting') handleDelete(commentId);
                }}
                disabled={isProcessing || processing[commentId]}
                style={{
                    padding: '8px 16px',
                    backgroundColor: isProcessing ? '#6b7280' : color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.7 : 1,
                    transition: 'all 0.2s'
                }}
            >
                {isProcessing ? 'Processing...' : label}
            </button>
        );
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
                        <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading comments...</p>
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
                {/* Header */}
                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    padding: '30px',
                    marginBottom: '30px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #475569'
                }}>
                    <h1 style={{ 
                        fontSize: '28px', 
                        fontWeight: '700', 
                        color: '#f1f5f9',
                        marginBottom: '8px',
                        margin: 0 
                    }}>
                        💬 Comment Moderation
                    </h1>
                    <p style={{ 
                        fontSize: '16px', 
                        color: '#6b7280',
                        margin: 0
                    }}>
                        Review and moderate pending comments on your blog posts.
                    </p>
                </div>

                {/* Comments Stats */}
                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '30px',
                    border: '1px solid #475569'
                }}>
                    <p style={{
                        color: '#f1f5f9',
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: 0
                    }}>
                        {totalComments} pending comment{totalComments !== 1 ? 's' : ''} awaiting moderation
                    </p>
                </div>

                {/* Comments List */}
                {comments.length > 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        {comments.map((comment) => (
                            <div key={comment.id} style={{
                                backgroundColor: '#1e293b',
                                borderRadius: '12px',
                                padding: '25px',
                                border: '1px solid #475569',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}>
                                {/* Comment Header */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '15px'
                                }}>
                                    <div>
                                        <h3 style={{
                                            color: '#f1f5f9',
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            margin: '0 0 8px 0'
                                        }}>
                                            {comment.author_name}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{ 
                                                color: '#6b7280', 
                                                fontSize: '14px' 
                                            }}>
                                                📧 {comment.author_email}
                                            </span>
                                            {comment.author_website && (
                                                <a 
                                                    href={comment.author_website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ 
                                                        color: '#3b82f6', 
                                                        fontSize: '14px',
                                                        textDecoration: 'none'
                                                    }}
                                                >
                                                    🌐 Website
                                                </a>
                                            )}
                                            <span style={{ 
                                                color: '#6b7280', 
                                                fontSize: '14px' 
                                            }}>
                                                🕒 {formatDate(comment.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '10px',
                                        flexWrap: 'wrap'
                                    }}>
                                        {getActionButton(comment.id, 'approving', '✅ Approve', '#22c55e')}
                                        {getActionButton(comment.id, 'rejecting', '❌ Reject', '#ef4444')}
                                        {getActionButton(comment.id, 'deleting', '🗑️ Delete', '#dc2626')}
                                    </div>
                                </div>

                                {/* Post Info */}
                                <div style={{
                                    backgroundColor: '#334155',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '15px'
                                }}>
                                    <p style={{
                                        color: '#6b7280',
                                        fontSize: '12px',
                                        margin: '0 0 4px 0',
                                        textTransform: 'uppercase',
                                        fontWeight: '600',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Comment on
                                    </p>
                                    <p style={{
                                        color: '#f1f5f9',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        margin: 0
                                    }}>
                                        {comment.post?.title || 'Unknown Post'}
                                    </p>
                                </div>

                                {/* Comment Content */}
                                <div style={{
                                    backgroundColor: '#334155',
                                    borderRadius: '8px',
                                    padding: '20px'
                                }}>
                                    <LaTeXRenderer 
                                        content={comment.content}
                                        style={{
                                            color: '#f1f5f9',
                                            lineHeight: '1.6',
                                            fontSize: '15px'
                                        }}
                                    />
                                </div>

                                {/* Reply to info */}
                                {comment.parent_id && (
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '12px',
                                        backgroundColor: '#475569',
                                        borderRadius: '8px',
                                        borderLeft: '4px solid #3b82f6'
                                    }}>
                                        <p style={{
                                            color: '#6b7280',
                                            fontSize: '14px',
                                            margin: 0
                                        }}>
                                            💬 This is a reply to another comment
                                        </p>
                                    </div>
                                )}

                                {/* Meta info */}
                                <div style={{
                                    marginTop: '15px',
                                    paddingTop: '15px',
                                    borderTop: '1px solid #475569',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{
                                        color: '#6b7280',
                                        fontSize: '12px'
                                    }}>
                                        IP: {comment.ip_address || 'Unknown'}
                                    </span>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        borderRadius: '12px',
                                        backgroundColor: '#fbbf24',
                                        color: '#0f172a'
                                    }}>
                                        {comment.status}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '10px',
                                marginTop: '30px'
                            }}>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: currentPage === 1 ? '#374151' : '#475569',
                                        color: currentPage === 1 ? '#6b7280' : '#f1f5f9',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    ← Previous
                                </button>
                                
                                <span style={{ 
                                    color: '#f1f5f9', 
                                    fontSize: '14px',
                                    padding: '0 15px'
                                }}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: currentPage === totalPages ? '#374151' : '#475569',
                                        color: currentPage === totalPages ? '#6b7280' : '#f1f5f9',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        padding: '60px 30px',
                        textAlign: 'center',
                        border: '1px solid #475569'
                    }}>
                        <div style={{
                            fontSize: '64px',
                            marginBottom: '20px'
                        }}>
                            🎉
                        </div>
                        <h3 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#f1f5f9',
                            margin: '0 0 12px 0'
                        }}>
                            All caught up!
                        </h3>
                        <p style={{
                            color: '#6b7280',
                            fontSize: '16px',
                            margin: 0
                        }}>
                            No pending comments to review at this time.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default CommentModerationPage;