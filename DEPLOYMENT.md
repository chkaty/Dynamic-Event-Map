# Deployment Guide

This guide covers deploying Dynamic Event Map to various environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Compose Deployment](#docker-compose-deployment)
- [Docker Swarm Deployment](#docker-swarm-deployment)
- [DigitalOcean Deployment](#digitalocean-deployment)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development)
- Git

### Required Accounts
- GitHub account (for CI/CD)
- DigitalOcean account (for Spaces storage)
- Container registry access (GitHub Container Registry or Docker Hub)

## Local Development

1. **Clone and setup**
   ```bash
   git clone https://github.com/chkaty/Dynamic-Event-Map.git
   cd Dynamic-Event-Map
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

3. **Start development services**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose up -d postgres redis
   
   # Run the app in development mode
   npm run dev
   ```

4. **Access the application**
   - Web UI: http://localhost:3000
   - API Docs: http://localhost:3000/api/events

## Docker Compose Deployment

Best for single-server deployments and testing.

1. **Prepare environment**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Build and start all services**
   ```bash
   docker-compose up -d --build
   ```

3. **Verify deployment**
   ```bash
   docker-compose ps
   docker-compose logs -f app
   curl http://localhost:3000/health
   ```

4. **Scale the application**
   ```bash
   docker-compose up -d --scale app=3
   ```

## Docker Swarm Deployment

Best for production multi-node deployments.

### Initial Setup

1. **Initialize Swarm on manager node**
   ```bash
   docker swarm init --advertise-addr <MANAGER-IP>
   ```

2. **Add worker nodes**
   ```bash
   # On manager, get join token
   docker swarm join-token worker
   
   # On each worker, run the join command shown above
   docker swarm join --token <TOKEN> <MANAGER-IP>:2377
   ```

3. **Verify cluster**
   ```bash
   docker node ls
   ```

### Deploy Application

1. **Set environment variables**
   ```bash
   export POSTGRES_PASSWORD=your_secure_password
   export SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
   export SPACES_BUCKET=your-bucket-name
   export SPACES_ACCESS_KEY_ID=your_access_key
   export SPACES_SECRET_ACCESS_KEY=your_secret_key
   export REGISTRY_URL=ghcr.io/chkaty
   export VERSION=latest
   ```

2. **Deploy stack**
   ```bash
   docker stack deploy -c docker-compose.swarm.yml event-map
   ```

3. **Monitor deployment**
   ```bash
   docker stack services event-map
   docker service ls
   docker service logs -f event-map_app
   ```

4. **Scale services**
   ```bash
   docker service scale event-map_app=5
   ```

### Update Deployment

1. **Update image**
   ```bash
   docker service update --image ghcr.io/chkaty/dynamic-event-map:v2.0 event-map_app
   ```

2. **Rolling update**
   ```bash
   docker service update --update-parallelism 1 --update-delay 10s event-map_app
   ```

## DigitalOcean Deployment

### Setup DigitalOcean Spaces

1. **Create a Space**
   - Go to DigitalOcean Spaces
   - Create a new Space
   - Note the endpoint URL and bucket name

2. **Generate API Keys**
   - Go to API > Spaces Keys
   - Generate new key pair
   - Save access key and secret key securely

3. **Configure CORS (optional)**
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3000
       }
     ]
   }
   ```

### Setup DigitalOcean Droplets

1. **Create Droplets**
   - Create 3 droplets (1 manager, 2 workers)
   - Ubuntu 22.04 LTS
   - Minimum 2GB RAM each
   - Enable private networking

2. **Install Docker on each droplet**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **Setup Firewall**
   ```bash
   # Manager node
   sudo ufw allow 2377/tcp    # Swarm management
   sudo ufw allow 7946/tcp    # Node communication
   sudo ufw allow 7946/udp
   sudo ufw allow 4789/udp    # Overlay network
   sudo ufw allow 80/tcp      # HTTP
   sudo ufw allow 443/tcp     # HTTPS
   sudo ufw enable
   
   # Worker nodes
   sudo ufw allow 7946/tcp
   sudo ufw allow 7946/udp
   sudo ufw allow 4789/udp
   sudo ufw enable
   ```

4. **Initialize Swarm and deploy**
   Follow the Docker Swarm deployment steps above.

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `POSTGRES_PASSWORD` | Database password | `secure_password_123` |
| `SPACES_ENDPOINT` | Spaces endpoint | `https://nyc3.digitaloceanspaces.com` |
| `SPACES_BUCKET` | Bucket name | `event-map-storage` |
| `SPACES_ACCESS_KEY_ID` | Access key | `DO00AAAAAAAAA` |
| `SPACES_SECRET_ACCESS_KEY` | Secret key | `secret123...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CACHE_TTL` | Cache TTL in seconds | `300` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `BACKUP_RETENTION_DAYS` | Backup retention | `30` |

## SSL/TLS Configuration

1. **Obtain SSL certificates**
   ```bash
   # Using Let's Encrypt
   sudo certbot certonly --standalone -d yourdomain.com
   ```

2. **Update Nginx configuration**
   Edit `nginx/nginx.conf` to add SSL configuration:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
       
       ssl_certificate /etc/nginx/ssl/fullchain.pem;
       ssl_certificate_key /etc/nginx/ssl/privkey.pem;
       
       # ... rest of configuration
   }
   ```

3. **Mount certificates in docker-compose.swarm.yml**
   ```yaml
   nginx:
     volumes:
       - /etc/letsencrypt/live/yourdomain.com:/etc/nginx/ssl:ro
   ```

## Monitoring Setup

1. **Access Prometheus**
   ```
   http://<MANAGER-IP>:9090
   ```

2. **Setup Grafana (optional)**
   ```bash
   docker service create \
     --name grafana \
     --publish 3001:3000 \
     --network event-map-network \
     grafana/grafana
   ```

## Backup Configuration

### Automated Backups

Backups run automatically via the backup service in docker-compose.

### Manual Backup

```bash
# Backup database
docker-compose exec postgres pg_dump -U eventmap_user eventmap > backup_$(date +%Y%m%d).sql

# Upload to Spaces
aws s3 cp backup_$(date +%Y%m%d).sql s3://event-map-storage/backups/ \
  --endpoint-url https://nyc3.digitaloceanspaces.com
```

### Restore from Backup

```bash
# Download from Spaces
aws s3 cp s3://event-map-storage/backups/backup_20240101.sql . \
  --endpoint-url https://nyc3.digitaloceanspaces.com

# Restore to database
cat backup_20240101.sql | docker-compose exec -T postgres psql -U eventmap_user eventmap
```

## CI/CD Setup

### GitHub Actions

1. **Set repository secrets**
   - Go to Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `SWARM_HOST`: Manager node IP
     - `SWARM_SSH_KEY`: SSH private key for deployment
     - `POSTGRES_PASSWORD`: Database password
     - `SPACES_ACCESS_KEY_ID`: Spaces access key
     - `SPACES_SECRET_ACCESS_KEY`: Spaces secret key

2. **Enable GitHub Container Registry**
   - Go to Settings > Actions > General
   - Enable "Read and write permissions" for GITHUB_TOKEN

3. **Trigger deployment**
   - Push to `main` branch triggers CI/CD pipeline
   - Pipeline builds, tests, and deploys automatically

## Troubleshooting

### Common Issues

**Issue: Database connection failed**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres
docker-compose logs postgres

# Verify credentials
echo $POSTGRES_PASSWORD
```

**Issue: Redis connection failed**
```bash
# Check Redis status
docker-compose ps redis
docker-compose logs redis
docker-compose exec redis redis-cli ping
```

**Issue: Service not starting in Swarm**
```bash
# Check service status
docker service ps event-map_app --no-trunc

# View service logs
docker service logs event-map_app
```

**Issue: Health check failing**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Check app logs
docker-compose logs app
```

### Performance Tuning

**Database**
- Increase connection pool size in `config/database.js`
- Add indexes for frequently queried columns
- Use EXPLAIN ANALYZE to optimize queries

**Redis**
- Adjust TTL values based on data volatility
- Monitor cache hit rates
- Consider Redis clustering for larger deployments

**Application**
- Increase replica count: `docker service scale event-map_app=5`
- Adjust resource limits in docker-compose.swarm.yml
- Enable compression for API responses (already configured)

### Logs and Debugging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app

# View Swarm service logs
docker service logs -f event-map_app

# Follow logs with grep
docker-compose logs -f | grep ERROR
```

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Database health
docker-compose exec postgres pg_isready -U eventmap_user

# Redis health
docker-compose exec redis redis-cli ping
```

## Support

For additional help:
- Check the main README.md
- Open an issue on GitHub
- Review Docker logs: `docker-compose logs`
