# **Dynamic Event Map**

- Yuxin Chen - 1005752419

- Tyler Sun - 1007457645

- Jiale Shang - 1006580022

---

## Problem Statement and Motivation

Have you ever had free time and wanted to hang out with friends, but struggled to find interesting events happening nearby? Many people face this challenge — event information is often scattered across different platforms or shared too late to be useful.

The Dynamic Event Crowdsourcing Map aims to address this problem by providing a centralized, interactive map that aggregates both user-posted events and publicly available event data in real-time. This platform allows users to instantly discover what’s happening around them — from concerts and street festivals to pop-up food stalls and local community gatherings.

This project is worth pursuing because it encourages community engagement, local exploration, and real-time participation. Crowdsourcing event information creates a living, constantly updated snapshot of what’s happening in the city, helping people connect, support local activities, and make spontaneous plans more easily.

The target users include:

- **Local residents** who want to explore nearby activities and discover community events.
- **Tourists and visitors** looking for authentic, real-time local experiences.
- **Event organizers or small vendors** who want a simple, free way to promote their activities and reach nearby audiences.

Existing solutions, such as event listing websites or social media pages, often require manual searches, may not show smaller, community events happening nearby, and rarely update in real time. Our project addresses these limitations by combining real-time updates, mapping, and community-driven input to create a smooth, enjoyable event discovery experience.

---

## Objective and Key Features

The Dynamic Event Map is designed as a cloud-native web application that demonstrates scalable, real-time, and stateful service orchestration using Docker Swarm on DigitalOcean.

The app allows users to pin and explore local events in real time, either from user-generated posts or public event calendar APIs.

The application includes:

- A Node.js REST API for managing events (create, read, update, delete).
- A PostgreSQL database for persistent storage of events using JSONB.
- Cloud storage for other assets (event pictures, etc.) using DigitalOcean Spaces.
- A Redis cache for storing event query results, filters/sorting data, geo indexes, etc.
- A React.js frontend with 3–4 pages:
    - Dynamic event map with event pins and a search bar
    - Event detail page (event name, time, location, description, display picture)
    - Post/Edit event page
    - Favourite events list page
- CI/CD pipelines with GitHub Actions and Docker Swarm:
    - Automated builds and deployments to DigitalOcean on main
    - Scheduled database backups to cloud storage, with recovery scripts (for database migration from cloud)
    - A scheduled ingestion pipeline for pulling data from the Toronto Festivals & Events Calendar ([https://www.toronto.ca/explore-enjoy/festivals-events/festivals-events-calendar/](https://www.toronto.ca/explore-enjoy/festivals-events/festivals-events-calendar/))
- Integration with external services:
    - Google Maps API
    - Email notifications before the start of saved events via SendGrid (if time permits)
- Orchestration approach: Docker Swarm
- Deployment provider: DigitalOcean

### Database schema and persistent storage

```sql
CREATE TABLE events (
	id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
	data         JSONB NOT NULL,           -- images, tags, cost, address, etc.
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
```

Persistent storage for the application is handled through two main components.:

- Event data is stored in PostgreSQL on a Digital Ocean Volume
- Event images and database backup snapshots are stored in DigitalOcean Spaces, providing reliable, scalable object storage for large files and archived data.

### Deployment and Monitoring setup

There will be Dockerfiles live with each service, `api`, `web`, `ingest` . During local development a `docker-compose.yml` at repo root spins up those contgainers along with `redis`, and `nginx`. On production, we will be using Docker Swarm cluster on Digital Ocean droplets to handle service replication and rolling updates.

The application health, CPU usages, and other metrics are monitored using DigitalOcean alert API [`/api.digitalocean.com/v2/monitoring/alerts`](https://api.digitalocean.com/v2/monitoring/alerts) on Node.js backend.

### Advanced Features

1. CI/CD pipeline (GitHub Actions): 
    
    Workflow: build → test → push images → deploy
    
    On `main:` branch (with environment variables managed via GitHub Actions secrets):
    
    1. Build Docker images for `api`, `web`, `ingest` services
    2. Push the images to the Docker Container Registry
    3. SSH into the Docker Swarm manager node and deploy the updated stack
2. Backup and recovery
    
    The application implements a nightly automated backup process for the PostgreSQL database using pg_dump, with all snapshots stored in DigitalOcean Spaces. Backup containers are executed as scheduled Docker Swarm jobs.
    
    A restore script is provided to redeploy a clean PostgreSQL instance and restore data from the most recent snapshot. This script can be run manually or triggered automatically by a serverless function on DigitalOcean—for example, during recovery from a power outage.
    
3. Integration with external services:
    
    A scheduled ingestion service periodically retrieves public event data from the official Toronto Festivals & Events Calendar feed. The service normalizes and deduplicates the data before inserting it into the PostgreSQL database.
    
    Additionally, the application integrates the Google Maps API for map rendering and geolocation. With user permission, it can access the user’s current location to display nearby events and enhance the real-time discovery experience. Events are visualized as interactive map pins with built-in search and filtering controls.
    

The project satisfies all core technical requirements through a fully containerized, cloud-native design. All services—including api, web, DB, Redis, and Nginx—run in Docker containers. Local development is managed with Docker Compose, while the production application runs on a Docker Swarm cluster deployed on DigitalOcean droplets. System metrics are monitored via the DigitalOcean Monitoring API, with automated email alerts for high CPU usage or downtime.

We choose to implement three advanced features: CI/CD pipeline, backup and recovery, and external service integration. If time permits, we will also implement serverless integration for DigitalOcean Functions for database recovery and notifications.

### Scope and feasibility

The Dynamic Event Map is a light frontend application with most of its complexity focused on cloud architecture, orchestration, and reliability. The primary goal is to demonstrate robust cloud deployment using Docker Swarm on DigitalOcean, ensuring a fast, scalable, and zero-downtime service rather than a feature-heavy interface.

The project is ambitious but feasible within the given timeframe by prioritizing core cloud functionalities first and implementing advanced features in stages. 

1. Core architecture setup — containerization, database schema, Docker Compose for local development, and deployment to Swarm with CI/CD automation.
2. Core app functionality — map display, event CRUD operations, caching, and monitoring integration.
3. Additional services — ingestion from the Toronto public event calendar and automated backup/recovery scripts.

By focusing on an MVP that validates all required cloud technologies (persistent storage, orchestration, monitoring, and CI/CD), the project remains technically grounded and achievable within the course timeline. Future iterations can expand the ingestion logic, add serverless recovery and notification functions, and improve frontend interactivity once the core cloud framework is fully set.

---

## Tentative Plan

The team aims to start early and maintain a consistent, proactive approach to complete the project within the next one to two months. Each member plans to dedicate sufficient time to implement all necessary features and ensure roughly equal contributions by the project’s end. An online group chat has been created for discussion, scheduling, and quick notifications if issues arise. Additionally, all members have agreed to meet at least once a week, either in person or online, to review progress and align tasks. Currently, the team plans to meet after the weekly class lecture every Friday at 5:00 pm. Code will be managed through a shared GitHub repository, with each member expected to perform clear commits and conduct reviews as needed.

After some discussion, each member has been roughly and tentatively delegated to focus on specific aspects of the application.

- **Katy (Yuxin)** will focus on frontend development, including designing the UI with React, integrating Google Maps for event search and pins, and enabling real-time updates for new events in Toronto.
- **Jiale** will lead containerization with Docker and Docker Compose, orchestration using Docker Swarm, and the implementation of a CI/CD pipeline for automation.
- **Tyler** will focus on database management with PostgreSQL, persistent storage using DigitalOcean volumes, and integration of monitoring for key system metrics.

Although each member has individual areas of focus, the team will support one another throughout the project, especially where tasks overlap. Members will collaborate and adapt any task delegation as needed over the project’s duration. The team will aim to complete all core features at least a few days before November 19 to allow for testing and debugging as well as completion of the slideshow before the presentation date. The team also hopes to implement advanced features early before the group’s designated presentation slot so they can be shown in the live demo, but ultimately aims to finish all aspects before on December 8. If issues arise which prevents the group from completing the advanced features before the project deadline, the team will include a timeline in the final submission explaining when these features will be completed, along with any partial code which was implemented before the deadline.
