Here is a comprehensive table of built-in slash commands available in Claude Code, as per the official documentation:

| Command                   | Description                                                           |   |
| ------------------------- | --------------------------------------------------------------------- | - |
| `/add-dir <dir>`          | Add additional working directories                                    |   |
| `/agents`                 | Manage custom AI subagents for specialized tasks                      |   |
| `/bug`                    | Report bugs (sends conversation to Anthropic)                         |   |
| `/clear`                  | Clear conversation history                                            |   |
| `/compact [instructions]` | Compact conversation with optional focus instructions                 |   |
| `/config`                 | View/modify configuration                                             |   |
| `/cost`                   | Show token usage statistics                                           |   |
| `/doctor`                 | Checks the health of your Claude Code installation                    |   |
| `/help`                   | Get usage help                                                        |   |
| `/init`                   | Initialize project with CLAUDE.md guide                               |   |
| `/login`                  | Switch Anthropic accounts                                             |   |
| `/logout`                 | Sign out from your Anthropic account                                  |   |
| `/mcp`                    | Manage MCP server connections and OAuth authentication                |   |
| `/memory`                 | Edit CLAUDE.md memory files                                           |   |
| `/model`                  | Select or change the AI model                                         |   |
| `/permissions`            | View or update permissions                                            |   |
| `/pr_comments`            | View pull request comments                                            |   |
| `/review`                 | Request code review                                                   |   |
| `/status`                 | View account and system statuses                                      |   |
| `/terminal-setup`         | Install Shift+Enter key binding for newlines (iTerm2 and VSCode only) |   |
| `/vim`                    | Enter vim mode for alternating insert and command modes               |   |

These commands are built-in and control various aspects of Claude Code during an interactive session.&#x20;

Additionally, you can create custom slash commands:

* **Project commands**: Stored in your repository and shared with your team. Located at `.claude/commands/`.
* **Personal commands**: Available across all your projects. Located at `~/.claude/commands/`.

These custom commands allow you to define frequently-used prompts as Markdown files that Claude Code can execute.&#x20;

If you need assistance creating or managing these commands, feel free to ask!
