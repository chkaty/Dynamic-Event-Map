# Quick Start Guide

Get Dynamic Event Map up and running in 5 minutes!

## 🚀 Super Quick Start (with Docker)

```bash
# Clone the repository
git clone https://github.com/chkaty/Dynamic-Event-Map.git
cd Dynamic-Event-Map

# Create environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Access the application
open http://localhost:3000
```

That's it! The application should now be running with:
- Web UI at http://localhost:3000
- API at http://localhost:3000/api
- PostgreSQL on port 5432
- Redis on port 6379
- Prometheus on port 9090

## 📋 Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- OR Node.js 18+ (for local development)

## 🔧 Development Setup

If you want to run the application locally without Docker:

```bash
# Install dependencies
npm install

# Start PostgreSQL (if not using Docker)
# Make sure PostgreSQL is running on localhost:5432

# Start Redis (if not using Docker)
# Make sure Redis is running on localhost:6379

# Run in development mode
npm run dev
```

## 🎯 First Steps

### 1. Create Your First Event

Open http://localhost:3000 in your browser and:

1. Click the "**+ Create Event**" button
2. Fill in the event details:
   - **Title**: Summer Music Festival
   - **Category**: Music
   - **Click on the map** to set the location
   - Set **start and end times**
3. Click "**Save Event**"

Your event will appear on the map! 🎉

### 2. Search for Events

1. Use the **search box** at the top to find events
2. Try searching for "music" or "festival"

### 3. Filter Events

1. Select a **category** from the dropdown
2. Choose a **date range**
3. Click "**Filter**" to see matching events

### 4. Mark Favorites

1. Click on any event marker on the map
2. Click "**⭐ Add to Favorites**"
3. View your favorites by clicking "**⭐ My Favorites**"

## 🔐 Configuration

### Essential Environment Variables

Edit your `.env` file:

```env
# Server Configuration
PORT=3000

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=eventmap
POSTGRES_USER=eventmap_user
POSTGRES_PASSWORD=change_this_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# DigitalOcean Spaces (Optional - for file uploads)
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
SPACES_BUCKET=your-bucket-name
SPACES_ACCESS_KEY_ID=your_access_key
SPACES_SECRET_ACCESS_KEY=your_secret_key
```

**Note**: For local development with Docker, use `localhost` instead of service names:
```env
POSTGRES_HOST=localhost
REDIS_HOST=localhost
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart a service
docker-compose restart app

# View running services
docker-compose ps

# Scale the application
docker-compose up -d --scale app=3
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run linter
npm run lint
```

## 📊 Monitoring

Access Prometheus metrics at:
```
http://localhost:9090
```

View application logs:
```bash
docker-compose logs -f app
```

## 🛠️ Common Tasks

### Add Sample Events

Open your browser console on http://localhost:3000 and run:

```javascript
// Create a sample event
fetch('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Central Park Concert',
    description: 'Free outdoor concert in Central Park',
    latitude: 40.7829,
    longitude: -73.9654,
    start_time: '2024-07-15T18:00:00Z',
    end_time: '2024-07-15T21:00:00Z',
    category: 'Music',
    organizer: 'NYC Parks'
  })
}).then(r => r.json()).then(console.log);
```

### View Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U eventmap_user eventmap

# View all events
SELECT * FROM events;

# View favorites
SELECT * FROM favorites;
```

### Clear Cache

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Flush all cache
FLUSHALL

# View all keys
KEYS *
```

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U eventmap_user eventmap > backup.sql

# Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U eventmap_user eventmap
```

## 🚨 Troubleshooting

### Port Already in Use

If port 3000 is already in use, change it in `.env`:
```env
PORT=3001
```

### Database Connection Error

Make sure PostgreSQL is running:
```bash
docker-compose ps postgres
docker-compose logs postgres
```

### Redis Connection Error

Make sure Redis is running:
```bash
docker-compose ps redis
docker-compose logs redis
```

### Application Won't Start

Check the logs:
```bash
docker-compose logs -f app
```

Common issues:
- Missing environment variables
- Database not ready yet (wait a few seconds and retry)
- Port conflicts

## 📖 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Explore the API endpoints at http://localhost:3000/api
- Customize the map center in `public/js/app.js`
- Add your own event categories
- Integrate authentication (user accounts)

## 💡 Tips

1. **Map Location**: Click anywhere on the map to set the event location when creating events
2. **Time Format**: Use your browser's date picker for consistent time formats
3. **Categories**: Add your own categories by editing the dropdowns in `public/index.html`
4. **Caching**: Redis caches API responses for 5 minutes by default
5. **Rate Limiting**: API is limited to 100 requests per 15 minutes per IP

## 🎨 Customization

### Change Map Center

Edit `public/js/app.js`:
```javascript
// Change from New York to San Francisco
map = L.map('map').setView([37.7749, -122.4194], 11);
```

### Add Event Categories

Edit `public/index.html` to add more categories:
```html
<option value="Networking">Networking</option>
<option value="Workshop">Workshop</option>
```

### Customize Styling

Edit `public/css/style.css` to change colors, fonts, or layout.

## 🆘 Getting Help

- Open an issue on [GitHub](https://github.com/chkaty/Dynamic-Event-Map/issues)
- Check the [full documentation](README.md)
- Review [deployment guide](DEPLOYMENT.md)

## ✅ Checklist

After setup, verify everything is working:

- [ ] Application loads at http://localhost:3000
- [ ] Health check returns "healthy" at http://localhost:3000/health
- [ ] You can create a new event
- [ ] Events appear on the map
- [ ] Search functionality works
- [ ] Filtering works
- [ ] Favorites can be added
- [ ] Database is accessible
- [ ] Redis is running
- [ ] Logs are visible with `docker-compose logs`

Congratulations! You now have a fully functional Dynamic Event Map! 🎉
