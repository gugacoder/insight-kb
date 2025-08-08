# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LibreChat is an enhanced ChatGPT clone with OpenAI, Google, Anthropic, and other AI models support. It features agents, tools, file handling, multimodal conversations, and more. Built with React frontend, Node.js/Express backend, and MongoDB database.

## Development Commands

### Essential Commands

```bash
# Install dependencies
npm install

# Start development servers
npm run frontend:dev   # Frontend on http://localhost:5173
npm run backend:dev    # Backend on http://localhost:8000

# Build for production
npm run frontend       # Build frontend
npm run backend       # Run production backend

# Testing
npm run test:client    # Test frontend
npm run test:api      # Test backend
npm run e2e           # Run E2E tests
npm run e2e:headed    # Run E2E tests with browser

# Linting and formatting
npm run lint          # Lint all files
npm run lint:fix      # Auto-fix lint issues
npm run format        # Format code with Prettier

# Database management
npm run create-user   # Create new user
npm run reset-password # Reset user password
npm run list-users    # List all users

# Update dependencies
npm run update:local  # Update local dependencies
```

### Bun Commands (Alternative to npm)

```bash
bun run b:api         # Run backend with Bun
bun run b:api:dev     # Run backend in watch mode
bun run b:client      # Build frontend with Bun
bun run b:client:dev  # Frontend dev server with Bun
```

## Architecture

### Workspace Structure

The project uses npm workspaces with the following packages:

- **api/** - Backend server (Express.js, MongoDB)
- **client/** - Frontend application (React, Vite)
- **packages/api** - Shared API utilities and MCP support
- **packages/client** - Shared client utilities
- **packages/data-provider** - Data fetching and state management
- **packages/data-schemas** - Shared TypeScript schemas and types

### Key Backend Components

- **api/server/** - Express server setup and route handlers
- **api/models/** - MongoDB/Mongoose models (User, Conversation, Message, Agent, etc.)
- **api/app/clients/** - AI provider client implementations (OpenAI, Anthropic, Google, etc.)
- **api/strategies/** - Authentication strategies (JWT, OAuth, LDAP, SAML)
- **api/server/services/** - Business logic services (Auth, Files, Agents, MCP, etc.)
- **api/server/routes/** - REST API endpoints organized by feature

### Key Frontend Components

- **client/src/components/** - React components organized by feature
- **client/src/hooks/** - Custom React hooks for business logic
- **client/src/store/** - Recoil state management atoms
- **client/src/data-provider/** - API client functions and React Query hooks
- **client/src/locales/** - i18n translations (30+ languages)

### Authentication & Authorization

- JWT-based authentication with refresh tokens
- Multiple auth strategies: Local, Google, GitHub, Discord, OpenID, Facebook, Apple, SAML, LDAP
- Role-based access control (RBAC) with roles stored in MongoDB
- Session management via express-session with Redis/MongoDB store options

### AI Integration Architecture

- Unified client interface for multiple AI providers
- Streaming response handling via Server-Sent Events (SSE)
- File attachments and multimodal support
- Agent system with tool calling capabilities
- Model Context Protocol (MCP) integration for external tools

### Database Schema

Key collections:
- users - User accounts and profiles
- conversations - Chat conversations
- messages - Individual messages with parent/child relationships
- agents - AI agent configurations
- assistants - OpenAI-style assistants
- files - File metadata and vector store references
- presets - Saved endpoint configurations

## Configuration

### Environment Variables

Essential variables in `.env`:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `DOMAIN_CLIENT` - Frontend URL
- `DOMAIN_SERVER` - Backend URL
- Various API keys for AI providers (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)

### librechat.yaml

Main configuration file for:
- Endpoint configurations and model settings
- Registration and authentication settings
- Interface customization
- Rate limiting and moderation
- File handling strategies (local/S3/Firebase)

## Testing Approach

- **Unit tests**: Jest for both frontend and backend
- **E2E tests**: Playwright for browser automation
- **Test commands**: Always use npm scripts defined in package.json
- Run tests before committing major changes

## Important Patterns

### API Response Format
All API endpoints return consistent JSON responses with appropriate HTTP status codes.

### Error Handling
Centralized error handling middleware with proper logging via Winston.

### File Handling
Supports multiple storage backends (local filesystem, S3, Firebase) with unified interface.

### Real-time Communication
Server-Sent Events (SSE) for streaming AI responses and real-time updates.

### State Management
- Frontend: Recoil for global state, React Query for server state
- Backend: Redis for caching and session storage

## Development Tips

1. Always check existing patterns in similar files before implementing new features
2. Use the established folder structure and naming conventions
3. Leverage existing utilities and services rather than creating duplicates
4. Test with multiple AI providers as implementations may vary
5. Consider i18n when adding new UI text - use translation keys
6. Follow the existing authentication and authorization patterns
7. Use the established logging system (Winston) for debugging