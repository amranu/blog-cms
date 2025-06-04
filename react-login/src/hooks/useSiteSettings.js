import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';

export const useSiteSettings = () => {
  // Try to get cached site name first, fallback to empty string to avoid flash
  const [siteName, setSiteName] = useState(() => {
    const cached = localStorage.getItem('cached_site_name');
    return cached || '';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSiteName();
  }, []);

  const fetchSiteName = async () => {
    try {
      // Use public endpoint for site name
      const response = await fetch(`${API_BASE_URL}/settings/site_name`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newSiteName = data.value || 'Blog CMS';
        setSiteName(newSiteName);
        // Cache the site name
        localStorage.setItem('cached_site_name', newSiteName);
      } else {
        // Fallback to default if no cached value
        if (!siteName) {
          setSiteName('Blog CMS');
        }
      }
    } catch (err) {
      console.error('Error loading site name:', err);
      // Fallback to default if no cached value
      if (!siteName) {
        setSiteName('Blog CMS');
      }
    } finally {
      setLoading(false);
    }
  };

  return { siteName, loading, refreshSiteName: fetchSiteName };
};