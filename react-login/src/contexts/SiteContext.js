import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';

const SiteContext = createContext();

// Global site name cache to eliminate flash completely
let globalSiteName = null;
let globalSiteNamePromise = null;

// Preload site name function
const preloadSiteName = async () => {
  if (globalSiteNamePromise) return globalSiteNamePromise;
  
  globalSiteNamePromise = (async () => {
    try {
      // Check cache first
      const cached = localStorage.getItem('cached_site_name');
      if (cached) {
        globalSiteName = cached;
        // Still fetch in background to update cache
        fetchSiteNameInBackground();
        return cached;
      }

      // If no cache, fetch immediately
      const response = await fetch(`${API_BASE_URL}/settings/site_name`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const siteName = data.value || 'Blog CMS';
        globalSiteName = siteName;
        localStorage.setItem('cached_site_name', siteName);
        return siteName;
      }
      
      // Fallback to known default
      globalSiteName = 'Isodigm';
      return globalSiteName;
    } catch (err) {
      console.error('Error preloading site name:', err);
      globalSiteName = 'Isodigm';
      return globalSiteName;
    }
  })();
  
  return globalSiteNamePromise;
};

// Background fetch to update cache
const fetchSiteNameInBackground = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/site_name`);
    if (response.ok) {
      const data = await response.json();
      const siteName = data.value || 'Blog CMS';
      if (siteName !== globalSiteName) {
        globalSiteName = siteName;
        localStorage.setItem('cached_site_name', siteName);
        // Trigger a storage event to update all components
        window.dispatchEvent(new CustomEvent('siteNameUpdated', { detail: siteName }));
      }
    }
  } catch (err) {
    console.error('Error updating site name:', err);
  }
};

export const useSiteContext = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSiteContext must be used within a SiteProvider');
  }
  return context;
};

export const SiteProvider = ({ children }) => {
  // Initialize with global cache or immediate fetch
  const [siteName, setSiteName] = useState(() => {
    if (globalSiteName) return globalSiteName;
    
    const cached = localStorage.getItem('cached_site_name');
    if (cached) {
      globalSiteName = cached;
      return cached;
    }
    
    // Return known default to minimize flash
    return 'Isodigm';
  });
  
  const [loading, setLoading] = useState(!globalSiteName);

  useEffect(() => {
    // If we don't have the global site name yet, preload it
    if (!globalSiteName) {
      preloadSiteName().then(name => {
        setSiteName(name);
        setLoading(false);
      });
    } else {
      setLoading(false);
      // Still update in background
      fetchSiteNameInBackground();
    }

    // Listen for site name updates
    const handleSiteNameUpdate = (event) => {
      setSiteName(event.detail);
    };
    
    window.addEventListener('siteNameUpdated', handleSiteNameUpdate);
    return () => window.removeEventListener('siteNameUpdated', handleSiteNameUpdate);
  }, []);

  const refreshSiteName = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/site_name`);
      if (response.ok) {
        const data = await response.json();
        const newSiteName = data.value || 'Blog CMS';
        globalSiteName = newSiteName;
        setSiteName(newSiteName);
        localStorage.setItem('cached_site_name', newSiteName);
      }
    } catch (err) {
      console.error('Error refreshing site name:', err);
    }
  };

  const value = {
    siteName,
    loading,
    refreshSiteName
  };

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
};