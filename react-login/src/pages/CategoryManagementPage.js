import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { API_ENDPOINTS, APP_CONFIG, MESSAGES } from '../config/constants';

const CategoryManagementPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3b82f6',
        meta_description: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

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

        if (!userItem.data.is_admin) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            alert('Access denied: Admin privileges required');
            navigate('/login');
            return;
        }

        fetchCategories();
    }, [navigate]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_ENDPOINTS.BLOG_CATEGORIES);
            
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            } else {
                showMessage('error', 'Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            showMessage('error', 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            showMessage('error', 'Category name is required');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const url = editingCategory 
                ? `${API_ENDPOINTS.BLOG_CATEGORIES}/${editingCategory.id}`
                : API_ENDPOINTS.BLOG_CATEGORIES;
            
            const method = editingCategory ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const successMessage = editingCategory 
                    ? 'Category updated successfully!' 
                    : 'Category created successfully!';
                showMessage('success', successMessage);
                
                resetForm();
                fetchCategories();
            } else {
                const errorData = await response.json();
                showMessage('error', errorData.error || 'Failed to save category');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            showMessage('error', 'Network error. Please try again.');
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            color: category.color || '#3b82f6',
            meta_description: category.meta_description || ''
        });
        setShowCreateForm(true);
    };

    const handleDelete = async (category) => {
        if (!window.confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_ENDPOINTS.BLOG_CATEGORIES}/${category.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showMessage('success', 'Category deleted successfully!');
                fetchCategories();
            } else {
                const errorData = await response.json();
                showMessage('error', errorData.error || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showMessage('error', 'Network error. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            color: '#3b82f6',
            meta_description: ''
        });
        setEditingCategory(null);
        setShowCreateForm(false);
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
            <AdminLayout>
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
                    <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading categories...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '30px'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '700',
                            color: '#f1f5f9',
                            margin: '0 0 8px 0'
                        }}>
                            Category Management
                        </h1>
                        <p style={{
                            fontSize: '16px',
                            color: '#6b7280',
                            margin: 0
                        }}>
                            Organize your blog content with categories
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        style={{
                            backgroundColor: APP_CONFIG.THEME.ACCENT_COLOR,
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = APP_CONFIG.THEME.ACCENT_LIGHT}
                        onMouseLeave={(e) => e.target.style.backgroundColor = APP_CONFIG.THEME.ACCENT_COLOR}
                    >
                        ➕ Create Category
                    </button>
                </div>

                {/* Message */}
                {message.text && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        backgroundColor: message.type === 'success' ? `${APP_CONFIG.THEME.SUCCESS_COLOR}20` : `${APP_CONFIG.THEME.ERROR_COLOR}20`,
                        border: `1px solid ${message.type === 'success' ? APP_CONFIG.THEME.SUCCESS_COLOR : APP_CONFIG.THEME.ERROR_COLOR}`,
                        color: message.type === 'success' ? APP_CONFIG.THEME.SUCCESS_COLOR : APP_CONFIG.THEME.ERROR_COLOR
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Create/Edit Form */}
                {showCreateForm && (
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '30px',
                        border: '1px solid #475569'
                    }}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#f1f5f9',
                            margin: '0 0 20px 0'
                        }}>
                            {editingCategory ? 'Edit Category' : 'Create New Category'}
                        </h3>
                        
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#f1f5f9',
                                        marginBottom: '8px'
                                    }}>
                                        Category Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter category name"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid #475569',
                                            backgroundColor: '#334155',
                                            color: '#f1f5f9',
                                            fontSize: '14px'
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#f1f5f9',
                                        marginBottom: '8px'
                                    }}>
                                        Color
                                    </label>
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        style={{
                                            width: '100%',
                                            height: '44px',
                                            borderRadius: '8px',
                                            border: '1px solid #475569',
                                            backgroundColor: '#334155',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#f1f5f9',
                                    marginBottom: '8px'
                                }}>
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter category description"
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #475569',
                                        backgroundColor: '#334155',
                                        color: '#f1f5f9',
                                        fontSize: '14px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                            
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#f1f5f9',
                                    marginBottom: '8px'
                                }}>
                                    Meta Description
                                </label>
                                <textarea
                                    value={formData.meta_description}
                                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                    placeholder="SEO meta description for this category"
                                    rows={2}
                                    maxLength={160}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #475569',
                                        backgroundColor: '#334155',
                                        color: '#f1f5f9',
                                        fontSize: '14px',
                                        resize: 'vertical'
                                    }}
                                />
                                <div style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    marginTop: '4px'
                                }}>
                                    {formData.meta_description.length}/160 characters
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="submit"
                                    style={{
                                        backgroundColor: APP_CONFIG.THEME.ACCENT_COLOR,
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {editingCategory ? 'Update Category' : 'Create Category'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={{
                                        backgroundColor: '#475569',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Categories List */}
                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #475569',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid #475569'
                    }}>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#f1f5f9',
                            margin: 0
                        }}>
                            Categories ({categories.length})
                        </h3>
                    </div>

                    {categories.length === 0 ? (
                        <div style={{
                            padding: '60px 24px',
                            textAlign: 'center',
                            color: '#6b7280'
                        }}>
                            <div style={{
                                fontSize: '48px',
                                marginBottom: '16px'
                            }}>🏷️</div>
                            <h4 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#f1f5f9',
                                margin: '0 0 8px 0'
                            }}>
                                No categories yet
                            </h4>
                            <p style={{ margin: '0 0 24px 0' }}>
                                Create your first category to organize your blog posts
                            </p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                style={{
                                    backgroundColor: APP_CONFIG.THEME.ACCENT_COLOR,
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Create First Category
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: '0' }}>
                            {categories.map((category, index) => (
                                <div
                                    key={category.id}
                                    style={{
                                        padding: '20px 24px',
                                        borderBottom: index < categories.length - 1 ? '1px solid #475569' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                        <div
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '6px',
                                                backgroundColor: category.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '16px'
                                            }}
                                        >
                                            🏷️
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: '#f1f5f9',
                                                margin: '0 0 4px 0'
                                            }}>
                                                {category.name}
                                            </h4>
                                            {category.description && (
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: '#6b7280',
                                                    margin: '0 0 4px 0'
                                                }}>
                                                    {category.description}
                                                </p>
                                            )}
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#6b7280'
                                            }}>
                                                Created {formatDate(category.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleEdit(category)}
                                            style={{
                                                backgroundColor: '#475569',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#64748b'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#475569'}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category)}
                                            style={{
                                                backgroundColor: `${APP_CONFIG.THEME.ERROR_COLOR}20`,
                                                color: APP_CONFIG.THEME.ERROR_COLOR,
                                                border: `1px solid ${APP_CONFIG.THEME.ERROR_COLOR}`,
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = APP_CONFIG.THEME.ERROR_COLOR;
                                                e.target.style.color = 'white';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = `${APP_CONFIG.THEME.ERROR_COLOR}20`;
                                                e.target.style.color = APP_CONFIG.THEME.ERROR_COLOR;
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default CategoryManagementPage;