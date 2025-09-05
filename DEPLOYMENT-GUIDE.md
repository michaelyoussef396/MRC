# Deployment Guide
## MRC Lead Management System - Phase 1 Authentication

**Version**: 1.0  
**Target Environment**: Development & Production  
**Last Updated**: September 5, 2025

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Development Environment Setup](#development-environment-setup)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Security Configuration](#security-configuration)
7. [Testing Procedures](#testing-procedures)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Development Environment
- **Node.js**: 18.0+ (LTS recommended)
- **Python**: 3.8+
- **Operating System**: macOS, Linux, or Windows with WSL2
- **Memory**: Minimum 8GB RAM
- **Storage**: 2GB available space
- **Network**: Stable internet connection for package installations

### Production Environment
- **Server**: VPS or dedicated server (minimum 2 vCPU, 4GB RAM)
- **Operating System**: Ubuntu 20.04+ LTS or CentOS 8+
- **Python**: 3.8+
- **Node.js**: 18.0+ LTS
- **Database**: PostgreSQL 12+ (SQLite for development only)
- **Web Server**: Nginx (recommended) or Apache
- **SSL Certificate**: Let's Encrypt or commercial SSL
- **Domain**: Registered domain with DNS access

### Service Requirements
- **Email Service**: SendGrid, Mailgun, or SMTP server
- **Hosting**: 
  - Frontend: Vercel, Netlify, or static hosting
  - Backend: Railway, Heroku, DigitalOcean, AWS, or VPS

---

## Development Environment Setup

### Prerequisites Installation

#### 1. Install Node.js (if not already installed)
```bash
# macOS with Homebrew
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows - Download from nodejs.org
```

#### 2. Install Python (if not already installed)
```bash
# macOS with Homebrew
brew install python

# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Windows - Download from python.org
```

#### 3. Verify Installations
```bash
node --version    # Should be 18.0+
python3 --version # Should be 3.8+
pip3 --version
```

### Project Setup

#### 1. Clone or Setup Project Structure
```bash
# If using git
git clone <repository-url>
cd mrc-lead-management

# Or create directory structure
mkdir mrc-lead-management
cd mrc-lead-management
mkdir backend frontend
```

#### 2. Backend Setup
```bash
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env  # If available, or create manually
```

#### 3. Backend Environment Configuration (.env)
Create `/backend/.env` file:
```env
# Development Configuration
SECRET_KEY=dev-secret-key-change-in-production-mrc
JWT_SECRET_KEY=jwt-secret-key-change-in-production-mrc
DATABASE_URL=sqlite:///mrc_auth.db

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Email Configuration (Optional for development)
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your_sendgrid_username
MAIL_PASSWORD=your_sendgrid_password
MAIL_DEFAULT_SENDER=noreply@mouldrestoration.com.au

# Security Settings
JWT_COOKIE_SECURE=false
```

#### 4. Database Initialization
```bash
# Initialize database and run migrations
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"

# Or using Flask CLI (if configured)
flask db upgrade

# Create initial user (Michael)
python -c "
from app import create_app, db
from app.models import User
app = create_app()
with app.app_context():
    # Check if user exists
    user = User.query.filter_by(email='michaelyoussef396@gmail.com').first()
    if not user:
        user = User(
            username='michael',
            email='michaelyoussef396@gmail.com',
            full_name='Michael Rodriguez',
            phone='+61 400 123 458'
        )
        user.set_password('AdminMike123!')
        db.session.add(user)
        db.session.commit()
        print('Initial user created successfully')
    else:
        print('User already exists')
"
```

#### 5. Frontend Setup
```bash
cd ../frontend

# Install Node.js dependencies
npm install

# Create environment file (if needed)
# Create .env.local if environment-specific configuration required
```

#### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows
python app.py

# Backend will start on http://localhost:5001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev

# Frontend will start on http://localhost:3000
```

#### 7. Verify Installation
1. Visit `http://localhost:3000`
2. You should see the MRC login page
3. Login with:
   - Email: `michaelyoussef396@gmail.com`
   - Password: `AdminMike123!`
4. Verify authentication and navigation to dashboard

---

## Production Deployment

### Frontend Deployment (Vercel - Recommended)

#### 1. Prepare Frontend for Production
```bash
cd frontend

# Update environment configuration for production
# Create .env.production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Build and test production build
npm run build
npm run start  # Test production build locally
```

#### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set environment variables in Vercel dashboard
# - Verify deployment
```

#### 3. Configure Custom Domain (Optional)
1. Add domain in Vercel dashboard
2. Configure DNS records
3. SSL is automatically handled by Vercel

### Backend Deployment Options

#### Option 1: Railway (Recommended for MVP)

**1. Prepare Backend**
```bash
cd backend

# Create Procfile for Railway
echo "web: gunicorn app:app" > Procfile

# Create runtime.txt (optional)
echo "python-3.10.12" > runtime.txt

# Ensure requirements.txt is current
pip freeze > requirements.txt
```

**2. Deploy to Railway**
1. Create account at railway.app
2. Connect GitHub repository or deploy from CLI
3. Set environment variables in Railway dashboard
4. Database will be provisioned automatically

**Environment Variables for Railway:**
```env
SECRET_KEY=your-production-secret-key-here-make-it-long-and-random
JWT_SECRET_KEY=your-production-jwt-secret-key-here-make-it-long-and-random
DATABASE_URL=postgresql://user:pass@host:port/db  # Auto-provided by Railway
CORS_ORIGINS=https://yourdomain.com
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your_sendgrid_username
MAIL_PASSWORD=your_sendgrid_api_key
MAIL_DEFAULT_SENDER=noreply@yourdomain.com
JWT_COOKIE_SECURE=true
```

#### Option 2: VPS Deployment (DigitalOcean, AWS, etc.)

**1. Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install python3 python3-pip python3-venv postgresql postgresql-contrib nginx certbot python3-certbot-nginx git

# Create application user
sudo adduser mrc
sudo usermod -aG sudo mrc
su - mrc
```

**2. Application Setup**
```bash
# Clone application
git clone <your-repo> mrc-app
cd mrc-app/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

**3. PostgreSQL Setup**
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE mrc_production;
CREATE USER mrc_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE mrc_production TO mrc_user;
\q
```

**4. Environment Configuration**
```bash
# Create production environment file
nano /home/mrc/mrc-app/backend/.env
```
```env
SECRET_KEY=your-production-secret-key-256-bit-random
JWT_SECRET_KEY=your-production-jwt-secret-key-256-bit-random  
DATABASE_URL=postgresql://mrc_user:secure_password_here@localhost/mrc_production
CORS_ORIGINS=https://yourdomain.com
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=apikey
MAIL_PASSWORD=your_sendgrid_api_key
MAIL_DEFAULT_SENDER=noreply@yourdomain.com
JWT_COOKIE_SECURE=true
```

**5. Database Migration**
```bash
# Run database migrations
source venv/bin/activate
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"

# Create initial user
python -c "
from app import create_app, db
from app.models import User
app = create_app()
with app.app_context():
    user = User(
        username='michael',
        email='michaelyoussef396@gmail.com',
        full_name='Michael Rodriguez',
        phone='+61 400 123 458'
    )
    user.set_password('AdminMike123!')
    db.session.add(user)
    db.session.commit()
    print('User created')
"
```

**6. Systemd Service Setup**
```bash
# Create systemd service
sudo nano /etc/systemd/system/mrc-backend.service
```
```ini
[Unit]
Description=MRC Backend
After=network.target

[Service]
User=mrc
WorkingDirectory=/home/mrc/mrc-app/backend
Environment=PATH=/home/mrc/mrc-app/backend/venv/bin
EnvironmentFile=/home/mrc/mrc-app/backend/.env
ExecStart=/home/mrc/mrc-app/backend/venv/bin/gunicorn --workers 3 --bind unix:mrc.sock -m 007 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable mrc-backend
sudo systemctl start mrc-backend
sudo systemctl status mrc-backend
```

**7. Nginx Configuration**
```bash
# Create Nginx site configuration
sudo nano /etc/nginx/sites-available/mrc-backend
```
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/mrc/mrc-app/backend/mrc.sock;
        
        # CORS headers for production
        add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;
    }
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/mrc-backend /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

**8. SSL Certificate**
```bash
# Install SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Environment Configuration

### Environment Variables Reference

#### Development (.env)
```env
# Security Keys (Use random values in production)
SECRET_KEY=dev-secret-key-change-in-production-mrc
JWT_SECRET_KEY=jwt-secret-key-change-in-production-mrc

# Database
DATABASE_URL=sqlite:///mrc_auth.db

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# JWT Settings
JWT_COOKIE_SECURE=false

# Email (Optional for development)
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_DEFAULT_SENDER=noreply@localhost
```

#### Production (.env.production)
```env
# Security Keys (MUST be unique and secure)
SECRET_KEY=your-256-bit-random-secret-key-for-production-use-only
JWT_SECRET_KEY=your-256-bit-random-jwt-secret-key-for-production-use-only

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://username:password@host:port/database_name

# CORS Configuration (Production domains only)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# JWT Settings (Secure cookies in production)
JWT_COOKIE_SECURE=true

# Email Configuration (Required for password reset)
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=apikey
MAIL_PASSWORD=your_sendgrid_api_key
MAIL_DEFAULT_SENDER=noreply@yourdomain.com
```

### Generating Secure Keys

**Python method:**
```python
import secrets
print("SECRET_KEY:", secrets.token_urlsafe(64))
print("JWT_SECRET_KEY:", secrets.token_urlsafe(64))
```

**Command line method:**
```bash
# Generate random keys
openssl rand -hex 64  # For SECRET_KEY
openssl rand -hex 64  # For JWT_SECRET_KEY
```

---

## Database Setup

### Development Database (SQLite)
- **File Location**: `backend/mrc_auth.db`
- **Automatic Creation**: Database created on first run
- **Migration**: Use Flask-Migrate for schema changes

### Production Database (PostgreSQL)

#### Local PostgreSQL Setup
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE mrc_production;
CREATE USER mrc_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mrc_production TO mrc_user;
ALTER USER mrc_user CREATEDB;  # For running tests
\q
```

#### Hosted PostgreSQL (Railway, Heroku, etc.)
- Database URL provided automatically
- Set `DATABASE_URL` environment variable
- Migrations run automatically on deployment

#### Database Migration
```bash
# Development
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"

# Production (using Flask-Migrate)
flask db init      # First time only
flask db migrate -m "Initial migration"
flask db upgrade
```

---

## Security Configuration

### SSL/TLS Configuration

#### Development
- No SSL required
- JWT cookies set to `Secure=false`

#### Production
- **SSL Certificate Required** (Let's Encrypt recommended)
- JWT cookies set to `Secure=true`
- All HTTP traffic redirected to HTTPS

### Firewall Configuration
```bash
# Basic UFW setup for Ubuntu
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432  # PostgreSQL (only if external access needed)
```

### Security Headers
The application automatically sets these security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`: Comprehensive CSP rules

### Rate Limiting
- **Login endpoint**: 50 requests per minute
- **Password reset**: 5 requests per minute
- **General endpoints**: 50 requests per minute

### Account Security
- **Progressive lockout**: 5 min → 15 min → 1 hr → 24 hr max
- **Password requirements**: 8+ chars, mixed case, numbers, special chars
- **Security logging**: All authentication events logged

---

## Testing Procedures

### Pre-Deployment Testing

#### 1. Backend API Testing
```bash
# Test authentication endpoint
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "michaelyoussef396@gmail.com", "password": "AdminMike123!"}' \
  -c cookies.txt -v

# Test protected endpoint
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt -v

# Test profile update
curl -X PUT http://localhost:5001/api/auth/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"full_name": "Michael Rodriguez Updated"}'

# Test logout
curl -X POST http://localhost:5001/api/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

#### 2. Frontend Testing Checklist
- [ ] Login page loads correctly
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials shows error
- [ ] Dashboard displays after login
- [ ] Settings page accessible
- [ ] Profile update functionality works
- [ ] Add technician functionality works
- [ ] Logout functionality works
- [ ] Responsive design on mobile (375px)
- [ ] Responsive design on tablet (768px)
- [ ] No console errors in browser

#### 3. Security Testing
```bash
# Test rate limiting (should get 429 after 50 requests)
for i in {1..60}; do
  curl -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test", "password": "test"}' &
done

# Test account lockout (should lock after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "michaelyoussef396@gmail.com", "password": "wrong"}'
done
```

### Production Testing

#### 1. SSL Certificate Verification
```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Test with curl
curl -I https://api.yourdomain.com/api/auth/profile
```

#### 2. Performance Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API performance
ab -n 1000 -c 10 https://api.yourdomain.com/api/auth/profile
```

#### 3. Cross-browser Testing
Test on:
- Chrome (desktop + mobile)
- Safari (desktop + mobile)
- Firefox (desktop)
- Edge (desktop)

---

## Monitoring & Maintenance

### Log Monitoring

#### Application Logs
```bash
# View backend logs (systemd service)
sudo journalctl -u mrc-backend -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### Security Event Monitoring
Security events are logged in the application logs:
```
SECURITY: LOGIN_SUCCESS - User:1(michael) IP:127.0.0.1
SECURITY: LOGIN_FAILED - User:1(michael) IP:127.0.0.1 Attempts:1
SECURITY: ACCOUNT_LOCKED - User:1(michael) IP:127.0.0.1 Attempts:5 Duration:5min
```

### Database Backup

#### SQLite Backup (Development)
```bash
# Backup SQLite database
cp backend/mrc_auth.db backup/mrc_auth_$(date +%Y%m%d_%H%M%S).db
```

#### PostgreSQL Backup (Production)
```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/home/mrc/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U mrc_user mrc_production > $BACKUP_DIR/mrc_backup_$DATE.sql

# Schedule with cron
crontab -e
# Add: 0 2 * * * /home/mrc/backup_script.sh
```

### System Updates

#### Application Updates
```bash
# Backend updates
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
sudo systemctl restart mrc-backend

# Frontend updates (if self-hosted)
cd frontend
npm update
npm run build
```

#### System Security Updates
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo reboot  # If kernel updated

# Check for security updates
unattended-upgrades --dry-run
```

### Performance Monitoring

#### Basic Monitoring Commands
```bash
# System resources
htop
df -h
free -h

# Network connections
netstat -tuln

# Service status
systemctl status mrc-backend
systemctl status nginx
systemctl status postgresql
```

#### Log Rotation
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/mrc-backend
```
```
/var/log/mrc/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    create 644 mrc mrc
    postrotate
        systemctl reload mrc-backend
    endscript
}
```

---

## Troubleshooting

### Common Issues

#### Backend Won't Start

**Symptom**: Python application fails to start
```bash
# Check logs
sudo journalctl -u mrc-backend -f

# Common solutions:
# 1. Check environment file exists and is readable
ls -la backend/.env

# 2. Verify virtual environment
source venv/bin/activate
which python

# 3. Check database connectivity
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); print('DB OK')"

# 4. Check dependencies
pip check
```

#### Database Connection Issues

**Symptoms**: 
- `sqlalchemy.exc.OperationalError`
- `psycopg2.OperationalError`

```bash
# PostgreSQL troubleshooting
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

# Check database exists
sudo -u postgres psql -l

# Test connection with environment URL
python -c "
import os
from sqlalchemy import create_engine
engine = create_engine(os.getenv('DATABASE_URL'))
print('Connection test:', engine.execute('SELECT 1').scalar())
"
```

#### Frontend Build Issues

**Symptoms**:
- Build failures
- Missing dependencies

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for version conflicts
npm audit
npm audit fix

# Build with verbose output
npm run build --verbose
```

#### CORS Issues

**Symptoms**:
- API calls blocked in browser
- CORS policy errors

```bash
# Check CORS configuration
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://api.yourdomain.com/api/auth/login -v
```

#### SSL Certificate Issues

**Symptoms**:
- Certificate warnings
- Mixed content errors

```bash
# Check certificate status
certbot certificates

# Renew certificate
sudo certbot renew

# Test certificate
curl -I https://yourdomain.com
```

### Performance Issues

#### Slow API Response Times

**Diagnosis**:
```bash
# Check system resources
htop
iostat

# Check database performance
# For PostgreSQL:
sudo -u postgres psql mrc_production -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"
```

**Solutions**:
- Add database indexes
- Optimize queries
- Increase server resources
- Enable database connection pooling

#### High Memory Usage

**Diagnosis**:
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Check for memory leaks
valgrind --leak-check=yes python app.py
```

### Recovery Procedures

#### Database Recovery
```bash
# From backup (PostgreSQL)
sudo -u postgres psql
DROP DATABASE mrc_production;
CREATE DATABASE mrc_production;
\q

sudo -u postgres psql mrc_production < backup_file.sql
```

#### Service Recovery
```bash
# Restart all services
sudo systemctl restart mrc-backend
sudo systemctl restart nginx
sudo systemctl restart postgresql

# Check service status
sudo systemctl status mrc-backend --no-pager -l
```

#### Emergency Rollback
```bash
# Git rollback (if using git deployment)
git log --oneline -10
git reset --hard <previous_commit_hash>
sudo systemctl restart mrc-backend

# Manual rollback
cp -r /backup/previous_version/* /home/mrc/mrc-app/
sudo systemctl restart mrc-backend
```

---

## Post-Deployment Checklist

### Immediate Post-Deployment

- [ ] **Frontend accessible** at production URL
- [ ] **Backend API responding** at API URL
- [ ] **SSL certificate** working correctly
- [ ] **Login functionality** working with test account
- [ ] **Database connections** stable
- [ ] **Email service** configured (if implemented)
- [ ] **Security headers** present in responses
- [ ] **Rate limiting** functioning correctly
- [ ] **Error logging** working and accessible

### First 24 Hours

- [ ] **Monitor error logs** for unexpected issues
- [ ] **Check performance metrics** (response times, memory usage)
- [ ] **Test user registration** (add technician functionality)
- [ ] **Verify backup systems** are running
- [ ] **Monitor security logs** for suspicious activity
- [ ] **Test from different networks/devices**

### First Week

- [ ] **Performance optimization** based on real usage
- [ ] **User feedback collection** and issue resolution
- [ ] **Monitoring setup** for ongoing maintenance
- [ ] **Documentation updates** based on deployment experience
- [ ] **Team training** on production environment

---

## Support and Maintenance

### Regular Maintenance Tasks

**Daily**:
- Check error logs
- Monitor system resources
- Verify backup completion

**Weekly**:
- Review security logs
- Update system packages
- Performance analysis

**Monthly**:
- Security audit
- Database optimization
- SSL certificate renewal check

### Emergency Contacts

- **System Administrator**: [Contact Information]
- **Development Team**: [Contact Information]
- **Hosting Provider Support**: [Contact Information]
- **Domain Registrar**: [Contact Information]

---

## Future Considerations

### Scalability Planning

**Phase 2 Requirements**:
- Increased database load for lead management
- File upload/storage capabilities
- Potential API rate limit adjustments
- Additional security measures for customer data

**Scaling Options**:
- Database read replicas
- CDN for static assets
- Load balancer for multiple backend instances
- Container orchestration (Docker + Kubernetes)

### Monitoring Enhancements

**Recommended Tools**:
- **Application Monitoring**: Sentry, New Relic, or Datadog
- **Log Management**: ELK Stack or Splunk
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Performance Monitoring**: Google Analytics, Lighthouse CI

---

*Deployment Guide Version: 1.0*  
*Last Updated: September 5, 2025*  
*Next Review: Before Phase 2 Deployment*