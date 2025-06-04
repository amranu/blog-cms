// Application configuration constants

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://isodigm.ca/api';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `https://isodigm.ca/api/login`,
  REGISTER: `https://isodigm.ca/api/register_user`,
  
  // Blog Posts
  BLOG_POSTS: `${API_BASE_URL}/blog/posts`,
  BLOG_POST_BY_ID: (id) => `${API_BASE_URL}/blog/posts/${id}`,
  BLOG_POST_BY_SLUG: (slug) => `${API_BASE_URL}/blog/posts/${slug}`,
  
  // Categories
  BLOG_CATEGORIES: `${API_BASE_URL}/blog/categories`,
};

export const APP_CONFIG = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    BLOG_PAGE_SIZE: 6
  },
  VALIDATION: {
    MAX_TITLE_LENGTH: 255,
    MAX_CONTENT_LENGTH: 50000,
    MAX_EXCERPT_LENGTH: 500,
    MAX_META_DESCRIPTION_LENGTH: 160
  },
  FEATURES: {
    ANALYTICS_ENABLED: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    ERROR_TRACKING_ENABLED: process.env.REACT_APP_ENABLE_ERROR_TRACKING === 'true'
  },
  ANALYTICS: {
    GA_MEASUREMENT_ID: process.env.REACT_APP_GA_MEASUREMENT_ID || '',
    GA_DEBUG_MODE: process.env.NODE_ENV === 'development'
  },
  THEME: {
    PRIMARY_COLOR: '#1e293b', // Slate gray
    PRIMARY_DARK: '#0f172a',
    PRIMARY_LIGHT: '#334155',
    PRIMARY_LIGHTER: '#475569',
    ACCENT_COLOR: '#3b82f6', // Blue accent
    ACCENT_LIGHT: '#60a5fa',
    BACKGROUND_LIGHT: '#0f172a',
    BACKGROUND_LIGHTER: '#1e293b',
    TEXT_PRIMARY: '#f1f5f9',
    TEXT_SECONDARY: '#cbd5e1',
    BORDER_COLOR: '#334155',
    SUCCESS_COLOR: '#10b981',
    ERROR_COLOR: '#ef4444'
  }
};

export const MESSAGES = {
  ERRORS: {
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    AUTHENTICATION_REQUIRED: 'Authentication required. Please log in.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    VALIDATION_FAILED: 'Please check your input and try again.',
    GENERIC_ERROR: 'An error occurred. Please try again.'
  },
  SUCCESS: {
    POST_CREATED: 'Post created successfully!',
    POST_UPDATED: 'Post updated successfully!',
    POST_DELETED: 'Post deleted successfully!',
    LOGIN_SUCCESS: 'Login successful!',
    LOGOUT_SUCCESS: 'Logged out successfully!'
  }
};