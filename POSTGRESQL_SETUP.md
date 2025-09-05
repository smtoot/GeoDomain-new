# 🐘 PostgreSQL Infrastructure Setup Guide

## **Overview**
This guide will help you set up the PostgreSQL infrastructure for GeoDomainLand, including database migration, connection pooling, caching, and monitoring.

---

## **🚀 Quick Start (Docker)**

### **1. Install Docker**
If you don't have Docker installed, download it from [docker.com](https://docker.com)

### **2. Start Infrastructure Services**
```bash
# Start PostgreSQL, Redis, and pgAdmin
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f
```

### **3. Update Environment Variables**
Copy the PostgreSQL configuration to your `.env.local`:

```bash
# Copy the PostgreSQL environment template
cp .env.postgresql .env.local

# Or manually update your .env.local with:
DATABASE_URL="postgresql://geodomain:secure_password_2024@localhost:5432/geodomainland"
DIRECT_URL="postgresql://geodomain:secure_password_2024@localhost:5432/geodomainland"
REDIS_URL="redis://:redis_password_2024@localhost:6379"
```

### **4. Run Database Migration**
```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Push the schema to PostgreSQL
npx prisma db push

# (Optional) Create a migration
npx prisma migrate dev --name init-postgresql
```

---

## **🔧 Manual Setup (Without Docker)**

### **1. Install PostgreSQL**
```bash
# macOS (using Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### **2. Install Redis**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### **3. Create Database and User**
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE geodomainland;
CREATE USER geodomain WITH PASSWORD 'secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE geodomainland TO geodomain;
ALTER USER geodomain CREATEDB;
\q
```

### **4. Configure Redis**
```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Add password
requirepass redis_password_2024

# Restart Redis
sudo systemctl restart redis
```

---

## **📊 Access Points**

### **PostgreSQL Database**
- **Host**: localhost
- **Port**: 5432
- **Database**: geodomainland
- **Username**: geodomain
- **Password**: secure_password_2024

### **Redis Cache**
- **Host**: localhost
- **Port**: 6379
- **Password**: redis_password_2024

### **pgAdmin (Web Interface)**
- **URL**: http://localhost:8080
- **Email**: admin@geodomainland.com
- **Password**: admin_password_2024

---

## **🧪 Testing the Setup**

### **1. Test Database Connection**
```bash
# Test with Prisma
npx prisma db seed

# Or test manually
psql -h localhost -U geodomain -d geodomainland -c "SELECT version();"
```

### **2. Test Redis Connection**
```bash
# Test Redis
redis-cli -a redis_password_2024 ping
```

### **3. Test Health Endpoints**
```bash
# Health check
curl http://localhost:3000/api/health/check

# Monitoring stats
curl http://localhost:3000/api/monitoring/stats
```

---

## **🔍 Troubleshooting**

### **Common Issues**

#### **PostgreSQL Connection Failed**
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Test connection
psql -h localhost -U geodomain -d geodomainland
```

#### **Redis Connection Failed**
```bash
# Check if Redis is running
docker compose ps redis

# Check logs
docker compose logs redis

# Test connection
redis-cli -a redis_password_2024 ping
```

#### **Port Already in Use**
```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :8080  # pgAdmin

# Kill the process or change ports in docker-compose.yml
```

### **Reset Everything**
```bash
# Stop and remove all containers
docker compose down -v

# Remove volumes
docker volume rm geodomain-new_postgres_data
docker volume rm geodomain-new_redis_data
docker volume rm geodomain-new_pgadmin_data

# Start fresh
docker compose up -d
```

---

## **📈 Performance Optimization**

### **PostgreSQL Tuning**
```sql
-- Check current settings
SHOW max_connections;
SHOW shared_buffers;
SHOW effective_cache_size;

-- Recommended settings for development
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
```

### **Redis Tuning**
```bash
# Redis configuration optimizations
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

---

## **🔐 Security Considerations**

### **Production Deployment**
- Change default passwords
- Use environment variables for secrets
- Enable SSL for database connections
- Restrict network access
- Regular security updates

### **Environment Variables**
```bash
# Production environment
NODE_ENV=production
LOG_LEVEL=warn
DATABASE_SSL=true
REDIS_TLS=true
```

---

## **📚 Next Steps**

After completing this setup:

1. **Test the application** with the new infrastructure
2. **Monitor performance** using the monitoring endpoints
3. **Implement caching** in your API routes
4. **Set up backups** for PostgreSQL
5. **Configure logging** for production

---

## **📞 Support**

If you encounter issues:

1. Check the logs: `docker compose logs -f`
2. Verify environment variables
3. Test individual services
4. Check the troubleshooting section above

---

**🎉 Congratulations!** You now have a production-ready PostgreSQL infrastructure with Redis caching and comprehensive monitoring.
