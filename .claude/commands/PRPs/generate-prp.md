# generate-prp

Generate Features from requirements with autonomous research, modular thinking, and architectural blueprint documentation.

## Arguments: $ARGUMENTS

**Default behavior (no arguments):**
- Input: `PRPs/PROMPT.md` 

**Custom files:**
Pass custom filenames as arguments if using non-standard names.

## Auto-initialization

### Check STATE.md

Load STATE.md is exists
Load BLUEPRINT.md is exists

## Generation Process

### Phase 1: RESEARCH (Autonomous Investigation)

**Objective**: Gather all technical knowledge needed for implementation.

#### System Analysis
- Load STATE.md for current system signatures
- Load BLUEPRINT.md if exists for module structure and navigation guide
- Check `PRPs/Examples/Patterns/` for existing architectural patterns
- Check `PRPs/Examples/Code/` for existing code templates and conventions
- Check `PRPs/Examples/UI/` for visual references and mockups
- Check for any other examples inside `PRPs/Examples/*/` folders
- Scan codebase for patterns and conventions in use
- Note naming conventions already established
- Identify which patterns are being followed from Examples
- Understand the established module boundaries and interfaces

#### Technical Research
Search and analyze:
- Best practices for requested features
- Library documentation and API references  
- Security considerations and patterns
- Performance optimization approaches
- Common pitfalls and solutions
- Module architecture patterns

**Time limit**: Maximum 3 minutes research phase

### Phase 2: PLANNING

*** CRITICAL CHECKPOINT - STOP ALL RESEARCH ***
*** BEGIN EXTENDED THINKING PHASE ***

**ULTRATHINK about MODULAR ARCHITECTURE:**

Consider the system as a collection of independent, cooperating modules.
Think about:
- What are the natural boundaries in this system?
- How should functionality be grouped into modules?
- What conceptual responsibilities should each module have?
- How can module dependencies be made explicit?

**ULTRATHINK about BLUEPRINT DOCUMENTATION:**

Design how you will document your modular ARCHITECTURE CONCEPTUALLY in BLUEPRINT.md:
- What are the conceptual responsibilities of each module?
- How do modules relate to each other logically?
- What are the boundaries and interfaces between modules?
- How will update-state identify these modules in ANY implementation?

Your BLUEPRINT.md should describe WHAT modules exist and WHY, not HOW they're implemented.
Think of it as an architectural diagram, not a code map.

**think step-by-step through:**
1. Module identification and conceptual boundaries
2. Module responsibilities and purposes
3. Feature assignment to modules
4. Integration points between modules
5. How to document this clearly in BLUEPRINT.md

**ULTRATHINK about REUSABLE PATTERNS:**
If you discovered something valuable during research, note it for later crystallization.
Don't create examples for the sake of creating examples.
Only preserve truly reusable discoveries.

*** END EXTENDED THINKING PHASE ***

### Phase 3: GENERATION

#### Generate Module Blueprint First

Create/Update `PRPs/BLUEPRINT.md` documenting your modular architecture CONCEPTUALLY.

**BLUEPRINT must contain:**
- Module conceptual responsibilities (WHAT each module does)
- Module boundaries (what belongs to each module)
- Module relationships (how modules connect)
- Integration points (where modules interact)

**BLUEPRINT must NOT contain:**
- Specific file names or paths
- Function or class names
- Implementation patterns
- Code-level details

The BLUEPRINT describes the ARCHITECTURE, not the IMPLEMENTATION.
update-state will use this to understand what to look for, not where to find it.

**Example of GOOD blueprint entry:**
```
## Module: Authentication

### Conceptual Responsibility
Manages user identity, sessions, and access control

### Module Boundaries
- Owns: User verification, session management
- Provides: User identity to other modules
- Requires: Database connection

### Integration Points
- All protected modules check authentication
- Provides user context to business modules
```

**Example of BAD blueprint entry (avoid this):**
```
## Module: Authentication
- Files: auth.js, login.html
- Functions: validateUser(), createSession()
- Classes: AuthManager, SessionHandler
```

#### Crystallize Important Discoveries (Only if CRITICAL)

**Before crystallizing, ask: Would NOT saving this cause:**
- Security vulnerability? 
- Performance disaster?
- Silent production failure?
- Impossible-to-debug issue?

**If NO to all → DO NOT CRYSTALLIZE**

**Examples to crystallize:**
- Undocumented API quirks that crash systems
- Counter-intuitive fixes for critical bugs
- Hidden security requirements

**Examples to SKIP:**
- Standard patterns (JWT, REST, etc)
- Common implementations
- Anything execute-prp can figure out

**If crystallization is justified:**
- Patterns → `PRPs/Examples/Patterns/`
- Code snippets → `PRPs/Examples/Code/`
- UI approaches → `PRPs/Examples/UI/`

When in doubt, DON'T. Let execute-prp be free.

#### Generate Features

Using `PRPs/.metadata/feature.template.md` as structure, generate Feature SPECIFICATIONS (not implementations).

**CRITICAL: Features are SPECIFICATIONS for execute-prp to implement, NOT source code.**

**Features MUST contain:**
- WHAT needs to be built (requirements and objectives)
- WHY it's needed (purpose and context)
- HOW it should behave (functional specifications)
- WHERE it fits in the architecture (module assignment)
- ACCEPTANCE criteria (how to validate success)

**Features MUST NOT contain:**
- Complete source code files
- Detailed implementation code
- Specific code snippets longer than 3-4 lines
- Bash commands to execute

The execute-prp command will handle ALL code generation and implementation.
Your role is to SPECIFY requirements, not write code.

#### For each Feature identified:

**Naming**: `PRPs/Features/{Clear Short Description}.md`
- Include module assignment from BLUEPRINT.md

**Content** (from template):
- Complete SPECIFICATIONS for autonomous execution
- References to relevant Examples/Patterns, Examples/Code and Examples/UI
- Technical decisions and constraints from research
- High-level approach following BLUEPRINT.md structure
- Requirements that code must satisfy
- Maximum 10k tokens total

**Example References (not implementations):**
```markdown
## Technical Approach
- Use JWT pattern from [[Examples/Patterns/auth-jwt-pattern.md]]
- Follow module structure from [[Examples/Code/module-template.ts]]
- Apply UI conventions from [[Examples/UI/design-system.md]]

## Module Assignment
This feature belongs to: [module-name] (as per BLUEPRINT.md)
```

*Note: If you discovered valuable patterns during research, save them in Examples/ for future reference. This is optional - focus on Feature specifications.*

### Phase 4: INTEGRATION

Update `PRPs/TASKS.md`.
A simple TODO like document to orient the execução.
Do not overengenerring this file.
Sort TASKs in the correct order of execution.

```markdown
## Queue
- [ ] 1. {Setup Initial Code Structure}
- [ ] N. {Implement Feature}
  - See feature {reference}
- [ ] N. {Any Other Complementary Task}
```

### Phase 5: VALIDATION

**Self-assessment checklist:**
- [ ] BLUEPRINT.md describes conceptual architecture
- [ ] Modules have clear conceptual boundaries
- [ ] Module relationships are logical, not physical
- [ ] No implementation details in BLUEPRINT
- [ ] Each Feature contains specifications (not implementations)
- [ ] Features follow BLUEPRINT.md patterns
- [ ] All PROMPT.md requirements covered
- [ ] update-state could understand module structure from any codebase

## Quality Assessment

After generating all Features, evaluate:

**Autonomous Execution Check:**
Ask yourself: "Can execute-prp implement these Features WITHOUT human intervention?"

**Confidence Score: [1-10]**

Rate the likelihood of successful autonomous implementation based on:
- Completeness of specifications in each Feature
- Clarity of requirements and constraints
- All technical decisions documented (no ambiguity)
- Dependencies and libraries clearly specified
- Error handling strategies defined
- Validation criteria executable

**If score < 7:**
Warning: "Low confidence for autonomous execution (X/10). Issues:
- [Specific ambiguities or missing context]
- [Technical decisions not resolved]
- [Missing implementation details]

Revise Features to include missing context before proceeding."

**Report to user:**
```
Generated: X Features
Examples created: Y Patterns, Z Code templates
Modules documented: [list from BLUEPRINT.md]
Autonomous execution confidence: N/10
Reason: [Why this score - what might fail?]
```

**Insert this report at the top oi the BLUEPRINT.md as an info section**

## Success Criteria

The generated artifacts should:
- BLUEPRINT.md provides clear conceptual architecture
- Features contain complete specifications
- Examples capture reusable knowledge (if any)
- Features enable automatic code generation by execute-prp
- Module boundaries are documented and maintained

## Critical Requirement

**BLUEPRINT.md is the CONCEPTUAL CONTRACT between all commands.**

The blueprint documents:
- WHAT modules exist (conceptual units)
- WHY they exist (responsibilities)
- HOW they relate (logical connections)

The blueprint does NOT document:
- WHERE files are located
- WHAT files are named
- HOW code is structured

This enables:
- update-state to understand module structure conceptually
- execute-prp to implement with complete freedom
- generate-prp to maintain architectural consistency

You have complete freedom in HOW you organize the architecture.
You MUST document that organization clearly and conceptually in BLUEPRINT.md.
ALL commands will follow this blueprint as the architectural truth.

---

Remember: You are the architect. BLUEPRINT.md is your architectural vision. Features are your specifications. execute-prp is your builder.