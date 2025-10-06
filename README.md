# Dynamic Event Map 🗺️

Dynamic Event Map is a cloud-native web application that lets users discover, create, and manage local events in real time on an interactive map. It aggregates user-generated and public event data, supports search, filtering, and favorites, and demonstrates scalable, reliable cloud deployment using Docker Swarm, PostgreSQL, Redis, and DigitalOcean Spaces with automated backups, monitoring, and CI/CD.

## Features ✨

### Core Functionality
- **Interactive Map**: Real-time event visualization using Leaflet.js
- **Event Management**: Create, read, update, and delete (CRUD) operations for events
- **User-Generated Content**: Users can submit and manage their own events
- **Real-Time Updates**: Events are displayed and updated in real-time on the map

### Advanced Features
- **Search**: Full-text search across event titles, descriptions, and organizers
- **Filtering**: Filter events by category, date range, and geographic location
- **Favorites**: Save favorite events for quick access
- **Caching**: Redis-powered caching for improved performance
- **Rate Limiting**: API protection against excessive requests

## Technology Stack 🛠️

### Backend
- **Node.js** with Express.js for the API server
- **PostgreSQL** for persistent data storage
- **Redis** for caching and session management
- **AWS SDK** for DigitalOcean Spaces integration

### Frontend
- **Vanilla JavaScript** for client-side interactions
- **Leaflet.js** for interactive maps
- **Responsive CSS** for mobile-friendly design

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for local development
- **Docker Swarm** for production orchestration
- **Nginx** for reverse proxy and load balancing
- **Prometheus** for monitoring

### Cloud Services
- **DigitalOcean Spaces** for file storage (S3-compatible)
- **Automated Backups** with configurable retention
- **GitHub Actions** for CI/CD pipeline

## Architecture 🏗️

```
┌─────────────┐
│   Nginx     │  ← Load Balancer / Reverse Proxy
└──────┬──────┘
       │
┌──────▼──────────────────────────┐
│  Node.js API Servers (Swarm)    │  ← Multiple replicas
└──────┬──────────────────────────┘
       │
    ┌──┴───┬─────────┬──────────┐
    │      │         │          │
┌───▼───┐ ┌▼─────┐ ┌▼──────┐  ┌▼─────────┐
│ PostgreSQL│ Redis  │ Spaces │ Prometheus│
└───────┘ └──────┘ └───────┘  └──────────┘
```

## Getting Started 🚀

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL 15+ (for local development without Docker)
- Redis 7+ (for local development without Docker)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/chkaty/Dynamic-Event-Map.git
   cd Dynamic-Event-Map
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Web UI: http://localhost:3000
   - API: http://localhost:3000/api
   - Health Check: http://localhost:3000/health

### Production Deployment with Docker Swarm

1. **Initialize Docker Swarm**
   ```bash
   docker swarm init
   ```

2. **Set environment variables**
   ```bash
   export POSTGRES_PASSWORD=your_secure_password
   export SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
   export SPACES_BUCKET=your-bucket-name
   export SPACES_ACCESS_KEY_ID=your_access_key
   export SPACES_SECRET_ACCESS_KEY=your_secret_key
   export REGISTRY_URL=ghcr.io/your-username
   export VERSION=latest
   ```

3. **Deploy the stack**
   ```bash
   docker stack deploy -c docker-compose.swarm.yml event-map
   ```

4. **Scale services**
   ```bash
   docker service scale event-map_app=5
   ```

5. **Monitor deployment**
   ```bash
   docker stack services event-map
   docker service logs event-map_app
   ```

## API Documentation 📚

### Events API

#### Get All Events
```http
GET /api/events?category=Music&startDate=2024-01-01&page=1&limit=50
```

#### Get Single Event
```http
GET /api/events/:id
```

#### Create Event
```http
POST /api/events
Content-Type: application/json

{
  "title": "Summer Music Festival",
  "description": "Annual outdoor music event",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "start_time": "2024-07-15T18:00:00Z",
  "end_time": "2024-07-15T23:00:00Z",
  "category": "Music",
  "organizer": "City Events"
}
```

#### Update Event
```http
PUT /api/events/:id
Content-Type: application/json

{
  "title": "Updated Event Title"
}
```

#### Delete Event
```http
DELETE /api/events/:id
```

### Search API

```http
GET /api/search?q=music&page=1&limit=50
```

### Favorites API

#### Get User Favorites
```http
GET /api/favorites/:userId
```

#### Add to Favorites
```http
POST /api/favorites
Content-Type: application/json

{
  "userId": "user123",
  "eventId": 1
}
```

#### Remove from Favorites
```http
DELETE /api/favorites/:userId/:eventId
```

## Configuration ⚙️

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `POSTGRES_HOST` | PostgreSQL host | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Database name | `eventmap` |
| `POSTGRES_USER` | Database user | `eventmap_user` |
| `POSTGRES_PASSWORD` | Database password | - |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `CACHE_TTL` | Cache time-to-live (seconds) | `300` |
| `SPACES_ENDPOINT` | DigitalOcean Spaces endpoint | - |
| `SPACES_BUCKET` | Storage bucket name | - |
| `SPACES_ACCESS_KEY_ID` | Spaces access key | - |
| `SPACES_SECRET_ACCESS_KEY` | Spaces secret key | - |

## Monitoring & Operations 📊

### Health Check
```bash
curl http://localhost:3000/health
```

### View Logs
```bash
# Docker Compose
docker-compose logs -f app

# Docker Swarm
docker service logs -f event-map_app
```

### Access Prometheus
```
http://localhost:9090
```

### Backup & Restore

**Automated Backups**: Configured to run daily at 2 AM, with 30-day retention.

**Manual Backup**:
```bash
docker-compose exec postgres pg_dump -U eventmap_user eventmap > backup.sql
```

**Restore**:
```bash
cat backup.sql | docker-compose exec -T postgres psql -U eventmap_user eventmap
```

## CI/CD Pipeline 🔄

The project includes a GitHub Actions workflow that:
1. **Tests**: Runs linting and unit tests
2. **Builds**: Creates Docker images
3. **Deploys**: Pushes to container registry and deploys to Docker Swarm

### Workflow Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` branch

## Development 💻

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Development Mode
```bash
npm run dev
```

## Security Considerations 🔒

- **Rate Limiting**: Prevents API abuse
- **Helmet.js**: Sets security headers
- **CORS**: Configured for cross-origin requests
- **Environment Variables**: Sensitive data stored securely
- **SQL Injection Prevention**: Parameterized queries
- **Input Validation**: All user inputs validated

## Performance Optimization ⚡

- **Redis Caching**: Reduces database load
- **Connection Pooling**: Efficient database connections
- **Compression**: Gzip compression for responses
- **Indexing**: Optimized database queries
- **Load Balancing**: Multiple app replicas with Nginx

## Scalability 📈

The application is designed for horizontal scaling:
- **Stateless API**: Scales easily with Docker Swarm
- **Distributed Caching**: Redis for shared state
- **Database Connection Pooling**: Handles multiple connections
- **Load Balancing**: Nginx distributes traffic

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the MIT License.

## Support 💬

For issues and questions, please open an issue on GitHub.

## Acknowledgments 🙏

- Leaflet.js for the interactive mapping library
- OpenStreetMap for map tiles
- The open-source community for various tools and libraries