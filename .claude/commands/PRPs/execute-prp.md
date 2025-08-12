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
/PRPs:execute-prp -n
/PRPs:execute-prp --next
```
Executes only the next task in `/PRPs/TASKS.md`, then stops

### Interactive Mode
```bash
/PRPs:execute-prp -i
/PRPs:execute-prp --interactive
```
Executes all tasks in `/PRPs/TASKS.md` one at a time, asking for confirmation before each task

### Individual PRP Execution
```bash
/PRPs:execute-prp "Feature Name"
/PRPs:execute-prp "Feature Name.md"
```
Executes a specific PRP located at `/PRPs/Features/{Feature Name}.md` (extension optional)

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

## Error Handling

When validation fails:

- Analyze error against PRP specifications
- Review BLUEPRINT.md for architectural compliance
- Use iterative problem-solving approach
- Retry with corrected implementation
- Maintain module boundaries during fixes

## Success Criteria

PRP execution is complete when:

- [ ] All acceptance criteria from PRP met
- [ ] All validation commands pass
- [ ] Implementation follows BLUEPRINT.md architecture
- [ ] Module boundaries respected
- [ ] Integration points properly implemented
- [ ] Tracking status updated
- [ ] Final validation suite passes
- [ ] Task status updated in TASKS.md