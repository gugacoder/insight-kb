# Enhanced Activity Bar and Side Panel

## Context Snapshot
```yaml
module: UI Extensions
dependencies: [Workspace Core, LibreChat Theme System, LibreChat Navigation]
patterns_used: []
code_templates: []
ui_references: []
constraints: [VSCode-style interface, Non-invasive wrapping, Theme compatibility, Responsive design]
```

## Assumptions
- LibreChat's theme system (light/dark/auto) is operational
- LibreChat's existing sidebar and navigation components are functional
- React component architecture supports wrapper patterns
- Tailwind CSS and LibreChat's styling system are available
- Responsive design patterns from LibreChat are established

## Purpose

This feature implements a VSCode-style activity bar and enhanced side panel system that provides intuitive navigation for NIC Insight workspace features while preserving all existing LibreChat functionality. It extends LibreChat's interface with a vertical activity bar for workspace tools and an enhanced collapsible side panel that accommodates both LibreChat's existing navigation and new workspace-specific components like file explorers and context management.

## Scope

### Included Capabilities
- Vertical activity bar with workspace tool icons (File Explorer, Context Manager, etc.)
- Enhanced left side panel with pinned/auto-hide display modes
- Activity bar badge system for notifications and counters
- Keyboard shortcuts for activity bar navigation
- Responsive behavior that adapts to mobile and tablet screens
- Theme integration with LibreChat's light/dark/auto mode system
- Smooth expand/collapse animations matching LibreChat's UI patterns

### Excluded from This Feature
- Right side panel modifications (Artifacts Panel remains LibreChat's responsibility)
- New toolbar items beyond workspace-specific features
- Custom theme creation beyond LibreChat's existing theme system
- Advanced workspace collaboration indicators
- Integration with external notification systems

## User Flow

### Primary Flow
1. **Initial Trigger**: User loads NIC Insight interface
2. **System Processing**: Activity bar renders with available workspace tools based on user permissions
3. **UI Display**: Activity bar appears vertically on left with workspace icons, side panel shows active tool
4. **User Interaction**: User clicks activity bar icon to switch tools or uses keyboard shortcuts
5. **Final Outcome**: Side panel updates to show selected tool (File Explorer, Context Manager, etc.)

### Success State
User sees:
- Clean vertical activity bar on the left edge with clear tool icons
- Active tool highlighted in activity bar
- Side panel displaying content for selected tool
- Smooth transitions between tools
- Proper theme integration (colors match LibreChat's current theme)

### Error Handling Flow
- **Component Load Error**: Failed tool initialization → Activity bar shows error state → User sees fallback content
- **Theme Switch Error**: Theme change fails to apply → System maintains previous theme → Activity bar remains functional
- **Responsive Layout Error**: Mobile layout issues → System falls back to mobile-optimized view → Core functionality preserved

## Data Models

### Core Data Entities
```yaml
ActivityBarItem:
  fields:
    id: string # Unique identifier for tool (e.g., "file-explorer", "context-manager")
    label: string # Display name for accessibility and tooltips
    icon: string # Icon component name or path
    order: number # Display order in activity bar
    isActive: boolean # Currently selected tool
    isVisible: boolean # Tool availability based on workspace/permissions
    badge: BadgeConfig # Optional badge configuration
  relationships:
    tool: WorkspaceTool # Associated workspace tool component
  constraints:
    - id must be unique across all activity bar items
    - order determines visual sequence in activity bar
    - only one item can be active at a time
```

### Supporting Data Structures
```yaml
BadgeConfig:
  fields:
    count: number # Numeric badge value (file count, notification count, etc.)
    type: string # 'count' | 'notification' | 'warning' | 'info'
    color: string # Theme-compatible color identifier
    isVisible: boolean # Badge display state
  validation:
    - count must be non-negative integer
    - type must be from allowed badge types
    - color must be from LibreChat theme palette

SidePanelState:
  fields:
    isExpanded: boolean # Panel expansion state
    width: number # Panel width in pixels (between min/max bounds)
    displayMode: string # 'pinned' | 'auto-hide'
    activeToolId: string # Currently active tool identifier
    tools: ActivityBarItem[] # Available tools list
  validation:
    - width must be between 200px and 800px
    - displayMode must be valid option
    - activeToolId must reference existing tool
```

## API Specification

### Endpoints
```yaml
# Note: This feature primarily uses client-side state management
# API endpoints mainly for persistence of user preferences
endpoints:
  - method: GET
    path: /api/user/ui-preferences
    purpose: Retrieve user's UI preferences including panel state
    request:
      headers: ["Authorization: Bearer token"]
    response:
      success: { sidePanelState: SidePanelState, preferences: UIPreferences }
      error: { error: string, code: string }
  
  - method: PUT
    path: /api/user/ui-preferences
    purpose: Save user's UI preferences and panel configuration
    request:
      headers: ["Authorization: Bearer token"]
      body: { sidePanelState: SidePanelState, preferences: UIPreferences }
    response:
      success: { status: "saved", preferences: UIPreferences }
      error: { error: string, code: string }
```

### Data Contracts
```yaml
UIPreferencesRequest:
  request_schema:
    sidePanelState: SidePanelState # Panel configuration
    theme: string # Current theme preference
    keyboardShortcuts: boolean # Shortcuts enabled state
  response_schema:
    success: boolean # Save operation result
    preferences: UIPreferences # Updated preferences object
  error_handling: Standard validation with field-specific error messages
```

## Technical Implementation

### Architecture Overview
**Architecture Pattern**: Wrapper Component Pattern with Context Provider
**Integration Approach**: Wrap LibreChat's existing layout without modifying core components
**Technical References**: LibreChat's theme system, navigation patterns, responsive layout utilities

### Required Components

- **Activity Bar Component**
  - **Responsibility**: Render vertical tool bar with icons, badges, and interaction handling
  - **Critical Pattern**: Controlled component pattern with external state management
  - **Must Provide**: Tool selection, keyboard navigation, badge display, tooltip integration
  - **Must Integrate With**: LibreChat's theme system, keyboard shortcut system

- **Enhanced Side Panel Wrapper**  
  - **Responsibility**: Wrap LibreChat's existing sidebar with enhanced functionality
  - **Critical Pattern**: Higher-order component (HOC) pattern to extend existing functionality
  - **Must Provide**: Collapsible behavior, width adjustment, tool content switching
  - **Must Integrate With**: LibreChat's existing Nav component, responsive layout system

- **Tool Content Manager**
  - **Responsibility**: Manage rendering and lifecycle of workspace tool components
  - **Critical Pattern**: Dynamic component loading with lazy loading support
  - **Must Provide**: Component switching, tool state management, error boundaries
  - **Must Integrate With**: Workspace Core context, file explorer, context management

- **Panel State Controller**
  - **Responsibility**: Manage panel expansion, tool selection, and user preferences
  - **Critical Pattern**: Context + Reducer pattern for complex state management
  - **Must Provide**: State persistence, keyboard shortcuts, responsive behavior
  - **Must Integrate With**: LibreChat's user preferences system, theme context

### Implementation Approach

**Foundation Requirements**:
- All components must respect LibreChat's existing theme variables and color system
- Responsive behavior must maintain LibreChat's mobile and tablet compatibility
- Keyboard navigation must follow LibreChat's accessibility patterns
- Animation and transitions must match LibreChat's UI timing and easing

**Integration Requirements**:
- Activity bar must not interfere with LibreChat's existing navigation
- Side panel enhancement must preserve all existing LibreChat sidebar functionality
- Component loading must be lazy to avoid performance impact on LibreChat startup
- Error states must gracefully degrade to LibreChat's default interface

**Quality Requirements**:
- All interactions must be accessible via keyboard and screen reader
- Panel resizing must be smooth with proper constraints (200px-800px width)
- Tool switching must complete within 150ms for responsive feel
- Badge updates must be batched to prevent excessive re-renders

## Integration Context

### System Integration Points
- **LibreChat Theme System**: Activity bar and panel colors automatically adapt to theme changes
- **LibreChat Navigation**: Enhanced side panel wraps existing Nav component without replacement
- **LibreChat Responsive System**: Components adapt to LibreChat's existing breakpoints and layout rules
- **LibreChat Keyboard Shortcuts**: Activity bar shortcuts integrate with existing shortcut system
- **LibreChat User Preferences**: Panel state persists alongside LibreChat's existing user preferences

### Cross-Feature Relationships
- **Workspace Core Integration**: Activity bar displays workspace tools when workspace is active
- **Document Intelligence**: Activity bar shows document processing status via badges
- **Context Management**: Context selection tool appears in activity bar when workspace has documents
- **Artifact Workspace**: Artifact generation status appears in activity bar badges

## Quality Standards

### Functional Quality
- Activity bar tool switching completes within 150ms
- Side panel resize operations are smooth with 60fps performance
- Badge updates reflect real-time changes without performance degradation
- Keyboard navigation covers all interactive elements with logical focus order

### Technical Quality
- Components follow LibreChat's TypeScript patterns and prop interfaces
- All state changes use immutable updates for predictable behavior
- Error boundaries prevent activity bar issues from affecting LibreChat core
- Lazy loading ensures minimal impact on LibreChat's startup performance

### Integration Quality
- Zero breaking changes to LibreChat's existing sidebar or navigation
- Theme changes apply immediately to all activity bar and panel elements
- Responsive behavior maintains LibreChat's design consistency across devices
- Accessibility features maintain LibreChat's WCAG compliance standards

## Acceptance Criteria

### Functional Acceptance
- [ ] **Core Functionality**: Activity bar displays workspace tools and responds to user interaction
- [ ] **User Experience**: Panel expansion/collapse is smooth and intuitive
- [ ] **Data Integrity**: Tool states and panel preferences persist across sessions

### Technical Acceptance
- [ ] **Performance**: Activity bar and panel operations don't impact LibreChat performance
- [ ] **Integration**: All LibreChat theme and layout features work with enhanced interface
- [ ] **Quality**: Components pass accessibility testing and keyboard navigation requirements

### System Acceptance
- [ ] **Compatibility**: Existing LibreChat users can disable activity bar if desired
- [ ] **Scalability**: Interface adapts to different workspace sizes and tool counts
- [ ] **Maintainability**: Component architecture supports easy addition of new workspace tools

## Validation Commands

```bash
# Test UI component functionality
npm run test:client -- --testNamePattern="activity.*bar"

# Check theme integration
npm run test:client -- --testNamePattern="theme.*integration"

# Validate accessibility compliance
npm run test:a11y -- --component="ActivityBar,SidePanel"

# Check responsive behavior
npm run test:responsive -- --breakpoints=all
```