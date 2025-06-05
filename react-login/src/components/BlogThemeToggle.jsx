import React from 'react';
import { useBlogTheme } from '../contexts/BlogThemeContext';

const BlogThemeToggle = ({ className = '', style = {} }) => {
  const { theme, toggleTheme, isDark } = useBlogTheme();

  const defaultStyle = {
    background: 'var(--blog-bg-secondary)',
    border: '1px solid var(--blog-border-primary)',
    color: 'var(--blog-text-secondary)',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'var(--blog-transition)',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'inherit',
    ...style
  };

  const handleMouseEnter = (e) => {
    e.target.style.background = 'var(--blog-bg-tertiary)';
    e.target.style.color = 'var(--blog-text-primary)';
    e.target.style.borderColor = 'var(--blog-accent-primary)';
  };

  const handleMouseLeave = (e) => {
    e.target.style.background = 'var(--blog-bg-secondary)';
    e.target.style.color = 'var(--blog-text-secondary)';
    e.target.style.borderColor = 'var(--blog-border-primary)';
  };

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      style={defaultStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17q-2.075 0-3.537-1.463Q7 14.075 7 12t1.463-3.538Q9.925 7 12 7t3.538 1.462Q17 9.925 17 12q0 2.075-1.462 3.537Q14.075 17 12 17ZM2 13q-.425 0-.712-.288Q1 12.425 1 12t.288-.713Q1.575 11 2 11h2q.425 0 .713.287Q5 11.575 5 12t-.287.712Q4.425 13 4 13Zm18 0q-.425 0-.712-.288Q19 12.425 19 12t.288-.713Q19.575 11 20 11h2q.425 0 .712.287Q23 11.575 23 12t-.288.712Q22.425 13 22 13Zm-8-8q-.425 0-.712-.288Q11 4.425 11 4V2q0-.425.288-.713Q11.575 1 12 1t.713.287Q13 1.575 13 2v2q0 .425-.287.712Q12.425 5 12 5Zm0 18q-.425 0-.712-.288Q11 22.425 11 22v-2q0-.425.288-.712Q11.575 19 12 19t.713.288Q13 19.575 13 20v2q0 .425-.287.712Q12.425 23 12 23ZM5.65 7.05L4.575 6q-.3-.275-.3-.7t.3-.725q.275-.3.7-.3t.725.3L7.05 5.65q.275.3.275.7t-.275.7q-.3.275-.7.275t-.7-.275Zm12.7 12.7L17.3 18.7q-.275-.3-.275-.7t.275-.7q.3-.275.7-.275t.7.275l1.075 1.05q.3.3.3.725t-.3.7q-.275.3-.7.3t-.725-.3ZM18.35 7.05q-.3-.275-.3-.7t.3-.725L19.425 4.6q.3-.3.725-.3t.7.3q.3.275.3.7t-.3.725L18.775 7.1q-.3.275-.7.275t-.725-.275ZM5.65 19.75q-.3-.3-.3-.725t.3-.7L6.7 17.3q.275-.3.7-.3t.725.3q.3.275.3.7t-.3.725l-1.05 1.075q-.3.3-.725.3t-.7-.3Z"/>
          </svg>
          Light
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21q-3.75 0-6.375-2.625T3 12q0-3.75 2.625-6.375T12 3q.35 0 .688.025t.662.075q-1.025.725-1.637 1.887Q11.1 6.15 11.1 7.5q0 2.25 1.575 3.825Q14.25 12.9 16.5 12.9q1.375 0 2.525-.613q1.15-.612 1.875-1.637q.05.325.075.662Q21 11.65 21 12q0 3.75-2.625 6.375T12 21Z"/>
          </svg>
          Dark
        </>
      )}
    </button>
  );
};

export default BlogThemeToggle;