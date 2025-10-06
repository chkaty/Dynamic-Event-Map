const API_BASE_URL = window.location.origin;
let map;
let markers = [];
let currentUserId = 'demo-user'; // In production, this would come from authentication

// Initialize map
function initMap() {
    map = L.map('map').setView([40.7128, -74.0060], 11); // Default to NYC

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(map);

    // Add click handler to set location for new events
    map.on('click', (e) => {
        document.getElementById('eventLatitude').value = e.latlng.lat.toFixed(6);
        document.getElementById('eventLongitude').value = e.latlng.lng.toFixed(6);
    });

    loadEvents();
}

// Load events from API
async function loadEvents(filters = {}) {
    try {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE_URL}/api/events?${params}`);
        const data = await response.json();
        
        displayEventsOnMap(data.events);
        displayEventsList(data.events);
    } catch (error) {
        console.error('Error loading events:', error);
        alert('Failed to load events. Please try again.');
    }
}

// Display events on map
function displayEventsOnMap(events) {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    events.forEach(event => {
        const marker = L.marker([event.latitude, event.longitude])
            .addTo(map)
            .bindPopup(createPopupContent(event));
        
        markers.push(marker);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Create popup content for map markers
function createPopupContent(event) {
    const startTime = new Date(event.start_time).toLocaleString();
    return `
        <div class="popup-content">
            <h4>${event.title}</h4>
            ${event.category ? `<span class="category">${event.category}</span>` : ''}
            <div class="time">📅 ${startTime}</div>
            ${event.description ? `<p>${event.description.substring(0, 100)}...</p>` : ''}
            <button class="primary-btn" onclick="viewEvent(${event.id})">View Details</button>
            <button class="secondary-btn" onclick="addToFavorites(${event.id})">⭐ Add to Favorites</button>
        </div>
    `;
}

// Display events list
function displayEventsList(events) {
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';

    if (events.length === 0) {
        eventsList.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">No events found</p>';
        return;
    }

    events.forEach(event => {
        const card = createEventCard(event);
        eventsList.appendChild(card);
    });
}

// Create event card
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    const startTime = new Date(event.start_time).toLocaleString();
    const endTime = new Date(event.end_time).toLocaleString();
    
    card.innerHTML = `
        <h3>${event.title}</h3>
        ${event.category ? `<span class="category">${event.category}</span>` : ''}
        <div class="time">📅 ${startTime} - ${endTime}</div>
        ${event.organizer ? `<div class="time">👤 ${event.organizer}</div>` : ''}
        ${event.description ? `<div class="description">${event.description}</div>` : ''}
        <div class="actions">
            <button class="secondary-btn" onclick="editEvent(${event.id})">Edit</button>
            <button class="secondary-btn" onclick="deleteEvent(${event.id})">Delete</button>
            <button class="primary-btn" onclick="addToFavorites(${event.id})">⭐ Favorite</button>
        </div>
    `;
    
    return card;
}

// View event details
function viewEvent(eventId) {
    window.location.hash = `event-${eventId}`;
}

// Add event to favorites
async function addToFavorites(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, eventId })
        });

        if (response.ok) {
            alert('Event added to favorites!');
        } else {
            const error = await response.json();
            alert(error.error.message || 'Failed to add to favorites');
        }
    } catch (error) {
        console.error('Error adding to favorites:', error);
        alert('Failed to add to favorites. Please try again.');
    }
}

// View favorites
async function viewFavorites() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/favorites/${currentUserId}`);
        const events = await response.json();
        
        displayEventsOnMap(events);
        displayEventsList(events);
    } catch (error) {
        console.error('Error loading favorites:', error);
        alert('Failed to load favorites. Please try again.');
    }
}

// Search events
async function searchEvents() {
    const query = document.getElementById('searchInput').value;
    
    if (!query.trim()) {
        alert('Please enter a search term');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        displayEventsOnMap(data.events);
        displayEventsList(data.events);
    } catch (error) {
        console.error('Error searching events:', error);
        alert('Failed to search events. Please try again.');
    }
}

// Filter events
function filterEvents() {
    const category = document.getElementById('categoryFilter').value;
    const startDate = document.getElementById('startDateFilter').value;
    const endDate = document.getElementById('endDateFilter').value;

    const filters = {};
    if (category) filters.category = category;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    loadEvents(filters);
}

// Clear filters
function clearFilters() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('startDateFilter').value = '';
    document.getElementById('endDateFilter').value = '';
    document.getElementById('searchInput').value = '';
    loadEvents();
}

// Show create event modal
function showCreateEventModal() {
    document.getElementById('modalTitle').textContent = 'Create Event';
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    document.getElementById('eventModal').style.display = 'block';
}

// Edit event
async function editEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
        const event = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Edit Event';
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventCategory').value = event.category || '';
        document.getElementById('eventOrganizer').value = event.organizer || '';
        document.getElementById('eventStartTime').value = event.start_time.substring(0, 16);
        document.getElementById('eventEndTime').value = event.end_time.substring(0, 16);
        document.getElementById('eventLatitude').value = event.latitude;
        document.getElementById('eventLongitude').value = event.longitude;
        document.getElementById('eventImageUrl').value = event.image_url || '';
        
        document.getElementById('eventModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading event:', error);
        alert('Failed to load event details. Please try again.');
    }
}

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Event deleted successfully!');
            loadEvents();
        } else {
            const error = await response.json();
            alert(error.error.message || 'Failed to delete event');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
    }
}

// Submit event form
async function submitEventForm(e) {
    e.preventDefault();

    const eventId = document.getElementById('eventId').value;
    const eventData = {
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value,
        category: document.getElementById('eventCategory').value,
        organizer: document.getElementById('eventOrganizer').value,
        start_time: document.getElementById('eventStartTime').value,
        end_time: document.getElementById('eventEndTime').value,
        latitude: parseFloat(document.getElementById('eventLatitude').value),
        longitude: parseFloat(document.getElementById('eventLongitude').value),
        image_url: document.getElementById('eventImageUrl').value,
    };

    try {
        const url = eventId 
            ? `${API_BASE_URL}/api/events/${eventId}`
            : `${API_BASE_URL}/api/events`;
        
        const method = eventId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        if (response.ok) {
            alert(eventId ? 'Event updated successfully!' : 'Event created successfully!');
            document.getElementById('eventModal').style.display = 'none';
            loadEvents();
        } else {
            const error = await response.json();
            alert(error.error.message || 'Failed to save event');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Failed to save event. Please try again.');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initMap();

    document.getElementById('searchBtn').addEventListener('click', searchEvents);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchEvents();
    });

    document.getElementById('filterBtn').addEventListener('click', filterEvents);
    document.getElementById('clearBtn').addEventListener('click', clearFilters);
    document.getElementById('createEventBtn').addEventListener('click', showCreateEventModal);
    document.getElementById('viewFavoritesBtn').addEventListener('click', viewFavorites);

    document.getElementById('eventForm').addEventListener('submit', submitEventForm);
    document.getElementById('cancelBtn').addEventListener('click', () => {
        document.getElementById('eventModal').style.display = 'none';
    });

    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('eventModal').style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('eventModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
