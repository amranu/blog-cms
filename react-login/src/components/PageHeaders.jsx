import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/constants';
import { useSiteSettings } from '../hooks/useSiteSettings';
import './PageHeaders.css';

function PageHeaders() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const { siteName } = useSiteSettings();

  useEffect(() => {
    const userItem = localStorage.getItem('user');
    if (userItem) {
      try {
        const parsedUser = JSON.parse(userItem);
        const currentTime = new Date().getTime();
        if (currentTime < parsedUser.expiry) {
          setIsLoggedIn(true);
          setUser(parsedUser.data);
        } else {
          localStorage.removeItem('user');
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUser(null);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <>
      <header className="mobile-header" style={{
        position: 'fixed',
        top: 0,
        left: '250px',
        right: 0,
        height: '70px',
        background: APP_CONFIG.THEME.PRIMARY_COLOR,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        zIndex: 999,
        borderLeft: `1px solid ${APP_CONFIG.THEME.PRIMARY_DARK}`
      }}>
        <div className="date-time-section" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🕒</span>
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div style={{
            height: '30px',
            width: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.3)'
          }}></div>
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '500'
          }}>
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit',
              hour12: true 
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {isLoggedIn && (
            <>
              {/* Notifications */}
              <div style={{
                position: 'relative',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <span style={{ fontSize: '18px' }}>🔔</span>
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '2px solid white'
                }}></div>
              </div>

              {/* User Profile */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                padding: '6px 12px',
                borderRadius: '25px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: APP_CONFIG.THEME.ACCENT_COLOR,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13px', opacity: 0.9 }}>{user?.username || 'User'}</span>
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>Premium Member</span>
                </div>
              </div>
              
              {/* Logout Button */}
              <button 
                onClick={logout} 
                style={{
                  background: `${APP_CONFIG.THEME.ERROR_COLOR}30`,
                  border: `1px solid ${APP_CONFIG.THEME.ERROR_COLOR}50`,
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = `${APP_CONFIG.THEME.ERROR_COLOR}50`;
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = `0 4px 12px ${APP_CONFIG.THEME.ERROR_COLOR}30`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = `${APP_CONFIG.THEME.ERROR_COLOR}30`;
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <span>🚪</span>
                Logout
              </button>
            </>
          )}
        </div>
      </header>
      
      {/* Seamless corner transition element */}
      <div className="corner-logo" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '250px',
        height: '70px',
        background: APP_CONFIG.THEME.PRIMARY_COLOR,
        zIndex: 1001,
        borderRight: `1px solid ${APP_CONFIG.THEME.PRIMARY_DARK}`,
        borderBottom: `1px solid ${APP_CONFIG.THEME.PRIMARY_DARK}`
      }}>
        
        {/* Logo/Brand */}
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '20px',
          color: 'white',
          fontSize: '18px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 1002
        }}>
          <span style={{ fontSize: '22px' }}>📝</span>
          <span>{siteName}</span>
        </div>
      </div>
      
      <div className="sidebar" style={{ 
        position: 'fixed', 
        top: '70px', 
        left: 0, 
        width: '250px', 
        height: 'calc(100vh - 70px)', 
        background: APP_CONFIG.THEME.PRIMARY_COLOR, 
        boxShadow: '4px 0 12px rgba(0,0,0,0.15)', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '20px 0', 
        zIndex: 1000 
      }}>
        <nav style={{ flex: 1, paddingTop: '20px' }}>
          {/* Main Navigation */}
          <div style={{ margin: '0 0 25px 0', padding: '0 20px' }}>
            <div style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: '12px', 
              fontWeight: '600', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              marginBottom: '15px'
            }}>
              Navigation
            </div>
          </div>

          <Link to="/admin" style={{ 
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none', 
            color: 'white', 
            padding: '15px 20px',
            borderRadius: '0 25px 25px 0',
            margin: '3px 0 3px 0',
            transition: 'all 0.2s',
            backgroundColor: window.location.pathname === '/admin' ? 'rgba(255,255,255,0.2)' : 'transparent',
            fontSize: '15px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = window.location.pathname === '/admin' ? 'rgba(255,255,255,0.2)' : 'transparent'}
          >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>📊</span>
            Dashboard
          </Link>

          <Link to="/blog" style={{ 
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none', 
            color: 'rgba(255,255,255,0.95)', 
            padding: '15px 20px',
            borderRadius: '0 25px 25px 0',
            margin: '3px 0 3px 0',
            transition: 'all 0.2s',
            backgroundColor: window.location.pathname.includes('/blog') && !window.location.pathname.includes('/blog-management') ? 'rgba(255,255,255,0.2)' : 'transparent',
            fontSize: '15px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = window.location.pathname.includes('/blog') && !window.location.pathname.includes('/blog-management') ? 'rgba(255,255,255,0.2)' : 'transparent'}
          >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>🌐</span>
            View Blog
          </Link>

          {/* Content Management Section */}
          <div style={{ margin: '30px 0 15px 0', padding: '0 20px' }}>
            <div style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: '12px', 
              fontWeight: '600', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              marginBottom: '15px'
            }}>
              Content Management
            </div>
          </div>

          <Link to="/write-post" style={{ 
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none', 
            color: 'rgba(255,255,255,0.95)', 
            padding: '15px 20px',
            borderRadius: '0 25px 25px 0',
            margin: '3px 0 3px 0',
            transition: 'all 0.2s',
            backgroundColor: window.location.pathname === '/write-post' ? 'rgba(255,255,255,0.2)' : 'transparent',
            fontSize: '15px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = window.location.pathname === '/write-post' ? 'rgba(255,255,255,0.2)' : 'transparent'}
          >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>✍️</span>
            Create Post
          </Link>

          <Link to="/blog-management" style={{ 
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none', 
            color: 'rgba(255,255,255,0.95)', 
            padding: '15px 20px',
            borderRadius: '0 25px 25px 0',
            margin: '3px 0 3px 0',
            transition: 'all 0.2s',
            backgroundColor: window.location.pathname === '/blog-management' ? 'rgba(255,255,255,0.2)' : 'transparent',
            fontSize: '15px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = window.location.pathname === '/blog-management' ? 'rgba(255,255,255,0.2)' : 'transparent'}
          >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>📝</span>
            Manage Posts
          </Link>

          {/* Settings Section */}
          <Link 
          to="/settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 20px',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0 25px 25px 0',
            margin: '8px 0',
            transition: 'all 0.2s',
            backgroundColor: window.location.pathname === '/settings' ? 'rgba(255,255,255,0.2)' : 'transparent',
            fontSize: '15px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = window.location.pathname === '/settings' ? 'rgba(255,255,255,0.2)' : 'transparent'}
          >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>⚙️</span>
            Settings
          </Link>

          {/* User Account Section */}
          <div style={{ 
            position: 'absolute', 
            bottom: '20px', 
            left: '0', 
            right: '0',
            padding: '0 20px'
          }}>
            <div style={{ 
              height: '1px', 
              background: 'rgba(255,255,255,0.2)', 
              margin: '20px 0 15px 0' 
            }}></div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              marginBottom: '15px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: APP_CONFIG.THEME.ACCENT_COLOR,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '600',
                color: 'white',
                marginRight: '12px'
              }}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ 
                  color: 'white', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  marginBottom: '2px'
                }}>
                  {user?.username || 'Admin'}
                </div>
                <div style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '12px'
                }}>
                  Content Manager
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}

export default PageHeaders;
