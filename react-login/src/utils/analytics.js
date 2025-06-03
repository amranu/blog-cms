// Google Analytics 4 Implementation
import { APP_CONFIG } from '../config/constants';

class GoogleAnalytics {
  constructor() {
    this.isEnabled = APP_CONFIG.FEATURES.ANALYTICS_ENABLED && APP_CONFIG.ANALYTICS.GA_MEASUREMENT_ID;
    this.measurementId = APP_CONFIG.ANALYTICS.GA_MEASUREMENT_ID;
    this.debugMode = APP_CONFIG.ANALYTICS.GA_DEBUG_MODE;
    this.isInitialized = false;
  }

  // Initialize Google Analytics
  init() {
    if (!this.isEnabled || this.isInitialized) {
      if (this.debugMode) {
        console.log('GA4: Skipping initialization', { 
          enabled: this.isEnabled, 
          initialized: this.isInitialized 
        });
      }
      return;
    }

    try {
      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      document.head.appendChild(script);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };

      // Configure GA4
      window.gtag('js', new Date());
      window.gtag('config', this.measurementId, {
        debug_mode: this.debugMode,
        send_page_view: false, // We'll handle page views manually
        cookie_flags: 'SameSite=None;Secure',
        anonymize_ip: true // GDPR compliance
      });

      this.isInitialized = true;

      if (this.debugMode) {
        console.log('GA4: Initialized successfully', this.measurementId);
      }
    } catch (error) {
      console.error('GA4: Initialization failed', error);
    }
  }

  // Track page views
  pageView(page_title, page_location) {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'page_view', {
        page_title: page_title,
        page_location: page_location || window.location.href,
        page_path: window.location.pathname
      });

      if (this.debugMode) {
        console.log('GA4: Page view tracked', { page_title, page_location });
      }
    } catch (error) {
      console.error('GA4: Page view tracking failed', error);
    }
  }

  // Track custom events
  event(action, parameters = {}) {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', action, {
        event_category: parameters.category || 'engagement',
        event_label: parameters.label,
        value: parameters.value,
        ...parameters
      });

      if (this.debugMode) {
        console.log('GA4: Event tracked', { action, parameters });
      }
    } catch (error) {
      console.error('GA4: Event tracking failed', error);
    }
  }

  // Track blog-specific events
  trackBlogPostView(postTitle, postSlug, category) {
    this.event('blog_post_view', {
      category: 'blog',
      label: postTitle,
      post_slug: postSlug,
      post_category: category,
      content_type: 'blog_post'
    });
  }

  trackBlogPostShare(postTitle, postSlug, shareMethod) {
    this.event('share', {
      category: 'blog',
      label: postTitle,
      method: shareMethod,
      content_type: 'blog_post',
      item_id: postSlug
    });
  }

  trackSearch(searchTerm, resultsCount) {
    this.event('search', {
      search_term: searchTerm,
      category: 'blog',
      results_count: resultsCount
    });
  }

  trackCategoryView(categoryName) {
    this.event('blog_category_view', {
      category: 'blog',
      label: categoryName,
      content_type: 'category'
    });
  }

  trackUserEngagement(action, details = {}) {
    this.event('user_engagement', {
      category: 'engagement',
      engagement_action: action,
      ...details
    });
  }

  // Track time spent on page
  trackTimeOnPage(startTime) {
    if (!this.isEnabled) return;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    // Only track if user spent more than 10 seconds
    if (timeSpent > 10) {
      this.event('page_time', {
        category: 'engagement',
        value: timeSpent,
        time_spent_seconds: timeSpent
      });
    }
  }

  // Track scroll depth
  trackScrollDepth(percentage) {
    if (!this.isEnabled) return;

    // Track at 25%, 50%, 75%, and 100% scroll
    const milestones = [25, 50, 75, 100];
    if (milestones.includes(Math.round(percentage))) {
      this.event('scroll', {
        category: 'engagement',
        label: `${Math.round(percentage)}%`,
        value: Math.round(percentage)
      });
    }
  }

  // Track external link clicks
  trackExternalLink(url, linkText) {
    this.event('click', {
      category: 'outbound',
      label: url,
      link_text: linkText,
      link_url: url
    });
  }

  // Track user preferences
  trackUserPreference(preferenceName, preferenceValue) {
    this.event('user_preference', {
      category: 'user_behavior',
      preference_name: preferenceName,
      preference_value: preferenceValue
    });
  }

  // Set user properties (for logged-in users)
  setUserProperties(properties) {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('config', this.measurementId, {
        user_properties: properties
      });

      if (this.debugMode) {
        console.log('GA4: User properties set', properties);
      }
    } catch (error) {
      console.error('GA4: Setting user properties failed', error);
    }
  }

  // GDPR compliance - disable analytics
  disable() {
    if (typeof window !== 'undefined') {
      window[`ga-disable-${this.measurementId}`] = true;
      if (this.debugMode) {
        console.log('GA4: Analytics disabled for GDPR compliance');
      }
    }
  }

  // Enable analytics (after consent)
  enable() {
    if (typeof window !== 'undefined') {
      window[`ga-disable-${this.measurementId}`] = false;
      if (!this.isInitialized) {
        this.init();
      }
      if (this.debugMode) {
        console.log('GA4: Analytics enabled after consent');
      }
    }
  }
}

// Create singleton instance
const analytics = new GoogleAnalytics();

export default analytics;

// Convenience exports for common tracking functions
export const trackPageView = (title, location) => analytics.pageView(title, location);
export const trackEvent = (action, parameters) => analytics.event(action, parameters);
export const trackBlogPost = (title, slug, category) => analytics.trackBlogPostView(title, slug, category);
export const trackBlogShare = (title, slug, method) => analytics.trackBlogPostShare(title, slug, method);
export const initAnalytics = () => analytics.init();