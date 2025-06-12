
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAnalytics } from './hooks/useAnalytics';
import { SiteProvider, useSiteContext } from './contexts/SiteContext';
import { BlogThemeProvider } from './contexts/BlogThemeContext';
import './theme.css';
import './styles/blog-theme.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import WritePostPage from './pages/WritePostPage';
import AdminDashboard from './pages/AdminDashboard';
import BlogManagementPage from './pages/BlogManagementPage';
import BlogPage from './pages/BlogPage';
import SettingsPage from './pages/SettingsPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import CommentModerationPage from './pages/CommentModerationPage';

function App() {
  return (
    <Router>
      <SiteProvider>
        <DocumentTitleUpdater />
        <AnalyticsProvider>
          <Routes>
            <Route path='/' element={<BlogThemeProvider><BlogPage /></BlogThemeProvider>} />
            <Route path='/blog' element={<BlogThemeProvider><BlogPage /></BlogThemeProvider>} />
            <Route path='/blog/:slug' element={<BlogThemeProvider><BlogPage /></BlogThemeProvider>} />
            <Route path='/home' element={<Navigate to="/admin" replace />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/register' element={<RegisterPage />} />
            <Route path='/verify-email' element={<VerifyEmailPage />} />
            <Route path='/write-post' element={<WritePostPage />} />
            <Route path='/blog-management' element={<BlogManagementPage />} />
            <Route path='/category-management' element={<CategoryManagementPage />} />
            <Route path='/comment-moderation' element={<CommentModerationPage />} />
            <Route path='/admin' element={<AdminDashboard />} />
            <Route path='/settings' element={<SettingsPage />} />
          </Routes>
        </AnalyticsProvider>
      </SiteProvider>
    </Router>
  );
}

// Document title updater component
function DocumentTitleUpdater() {
  const { siteName } = useSiteContext();
  
  useEffect(() => {
    document.title = siteName;
  }, [siteName]);
  
  return null;
}

// Analytics provider component to initialize tracking
function AnalyticsProvider({ children }) {
  // Initialize analytics tracking
  useAnalytics();
  
  return <>{children}</>;
}

export default App;
