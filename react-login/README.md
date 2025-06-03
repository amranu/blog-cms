# Blog CMS - React Frontend

A modern, responsive blog CMS built with React 18, featuring comprehensive Google Analytics 4 tracking and content management capabilities.

## 🚀 Features

### Blog Management
- **Public Blog**: SEO-optimized blog with categories, tags, and search
- **Admin Dashboard**: Content management with analytics overview
- **Rich Editor**: Markdown-supported blog post creation
- **Media Support**: Featured images and content media
- **SEO Optimization**: Meta descriptions, slugs, and structured data

### Analytics Integration
- **Google Analytics 4**: Comprehensive tracking implementation
- **User Engagement**: Scroll depth, time on page, and interaction tracking
- **Content Analytics**: Post views, shares, and category performance
- **Admin Tracking**: Content creation and management analytics
- **Privacy Compliant**: GDPR-ready with consent management

### User Experience
- **Responsive Design**: Mobile-first, works on all devices
- **Fast Performance**: Optimized loading and caching
- **Social Sharing**: Built-in social media sharing buttons
- **Search & Filter**: Category filtering and content search
- **Pagination**: Efficient content browsing

## 🛠 Quick Start

### Prerequisites
- Node.js 14+ and npm
- Flask API backend running (see `../flask-api/`)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```bash
   # API Configuration
   REACT_APP_API_URL=http://localhost:5000
   
   # Google Analytics
   REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   REACT_APP_ENABLE_ANALYTICS=true
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```
   
   The app will open at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
```

Builds the app for production with optimized performance and analytics tracking.

## 📊 Analytics Setup

This blog includes comprehensive Google Analytics 4 tracking. See [GOOGLE_ANALYTICS_SETUP.md](../GOOGLE_ANALYTICS_SETUP.md) for detailed setup instructions.

### What's Tracked:
- Page views and user sessions
- Blog post engagement (views, shares, reading time)
- Search queries and category filtering
- User interactions and scroll depth
- Admin actions and content management

## 🏗 Architecture

### Key Components

- **`App.js`**: Main application with routing and analytics initialization
- **`pages/BlogPage.js`**: Public blog with analytics tracking
- **`pages/AdminDashboard.js`**: Admin overview with content stats
- **`pages/WritePostPage.js`**: Content creation with tracking
- **`hooks/useAnalytics.js`**: Analytics integration hooks
- **`utils/analytics.js`**: Google Analytics 4 implementation

### Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── BlogEditor.jsx   # Rich text editor
│   ├── PageHeaders.jsx  # Navigation and sidebar
│   └── ...
├── pages/              # Route components
│   ├── BlogPage.js     # Public blog with analytics
│   ├── AdminDashboard.js # Admin panel
│   └── ...
├── hooks/              # Custom React hooks
│   └── useAnalytics.js # Analytics integration
├── utils/              # Utility functions
│   └── analytics.js    # GA4 implementation
├── config/             # Configuration
│   └── constants.js    # API endpoints and config
└── App.js             # Main application
```

## 🔧 Development

### Available Scripts

- **`npm start`**: Development server with hot reload
- **`npm test`**: Run test suite
- **`npm run build`**: Production build
- **`npm run eject`**: Eject from Create React App (⚠️ irreversible)

### Environment Variables

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development

# Analytics
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
REACT_APP_ENABLE_ANALYTICS=true

# Features
REACT_APP_ENABLE_ERROR_TRACKING=false
```

### Analytics Development

Analytics runs in debug mode during development. Check browser console for tracking logs:

```javascript
GA4: Initialized successfully G-XXXXXXXXXX
GA4: Page view tracked {page_title: "Blog", ...}
GA4: Event tracked {action: "blog_post_view", ...}
```

## 📱 Responsive Design

The blog is fully responsive with breakpoints for:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

## 🚀 Deployment

### Production Environment Variables

Set these on your hosting platform:

```bash
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENVIRONMENT=production
```

### Build Process

```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Deploy build/ directory to your hosting platform
```

### Hosting Recommendations
- **Netlify**: Automatic deployments with environment variables
- **Vercel**: Zero-config React deployments
- **AWS S3 + CloudFront**: Scalable static hosting
- **GitHub Pages**: Free hosting for open source projects

## 📈 Analytics Dashboard

### Google Analytics 4 Setup

1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get your Measurement ID (G-XXXXXXXXXX)
3. Set `REACT_APP_GA_MEASUREMENT_ID` environment variable
4. Deploy and verify tracking in GA4 real-time reports

### Custom Reports

The blog tracks custom events you can use for GA4 reports:
- **Content Performance**: `blog_post_view`, `share` events
- **User Engagement**: `scroll`, `search`, `page_time` events  
- **Admin Analytics**: `content_created`, `post_published` events

## 🛡 Security & Privacy

- **Environment Variables**: Sensitive config kept in environment
- **CORS Protection**: API calls restricted to allowed origins
- **Input Sanitization**: XSS protection for user content
- **GDPR Compliance**: Analytics consent management built-in

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/analytics-enhancement`
3. Make your changes with proper analytics tracking
4. Test the build: `npm run build`
5. Submit a pull request

## 📞 Support

For analytics setup help:
1. Check the [Analytics Setup Guide](../GOOGLE_ANALYTICS_SETUP.md)
2. Verify environment variables are set correctly
3. Check browser console for GA4 debug messages
4. Review GA4 real-time reports for event tracking

---

**Built with React 18** • **Google Analytics 4** • **Responsive Design** • **SEO Optimized**