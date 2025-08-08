# execute-prp

Execute one o more Product Requirements Prompt (PRP) with appropriate context and process.

## Arguments: $ARGUMENTS

**Four execution modes:**

### Default Execution (No Arguments)
```bash
/PRPs:execute-prp
```
Executes all tasks in `/PRPs/TASKS.md` automatically

### Next Task Only
```bash
/PRPs:execute-prp --next
```
Executes only the next task in `/PRPs/TASKS.md`, then stops

### Interactive Mode
```bash
/PRPs:execute-prp --interactive
```
Executes all tasks in `/PRPs/TASKS.md` one at a time, asking for confirmation before each task

### Individual PRP Execution
```bash
/PRPs:execute-prp "Feature Name"
/PRPs:execute-prp "Feature Name.md"
```
Executes a specific PRP located at `/PRPs/Features/{Feature Name}.md` (extension optional)

### Auto-commit Option
```bash
/PRPs:execute-prp --auto-commit
```
Can be combined with any execution mode to automatically commit changes after each successful task completion:

```bash
/PRPs:execute-prp --interactive --auto-commit
/PRPs:execute-prp --next --auto-commit
/PRPs:execute-prp "Feature Name" --auto-commit
```

## Execution Boundaries

**YOU MUST:**
- Follow the PRP specifications exactly as written
- Implement the technical approach specified in the PRP
- Use the exact technologies, libraries, and frameworks mentioned

**YOU MUST NOT:**
- Create alternative implementations
- Simplify or modify the specified architecture
- Skip required dependencies or integrations
- Make unilateral technical decisions

**APPROVAL REQUIRED:**
- Any deviation from PRP specifications
- Any "alternative" or "simpler" approach
- Any architectural changes not explicitly specified
- Any decision to bypass complexity

## Execution Process

### 1. Context Loading

**Load system architecture:**
- Read `/PRPs/BLUEPRINT.md` for modular architecture reference
- Read `/PRPs/STATE.md` if exists for execution insights
- Read `PRPs/TASKS.md` for tasklist reference
- Read the specified PRP file if provided

**Create TASK queue**

- Queue all tasks from `TASKS.md` if no arguments are provided, or if the "Interactive Mode" parameter is used.
- Queue the next pending task from `TASKS.md` if the "Next Task Only" parameter is used.
- Queue the corresponding task from `TASKS.md` if the "Individual PRP Execution" parameter is used.
- Queue the PRP itself if the "Individual PRP Execution" parameter is used without a related task.

### 2. Tracking Management

- Iterate through the task queue, executing one task at a time.
- If "Interactive Mode" is enabled, ask for confirmation before executing each task.
- At the beginning of each task execution, mark it with a dash (`-`) in `TASKS.md` to indicate it's in progress.
  - Example: `- [-] Some task to be done`
- After a successful execution, mark the task with an `x` in `TASKS.md` to indicate completion.
  - Example: `- [x] Some task to be done`
- After a failed execution, mark the task with a question mark (`?`) in `TASKS.md` to indicate failure.
  - Example: `- [?] Some task to be done`

### 3. Planning Phase

**ULTRATHINK** before execution:

- Analyze the PRP specifications and requirements
- Reference BLUEPRINT.md for architectural guidance and module boundaries
- Create comprehensive implementation plan addressing all acceptance criteria
- **MANDATORY: If your plan deviates from PRP specifications in ANY way, STOP and request approval**
- Break down complex requirements into manageable steps
- Use TodoWrite tool to create and track implementation plan
- Identify integration points with other modules per BLUEPRINT

### 4. Implementation

- Execute the planned implementation following PRP specifications
- Reference BLUEPRINT.md for architectural decisions and module boundaries
- Implement all required functionality per PRP acceptance criteria
- Respect module responsibilities and integration points
- Follow established patterns and approaches from PRP context

### 5. Validation

- Run each validation command specified in PRP
- Execute acceptance criteria tests
- Fix any failures using iterative error handling
- Re-run validation until all tests pass
- Cross-reference implementation with PRP requirements

### 6. Completion

- Verify all acceptance criteria met
- Run final validation suite
- Update tracking status
- Report completion status with summary

### 7. Version Control (if --auto-commit specified)

**Automatic commit process:**
- Check for uncommitted changes in the repository
- Stage all modified files related to the completed task
- Create commit with standardized message format
- Commit message format: `"feat: Complete task - {task description}"`
- For failed tasks (marked with `?`): `"wip: Attempted task - {task description} (failed)"`
- Verify commit was successful
- Continue to next task in queue

**Commit behavior:**
- Only commits after successful task completion (marked with `x`)
- Skips commit if no changes detected
- Reports commit hash and summary after each commit
- Continues execution even if commit fails (with warning)

## Error Handling

When validation fails:

- Analyze error against PRP specifications
- Review BLUEPRINT.md for architectural compliance
- **If you cannot implement exactly as specified, STOP and ask for guidance**
- Use iterative problem-solving approach
- Retry with corrected implementation
- Maintain module boundaries during fixes
- **NEVER create workarounds that deviate from PRP architecture without approval**

When auto-commit fails:
- Log warning about commit failure
- Continue with task execution
- Report commit status in final summary

## Success Criteria

PRP execution is complete when:

- [ ] **ALL PRP specifications implemented exactly as written**
- [ ] All acceptance criteria from PRP met
- [ ] All validation commands pass
- [ ] Implementation follows BLUEPRINT.md architecture
- [ ] **No architectural deviations made without explicit approval**
- [ ] Module boundaries respected
- [ ] Integration points properly implemented
- [ ] Tracking status updated
- [ ] Final validation suite passes
- [ ] Task status updated in TASKS.md
- [ ] Changes committed to version control (if --auto-commit specified)