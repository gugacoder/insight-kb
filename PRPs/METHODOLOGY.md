# PRP METHODOLOGY
An opinionated implementation of Context Engineering

**Product Requirements Prompts (PRPs)** is a context engineering methodology for autonomous application development using AI agents. The methodology transforms human specifications into structured, intermediate documentation that enables complete implementation by AI using Claude Code.

---

## Introduction

### What is PRP Methodology

PRP Methodology is a systematic approach to **context engineering** that bridges the gap between human requirements and AI implementation. Instead of traditional prompt engineering (crafting clever one-shot instructions), PRP builds comprehensive context systems that provide AI agents with everything needed to autonomously develop complete applications.

The methodology consists of five core commands that work together:
- 🎯 **generate-prp**: Transforms requirements into modular specifications
- ⚡ **execute-prp**: Implements features with full context awareness  
- 📊 **update-state**: Maps existing codebase signatures
- 🛠️ **make-scripts**: Creates development and deployment tooling
- 📝 **git-commit**: Generates standardized commit messages

### Why PRP Methodology Exists

Traditional AI development faces three critical challenges:

| **Challenge**             | **Traditional Approach**            | **PRP Solution**                      |
|---------------------------|-------------------------------------|---------------------------------------|
| **Context Loss**          | AI forgets previous decisions       | Persistent architectural blueprints   |
| **Fragmented Knowledge**  | Scattered prompts and conversations | Centralized, structured documentation |
| **Implementation Gaps**   | Manual translation of specs to code | Direct autonomous implementation      |

### Core Benefits

✅ **Complete Autonomy**: AI implements entire applications without human intervention  
✅ **Architectural Consistency**: Modular blueprints ensure coherent system design  
✅ **Context Preservation**: Critical insights crystallized for reuse  
✅ **Quality Assurance**: Built-in validation and testing workflows  
✅ **Team Scalability**: Standardized methodology for collaborative development  

---

## Philosophy

### Context Engineering Approach

PRP Methodology embodies advanced **context engineering** principles. Rather than optimizing individual prompts, it architects comprehensive information environments where AI agents operate with full situational awareness.

```
Traditional Prompt Engineering:
┌─────────────┐
│ Clever      │ → AI → Output
│ Prompt      │
└─────────────┘

PRP Context Engineering:
┌─────────────────────────────────────────┐
│ BLUEPRINT.md + STATE.md + Examples/     │
│ + TASKS.md + Feature Specs + History    │ → AI → Complete
│ + Templates + Validation Rules          │      │ Application
└─────────────────────────────────────────┘      │
                    ↑                            │
                    └─────── Feedback ───────────┘
```

### Autonomous Implementation

The methodology enables true **autonomous development** where AI agents:
- 🔍 Research best practices and security patterns
- 🏗️ Design modular architectures
- 💻 Implement complete codebases
- ✅ Validate functionality against specifications
- 🔄 Iterate until all acceptance criteria pass

### Modular Architecture Thinking

Every PRP project is conceived as **cooperating modules** with clear boundaries and responsibilities. This modular thinking ensures:
- **Scalability**: Systems grow without architectural debt
- **Maintainability**: Changes remain localized to specific modules
- **Testability**: Each module validates independently
- **Reusability**: Patterns crystallize for future projects

---

## Quick Start Guide

### Prerequisites

1. **Claude Code CLI** installed and authenticated
2. **Project directory** with PRP template structure
3. **Requirements** written in natural language

### Basic Usage Flow

**For New Projects:**
```
1. Write requirements in PROMPT.md
2. Run: claude /PRPs:generate-prp
3. Run: claude /PRPs:execute-prp  
4. Run: claude /PRPs:update-state
```

**For Existing Systems:**
```
1. Run: claude /PRPs:update-state        ← Critical first step!
2. Write requirements in PROMPT.md
3. Run: claude /PRPs:generate-prp
4. Run: claude /PRPs:execute-prp
5. Run: claude /PRPs:update-state
```

> 💡 **Pro Tip**: Always run `update-state` before modifying existing systems. This ensures `generate-prp` understands your current codebase and plans intelligent refactoring.

### Your First PRP Project

**Step 1: Setup**
```bash
# Create project from template
cp -r /prp-project-template my-awesome-app
cd my-awesome-app
```

**Step 2: Define Requirements**
```markdown
# PRPs/PROMPT.md

I want to build a task management web app with:
- User authentication
- Create, edit, delete tasks
- Task categories and priorities
- Real-time updates
- Mobile-responsive design

Target audience: Small teams (2-10 people)
Tech preferences: Modern web stack, database included
```

**Step 3: Generate & Execute**
```bash
# Generate modular specifications
claude /PRPs:generate-prp

# Implement the entire application
claude /PRPs:execute-prp

# Create development scripts
claude /PRPs:make-scripts

# Ready to run!
./run.sh
```

---

## Workflow Overview

### New Project Workflow

```
📝 PROMPT.md (User Requirements)
         │
         ▼
🎯 generate-prp
         │ Creates:
         ├─ BLUEPRINT.md (Architecture)
         ├─ Feature-*.md (Specifications)  
         └─ TASKS.md (Execution Plan)
         │
         ▼
⚡ execute-prp
         │ Implements:
         ├─ Complete codebase
         ├─ Tests & validation
         └─ Documentation
         │
         ▼
📊 update-state
         │ Generates:
         └─ STATE.md (System Map)
         │
         ▼
🛠️ make-scripts (Optional)
         │ Creates:
         ├─ run.sh (Development)
         └─ make-dist.sh (Distribution)
```

### Existing System Workflow

```
📊 update-state ←─────── Critical First Step!
         │ Scans existing code
         └─ Updates STATE.md
         │
         ▼
📝 PROMPT.md (Modification Requirements)
         │
         ▼
🎯 generate-prp
         │ Plans refactoring using:
         ├─ Current BLUEPRINT.md
         ├─ Updated STATE.md  
         └─ New requirements
         │
         ▼
⚡ execute-prp
         │ Implements changes:
         ├─ Respects existing architecture
         ├─ Maintains module boundaries
         └─ Preserves working functionality
         │
         ▼
📊 update-state
         │ Updates:
         └─ STATE.md with new signatures
```

### Command Execution Flow

#### Iterative Development Cycle
```
PROMPT.md → generate-prp → execute-prp → update-state
                ↑                               │
                └─────────── [repeat] ──────────┘
                           
                    ↓ (when needed)
                    
              make-scripts → git-commit
```

**Execution Modes Available:**

| Mode            | Command                       | Use Case                            |
|-----------------|-------------------------------|-------------------------------------|
| **Full Auto**   | `execute-prp`                 | Execute all tasks automatically     |
| **Next Task**   | `execute-prp -n`              | Execute only the next pending task  |
| **Interactive** | `execute-prp -i`              | Confirm before each task execution  |
| **Specific**    | `execute-prp "Feature Name"`  | Execute individual feature/task     |

---

## Directory Structure

### Project Template Overview

```text
/my-project
│
├── .claude/                        # Claude Code configuration
│   ├── settings.local.json         # Local Claude settings
│   │
│   └── commands/                   # PRP Methodology commands
│       ├── git-commit.md           # Standardized commit generation
│       ├── make-scripts.md         # Development tooling creation
│       │
│       └── PRPs/                   # Core methodology commands
│           ├── execute-prp.md      # Feature implementation engine
│           ├── generate-prp.md     # Specification generator  
│           └── update-state.md     # Codebase analyzer
│
└── PRPs/                           # Main workspace
    ├── METHODOLOGY.md              # This documentation
    ├── BLUEPRINT.md                # 🏗️ Conceptual architecture
    ├── PROMPT.md                   # 📝 User requirements input
    ├── STATE.md                    # 📊 Current system signatures  
    ├── TASKS.md                    # ✅ Execution task queue
    │
    ├── Features/                   # Feature generated folder
    │
    ├── Examples/                   # 💎 Crystallized knowledge
    │   ├── Code/                   # Reusable code patterns
    │   ├── Patterns/               # Architectural discoveries
    │   ├── UI/                     # Design system references
    │   └── */                      # User-provided examples
    │
    └── .metadata/                  # 📋 Generation templates
        ├── blueprint.template.md   # BLUEPRINT.md structure
        ├── feature.template.md     # Feature specification format
        └── state.template.md       # STATE.md organization
```

### Core Files Explained

#### 🏗️ BLUEPRINT.md
**The Architectural Contract** - Conceptual documentation of your system's modular architecture.

```markdown
## Module: User Authentication
### Conceptual Responsibility
Manages user identity verification and session management

### Module Boundaries  
- Owns: Login/logout flows, session tokens, password security
- Provides: User identity context to other modules
- Requires: Database connection, email service

### Integration Points
- All protected modules check authentication status
- Provides user context to business logic modules
```

> 📌 **Key Point**: BLUEPRINT.md describes **WHAT** modules exist and **WHY**, never **HOW** they're implemented. This enables `update-state` to understand architecture conceptually while `execute-prp` has complete implementation freedom.

#### 📊 STATE.md  
**The Current Reality Map** - Generated by `update-state`, this file maps existing code signatures, APIs, and data models without consuming excessive context tokens.

#### 📝 PROMPT.md
**Your Requirements Input** - Write what you want in natural language. Any level of detail works:

```markdown
# Simple Example
Build a blog with user accounts and comments.

# Detailed Example  
Create a multi-tenant SaaS application for project management with:
- Role-based permissions (admin, manager, contributor)
- Real-time collaboration features
- REST API with webhook support
- Automated backup and data export
- Integration with Slack and email notifications
- Mobile-responsive React frontend
- Node.js backend with PostgreSQL
- Deployed on AWS with auto-scaling
```

#### ✅ TASKS.md
**Execution Roadmap** - Generated by `generate-prp`, tracks implementation progress:

```markdown
## Queue
- [x] Setup Initial Project Structure  
- [-] Implement User Authentication Module
  - See feature [[Feature-Auth.md]]
- [ ] Build Task Management APIs
  - See feature [[Feature-Tasks.md]]  
- [ ] Create Frontend Components
- [?] Setup Email Notifications (failed - needs retry)
```

**Status Indicators:**
- `[ ]` = Pending
- `[-]` = Currently executing  
- `[x]` = Completed successfully
- `[?]` = Failed (requires attention)

### Examples and Templates

#### 💎 Examples/ Directory
Contains **crystallized knowledge** from two sources:

1. **User-Provided**: Your own patterns, code templates, and design references
2. **AI-Crystallized**: Critical insights discovered during `generate-prp`'s **ULTRATHINK** phase

```
Examples/
├── Code/
│   ├── auth-middleware.js          # Reusable authentication pattern
│   └── error-handling.ts           # Standard error response format
├── Patterns/  
│   ├── microservice-communication.md # Service interaction guidelines
│   └── database-migration-strategy.md # Schema evolution approach  
├── UI/
│   ├── design-system.figma         # Visual consistency guide
│   └── responsive-breakpoints.css  # Mobile-first CSS patterns
└── Security/
    └── api-rate-limiting.md        # DDoS protection implementation
```

> 🎯 **Crystallization Philosophy**: Only preserve discoveries that would cause **critical failures** if lost (security vulnerabilities, silent bugs, performance disasters). Skip common patterns that `execute-prp` can rediscover.

#### 📋 .metadata/ Templates
Standardized formats ensuring consistency across all generated documentation.

---

## Core Commands

### 🎯 generate-prp

**Transforms human requirements into autonomous implementation specifications.**

**What it does:**
1. **🔍 Research Phase**: Investigates best practices, security patterns, and architectural approaches
2. **🧠 ULTRATHINK Phase**: Deep architectural reflection on modular boundaries and system design  
3. **📋 Blueprint Creation**: Documents conceptual architecture in BLUEPRINT.md
4. **📝 Feature Generation**: Creates detailed implementation specifications (not code!)
5. **💎 Crystallization**: Preserves critical insights for reuse
6. **✅ Task Planning**: Organizes implementation roadmap in TASKS.md

**Key principle**: Generates **specifications**, never implementations. `execute-prp` handles all coding.

**Research Focus Areas:**
- Technology stack compatibility and best practices
- Security considerations and vulnerability patterns  
- Performance optimization approaches
- Common pitfalls and proven solutions
- Module architecture patterns

### ⚡ execute-prp  

**Implements features with full architectural awareness and validation.**

**Execution Modes:**

```bash
# Execute all tasks automatically
claude /PRPs:execute-prp

# Execute only the next pending task  
claude /PRPs:execute-prp -n
claude /PRPs:execute-prp --next

# Interactive mode - confirm each task
claude /PRPs:execute-prp -i  
claude /PRPs:execute-prp --interactive

# Execute specific feature or task
claude /PRPs:execute-prp "User Authentication"
claude /PRPs:execute-prp "Feature-Auth.md"
```

**Implementation Process:**
1. **Context Loading**: Reads BLUEPRINT.md, STATE.md, TASKS.md, and relevant feature specs
2. **Planning**: Creates comprehensive implementation plan using **ULTRATHINK**  
3. **Implementation**: Follows architectural guidelines while implementing features
4. **Validation**: Runs acceptance criteria tests and validation commands
5. **Iteration**: Fixes failures using error analysis and retry logic
6. **Tracking**: Updates task status in TASKS.md (`[-]` → `[x]` or `[?]`)

### 📊 update-state

**Analyzes existing codebase using BLUEPRINT.md as navigation guide.**

**Smart Analysis Strategy:**
- Uses BLUEPRINT.md to identify likely code locations for each module
- Employs targeted pattern matching instead of reading entire files
- Extracts API signatures, data models, and integration points  
- Maps discovered code to conceptual architecture modules
- Generates comprehensive STATE.md using <20% of tokens vs. full codebase scan

**When to use:**
- ✅ **Before modifying existing systems** (critical for good refactoring)
- ✅ After major implementation phases  
- ✅ When onboarding team members to existing codebase
- ✅ Before architectural changes or migrations

### 🛠️ make-scripts

**Creates intelligent development and distribution tooling.**

**Generated Scripts:**

#### `run.sh` - One-Command Development
```bash
# Handles complete development setup:
# ✅ Technology stack detection (Python, Node.js, Java, etc.)  
# ✅ Dependency installation (pip, npm, maven, etc.)
# ✅ Database initialization and migrations
# ✅ Environment variable setup  
# ✅ All services startup (frontend, backend, database)
# ✅ Cross-platform compatibility

./run.sh  # That's it! Complete development environment ready.
```

#### `make-dist.sh` - Production Distribution
**Intelligent packaging with format detection:**
- **Python**: PyInstaller executables, wheel packages, Docker images
- **Node.js**: pkg executables, npm packages, containerized distributions  
- **Java**: JAR/WAR files, GraalVM native images
- **Web Apps**: Static builds, optimized assets, deployment packages

**Interactive format selection when multiple options available.**

### 📝 git-commit

**Generates precise, standardized commit messages using conventional commits.**

**Structure:**
```
<type>(<scope>): <direct summary of change>

- [optional] bullets with key decisions or examples
```

**Common Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Example Output:**
```bash
feat(auth): add JWT token refresh mechanism

- Implemented automatic token renewal before expiration
- Added refresh token rotation for enhanced security
- Updated auth middleware to handle token refresh flow
```

---

## Advanced Usage

### Execution Modes

**Strategic Mode Selection:**

| **Scenario** | **Recommended Mode** | **Rationale** |
|--------------|---------------------|---------------|
| New project, trusted specs | `execute-prp` (full auto) | Maximum efficiency, complete automation |
| Complex refactoring | `execute-prp -i` (interactive) | Review architectural changes before implementation |  
| Learning/debugging | `execute-prp -n` (next only) | Step-through understanding of implementation |
| Production hotfix | `execute-prp "SpecificFeature"` | Targeted fix without affecting other systems |

### Custom Examples

**Providing Your Own Patterns:**

```bash
# Add your code templates
PRPs/Examples/Code/my-auth-pattern.js
PRPs/Examples/Code/database-connection.py

# Add architectural guidelines  
PRPs/Examples/Patterns/microservice-boundaries.md
PRPs/Examples/Patterns/error-handling-strategy.md

# Add design system references
PRPs/Examples/UI/component-library.figma
PRPs/Examples/UI/responsive-grid.css
```

**These examples will be automatically referenced during `generate-prp` research phase.**

### Template Customization

**Modify generation templates in `.metadata/`:**

```markdown
# .metadata/feature.template.md (customize feature specification format)
# .metadata/blueprint.template.md (customize architectural documentation)  
# .metadata/state.template.md (customize system signature mapping)
```

**Custom templates ensure consistency with your team's documentation standards.**

---

## Best Practices

### Writing Effective PROMPT.md

**✅ Good Examples:**

```markdown
# Specific but Flexible
Build a customer support ticketing system with:
- Multi-channel ticket creation (email, web form, API)
- Agent assignment and escalation workflows  
- Customer satisfaction surveys
- Reporting dashboard for managers
- Integration with existing CRM system

# Simple but Clear  
Create a URL shortener like bit.ly with analytics.

# Detailed Requirements
Develop a real-estate listing platform:
- Property search with filters (price, location, size, type)
- Agent profiles and contact management
- Virtual tour integration (360° photos/videos)
- Mortgage calculator and financing options
- Admin panel for property approval workflow
- Mobile app for iOS/Android with offline capability
```

**❌ Avoid:**
```markdown
# Too Vague
Make me a good website.

# Over-Constrained Implementation Details  
Build a React app using Redux Toolkit with RTK Query, Material-UI components,
JWT authentication stored in localStorage, Express.js backend with helmet
middleware, PostgreSQL with Sequelize ORM, deployed on AWS EC2 with nginx...
```

### Blueprint Design Principles  

**🏗️ Think Conceptually, Not Technically:**

```markdown
# ✅ Good: Conceptual Responsibilities
## Module: Order Processing
### Conceptual Responsibility  
Manages the complete order lifecycle from cart to fulfillment

### Module Boundaries
- Owns: Order validation, payment coordination, inventory reservation
- Provides: Order status updates to customer service
- Requires: Payment gateway, inventory system, shipping service

# ❌ Avoid: Implementation Details
## Module: Order Processing  
- Files: order-controller.js, order-model.js, order-routes.js
- Database: orders table with foreign keys to users and products
- Functions: createOrder(), updateOrderStatus(), calculateTotal()
```

**Key Insight**: BLUEPRINT.md is read by both humans and AI. Focus on **architectural intent** that remains stable across different implementations.

### Crystallization Guidelines

**💎 Crystallize Only Critical Insights:**

**✅ Worth Crystallizing:**
- Undocumented API quirks that cause silent failures
- Security patterns specific to your domain  
- Performance optimizations discovered through research
- Counter-intuitive solutions to complex problems

**❌ Don't Crystallize:**  
- Standard patterns (REST APIs, JWT auth, database CRUD)
- Common library usage (well-documented frameworks)
- Obvious solutions to straightforward problems

**Decision Framework:**
> *"Would NOT saving this insight cause a security vulnerability, silent production failure, or impossible-to-debug issue?"*
> 
> If **YES** → Crystallize  
> If **NO** → Let `execute-prp` rediscover it

---

## Integration Guide

### Claude Code Setup

**Installation & Authentication:**
```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code  

# Authenticate with your Anthropic account
claude auth login

# Navigate to your project directory  
cd my-prp-project

# Initialize Claude Code (creates .claude/ directory)
claude init
```

**Project Configuration:**
```bash
# Copy PRP commands to your project
cp -r /prp-project-template/.claude/commands/ .claude/

# Verify commands are available
claude /help  # Should show PRP commands
```

### MCP Server Configuration

**Extend Claude Code capabilities with Model Context Protocol servers:**

```bash
# Add filesystem operations
claude mcp add filesystem -s project --  \
    npx @modelcontextprotocol/server-filesystem $(pwd)

# Add web search capabilities  
claude mcp add brave-search -s project --  \
    npx @modelcontextprotocol/server-brave-search

# Add GitHub integration
claude mcp add github -s project --  \
    npx @modelcontextprotocol/server-github
```

**Project-wide MCP Configuration (`.mcp.json`):**
```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "."]
    },
    "brave-search": {
      "command": "npx", 
      "args": ["@modelcontextprotocol/server-brave-search"]
    }
  }
}
```

### Team Workflows

**Repository Setup:**
```bash
# Include PRP methodology in your repository
git add .claude/commands/
git add PRPs/.metadata/
git commit -m "feat(setup): add PRP methodology commands and templates"

# .gitignore additions
echo "PRPs/STATE.md" >> .gitignore        # Generated, not versioned
echo "PRPs/TASKS.md" >> .gitignore        # Generated, not versioned  
echo ".claude/settings.local.json" >> .gitignore  # Local preferences
```

**Team Development Flow:**
1. **Requirements Planning**: Team collaborates on `PROMPT.md`
2. **Architecture Review**: Review generated `BLUEPRINT.md` before implementation  
3. **Implementation Phases**: Use `execute-prp -i` for collaborative execution
4. **Knowledge Sharing**: Commit valuable discoveries to `Examples/`
5. **Documentation Sync**: Regular `update-state` runs keep `STATE.md` current

**Custom Team Commands:**
```markdown
# .claude/commands/team-review.md
# Custom slash command for team code reviews

Run comprehensive code review including:
- Security vulnerability scan
- Performance bottleneck analysis  
- Architecture compliance check against BLUEPRINT.md
- Test coverage verification
- Documentation completeness assessment

Generate summary report for team discussion.
```

---

## 🎯 Ready to Start?

The PRP Methodology transforms how you think about AI development. Instead of wrestling with prompts and managing fragmented conversations, you're architecting intelligent systems that work autonomously and consistently.

**Next Steps:**
1. **Setup**: Install Claude Code and initialize a PRP project
2. **Experiment**: Try the Quick Start Guide with a simple project  
3. **Scale**: Apply to your real development challenges
4. **Refine**: Customize templates and crystallize your own patterns

**Remember**: PRP Methodology isn't about replacing your development skills—it's about amplifying them. You remain the architect, defining requirements and making strategic decisions. The methodology ensures your architectural vision gets implemented completely and consistently, every time.

---

*PRP Methodology represents a fundamental shift from prompt crafting to context engineering, enabling truly autonomous AI development that scales with your ambitions.*