# EducBlue Backend - Production Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- MongoDB instance (local or cloud)
- Environment variables configured

## Quick Start

### 1. Environment Setup

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`:

   ```env
   # Database
   MONGO_URI=mongodb://your-mongo-host:27017/educblue

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d

   # Stripe
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here

   # CORS
   APP_URL=https://yourdomain.com

   # Server
   NODE_ENV=production
   PORT=5000

   # Email (Resend)
   RESEND_API_KEY=your_resend_api_key_here
   ```

### 2. Production Build

#### Option A: Using Docker Compose (Recommended)

```bash
# Build and run in production mode
docker-compose --profile prod up -d

# Check logs
docker-compose logs -f app-prod

# Stop services
docker-compose --profile prod down
```

#### Option B: Using Build Scripts

```bash
# On Windows (PowerShell)
.\build.ps1

# On Linux/Mac
chmod +x build.sh
./build.sh
```

#### Option C: Manual Build

```bash
# Install production dependencies
npm ci --production

# Build Docker image
docker build -t educblue-backend:latest .

# Run container
docker run -d \
  --name educblue-backend \
  -p 5000:5000 \
  --env-file .env \
  educblue-backend:latest
```

### 3. Development Mode

```bash
# Run in development mode with hot reload
docker-compose --profile dev up

# Or run locally
npm run dev
```

## Production Considerations

### Security

- [ ] Use strong JWT secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS origins
- [ ] Use production MongoDB credentials
- [ ] Enable MongoDB authentication
- [ ] Set up proper firewall rules
- [ ] Use environment variables for all secrets

### Performance

- [ ] Use a process manager (PM2 or Docker)
- [ ] Configure MongoDB indexes
- [ ] Set up database connection pooling
- [ ] Enable gzip compression
- [ ] Configure rate limiting
- [ ] Set up caching (Redis)

### Monitoring

- [ ] Set up application logs
- [ ] Configure health checks
- [ ] Monitor database performance
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring

### Scaling

- [ ] Use load balancer (Nginx)
- [ ] Configure database replication
- [ ] Set up horizontal scaling
- [ ] Use CDN for static assets

## Deployment Options

### 1. Docker Deployment

Best for containerized environments (AWS ECS, Google Cloud Run, etc.)

### 2. Traditional Server Deployment

```bash
# Install dependencies
npm ci --production

# Use PM2 for process management
npm install -g pm2

# Start application
pm2 start index.js --name educblue-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

### 3. Cloud Platform Deployment

#### AWS ECS

- Use the provided Dockerfile
- Configure task definition
- Set up Application Load Balancer
- Configure RDS for MongoDB or use DocumentDB

#### Google Cloud Run

- Build and push image to Google Container Registry
- Deploy to Cloud Run
- Configure Cloud SQL or MongoDB Atlas

#### Azure Container Instances

- Build and push image to Azure Container Registry
- Deploy to Container Instances
- Configure Cosmos DB for MongoDB

#### Heroku

1. Create `Procfile`:
   ```
   web: npm start
   ```
2. Deploy using Heroku CLI:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

### 4. Database Setup

#### MongoDB Atlas (Recommended)

1. Create cluster at mongodb.com
2. Configure network access
3. Create database user
4. Update MONGO_URI in .env

#### Self-hosted MongoDB

1. Install MongoDB
2. Configure authentication
3. Set up regular backups
4. Configure replica set for high availability

## Health Checks

The application includes a health check endpoint at `/api/health`:

```bash
# Check application health
curl http://localhost:5000/api/health
```

Response:

```json
{
  "status": "OK",
  "timestamp": "2023-12-07T10:00:00.000Z",
  "environment": "production"
}
```

## Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Find process using port 5000
   lsof -i :5000
   # Kill process
   kill -9 <PID>
   ```

2. **MongoDB connection issues**

   - Check MONGO_URI format
   - Verify network connectivity
   - Check authentication credentials

3. **Environment variables not loaded**

   - Ensure .env file exists
   - Check file permissions
   - Verify dotenv is loaded in index.js

4. **Docker build failures**
   - Check Docker daemon is running
   - Verify Dockerfile syntax
   - Check .dockerignore configuration

### Logs

```bash
# Docker logs
docker logs educblue-backend

# PM2 logs
pm2 logs educblue-backend

# System logs
journalctl -u your-service-name
```

## Backup and Recovery

### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb://your-mongo-uri" --out=./backup

# Restore
mongorestore --uri="mongodb://your-mongo-uri" ./backup
```

### Application Backup

- Environment configuration (.env)
- Application code
- SSL certificates
- Log files

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure HTTP headers
- [ ] Validate all input data
- [ ] Use parameterized queries
- [ ] Implement rate limiting
- [ ] Set up proper authentication
- [ ] Use environment variables for secrets
- [ ] Keep dependencies updated
- [ ] Configure proper CORS
- [ ] Use security middleware (helmet.js)

## Performance Optimization

- [ ] Enable gzip compression
- [ ] Use connection pooling
- [ ] Implement caching strategies
- [ ] Optimize database queries
- [ ] Use CDN for static assets
- [ ] Configure proper indexes
- [ ] Monitor and profile performance
- [ ] Use clustering for CPU-intensive tasks
