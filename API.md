# API Reference

Complete API documentation for Dynamic Event Map.

## Base URL

```
Local Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

Currently, the API uses a simple user ID system. In production, implement JWT or session-based authentication.

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Response Header**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Response Format

All responses are in JSON format.

### Success Response
```json
{
  "id": 1,
  "title": "Event Title",
  ...
}
```

### Error Response
```json
{
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

## Endpoints

### Health Check

#### GET /health

Check if the API is running.

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2024-10-06T12:00:00.000Z"
}
```

---

## Events

### List All Events

#### GET /api/events

Get a paginated list of events with optional filtering.

**Query Parameters**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| category | string | Filter by category | No |
| startDate | string (ISO 8601) | Filter events starting after this date | No |
| endDate | string (ISO 8601) | Filter events ending before this date | No |
| minLat | number | Minimum latitude for bounding box | No |
| maxLat | number | Maximum latitude for bounding box | No |
| minLng | number | Minimum longitude for bounding box | No |
| maxLng | number | Maximum longitude for bounding box | No |
| page | integer | Page number (default: 1) | No |
| limit | integer | Results per page (default: 50, max: 100) | No |

**Example Request**
```bash
GET /api/events?category=Music&page=1&limit=10
```

**Example Response**
```json
{
  "events": [
    {
      "id": 1,
      "title": "Summer Music Festival",
      "description": "Annual outdoor music event",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "start_time": "2024-07-15T18:00:00Z",
      "end_time": "2024-07-15T23:00:00Z",
      "category": "Music",
      "image_url": "https://example.com/image.jpg",
      "organizer": "City Events",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

**Status Codes**
- `200 OK` - Success
- `500 Internal Server Error` - Server error

---

### Get Single Event

#### GET /api/events/:id

Get details of a specific event.

**Path Parameters**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| id | integer | Event ID | Yes |

**Example Request**
```bash
GET /api/events/1
```

**Example Response**
```json
{
  "id": 1,
  "title": "Summer Music Festival",
  "description": "Annual outdoor music event",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "start_time": "2024-07-15T18:00:00Z",
  "end_time": "2024-07-15T23:00:00Z",
  "category": "Music",
  "image_url": "https://example.com/image.jpg",
  "organizer": "City Events",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Status Codes**
- `200 OK` - Success
- `404 Not Found` - Event not found
- `500 Internal Server Error` - Server error

---

### Create Event

#### POST /api/events

Create a new event.

**Request Body**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| title | string | Event title | Yes |
| description | string | Event description | No |
| latitude | number | Event latitude (-90 to 90) | Yes |
| longitude | number | Event longitude (-180 to 180) | Yes |
| start_time | string (ISO 8601) | Event start time | Yes |
| end_time | string (ISO 8601) | Event end time | Yes |
| category | string | Event category | No |
| image_url | string (URL) | Event image URL | No |
| organizer | string | Event organizer name | No |

**Example Request**
```bash
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

**Example Response**
```json
{
  "id": 1,
  "title": "Summer Music Festival",
  "description": "Annual outdoor music event",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "start_time": "2024-07-15T18:00:00Z",
  "end_time": "2024-07-15T23:00:00Z",
  "category": "Music",
  "image_url": null,
  "organizer": "City Events",
  "created_at": "2024-10-06T12:00:00Z",
  "updated_at": "2024-10-06T12:00:00Z"
}
```

**Status Codes**
- `201 Created` - Event created successfully
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Server error

---

### Update Event

#### PUT /api/events/:id

Update an existing event. Only provided fields will be updated.

**Path Parameters**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| id | integer | Event ID | Yes |

**Request Body**

Same as Create Event, but all fields are optional.

**Example Request**
```bash
PUT /api/events/1
Content-Type: application/json

{
  "title": "Updated Summer Music Festival",
  "description": "Updated description"
}
```

**Example Response**
```json
{
  "id": 1,
  "title": "Updated Summer Music Festival",
  "description": "Updated description",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "start_time": "2024-07-15T18:00:00Z",
  "end_time": "2024-07-15T23:00:00Z",
  "category": "Music",
  "image_url": null,
  "organizer": "City Events",
  "created_at": "2024-10-06T12:00:00Z",
  "updated_at": "2024-10-06T13:00:00Z"
}
```

**Status Codes**
- `200 OK` - Event updated successfully
- `404 Not Found` - Event not found
- `500 Internal Server Error` - Server error

---

### Delete Event

#### DELETE /api/events/:id

Delete an event.

**Path Parameters**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| id | integer | Event ID | Yes |

**Example Request**
```bash
DELETE /api/events/1
```

**Example Response**
```json
{
  "message": "Event deleted successfully",
  "id": 1
}
```

**Status Codes**
- `200 OK` - Event deleted successfully
- `404 Not Found` - Event not found
- `500 Internal Server Error` - Server error

---

## Search

### Search Events

#### GET /api/search

Search events by title, description, or organizer.

**Query Parameters**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| q | string | Search query | Yes |
| page | integer | Page number (default: 1) | No |
| limit | integer | Results per page (default: 50, max: 100) | No |

**Example Request**
```bash
GET /api/search?q=music&page=1&limit=10
```

**Example Response**
```json
{
  "events": [
    {
      "id": 1,
      "title": "Summer Music Festival",
      "description": "Annual outdoor music event",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "start_time": "2024-07-15T18:00:00Z",
      "end_time": "2024-07-15T23:00:00Z",
      "category": "Music",
      "organizer": "City Events"
    }
  ],
  "query": "music",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

**Status Codes**
- `200 OK` - Success
- `400 Bad Request` - Missing query parameter
- `500 Internal Server Error` - Server error

---

## Favorites

### Get User Favorites

#### GET /api/favorites/:userId

Get all favorite events for a user.

**Path Parameters**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| userId | string | User ID | Yes |

**Example Request**
```bash
GET /api/favorites/user123
```

**Example Response**
```json
[
  {
    "id": 1,
    "title": "Summer Music Festival",
    "description": "Annual outdoor music event",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "start_time": "2024-07-15T18:00:00Z",
    "end_time": "2024-07-15T23:00:00Z",
    "category": "Music",
    "organizer": "City Events"
  }
]
```

**Status Codes**
- `200 OK` - Success
- `500 Internal Server Error` - Server error

---

### Add to Favorites

#### POST /api/favorites

Add an event to user's favorites.

**Request Body**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| userId | string | User ID | Yes |
| eventId | integer | Event ID | Yes |

**Example Request**
```bash
POST /api/favorites
Content-Type: application/json

{
  "userId": "user123",
  "eventId": 1
}
```

**Example Response**
```json
{
  "id": 1,
  "user_id": "user123",
  "event_id": 1,
  "created_at": "2024-10-06T12:00:00Z"
}
```

**Status Codes**
- `201 Created` - Favorite added successfully
- `400 Bad Request` - Missing userId or eventId
- `404 Not Found` - Event not found
- `500 Internal Server Error` - Server error

---

### Remove from Favorites

#### DELETE /api/favorites/:userId/:eventId

Remove an event from user's favorites.

**Path Parameters**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| userId | string | User ID | Yes |
| eventId | integer | Event ID | Yes |

**Example Request**
```bash
DELETE /api/favorites/user123/1
```

**Example Response**
```json
{
  "message": "Favorite removed successfully"
}
```

**Status Codes**
- `200 OK` - Favorite removed successfully
- `404 Not Found` - Favorite not found
- `500 Internal Server Error` - Server error

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Examples

### cURL Examples

**Create an event**
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Conference 2024",
    "description": "Annual technology conference",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "start_time": "2024-09-01T09:00:00Z",
    "end_time": "2024-09-03T17:00:00Z",
    "category": "Technology",
    "organizer": "Tech Events Inc"
  }'
```

**Search events**
```bash
curl "http://localhost:3000/api/search?q=conference&limit=5"
```

**Add to favorites**
```bash
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "eventId": 1
  }'
```

### JavaScript Fetch Examples

**Get all events**
```javascript
fetch('http://localhost:3000/api/events')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

**Create an event**
```javascript
fetch('http://localhost:3000/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'New Event',
    latitude: 40.7128,
    longitude: -74.0060,
    start_time: '2024-08-01T18:00:00Z',
    end_time: '2024-08-01T20:00:00Z'
  })
})
  .then(response => response.json())
  .then(data => console.log('Event created:', data))
  .catch(error => console.error('Error:', error));
```

### Python Requests Examples

**Get all events**
```python
import requests

response = requests.get('http://localhost:3000/api/events')
events = response.json()
print(events)
```

**Create an event**
```python
import requests

event_data = {
    'title': 'Python Meetup',
    'latitude': 40.7128,
    'longitude': -74.0060,
    'start_time': '2024-08-15T19:00:00Z',
    'end_time': '2024-08-15T21:00:00Z',
    'category': 'Technology'
}

response = requests.post(
    'http://localhost:3000/api/events',
    json=event_data
)
event = response.json()
print(f"Created event: {event['id']}")
```

---

## Webhooks (Future Feature)

Webhook support is planned for future releases to notify external systems of event changes.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for API version history and changes.

---

## Support

For API support:
- Open an issue on [GitHub](https://github.com/chkaty/Dynamic-Event-Map/issues)
- Check the [documentation](README.md)
- Review [examples](#examples)
