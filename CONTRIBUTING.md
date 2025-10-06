# Contributing to Dynamic Event Map

Thank you for your interest in contributing to Dynamic Event Map! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Dynamic-Event-Map.git
   cd Dynamic-Event-Map
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/chkaty/Dynamic-Event-Map.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
6. **Start development services**:
   ```bash
   docker-compose up -d postgres redis
   npm run dev
   ```

## Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit them (see [Commit Messages](#commit-messages))

3. **Keep your branch updated**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

4. **Run tests** before pushing:
   ```bash
   npm test
   npm run lint
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

## Coding Standards

### JavaScript

- Use ES6+ features
- Follow ESLint configuration (`.eslintrc.js`)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Example:
```javascript
// Good
async function createEvent(eventData) {
  const { title, latitude, longitude } = eventData;
  
  // Validate required fields
  if (!title || !latitude || !longitude) {
    throw new Error('Missing required fields');
  }
  
  return await db.query(
    'INSERT INTO events (title, latitude, longitude) VALUES ($1, $2, $3) RETURNING *',
    [title, latitude, longitude]
  );
}

// Bad
async function create(d) {
  return await db.query('INSERT INTO events (title, latitude, longitude) VALUES ($1, $2, $3) RETURNING *', [d.title, d.latitude, d.longitude]);
}
```

### CSS

- Use meaningful class names
- Follow BEM naming convention where appropriate
- Group related styles together
- Use CSS variables for colors and common values

### HTML

- Use semantic HTML5 elements
- Add appropriate ARIA labels
- Ensure accessibility standards
- Keep markup clean and readable

## Testing Guidelines

### Writing Tests

- Write tests for all new features
- Maintain or improve code coverage
- Use descriptive test names
- Follow the AAA pattern: Arrange, Act, Assert

### Example:
```javascript
describe('Events API', () => {
  describe('POST /api/events', () => {
    it('should create a new event with valid data', async () => {
      // Arrange
      const newEvent = {
        title: 'Test Event',
        latitude: 40.7128,
        longitude: -74.0060,
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T12:00:00Z'
      };

      // Act
      const response = await request(app)
        .post('/api/events')
        .send(newEvent);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newEvent.title);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- __tests__/api.test.js
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples:
```bash
feat(events): add filtering by date range

- Add startDate and endDate query parameters
- Update API documentation
- Add tests for date filtering

Closes #123
```

```bash
fix(cache): resolve Redis connection timeout issue

- Increase connection timeout to 5 seconds
- Add retry logic for failed connections
- Update error logging

Fixes #456
```

## Pull Request Process

1. **Update documentation** if you changed APIs or added features
2. **Add tests** for new features or bug fixes
3. **Ensure all tests pass**: `npm test`
4. **Run linter**: `npm run lint`
5. **Update CHANGELOG.md** with your changes
6. **Write a clear PR description**:
   - What changes were made
   - Why these changes were necessary
   - How to test the changes
   - Screenshots for UI changes
7. **Link related issues** using keywords (Closes #123, Fixes #456)
8. **Request review** from maintainers
9. **Address review feedback** promptly

### PR Description Template:
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
How to test the changes

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows project style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests pass
- [ ] No linting errors
```

## Bug Reports

When reporting bugs, please include:

1. **Clear title** describing the issue
2. **Steps to reproduce** the bug
3. **Expected behavior**
4. **Actual behavior**
5. **Environment details**:
   - OS and version
   - Node.js version
   - Browser (if frontend issue)
   - Docker version (if applicable)
6. **Error messages** or logs
7. **Screenshots** if applicable

### Bug Report Template:
```markdown
**Description**
A clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Node: [e.g., 18.17.0]
- Browser: [e.g., Chrome 119]

**Logs**
```
Paste error logs here
```

**Screenshots**
Add screenshots if applicable
```

## Feature Requests

When requesting features, please include:

1. **Clear title** describing the feature
2. **Problem statement**: What problem does this solve?
3. **Proposed solution**: How should it work?
4. **Alternatives considered**: Other solutions you've thought about
5. **Additional context**: Any other relevant information

### Feature Request Template:
```markdown
**Feature Description**
A clear description of the feature

**Problem**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives**
Other solutions considered

**Additional Context**
Any other relevant information
```

## Project Structure

Understanding the project structure will help you contribute effectively:

```
Dynamic-Event-Map/
├── config/              # Configuration files
│   ├── database.js      # PostgreSQL configuration
│   ├── redis.js         # Redis configuration
│   └── spaces.js        # DigitalOcean Spaces configuration
├── routes/              # API routes
│   ├── events.js        # Events endpoints
│   ├── favorites.js     # Favorites endpoints
│   └── search.js        # Search endpoints
├── utils/               # Utility functions
│   └── logger.js        # Winston logger
├── public/              # Frontend files
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── index.html
├── __tests__/           # Test files
├── scripts/             # Utility scripts
│   └── backup.sh        # Database backup script
├── monitoring/          # Monitoring configuration
│   └── prometheus.yml
├── nginx/               # Nginx configuration
│   └── nginx.conf
├── server.js            # Main application entry point
├── package.json         # Dependencies and scripts
└── docker-compose.yml   # Docker Compose configuration
```

## Development Tips

### Debugging

1. **Use the logger**:
   ```javascript
   const logger = require('./utils/logger');
   logger.info('Debug information');
   logger.error('Error details', error);
   ```

2. **Inspect database**:
   ```bash
   docker-compose exec postgres psql -U eventmap_user eventmap
   ```

3. **Check Redis cache**:
   ```bash
   docker-compose exec redis redis-cli
   KEYS *
   GET events:*
   ```

4. **View logs**:
   ```bash
   docker-compose logs -f app
   ```

### Hot Reload

The application uses nodemon for hot reload in development mode:
```bash
npm run dev
```

Changes to server files will automatically restart the server.

### Database Migrations

When making database schema changes:

1. Update `config/database.js` with new schema
2. Document the changes in PR description
3. Provide migration instructions if needed

## Questions?

If you have questions:
- Open a discussion on GitHub
- Join our community chat (if available)
- Email the maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Dynamic Event Map! 🎉
