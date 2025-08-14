# Proposals Dependency Tree

## Visual Tree Structure

```text
┌─────────────────────────────────────────────────────────────────┐
│                        FOUNDATION LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐    ┌────────────────────────┐      │
│  │ document-browser-panel  │    │ workspace-selector     │      │
│  │ (File Navigation UI)    │◄───┤ (Workspace Management) │      │
│  └────────────┬────────────┘    └───────────┬────────────┘      │
│               │                              │                  │
└───────────────┼──────────────────────────────┼──────────────────┘
                │                              │
┌───────────────┼──────────────────────────────┼─────────────────┐
│               │        INTEGRATION LAYER     │                 │
├───────────────┼──────────────────────────────┼─────────────────┤
│               ▼                              ▼                 │
│  ┌─────────────────────────┐     ┌────────────────────────┐    │
│  │ document-chat-          │     │ workspace-rage-api     │    │
│  │ integration             │     │ (Per-Workspace RAGE)   │    │
│  │ (@ mentions, # browse)  │     └───────────┬────────────┘    │
│  └─────────────────────────┘                 │                 │
│                                              │                 │
│  ┌─────────────────────────┐                 │                 │
│  │ document-upload-browser │                 │                 │
│  │ (Upload to Storage)     │                 │                 │
│  └────────────┬────────────┘                 │                 │
│               │                              │                 │
└───────────────┼──────────────────────────────┼─────────────────┘
                │                              │
┌───────────────┼──────────────────────────────┼─────────────────┐
│               │      GENERATION LAYER        │                 │
├───────────────┼──────────────────────────────┼─────────────────┤
│               ▼                              ▼                 │
│  ┌─────────────────────────┐    ┌────────────────────────┐     │
│  │ pandoc-document-        │    │ strict-expansive-modes │     │
│  │ generator               │    │ (Context Control)      │     │
│  │ (Markdown → Docs)       │    └────────────────────────┘     │
│  └─────────────────────────┘                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     AUXILIARY FEATURES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐    ┌────────────────────────┐      │
│  │ smtp-email-             │    │ web-search-support     │      │
│  │ configuration           │    │ (Internet Search)      │      │
│  │ (SMTP Auto-Discovery)   │    └────────────────────────┘      │
│  └────────────┬────────────┘                                    │
│               │                                                 │
│               ▼                                                 │
│  ┌─────────────────────────┐                                    │
│  │ email-sending-tool      │                                    │
│  │ (Send with Attachments) │                                    │
│  └─────────────────────────┘                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Dependency Relationships

### Direct Dependencies (→ depends on)

1. **document-chat-integration** → document-browser-panel
2. **document-upload-browser** → document-browser-panel, pandoc-document-generator
3. **pandoc-document-generator** → document-browser-panel (artifact box)
4. **workspace-selector** → document-browser-panel
5. **workspace-rage-api** → workspace-selector
6. **strict-expansive-modes** → workspace-rage-api (RAGE API)
7. **email-sending-tool** → smtp-email-configuration

### Bidirectional Dependencies (↔ references each other)

1. **pandoc-document-generator** ↔ **document-upload-browser**
   - Pandoc generates documents
   - Upload browser saves generated documents

### Standalone Components

1. **web-search-support** - No explicit dependencies
2. **rageapi_update** - Legacy component (being replaced by workspace-rage-api)

## Implementation Order Recommendation

Based on dependencies, implement in this order:

### Phase 1: Foundation
1. document-browser-panel
2. workspace-selector

### Phase 2: Core Integration
3. workspace-rage-api
4. document-chat-integration
5. pandoc-document-generator

### Phase 3: Extended Features
6. document-upload-browser
7. strict-expansive-modes
8. smtp-email-configuration

### Phase 4: Additional Features
9. email-sending-tool
10. web-search-support

## Key Integration Points

### Document Browser Ecosystem
- Central hub: **document-browser-panel**
- Extensions: chat integration, upload, workspace management
- All document-related features connect through this component

### Workspace System
- **workspace-selector** provides the workspace abstraction
- **workspace-rage-api** extends workspaces with dedicated RAGE instances
- **strict-expansive-modes** leverages workspace context for response control

### Email System
- **smtp-email-configuration** provides the foundation
- **email-sending-tool** consumes the configuration
- Independent from other systems but can send generated documents

### Content Generation
- **pandoc-document-generator** creates documents
- Integrates with artifact box (from document browser)
- Connects to upload system for storage