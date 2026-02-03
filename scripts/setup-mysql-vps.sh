#!/bin/bash

###############################################################################
# MySQL Setup Script for OncoLiving VPS
# 
# This script automates MySQL installation and database setup on Ubuntu/Debian
# 
# Database Configuration:
#   - Database: mpcdb
#   - User: root
#   - Password: senha123
#   - Host: localhost
#
# Usage: sudo bash setup-mysql-vps.sh
###############################################################################

set -e  # Exit on error

echo "========================================="
echo "OncoLiving MySQL VPS Setup"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Database configuration
DB_NAME="mpcdb"
DB_USER="root"
DB_PASSWORD="senha123"
DB_HOST="localhost"

echo "📦 Updating system packages..."
apt-get update -qq

echo "📥 Installing MySQL Server..."
DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server

echo "🔧 Starting MySQL service..."
systemctl start mysql
systemctl enable mysql

echo "🔐 Configuring MySQL root password..."
# Set root password
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD}';"
mysql -e "FLUSH PRIVILEGES;"

echo "🗄️  Creating database '${DB_NAME}'..."
mysql -u${DB_USER} -p${DB_PASSWORD} -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "✅ Granting privileges..."
mysql -u${DB_USER} -p${DB_PASSWORD} -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'${DB_HOST}';"
mysql -u${DB_USER} -p${DB_PASSWORD} -e "FLUSH PRIVILEGES;"

echo "🔒 Securing MySQL installation..."
# Remove anonymous users
mysql -u${DB_USER} -p${DB_PASSWORD} -e "DELETE FROM mysql.user WHERE User='';"
# Disallow root login remotely (for security)
mysql -u${DB_USER} -p${DB_PASSWORD} -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
# Remove test database
mysql -u${DB_USER} -p${DB_PASSWORD} -e "DROP DATABASE IF EXISTS test;"
mysql -u${DB_USER} -p${DB_PASSWORD} -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
mysql -u${DB_USER} -p${DB_PASSWORD} -e "FLUSH PRIVILEGES;"

echo "📝 Creating MySQL configuration file..."
cat > /etc/mysql/conf.d/oncoliving.cnf <<EOF
[mysqld]
# OncoLiving MySQL Configuration

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Performance tuning
max_connections = 200
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M

# Security
bind-address = 127.0.0.1
skip-name-resolve

# Logging
log_error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
EOF

echo "🔄 Restarting MySQL..."
systemctl restart mysql

echo "✅ Testing database connection..."
if mysql -u${DB_USER} -p${DB_PASSWORD} -e "USE ${DB_NAME}; SELECT 'Connection successful!' AS status;" > /dev/null 2>&1; then
  echo "✅ Database connection test passed!"
else
  echo "❌ Database connection test failed!"
  exit 1
fi

echo ""
echo "========================================="
echo "✅ MySQL Setup Complete!"
echo "========================================="
echo ""
echo "📋 Database Information:"
echo "   Database: ${DB_NAME}"
echo "   User: ${DB_USER}"
echo "   Password: ${DB_PASSWORD}"
echo "   Host: ${DB_HOST}"
echo ""
echo "🔗 Connection String:"
echo "   DATABASE_URL=\"mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:3306/${DB_NAME}\""
echo ""
echo "📝 Next Steps:"
echo "   1. Add DATABASE_URL to your .env file"
echo "   2. Run: npx prisma migrate deploy"
echo "   3. Run: pnpm run seed (if needed)"
echo ""
echo "🔍 Useful Commands:"
echo "   - Check MySQL status: systemctl status mysql"
echo "   - View logs: tail -f /var/log/mysql/error.log"
echo "   - Connect to MySQL: mysql -u${DB_USER} -p${DB_PASSWORD}"
echo ""
