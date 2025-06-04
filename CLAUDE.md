# Blog CMS - Claude Documentation

## Overview
This is a full-stack blog CMS with React frontend and Flask API backend, featuring role-based access control and blog post management.

## Project Structure
```
/root/blog-cms/
├── flask-api/          # Python Flask API backend
│   ├── api.py         # Main Flask application
│   ├── models/        # Database models
│   ├── routes/        # API route handlers
│   ├── utils/         # Authentication and validation utilities
│   └── venv/          # Python virtual environment
└── react-login/       # React frontend application
    ├── src/           # React source code
    ├── build/         # Production build files
    └── public/        # Static assets
```

## Services and Deployment

### Systemd Services

#### Flask API Service
**Location:** `/etc/systemd/system/flask-api.service`
```ini
[Unit]
Description=Flask API for Blog CMS
After=network.target

[Service]
Type=exec
User=root
WorkingDirectory=/root/blog-cms/flask-api
Environment=PATH=/root/blog-cms/flask-api/venv/bin
ExecStart=/root/blog-cms/flask-api/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 3 api:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Management:**
- Start: `systemctl start flask-api`
- Stop: `systemctl stop flask-api`
- Restart: `systemctl restart flask-api`
- Status: `systemctl status flask-api`
- Logs: `journalctl -u flask-api -f`

#### React App Service
**Location:** `/etc/systemd/system/react-app.service`
```ini
[Unit]
Description=React App for Blog CMS
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/blog-cms/react-login
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=NODE_OPTIONS=--openssl-legacy-provider
Environment=BROWSER=none
ExecStart=/usr/local/bin/serve -s build -l 3000
Restart=always
RestartSec=5
KillMode=mixed
KillSignal=SIGINT

[Install]
WantedBy=multi-user.target
```

**Management:**
- Start: `systemctl start react-app`
- Stop: `systemctl stop react-app`
- Restart: `systemctl restart react-app`
- Status: `systemctl status react-app`
- Logs: `journalctl -u react-app -f`

### Nginx Configuration
**Location:** `/etc/nginx/sites-available/default`

Currently using default nginx configuration. For production, should be configured to:
- Serve React app on port 80/443
- Proxy API requests to Flask backend on port 5000
- Handle SSL/TLS termination

**Recommended production nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Serve React app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Proxy API requests to Flask
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Database
- **Type:** SQLite (development)
- **Location:** Flask API handles database initialization
- **Models:** User, BlogPost, BlogComment, BlogCategory, Setting

## Development Workflow

### Flask API Development
1. Activate virtual environment: `cd /root/blog-cms/flask-api && source venv/bin/activate`
2. Install dependencies: `pip install -r requirements.txt`
3. Run development server: `python api.py`
4. After changes: `systemctl restart flask-api`

### React Development
1. Navigate to React directory: `cd /root/blog-cms/react-login`
2. Install dependencies: `npm install`
3. Development server: `npm start`
4. Build for production: `npm run build`
5. After build: `systemctl restart react-app`

## Testing
- **Flask API:** `cd /root/blog-cms/flask-api && python test_api.py`
- **React:** `cd /root/blog-cms/react-login && npm test`

## Common Issues and Solutions

### Publish Functionality Not Working
**Issue:** `create_blog_post() takes 0 positional arguments but 1 was given`
**Solution:** All `@admin_required` decorated functions must accept a `user` parameter as the first argument.

**Fixed functions:**
- `routes/blog.py`: `create_blog_post(user)`, `update_blog_post(user, post_id)`, `delete_blog_post(user, post_id)`, `create_blog_category(user)`
- `routes/auth.py`: `register_user(user)`
- `routes/posts.py`: `create_post(user)`, `update_post(user, post_id)`, `delete_post(user, post_id)`

### Service Management
- Both services are enabled to start on boot
- Services automatically restart on failure
- Check service status before debugging issues
- Use `journalctl` to view service logs

## API Endpoints
- **Authentication:** `/login`, `/register_user`
- **Blog Posts:** `/posts` (GET, POST, PUT, DELETE)
- **Settings:** `/settings` (GET, POST, PUT)
- **Categories:** `/categories` (GET, POST)

## Environment Variables
- Flask uses environment-based configuration
- React production build uses `.env.production` for API URLs