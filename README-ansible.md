# Blog CMS Ansible Deployment

This directory contains an Ansible playbook for deploying the Blog CMS application to remote servers.

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
- `deploy_dir`: Application deployment directory (default: `/opt/blog-cms-deploy`)
- `app_user`: Application user (default: `blogcms`)
- `app_group`: Application group (default: `blogcms`)
- `python_version`: Python version (default: `3.11`)

## Post-Deployment

1. **Create admin user**:
   ```bash
   ssh your-server
   cd /opt/blog-cms-deploy
   python3 create_admin.py
   ```

2. **Access your blog**: `http://your-domain.com`

3. **Service management**:
   ```bash
   # Check service status
   sudo systemctl status flask-api
   sudo systemctl status react-app
   sudo systemctl status nginx

   # View logs
   sudo journalctl -u flask-api -f
   sudo journalctl -u react-app -f

   # Restart services
   sudo systemctl restart flask-api react-app nginx
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
/opt/blog-cms-deploy/
├── flask-api/              # Flask backend
│   ├── venv/              # Python virtual environment
│   ├── instance/          # SQLite database
│   └── ...
├── react-login/           # React frontend
│   ├── build/             # Production build
│   └── ...
└── create_admin.py        # Admin user creation script
```

## Troubleshooting

### Common Issues

1. **Service fails to start**: Check logs with `journalctl -u SERVICE_NAME`
2. **Permission denied**: Ensure correct file ownership with `chown -R blogcms:blogcms /opt/blog-cms-deploy`
3. **Database issues**: Check SQLite file permissions in `instance/` directory
4. **Nginx errors**: Check configuration with `nginx -t`

### Useful Commands

```bash
# Test Ansible connectivity
ansible -i inventory.ini all -m ping

# Run only specific tasks
ansible-playbook -i inventory.ini ansible-playbook.yml --tags "services"

# Check playbook syntax
ansible-playbook --syntax-check ansible-playbook.yml

# Dry run
ansible-playbook -i inventory.ini ansible-playbook.yml --check
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
- **Python**: 3.8+ on target servers
- **Memory**: 1GB+ RAM recommended
- **Storage**: 2GB+ available space