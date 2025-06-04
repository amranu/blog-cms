# Blog CMS

A full-stack blog content management system built with React frontend and Flask API backend, featuring role-based access control, LaTeX rendering, and comprehensive blog post management.

## Features

### 🚀 Core Functionality
- **Blog Post Management**: Create, edit, delete, and publish blog posts with rich content support
- **LaTeX Rendering**: Built-in support for mathematical expressions and equations
- **Role-Based Access Control**: Admin and user roles with different permission levels
- **Category Management**: Organize posts with custom categories
- **Search & Filtering**: Filter posts by category, status, and search terms
- **Responsive Design**: Mobile-friendly interface that works on all devices

### 🔧 Technical Features
- **RESTful API**: Flask-based backend with SQLAlchemy ORM
- **JWT Authentication**: Secure token-based authentication system
- **Database**: SQLite for development, easily configurable for production databases
- **Modern Frontend**: React with React Router for single-page application experience
- **Production Ready**: Docker containerization with nginx reverse proxy
- **Auto-deployment**: Systemd service configuration for server deployment

### 📊 Analytics & Management
- **Site Settings**: Configurable site name and settings
- **User Analytics**: Track blog post views and engagement
- **Admin Dashboard**: Comprehensive admin interface for content management
- **Real-time Updates**: Dynamic site name updates without page refresh

## Installation

### 🐳 Docker Installation (Recommended)

The easiest way to get started is using Docker. This method automatically handles all dependencies and database setup.

#### Prerequisites
- Docker and Docker Compose installed on your system
- Git for cloning the repository

#### Quick Start
```bash
# Clone the repository
git clone https://github.com/amranu/blog-cms.git
cd blog-cms

# Start the application
docker compose up -d

# The application will be available at:
# - Blog: http://localhost (or your domain)
# - React Dev Server: http://localhost:3000
# - Flask API: http://localhost:5000
```

#### What Docker Setup Includes
- **Automatic Database Initialization**: Creates SQLite database and tables on first run
- **nginx Reverse Proxy**: Routes traffic to appropriate services
- **Production Builds**: Optimized React build and Flask API with Gunicorn
- **Persistent Data**: Database stored in Docker volume for data persistence
- **Service Health**: Automatic restarts and dependency management

#### Docker Management Commands
```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild after code changes
docker compose build --no-cache
docker compose up -d
```

### 🛠️ Traditional Installation

For development or custom deployments, you can install the components separately.

#### Prerequisites
- Python 3.9+ with pip
- Node.js 18+ with npm
- nginx (for production)

#### Backend Setup (Flask API)
```bash
# Navigate to Flask API directory
cd flask-api

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from __init__ import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"

# Run development server
python api.py
```

#### Frontend Setup (React)
```bash
# Navigate to React directory
cd react-login

# Install dependencies
npm install

# Start development server
npm start

# For production build
npm run build
```

#### Production Deployment
For production deployment with systemd services, see the detailed instructions in [CLAUDE.md](CLAUDE.md).

## Configuration

### Environment Variables
- `FLASK_ENV`: Set to `production` for production deployment
- `DATABASE_URL`: Database connection string (defaults to SQLite)
- `SECRET_KEY`: Flask secret key for session management
- `JWT_SECRET_KEY`: Secret key for JWT token generation

### Default Admin User
On first run, you can create an admin user:
```bash
# In the flask-api directory
python create_admin_user.py
```

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register_user` - User registration (admin only)

### Blog Management
- `GET /api/blog/posts` - Get blog posts with pagination and filtering
- `POST /api/blog/posts` - Create new blog post (admin only)
- `PUT /api/blog/posts/{id}` - Update blog post (admin only)
- `DELETE /api/blog/posts/{id}` - Delete blog post (admin only)
- `GET /api/blog/categories` - Get blog categories
- `POST /api/blog/categories` - Create new category (admin only)

### Settings
- `GET /api/settings/{key}` - Get setting value
- `POST /api/settings` - Update settings (admin only)

## Development

### Project Structure
```
blog-cms/
├── flask-api/              # Flask backend
│   ├── routes/             # API route handlers
│   ├── models/             # Database models
│   ├── utils/              # Utility functions
│   └── instance/           # Database files (not in git)
├── react-login/            # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── hooks/          # Custom hooks
│   └── build/              # Production build (not in git)
├── nginx/                  # nginx configuration
├── systemd/                # systemd service files
└── docker-compose.yml      # Docker orchestration
```

### Making Changes
1. For backend changes: Edit files in `flask-api/`, restart Flask server
2. For frontend changes: Edit files in `react-login/src/`, hot reload automatically updates
3. For Docker deployment: Run `docker compose build` after changes

### Database Schema
The application uses SQLAlchemy ORM with the following main models:
- **User**: User accounts with role-based permissions
- **BlogPost**: Blog posts with content, metadata, and status
- **BlogCategory**: Categories for organizing posts
- **Setting**: Key-value store for application settings

## Production Deployment

### Docker Production (Recommended)
```bash
# Clone and start
git clone https://github.com/amranu/blog-cms.git
cd blog-cms
docker compose up -d

# Setup auto-start on boot (Linux with systemd)
sudo cp systemd/blog-cms-docker.service /etc/systemd/system/
sudo systemctl enable blog-cms-docker.service
sudo systemctl start blog-cms-docker.service
```

### Manual Production Setup
1. Set up nginx with the provided configuration in `nginx/blog-cms`
2. Use systemd services in `systemd/` directory for auto-start
3. Configure SSL/TLS certificates for HTTPS
4. Set up proper backup procedures for the database

## Security Considerations

- Change default JWT secret keys in production
- Use HTTPS in production environments
- Regularly update dependencies
- Implement proper backup procedures
- Consider using a production database (PostgreSQL, MySQL) instead of SQLite for high-traffic sites

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Check the [CLAUDE.md](CLAUDE.md) file for detailed deployment instructions
- Review the commit history for implementation details

---

Built with ❤️ using React, Flask, and Docker.