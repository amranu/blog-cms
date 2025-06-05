import React, { createContext, useContext, useState, useEffect } from 'react';

const BlogThemeContext = createContext();

export const useBlogTheme = () => {
  const context = useContext(BlogThemeContext);
  if (!context) {
    throw new Error('useBlogTheme must be used within a BlogThemeProvider');
  }
  return context;
};

export const BlogThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('blog-theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Check for system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.documentElement.setAttribute('data-theme', defaultTheme);
    }
  }, []);

  const toggleTheme = () => {
    setIsTransitioning(true);
    
    // Add transitioning class to disable transitions
    document.documentElement.classList.add('theme-transitioning');
    
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('blog-theme', newTheme);
    
    // Remove transitioning class after a short delay
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 50);
  };

  const setThemeMode = (newTheme) => {
    if (newTheme !== theme) {
      setIsTransitioning(true);
      document.documentElement.classList.add('theme-transitioning');
      
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('blog-theme', newTheme);
      
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
        setIsTransitioning(false);
      }, 50);
    }
  };

  const value = {
    theme,
    toggleTheme,
    setThemeMode,
    isTransitioning,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <BlogThemeContext.Provider value={value}>
      {children}
    </BlogThemeContext.Provider>
  );
};