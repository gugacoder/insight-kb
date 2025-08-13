# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Authorization Requirement

**IMPORTANT**: Before making any code changes or modifications, you MUST:
1. Present a clear plan of what changes you intend to make
2. Ask for explicit authorization to proceed
3. Wait for user approval before executing any modifications

**EXCEPTION**: If the user has executed a specific command (e.g., /fix, /implement, etc.), follow the command's instructions without asking for additional authorization.

## Project Overview

This is **NIC Insight** (based on LibreChat), an open-source AI chat application. It's a full-stack monorepo using npm workspaces.

### Key Directories
- `/api` - Backend Node.js/Express server
- `/client` - Frontend React/Vite application  
- `/packages/*` - Shared packages (data-provider, data-schemas, api, client)
- `/PRPs` - Project documentation and planning files
- `/docs` - Additional documentation

## Essential Commands

### Development
```bash
# Run backend in development mode
npm run backend:dev

# Run frontend in development mode  
npm run frontend:dev

# Run both (in separate terminals)
npm run backend:dev & npm run frontend:dev
```

### Testing & Quality
```bash
# Run tests
npm run test:api        # API tests
npm run test:client     # Client tests
npm run e2e            # E2E tests

# Code quality
npm run lint           # ESLint
npm run format         # Prettier
```

### Build
```bash
npm run frontend       # Full frontend build
npm run build:client   # Client only
```

### User Management
```bash
npm run create-user
npm run reset-password
npm run add-balance
npm run list-users
```

## Architecture & Key Concepts

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Radix UI
- **Backend**: Node.js, Express, MongoDB (main DB), PostgreSQL (vector DB)
- **AI Providers**: Modular system supporting OpenAI, Anthropic, Google, Azure, etc.
- **Real-time**: Server-Sent Events for streaming responses
- **Search**: Meilisearch integration

### Configuration
1. **Environment**: Copy `.env.example` to `.env` and configure:
   - `MONGO_URI=mongodb://127.0.0.1:27017/LibreChat`
   - `HOST=0.0.0.0`
   - `PORT=:8000`
   - API keys for AI providers

2. **Main Config**: `librechat.yaml` - controls features, endpoints, and settings

### Customization Points
- **Theme System**: `/client/src/themes/` - CSS variables and theme configuration
- **Brand Assets**: `/client/public/assets/` - logos, favicons, icons
- **UI Components**: `/client/src/components/` - React components
- **API Routes**: `/api/server/routes/` - Express routes

### Recent Branding
The project has been customized from LibreChat to "NIC Insight" with:
- Custom purple theme (#7C3AED primary color)
- Updated logos and favicons
- Theme system implementation for easy customization

## Development Workflow

1. **Setup**:
   ```bash
   npm install
   cp .env.example .env
   # Configure .env with necessary values
   ```

2. **Database**: Ensure MongoDB is running locally

3. **Development**:
   - Backend: `npm run backend:dev` (runs on PORT from .env)
   - Frontend: `npm run frontend:dev` (proxies to backend)
   - Access at `http://localhost:8000`

## Important Notes

- This is a monorepo - always run npm commands from the root directory
- The project supports multiple AI providers through a modular endpoint system
- Authentication supports local, OAuth, LDAP, and SAML strategies
- File uploads can use S3 or Firebase storage strategies
- The theme system uses CSS variables for easy customization
- PRPs directory contains project planning and documentation files