# Architecture Overview

This document provides a detailed overview of the Dynamic Event Map architecture, design decisions, and technical implementation.

## Table of Contents
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [API Design](#api-design)
- [Caching Strategy](#caching-strategy)
- [Deployment Architecture](#deployment-architecture)
- [Security Considerations](#security-considerations)
- [Scalability](#scalability)
- [Monitoring and Observability](#monitoring-and-observability)

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Web Browser │  │ Mobile Device│  │  API Clients │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer (Nginx)                   │
│                    - SSL Termination                         │
│                    - Reverse Proxy                           │
│                    - Load Distribution                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  API Server  │  │  API Server  │  │  API Server  │
│  (Node.js)   │  │  (Node.js)   │  │  (Node.js)   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐  ┌──────────┐  ┌──────────────────┐
│  PostgreSQL  │  │  Redis   │  │ DigitalOcean     │
│  (Primary DB)│  │  (Cache) │  │ Spaces (Storage) │
└──────────────┘  └──────────┘  └──────────────────┘
         │
         ▼
┌──────────────┐
│ Backup System│
│ (Automated)  │
└──────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────┐
│           Node.js Application            │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │        Express.js Router           │ │
│  │  ┌──────────┐  ┌──────────────┐   │ │
│  │  │ Events   │  │  Favorites   │   │ │
│  │  │ Routes   │  │  Routes      │   │ │
│  │  └──────────┘  └──────────────┘   │ │
│  │  ┌──────────┐                     │ │
│  │  │ Search   │                     │ │
│  │  │ Routes   │                     │ │
│  │  └──────────┘                     │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │         Middleware Layer           │ │
│  │  - CORS                            │ │
│  │  - Helmet (Security)               │ │
│  │  - Rate Limiting                   │ │
│  │  - Compression                     │ │
│  │  - Error Handling                  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │        Service Layer               │ │
│  │  ┌──────────┐  ┌──────────────┐   │ │
│  │  │ Database │  │    Redis     │   │ │
│  │  │ Service  │  │    Cache     │   │ │
│  │  └──────────┘  └──────────────┘   │ │
│  │  ┌──────────┐                     │ │
│  │  │  Spaces  │                     │ │
│  │  │ Service  │                     │ │
│  │  └──────────┘                     │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Object Storage**: DigitalOcean Spaces (S3-compatible)
- **Logging**: Winston
- **Testing**: Jest, Supertest

### Frontend
- **UI Framework**: Vanilla JavaScript (no framework dependency)
- **Mapping Library**: Leaflet.js 1.9
- **Styling**: Custom CSS with responsive design
- **Map Tiles**: OpenStreetMap

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Swarm
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus
- **CI/CD**: GitHub Actions

## Data Flow

### Event Creation Flow

```
1. User fills form → 2. Frontend validates → 3. POST /api/events
                                                      │
                                                      ▼
4. Express middleware (validation, rate limiting) ←───┘
   │
   ▼
5. Route handler receives request
   │
   ▼
6. Insert into PostgreSQL
   │
   ├─→ 7. Invalidate cache (Redis)
   │
   └─→ 8. Return event data
       │
       ▼
9. Frontend updates map and list
```

### Event Retrieval Flow (with cache)

```
1. User views map → 2. GET /api/events
                           │
                           ▼
3. Check Redis cache ──→ Cache hit? ───Yes──→ 6. Return cached data
   │                                              │
   No                                             ▼
   │                                    7. Update frontend
   ▼
4. Query PostgreSQL
   │
   ▼
5. Store in Redis cache (TTL: 5 minutes)
   │
   └──→ 6. Return data
```

### Search Flow

```
1. User enters search query
   │
   ▼
2. Frontend debounces input
   │
   ▼
3. GET /api/search?q=query
   │
   ▼
4. Check Redis cache
   │
   ├─→ Cache hit → Return results
   │
   └─→ Cache miss
       │
       ▼
5. PostgreSQL ILIKE query
   │
   ▼
6. Cache results
   │
   ▼
7. Return to frontend
   │
   ▼
8. Update map and list
```

## Database Schema

### Events Table

```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    category VARCHAR(100),
    image_url TEXT,
    organizer VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_events_location ON events(latitude, longitude);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_category ON events(category);
```

### Favorites Table

```sql
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

-- Indexes for performance
CREATE INDEX idx_favorites_user ON favorites(user_id);
```

### Relationships

```
events (1) ←─── (N) favorites
```

## API Design

### RESTful Principles

The API follows REST principles:
- Resource-based URLs
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Stateless requests
- JSON response format
- Proper status codes

### Endpoints

```
GET    /api/events              - List all events (with filters)
GET    /api/events/:id          - Get single event
POST   /api/events              - Create new event
PUT    /api/events/:id          - Update event
DELETE /api/events/:id          - Delete event

GET    /api/search              - Search events
GET    /api/search?q=query      - Search with query

GET    /api/favorites/:userId   - Get user favorites
POST   /api/favorites           - Add to favorites
DELETE /api/favorites/:userId/:eventId - Remove from favorites

GET    /health                  - Health check
```

### Response Format

Success response:
```json
{
  "id": 1,
  "title": "Event Title",
  "description": "Event description",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "start_time": "2024-01-01T10:00:00Z",
  "end_time": "2024-01-01T12:00:00Z",
  "category": "Music"
}
```

Error response:
```json
{
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

## Caching Strategy

### Cache Layers

1. **API Response Cache (Redis)**
   - TTL: 5 minutes (configurable)
   - Keys: `events:*`, `event:{id}`, `favorites:{userId}`, `search:{query}`
   - Invalidation: On CREATE, UPDATE, DELETE operations

2. **Database Connection Pool**
   - Reuses database connections
   - Max connections: 20
   - Idle timeout: 30 seconds

### Cache Invalidation

```javascript
// On event creation/update
invalidatePattern('events:*')
invalidatePattern('event:{id}')

// On favorite addition/removal
invalidatePattern('favorites:{userId}')
```

## Deployment Architecture

### Docker Swarm Topology

```
┌─────────────────────────────────────────┐
│           Manager Node                   │
│  - PostgreSQL (Primary)                  │
│  - Redis (Primary)                       │
│  - Monitoring Services                   │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │                       │
┌───────▼─────┐         ┌───────▼─────┐
│ Worker Node │         │ Worker Node │
│ - App (x2)  │         │ - App (x2)  │
│ - Nginx     │         │ - Nginx     │
└─────────────┘         └─────────────┘
```

### Service Replicas

- **API Server**: 3+ replicas (scalable)
- **Nginx**: 2 replicas
- **PostgreSQL**: 1 replica (primary)
- **Redis**: 1 replica (primary)

### Network Architecture

```
┌────────────────────────────────────────┐
│         Public Network (Internet)       │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│      Load Balancer / Firewall          │
│      - SSL Termination                 │
│      - DDoS Protection                 │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│      Nginx (Reverse Proxy)             │
│      - Health Checks                   │
│      - Load Distribution               │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│      Overlay Network (Docker)          │
│      - Internal Service Communication  │
│      - Encrypted Traffic               │
└────────────────────────────────────────┘
```

## Security Considerations

### Application Security

1. **Input Validation**
   - All user inputs validated
   - Parameterized SQL queries (SQL injection prevention)
   - Type checking and sanitization

2. **Authentication & Authorization**
   - Currently uses session-based user IDs
   - Ready for JWT integration
   - Rate limiting per IP

3. **Security Headers**
   - Helmet.js configured
   - CORS properly configured
   - CSP headers set

4. **Data Protection**
   - Environment variables for secrets
   - No sensitive data in logs
   - Secure password guidelines

### Network Security

1. **HTTPS/TLS**
   - SSL certificate support
   - TLS 1.2+ only
   - Strong cipher suites

2. **Firewall Rules**
   - Only necessary ports exposed
   - Private network for internal communication
   - IP whitelisting support

### Database Security

1. **Access Control**
   - Dedicated database user
   - Principle of least privilege
   - No root access

2. **Backup Security**
   - Encrypted backups
   - Secure storage in Spaces
   - Retention policy enforced

## Scalability

### Horizontal Scaling

The application is designed for horizontal scaling:

```
docker service scale event-map_app=10
```

### Vertical Scaling

Each service can be scaled vertically by adjusting resource limits:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1024M
```

### Database Scaling

For large-scale deployments:
- PostgreSQL read replicas
- Connection pooling
- Query optimization
- Partitioning for large tables

### Cache Scaling

For high-traffic scenarios:
- Redis Cluster
- Separate cache for different data types
- Cache warming strategies

## Monitoring and Observability

### Metrics Collection

1. **Application Metrics**
   - Request rate
   - Response time
   - Error rate
   - Active connections

2. **System Metrics**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network traffic

3. **Database Metrics**
   - Query performance
   - Connection pool usage
   - Cache hit rate
   - Slow queries

### Logging Strategy

```javascript
// Different log levels
logger.error('Error message', error);
logger.warn('Warning message');
logger.info('Info message');
logger.debug('Debug message');
```

### Health Checks

1. **Application Health**
   - `/health` endpoint
   - Returns server status
   - Checks dependencies

2. **Service Health**
   - Docker health checks
   - Automatic restart on failure
   - Dependency checks

### Alerting

Recommended alerts:
- High error rate (>5%)
- Slow response time (>2s)
- High CPU usage (>80%)
- Database connection failures
- Cache connection failures
- Disk space low (<10%)

## Performance Optimization

### Frontend Optimization

1. **Lazy Loading**
   - Map markers loaded on demand
   - Events loaded with pagination

2. **Caching**
   - Browser caching for static assets
   - API response caching

3. **Compression**
   - Gzip compression enabled
   - Minification for production

### Backend Optimization

1. **Database**
   - Proper indexing
   - Query optimization
   - Connection pooling

2. **Caching**
   - Redis for frequent queries
   - Configurable TTL
   - Cache warming

3. **API**
   - Pagination for large datasets
   - Field selection support
   - Compression enabled

## Future Enhancements

### Planned Architecture Improvements

1. **Microservices**
   - Separate event service
   - Separate user service
   - Separate notification service

2. **Real-time Features**
   - WebSocket support
   - Live event updates
   - Real-time notifications

3. **Advanced Caching**
   - CDN integration
   - Edge caching
   - Cache invalidation improvements

4. **Enhanced Monitoring**
   - Grafana dashboards
   - Custom metrics
   - Advanced alerting

5. **High Availability**
   - Multi-region deployment
   - Database replication
   - Redis Sentinel

## Conclusion

Dynamic Event Map is built with scalability, reliability, and maintainability in mind. The architecture supports both small-scale deployments and large-scale production environments, with clear paths for scaling and enhancement.
