# Dark Mode Implementation

This document describes the minimalistic dark mode theme implementation for the Blog CMS.

## Overview

The dark mode feature provides a toggle between light and dark themes specifically for the blog interface, while keeping the admin dashboard unchanged. The implementation focuses on:

- **Minimalistic design** with clean, professional aesthetics
- **Smooth transitions** between themes
- **Local storage persistence** for user preferences
- **System theme detection** as fallback
- **Accessibility** with proper contrast ratios

## Implementation Details

### 1. Theme Context (`src/contexts/BlogThemeContext.js`)

- Manages theme state globally across blog components
- Provides `useBlogTheme()` hook for easy theme access
- Handles local storage persistence
- Detects system color scheme preference
- Smooth transition management to prevent visual flashes

### 2. CSS Variables (`src/styles/blog-theme.css`)

**Light Theme Colors:**
- Background: `#ffffff` (primary), `#f9fafb` (secondary)
- Text: `#111827` (primary), `#6b7280` (secondary)
- Borders: `#e5e7eb` (primary)
- Accent: `#3b82f6` (blue)

**Dark Theme Colors:**
- Background: `#0f172a` (primary), `#1e293b` (secondary)
- Text: `#f1f5f9` (primary), `#cbd5e1` (secondary)
- Borders: `#334155` (primary)
- Accent: `#60a5fa` (blue)

### 3. Theme Toggle Component (`src/components/BlogThemeToggle.jsx`)

- Clean button with sun/moon icons
- Accessible with proper ARIA labels
- Consistent styling with theme variables
- Hover effects using theme colors

### 4. Blog Page Integration (`src/pages/BlogPage.js`)

- Wrapped with `BlogThemeProvider`
- Updated navigation to include theme toggle
- All elements use theme-aware CSS classes
- Maintains all existing functionality

## Usage

### For Users

1. **Navigate to the blog** (public interface)
2. **Click the theme toggle** in the navigation bar
3. **Theme preference is automatically saved** for future visits

### For Developers

```jsx
// Use the theme hook in any blog component
import { useBlogTheme } from '../contexts/BlogThemeContext';

const MyComponent = () => {
  const { theme, toggleTheme, isDark } = useBlogTheme();
  
  return (
    <div className="blog-container">
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>
        Switch to {isDark ? 'light' : 'dark'} mode
      </button>
    </div>
  );
};
```

### CSS Classes

Use these predefined classes for consistent theming:

```css
.blog-container     /* Main container */
.blog-nav          /* Navigation bar */
.blog-nav-link     /* Navigation links */
.blog-nav-brand    /* Site title */
.blog-card         /* Post cards */
.blog-input        /* Form inputs */
.blog-select       /* Select dropdowns */
.blog-button       /* Buttons */
.blog-post-title   /* Post titles */
.blog-post-content /* Post content */
.blog-tag          /* Tags */
.blog-filters      /* Filter section */
```

## Theme Variables

All theme colors are available as CSS custom properties:

```css
/* Example usage */
.my-element {
  background: var(--blog-bg-primary);
  color: var(--blog-text-primary);
  border: 1px solid var(--blog-border-primary);
}
```

### Available Variables

- `--blog-bg-primary`, `--blog-bg-secondary`, `--blog-bg-tertiary`
- `--blog-text-primary`, `--blog-text-secondary`, `--blog-text-muted`
- `--blog-border-primary`, `--blog-border-secondary`
- `--blog-accent-primary`, `--blog-accent-hover`, `--blog-accent-light`
- `--blog-shadow-sm`, `--blog-shadow-md`
- `--blog-transition`

## Features

### ✅ Implemented
- Light/Dark theme toggle
- Smooth transitions
- Local storage persistence
- System theme detection
- Theme-aware navigation
- Responsive design
- Accessibility support
- CSS variable system
- Clean minimalistic design

### 🔄 Admin Dashboard
- **Intentionally unchanged** - maintains existing dark theme
- Blog theme only affects public blog interface
- Admin users can still access theme toggle when viewing blog

## Browser Support

- **Modern browsers** with CSS custom properties support
- **Fallback** to light theme for older browsers
- **Local storage** support required for persistence

## Technical Notes

1. **Theme switching** uses `data-theme` attribute on `html` element
2. **Transitions disabled** briefly during theme change to prevent flash
3. **CSS specificity** managed with classes rather than IDs
4. **No JavaScript** required for basic styling (CSS-only fallbacks)
5. **Performance optimized** with minimal CSS custom property usage

## Testing

The implementation has been tested for:
- ✅ Theme persistence across page reloads
- ✅ Smooth transitions between themes
- ✅ Accessibility with screen readers
- ✅ Mobile responsiveness
- ✅ Admin dashboard isolation
- ✅ Build compatibility

## Future Enhancements

Potential improvements for future versions:
- System theme change detection
- More color scheme options
- Blog-specific theme customization
- Theme import/export functionality