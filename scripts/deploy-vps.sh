#!/bin/bash

###############################################################################
# OncoLiving VPS Deployment Script
# 
# This script automates the complete deployment process:
# - MySQL installation and configuration
# - Node.js and pnpm installation
# - Repository cloning
# - Environment setup
# - Database migrations
# - Application build and start
###############################################################################

set -e  # Exit on error

echo "========================================="
echo "OncoLiving VPS Deployment"
echo "========================================="
echo ""

# Configuration
REPO_URL="https://github.com/vitordsb/movimento-para-cura.git"
APP_DIR="/var/www/oncoliving"
DB_NAME="mpcdb"
DB_USER="root"
DB_PASSWORD="senha123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  log_error "Please run as root (use sudo)"
  exit 1
fi

echo "📦 Step 1: Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

echo ""
echo "📥 Step 2: Installing MySQL Server..."
if ! command -v mysql &> /dev/null; then
    DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server
    log_info "MySQL installed"
else
    log_warn "MySQL already installed"
fi

echo ""
echo "🔧 Step 3: Configuring MySQL..."
systemctl start mysql
systemctl enable mysql

# Set root password and create database
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD}';" 2>/dev/null || true
mysql -u${DB_USER} -p${DB_PASSWORD} -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u${DB_USER} -p${DB_PASSWORD} -e "FLUSH PRIVILEGES;"
log_info "MySQL configured"

echo ""
echo "📥 Step 4: Installing Node.js and pnpm..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    log_info "Node.js installed"
else
    log_warn "Node.js already installed"
fi

if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
    log_info "pnpm installed"
else
    log_warn "pnpm already installed"
fi

echo ""
echo "📥 Step 5: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
    log_info "PM2 installed"
else
    log_warn "PM2 already installed"
fi

echo ""
echo "📥 Step 6: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl enable nginx
    log_info "Nginx installed"
else
    log_warn "Nginx already installed"
fi

echo ""
echo "📂 Step 7: Cloning repository..."
if [ -d "$APP_DIR" ]; then
    log_warn "Directory exists, pulling latest changes..."
    cd $APP_DIR
    git pull origin master
else
    git clone $REPO_URL $APP_DIR
    log_info "Repository cloned"
fi

cd $APP_DIR

echo ""
echo "📦 Step 8: Installing dependencies..."
pnpm install --frozen-lockfile
log_info "Dependencies installed"

echo ""
echo "🔐 Step 9: Setting up environment variables..."
cat > .env <<EOF
# Database Configuration
DATABASE_URL="mysql://root:senha123@localhost:3306/mpcdb"

# Application configuration
VITE_APP_ID=oncoliving-production
JWT_SECRET=$(openssl rand -base64 64)
OAUTH_SERVER_URL=https://andressasemionatto.com.br
OWNER_OPEN_ID=owner-production
VITE_OAUTH_PORTAL_URL=https://andressasemionatto.com.br
VITE_DEV_LOCAL_AUTH=false

# Asaas Payment Gateway
ASAAS_API_KEY=\$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmVkNDRhNTUxLTc5YzEtNDc3MS05NDNlLWU0OWIxOTFlMzUyYTo6JGFhY2hfNzM2NjA0OTItOGVjNC00ODIyLWI2NjQtMWNhNTE4N2Y4YTQ4
ASAAS_ENVIRONMENT=sandbox

# Server settings
PORT=3000
NODE_ENV=production
EOF
log_info "Environment configured"

echo ""
echo "🗄️  Step 10: Running database migrations..."
npx prisma generate
npx prisma migrate deploy
log_info "Migrations completed"

echo ""
echo "🌱 Step 11: Seeding database..."
pnpm run seed || log_warn "Seed failed (may already be seeded)"

echo ""
echo "🏗️  Step 12: Building application..."
pnpm run build
log_info "Build completed"

echo ""
echo "🚀 Step 13: Starting application with PM2..."
pm2 delete oncoliving 2>/dev/null || true
pm2 start npm --name "oncoliving" -- start
pm2 save
log_info "Application started"

echo ""
echo "🌐 Step 14: Configuring Nginx..."
cat > /etc/nginx/sites-available/oncoliving <<'NGINX_EOF'
server {
    listen 80;
    server_name andressasemionatto.com.br www.andressasemionatto.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/oncoliving /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
log_info "Nginx configured"

echo ""
echo "🔒 Step 15: Installing SSL certificate..."
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
fi
certbot --nginx -d andressasemionatto.com.br -d www.andressasemionatto.com.br --non-interactive --agree-tos --email admin@andressasemionatto.com.br || log_warn "SSL setup failed (may need manual configuration)"

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "📋 Application Details:"
echo "   URL: https://andressasemionatto.com.br"
echo "   Directory: $APP_DIR"
echo "   Database: $DB_NAME"
echo ""
echo "🔍 Useful Commands:"
echo "   - View logs: pm2 logs oncoliving"
echo "   - Restart app: pm2 restart oncoliving"
echo "   - Check status: pm2 status"
echo "   - Nginx logs: tail -f /var/log/nginx/error.log"
echo "   - MySQL: mysql -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME}"
echo ""
echo "🎉 Your application is now live!"
echo ""
