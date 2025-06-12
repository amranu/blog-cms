# Blog CMS Ansible Deployment

This directory contains an Ansible playbook for deploying the Blog CMS application to remote servers using Docker Compose.

## Quick Start

1. **Install Ansible** on your control machine:
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install ansible

   # macOS
   brew install ansible

   # pip
   pip install ansible
   ```

2. **Configure your inventory** in `inventory.ini`:
   ```ini
   [blog-cms-servers]
   your-server ansible_host=YOUR_SERVER_IP ansible_user=YOUR_USER

   [blog-cms-servers:vars]
   domain_name=your-domain.com
   ```

3. **Run the playbook**:
   ```bash
   ansible-playbook -i inventory.ini ansible-playbook.yml
   ```

## Configuration

### Inventory Variables

Edit `inventory.ini` to customize your deployment:

- `domain_name`: Your domain name (default: server IP)
- `flask_port`: Flask API port (default: 5000)
- `react_port`: React app port (default: 3000) 
- `nginx_port`: Nginx port (default: 80)

### Playbook Variables

You can override variables in the playbook or via command line:

```bash
ansible-playbook -i inventory.ini ansible-playbook.yml \
  -e "domain_name=myblog.com" \
  -e "deploy_dir=/opt/my-blog-cms"
```

Available variables:
- `deploy_dir`: Application deployment directory (default: `/opt/blog-cms`)
- `app_user`: Application user (default: `blogcms`)
- `app_group`: Application group (default: `blogcms`)
- `domain_name`: Domain name for SSL and nginx configuration

## Post-Deployment

1. **Create admin user**:
   ```bash
   ssh your-server
   cd /opt/blog-cms
   docker compose exec flask-api python create_admin.py
   ```

2. **Access your blog**: `http://your-domain.com`

3. **Service management**:
   ```bash
   # Check Docker Compose service status
   sudo systemctl status blog-cms-docker

   # View container logs
   cd /opt/blog-cms
   docker compose logs -f flask-api
   docker compose logs -f react-app
   docker compose logs -f nginx

   # Restart all containers
   sudo systemctl restart blog-cms-docker
   
   # Or restart individual containers
   docker compose restart flask-api
   docker compose restart react-app
   docker compose restart nginx
   ```

## SSL/HTTPS Setup

To enable HTTPS with Let's Encrypt:

1. **Ensure your domain points to the server**

2. **Run Certbot**:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Update nginx configuration** to use SSL certificates

## Repository Setup

**Important**: Update the repository URL in `ansible-playbook.yml`:

```yaml
- name: Clone blog-cms repository
  git:
    repo: "https://github.com/YOUR_USERNAME/blog-cms.git"
    dest: "{{ deploy_dir }}"
```

Replace `YOUR_USERNAME` with your actual GitHub username or organization.

## Directory Structure

After deployment:
```
/opt/blog-cms/
├── docker-compose.yml     # Docker Compose configuration
├── .env                   # Environment variables
├── flask-api/             # Flask backend source
│   ├── Dockerfile        # Flask container definition
│   └── ...
├── react-login/          # React frontend source
│   ├── Dockerfile        # React container definition
│   └── ...
├── nginx/                # Nginx configuration
│   └── blog-cms.template # Nginx config template
└── create_admin.py       # Admin user creation script
```

## Docker Architecture

The deployment uses Docker Compose with three services:
- **flask-api**: Python Flask API backend (internal port 5000)
- **react-app**: React frontend application (internal port 3000)
- **nginx**: Reverse proxy and web server (ports 80/443)

All services are managed by the `blog-cms-docker` systemd service.

## Troubleshooting

### Common Issues

1. **Service fails to start**: Check logs with `journalctl -u blog-cms-docker -f`
2. **Container issues**: Check container status with `docker compose ps` and logs with `docker compose logs`
3. **Permission denied**: Ensure correct file ownership with `chown -R blogcms:blogcms /opt/blog-cms`
4. **Database issues**: Database is stored in Docker volume `flask-data`
5. **Port conflicts**: Ensure ports 80 and 443 are not used by other services

### Useful Commands

```bash
# Test Ansible connectivity
ansible -i inventory.ini all -m ping

# Check playbook syntax
ansible-playbook --syntax-check ansible-playbook.yml

# Dry run
ansible-playbook -i inventory.ini ansible-playbook.yml --check

# Docker-specific commands on target server
ssh your-server
cd /opt/blog-cms

# View all containers
docker compose ps

# Rebuild containers
docker compose up -d --build

# Stop all containers
docker compose down

# Remove containers and volumes (WARNING: destroys data)
docker compose down -v
```

## Security Considerations

- Change default passwords and usernames
- Configure firewall (ufw, iptables)
- Regular system updates
- Use SSH keys instead of passwords
- Consider running services in containers for isolation
- Set up monitoring and log rotation

## Requirements

- **Target servers**: Ubuntu 20.04+ or Debian 11+
- **Ansible version**: 2.9+
- **Docker**: Installed and running on target servers
- **Memory**: 2GB+ RAM recommended (for Docker containers)
- **Storage**: 3GB+ available space
- **Ports**: 80, 443 available for nginx