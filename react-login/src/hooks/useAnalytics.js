import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../utils/analytics';

// Custom hook for Google Analytics integration
export const useAnalytics = () => {
  const location = useLocation();
  const pageStartTime = useRef(Date.now());
  const scrollDepthTracked = useRef(new Set());

  // Initialize analytics on mount
  useEffect(() => {
    analytics.init();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    const pageTitle = document.title;
    const pagePath = location.pathname + location.search;
    
    // Reset tracking state for new page
    pageStartTime.current = Date.now();
    scrollDepthTracked.current.clear();
    
    // Track page view
    analytics.pageView(pageTitle, window.location.href);
    
    // Track time on previous page before leaving
    return () => {
      analytics.trackTimeOnPage(pageStartTime.current);
    };
  }, [location]);

  // Scroll depth tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / documentHeight) * 100);
      
      // Track at specific milestones
      const milestones = [25, 50, 75, 100];
      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !scrollDepthTracked.current.has(milestone)) {
          scrollDepthTracked.current.add(milestone);
          analytics.trackScrollDepth(milestone);
        }
      });
    };

    const throttledScroll = throttle(handleScroll, 500);
    window.addEventListener('scroll', throttledScroll);
    
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [location]);

  // Return analytics functions for components to use
  return {
    // Page tracking
    trackPageView: analytics.pageView.bind(analytics),
    
    // Event tracking
    trackEvent: analytics.event.bind(analytics),
    
    // Blog-specific tracking
    trackBlogPost: analytics.trackBlogPostView.bind(analytics),
    trackBlogShare: analytics.trackBlogPostShare.bind(analytics),
    trackCategoryView: analytics.trackCategoryView.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    
    // User interaction tracking
    trackUserEngagement: analytics.trackUserEngagement.bind(analytics),
    trackExternalLink: analytics.trackExternalLink.bind(analytics),
    trackUserPreference: analytics.trackUserPreference.bind(analytics),
    
    // User properties
    setUserProperties: analytics.setUserProperties.bind(analytics),
    
    // Privacy controls
    enableAnalytics: analytics.enable.bind(analytics),
    disableAnalytics: analytics.disable.bind(analytics)
  };
};

// Hook for tracking specific blog post interactions
export const useBlogPostAnalytics = (post) => {
  const analytics = useAnalytics();
  const readingStartTime = useRef(Date.now());

  useEffect(() => {
    if (post) {
      // Track blog post view
      analytics.trackBlogPost(post.title, post.slug, post.category);
      readingStartTime.current = Date.now();
    }
  }, [post, analytics]);

  const trackShare = useCallback((method) => {
    if (post) {
      analytics.trackBlogShare(post.title, post.slug, method);
    }
  }, [post, analytics]);

  const trackReadingTime = useCallback(() => {
    if (post) {
      const readingTime = Math.round((Date.now() - readingStartTime.current) / 1000);
      analytics.trackEvent('blog_reading_time', {
        category: 'blog',
        label: post.title,
        value: readingTime,
        reading_time_seconds: readingTime,
        post_slug: post.slug
      });
    }
  }, [post, analytics]);

  const trackEngagement = useCallback((action, details = {}) => {
    if (post) {
      analytics.trackUserEngagement(action, {
        ...details,
        post_title: post.title,
        post_slug: post.slug,
        post_category: post.category
      });
    }
  }, [post, analytics]);

  return {
    trackShare,
    trackReadingTime,
    trackEngagement
  };
};

// Hook for admin analytics
export const useAdminAnalytics = () => {
  const analytics = useAnalytics();

  const trackAdminAction = useCallback((action, details = {}) => {
    analytics.trackEvent('admin_action', {
      category: 'admin',
      action: action,
      ...details
    });
  }, [analytics]);

  const trackContentCreation = useCallback((contentType, title) => {
    analytics.trackEvent('content_created', {
      category: 'admin',
      content_type: contentType,
      content_title: title
    });
  }, [analytics]);

  const trackContentUpdate = useCallback((contentType, title, action) => {
    analytics.trackEvent('content_updated', {
      category: 'admin',
      content_type: contentType,
      content_title: title,
      update_action: action
    });
  }, [analytics]);

  return {
    trackAdminAction,
    trackContentCreation,
    trackContentUpdate
  };
};

// Utility function to throttle scroll events
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}