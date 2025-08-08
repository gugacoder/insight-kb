# update-state

Analyze existing codebase using BLUEPRINT.md as navigation guide to generate STATE.md system signatures map.

## Objective

Generate a comprehensive STATE.md that maps the current system's modules, APIs, data models, and interfaces **without consuming excessive tokens** by using targeted, intelligent code exploration guided by architectural blueprints.

## Input Requirements

- **PRPs/BLUEPRINT.md** - System architectural map (required)
- **PRPs/STATE.md** - Previous state file (if exists, for incremental updates)
- **Existing codebase** - Source code to analyze

## Analysis Strategy

### Phase 1: Blueprint Navigation

**Load and Parse BLUEPRINT.md:**
- Extract module definitions and their conceptual responsibilities
- Identify technology stack and architectural patterns
- Map module boundaries and integration points
- Understand system structure (frontend/backend, microservices, etc.)

**Create Exploration Plan:**
- For each module in BLUEPRINT, determine likely code locations
- Based on technology stack, identify file patterns to search
- Map conceptual modules to potential directory structures
- Prioritize modules by integration complexity

### Phase 2: Targeted Code Exploration

**Smart Module Discovery:**
Using BLUEPRINT guidance, intelligently search for:

#### Frontend Modules (React/Vue/Angular)
- **Components**: Look for component definitions, props, state
- **Services**: API calls, business logic functions
- **Routes**: Routing definitions and navigation patterns
- **State Management**: Store definitions, actions, reducers

#### Backend Modules (Node.js/Python/Java)
- **Controllers/Routes**: API endpoint definitions
- **Models**: Database schemas, entity definitions
- **Services**: Business logic interfaces and implementations
- **Middleware**: Authentication, validation, error handling

#### Database Modules
- **Schemas**: Table/collection definitions
- **Migrations**: Schema evolution history
- **Relationships**: Foreign keys, references, joins
- **Indexes**: Performance optimization structures

**Exploration Techniques:**
1. **Pattern Matching**: Search for common patterns (export, class, function, API routes)
2. **File Type Targeting**: Focus on relevant extensions (.js, .ts, .py, .java, .sql)
3. **Directory Structure**: Navigate based on conventional patterns (/controllers, /models, /services)
4. **Import/Export Chains**: Follow dependency chains to understand interfaces
5. **Configuration Files**: Extract environment, database, API configurations
6. Use TodoWrite tool to create and track execution plan

### Phase 3: Signature Extraction

For each discovered module, extract:

#### API Endpoints
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Route Paths**: URL patterns and parameters
- **Request/Response**: Data structures, validation rules
- **Authentication**: Required permissions, middleware

#### Data Models
- **Entities**: Primary data structures
- **Fields**: Types, constraints, defaults
- **Relationships**: Associations between models
- **Validations**: Business rules encoded in models

#### Public Interfaces
- **Exported Functions**: Inter-module communication points
- **Service Classes**: Reusable business logic
- **Utility Functions**: Shared functionality
- **Event Handlers**: Async communication patterns

#### Business Rules
- **Validation Logic**: Data integrity rules
- **Workflow Constraints**: Process limitations
- **Security Policies**: Access control rules
- **Integration Rules**: External service requirements

#### Dependencies
- **Package Files**: package.json, requirements.txt, pom.xml
- **Version Constraints**: Compatibility requirements
- **External Services**: APIs, databases, message queues

### Phase 4: Intelligent Sampling

**Token Optimization Strategy:**
- **Scan First**: Use file listings and grep patterns before reading full files
- **Sample Representative Files**: Read key files that represent module patterns
- **Extract Signatures Only**: Focus on interfaces, not implementations
- **Skip Redundant Code**: Avoid similar functions, focus on unique patterns
- **Prioritize Integration Points**: Emphasize module boundaries and connections

**Sample Selection Criteria:**
- Main entry points (index files, main controllers)
- Interface definitions (types, schemas, contracts)
- Configuration files (API routes, database configs)
- Key business logic files (services, models)
- Cross-cutting concerns (auth, validation, error handling)

### Phase 5: STATE.md Generation

Using `PRPs/.metadata/state.template.md` as structure, generate STATE.md as follows:

**Structure Output by BLUEPRINT Modules:**
- Map discovered code elements to conceptual modules
- Organize signatures according to BLUEPRINT boundaries
- Identify integration points between modules
- Document system-wide configurations and dependencies

**Validation Against BLUEPRINT:**
- Ensure all BLUEPRINT modules are represented
- Flag discrepancies between BLUEPRINT and code reality
- Note missing implementations or extra code not in BLUEPRINT
- Suggest BLUEPRINT updates if architecture has evolved

## Execution Guidelines

### Efficient Exploration

**Use Progressive Discovery:**
1. **Broad Scan**: Get overview of directory structure and file types
2. **Targeted Dive**: Focus on files matching module patterns
3. **Signature Extract**: Pull interfaces, schemas, route definitions
4. **Relationship Map**: Connect modules through imports/exports

**Avoid Token Waste:**
- Don't read entire large files - extract specific patterns
- Skip test files, documentation, build artifacts
- Focus on source code that defines behavior and structure
- Use intelligent grep/search instead of sequential reading

### Smart Pattern Recognition

**Adapt to Technology Patterns:**
- **Express.js**: Look for router definitions, middleware chains
- **Django**: Search for models.py, views.py, urls.py patterns
- **React**: Find component exports, hook usage, context providers
- **Database**: Extract table definitions, stored procedures, triggers

**Cross-Reference with BLUEPRINT:**
- If BLUEPRINT mentions "Authentication Module", search for auth-related patterns
- If "User Management" is listed, look for user-related models and APIs
- Use conceptual module names as search guidance

## Success Criteria

Generated STATE.md should:

- [ ] Cover all modules defined in BLUEPRINT.md
- [ ] Accurately represent current system APIs and data models
- [ ] Identify all public interfaces between modules
- [ ] Document critical business rules and constraints
- [ ] List external dependencies with versions
- [ ] Map integration points between modules
- [ ] Use minimal tokens while maintaining completeness
- [ ] Enable generate-prp to navigate efficiently without reading full codebase

## Output Format

Generate complete STATE.md following the established template, organized by BLUEPRINT modules with comprehensive signatures that enable efficient code navigation for future generate-prp executions.

## Token Efficiency Target

Aim to generate comprehensive STATE.md using **less than 20% of tokens** that would be required for generate-prp to read the entire codebase directly.