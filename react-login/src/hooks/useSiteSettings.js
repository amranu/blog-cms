import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';

export const useSiteSettings = () => {
  const [siteName, setSiteName] = useState('Blog CMS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSiteName();
  }, []);

  const fetchSiteName = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/settings/site_name`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSiteName(data.value || 'Blog CMS');
      }
    } catch (err) {
      console.error('Error loading site name:', err);
    } finally {
      setLoading(false);
    }
  };

  return { siteName, loading, refreshSiteName: fetchSiteName };
};