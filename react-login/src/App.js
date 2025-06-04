
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAnalytics } from './hooks/useAnalytics';
import { SiteProvider, useSiteContext } from './contexts/SiteContext';
import './theme.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WritePostPage from './pages/WritePostPage';
import AdminDashboard from './pages/AdminDashboard';
import BlogManagementPage from './pages/BlogManagementPage';
import BlogPage from './pages/BlogPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <SiteProvider>
        <DocumentTitleUpdater />
        <AnalyticsProvider>
          <Routes>
            <Route path='/' element={<BlogPage />} />
            <Route path='/blog' element={<BlogPage />} />
            <Route path='/blog/:slug' element={<BlogPage />} />
            <Route path='/home' element={<Navigate to="/admin" replace />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/register' element={<RegisterPage />} />
            <Route path='/write-post' element={<WritePostPage />} />
            <Route path='/blog-management' element={<BlogManagementPage />} />
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
