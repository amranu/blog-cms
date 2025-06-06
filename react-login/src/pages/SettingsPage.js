import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';
import { useSiteContext } from '../contexts/SiteContext';
import AdminLayout from '../components/AdminLayout';

const SettingsPage = () => {
  const { refreshSiteName } = useSiteContext();
  const [settings, setSettings] = useState({
    site_name: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || { site_name: 'Blog CMS' });
      } else {
        setError('Failed to load settings');
      }
    } catch (err) {
      setError('Error loading settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage('Settings saved successfully!');
        // Refresh the site name in context to update all references
        refreshSiteName();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('Error saving settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center" style={{ padding: '40px' }}>
          <div style={{ 
            color: '#6b7280', 
            fontSize: '16px'
          }}>
            Loading settings...
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white rounded-lg shadow-md p-6" style={{ maxWidth: '800px' }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Site Settings</h1>
        
        {message && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="site_name" className="block text-sm font-medium text-gray-700 mb-2">
              Site Name
            </label>
            <input
              type="text"
              id="site_name"
              name="site_name"
              value={settings.site_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your site name"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              This name will appear in the header and throughout your blog.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;