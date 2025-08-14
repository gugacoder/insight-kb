---
up: ["workspace-selector"]
related: []
---

# Workspace-Based RAGE API Architecture

## Role
Act as a backend architect specializing in API design, workspace management systems, and vector database integration with ETL pipelines.

## Objective
Create a new RAGE API process that connects to Workspaces, where each workspace has its own RAGE API instance that indexes all documents within that workspace through an ETL process into a Qdrant database.

## Context
The current system has a single RAGE API endpoint that handles all requests. The new architecture requires:

- RAGE API connection to Workspace system
- Automatic RAGE API instantiation when a workspace is created
- One RAGE SPI (Service Provider Interface) per workspace
- Document indexing for each workspace through ETL process
- Data storage in Qdrant database
- Request augmentation based on workspace content
- Dynamic endpoint routing based on selected workspace
- System behavior without workspace context (no RAGE API utility)

Current limitations:
- All requests currently go through a single RAGE API endpoint
- No workspace-specific context or routing
- No per-workspace document indexing

## Instructions
Implement the following architecture changes:

1. **Workspace-RAGE API Connection**
   - Establish connection between RAGE API and Workspace system
   - Create mechanism for RAGE API instantiation upon workspace creation
   - Implement one-to-one relationship between workspace and RAGE API instance

2. **RAGE SPI Implementation**
   - Create Service Provider Interface for each workspace
   - Ensure each SPI is isolated to its workspace context
   - Handle SPI lifecycle management tied to workspace lifecycle

3. **Document Indexing and ETL Process**
   - Implement ETL pipeline for each workspace
   - Index all documents within a workspace
   - Store processed data in Qdrant vector database
   - Maintain separate vector spaces for each workspace

4. **Request Routing and Augmentation**
   - Remove single endpoint architecture
   - Implement workspace-based endpoint routing
   - Augment requests with workspace-specific content
   - Route requests to appropriate RAGE API instance based on selected workspace

5. **Workspace Selection Handling**
   - Detect current workspace selection
   - Route to appropriate RAGE API instance
   - Handle cases where no workspace is selected
   - System behavior without workspace context (bypass RAGE API)

## Notes
The transition from a single RAGE API endpoint to workspace-based endpoints represents a significant architectural shift. When no workspace is selected, the RAGE API should have no utility and the system should behave as if no context is defined. Each workspace maintains its own isolated RAGE API instance with its own ETL process and Qdrant vector space, ensuring complete data isolation between workspaces.